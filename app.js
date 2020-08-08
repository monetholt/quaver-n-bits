if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
var mysql = require('./dbcon.js');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
var MemoryStore = require('memorystore')(session)
const methodOverride = require('method-override');
var bodyParser = require('body-parser');
const utils = require('./utils');


// constants
const port = process.env.PORT || 3000; //Heroku automatically assigns a port via an environmental variable. Locally will use 3000
const app = express();

// set up handlebars
app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars({
    layoutsDir: path.join(__dirname, 'views/layouts'),
    defaultLayout: 'main',
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        moment: require('helper-moment'),
        eq: (v1, v2) => { return v1 === v2; },
        inc: val => { return parseInt(val) + 1; }
    }
}));

// set up file location for static files
app.use(express.static(path.join(__dirname, 'static')));

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
//const users = [];

const initializePassport = require('./passport-config'); //setup passport for authentication
//pass passport, fn to get user by email, & fn to get user by ID
initializePassport(
    passport,
    email => {
        return new Promise(function (resolve, reject) {
            mysql.pool.query('SELECT * FROM Users WHERE Email = ? LIMIT 1', [email],
                function (err, rows, fields) {
                    if (err) {
                        //an issue with our query or some other db problem
                        reject(new Error('An unexpected error has occurred trying to find user by email.'));
                    } else if (rows.length == 0) { //user not found
                        resolve( null );
                    } else {
                        resolve( rows[0] ); //found user. send back to passport to authenticate
                    }
                }
            );
        });
    },
    id => {
        return new Promise(function (resolve, reject) {

            mysql.pool.query('SELECT * FROM Users WHERE UserKey = ? LIMIT 1', [id],
                function (err, rows, fields) {
                    if (err) {
                        //an issue with our query or some other db problem
                        reject(new Error('An unexpected error has occurred trying to find user by id.'));
                    } else if (rows.length == 0) { //user not found
                        resolve(null);
                    } else {
                        resolve(rows[0]);  //found user. User record will be available in session
                    }
                }
            );
        });
    }
);

app.use(flash());
app.use(session({
    secret: "SECRETKEY",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
        checkPeriod: 86400000 // removes expired entries every 24h
    }),
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

//Routes
app.use('/dashboard', require('./routes/ads.js'));

app.get('/create-profile',utils.checkAuthenticated,(req,res) => {
    mysql.pool.query("CALL GetInstrumentsLevels()", [], (error, rows) => {
        if(error) {
            res.write(JSON.stringify(error));
            res.end();
        }
        res.render('create-profile', { user: req.user, instruments: rows[0], levels: rows[1] });
    });
});

// FIXME: This route will need to get all the users that match the ad criteria.
app.get('/search-results', utils.checkAuthenticated, function(req, res, next) {
    // Do some sort of awful select with joins, then render (nav bar needs the user's profile to render):
    res.render('search-results', { profile: true });
});

//any page requiring NOT authentication needs to run checkNotAuthenticated first
//landing page does not need authentication, in fact we do not allow logged in users to access
app.get('/', utils.checkNotAuthenticated, function (req, res, next) {
    res.render('landing', { successRegistration: req.flash('successRegistration'), errorRegistration: req.flash('errorRegistration')});
});

//passport.js will handle login page
app.post('/login', utils.checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/',
    failureFlash: true
}));

app.post('/register', utils.checkNotAuthenticated, async function (req, res) {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10); //encrypt the password entered by the user

        //add user to database
        mysql.pool.query('SELECT UserKey FROM Users WHERE Email = ? LIMIT 1', [req.body.email], function (err, rows, fields) {

            if (err) {
                //an issue with our query or some other db problem
                req.flash('errorRegistration', 'An unexpected error has occurred');
                res.redirect('/');
            } else if (rows.length > 0) {
                req.flash('errorRegistration', 'A user with this email already exists');
                res.redirect('/');
            } else {
                mysql.pool.query("CALL CreateUser(?, ?, ?, ?)",
                    [req.body.firstname, req.body.lastname, req.body.email, hashedPassword],

                    function (err, result) {
                        if (err) {
                            req.flash('errorRegistration', 'An unexpected error occurred while creating new user account');
                            res.redirect('/');
                        } else {
                            req.flash('successRegistration', 'Registration successful! Please login to continue');
                            res.redirect('/'); //Successfully added user. redirect back to landing page with success msg
                        }
                    })
            }
        });
    } catch(e) {
        res.redirect('/register?message=An unexpected error has occurred'); //there was an issue hashing the password. redirect
    }
});

app.delete('/logout', (req, res) => {
    req.logOut();
    res.redirect('/'); //on logout, redirect to landing page
});

app.get('/profile',utils.checkAuthenticated,(req,res,next) => {
    try {
        mysql.pool.query('CALL GetProfile(?)', [req.user.UserKey], function(err, rows) {
            if(err) {
                throw(err);
            } else if(rows.length > 0) {
                let context = {
                    user: req.user,
                    profile: rows[0][0],
                    profileInstruments: rows[1],
                    workSamples: {
                        music: rows[2].filter(sample => sample.SampleType === "Music"),
                        video: rows[2].filter(sample => sample.SampleType === "Video"),
                    }
                };

                utils.getInstrumentsAndLevels(req, res, context, complete);

                function complete() {
                    res.render('profile', context);
                }
            } else {
                throw(new ReferenceError("No profile found"));
            }
        });
    } catch (err) {
        res.redirect(utils.errorRedirect('/profile', 'An unexpected error occurred retrieving your profile'));
    }
});

// saves the info that is located in the Profiles header and returns true if update was successful
app.put('/profile/header', utils.checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'UPDATE Profiles SET ZipCode = ?, ArtistName = ?, LastUpdated = NOW(), LookingForWork = ? WHERE UserID = ?',
            [req.body.zipCode, req.body.artistName, (req.body.privacySwitch), req.user.UserKey],
            function(err, result) {
                if(err) {
                    throw (err);
                } else if (result.affectedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No profile found"))
                }
            });
    } catch (err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

// saves the info that is located in the Profiles about/bio and returns true if update was successful
app.put('/profile/about', utils.checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'UPDATE Profiles SET Bio = ?, LastUpdated = NOW() WHERE UserID = ?',
            [req.body.bio, req.user.UserKey],
            function(err, result) {
                if(err) {
                    throw(err);
                } else if(result.affectedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No profile found"))
                }
            });
    } catch (err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

// saves the info that is located in the Profiles website/social section and returns true if update was successful
app.put('/profile/website', utils.checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'UPDATE Profiles SET Website = ?, LastUpdated = NOW() WHERE UserID = ?',
            [req.body.website, req.user.UserKey],
            function(err, result) {
                if(err) {
                    throw (err);
                } else if (result.affectedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No profile found"))
                }
            });
    } catch (err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

//updates the profile instruments. Called from within the profile view page.
app.post('/profile/instruments', utils.checkAuthenticated, (req, res, next) => {
    try {
        mysql.pool.getConnection(function (err, conn) {
            if (err) throw (err);

            var profileKey = req.body["id"];

            //delete current instruments
            conn.query(`DELETE FROM ProfileInstruments WHERE ProfileID = ? `, [profileKey],
                function (err, rows) {

                    if (err) {
                        conn.release();
                        res.write({ message: 'An error occurred when updating your instruments: '.JSON.stringify(err) });
                        res.end();
                    } else {

                        //first format instrument/levelIDs sent in with form
                        var instruments = [];

                        var timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); //timestamp for create/lastupdated
                        for (i = 0; i <= 20; i++) { //set arbitary max of 20 instruments for now

                            if (Object.prototype.hasOwnProperty.call(req.body, "instruments[" + i + "][InstrumentKey]") &&
                                req.body["instruments[" + i + "][InstrumentKey]"] > 0) {

                                instruments.push([
                                    req.body["instruments[" + i + "][InstrumentKey]"],
                                    req.body["instruments[" + i + "][LevelKey]"],
                                    profileKey, timestamp, timestamp]);

                            }
                            else break;
                        }

                        ////add the instruments
                        conn.query(`INSERT INTO ProfileInstruments (InstrumentID, LevelID, ProfileID, CreateDate, LastUpdated)  VALUES ?  `, [instruments],
                            function (err, rows) {
                                conn.release();

                                if (err) {
                                    res.write({ message: 'An error occurred when updating your instruments: '.JSON.stringify(err) });
                                    res.end();
                                } else res.send({ success: 1, message: 'Successfully updated instruments.' });

                            });
                    }
                });

        });
    } catch (err) {
        res.write(JSON.stringify(err));
        res.end();
    }
});

app.delete('/profile/worksamples/music',utils.checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query('DELETE FROM WorkSamples WHERE ProfileID=? AND SampleKey=? AND SampleType="Music"',
            [req.session.ProfileID, req.body.sampleKey],
            function (err, result) {
                if(err) {
                    throw(err);
                } else if(result.affectedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No profile found"));
                }
            });
    } catch(err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

app.put('/profile/worksamples/music',utils.checkAuthenticated,(req, res, next) => {
   try {
       mysql.pool.query('UPDATE WorkSamples SET SampleLocation=? WHERE SampleKey=? AND ProfileID=? AND SampleType="Music"',
           [req.body.workSampleTextInput, req.body.id, req.session.ProfileID],
           function (err, result) {
                if(err) {
                    throw (err);
                } else if (result.affectedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No profile found"));
                }
       });
   } catch(err) {
       res.redirect(utils.profileUpdateErrorRedirect());
   }
});

app.post('/profile/worksamples/music',utils.checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query('INSERT INTO WorkSamples (ProfileID, SampleLocation, SampleType) VALUES (?, ?, "Music")',
            [req.session.ProfileID, req.body.workSampleTextInput],
            function (err, result) {
               if(err) {
                   throw(err);
               } else if(result.affectedRows === 1) {
                   res.send(true);
               } else {
                   throw(new ReferenceError("No profile found"));
               }
        });
    } catch(err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

app.delete('/profile/worksamples/video',utils.checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query('DELETE FROM WorkSamples WHERE ProfileID=? AND SampleKey=? AND SampleType="Video"',
            [req.session.ProfileID, req.body.sampleKey],
            function (err, result) {
                if(err) {
                    throw(err);
                } else if(result.affectedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No profile found"));
                }
            });
    } catch(err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

app.put('/profile/worksamples/video',utils.checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query('UPDATE WorkSamples SET SampleLocation=? WHERE SampleKey=? AND SampleType="Video"',
            [req.body.workSampleTextInput, req.body.id],
            function (err, result) {
                if(err) {
                    throw (err);
                } else if (result.affectedRows === 1) {
                    res.send(true);
                } else {
                    console.log(result);
                }
            });
    } catch(err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

app.post('/profile/worksamples/video',utils.checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query('INSERT INTO WorkSamples (ProfileID, SampleLocation, SampleType) VALUES (?, ?, "Video")',
            [req.session.ProfileID, req.body.workSampleTextInput],
            function (err, result) {
                if(err) {
                    throw(err);
                } else if(result.affectedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No profile found"));
                }
            });
    } catch(err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

// saves the info that is located in the Profiles table and returns true if the update was successful
app.post('/profile/basic',utils.checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'UPDATE Profiles SET ZipCode = ?, Phone = ?, Website = ?, LookingForWork = ?, ArtistName = ?, LastUpdated = NOW() WHERE UserID = ?',
            [req.body.zipCode, req.body.phoneNumber, req.body.webAddress, req.body.lookingForWork, req.body.ArtistName, req.user.UserKey],
            function(err, result) {
                if(err) {
                    throw (err);
                } else if (result.affectedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No profile found"))
                }
            });
    } catch (err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

app.post('/profile/basic/create', utils.checkAuthenticated, (req, res, next) => {
    try {
        mysql.pool.getConnection(function (err, conn) {
            if (err) throw (err);

            var worksampleurl = req.body.WorkSample;

            //create the profile
            conn.query(
                'UPDATE Profiles SET ZipCode = ?, Phone = ?, Website = ?, LookingForWork = ?, ArtistName = ?, Bio = ?, LastUpdated = NOW() WHERE UserID = ?',
                [req.body.zipCode, req.body.phoneNumber, req.body.webAddress, req.body.lookingForWork, req.body.ArtistName, req.body.Bio, req.user.UserKey],
                function (err, rows) {
                    if (err) {
                        conn.release();
                        throw (err);
                    }
                    else if (rows.affectedRows === 1) //now that profile is created, add instruments
                    {
                        var profileKey = req.session.ProfileID
                        //first format instrument/levelIDs sent in with form
                        var instruments = [];

                        var timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); //timestamp for create/lastupdated
                        for (i = 0; i <= 20; i++) { //set arbitary max of 20 instruments for now

                            if (Object.prototype.hasOwnProperty.call(req.body, "InstrumentID-" + i) && req.body["InstrumentID-" + i] > 0) {
                                instruments.push([req.body["InstrumentID-" + i], req.body["LevelID-" + i], profileKey, timestamp, timestamp]);
                            }
                            else break;
                        }

                        //add the instruments
                        conn.query(`INSERT INTO ProfileInstruments (InstrumentID, LevelID, ProfileID, CreateDate, LastUpdated)  VALUES ?  `, [instruments],
                            function (err, rows) {

                                if (err) {
                                    conn.release();
                                    throw (err);
                                }
                                else
                                {
                                    if (worksampleurl && worksampleurl != "") //if user added a work sample, go add it
                                    {
                                        conn.query('INSERT INTO WorkSamples SET ProfileID = ?, SampleLocation = ?, SampleType = ?', [profileKey, worksampleurl, req.body.SampleType],
                                            function (err, rows) {
                                                conn.release();

                                                if (err) throw (err);
                                                else res.redirect('/dashboard'); //otherwise send em to the dashboard
                                            });
                                    }
                                    else {
                                        conn.release();
                                        res.redirect('/dashboard'); //otherwise send em to the dashboard
                                    }
                                }
                            });

                    }
                    else {
                        conn.release();
                        throw (new ReferenceError("No profile created"));
                    }
                });
        });
    } catch (err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

app.get('/profile/instruments',utils.checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'SELECT InstrumentKey, Instrument, SearchTerm FROM InstrumentLookup',
            [],
            function(err, rows) {
                if(err) {
                    throw(err);
                } else if(rows.length > 0) {
                    res.send(rows);
                } else {
                    res.send(null);
                }
            });
    } catch(err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

app.get('/profile/levels',utils.checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'SELECT LevelKey, Level FROM LevelLookup',
            [],
            function(err, rows) {
                if(err) {
                    throw(err);
                } else if(rows.length > 0) {
                    res.send(rows);
                } else {
                    res.send(null);
                }
            });
    } catch(err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

// inserts an instrument and associated level and returns true if the insert was successful
app.post('/profile/instrument/add', utils.checkAuthenticated, (req, res, next) => {
    try {
        mysql.pool.query(
            'INSERT INTO ProfileInstruments (ProfileID, InstrumentID, LevelID, CreateDate) VALUES (?, ?, ?, NOW())',
            [req.body.ProfileKey, req.body.instrumentId, req.body.levelId],
            function (err, result) {
                if (err) {
                    throw (err);
                } else if (result.affectedRows === 1) {
                    res.send(true);
                } else {
                    throw (new ReferenceError("Must save profile before adding instruments."));
                }
            });
    } catch (err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

app.get('/profile/worksamples', utils.checkAuthenticated, (req, res, next) => {
    try {
        mysql.pool.query(
            'SELECT ProfileKey FROM Profiles WHERE UserID = ?',
            [req.user.UserKey],
            function(err, rows) {
                if(err) {
                    throw(err);
                } else {
                    let profileKey = rows[0]['ProfileKey'];
                    mysql.pool.query(
                    'SELECT SampleKey, SampleLocation FROM WorkSamples WHERE ProfileID = ?',
                    [profileKey],
                    function(err, rows) {
                        if (err) {
                            throw(err);
                        } else {
                            res.send(rows);
                        }
                    });
                }
            });
    } catch(err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

// updates an instrument and associated level and returns true if the update was successful
app.post('/profile/instrument/update',utils.checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'UPDATE ProfileInstruments SET LevelID = ?, LastUpdated = NOW() WHERE ProfileID = ? AND InstrumentID = ?',
            [req.body.levelId, req.body.ProfileKey, req.body.instrumentId],
            function(err, result) {
                if(err) {
                    throw (err);
                } else if (result.affectedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No such instrument for this user"));
                }
        });
    } catch(err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

app.get('/matches',utils.checkAuthenticated,(req, res, next) => {
    // Get all matches in the matches table, then:
    res.render('matches', { profile: true });
});

app.get('/matches/pending',utils.checkAuthenticated,(req, res, next) => {
   try {
       let sql = 'SELECT * FROM Matches WHERE Accepted = 0 AND MatchedProfileID = ?';
       mysql.pool.query(sql, [req.session.ProfileID], function (err, result) {
           if(err) {
               throw(err);
           } else {
               res.send(JSON.stringify(result));
           }
       });
   } catch(err) {
       res.redirect(utils.errorRedirect('/matches/pending', 'An unexpected error occurred retrieving your matches'));
   }
});

app.put('/notifications/markRead',utils.checkAuthenticated,(req, res, next) => {
    try {
        let sql = 'UPDATE Notifications SET ReadMsg=1 WHERE UserID=?';
        mysql.pool.query(sql, [req.user.UserKey], function (err, result) {
           if(err) {
               throw(err);
           } else if (result.affectedRows >= 1) {
                res.send(true);
           } else {
               throw(new ReferenceError('No unread notifications found'));
           }
        });
    } catch(err) {
        res.redirect(utils.errorRedirect('/notifications/markRead', 'An unexpected error occurred marking your notifications read'));
    }
});

app.put('/notifications/markRead/:id',utils.checkAuthenticated,(req, res, next) => {
    try {
        let sql = 'UPDATE Notifications SET ReadMsg=1 WHERE NotificationKey=?';
        mysql.pool.query(sql, [req.params.id], function(err, result) {
           if(err) {
               throw(err);
           } else if (result.affectedRows === 1) {
               res.send(true);
           } else {
               throw(new ReferenceError('No such notification or notification already read'));
           }
        });
    } catch(err) {
        res.redirect(utils.errorRedirect('/notifications/markRead', 'An unexpected error occurred marking your notification read'));
    }
});

// start app
app.listen(port, function(){
    console.log('Express started on port ' + port + '; press Ctrl-C to terminate.')
});

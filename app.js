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
const jp = require("jsonpath");


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
        moment: require('helper-moment')
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

app.get('/create-profile',checkAuthenticated,(req,res) => {
    mysql.pool.query("CALL GetInstrumentsLevels()", [], (error, rows) => {
        if(error) {
            res.write(JSON.stringify(error));
            res.end();
        }
        res.render('create-profile', { user: req.user, instruments: rows[0], levels: rows[1] });
    });
});

//any page requiring authentication needs to run checkAuthenticated first
app.get('/dashboard', checkAuthenticated, function (req, res, next) {
    var callbackCount = 0;
    var context = {
        user: req.user
    };
    mysql.pool.query("SELECT * FROM Profiles WHERE userID = ?;", [req.user.UserKey], (error, results) => {
        try {
            if (results.length == 0)
            {
                //for now you are SOL
                res.write("No profile created for this user");
                res.end();
            }
            else if (results[0].ArtistName === null) {
                req.session.ProfileID = results[0].ProfileKey; //put profile id in the session
                req.session.Profile = results[0]; //put profile in the session
                res.redirect('/create-profile');
            } else {
                req.session.ProfileID = results[0].ProfileKey; //put profile id in the session
                req.session.Profile = results[0]; //put profile in the session

                context['profile'] = results;
                getInstrumentsAndLevels(req, res, context, complete);
                function complete() {
                    callbackCount++;
                    if (callbackCount >= 2) {
                        res.render('dashboard', context);
                    }
                }
            }
        } catch(err) {
            res.write(JSON.stringify(err));
            res.end();
        }
    });
});

app.get('/dashboard/ads', checkAuthenticated, function (req, res, next) {
    let callbackCount = 0;
    let context = {
        user: req.user
    };
    getInstrumentsAndLevels(req, res, context, complete);
    getAds(req, res, context, complete);
    function complete() {
        callbackCount++;
        if (callbackCount >= 3) {
            console.log("context from /dashboard/ads: ", context);
            res.send(context);
        }
    }
});

function getInstrumentsAndLevels(req, res, context, complete) {
    mysql.pool.query("CALL GetInstrumentsLevels()", [], (error, rows) => {
        if(error) {
            throw(error);
        }
        context['instruments'] = rows[0];
        context['levels'] = rows[1];
        complete();
    });
}

// TODO (Nate): Rework this function to replace what's in '/dashboard/ads' for async request.
function getAds(req, res, context, complete) {
    mysql.pool.query("SELECT a.AdKey, a.Title, a.Description, a.ZipCode, a.LocationRadius, a.DatePosted, a.Deleted, a.DateCreated, " +
        "a.LastUpdated, a.IsActive FROM Ads a WHERE a.UserID = ? ORDER BY a.DatePosted DESC", [context.user.UserKey], (error, rows) => {
        if(error) {
            throw(error);
        } else if(rows.length > 0) {
            var ads = rows;
            complete();
            var ad_ids = jp.query(ads, "$..AdKey");
            mysql.pool.query("SELECT ai.AdId, i.InstrumentKey, i.Instrument, l.LevelKey, l.Level\n" +
                "FROM AdInstruments ai\n" +
                "LEFT JOIN InstrumentLookup i ON i.InstrumentKey = ai.InstrumentID\n" +
                "LEFT JOIN LevelLookup l ON l.LevelKey = ai.LevelID\n" +
                "WHERE ai.AdID IN(?)\n" +
                "ORDER BY ai.AdID;", [ad_ids], (error, rows) => {
               if(error) {
                   throw(error);
               } else if(rows.length > 0) {
                    for(let ad of ads){
                        ad['instruments'] = rows.filter(row => row.AdId == ad['AdKey']);
                        console.log(ad);
                    }
                    context['current_ads'] = ads.filter(ad => ad.IsActive === 1);
                    context['has_current_ads'] = (context['current_ads'].length > 0);
                    context['prev_ads'] = ads.filter(ad => ad.IsActive === 0);
                    context['has_prev_ads'] = (context['prev_ads'].length > 0);
                    console.log(context);
                    complete();
               } else {
                   complete();
               }
            });
        } else {
            complete();
            complete(); //need to add another call to callback so we can render dashboard
            context['has_current_ads'] = false;
            context['has_prev_ads'] = false;
        }
    });
}


//any page requiring NOT authentication needs to run checkNotAuthenticated first
//landing page does not need authentication, in fact we do not allow logged in users to access
app.get('/', checkNotAuthenticated, function (req, res, next) {
    res.render('landing', { successRegistration: req.flash('successRegistration'), errorRegistration: req.flash('errorRegistration')});
});

//passport.js will handle login page
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/',
    failureFlash: true
}));

app.post('/register', checkNotAuthenticated, async function (req, res) {
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

app.get('/profile',checkAuthenticated,(req,res,next) => {
    try {
        mysql.pool.query('CALL GetProfile(?)', [req.user.UserKey], function(err, rows) {
            if(err) {
                throw(err);
            } else if(rows.length > 0) {
                let context = {
                    user: req.user,
                    profile: rows[0][0],
                    instruments: rows[1],
                    workSamples: rows[2]
                };
                res.render('profile', context);
            } else {
                throw(new ReferenceError("No profile found"));
            }
        });
    } catch (err) {
        res.redirect(utils.errorRedirect('/profile', 'An unexpected error occurred retrieving your profile'));
    }
});

// saves the info that is located in the Profiles header and returns true if update was successful
app.put('/profile/header', checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'UPDATE Profiles SET ZipCode = ?, ArtistName = ?, LastUpdated = NOW() WHERE UserID = ?',
            [req.body.zipCode, req.body.artistName, req.user.UserKey],
            function(err, result) {
                if(err) {
                    throw(err);
                } else if(result.changedRows === 1) {
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
app.put('/profile/about', checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'UPDATE Profiles SET Bio = ?, LastUpdated = NOW() WHERE UserID = ?',
            [req.body.bio, req.user.UserKey],
            function(err, result) {
                if(err) {
                    throw(err);
                } else if(result.changedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No profile found"))
                }
            });
    } catch (err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

// saves the info that is located in the Profiles table and returns true if the update was successful
app.post('/profile/basic',checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'UPDATE Profiles SET ZipCode = ?, Phone = ?, Website = ?, LookingForWork = ?, ArtistName = ?, LastUpdated = NOW() WHERE UserID = ?',
            [req.body.zipCode, req.body.phoneNumber, req.body.webAddress, req.body.lookingForWork, req.body.ArtistName, req.user.UserKey],
            function(err, result) {
                if(err) {
                    throw(err);
                } else if(result.changedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No profile found"))
                }
            });
    } catch (err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

app.post('/profile/basic/create', checkAuthenticated, (req, res, next) => {
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
                    else if (rows.changedRows === 1) //now that profile is created, add instruments
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
                                        conn.query('INSERT INTO WorkSamples SET ProfileID = ?, SampleLocation = ?', [profileKey, worksampleurl],
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

app.get('/profile/instruments',checkAuthenticated,(req, res, next) => {
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

app.get('/profile/levels',checkAuthenticated,(req, res, next) => {
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
app.post('/profile/instrument/add', checkAuthenticated, (req, res, next) => {
    try {
        mysql.pool.query(
            'INSERT INTO ProfileInstruments (ProfileID, InstrumentID, LevelID, CreateDate) VALUES (?, ?, ?, NOW())',
            [req.body.ProfileKey, req.body.instrumentId, req.body.levelId],
            function (err, result) {
                if (err) {
                    throw (err);
                } else if (result.changedRows === 1) {
                    res.send(true);
                } else {
                    throw (new ReferenceError("Must save profile before adding instruments."));
                }
            });
    } catch (err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

//TODO: it will submit, but there's nothing stopping the user from trying to click the button before Level has been selected, and currently no success message either.
app.post('/create-profile',checkAuthenticated,(req, res, next) => {
    var sql = `INSERT INTO ProfileInstruments (ProfileID, InstrumentID, LevelID, LastUpdated, CreateDate) VALUES (?, (SELECT InstrumentKey FROM InstrumentLookup WHERE Instrument = ?), (SELECT LevelKey FROM LevelLookup WHERE Level = ?), NOW(), NOW())`;
    var inserts = [req.user.UserKey, req.body["instrument-list"], req.body["selection-level"]];
    sql = mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }else{
                res.redirect('/create-profile');
            }
    });    

});

app.get('/profile/worksamples', checkAuthenticated, (req, res, next) => {
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
app.post('/profile/instrument/update',checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'UPDATE ProfileInstruments SET LevelID = ?, LastUpdated = NOW() WHERE ProfileID = ? AND InstrumentID = ?',
            [req.body.levelId, req.body.ProfileKey, req.body.instrumentId],
            function(err, result) {
                if(err) {
                    throw(err);
                } else if(result.changedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No such instrument for this user"));
                }
        });
    } catch(err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

//for storing data from ad creation, use req.body[] because otherwise it is read in as a subtraction
//added form action and method, also changed from datalist to regular select.
 app.post('/dashboard/ads/create', checkAuthenticated, (req, res, next) => {
     try {
         mysql.pool.getConnection(function (err, conn) {
             if (err) throw (err);

             //create the ad
             conn.query(
                 'INSERT INTO Ads SET UserID = ?, Title = ?, Description = ?,  ZipCode = ?, LocationRadius = ?, DatePosted = NOW(), Deleted = ?, IsActive = ?, DateCreated = NOW(), LastUpdated = NOW() ',
                 [req.user.UserKey, req.body["ad-title"], req.body["ad-text"], req.session.Profile.ZipCode, req.body["ad-radius"], '0', '1'],
                 function (err, rows) {
                     if (err) {
                         conn.release();
                         res.write(JSON.stringify(err));
                         res.end();
                     }
                     else if (rows.insertId > 0) //now that ad is created, add instruments
                     {
                         var adKey = rows.insertId;

                         //first format instrument/levelIDs sent in with form
                         var instruments = [];

                         var timestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); //timestamp for create/lastupdated
                         for (i = 0; i <= 20; i++) { //set arbitary max of 20 instruments for now

                             if (Object.prototype.hasOwnProperty.call(req.body, "InstrumentID-" + i) && req.body["InstrumentID-" + i] > 0) {
                                 instruments.push([req.body["InstrumentID-" + i], req.body["LevelID-" + i], req.body["Quantity-" + i], adKey, timestamp, timestamp]);
                             }
                             else break;
                         }

                         //add the instruments
                         conn.query(`INSERT INTO AdInstruments (InstrumentID, LevelID, Quantity, AdId, CreateDate, LastUpdated)  VALUES ?  `, [instruments],
                             function (err, rows) {
                                 conn.release();

                                 if (err) {
                                     res.write(JSON.stringify(err));
                                     res.end();
                                 } else res.redirect('/dashboard'); // successfully posted data to the database, redirecting to dashboard

                             });

                     }
                     else {
                         conn.release();
                         throw (new ReferenceError("No Ad created"));
                     }
                 });
         });
     } catch (err) {
         res.redirect(utils.profileUpdateErrorRedirect());
     }
});
    


//for pages accessible by authenticated users only
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        //TODO add check to see if user has created profile. If not direct them to create a profile
        return next();
    }

    res.redirect('/'); //if not authenticated, bump to landing page
}

//for pages accessible by non-authenticated users only
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard'); //if authenticated, bump to dashboard page
    }
    next();
}

// start app
app.listen(port, function(){
    console.log('Express started on port ' + port + '; press Ctrl-C to terminate.')
});


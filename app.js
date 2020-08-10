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
        moment: require('helper-moment'),
        eq: (v1, v2) => { return v1 === v2; },
        inc: val => { return parseInt(val) + 1; },
        log: val => { console.log(val) }
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
                    res.render('dashboard', context);
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
            res.send(context);
        }
    }
});

app.put('/dashboard/ads/enable', checkAuthenticated, function (req, res, next) {
    mysql.pool.query("UPDATE Ads SET IsActive = ? WHERE AdKey = ?;", [req.body.IsActive, req.body.AdKey], (error, results) => {
        if(error) {
            res.write(JSON.stringify(error));
            res.end();
        } else {
            res.send({ message: 'Successfully enabled ad.' });
        }
    });
});

app.delete('/dashboard/ads/delete', checkAuthenticated,(req, res, next) => {
    mysql.pool.query("DELETE Ads, AdInstruments FROM Ads LEFT JOIN AdInstruments ON Ads.AdKey = AdInstruments.AdID WHERE Ads.AdKey = ?;",
        [req.body.AdKey], (error, results) => {
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        } else {
            res.send({ message: 'Successfully deleted ad.' });
        }
    });
});

app.post('/dashboard/ads/edit', checkAuthenticated, (req, res, next) => {
    try {
        mysql.pool.getConnection(function (err, conn) {
            if (err) throw (err);
            //update the ad info
            conn.query(
                'UPDATE Ads SET Title = ?, Description = ?,  ZipCode = ?, LocationRadius = ?, DatePosted = NOW(), LastUpdated = NOW() WHERE AdKey = ? AND UserID = ?',
                [req.body["ad-title"], req.body["ad-text"], req.body["ad-zip"], req.body["ad-radius"], req.body["ad-id"], req.user.UserKey],
                function (err, rows) {
                    if (err) {
                        conn.release();
                        res.write({ message: 'An error occurred when updating your ad: '.JSON.stringify(err) });
                        res.end();
                    }
                    else if (rows.affectedRows === 1) //now that ad is updated, do any instruments updates
                    {
                        var adKey = req.body["ad-id"];

                        //delete current instruments
                        conn.query(`DELETE FROM AdInstruments WHERE AdId = ? `, [adKey],
                            function (err, rows) {

                                if (err) {
                                    conn.release();
                                    res.write({ message: 'An error occurred when updating your ad: '.JSON.stringify(err) });
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
                                                req.body["instruments[" + i + "][Quantity]"],
                                                adKey, timestamp, timestamp]);

                                        }
                                        else break;
                                    }

                                    ////add the instruments
                                    conn.query(`INSERT INTO AdInstruments (InstrumentID, LevelID, Quantity, AdId, CreateDate, LastUpdated)  VALUES ?  `, [instruments],
                                        function (err, rows) {
                                            conn.release();

                                            if (err) {
                                                res.write({ message: 'An error occurred when updating your ad: '.JSON.stringify(err) });
                                                res.end();
                                            } else res.send({ success: 1, message: 'Successfully updated ad.' });

                                        });
                                }
                            });
                    }
                    else {
                        conn.release();
                        res.send({ success: 0,  message: 'Ad not found.' });
                    }
                });
        });
    } catch (err) {
        res.write(JSON.stringify(err));
        res.end();
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

function getAds(req, res, context, complete) {
    let sql = "SELECT `Value` FROM UserSettings WHERE UserID = ? AND SettingID = (SELECT SettingKey FROM Settings WHERE `Name` = 'AdSortOrder');"
    mysql.pool.query(sql, [context.user.UserKey], (error, rows) => {
        if (error) {
            throw(error);
        } else if (rows.length > 0) {
            sql = "SELECT a.AdKey, a.Title, a.Description, a.ZipCode, a.LocationRadius, a.DatePosted, a.Deleted, " +
                "a.DateCreated, a.LastUpdated, a.IsActive FROM Ads a WHERE a.UserID = ? ORDER BY " + rows[0]['Value'];
            // set the sort value so that it can be read on refresh using the javascript in dashboard.js
            context['sort'] = rows[0]['Value'];
        } else {
            sql = "SELECT a.AdKey, a.Title, a.Description, a.ZipCode, a.LocationRadius, a.DatePosted, a.Deleted, " +
                "a.DateCreated, a.LastUpdated, a.IsActive FROM Ads a WHERE a.UserID = ? ORDER BY a.DatePosted DESC";
            // set the sort value so that it can be read on refresh using the javascript in dashboard.js
            context['sort'] = "a.DatePosted DESC";
        }
        mysql.pool.query(sql, [context.user.UserKey], (error, rows) => {
            if (error) {
                throw(error);
            } else if (rows.length > 0) {
                var ads = rows;
                complete();
                var ad_ids = jp.query(ads, "$..AdKey");
                mysql.pool.query("SELECT ai.AdId, i.InstrumentKey, i.Instrument, l.LevelKey, l.Level, ai.Quantity\n" +
                    "FROM AdInstruments ai\n" +
                    "LEFT JOIN InstrumentLookup i ON i.InstrumentKey = ai.InstrumentID\n" +
                    "LEFT JOIN LevelLookup l ON l.LevelKey = ai.LevelID\n" +
                    "WHERE ai.AdID IN(?)\n" +
                    "ORDER BY ai.AdID;", [ad_ids], (error, rows) => {
                    if (error) {
                        throw(error);
                    } else if (rows.length > 0) {
                        for (let ad of ads) {
                            ad['instruments'] = rows.filter(row => row.AdId == ad['AdKey']);
                        }
                        context['current_ads'] = ads.filter(ad => ad.IsActive === 1);
                        context['has_current_ads'] = (context['current_ads'].length > 0);
                        context['prev_ads'] = ads.filter(ad => ad.IsActive === 0);
                        context['has_prev_ads'] = (context['prev_ads'].length > 0);
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
    });
}

// Fetches profiles + instruments for all profiles in the search-results.
app.get('/search-results/:id', checkAuthenticated, (req, res, next) => {
    mysql.pool.query(`SELECT DISTINCT a.*, p.ProfileKey FROM AdInstruments ai
    JOIN Ads a ON ai.AdID = a.AdKey
    JOIN ProfileInstruments pi ON pi.InstrumentID = ai.InstrumentID AND pi.LevelID >= ai.LevelID
    JOIN Profiles p ON pi.ProfileID = p.ProfileKey AND p.LookingForWork = 1
    WHERE ai.AdID = ? AND a.UserID != p.UserID;`, [req.params.id], (err, adAndIDs) => {
        if(adAndIDs) {
            let profileIDs = adAndIDs.map(p => p.ProfileKey).join();
            let context = {
                user: req.user,
                profile: true,
                ad: adAndIDs[0]
            };
            mysql.pool.query(`SELECT * FROM Profiles WHERE ProfileKey IN (${profileIDs})`, false, (err, results) => {
                if (results) {
                    let profiles = {}
                    results.forEach(profile => {
                        profiles[profile["ProfileKey"]] = profile;
                        profiles[profile["ProfileKey"]]["Instruments"] = {}
                    });
                    mysql.pool.query(`SELECT p.ProfileKey, il.InstrumentKey, il.Instrument, ll.LevelKey, ll.Level FROM ProfileInstruments pi
                    LEFT JOIN Profiles p ON ProfileID = p.ProfileKey
                    LEFT JOIN Users u ON p.UserID = UserKey
                    LEFT JOIN InstrumentLookup il on pi.InstrumentID = InstrumentKey
                    LEFT JOIN LevelLookup ll on pi.LevelID = LevelKey
                    WHERE ProfileID IN (${profileIDs});`, false, (err1, results1) => {
                        if (results1) {
                            results1.forEach((result, i) => {
                                profiles[result["ProfileKey"]]["Instruments"] = {
                                    ...profiles[result["ProfileKey"]]["Instruments"],
                                    [i]: result
                                };
                            });
                            res.render('search-results', { ...context, profiles: profiles });
                        } else {
                            throw(new ReferenceError("Something went wrong fetching profile instruments for the search results page."));
                        }
                    });
                } else {
                    throw(new ReferenceError("Something went wrong fetching profiles for the search results page."));
                }
            });
        } else {
            throw(new ReferenceError("Something went wrong fetching search results for Ad ID " + req.params.id));
        }
    });
});

// app.get('/search-results/:id', checkAuthenticated, (req, res, next) => {
//     mysql.pool.query(`SELECT p.ProfileKey FROM AdInstruments ai
//     JOIN Ads a ON ai.AdID = a.AdKey
//     JOIN ProfileInstruments pi ON pi.InstrumentID = ai.InstrumentID AND pi.LevelID <= ai.LevelID
//     JOIN Profiles p ON pi.ProfileID = p.ProfileKey AND p.LookingForWork = 1
//     WHERE ai.AdID = ? AND a.UserID != p.UserID;`, [req.params.id], (err, ProfileIDs) => {
//         if(ProfileIDs) {
//             let context = {
//                 user: req.user,
//                 profile: true,
//             };
//             // res.render('search-results', context);
//         } else {
//             throw(new ReferenceError("Something went wrong fetching search results for Ad ID " + req.params.id));
//         }
//     });
// });

app.post('/adSortOrder', checkAuthenticated, function (req, res, next) {
    // checks whether the UserID exists in the table
    mysql.pool.query("SELECT UserID FROM UserSettings WHERE UserID = ?;", [req.user.UserKey], (error, results) => {
           if (results.length == 0) {
                //there is no sortOrder in table for this user so we create a new one 
                mysql.pool.query("INSERT INTO UserSettings (UserID, SettingID, `Value`) VALUES (?, (SELECT SettingKey FROM Settings WHERE `Name` = 'AdSortOrder'), ?);", [req.user.UserKey, req.body.sortOrder], (error, results) => {
                   return res.redirect('\dashboard');
                });
            } else {
                // a sortOrder that is not the default exists already so we just update the Value in the backend
                mysql.pool.query("UPDATE UserSettings SET `Value` = ? WHERE UserID = ?;", [req.body.sortOrder, req.user.UserKey], (error, results) => {
                   return res.redirect('\dashboard');
                });
            } 
    });

});


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
                    profileInstruments: rows[1],
                    workSamples: {
                        music: rows[2].filter(sample => sample.SampleType === "Music"),
                        video: rows[2].filter(sample => sample.SampleType === "Video"),
                    }
                };

                getInstrumentsAndLevels(req, res, context, complete);

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
app.put('/profile/header', checkAuthenticated,(req, res, next) => {
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
app.put('/profile/about', checkAuthenticated,(req, res, next) => {
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
app.put('/profile/website', checkAuthenticated,(req, res, next) => {
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
app.post('/profile/instruments', checkAuthenticated, (req, res, next) => {
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

app.delete('/profile/worksamples/music',checkAuthenticated,(req, res, next) => {
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

app.put('/profile/worksamples/music',checkAuthenticated,(req, res, next) => {
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

app.post('/profile/worksamples/music',checkAuthenticated,(req, res, next) => {
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

app.delete('/profile/worksamples/video',checkAuthenticated,(req, res, next) => {
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

app.put('/profile/worksamples/video',checkAuthenticated,(req, res, next) => {
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

app.post('/profile/worksamples/video',checkAuthenticated,(req, res, next) => {
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
app.post('/profile/basic',checkAuthenticated,(req, res, next) => {
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

app.get('/matches',checkAuthenticated,(req, res, next) => {
    // Get all matches in the matches table, then:
    res.render('matches', { profile: true });
});

app.get('/matches/pending',checkAuthenticated,(req, res, next) => {
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

app.put('/notifications/markRead',checkAuthenticated,(req, res, next) => {
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

app.put('/notifications/markRead/:id',checkAuthenticated,(req, res, next) => {
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

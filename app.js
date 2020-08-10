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

//Routes
app.use('/dashboard', require('./routes/ads.js'));
app.use('/profile', require('./routes/profileInfo.js'));

app.get('/create-profile',utils.checkAuthenticated,(req,res) => {
    mysql.pool.query("CALL GetInstrumentsLevels()", [], (error, rows) => {
        if(error) {
            res.write(JSON.stringify(error));
            res.end();
        }
        res.render('create-profile', { user: req.user, instruments: rows[0], levels: rows[1] });
    });
});

// Fetches profiles + instruments for all profiles in the search-results.
app.get('/search-results/:id', utils.checkAuthenticated, (req, res, next) => {
    // Step 1: Get the original ad content and all matching profile IDs.
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

            // If there were no matching profileIDs, render the page with profiles set to false..
            if (!profileIDs) {
                return res.render('search-results', { ...context, profiles: false });
            } else {
                // Step 2: Get the profile data for each of the matching profile keys. Set up profile key/value pairs.
                mysql.pool.query(`SELECT * FROM Profiles WHERE ProfileKey IN (${profileIDs})`, false, (err, results) => {
                    if (results) {
                        let profiles = {}
                        results.forEach(profile => {
                            profiles[profile["ProfileKey"]] = profile;
                            profiles[profile["ProfileKey"]]["Instruments"] = {}
                        });

                        // Step 3: Add in the instruments and levels for each of the profiles that matched.
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
            }
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

app.post('/adSortOrder', utils.checkAuthenticated, function (req, res, next) {
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

const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
var mysql = require('./dbcon.js');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
var bodyParser = require('body-parser');
const utils = require('./utils');


// constants
const port = 3000;
const app = express();

// set up handlebars
app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars({
    layoutsDir: path.join(__dirname, 'views/layouts'),
    defaultLayout: 'main',
    partialsDir: path.join(__dirname, 'views/partials')
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
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));


//any page requiring authentication needs to run checkAuthenticated first
//PLACEHOLDER for landing page.
app.get('/index', checkAuthenticated, function (req, res, next) {
    res.render('index', { user: req.user });
});

//any page requiring NOT authentication needs to run checkNotAuthenticated first
//landing page does not need authentication, in fact we do not allow logged in users to access
app.get('/', checkNotAuthenticated, function (req, res, next) {
    res.render('landing', { successRegistration: req.flash('successRegistration'), errorRegistration: req.flash('errorRegistration')});
});

//passport.js will handle login page
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/index',
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
                mysql.pool.query("INSERT INTO `Users` (`FirstName`, `LastName`, `Email`, `Password`) VALUES (?, ?, ?, ?)",
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

// saves the info that is located in the Profiles table and returns true if the update was successful
app.post('/profile/basic',checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'UPDATE Profiles SET ZipCode = ?, Phone = ?, Website = ?, LookingForWork = ?, LastUpdated = NOW() WHERE UserID = ?',
            [req.body.zipCode, req.body.phoneNumber, req.body.webAddress, req.body.lookingForWork, req.user.UserKey],
            function(err, result) {
                if(err) {
                    throw(err);
                } else if(result.changedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError("No profile found"));
                }
            });
    } catch (err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

//TODO: potentially accept an array of instruments?
//TODO: allow users to add instruments not already in InstrumentLookup?
app.post('profile/instrument/add',checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query(
            'INSERT INTO ProfileInstruments (ProfileID, InstrumentID, LevelID, CreateDate) VALUES (?, ?, ?, NOW())',
            [req.body.ProfileKey, req.body.instrumentId, req.body.levelId],
                function(err, result) {
                if(err) {
                    throw(err);
                } else if(result.changedRows === 1) {

                } else {

                }
        });
    } catch(err) {
        res.redirect(utils.profileUpdateErrorRedirect());
    }
});

app.post('profile/instrument/update',checkAuthenticated,(req, res, next) => {
    try {
        mysql.pool.query('', [], function(err, result) {
            if(err) {
                throw(err);
            } else if(result.changedRows === 1) {

            } else {

            }
        });
    } catch(err) {
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
        return res.redirect('/index'); //if authenticated, bump to dashboard page
    }
    next();
}

// start app
app.listen(port, function(){
    console.log('Express started on port ' + port + '; press Ctrl-C to terminate.')
});


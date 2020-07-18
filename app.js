const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
var mysql = require('./dbcon.js');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

const port = 3000;
const app = express();

// set up handlebars
app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars({
    layoutsDir: path.join(__dirname, 'views/layouts'),
    defaultLayout:'main',
    partialsDir: path.join(__dirname, 'views/partials')
}));

// set up file location for static files
app.use(express.static(path.join(__dirname, 'static')))
app.use('/static', express.static(path.join(__dirname, 'static')));

app.use(express.urlencoded({ extended: false }));
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

// TEMPORARY: Setting up basic route to view/edit easily.
app.get('/create-profile', (req, res) => {
    res.render('create-profile');
});

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


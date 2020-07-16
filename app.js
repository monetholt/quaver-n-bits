const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
var mysql = require('./dbcon.js');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

// constants
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
                        console.log("An unexpected error has occurred trying to find user by email."); //an issue with our query or some other db problem
                        reject(new Error('An unexpected error has occurred trying to find user by email.'));
                    } else if (rows.length == 0) {
                        console.log("User not found.");
                        resolve( null );
                    } else {
                        console.log("Found user by email: ", rows[0]);
                        resolve( rows[0] );
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
                        console.log("An unexpected error has occurred trying to find user by id."); //an issue with our query or some other db problem
                        reject(new Error('An unexpected error has occurred trying to find user by id.'));
                    } else if (rows.length == 0) {
                        console.log("User not found.");
                        resolve(null);
                    } else {
                        console.log("Found user by ID: ", rows[0]);
                        resolve(rows[0]);
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
app.get('/', checkAuthenticated, function (req, res, next) {
    console.log('sess; ',req.user);
    res.render('index', { user: req.user });
});

//any page requiring NOT authentication needs to run checkNotAuthenticated first
app.get('/login', checkNotAuthenticated, function (req, res, next) {
    res.render('login');
});

//passport.js will handle login page
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

//don't allow authenticated users to access register page
app.get('/register', checkNotAuthenticated, function (req, res, next) {
    var context = {};
    context.message = req.body.msg; //an issue with our query or some other db problem

    res.render('register', context);
});

app.post('/register', checkNotAuthenticated, async function (req, res) {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10); //encrypt the password entered by the user

        //add user to database
        mysql.pool.query('SELECT UserKey FROM Users WHERE Email = ? LIMIT 1', [req.body.email], function (err, rows, fields) {

            if (err) {
                //an issue with our query or some other db problem
                res.redirect('/register?message=An unexpected error has occurred');
            } else if (rows.length > 0) {
                res.redirect('/register?message=A user with this email already exists.');
            } else {
                mysql.pool.query("INSERT INTO `Users` (`FirstName`, `LastName`, `Email`, `Password`) VALUES (?, ?, ?, ?)",
                    [req.body.firstname, req.body.lastname, req.body.email, hashedPassword],

                    function (err, result) {
                        if (err) {
                            res.redirect('/register?An unexpected error occurred adding user');
                        } else {
                            res.redirect('/login'); //Successfully added user redirect to login
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
    res.redirect('/login');
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}

// start app
app.listen(port, function(){
    console.log('Express started on port ' + port + '; press Ctrl-C to terminate.')
});


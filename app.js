const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
var mysql = require('./dbcon.js');
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

//body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set up file location for static files
app.use(express.static(path.join(__dirname, 'static')));

// routes
app.get('/', (req, res) => res.render('landing'));

app.get('/profile',/*checkAuthenticated,*/(req, res, next) => {
    try {
        mysql.pool.query('CALL GetProfile(?)', [/*req.user.UserKey*/2], function (err, rows) {
            if (err) {
                throw(err);
            } else if (rows.length > 0) {
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
app.post('/profile/basic',/*checkAuthenticated,*/(req, res, next) => {
    try {
        mysql.pool.query(
            'UPDATE Profiles SET ZipCode = ?, Phone = ?, Website = ?, LookingForWork = ?, LastUpdated = NOW() WHERE UserID = ?',
            [req.body.zipCode, req.body.phoneNumber, req.body.webAddress, req.body.lookingForWork, /*req.user.UserKey*/2],
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
app.post('profile/instrument/add',/*checkAuthenticated,*/(req, res, next) => {
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

app.post('profile/instrument/update',/*checkAuthenticated,*/(req, res, next) => {
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

// start app
app.listen(port, function () {
    console.log('Express started on port ' + port + '; press Ctrl-C to terminate.')
});


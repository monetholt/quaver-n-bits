const utils = require('../utils.js');
const express = require('express');
const mysql = require('../dbcon.js');
const router = express.Router();

router.get('/', utils.checkAuthenticated,(req,res,next) => {
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
router.put('/header', utils.checkAuthenticated,(req, res, next) => {
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
router.put('/about', utils.checkAuthenticated,(req, res, next) => {
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
router.put('/website', utils.checkAuthenticated,(req, res, next) => {
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


router.get('/levels',utils.checkAuthenticated,(req, res, next) => {
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

router.use('/instruments', require('./instruments.js'));
router.use('/instrument', require('./instrument.js'));
router.use('/worksamples', require('./worksamples.js'));
router.use('/basic', require('./basic.js'));



module.exports = router
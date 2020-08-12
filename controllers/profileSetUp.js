const mysql = require('../dbcon.js');
const utils = require('../utils.js');
const jp = require("jsonpath");

module.exports = {
    obtainProfile: (req, res, next) => {
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
                        },
                        notifs: req.session.notifs
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
    },
    saveHeader: (req, res, next) => {
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
    },
    saveAbout: (req, res, next) => {
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
    },
    saveWebsite: (req, res, next) => {
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
    },
    selectLevels: (req, res, next) => {
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
    }
}
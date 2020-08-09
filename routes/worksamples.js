const utils = require('../utils.js');
const express = require('express');
const mysql = require('../dbcon.js');
const router = express.Router();

router.get('/', utils.checkAuthenticated, (req, res, next) => {
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

router.put('/music',utils.checkAuthenticated,(req, res, next) => {
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


router.post('/music',utils.checkAuthenticated,(req, res, next) => {
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

router.delete('/music',utils.checkAuthenticated,(req, res, next) => {
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


router.put('/video',utils.checkAuthenticated,(req, res, next) => {
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

router.post('/video',utils.checkAuthenticated,(req, res, next) => {
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

router.delete('/video',utils.checkAuthenticated,(req, res, next) => {
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

module.exports = router
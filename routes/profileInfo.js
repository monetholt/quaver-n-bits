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

router.get('/instruments',utils.checkAuthenticated,(req, res, next) => {
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

//updates the profile instruments. Called from within the profile view page.
router.post('/instruments', utils.checkAuthenticated, (req, res, next) => {
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

// updates an instrument and associated level and returns true if the update was successful
router.post('/instrument/update',utils.checkAuthenticated,(req, res, next) => {
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

// inserts an instrument and associated level and returns true if the insert was successful
router.post('/instrument/add', utils.checkAuthenticated, (req, res, next) => {
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


router.get('/worksamples', utils.checkAuthenticated, (req, res, next) => {
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

router.put('/worksamples/music',utils.checkAuthenticated,(req, res, next) => {
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


router.post('/worksamples/music',utils.checkAuthenticated,(req, res, next) => {
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


router.delete('/worksamples/video',utils.checkAuthenticated,(req, res, next) => {
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


router.put('/worksamples/video',utils.checkAuthenticated,(req, res, next) => {
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

router.post('/worksamples/video',utils.checkAuthenticated,(req, res, next) => {
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

router.delete('/worksamples/music',utils.checkAuthenticated,(req, res, next) => {
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

router.post('/basic/create', utils.checkAuthenticated, (req, res, next) => {
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

// saves the info that is located in the Profiles table and returns true if the update was successful
router.post('/basic',utils.checkAuthenticated,(req, res, next) => {
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

module.exports = router
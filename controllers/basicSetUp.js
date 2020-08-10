const mysql = require('../dbcon.js');
const utils = require('../utils.js');
const jp = require("jsonpath");

module.exports = {
    updateProfileInfo: (req, res, next) => {
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
    },
    createProfile: (req, res, next) => {
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
    }
}
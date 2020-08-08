const utils = require('utils.js');
const mysql = require('dbcon.js');
const express = require('express');
const router = express.Router();

router.get('/dashboard/ads', utils.checkAuthenticated, function (req, res, next) {
    let callbackCount = 0;
    let context = {
        user: req.user
    };
    utils.getInstrumentsAndLevels(req, res, context, complete);
    getAds(req, res, context, complete);
    function complete() {
        callbackCount++;
        if (callbackCount >= 3) {
            res.send(context);
        }
    }
});

router.put('/dashboard/ads/enable', utils.checkAuthenticated, function (req, res, next) {
    mysql.pool.query("UPDATE Ads SET IsActive = ? WHERE AdKey = ?;", [req.body.IsActive, req.body.AdKey], (error, results) => {
        if(error) {
            res.write(JSON.stringify(error));
            res.end();
        } else {
            res.send({ message: 'Successfully enabled ad.' });
        }
    });
});

router.delete('/dashboard/ads/delete', utils.checkAuthenticated,(req, res, next) => {
    mysql.pool.query("DELETE Ads, AdInstruments FROM Ads LEFT JOIN AdInstruments ON Ads.AdKey = AdInstruments.AdID WHERE Ads.AdKey = ?;",
        [req.body.AdKey], (error, results) => {
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            } else {
                res.send({ message: 'Successfully deleted ad.' });
            }
        });
});

router.post('/dashboard/ads/edit', utils.checkAuthenticated, (req, res, next) => {
    try {
        mysql.pool.getConnection(function (err, conn) {
            if (err) throw (err);
            //update the ad info
            conn.query(
                'UPDATE Ads SET Title = ?, Description = ?,  ZipCode = ?, LocationRadius = ?, DatePosted = NOW(), LastUpdated = NOW() WHERE AdKey = ? AND UserID = ?',
                [req.body["ad-title"], req.body["ad-text"], req.body["ad-zip"], req.body["ad-radius"], req.body["ad-id"], req.user.UserKey],
                function (err, rows) {
                    if (err) {
                        conn.release();
                        res.write({ message: 'An error occurred when updating your ad: '.JSON.stringify(err) });
                        res.end();
                    }
                    else if (rows.affectedRows === 1) //now that ad is updated, do any instruments updates
                    {
                        var adKey = req.body["ad-id"];

                        //delete current instruments
                        conn.query(`DELETE FROM AdInstruments WHERE AdId = ? `, [adKey],
                            function (err, rows) {

                                if (err) {
                                    conn.release();
                                    res.write({ message: 'An error occurred when updating your ad: '.JSON.stringify(err) });
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
                                                req.body["instruments[" + i + "][Quantity]"],
                                                adKey, timestamp, timestamp]);

                                        }
                                        else break;
                                    }

                                    ////add the instruments
                                    conn.query(`INSERT INTO AdInstruments (InstrumentID, LevelID, Quantity, AdId, CreateDate, LastUpdated)  VALUES ?  `, [instruments],
                                        function (err, rows) {
                                            conn.release();

                                            if (err) {
                                                res.write({ message: 'An error occurred when updating your ad: '.JSON.stringify(err) });
                                                res.end();
                                            } else res.send({ success: 1, message: 'Successfully updated ad.' });

                                        });
                                }
                            });
                    }
                    else {
                        conn.release();
                        res.send({ success: 0,  message: 'Ad not found.' });
                    }
                });
        });
    } catch (err) {
        res.write(JSON.stringify(err));
        res.end();
    }
});

router.post('/adSortOrder', utils.checkAuthenticated, function (req, res, next) {
    // checks whether the UserID exists in the table
    mysql.pool.query("SELECT UserID FROM UserSettings WHERE UserID = ?;", [req.user.UserKey], (error, results) => {
        if (results.length === 0) {
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

function getAds(req, res, context, complete) {
    let sql = "SELECT `Value` FROM UserSettings WHERE UserID = ? AND SettingID = (SELECT SettingKey FROM Settings WHERE `Name` = 'AdSortOrder');"
    mysql.pool.query(sql, [context.user.UserKey], (error, rows) => {
        if (error) {
            throw(error);
        } else if (rows.length > 0) {
            sql = "SELECT a.AdKey, a.Title, a.Description, a.ZipCode, a.LocationRadius, a.DatePosted, a.Deleted, " +
                "a.DateCreated, a.LastUpdated, a.IsActive FROM Ads a WHERE a.UserID = ? ORDER BY " + rows[0]['Value'];
            // set the sort value so that it can be read on refresh using the javascript in dashboard.js
            context['sort'] = rows[0]['Value'];
        } else {
            sql = "SELECT a.AdKey, a.Title, a.Description, a.ZipCode, a.LocationRadius, a.DatePosted, a.Deleted, " +
                "a.DateCreated, a.LastUpdated, a.IsActive FROM Ads a WHERE a.UserID = ? ORDER BY a.DatePosted DESC";
            // set the sort value so that it can be read on refresh using the javascript in dashboard.js
            context['sort'] = "a.DatePosted DESC";
        }
        mysql.pool.query(sql, [context.user.UserKey], (error, rows) => {
            if (error) {
                throw(error);
            } else if (rows.length > 0) {
                var ads = rows;
                complete();
                var ad_ids = jp.query(ads, "$..AdKey");
                mysql.pool.query("SELECT ai.AdId, i.InstrumentKey, i.Instrument, l.LevelKey, l.Level, ai.Quantity\n" +
                    "FROM AdInstruments ai\n" +
                    "LEFT JOIN InstrumentLookup i ON i.InstrumentKey = ai.InstrumentID\n" +
                    "LEFT JOIN LevelLookup l ON l.LevelKey = ai.LevelID\n" +
                    "WHERE ai.AdID IN(?)\n" +
                    "ORDER BY ai.AdID;", [ad_ids], (error, rows) => {
                    if (error) {
                        throw(error);
                    } else if (rows.length > 0) {
                        for (let ad of ads) {
                            ad['instruments'] = rows.filter(row => row.AdId == ad['AdKey']);
                        }
                        context['current_ads'] = ads.filter(ad => ad.IsActive === 1);
                        context['has_current_ads'] = (context['current_ads'].length > 0);
                        context['prev_ads'] = ads.filter(ad => ad.IsActive === 0);
                        context['has_prev_ads'] = (context['prev_ads'].length > 0);
                        complete();
                    } else {
                        complete();
                    }
                });
            } else {
                complete();
                complete(); //need to add another call to callback so we can render dashboard
                context['has_current_ads'] = false;
                context['has_prev_ads'] = false;
            }
        });
    });
}
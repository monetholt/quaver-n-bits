const utils = require('../utils.js');
const express = require('express');
const mysql = require('../dbcon.js');
const router = express.Router();

router.get('/',utils.checkAuthenticated,(req, res, next) => {
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
router.post('/', utils.checkAuthenticated, (req, res, next) => {
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

module.exports = router
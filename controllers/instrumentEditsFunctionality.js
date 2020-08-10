const mysql = require('../dbcon.js');
const utils = require('../utils.js');
const jp = require("jsonpath");

module.exports = {
    updateInstrumentsOnProfile: (req, res, next) => {
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
    },
    addInstrumentsOnProfile: (req, res, next) => {
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
    }
}
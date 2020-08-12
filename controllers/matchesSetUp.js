const mysql = require('../dbcon.js');
const utils = require('../utils.js');
const jp = require("jsonpath");

module.exports = {
    getMatches: (req, res, next) => {
        // Get all matches in the matches table, then:
        res.render('matches', {
            user: req.user, notifs: req.session.notifs, unreadNotifs: req.session.unreadNotifs, profile: true });
    },

    getPendingMatches: (req, res, next) => {
        try {
            let sql = 'SELECT * FROM Matches WHERE Accepted = 0 AND MatchedProfileID = ?';
            mysql.pool.query(sql, [req.session.ProfileID], function (err, result) {
                if(err) {
                    throw(err);
                } else {
                    res.send(JSON.stringify(result));
                }
            });
        } catch(err) {
            res.redirect(utils.errorRedirect('/matches/pending', 'An unexpected error occurred retrieving your matches'));
        }
    },

    addNewMatch: (req, res, next) => {
        //adds a new match with pending status and adds notification for user to accept/reject
        try {
            mysql.pool.getConnection(function (err, conn) {
                if (err) throw (err);

                //add the match record
                conn.query('INSERT INTO Matches (AdID, MatchedProfileID, Accepted, DateInviteSent) VALUES (?, ?, ?, NOW())',
                    [req.body.AdID, req.body.MatchedProfileID, false],
                    function (err, rows) {

                        if (err) { //something went wrong so send an error
                            conn.release();
                            res.write({ success: 0, message: 'An error occurred when requesting to match: '.JSON.stringify(err) });
                            res.end();
                        } else {

                            var matchKey = rows.insertId; //id of match we just created.

                            //now need the notification record for the person who owns the profile

                            //first go get the userID of the profile ID
                            conn.query(`SELECT UserID FROM Profiles WHERE ProfileKey = ? LIMIT 1`, [req.body.MatchedProfileID],
                                function (err, rows) {

                                    if (err) {
                                        conn.release();
                                        res.write({ success: 0, message: 'An error occurred when getting user connected to profile: '.JSON.stringify(err) });
                                        res.end();
                                    } else if (rows.length === 0) {
                                        conn.release();
                                        res.write({ success: 0, message: 'Profile user does not exist. ' }); //no user found! No goood
                                        res.end();
                                    }
                                    else {
                                        var userID = rows[0]["UserID"];

                                        //now go add the notification record.
                                        conn.query(`INSERT INTO Notifications (UserID, MatchID, Msg, ReadMsg, CreateDate) VALUES (?, ?, ?, ?, NOW()) `,
                                            [userID, matchKey, "New match request from <strong>" + req.user.FirstName + " " + req.user.LastName +"</strong>! Click to view your matches now.", false],
                                            function (err, rows) {
                                                conn.release();

                                                if (err) {
                                                    res.write({ success: 1, message: 'An error occurred adding notification for match request: '.JSON.stringify(err) });
                                                    res.end();
                                                } else res.send({ success: 1, message: 'Successfully requested to match.' });
                                            });
                                    }
                                });
                        }
                    });

            });
        } catch (err) {
            res.write(JSON.stringify(err));
            res.end();
        }
    }
}

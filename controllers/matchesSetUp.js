const mysql = require('../dbcon.js');
const utils = require('../utils.js');

module.exports = {
    getMatches: (req, res, next) => {

        let context = {
            user: req.user,
            notifs: req.session.notifs,
            unreadNotifs: req.session.unreadNotifs,
            profile: true
        };

        // Get all matches for this user.
        mysql.pool.query(`SELECT * FROM Matches WHERE Deleted = 0 AND (MatchedProfileID = 2 
        OR AdID IN (SELECT AdKey FROM Ads WHERE UserID = 8));`, [req.session.ProfileID, req.user.UserKey], (err, matches) => {
            if (err) {
                throw(err);
            } else {
                context = {
                    ...context,
                    active: false,
                    outgoing: false,
                    incoming: false
                };

                // Sort matches into active, incoming, or outgoing.
                matches.forEach(match => {
                    if (match["Accepted"] === 0) {
                        if (match["MatchedProfileID"] === req.session.ProfileID) {
                            context.outgoing = { ...context.outgoing, [match["MatchedProfileID"]]: match }
                        } else {
                            context.incoming = { ...context.incoming, [match["MatchedProfileID"]]: match }
                        }
                    } else {
                        context.active = { ...context.active, [match["MatchedProfileID"]]: match }
                    }
                });

                // TODO: Fetch the data needed for each category (possibly in a separate function for each).
                // TODO: Format output for display as outlined in matches.handlebars.

                res.render('matches', { context });
            }
        });
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

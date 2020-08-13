const mysql = require('../dbcon.js');
const utils = require('../utils.js');

module.exports = {
    getMatches: (req, res) => {

        let context = {
            user: req.user,
            notifs: req.session.notifs,
            unreadNotifs: req.session.unreadNotifs,
            profile: true
        };

        // Get all matches for this user.
        mysql.pool.query(`SELECT m.*, a.*, p.*, au.FirstName, au.LastName FROM Matches m
            JOIN Ads a ON m.AdID = a.AdKey
            JOIN Users au on a.UserID = au.UserKey
            JOIN Profiles p on m.MatchedProfileID = p.ProfileKey
            JOIN Users pu on p.UserID = pu.UserKey
            WHERE m.Deleted = 0 AND (pu.UserKey = ? OR au.UserKey = ?);`, [req.user.UserKey, req.user.UserKey], (err, matches) => {
            if (err) {
                throw(err);
            } else {
                context = {
                    ...context,
                    active: false,
                    outgoing: false,
                    incoming: false
                };

                // Grab outgoing keys & ad keys for instrument lookup
                let outgoingKeys = [];
                let incomingKeys = [];

                // Sort matches into active, incoming, or outgoing.
                matches.forEach((match) => {
                    match.instruments = [];
                    if (match["Accepted"] === 0) {
                        if (match["MatchedProfileID"] === req.session.ProfileID) {
                            context.incoming = context.incoming ? [...context.incoming, match ] : [match];
                            incomingKeys.push(match["AdID"])
                        } else {
                            context.outgoing = context.outgoing ? [ ...context.outgoing, match ] : [match];
                            outgoingKeys.push(match["MatchedProfileID"]);
                        }
                    } else {
                        context.active = context.active ? [ ...context.active, match ] : [match];
                    }
                });

                // Get the instruments for each outgoing match.
                mysql.pool.query(`SELECT ProfileID, il.InstrumentKey, il.Instrument, ll.LevelKey, ll.Level FROM ProfileInstruments pi
                    LEFT JOIN Profiles p ON ProfileID = p.ProfileKey
                    LEFT JOIN Users u ON p.UserID = UserKey
                    LEFT JOIN InstrumentLookup il on pi.InstrumentID = InstrumentKey
                    LEFT JOIN LevelLookup ll on pi.LevelID = LevelKey
                    WHERE ProfileID IN (${outgoingKeys.join()});`, false, (err, outInsts) => {
                    if (err) {
                        throw(err);
                    } else {
                        outInsts.forEach((inst) => {
                            context.outgoing.forEach(match => {
                                if (match.MatchedProfileID === inst.ProfileID) {
                                    match.instruments.push(inst);
                                }
                            });
                        });

                        // Get the instruments for each incoming match.
                        mysql.pool.query(`SELECT a.AdKey,il.InstrumentKey, il.Instrument, ll.LevelKey, ll.Level FROM AdInstruments ai
                            LEFT JOIN Ads a ON AdID = a.AdKey
                            LEFT JOIN Users u ON UserID = u.UserKey
                            LEFT JOIN InstrumentLookup il on ai.InstrumentID = InstrumentKey
                            LEFT JOIN LevelLookup ll on ai.LevelID = LevelKey
                            WHERE AdKey IN (${incomingKeys.join()});`, false, (err, incInsts) => {
                            if (err) {
                                throw (err)
                            } else {
                                incInsts.forEach((inst) => {
                                    context.incoming.forEach(match => {
                                        if (match.AdID === inst.AdKey) {
                                            match.instruments.push(inst);
                                        }
                                    });
                                });

                                // Group outgoing matches by ad:
                                let outgoingByAds = {};

                                context.outgoing.forEach(match => {
                                    if(match["AdID"] in outgoingByAds) {
                                        outgoingByAds[match["AdID"]].matches = [...outgoingByAds[match["AdID"]].matches, match];
                                    } else {
                                        outgoingByAds[match["AdID"]] = {
                                            AdID: match.AdID,
                                            Title: match.Title,
                                            DatePosted: match.DatePosted,
                                            matches: [match]
                                        }
                                    }
                                });

                                context.outgoing = Object.values(outgoingByAds);
                                res.render('matches', context);
                            }
                        });
                    }
                });
            }
        });
    },

    getPendingMatches: (req, res) => {
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
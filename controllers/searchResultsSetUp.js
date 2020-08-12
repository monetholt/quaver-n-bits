const mysql = require('../dbcon.js');
const utils = require('../utils.js');
const jp = require("jsonpath");

module.exports = {
    searchResultsById: (req, res, next) => {
        // Step 1: Get the original ad content and all matching profile IDs.
        mysql.pool.query(`SELECT DISTINCT a.*, p.ProfileKey FROM AdInstruments ai
        JOIN Ads a ON ai.AdID = a.AdKey
        JOIN ProfileInstruments pi ON pi.InstrumentID = ai.InstrumentID AND pi.LevelID >= ai.LevelID
        JOIN Profiles p ON pi.ProfileID = p.ProfileKey AND p.LookingForWork = 1
        WHERE ai.AdID = ? AND a.UserID != p.UserID;`, [req.params.id], (err, adAndIDs) => {
            if (adAndIDs) {
                let profileIDs = adAndIDs.map(p => p.ProfileKey).join();
                let context = {
                    user: req.user,
                    notifs: req.session.notifs,
                    unreadNotifs: req.session.unreadNotifs,
                    profile: true,
                    ad: adAndIDs[0]
                };

                if (context.ad.LocationRadius < 99999) {
                    context.ad.LocationRadiusDisplay = context.ad.LocationRadius;
                } else {
                    context.ad.LocationRadiusDisplay = "Any";
                }

                // If there were no matching profileIDs, render the page with profiles set to false..
                if (!profileIDs) {
                    return res.render('search-results', {...context, profiles: false});
                } else {
                    // Step 2: Get the profile data for each of the matching profile keys. Set up profile key/value pairs.
                    mysql.pool.query(`SELECT * FROM Profiles WHERE ProfileKey IN (${profileIDs})`, false, (err, results) => {
                        if (results) {
                            let profiles = {}
                            results.forEach(profile => {
                                profiles[profile["ProfileKey"]] = profile;
                                profiles[profile["ProfileKey"]]["Instruments"] = {}
                            });

                            // Step 3: Add in the instruments and levels for each of the profiles that matched.
                            mysql.pool.query(`SELECT p.ProfileKey, il.InstrumentKey, il.Instrument, ll.LevelKey, ll.Level FROM ProfileInstruments pi
                        LEFT JOIN Profiles p ON ProfileID = p.ProfileKey
                        LEFT JOIN Users u ON p.UserID = UserKey
                        LEFT JOIN InstrumentLookup il on pi.InstrumentID = InstrumentKey
                        LEFT JOIN LevelLookup ll on pi.LevelID = LevelKey
                        WHERE ProfileID IN (${profileIDs});`, false, (err1, results1) => {
                                if (results1) {
                                    results1.forEach((result, i) => {
                                        profiles[result["ProfileKey"]]["Instruments"] = {
                                            ...profiles[result["ProfileKey"]]["Instruments"],
                                            [i]: result
                                        };
                                    });

                                    // Step 4: Add an attribute for each match called Matched that is automatically set to false
                                    mysql.pool.query(`SELECT * FROM Matches WHERE AdID = ? AND MatchedProfileID IN (${profileIDs})`, [req.params.id], (err2, results2) => {
                                        Object.values(profiles).forEach(profile => {
                                            profile["Matched"] = false;
                                            profile["Pending"] = false;
                                            profile["Ignored"] = false;
                                            profile["Connected"] = false;
                                        });
                                        if (results2) {
                                            results2.forEach(result => {
                                                // Connection has been made in some way
                                                profiles[result["MatchedProfileID"]]["Connected"] = true;

                                                // Pending/open request
                                                if (result["Accepted"] === 0 && result["Deleted"] === 0) {
                                                    profiles[result["MatchedProfileID"]]["Pending"] = true;
                                                }
                                                // Ignored
                                                else if (result["Accepted"] === 0 && result["Deleted"] === 1) {
                                                    profiles[result["MatchedProfileID"]]["Ignored"] = true;
                                                }
                                                // Matched!
                                                else if (result["Accepted"] === 1) {
                                                    profiles[result["MatchedProfileID"]]["Matched"] = true;
                                                }
                                            });
                                        }

                                        res.render('search-results', {...context, profiles: profiles});
                                    });

                                } else {
                                    throw(new ReferenceError("Something went wrong fetching profile instruments for the search results page."));
                                }
                            });
                        } else {
                            throw(new ReferenceError("Something went wrong fetching profiles for the search results page."));
                        }
                    });
                }
            } else {
                throw(new ReferenceError("Something went wrong fetching search results for Ad ID " + req.params.id));
            }
        });
    }
}

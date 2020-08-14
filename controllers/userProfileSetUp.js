const mysql = require('../dbcon.js');
const utils = require('../utils.js');

module.exports = {
    getUserProfile: (req, res, next) => {
        try {
            mysql.pool.query('CALL GetProfileByProfileKey(?)', [req.query.ProfileID], function(err, rows) {
                if(err) {
                    throw(err);
                } else if(rows.length > 0) {
                    let context = {
                        user: req.user,
                        notifs: req.session.notifs,
                        unreadNotifs: req.session.unreadNotifs,
                        profile: rows[0][0],
                        profileInstruments: rows[1],
                        workSamples: {
                            music: rows[2].filter(sample => sample.SampleType === "Music"),
                            video: rows[2].filter(sample => sample.SampleType === "Video"),
                        }
                    };

                    utils.getInstrumentsAndLevels(req, res, context, complete);

                    function complete() {
                        res.render('user-profile', context);
                    }
                } else {
                    throw(new ReferenceError("No profile found"));
                }
            });
        } catch (err) {
            res.redirect(utils.errorRedirect('/dashboard', 'An unexpected error occurred retrieving this user\'s profile.'));
        }
    }
}
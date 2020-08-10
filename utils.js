const mysql = require('./dbcon.js');

exports.errorRedirect = (url, message) => {
    return url + '?message=' + message;
}

exports.profileUpdateErrorRedirect = () =>
    this.errorRedirect('/profile', 'An unexpected error occurred updating your profile');

exports.getInstrumentsAndLevels = (req, res, context, complete) =>
    mysql.pool.query("CALL GetInstrumentsLevels()", [], (error, rows) => {
        if(error) {
            throw(error);
        }
        context['instruments'] = rows[0];
        context['levels'] = rows[1];
        complete();
    });


//get notifications and put into session. Called within checkauthenticated after checked user is already authenticated
exports.getNotifications = (req, next) =>
    mysql.pool.query("SELECT * FROM Notifications WHERE UserID=? ", [req.user.UserKey], (error, rows) => {
        if (error)
        {
            //not going to throw an error. just not going to send anything back
            req.session.notifs = [];
        }
        else
        {
            req.session.notifs = rows; //put notifications in session
        }

        return next();
    });

//for pages accessible by authenticated users only
exports.checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        //TODO add check to see if user has created profile. If not direct them to create a profile
        exports.getNotifications(req, next);
    }
    else {
        res.redirect('/'); //if not authenticated, bump to landing page

    }
}

//for pages accessible by non-authenticated users only
exports.checkNotAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard'); //if authenticated, bump to dashboard page
    }
    next();
}
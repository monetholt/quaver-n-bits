const mysql = require('../dbcon.js');
const utils = require('../utils.js');
const jp = require("jsonpath");

module.exports = {
    markRead: (req, res, next) => {
        try {
            let sql = 'UPDATE Notifications SET ReadMsg=1 WHERE UserID=?';
            mysql.pool.query(sql, [req.user.UserKey], function (err, result) {
                if(err) {
                    throw(err);
                } else if (result.affectedRows >= 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError('No unread notifications found'));
                }
            });
        } catch(err) {
            res.redirect(utils.errorRedirect('/notifications/markRead', 'An unexpected error occurred marking your notifications read'));
        }
    },
    markReadById: (req, res, next) => {
        try {
            let sql = 'UPDATE Notifications SET ReadMsg=1 WHERE NotificationKey=?';
            mysql.pool.query(sql, [req.params.id], function(err, result) {
                if(err) {
                    throw(err);
                } else if (result.affectedRows === 1) {
                    res.send(true);
                } else {
                    throw(new ReferenceError('No such notification or notification already read'));
                }
            });
        } catch(err) {
            res.redirect(utils.errorRedirect('/notifications/markRead', 'An unexpected error occurred marking your notification read'));
        }
    },
    markUnreadById: (req, res, next) => {
        try {
            let sql = 'UPDATE Notifications SET ReadMsg=0 WHERE NotificationKey=?';
            mysql.pool.query(sql, [req.params.id], function (err, result) {
                if (err) {
                    throw (err);
                } else if (result.affectedRows === 1) {
                    res.send(true);
                } else {
                    throw (new ReferenceError('No such notification or notification already unread'));
                }
            });
        } catch (err) {
            res.redirect(utils.errorRedirect('/notifications/markUnread', 'An unexpected error occurred marking your notification as unread.'));
        }
    },
    delete: (req, res, next) => {
        try {
            let sql = 'DELETE FROM Notifications WHERE UserID=?';
            mysql.pool.query(sql, [req.user.UserKey], function (err, result) {
                if (err) {
                    throw (err);
                } else if (result.affectedRows >= 1) {
                    res.send(true);
                } else {
                    res.send(true); //don't worry about throwing an error. could be that they deleted on one tab and tried to do it again on another
                }
            });
        } catch (err) {
            res.redirect(utils.errorRedirect('/notifications/delete', 'An unexpected error occurred deleting your notifications.'));
        }
    },
    deleteById: (req, res, next) => {
        try {
            let sql = 'DELETE FROM Notifications WHERE UserID=? AND NotificationKey=?';
            mysql.pool.query(sql, [req.user.UserKey, req.params.id], function (err, result) {
                if (err) {
                    throw (err);
                } else if (result.affectedRows === 1) {
                    res.send(true);
                } else {
                    res.send(true); //don't worry about throwing an error. could be that they deleted on one tab and tried to do it again on another
                }
            });
        } catch (err) {
            res.redirect(utils.errorRedirect('/notifications/delete', 'An unexpected error occurred deleting a notification.'));
        }
    }
}

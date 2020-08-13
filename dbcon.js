var mysql  = require('mysql');
var pool = mysql.createPool({
    connectionLimit : 10,
    host     : 'sql3.freesqldatabase.com',
    user     : 'sql3354401',
    password : 'AnMXEKIykF',
    database : 'sql3354401',
    port     : '3306'
});
module.exports.pool = pool;
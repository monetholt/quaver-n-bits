var mysql  = require('mysql');

var pool = mysql.createPool({
    connectionLimit : 10,
    host     : process.env.DB_URL,
    user     : process.env.DB_NAME,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME,
    port     : '3306'});

module.exports.pool = pool;
const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
var mysql = require('./dbcon.js');

// constants
const port = 3000;
const app = express();

// set up handlebars
app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars({
    layoutsDir: path.join(__dirname, 'views/layouts'),
    defaultLayout:'main',
    partialsDir: path.join(__dirname, 'views/partials')
}));

// set up file location for static files
app.use(express.static(path.join(__dirname, 'static')));

// routes
app.get('/', (req, res) => res.render('landing'));

app.get('/profile',/*checkAuthenticated,*/function(req,res,next){
    try {
        mysql.pool.query('CALL GetProfile(?)', [/*req.user.UserKey*/2], function(err, rows, fields) {
           if(err) {
               throw(err);
           } else if(rows.length > 0) {
               let context = {
                   profile: rows[0][0],
                   instruments: rows[1],
                   workSamples: rows[2]
               };
               res.render('profile', context);
           }
        });
    } catch(err) {
        console.log(err);
        res.redirect('/profile?message=An unexpected error occurred retrieving your profile');
    }
});

// start app
app.listen(port, function(){
    console.log('Express started on port ' + port + '; press Ctrl-C to terminate.')
});


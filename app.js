const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');

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
app.use(express.static(path.join(__dirname, 'static')))
app.use('/static', express.static(path.join(__dirname, 'static')));

// routes
app.get('/', (req, res) => res.render('landing'));

// start app
app.listen(port, function(){
    console.log('Express started on port ' + port + '; press Ctrl-C to terminate.')
});


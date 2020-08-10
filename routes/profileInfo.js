const utils = require('../utils.js');
const controller = require('../controllers/profileSetUp.js');
const express = require('express');
const mysql = require('../dbcon.js');
const router = express.Router();

router.get('/', utils.checkAuthenticated, controller.obtainProfile);

// saves the info that is located in the Profiles header and returns true if update was successful
router.put('/header', utils.checkAuthenticated, controller.saveHeader);

// saves the info that is located in the Profiles about/bio and returns true if update was successful
router.put('/about', utils.checkAuthenticated, controller.saveAbout);

// saves the info that is located in the Profiles website/social section and returns true if update was successful
router.put('/website', utils.checkAuthenticated, controller.saveWebsite);


router.get('/levels',utils.checkAuthenticated, controller.selectLevels);

router.use('/instruments', require('./instruments.js'));
router.use('/instrument', require('./instrument.js'));
router.use('/worksamples', require('./worksamples.js'));
router.use('/basic', require('./basic.js'));



module.exports = router
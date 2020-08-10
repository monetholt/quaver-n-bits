const utils = require('../utils.js');
const controller = require('../controllers/basicSetUp.js');
const express = require('express');
const mysql = require('../dbcon.js');
const router = express.Router();

// saves the info that is located in the Profiles table and returns true if the update was successful
router.post('/',utils.checkAuthenticated, controller.updateProfileInfo);

router.post('/create', utils.checkAuthenticated, controller.createProfile);

module.exports = router
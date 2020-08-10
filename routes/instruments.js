const utils = require('../utils.js');
const controller = require('../controllers/instrumentsSetUp.js');
const express = require('express');
const mysql = require('../dbcon.js');
const router = express.Router();

router.get('/',utils.checkAuthenticated, controller.loadInstruments);

//updates the profile instruments. Called from within the profile view page.
router.post('/', utils.checkAuthenticated, controller.updateInstruments);

module.exports = router
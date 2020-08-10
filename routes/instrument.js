const utils = require('../utils.js');
const controller = require('../controllers/instrumentEditsFunctionality.js');
const express = require('express');
const mysql = require('../dbcon.js');
const router = express.Router();


// updates an instrument and associated level and returns true if the update was successful
router.post('/update',utils.checkAuthenticated, controller.updateInstrumentsOnProfile);

// inserts an instrument and associated level and returns true if the insert was successful
router.post('/add', utils.checkAuthenticated, controller.addInstrumentsOnProfile);

module.exports = router
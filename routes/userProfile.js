const utils = require('../utils.js');
const controller = require('../controllers/userProfileSetUp.js');
const express = require('express');
const router = express.Router();

router.post('/', utils.checkAuthenticated, controller.getUserProfile);

module.exports = router
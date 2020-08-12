const utils = require('../utils.js');
const controller = require('../controllers/searchResultsSetUp.js');
const express = require('express');
const router = express.Router();

router.get('/:id', utils.checkAuthenticated, controller.searchResultsById);

module.exports = router;
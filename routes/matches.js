const utils = require('../utils.js');
const controller = require('../controllers/matchesSetUp.js');
const express = require('express');
const router = express.Router();

router.get('/', utils.checkAuthenticated, controller.getMatches);
router.get('/pending', utils.checkAuthenticated, controller.getPendingMatches);
router.post('/add', utils.checkAuthenticated, controller.addNewMatch);

module.exports = router;
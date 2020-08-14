const utils = require('../utils.js');
const controller = require('../controllers/matchesSetUp.js');
const express = require('express');
const router = express.Router();

router.get('/', utils.checkAuthenticated, controller.getMatches);
router.get('/pending', utils.checkAuthenticated, controller.getPendingMatches);
router.post('/add', utils.checkAuthenticated, controller.addNewMatch);

router.post('/accept/:id', utils.checkAuthenticated, controller.acceptMatch);
router.post('/reject/:id', utils.checkAuthenticated, controller.rejectMatch); //this route takes care of both 'reject' and 'block' buttons on match page
router.post('/disconnect/:id', utils.checkAuthenticated, controller.disconnectMatch);

module.exports = router;
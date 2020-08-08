const utils = require('../utils.js');
const controller = require('../controllers/adController.js');
const express = require('express');
const router = express.Router();

router.get('/', utils.checkAuthenticated, controller.loadDashboard);

router.get('/ads', utils.checkAuthenticated, controller.retrieveAds);

router.put('/ads/enable', utils.checkAuthenticated, controller.toggleEnable);

router.delete('/ads/delete', utils.checkAuthenticated, controller.deleteAd);

router.post('/ads/edit', utils.checkAuthenticated, controller.editAd);

router.post('/adSortOrder', utils.checkAuthenticated, controller.updateSortOrder);

//for storing data from ad creation, use req.body[] because otherwise it is read in as a subtraction
//added form action and method, also changed from datalist to regular select.
router.post('/ads/create', utils.checkAuthenticated, controller.saveNewAd);

module.exports = router
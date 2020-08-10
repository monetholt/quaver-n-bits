const utils = require('../utils.js');
const controller = require('../controllers/workSampleSetUp.js');
const express = require('express');
const mysql = require('../dbcon.js');
const router = express.Router();

router.get('/', utils.checkAuthenticated, controller.loadWorkSample);

router.put('/music',utils.checkAuthenticated, controller.updateMusic);

router.post('/music',utils.checkAuthenticated, controller.placeMusic);

router.delete('/music',utils.checkAuthenticated, controller.deleteMusic);

router.put('/video',utils.checkAuthenticated,controller.updateVideo);

router.post('/video',utils.checkAuthenticated,controller.placeVideo);

router.delete('/video',utils.checkAuthenticated,controller.deleteVideo);

module.exports = router
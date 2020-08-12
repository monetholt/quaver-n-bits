const utils = require('../utils.js');
const controller = require('../controllers/notificationsSetUp.js');
const express = require('express');
const router = express.Router();

router.put('/markRead', utils.checkAuthenticated, controller.markRead);
router.put('/markRead/:id', utils.checkAuthenticated, controller.markReadById);
router.put('/markUnread/:id', utils.checkAuthenticated, controller.markUnreadById);
router.delete('/delete', utils.checkAuthenticated, controller.delete);
router.delete('/delete/:id', utils.checkAuthenticated, controller.deleteById);

module.exports = router;




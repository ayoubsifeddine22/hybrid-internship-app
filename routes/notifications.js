const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

// Middleware: Verify user is authenticated
router.use(verifyToken);

router.get('/', notificationController.getNotifications);
router.put('/:id', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;


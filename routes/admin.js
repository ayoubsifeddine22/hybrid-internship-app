const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, authorizeRole } = require('../middleware/auth');

// Middleware: Verify admin authentication
router.use(verifyToken);
router.use(authorizeRole('admin'));

// ===== USER MANAGEMENT =====
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/status', adminController.updateUserStatus);

// ===== OFFER MANAGEMENT =====
router.get('/offers', adminController.getAllOffers);
router.get('/offers/:id', adminController.getOfferDetails);

// ===== APPLICATION MANAGEMENT =====
router.get('/applications', adminController.getAllApplications);
router.get('/applications/:id', adminController.getApplicationDetails);

// ===== AUDIT & ANALYTICS =====
router.get('/logs', adminController.getAuditLogs);
router.get('/stats', adminController.getStats);

module.exports = router;router.delete('/users/:id', (req, res) => {
  res.json({ message: 'Delete user - to be implemented' });
});

router.delete('/offers/:id', (req, res) => {
  res.json({ message: 'Delete offer - to be implemented' });
});

module.exports = router;


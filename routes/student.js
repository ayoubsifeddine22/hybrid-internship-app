const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const studentProfileController = require('../controllers/studentProfileController');
const { verifyToken, authorizeRole } = require('../middleware/auth');

// Middleware: Verify student is authenticated
router.use(verifyToken);
router.use(authorizeRole('student'));

// ===== APPLICATION ROUTES =====
router.get('/offers', studentController.getOffers);
router.get('/offers/:id', studentController.getOfferDetails);
router.post('/applications', studentController.submitApplication);
router.get('/applications', studentController.getApplications);
router.get('/applications/:id', studentController.getApplicationDetails);
router.delete('/applications/:id', studentController.deleteApplication);

// ===== PROFILE ROUTES =====
router.get('/profile', studentProfileController.getProfile);
router.put('/profile/education', studentProfileController.updateEducation);
router.put('/profile/location', studentProfileController.updateLocation);
router.put('/profile/skills', studentProfileController.updateSkills);

module.exports = router;


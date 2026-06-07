const express = require('express');
const router = express.Router();
const multer = require('multer');
const studentController = require('../controllers/studentController');
const studentProfileController = require('../controllers/studentProfileController');
const { verifyToken, authorizeRole } = require('../middleware/auth');

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Middleware: Verify student is authenticated
router.use(verifyToken);
router.use(authorizeRole('student'));

// ===== APPLICATION ROUTES =====
router.get('/offers', studentController.getOffers);
router.get('/offers/:id', studentController.getOfferDetails);
// CV Parsing - upload PDF to extract data for form pre-fill
router.post('/parse-cv', upload.single('cv'), studentController.parseCV);
// Form submission - no file needed
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


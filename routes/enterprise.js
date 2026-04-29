const express = require('express');
const router = express.Router();
const enterpriseController = require('../controllers/enterpriseController');
const enterpriseProfileController = require('../controllers/enterpriseProfileController');
const { verifyToken, authorizeRole } = require('../middleware/auth');

// Middleware: Verify enterprise is authenticated
router.use(verifyToken);
router.use(authorizeRole('enterprise'));

// ===== OFFER ROUTES =====
router.get('/offers', enterpriseController.getOffers);
router.post('/offers', enterpriseController.createOffer);
router.get('/offers/:id', enterpriseController.getOfferDetails);
router.put('/offers/:id', enterpriseController.updateOffer);
router.delete('/offers/:id', enterpriseController.deleteOffer);

router.get('/offers/:id/applications', enterpriseController.getOfferApplications);
router.get('/offers/:offerId/applications/:appId', enterpriseController.getApplicationDetails);

// ===== PROFILE ROUTES =====
router.get('/profile', enterpriseProfileController.getProfile);
router.put('/profile/company', enterpriseProfileController.updateCompanyInfo);
router.put('/profile/contact', enterpriseProfileController.updateContactInfo);

module.exports = router;


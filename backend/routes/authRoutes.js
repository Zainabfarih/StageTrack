const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');
const checkRole = require('../middlewares/roles');
const config = require('../config/auth.config');

// ─── Routes publiques ────────────────────────────────────────────────────────
router.post('/login',                   authController.signin);
router.post('/register',                authController.register);
router.post('/refresh-token',           authController.refreshToken);
router.post('/logout',                  authController.logout);
router.get('/verify-email',             authController.verifyEmail);
router.post('/resend-verification',     authController.resendVerification);

// Mot de passe oublié — flux complet
router.post('/forgot-password',         authController.requestPasswordReset);
router.post('/reset-password',          authController.resetPassword);

// ─── Routes protégées ────────────────────────────────────────────────────────
router.get('/profile',                  verifyToken, authController.getProfile);
router.post('/complete-profile',        verifyToken, authController.completeProfile);

// Changement de mot de passe forcé (1re connexion étudiant créé par admin)
router.post('/change-password',         verifyToken, authController.changePassword);

// Création étudiant par admin/encadrant univ
router.post(
  '/create_etudiant',
  verifyToken,
  checkRole([config.roles.ADMIN_UNIV, config.roles.ENCADRANT_UNIV]),
  authController.createStudent,
);

module.exports = router;

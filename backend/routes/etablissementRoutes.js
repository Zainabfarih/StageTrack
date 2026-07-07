const express = require('express');
const router = express.Router();
const etablissementController = require('../controllers/etablissementController');
const { verifyToken } = require('../middlewares/auth');
const checkRole = require('../middlewares/roles');
const config = require('../config/auth.config');

// Lecture
router.get('/', verifyToken, etablissementController.getAll);
router.get('/:id', verifyToken, etablissementController.getById);
router.get('/:id/etudiants', verifyToken, etablissementController.getEtudiants);

// Modification du profil 
router.put('/:id', verifyToken, checkRole([config.roles.ADMIN_UNIV]), etablissementController.update);

module.exports = router;

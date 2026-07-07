const express = require('express');
const router = express.Router();
const stageController = require('../controllers/stageController');
const checkRole = require('../middlewares/roles');
const config = require('../config/auth.config');
const { verifyToken } = require('../middlewares/auth');

router.get('/', stageController.getAll);
router.get('/stage/stats', stageController.getStats);
router.get('/deadlines', verifyToken, stageController.getDeadlines);
router.put('/deadlines/:niveau', verifyToken, checkRole([config.roles.ADMIN_UNIV]), stageController.setDeadline);
router.get('/entreprise/:id_entreprise', stageController.getByEntreprise);
router.get('/:id', stageController.getById);

// Définir la date limite pour tous les stages (admin université)
router.put('/dateLimite/all', verifyToken, checkRole([config.roles.ADMIN_UNIV]), stageController.setDateLimiteAll);
// Définir la date limite d'un stage
router.put('/dateLimite/:IdStage', verifyToken, stageController.setDateLimite);

// Gestion des offres par l'entreprise
router.post('/', verifyToken, checkRole([config.roles.ADMIN_ENTREPRISE]), stageController.create);
router.put('/:id', verifyToken, checkRole([config.roles.ADMIN_ENTREPRISE]), stageController.update);
router.delete('/:id', verifyToken, checkRole([config.roles.ADMIN_ENTREPRISE]), stageController.delete);

module.exports = router;

const express = require('express');
const router = express.Router();
const affectationController = require('../controllers/affectationController');
const { verifyToken } = require('../middlewares/auth');
const checkRole = require('../middlewares/roles');
const { roles } = require('../config/auth.config');

// Statut de la campagne 
router.get('/status', verifyToken, affectationController.getStatus);

// Administration université
router.post('/auto/:niveau', verifyToken, checkRole(roles.ADMIN_UNIV), affectationController.autoAffectation);
router.get('/', verifyToken, checkRole(roles.ADMIN_UNIV), affectationController.getAll);
router.put('/:id/encadrants', verifyToken, checkRole(roles.ADMIN_UNIV), affectationController.assignencadrants);

// Suivi côté entreprise 
router.get('/entreprise/:idEntreprise', verifyToken, checkRole(roles.ADMIN_ENTREPRISE), affectationController.getByEntreprise);

// Notes des encadrants 
router.put('/:id/note-entr', verifyToken, affectationController.setNoteEntr);
router.put('/:id/note-univ', verifyToken, affectationController.setNoteUniv);

// Désistement étudiant 
router.post('/desister', verifyToken, affectationController.desister);

module.exports = router;

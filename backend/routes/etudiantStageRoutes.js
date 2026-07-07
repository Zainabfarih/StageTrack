const express = require('express');
const router = express.Router();
const etudiantStageController = require('../controllers/etudiantStageController');

// CRUD Routes
// get all etudiantStage
router.get('/', etudiantStageController.getAll);
// get by  stage of etudiant by id of etudiant
router.get('/etudiant/:IdEtudiant', etudiantStageController.getByEtudiant);
// get by id etudiantStage
router.get('/:id', etudiantStageController.getById);
// assigner un stage à un étudiant
router.post('/', etudiantStageController.create);
// mettre à jour le stage d'un étudiant
router.put('/:id', etudiantStageController.update);
// retirer un stage d'un étudiant
router.delete('/:id', etudiantStageController.delete);

// Route pour mettre à jour le statut du rapport
router.put('/:id/statut', etudiantStageController.updateRapportStatut);

module.exports = router;
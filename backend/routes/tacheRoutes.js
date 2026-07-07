const express = require('express');
const router = express.Router();
const tacheController = require('../controllers/tacheController');
const { verifyToken } = require('../middlewares/auth');

router.get('/stage/:Idstage', verifyToken, tacheController.getByStage);
router.get('/etudiant/:id_etudiant', verifyToken, tacheController.getByEtudiant);
router.get('/stats/:Idstage', verifyToken, tacheController.getStats);
router.get('/:IdTache', verifyToken, tacheController.getById);
router.post('/', verifyToken, tacheController.create);
router.put('/done/:IdTache', verifyToken, tacheController.markAsDone);
router.put('/:IdTache', verifyToken, tacheController.update);
router.delete('/:IdTache', verifyToken, tacheController.delete);

module.exports = router;

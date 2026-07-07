const express = require('express');
const router = express.Router();
const encadrantStageController = require('../controllers/encadrantStageController');
const { verifyToken } = require('../middlewares/auth');

router.get('/stage/:IdStage', verifyToken, encadrantStageController.getByStage);
router.get('/encadrant/:encadrantType/:encadrantId', verifyToken, encadrantStageController.getByencadrant);
router.post('/', verifyToken, encadrantStageController.assign);
router.put('/stage/:IdStage', verifyToken, encadrantStageController.assign);
router.delete('/:IdEncadStage', verifyToken, encadrantStageController.delete);

module.exports = router;

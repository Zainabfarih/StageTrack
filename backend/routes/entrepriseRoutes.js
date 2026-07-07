const express = require('express');
const router = express.Router();
const entrepriseController = require('../controllers/entrepriseController');
const { verifyToken } = require('../middlewares/auth');
const checkRole = require('../middlewares/roles');
const config = require('../config/auth.config');

router.get('/', entrepriseController.getAll);
router.get('/search', entrepriseController.search);
router.get('/:id', entrepriseController.getById);
router.post('/', verifyToken, checkRole([config.roles.ADMIN_UNIV]), entrepriseController.create);
router.put('/:id', verifyToken, checkRole([config.roles.ADMIN_ENTREPRISE, config.roles.ADMIN_UNIV]), entrepriseController.update);
router.delete('/:id', verifyToken, checkRole([config.roles.ADMIN_UNIV]), entrepriseController.delete);
router.put('/:id/password', verifyToken, entrepriseController.changePassword);

module.exports = router;

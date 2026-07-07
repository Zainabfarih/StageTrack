const express = require('express');
const router  = express.Router();
const encadrantEntrController = require('../controllers/encadrantEntrController');
const { verifyToken } = require('../middlewares/auth');
const checkRole       = require('../middlewares/roles');
const config          = require('../config/auth.config');

// ─── Lecture ─────────────────────────────────────────────────────────────────
router.get('/', verifyToken, encadrantEntrController.getAll);
router.get('/:id', verifyToken, encadrantEntrController.getById);
router.get('/entreprise/:id_entreprise', verifyToken, encadrantEntrController.getByEntreprise);

// ─── Création  ───────────────────────────────────
router.post(
  '/',
  verifyToken,
  checkRole([config.roles.ADMIN_ENTREPRISE]),
  encadrantEntrController.create,
);

// ─── Modification / Suppression  ────────────────
router.put(
  '/:id',
  verifyToken,
  checkRole([config.roles.ADMIN_ENTREPRISE]),
  encadrantEntrController.update,
);

router.delete(
  '/:id',
  verifyToken,
  checkRole([config.roles.ADMIN_ENTREPRISE]),
  encadrantEntrController.delete,
);

module.exports = router;

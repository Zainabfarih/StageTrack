const express = require('express');
const router  = express.Router();
const encadrantUnivController = require('../controllers/encadrantUnivController');
const { verifyToken } = require('../middlewares/auth');
const checkRole       = require('../middlewares/roles');
const config          = require('../config/auth.config');

// ─── Lecture  ────────────────────
router.get('/', verifyToken, encadrantUnivController.getAll);
router.get('/:id', verifyToken, encadrantUnivController.getById);

// ─── Récupérer tous les encadrants d'une université ─────────────────────────
router.get('/universite/:id_universite', verifyToken, async (req, res) => {
  const { id_universite } = req.params;
  const db = require('../models/db');
  try {
    const encadrants = await db.executeQuery(
      'SELECT * FROM encadrant_univ WHERE id_universite = ?',
      [id_universite],
    );
    res.json(encadrants);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Création ────────────────────────────────────────
router.post(
  '/',
  verifyToken,
  checkRole([config.roles.ADMIN_UNIV]),
  encadrantUnivController.create,
);

// ─── Modification / Suppression  ──────────────────────
router.put(
  '/:id',
  verifyToken,
  checkRole([config.roles.ADMIN_UNIV]),
  encadrantUnivController.update,
);

router.delete(
  '/:id',
  verifyToken,
  checkRole([config.roles.ADMIN_UNIV]),
  encadrantUnivController.delete,
);

module.exports = router;

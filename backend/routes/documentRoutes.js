const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const checkRole = require('../middlewares/roles');
const config = require('../config/auth.config');
const { verifyToken } = require('../middlewares/auth');

// Consultation d'un rapport par un encadrant
router.get(
  '/encadrants/rapports/:idDocument',
  verifyToken,
  checkRole([config.roles.ENCADRANT_UNIV, config.roles.ENCADRANT_ENTREPRISE]),
  documentController.getDocumentById,
);

// Validation / rejet du rapport par l'encadrant universitaire
router.put(
  '/encadrants/rapports/:idDocument/validation',
  verifyToken,
  checkRole([config.roles.ENCADRANT_UNIV]),
  documentController.validerRapport,
);

router.put(
  '/encadrants/rapports/:idDocument/rejet',
  verifyToken,
  checkRole([config.roles.ENCADRANT_UNIV]),
  documentController.rejeterRapport,
);

module.exports = router;

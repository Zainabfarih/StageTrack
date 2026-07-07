const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const etudiantController = require("../controllers/etudiantController");
const checkRole = require("../middlewares/roles");
const config = require("../config/auth.config");
const { verifyToken } = require("../middlewares/auth");

// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "cv") {
      cb(null, "public/cv/");
    } else if (file.fieldname === "lm") {
      cb(null, "public/lm/");
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); 
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Seuls les fichiers PDF sont autorisés"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Routes de base pour les étudiants
router.get("/", etudiantController.getAll); 
router.get("/:id", etudiantController.getById); 
router.put("/:id", verifyToken, etudiantController.update); 
router.delete("/:id", verifyToken, checkRole([config.roles.ADMIN_UNIV]), etudiantController.delete); // check by test

// Routes spécifiques
router.get("/:id/candidatures", etudiantController.getCandidatures); 
router.put(
  "/putscore/:id",
  verifyToken,
  etudiantController.updateScore
); 

// Stockage pour le CV
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/cv')),
  filename: (req, file, cb) => cb(null, 'cv-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const uploadCv = multer({ storage: cvStorage });

// Stockage pour la LM
const lmStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/lm')),
  filename: (req, file, cb) => cb(null, 'lm-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const uploadLm = multer({ storage: lmStorage });

// Route pour upload CV
router.put('/cv/:id', verifyToken, uploadCv.single('file'), etudiantController.updateCv);
// Route pour upload LM
router.put('/lm/:id', verifyToken, uploadLm.single('file'), etudiantController.updateLm);

// Stockage pour le rapport
const rapportStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/rapport')),
  filename: (req, file, cb) => cb(null, 'rapport-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const uploadRapport = multer({ storage: rapportStorage });

// Stockage pour la convention
const conventionStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/convention')),
  filename: (req, file, cb) => cb(null, 'convention-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const uploadConvention = multer({ storage: conventionStorage });

// Route pour upload rapport
router.put('/rapport/:id', verifyToken, uploadRapport.single('file'), etudiantController.updateRapport);
// Route pour upload convention
router.put('/convention/:id', verifyToken, uploadConvention.single('file'), etudiantController.updateConvention);

// Récupérer tous les étudiants d'une université
router.get('/universite/:id_universite', async (req, res) => {
  const { id_universite } = req.params;
  const db = require('../models/db');
  try {
    const etudiants = await db.executeQuery('SELECT * FROM etudiant WHERE id_universite = ?', [id_universite]);
    res.json(etudiants);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

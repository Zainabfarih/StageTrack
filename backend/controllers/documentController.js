const DocumentModel = require('../models/documentModel');
const multer = require('multer');
const path = require('path');

// Configuration de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/documents');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF, Word et images sont autorisés'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('document');

const documentController = {
  // Récupérer les documents d'un propriétaire
  getDocumentById: async (req, res) => {
    try {
      const { idDocument } = req.params;
      const document = await DocumentModel.getById(idDocument);
      if (!document) {
        return res.status(404).json({ message: 'Document non trouvé' });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération du document', error: error.message });
    }
  },

  validerRapport: async (req, res) => {
    try {
      await DocumentModel.setStatut(req.params.idDocument, 'valide', req.body.commentaire || null);
      res.json({ message: 'Rapport validé avec succès' });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la validation', error: error.message });
    }
  },

  rejeterRapport: async (req, res) => {
    try {
      await DocumentModel.setStatut(req.params.idDocument, 'rejete', req.body.commentaire || null);
      res.json({ message: 'Rapport rejeté' });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors du rejet', error: error.message });
    }
  },
};

module.exports = documentController;
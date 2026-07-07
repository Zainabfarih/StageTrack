const Etudiant = require('../models/etudiantModel');
const bcrypt = require('bcryptjs');
const EmailService = require('../services/emailService');

const etudiantController = {

  // Lister tous les étudiants
  getAll: async (req, res) => {
    try {
      const result = await Etudiant.getAll();
      res.json({ data: result.data, total: result.total });
    } catch (error) {
      res.status(500).json({
        message: 'Erreur lors de la récupération des étudiants',
        error: error.message,
      });
    }
  },

  // Obtenir un étudiant par ID
  getById: async (req, res) => {
    try {
      const etudiant = await Etudiant.getById(req.params.id);
      if (!etudiant) {
        return res.status(404).json({ message: 'Étudiant non trouvé' });
      }
      res.json(etudiant);
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la récupération de l'étudiant",
        error: error.message,
      });
    }
  },

  // Créer un étudiant (par l'admin)
  create: async (req, res) => {
    try {
      const { nom, prenom, mail, mot_de_passe } = req.body;

      if (!nom || !prenom || !mail || !mot_de_passe) {
        return res.status(400).json({
          message: 'Nom, prénom, mail et mot de passe sont requis',
        });
      }

      const emailExists = await Etudiant.emailExists(mail);
      if (emailExists) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Hash du mot de passe temporaire
      const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
      const etudiantData = {
        ...req.body,
        mot_de_passe: hashedPassword,
        // needs_password_change et profile_completed sont gérés dans le model
      };

      const newEtudiant = await Etudiant.create(etudiantData);
      if (!newEtudiant) {
        return res.status(400).json({
          message: "Erreur lors de la création de l'étudiant",
        });
      }

      // Envoyer le mot de passe temporaire par email
      try {
        const emailService = new EmailService();
        await emailService.sendTemporaryPasswordEmail(mail, mot_de_passe, nom);
      } catch (emailError) {
        console.error('Erreur envoi email mot de passe temporaire:', emailError);
      }

      res.status(201).json({
        message: 'Étudiant créé avec succès',
        etudiant: newEtudiant,
      });
    } catch (error) {
      res.status(400).json({
        message: "Erreur lors de la création de l'étudiant",
        error: error.message,
      });
    }
  },

  // Mettre à jour un étudiant
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nom, prenom, mail } = req.body;

      if (!nom || !prenom || !mail) {
        return res.status(400).json({ message: 'Nom, prénom et mail sont requis' });
      }

      if (mail) {
        const emailExists = await Etudiant.emailExists(mail, id);
        if (emailExists) {
          return res.status(400).json({
            message: 'Cet email est déjà utilisé par un autre étudiant',
          });
        }
      }

      const updatedEtudiant = await Etudiant.update(id, req.body);
      res.json({ message: 'Étudiant mis à jour avec succès', etudiant: updatedEtudiant });
    } catch (error) {
      res.status(400).json({
        message: "Erreur lors de la mise à jour de l'étudiant",
        error: error.message,
      });
    }
  },

  // Supprimer un étudiant
  delete: async (req, res) => {
    try {
      await Etudiant.delete(req.params.id);
      res.json({ message: 'Étudiant supprimé avec succès' });
    } catch (error) {
      const statusCode = error.message.includes('associées') ? 409 : 400;
      res.status(statusCode).json({
        message: "Erreur lors de la suppression de l'étudiant",
        error: error.message,
      });
    }
  },

  
  // Changer le mot de passe (première connexion)
  changePassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          message: 'Le nouveau mot de passe doit contenir au moins 6 caractères',
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await Etudiant.updatePassword(id, hashedPassword);

      res.json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (error) {
      res.status(400).json({
        message: 'Erreur lors du changement de mot de passe',
        error: error.message,
      });
    }
  },

  
  getCandidatures: async (req, res) => {
    try {
      const candidatures = await Etudiant.getCandidatures(req.params.id);
      res.json(candidatures);
    } catch (error) {
      res.status(500).json({
        message: 'Erreur lors de la récupération des candidatures',
        error: error.message,
      });
    }
  },

  updateCv: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Aucun fichier CV téléchargé' });
      const cvPath = `/public/cv/${req.file.filename}`;
      await Etudiant.updateCv(req.params.id, cvPath);
      res.json({ message: 'CV mis à jour avec succès', path: cvPath });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la mise à jour du CV', error: error.message });
    }
  },

  updateLm: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Aucun fichier LM téléchargé' });
      const lmPath = `/public/lm/${req.file.filename}`;
      await Etudiant.updateLm(req.params.id, lmPath);
      res.json({ message: 'Lettre de motivation mise à jour avec succès', path: lmPath });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la mise à jour de la lettre de motivation', error: error.message });
    }
  },

  updateScore: async (req, res) => {
    try {
      const { score } = req.body;
      if (score === undefined || score === null || score === '') {
        return res.status(400).json({ message: 'Le score est requis' });
      }
      const n = Number(score);
      if (Number.isNaN(n) || n < 0 || n > 20) {
        return res.status(400).json({ message: 'Le score doit être compris entre 0 et 20' });
      }
      await Etudiant.updateScore(req.params.id, n);
      res.json({ message: 'Score mis à jour avec succès', score: n });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la mise à jour du score', error: error.message });
    }
  },

  updateRapport: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Aucun fichier rapport téléchargé' });
      const rapportPath = `/public/rapport/${req.file.filename}`;
      const EtudiantStage = require('../models/etudiantStageModel');
      await EtudiantStage.updateFileByEtudiant(req.params.id, 'rapport', rapportPath);
      res.json({ message: 'Rapport mis à jour avec succès', path: rapportPath });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la mise à jour du rapport', error: error.message });
    }
  },

  updateConvention: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Aucun fichier convention téléchargé' });
      const conventionPath = `/public/convention/${req.file.filename}`;
      const EtudiantStage = require('../models/etudiantStageModel');
      await EtudiantStage.updateFileByEtudiant(req.params.id, 'convention', conventionPath);
      res.json({ message: 'Convention mise à jour avec succès', path: conventionPath });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la mise à jour de la convention', error: error.message });
    }
  },
};

module.exports = etudiantController;

const Etablissement = require('../models/etablissementModel');
const bcrypt = require('bcryptjs');

const etablissementController = {
  // Lister tous les établissements
  getAll: async (req, res) => {
    try {
      const etablissements = await Etablissement.getAll();
      res.json(etablissements);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des établissements',
        error: error.message 
      });
    }
  },

  // Obtenir un établissement spécifique
  getById: async (req, res) => {
    try {
      const etablissement = await Etablissement.getById(req.params.id);
      
      
      if (!etablissement) {
        return res.status(404).json({ message: 'Établissement non trouvé' });
      }
      
      res.json(etablissement);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération de l\'établissement',
        error: error.message 
      });
    }
  },

  // Créer un nouvel établissement
  create: async (req, res) => {
    try {
      const { nom, email, mot_de_passe } = req.body;
    
      if (!nom || !email || !mot_de_passe) {
        return res.status(400).json({ message: 'Nom, email et mot de passe sont requis' });
      }
      
      // Vérifier si l'email existe déjà
      const emailExists = await Etablissement.emailExists(email);
      if (emailExists) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
      
      const newEtablissement = await Etablissement.create(req.body);
      
      res.status(201).json({
        message: 'Établissement créé avec succès',
        etablissement: newEtablissement
      });
    } catch (error) {
      res.status(400).json({ 
        message: 'Erreur lors de la création de l\'établissement',
        error: error.message 
      });
    }
  },

  // Mettre à jour un établissement
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { email, mot_de_passe } = req.body;
      
      if (email) {
        // Vérifier si le nouvel email existe déjà pour un autre établissement
        const emailExists = await Etablissement.emailExists(email, id);
        if (emailExists) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre établissement' });
        }
      }
      
      let dataToUpdate = { ...req.body };
      if (mot_de_passe) {
        dataToUpdate.mot_de_passe = await bcrypt.hash(mot_de_passe, 10);
      }
      
      const updatedEtablissement = await Etablissement.update(id, dataToUpdate);
      
      res.json({
        message: 'Établissement mis à jour avec succès',
        etablissement: updatedEtablissement
      });
    } catch (error) {
      res.status(400).json({ 
        message: 'Erreur lors de la mise à jour de l\'établissement',
        error: error.message 
      });
    }
  },

  // Supprimer un établissement
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      await Etablissement.delete(id);
      
      res.json({ message: 'Établissement supprimé avec succès' });
    } catch (error) {
      const statusCode = error.message.includes('associés') ? 409 : 400;
      res.status(statusCode).json({ 
        message: 'Erreur lors de la suppression de l\'établissement',
        error: error.message 
      });
    }
  },

  // Récupérer les étudiants d'un établissement
  getEtudiants: async (req, res) => {
    try {
      const { id } = req.params;
      
      const etudiants = await Etablissement.getEtudiants(id);
      
      res.json(etudiants);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des étudiants',
        error: error.message 
      });
    }
  }
};

module.exports = etablissementController;
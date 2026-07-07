const bcrypt = require('bcryptjs');
const Entreprise = require('../models/entrepriseModel');

const entrepriseController = {
  // Lister toutes les entreprises
  getAll: async (req, res) => {
    try {
      const entreprises = await Entreprise.getAll();
      res.json(entreprises);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des entreprises',
        error: error.message 
      });
    }
  },

  // Obtenir une entreprise spécifique
  getById: async (req, res) => {
    try {
      const entreprise = await Entreprise.getById(req.params.id);
      
      if (!entreprise) {
        return res.status(404).json({ message: 'Entreprise non trouvée' });
      }
      
      res.json(entreprise);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération de l\'entreprise',
        error: error.message 
      });
    }
  },

  // Créer une nouvelle entreprise
  create: async (req, res) => {
    try {
      const { nom, mail, mot_de_passe } = req.body;
      
      if (!nom || !mail || !mot_de_passe) {
        return res.status(400).json({ message: 'Nom, mail et mot de passe sont requis' });
      }
      
      // Vérifier si l'email existe déjà
      const emailExists = await Entreprise.emailExists(mail);
      if (emailExists) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      const hashedPassword = await bcrypt.hash(mot_de_passe, 12);
      const newEntreprise = await Entreprise.create({ ...req.body, mot_de_passe: hashedPassword });
      
      res.status(201).json({
        message: 'Entreprise créée avec succès',
        entreprise: newEntreprise
      });
    } catch (error) {
      res.status(400).json({ 
        message: 'Erreur lors de la création de l\'entreprise',
        error: error.message 
      });
    }
  },

  // Mettre à jour une entreprise
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { mail, mot_de_passe } = req.body;
      if (mail) {
        // Vérifier si le nouvel email existe déjà pour une autre entreprise
        const emailExists = await Entreprise.emailExists(mail, id);
        if (emailExists) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé par une autre entreprise' });
        }
      }
      // Si un nouveau mot de passe est fourni, on le hash
      let dataToUpdate = { ...req.body };
      if (mot_de_passe) {
        dataToUpdate.mot_de_passe = await bcrypt.hash(mot_de_passe, 10);
      }
      const updatedEntreprise = await Entreprise.update(id, dataToUpdate);
      res.json({
        message: 'Entreprise mise à jour avec succès',
        entreprise: updatedEntreprise
      });
    } catch (error) {
      res.status(400).json({
        message: 'Erreur lors de la mise à jour de l\'entreprise',
        error: error.message
      });
    }
  },

  // Supprimer une entreprise
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      await Entreprise.delete(id);
      
      res.json({ message: 'Entreprise supprimée avec succès' });
    } catch (error) {
      const statusCode = error.message.includes('associés') ? 409 : 400;
      res.status(statusCode).json({ 
        message: 'Erreur lors de la suppression de l\'entreprise',
        error: error.message 
      });
    }
  },

  // Rechercher des entreprises
  search: async (req, res) => {
    try {
      const { nom, ville, secteur } = req.query;
      
      const entreprises = await Entreprise.search({ nom, ville, secteur });
      
      res.json(entreprises);
    } catch (error) {
      res.status(400).json({ 
        message: 'Erreur lors de la recherche des entreprises',
        error: error.message 
      });
    }
  },

  // Authentifier une entreprise
  authenticate: async (req, res) => {
    try {
      const { mail, mot_de_passe } = req.body;
      
      if (!mail || !mot_de_passe) {
        return res.status(400).json({ message: 'Email et mot de passe sont requis' });
      }
      
      const entreprise = await Entreprise.authenticate(mail, mot_de_passe);
      
      res.json({
        message: 'Authentification réussie',
        entreprise
      });
    } catch (error) {
      res.status(401).json({ 
        message: 'Échec de l\'authentification',
        error: error.message 
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Champs manquants.' });
      }

      // 1. Récupérer l'entreprise
      const entreprise = await Entreprise.getById(id);
      if (!entreprise) {
        return res.status(404).json({ message: 'Entreprise non trouvée.' });
      }

      // 2. Vérifier l'ancien mot de passe
      const isMatch = await bcrypt.compare(oldPassword, entreprise.mot_de_passe);
      if (!isMatch) {
        return res.status(401).json({ message: 'Ancien mot de passe incorrect.' });
      }

      // 3. Hasher le nouveau mot de passe
      const hashed = await bcrypt.hash(newPassword, 10);

      // 4. Mettre à jour le mot de passe
      await Entreprise.update(id, { mot_de_passe: hashed });

      res.json({ message: 'Mot de passe modifié avec succès.' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors du changement de mot de passe', error: error.message });
    }
  }
};

module.exports = entrepriseController;
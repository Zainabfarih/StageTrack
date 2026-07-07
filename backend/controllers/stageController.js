const Stage = require('../models/stageModel');

const stageController = {
  // Lister tous les stages
  getAll: async (req, res) => {
    try {
      const { page = 1, pageSize = 10, domaine, type, entreprise, niveau } = req.query;

      const result = await Stage.getAll({
        page,
        pageSize,
        domaine,
        type,
        entreprise,
        niveau,
      });
      
      res.json({
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des stages',
        error: error.message 
      });
    }
  },

  // Obtenir un stage spécifique
  getById: async (req, res) => {
    try {
      const stage = await Stage.getById(req.params.id);
      
      if (!stage) {
        return res.status(404).json({ message: 'Stage non trouvé' });
      }
      
      res.json(stage);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération du stage',
        error: error.message 
      });
    }
  },

  // Créer un nouveau stage
  create: async (req, res) => {
    try {
      const { titre, type_stage, id_entreprise } = req.body;

      if (!titre || !type_stage || !id_entreprise) {
        return res.status(400).json({
          message: 'Titre, type de stage et entreprise sont obligatoires',
        });
      }

      const newStage = await Stage.create(req.body);
      
      res.status(201).json({
        message: 'Stage créé avec succès',
        stage: newStage
      });
    } catch (error) {
      res.status(400).json({ 
        message: 'Erreur lors de la création du stage',
        error: error.message 
      });
    }
  },

  // Mettre à jour un stage
  update: async (req, res) => {
    try {
      const { id } = req.params;
      
      const updated = await Stage.update(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: 'Stage non trouvé' });
      }
      
      res.json({ 
        message: 'Stage mis à jour avec succès',
        stageId: id 
      });
    } catch (error) {
      res.status(400).json({ 
        message: 'Erreur lors de la mise à jour du stage',
        error: error.message 
      });
    }
  },

  // Supprimer un stage
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      await Stage.delete(id);
      
      res.json({ message: 'Stage supprimé avec succès' });
    } catch (error) {
      const statusCode = error.message.includes('associées') ? 409 : 400;
      res.status(statusCode).json({ 
        message: 'Erreur lors de la suppression du stage',
        error: error.message 
      });
    }
  },
  // definir la date limite de classement par l'admin de l'entreprise
  setDateLimite: async (req, res) => {
    try {
      const { dateLimite } = req.body;
      const { IdStage } = req.params;

      if (!dateLimite) {
        return res.status(400).json({ message: 'Date limite est requise' });
      }

      await Stage.setDateLimite(dateLimite, IdStage);

      res.json({ message: 'Date limite mise à jour avec succès' });
    } catch (error) {
      res.status(400).json({ 
        message: 'Erreur lors de la mise à jour de la date limite',
        error: error.message 
      });
    }
  },
  // Récupérer les stages d'une entreprise
  getByEntreprise: async (req, res) => {
    try {
      const stages = await Stage.getByEntreprise(req.params.id_entreprise);
      res.json(stages);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des stages',
        error: error.message 
      });
    }
  },
  // Obtenir des statistiques sur les stages
  getStats: async (req, res) => {
    try {
      const stats = await Stage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message 
      });
    }
  },
  // Définir la date limite pour TOUS les stages (admin université)
  setDateLimiteAll: async (req, res) => {
    try {
      const { dateLimite } = req.body;
      if (!dateLimite) {
        return res.status(400).json({ message: 'Date limite est requise' });
      }
      await Stage.setDateLimiteAll(dateLimite);
      res.json({ message: 'Date limite mise à jour pour tous les stages' });
    } catch (error) {
      res.status(400).json({
        message: 'Erreur lors de la mise à jour de la date limite',
        error: error.message
      });
    }
  },

  // Récupérer les dates limites de classement par niveau
  getDeadlines: async (req, res) => {
    try {
      res.json(await Stage.getDeadlines());
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des dates limites', error: error.message });
    }
  },

  // Définir la date limite de classement d'un niveau (admin université)
  setDeadline: async (req, res) => {
    try {
      const { niveau } = req.params;
      const { dateLimite } = req.body;
      await Stage.setDeadline(niveau, dateLimite || null);
      res.json({ message: 'Date limite mise à jour pour le niveau ' + niveau });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la mise à jour de la date limite', error: error.message });
    }
  }
};

module.exports = stageController;
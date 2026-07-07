const TacheModel = require('../models/tacheModel');

const tacheController = {
  // Récupérer les tâches d'un stage
  getByStage: async (req, res) => {
    try {
      const tasks = await TacheModel.getByStage(req.params.Idstage);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des tâches',
        error: error.message 
      });
    }
  },

  // Obtenir une tâche spécifique
  getById: async (req, res) => {
    try {
      const task = await TacheModel.getById(req.params.IdTache);
      
      if (!task) {
        return res.status(404).json({ message: 'Tâche non trouvée' });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération de la tâche',
        error: error.message 
      });
    }
  },

  // Créer une nouvelle tâche
  create: async (req, res) => {
    try {
      const { titre, id_stage } = req.body;

      if (!titre || !id_stage) {
        return res.status(400).json({
          message: 'Le titre et l\'ID du stage sont obligatoires',
        });
      }

      const newTask = await TacheModel.create(req.body);

      res.status(201).json({
        message: 'Tâche créée avec succès',
        task: newTask,
      });
    } catch (error) {
      res.status(400).json({
        message: 'Erreur lors de la création de la tâche',
        error: error.message,
      });
    }
  },

  // Récupérer les tâches d'un étudiant
  getByEtudiant: async (req, res) => {
    try {
      const tasks = await TacheModel.getByEtudiant(req.params.id_etudiant);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({
        message: 'Erreur lors de la récupération des tâches',
        error: error.message,
      });
    }
  },

  // Mettre à jour une tâche
  update: async (req, res) => {
    try {
      const updated = await TacheModel.update(req.params.IdTache, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: 'Tâche non trouvée' });
      }
      
      res.json({ 
        message: 'Tâche mise à jour avec succès',
        taskId: req.params.IdTache 
      });
    } catch (error) {
      res.status(400).json({ 
        message: 'Erreur lors de la mise à jour de la tâche',
        error: error.message 
      });
    }
  },

  // Marquer une tâche comme terminée
  markAsDone: async (req, res) => {
    try {
      const updated = await TacheModel.markAsDone(req.params.IdTache);
      
      if (!updated) {
        return res.status(404).json({ message: 'Tâche non trouvée' });
      }
      
      res.json({ 
        message: 'Tâche marquée comme terminée',
        taskId: req.params.IdTache 
      });
    } catch (error) {
      res.status(400).json({ 
        message: 'Erreur lors de la mise à jour de la tâche',
        error: error.message 
      });
    }
  },

  // Supprimer une tâche
  delete: async (req, res) => {
    try {
      const deleted = await TacheModel.delete(req.params.IdTache);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Tâche non trouvée' });
      }
      
      res.json({ message: 'Tâche supprimée avec succès' });
    } catch (error) {
      res.status(400).json({ 
        message: 'Erreur lors de la suppression de la tâche',
        error: error.message 
      });
    }
  },

  // Obtenir les statistiques des tâches
  getStats: async (req, res) => {
    try {
      const stats = await TacheModel.getStats(req.params.Idstage);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message 
      });
    }
  }
};

module.exports = tacheController;
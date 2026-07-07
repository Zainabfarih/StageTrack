const encadrantStage = require('../models/encadrantStageModel');

const encadrantStageController = {
  getByStage: async (req, res) => {
    try {
      res.json(await encadrantStage.getByStage(req.params.IdStage));
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des encadrants', error: error.message });
    }
  },

  getByencadrant: async (req, res) => {
    try {
      const { encadrantType, encadrantId } = req.params;
      if (!['univ', 'entr'].includes(encadrantType)) {
        return res.status(400).json({ message: 'Type d\'encadrant invalide' });
      }
      res.json(await encadrantStage.getByencadrant(encadrantType, encadrantId));
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des stages', error: error.message });
    }
  },

  // Affecter un encadrant (univ ou entreprise) à toutes les affectations d'un stage
  assign: async (req, res) => {
    try {
      const id_stage = req.params.IdStage || req.body.IdStage || req.body.id_stage;
      if (!id_stage) return res.status(400).json({ message: 'Le stage est requis' });

      const count = await encadrantStage.assignToStage(id_stage, {
        id_encadrant_entr: req.body.id_encadrant_entr ?? req.body.Idencadrant_Ent,
        id_encadrant_univ: req.body.id_encadrant_univ ?? req.body.Idencadrant_univ,
      });
      res.status(201).json({ message: 'Encadrant(s) affecté(s) avec succès', updated: count });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de l\'affectation', error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const deleted = await encadrantStage.removeFromAffectation(req.params.IdEncadStage);
      if (!deleted) return res.status(404).json({ message: 'Affectation non trouvée' });
      res.json({ message: 'Encadrant retiré avec succès' });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la suppression', error: error.message });
    }
  },
};

module.exports = encadrantStageController;

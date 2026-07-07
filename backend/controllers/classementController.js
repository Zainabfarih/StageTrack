const Classements = require('../models/classementModel');

const classementController = {
  getAll: async (req, res) => {
    try {
      res.json(await Classements.getAll());
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des classements', error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const classement = await Classements.getById(req.params.IdClassement);
      if (!classement) return res.status(404).json({ message: 'Vœu non trouvé' });
      res.json(classement);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération du vœu', error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { id_etudiant, id_stage, rang } = req.body;
      if (!id_etudiant || !id_stage || rang === undefined) {
        return res.status(400).json({ message: 'id_etudiant, id_stage et rang sont requis' });
      }

      const applicable = await Classements.canApply(id_etudiant, id_stage);
      if (!applicable.ok) {
        return res.status(400).json({ message: applicable.reason });
      }

      const dateCheck = await Classements.checkDeadlineByNiveau(id_etudiant);
      if (dateCheck.estDepassee) {
        return res.status(400).json({ message: `La date limite (${dateCheck.dateLimite.toLocaleDateString()}) est dépassée` });
      }

      const newClassement = await Classements.create({ id_etudiant, id_stage, rang });
      res.status(201).json({ message: 'Vœu enregistré avec succès', classement: newClassement });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la création du vœu', error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { rang } = req.body;
      const classement = await Classements.getById(req.params.IdClassement);
      if (!classement) return res.status(404).json({ message: 'Vœu non trouvé' });

      const dateCheck = await Classements.checkDeadlineByNiveau(classement.id_etudiant);
      if (dateCheck.estDepassee) {
        return res.status(400).json({ message: `La date limite (${dateCheck.dateLimite.toLocaleDateString()}) est dépassée` });
      }

      const updated = await Classements.update(req.params.IdClassement, { rang });
      res.json({ message: 'Vœu mis à jour avec succès', classement: updated });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la mise à jour du vœu', error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await Classements.delete(req.params.IdClassement);
      res.json({ message: 'Vœu supprimé avec succès' });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la suppression du vœu', error: error.message });
    }
  },

  getByEtudiant: async (req, res) => {
    try {
      res.json(await Classements.getByEtudiant(req.params.IdEtudiant));
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des vœux', error: error.message });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { idEtudiant } = req.params;
      const { statut } = req.body;
      if (!statut) return res.status(400).json({ message: 'Le statut est requis' });
      await Classements.updateStatus(idEtudiant, statut);
      res.json({ message: 'Statut mis à jour avec succès' });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la mise à jour du statut', error: error.message });
    }
  },
};

module.exports = classementController;

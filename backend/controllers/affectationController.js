const Affectation = require('../models/affectationModel');


const stripUnivNotes = (row) => {
  const { note_encadrant_univ, note_finale, ...rest } = row;
  return rest;
};

const validNote = (n) => {
  const v = Number(n);
  return !Number.isNaN(v) && v >= 0 && v <= 20;
};

const NIVEAUX = ['1A', '2A', '3A'];

const affectationController = {
  autoAffectation: async (req, res) => {
    try {
      const niveau = req.params.niveau;
      if (!NIVEAUX.includes(niveau)) {
        return res.status(400).json({ message: 'Niveau invalide (1A, 2A ou 3A)' });
      }
      const status = await Affectation.getStatus(niveau);
      if (status.phase === 'suivi') {
        return res.status(409).json({
          message: `La campagne du niveau ${niveau} est clôturée (délai de désistement dépassé). Relancer effacerait le suivi.`,
        });
      }
      const result = await Affectation.autoAffect(niveau);
      res.json({
        message: `Affectation ${niveau} terminée`,
        niveau,
        affectees: result.affectations.length,
        non_affectees: result.nonAffectes.length,
        ...result,
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de l\'affectation', error: error.message });
    }
  },

  // Statut des campagnes par niveau 
  getStatus: async (req, res) => {
    try {
      res.json(await Affectation.getStatusAll());
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      res.json(await Affectation.getAll());
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Suivi côté entreprise 
  getByEntreprise: async (req, res) => {
    try {
      const rows = await Affectation.getByEntreprise(req.params.idEntreprise);
      res.json(rows.map(stripUnivNotes));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  assignencadrants: async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await Affectation.update(id, {
        id_encadrant_entr: req.body.id_encadrant_entr,
        id_encadrant_univ: req.body.id_encadrant_univ,
      });
      res.json({ message: 'Encadrants affectés avec succès', affectation: updated });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Note de l'encadrant entreprise
  setNoteEntr: async (req, res) => {
    try {
      const { note } = req.body;
      if (!validNote(note)) return res.status(400).json({ message: 'La note doit être comprise entre 0 et 20' });
      const aff = await Affectation.getById(req.params.id);
      if (!aff) return res.status(404).json({ message: 'Affectation non trouvée' });
      const role = req.userRole;
      const uid = Number(req.userId);
      const allowed =
        (role === 'ENCADRANT_ENTREPRISE' && Number(aff.id_encadrant_entr) === uid) ||
        (role === 'ADMIN_ENTREPRISE' && Number(aff.id_entreprise) === uid);
      if (!allowed) return res.status(403).json({ message: 'Vous ne pouvez pas noter ce stagiaire' });
      const updated = await Affectation.setNoteencadrant(req.params.id, 'entr', Number(note));
      res.json({ message: 'Note enregistrée', affectation: updated });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Note de l'encadrant université
  setNoteUniv: async (req, res) => {
    try {
      const { note } = req.body;
      if (!validNote(note)) return res.status(400).json({ message: 'La note doit être comprise entre 0 et 20' });
      const aff = await Affectation.getById(req.params.id);
      if (!aff) return res.status(404).json({ message: 'Affectation non trouvée' });
      const role = req.userRole;
      const uid = Number(req.userId);
      const allowed =
        (role === 'ENCADRANT_UNIV' && Number(aff.id_encadrant_univ) === uid) ||
        role === 'ADMIN_UNIV';
      if (!allowed) return res.status(403).json({ message: 'Vous ne pouvez pas noter ce stagiaire' });
      const updated = await Affectation.setNoteencadrant(req.params.id, 'univ', Number(note));
      res.json({ message: 'Note enregistrée', affectation: updated });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Désistement d'un étudiant 
  desister: async (req, res) => {
    try {
      
      const isStudent = req.userRole === 'ETUDIANT';
      const id_etudiant = isStudent ? req.userId : (req.body.id_etudiant || req.userId);
      if (!id_etudiant) return res.status(400).json({ message: 'Étudiant requis' });
      const result = await Affectation.desister(id_etudiant);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};

module.exports = affectationController;

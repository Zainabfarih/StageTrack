const encadrantEntr = require('../models/encadrantEntrModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const EmailService = require('../services/emailService');

const emailService = new EmailService();
const generateTempPassword = () =>
  crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) + 'A1!';

const encadrantEntrController = {
  getAll: async (req, res) => {
    try {
      const result = await encadrantEntr.getAll();
      res.json({ data: result.data, total: result.total });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des encadrants', error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const encadrant = await encadrantEntr.getById(req.params.id);
      if (!encadrant) return res.status(404).json({ message: 'encadrant non trouvé' });
      res.json(encadrant);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération de l\'encadrant', error: error.message });
    }
  },

  // Création par l'admin entreprise → mot de passe temporaire envoyé par email
  create: async (req, res) => {
    try {
      const { nom, prenom, mail, id_entreprise } = req.body;
      if (!nom || !prenom || !mail || !id_entreprise) {
        return res.status(400).json({ message: 'Nom, prénom, mail et entreprise sont obligatoires' });
      }

      const tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);
      const newencadrant = await encadrantEntr.create({ ...req.body, mot_de_passe: hashedPassword });

      // Email envoyé en arrière-plan 
      emailService.sendTemporaryPasswordEmail(mail, tempPassword, `${prenom} ${nom}`)
        .catch((e) => console.error('Erreur email mot de passe temporaire:', e.message));

      res.status(201).json({ message: 'Encadrant créé. Mot de passe temporaire envoyé par email.', encadrant: newencadrant });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la création de l\'encadrant', error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.mot_de_passe) data.mot_de_passe = await bcrypt.hash(data.mot_de_passe, 12);
      const updated = await encadrantEntr.update(req.params.id, data);
      if (!updated) return res.status(404).json({ message: 'encadrant non trouvé' });
      res.json({ message: 'Encadrant mis à jour avec succès', encadrantId: req.params.id });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la mise à jour de l\'encadrant', error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await encadrantEntr.delete(req.params.id);
      res.json({ message: 'Encadrant supprimé avec succès' });
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la suppression de l\'encadrant', error: error.message });
    }
  },

  getByEntreprise: async (req, res) => {
    try {
      res.json(await encadrantEntr.getByEntreprise(req.params.id_entreprise));
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des encadrants', error: error.message });
    }
  },
};

module.exports = encadrantEntrController;

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const encadrantUniv = require('../models/encadrantUnivModel');
const EmailService = require('../services/emailService');

const emailService = new EmailService();
const generateTempPassword = () =>
  crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) + 'A1!';

const encadrantUnivController = {

  getAll: async (req, res) => {
    try {
      const encadrants = await encadrantUniv.getAll();
      res.json(encadrants);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const encadrant = await encadrantUniv.getById(req.params.id);
      if (!encadrant) return res.status(404).json({ message: 'encadrant non trouvé' });
      res.json(encadrant);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ─── Créer un encadrant (par l'admin) ─────────────────────────────────────

  create: async (req, res) => {
    try {
      const { nom, prenom, mail, id_universite } = req.body;

      if (!nom || !prenom || !mail || !id_universite) {
        return res.status(400).json({
          message: 'Nom, prénom, mail et id_universite sont obligatoires',
        });
      }

      const tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      const newencadrant = await encadrantUniv.create({
        nom: nom.trim(),
        prenom: prenom.trim(),
        mail: mail.trim().toLowerCase(),
        mot_de_passe: hashedPassword,
        tel: req.body.tel || null,
        specialite: req.body.specialite || null,
        grade: req.body.grade || null,
        id_universite: Number(id_universite),
      });

      // Email en arrière-plan 
      emailService.sendTemporaryPasswordEmail(mail, tempPassword, `${prenom} ${nom}`)
        .catch((e) => console.error('Erreur email mot de passe temporaire:', e.message));

      res.status(201).json({
        message: 'Encadrant créé. Mot de passe temporaire envoyé par email.',
        encadrant: newencadrant,
      });
    } catch (error) {
      res.status(400).json({
        message: "Erreur lors de la création de l'encadrant",
        error: error.message,
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      let dataToUpdate = { ...req.body };

      if (dataToUpdate.mot_de_passe) {
        dataToUpdate.mot_de_passe = await bcrypt.hash(dataToUpdate.mot_de_passe, 12);
      }

      const updated = await encadrantUniv.update(id, dataToUpdate);
      if (!updated) return res.status(404).json({ message: 'encadrant non trouvé' });

      res.json({ message: 'encadrant mis à jour avec succès', encadrantId: id });
    } catch (error) {
      res.status(400).json({
        message: "Erreur lors de la mise à jour de l'encadrant",
        error: error.message,
      });
    }
  },

  delete: async (req, res) => {
    try {
      await encadrantUniv.delete(req.params.id);
      res.json({ message: 'encadrant supprimé avec succès' });
    } catch (error) {
      const statusCode = error.message.includes('associés') ? 409 : 400;
      res.status(statusCode).json({
        message: "Erreur lors de la suppression de l'encadrant",
        error: error.message,
      });
    }
  },
};

module.exports = encadrantUnivController;

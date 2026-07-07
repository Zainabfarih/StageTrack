const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Auth = require('../models/authModel');
const User = require('../models/userModel');
const config = require('../config/auth.config');
const TokenService = require('../services/tokenService');
const EmailService = require('../services/emailService');
const { executeQuery } = require('../models/db');

const ROLE_TABLE_MAP = {
  [config.roles.ETUDIANT]:             'etudiant',
  [config.roles.ENCADRANT_UNIV]:       'encadrant_univ',
  [config.roles.ENCADRANT_ENTREPRISE]: 'encadrant_entr',
  [config.roles.ADMIN_UNIV]:           'etablissement',
  [config.roles.ADMIN_ENTREPRISE]:     'entreprise',
};

// Seule une entreprise peut s'inscrire publiquement.
// L'admin universitaire est unique et créé par le seed.
const PUBLIC_REGISTER_ROLES = [config.roles.ADMIN_ENTREPRISE];

const ALL_TABLES = ['etablissement', 'entreprise', 'encadrant_univ', 'encadrant_entr', 'etudiant'];

const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5;
const LOCK_MINUTES = 30;

const emailService = new EmailService();

const generateTempPassword = () =>
  crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) + 'A1!';

const authController = {
  // ─── Connexion ─────────────────────────────────────────────────────────────
  signin: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis' });

      const userAgent = req.get('User-Agent') || '';
      const ip = req.ip;

      const user = await Auth.findByEmail(email);
      if (!user) return res.status(401).json({ message: 'Aucun utilisateur avec cet email' });

      const table = ROLE_TABLE_MAP[user.role];

      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return res.status(423).json({ message: 'Compte temporairement verrouillé. Réessayez plus tard.' });
      }

      const passwordIsValid = bcrypt.compareSync(password, user.password);
      if (!passwordIsValid) {
        const attempts = (user.login_attempts || 0) + 1;
        const locked = attempts >= MAX_ATTEMPTS;
        await executeQuery(
          `UPDATE ${table} SET login_attempts = :attempts,
             locked_until = ${locked ? `DATE_ADD(NOW(), INTERVAL ${LOCK_MINUTES} MINUTE)` : 'NULL'}
           WHERE id = :id`,
          { attempts, id: user.id },
        );
        return res.status(401).json({ message: 'Mot de passe incorrect' });
      }

      if (!user.is_verified) {
        return res.status(403).json({ message: 'Compte non vérifié. Consultez votre email.', code: 'NOT_VERIFIED' });
      }

      await executeQuery(
        `UPDATE ${table} SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = :id`,
        { id: user.id },
      );

      const accessToken = TokenService.generateAccessToken({ id: user.id, uuid: user.uuid, role: user.role, email: user.email });
      const refreshToken = await TokenService.generateRefreshToken(user.id, user.role, userAgent, ip);
      const profile = await User.getUserProfile(user.id, user.role);

      res.status(200).json({
        id: user.id,
        uuid: user.uuid,
        role: user.role,
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
        needsPasswordChange: !!user.needs_password_change,
        profileCompleted: !!user.profile_completed,
        profile,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ─── Rafraîchissement token ────────────────────────────────────────────────
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const userAgent = req.get('User-Agent') || '';
      if (!refreshToken) return res.status(401).json({ message: 'Refresh token requis' });

      const rotated = await TokenService.verifyAndRotateRefreshToken(refreshToken, userAgent, req.ip);
      const rows = await executeQuery(
        'SELECT uuid, email FROM users_auth WHERE id = :id AND role = :role',
        { id: rotated.userId, role: rotated.role },
      );
      const { uuid, email } = rows[0] || {};

      const newAccessToken = TokenService.generateAccessToken({ id: rotated.userId, uuid, role: rotated.role, email });
      res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: rotated.token,
        tokenType: 'Bearer',
        expiresIn: 900,
      });
    } catch (error) {
      res.status(401).json({ message: 'Token invalide ou expiré' });
    }
  },

  // ─── Déconnexion ───────────────────────────────────────────────────────────
  logout: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) await TokenService.revokeRefreshToken(refreshToken);
      res.status(200).json({ message: 'Déconnexion réussie' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ─── Inscription publique (entreprise uniquement) ──────────────────────────
  register: async (req, res) => {
    try {
      const { email, password, nom, secteur, ville, responsable, tel, adresse, site_web, taille_entreprise } = req.body;

      if (!email || !password || password.length < 8) {
        return res.status(400).json({ message: 'Email et mot de passe (8 caractères min) requis' });
      }
      if (!nom) {
        return res.status(400).json({ message: 'Le nom de l\'entreprise est requis' });
      }

      const existingUser = await Auth.findByEmail(email);
      if (existingUser) return res.status(409).json({ message: 'Cet email est déjà utilisé' });

      const hashedPassword = await Auth.hashPassword(password);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      
      const result = await executeQuery(
        `INSERT INTO entreprise
           (nom, secteur, ville, responsable, tel, adresse, site_web, taille_entreprise,
            mail, mot_de_passe, verification_token, verification_token_expires, is_verified, profile_completed)
         VALUES
           (:nom, :secteur, :ville, :responsable, :tel, :adresse, :site_web, :taille,
            :email, :pwd, :token, :expires, 0, 1)`,
        {
          nom, secteur: secteur || null, ville: ville || null, responsable: responsable || null,
          tel: tel || null, adresse: adresse || null, site_web: site_web || null, taille: taille_entreprise || null,
          email, pwd: hashedPassword, token: verificationToken, expires,
        },
      );

      try {
        await emailService.sendVerificationEmail(email, verificationToken, nom);
      } catch (e) {
        console.error('Erreur email vérification:', e.message);
      }

      res.status(201).json({
        id: result.insertId,
        email,
        role: config.roles.ADMIN_ENTREPRISE,
        message: 'Compte créé. Vérifiez votre email pour l\'activer.',
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ─── Vérification email ────────────────────────────────────────────────────
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) return res.status(400).json({ message: 'Token de vérification requis' });

      for (const table of ALL_TABLES) {
        const result = await executeQuery(
          `UPDATE ${table}
             SET is_verified = 1, verification_token = NULL, verification_token_expires = NULL
           WHERE verification_token = :token AND verification_token_expires > NOW() AND is_verified = 0`,
          { token },
        );
        if (result.affectedRows > 0) return res.status(200).json({ message: 'Email vérifié avec succès !' });
      }
      res.status(400).json({ message: 'Token invalide, expiré ou déjà utilisé' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ─── Renvoi de l'email de vérification ──────────────────────────────────────
  resendVerification: async (req, res) => {
    try {
      const { email } = req.body;
      const SAFE_MSG = { message: 'Si un compte non vérifié existe, un email a été renvoyé.' };
      if (!email) return res.status(400).json({ message: 'Email requis' });

      const user = await Auth.findByEmail(email);
      if (!user || user.is_verified) return res.status(200).json(SAFE_MSG);

      const table = ROLE_TABLE_MAP[user.role];
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await executeQuery(
        `UPDATE ${table} SET verification_token = :token, verification_token_expires = :expires WHERE id = :id`,
        { token: verificationToken, expires, id: user.id },
      );

      try {
        await emailService.sendVerificationEmail(email, verificationToken);
      } catch (e) {
        console.error('Erreur renvoi email vérification:', e.message);
      }
      res.status(200).json(SAFE_MSG);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ─── Demande de réinitialisation ───────────────────────────────────────────
  requestPasswordReset: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: 'Email requis' });

      const user = await Auth.findByEmail(email);
      if (!user) return res.status(404).json({ message: 'Aucun utilisateur avec cet email' });

      const table = ROLE_TABLE_MAP[user.role];
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await executeQuery(
        `UPDATE ${table} SET reset_token = :resetToken, reset_token_expires = :expiresAt WHERE id = :id`,
        { resetToken, expiresAt, id: user.id },
      );

      try {
        await emailService.sendPasswordResetEmail(email, resetToken);
      } catch (e) {
        console.error('Erreur email reset:', e.message);
      }
      res.status(200).json({ message: 'Un lien de réinitialisation a été envoyé à votre email.' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ─── Réinitialisation effective ────────────────────────────────────────────
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
      if (newPassword.length < 8) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });

      const hashedPassword = bcrypt.hashSync(newPassword, config.bcryptRounds);
      for (const table of ALL_TABLES) {
        const result = await executeQuery(
          `UPDATE ${table}
             SET mot_de_passe = :pwd, reset_token = NULL, reset_token_expires = NULL, needs_password_change = 0
           WHERE reset_token = :token AND reset_token_expires > NOW()`,
          { pwd: hashedPassword, token },
        );
        if (result.affectedRows > 0) return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
      }
      res.status(400).json({ message: 'Token invalide ou expiré' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ─── Changement de mot de passe forcé (1re connexion) ──────────────────────
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.userId;
      const role = req.userRole;

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
      }
      const table = ROLE_TABLE_MAP[role];
      if (!table) return res.status(400).json({ message: 'Rôle non valide' });

      const rows = await executeQuery(`SELECT mot_de_passe, needs_password_change FROM ${table} WHERE id = :id`, { id: userId });
      if (!rows.length) return res.status(404).json({ message: 'Utilisateur non trouvé' });

      // currentPassword exigé seulement hors changement forcé
      if (!rows[0].needs_password_change) {
        if (!currentPassword || !bcrypt.compareSync(currentPassword, rows[0].mot_de_passe)) {
          return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
        }
      }

      const hashedPassword = bcrypt.hashSync(newPassword, config.bcryptRounds);
      await executeQuery(
        `UPDATE ${table} SET mot_de_passe = :pwd, needs_password_change = 0 WHERE id = :id`,
        { pwd: hashedPassword, id: userId },
      );
      res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ─── Création d'un étudiant par l'admin (mot de passe temporaire) ──────────
  createStudent: async (req, res) => {
    try {
      const tempPassword = req.body.password || generateTempPassword();
      const hashedPassword = bcrypt.hashSync(tempPassword, config.bcryptRounds);
      const student = await Auth.createStudent({ ...req.body, mot_de_passe: hashedPassword });

      try {
        await emailService.sendTemporaryPasswordEmail(req.body.mail, tempPassword, `${req.body.prenom || ''} ${req.body.nom || ''}`.trim());
      } catch (e) {
        console.error('Erreur email mot de passe temporaire:', e.message);
      }
      res.status(201).json({ ...student, message: 'Étudiant créé. Mot de passe temporaire envoyé par email.' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ─── Profil connecté ───────────────────────────────────────────────────────
  getProfile: async (req, res) => {
    try {
      const profile = await User.getUserProfile(req.userId, req.userRole);
      res.status(200).json(profile);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ─── Compléter le profil ───────────────────────────────────────────────────
  completeProfile: async (req, res) => {
    try {
      const role = req.userRole;
      const userId = req.userId;
      const { role: _ignored, ...profileData } = req.body;

      const table = ROLE_TABLE_MAP[role];
      if (!table) return res.status(400).json({ message: 'Rôle non valide' });

      const fields = [];
      const values = {};
      for (const [key, value] of Object.entries(profileData)) {
        fields.push(`${key} = :${key}`);
        values[key] = value;
      }
      fields.push('profile_completed = 1');
      values.id = userId;

      const result = await executeQuery(`UPDATE ${table} SET ${fields.join(', ')} WHERE id = :id`, values);
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
      res.status(200).json({ message: 'Profil complété avec succès' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = authController;

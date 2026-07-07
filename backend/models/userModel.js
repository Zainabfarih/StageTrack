const { executeQuery } = require('./db');
const config = require('../config/auth.config');

const User = {
  
  async getUserProfile(userId, role) {
    const tableMap = {
      [config.roles.ETUDIANT]: 'etudiant',
      [config.roles.ENCADRANT_UNIV]: 'encadrant_univ',
      [config.roles.ENCADRANT_ENTREPRISE]: 'encadrant_entr',
      [config.roles.ADMIN_ENTREPRISE]: 'entreprise',
      [config.roles.ADMIN_UNIV]: 'etablissement',
    };

    if (!tableMap[role]) {
      throw new Error('Invalid user type');
    }

    const sql = `SELECT * FROM ${tableMap[role]} WHERE id = :id`;
    const results = await executeQuery(sql, { id: userId });

    if (!results[0]) return null;

    // Retirer les champs sensibles
    const {
      mot_de_passe, verification_token, verification_token_expires,
      reset_token, reset_token_expires, mfa_secret, ...userData
    } = results[0];

    return {
      ...userData,
      role,
      profile_completed: !!userData.profile_completed,
      needs_password_change: !!userData.needs_password_change,
      is_verified: !!userData.is_verified,
    };
  },
};

module.exports = User;

const { executeQuery } = require('./db');
const config = require('../config/auth.config');
const bcrypt = require('bcryptjs');

const Auth = {
  findByEmail: async (email) => {
    const sql = 'SELECT * FROM users_auth WHERE email = :email';
    const results = await executeQuery(sql, { email });
    return results[0];
  },

  verifyPassword: async (user, password) => {
    return bcrypt.compareSync(password, user.password);
  },

  hashPassword: async (password) => {
    return bcrypt.hashSync(password, 10);
  },

  
  createStudent: async (studentData) => {
    const sql = `
      INSERT INTO etudiant
        (nom, prenom, date_naissance, sexe, adresse, ville, tel, mail,
         mot_de_passe, niveau, filiere, id_universite,
         needs_password_change, profile_completed, is_verified)
      VALUES
        (:nom, :prenom, :date_naissance, :sexe, :adresse, :ville, :tel, :mail,
         :mot_de_passe, :niveau, :filiere, :id_universite,
         1, 1, 1)
    `;

    const params = {
      nom:            studentData.nom            || '',
      prenom:         studentData.prenom         || '',
      date_naissance: studentData.date_naissance || null,
      sexe:           studentData.sexe           || null,
      adresse:        studentData.adresse        || null,
      ville:          studentData.ville          || null,
      tel:            studentData.tel            || null,
      mail:           studentData.mail,
      mot_de_passe:   studentData.mot_de_passe,
      niveau:         studentData.niveau         || null,
      filiere:        studentData.filiere        || null,
      id_universite:  studentData.id_universite  || null,
    };

    const result = await executeQuery(sql, params);
    return {
      id: result.insertId,
      ...params,
      needs_password_change: true,
      profile_completed: true,
      role: config.roles.ETUDIANT,
    };
  },
};

module.exports = Auth;

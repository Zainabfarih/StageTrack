const { executeQuery, executeTransaction } = require('./db');

const Etablissement = {
  // Récupérer tous les établissements
  async getAll() {
    const sql = `
      SELECT * FROM etablissement
      ORDER BY nom ASC
    `;
    return executeQuery(sql);
  },

  // Récupérer un établissement par ID
  async getById(id) {
    const sql = 'SELECT * FROM etablissement WHERE id = :id';
    const results = await executeQuery(sql, { id });
    return results[0] || null;
  },

  // Créer un nouvel établissement
  async create(etablissementData) {
    const { nom, type_etablissement, responsable, adresse, ville, tel, mot_de_passe } = etablissementData;
    const mail = etablissementData.mail || etablissementData.email;
    
    const sql = `
      INSERT INTO etablissement 
      (nom, type_etablissement, responsable, adresse, ville, tel, mail, mot_de_passe) 
      VALUES 
      (:nom, :type_etablissement, :responsable, :adresse, :ville, :tel, :mail, :mot_de_passe)
    `;
    
    const params = { 
      nom,
      type_etablissement: type_etablissement || null,
      responsable: responsable || null,
      adresse: adresse || null,
      ville: ville || null,
      tel: tel || null,
      mail,
      mot_de_passe
    };

    const { insertId } = await executeQuery(sql, params);
    return { id: insertId, ...params };
  },

  // Mettre à jour un établissement
  async update(id, etablissementData) {
    // Vérifier si l'établissement existe
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Établissement non trouvé');
    }

    const { nom, type_etablissement, responsable, adresse, ville, tel, mot_de_passe } = etablissementData;
    const mail = etablissementData.mail || etablissementData.email;
    
    const sql = `
      UPDATE etablissement SET
        nom = :nom,
        type_etablissement = :type_etablissement,
        responsable = :responsable,
        adresse = :adresse,
        ville = :ville,
        tel = :tel,
        mail = :mail,
        mot_de_passe = COALESCE(:mot_de_passe, mot_de_passe)
      WHERE id = :id
    `;
    
    const params = { 
      id,
      nom,
      type_etablissement: type_etablissement || null,
      responsable: responsable || null,
      adresse: adresse || null,
      ville: ville || null,
      tel: tel || null,
      mail,
      mot_de_passe: mot_de_passe || null // null => COALESCE garde l'ancien mot de passe
    };

    await executeQuery(sql, params);
    return { id, ...params };
  },

  // Supprimer un établissement
  async delete(id) {
    return executeTransaction(async (connection) => {
      // Vérifier d'abord si l'établissement existe
      const [etablissement] = await connection.query(
        'SELECT 1 FROM etablissement WHERE id = ? LIMIT 1',
        [id]
      );

      if (!etablissement.length) {
        throw new Error('Établissement non trouvé');
      }

      // Vérifier s'il y a des étudiants associés
      const [etudiants] = await connection.query(
        'SELECT 1 FROM etudiant WHERE id_universite = ? LIMIT 1',
        [id]
      );

      if (etudiants.length) {
        throw new Error('Impossible de supprimer - des étudiants sont associés à cet établissement');
      }

      // Supprimer l'établissement
      const [result] = await connection.query(
        'DELETE FROM etablissement WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    });
  },

  // Vérifier si un email existe déjà
  async emailExists(mail, excludeId = null) {
    let sql = 'SELECT 1 FROM etablissement WHERE mail = :mail';
    const params = { mail };

    if (excludeId) {
      sql += ' AND id != :excludeId';
      params.excludeId = excludeId;
    }

    sql += ' LIMIT 1';

    const results = await executeQuery(sql, params);
    return results.length > 0;
  },

  // Récupérer les étudiants d'un établissement
  async getEtudiants(id) {
    const sql = `
      SELECT id, nom, prenom, mail, filiere, niveau 
      FROM etudiant 
      WHERE id_universite = :id
      ORDER BY nom, prenom
    `;
    return executeQuery(sql, { id });
  }
};

module.exports = Etablissement;
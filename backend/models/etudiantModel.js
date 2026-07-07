const { executeQuery, executeTransaction } = require('./db');

const Etudiant = {
  
  // Récupérer tous les étudiants
  async getAll() {
    const sql = `
      SELECT e.*, u.nom AS universite_nom
      FROM etudiant e
      LEFT JOIN etablissement u ON e.id_universite = u.id
      ORDER BY e.nom, e.prenom
    `;
    const rows = await executeQuery(sql);
    return { data: rows, total: rows.length };
  },

  // Récupérer un étudiant par ID
  async getById(id) {
    const sql = `
      SELECT e.*, u.nom AS universite_nom
      FROM etudiant e
      LEFT JOIN etablissement u ON e.id_universite = u.id
      WHERE e.id = :id
    `;
    const results = await executeQuery(sql, { id });
    return results[0] || null;
  },

  // Créer un étudiant (par l'admin)
  async create(etudiantData) {
    const { nom, prenom, mail, mot_de_passe, id_universite } = etudiantData;

    if (!nom || !prenom || !mail || !mot_de_passe) {
      throw new Error('Nom, prénom, mail et mot de passe sont requis');
    }

    if (id_universite) {
      const universite = await executeQuery(
        'SELECT 1 FROM etablissement WHERE id = ? LIMIT 1',
        [id_universite],
      );
      if (!universite.length) throw new Error('Université non trouvée');
    }

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
      nom,
      prenom,
      date_naissance: etudiantData.date_naissance || null,
      sexe:           etudiantData.sexe           || null,
      adresse:        etudiantData.adresse        || null,
      ville:          etudiantData.ville          || null,
      tel:            etudiantData.tel            || null,
      mail,
      mot_de_passe,
      niveau:         etudiantData.niveau         || null,
      filiere:        etudiantData.filiere        || null,
      id_universite:  id_universite               || null,
    };

    const { insertId } = await executeQuery(sql, params);
    return {
      id: insertId,
      ...params,
      needs_password_change: true,
      profile_completed: true,
    };
  },

  // Mettre à jour un étudiant
  async update(id, etudiantData) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Étudiant non trouvé');

    if (etudiantData.id_universite) {
      const universite = await executeQuery(
        'SELECT 1 FROM etablissement WHERE id = ? LIMIT 1',
        [etudiantData.id_universite],
      );
      if (!universite.length) throw new Error('Université non trouvée');
    }

    const sql = `
      UPDATE etudiant SET
        nom            = :nom,
        prenom         = :prenom,
        date_naissance = :date_naissance,
        sexe           = :sexe,
        adresse        = :adresse,
        ville          = :ville,
        tel            = :tel,
        mail           = :mail,
        mot_de_passe   = COALESCE(:mot_de_passe, mot_de_passe),
        niveau         = :niveau,
        filiere        = :filiere,
        id_universite  = :id_universite
      WHERE id = :id
    `;

    const params = {
      id,
      nom:            etudiantData.nom            || existing.nom,
      prenom:         etudiantData.prenom         || existing.prenom,
      date_naissance: etudiantData.date_naissance || existing.date_naissance,
      sexe:           etudiantData.sexe           || existing.sexe,
      adresse:        etudiantData.adresse        || existing.adresse,
      ville:          etudiantData.ville          || existing.ville,
      tel:            etudiantData.tel            || existing.tel,
      mail:           etudiantData.mail           || existing.mail,
      mot_de_passe:   etudiantData.mot_de_passe   || null,
      niveau:         etudiantData.niveau         || existing.niveau,
      filiere:        etudiantData.filiere        || existing.filiere,
      id_universite:  etudiantData.id_universite  || existing.id_universite,
    };

    await executeQuery(sql, params);
    return { id, ...params };
  },

  // Changer le mot de passe + désactiver le flag
  async updatePassword(id, hashedPassword) {
    const sql = `
      UPDATE etudiant
      SET mot_de_passe = :hashedPassword,
          needs_password_change = 0
      WHERE id = :id
    `;
    const { affectedRows } = await executeQuery(sql, { id, hashedPassword });
    if (affectedRows === 0) throw new Error('Étudiant non trouvé');
    return true;
  },

  // Supprimer un étudiant
  async delete(id) {
    return executeTransaction(async (connection) => {
      const [etudiant] = await connection.query(
        'SELECT 1 FROM etudiant WHERE id = ? LIMIT 1', [id],
      );
      if (!etudiant.length) throw new Error('Étudiant non trouvé');

      const [candidatures] = await connection.query(
        'SELECT 1 FROM classement WHERE id_etudiant = ? LIMIT 1', [id],
      );
      if (candidatures.length) {
        throw new Error('Impossible de supprimer - des candidatures sont associées à cet étudiant');
      }

      const [result] = await connection.query('DELETE FROM etudiant WHERE id = ?', [id]);
      return result.affectedRows > 0;
    });
  },

  async emailExists(mail, excludeId = null) {
    let sql = 'SELECT 1 FROM etudiant WHERE mail = :mail';
    const params = { mail };
    if (excludeId) { sql += ' AND id != :excludeId'; params.excludeId = excludeId; }
    sql += ' LIMIT 1';
    const results = await executeQuery(sql, params);
    return results.length > 0;
  },

  async getCandidatures(id) {
    const sql = `
      SELECT c.*, s.titre, s.type_stage, s.date_debut, s.date_fin,
             ent.nom AS entreprise_nom, ent.ville AS entreprise_ville
      FROM classement c
      JOIN stage s ON c.id_stage = s.id
      JOIN entreprise ent ON s.id_entreprise = ent.id
      WHERE c.id_etudiant = :id
      ORDER BY c.rang
    `;
    return executeQuery(sql, { id });
  },

  async updateCv(id, cvPath) {
    const { affectedRows } = await executeQuery(
      'UPDATE etudiant SET cv_pdf = :cvPath WHERE id = :id', { id, cvPath },
    );
    if (affectedRows === 0) throw new Error('Étudiant non trouvé');
    return true;
  },

  async updateLm(id, lmPath) {
    const { affectedRows } = await executeQuery(
      'UPDATE etudiant SET lm_pdf = :lmPath WHERE id = :id', { id, lmPath },
    );
    if (affectedRows === 0) throw new Error('Étudiant non trouvé');
    return true;
  },

  async updateScore(id, score) {
    const { affectedRows } = await executeQuery(
      'UPDATE etudiant SET score = :score WHERE id = :id', { id, score },
    );
    if (affectedRows === 0) throw new Error('Étudiant non trouvé');
    return true;
  },
};

module.exports = Etudiant;

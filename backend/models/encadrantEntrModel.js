const { executeQuery, executeTransaction } = require('./db');

const encadrantEntr = {
  async getAll() {
    const sql = `
      SELECT e.id, e.nom, e.prenom, e.mail, e.tel, e.poste, e.specialite,
             e.id_entreprise, e.profile_completed, e.is_verified,
             ent.nom AS entreprise_nom
      FROM encadrant_entr e
      JOIN entreprise ent ON e.id_entreprise = ent.id
      ORDER BY e.nom, e.prenom
    `;
    const [rows, [total]] = await Promise.all([
      executeQuery(sql),
      executeQuery('SELECT COUNT(*) AS total FROM encadrant_entr'),
    ]);
    return { data: rows, total: total.total };
  },

  async getById(id) {
    const sql = `
      SELECT e.id, e.nom, e.prenom, e.mail, e.tel, e.poste, e.specialite,
             e.id_entreprise, ent.nom AS entreprise_nom, ent.secteur AS entreprise_secteur
      FROM encadrant_entr e
      JOIN entreprise ent ON e.id_entreprise = ent.id
      WHERE e.id = :id
    `;
    const results = await executeQuery(sql, { id });
    return results[0] || null;
  },

  async create(data) {
    const { nom, prenom, mail, mot_de_passe, id_entreprise } = data;
    if (!nom || !prenom || !mail || !mot_de_passe || !id_entreprise) {
      throw new Error('Nom, prénom, mail, mot de passe et entreprise sont obligatoires');
    }

    return executeTransaction(async (connection) => {
      const [entreprise] = await connection.query('SELECT 1 FROM entreprise WHERE id = ? LIMIT 1', [id_entreprise]);
      if (!entreprise.length) throw new Error('Entreprise non trouvée');

      const [existingMail] = await connection.query('SELECT 1 FROM encadrant_entr WHERE mail = ? LIMIT 1', [mail]);
      if (existingMail.length) throw new Error('Cet email est déjà utilisé');

      const [result] = await connection.query(
        `INSERT INTO encadrant_entr
          (nom, prenom, mail, mot_de_passe, tel, poste, specialite, id_entreprise,
           needs_password_change, profile_completed, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1)`,
        [nom, prenom, mail, mot_de_passe, data.tel || null, data.poste || null,
          data.specialite || null, id_entreprise],
      );
      return { id: result.insertId, nom, prenom, mail, id_entreprise };
    });
  },

  async update(id, data) {
    return executeTransaction(async (connection) => {
      const [encadrant] = await connection.query('SELECT * FROM encadrant_entr WHERE id = ? LIMIT 1', [id]);
      if (!encadrant.length) throw new Error('encadrant non trouvé');
      const cur = encadrant[0];

      if (data.mail) {
        const [existingMail] = await connection.query(
          'SELECT 1 FROM encadrant_entr WHERE mail = ? AND id != ? LIMIT 1', [data.mail, id],
        );
        if (existingMail.length) throw new Error('Cet email est déjà utilisé par un autre encadrant');
      }

      const [result] = await connection.query(
        `UPDATE encadrant_entr SET
          nom = ?, prenom = ?, mail = ?, tel = ?, poste = ?, specialite = ?,
          mot_de_passe = COALESCE(?, mot_de_passe)
         WHERE id = ?`,
        [
          data.nom ?? cur.nom, data.prenom ?? cur.prenom, data.mail ?? cur.mail,
          data.tel ?? cur.tel, data.poste ?? cur.poste, data.specialite ?? cur.specialite,
          data.mot_de_passe || null, id,
        ],
      );
      return result.affectedRows > 0;
    });
  },

  async delete(id) {
    const { affectedRows } = await executeQuery('DELETE FROM encadrant_entr WHERE id = :id', { id });
    return affectedRows > 0;
  },

  async getByEntreprise(id_entreprise) {
    const sql = `
      SELECT id, nom, prenom, mail, tel, poste, specialite, id_entreprise
      FROM encadrant_entr
      WHERE id_entreprise = :id_entreprise
      ORDER BY nom, prenom
    `;
    return executeQuery(sql, { id_entreprise });
  },
};

module.exports = encadrantEntr;

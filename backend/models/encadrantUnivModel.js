const { executeQuery } = require('./db');

const encadrantUniv = {
  async getAll() {
    return await executeQuery('SELECT * FROM encadrant_univ ORDER BY nom, prenom');
  },

  async getById(id) {
    const results = await executeQuery(
      'SELECT * FROM encadrant_univ WHERE id = :id',
      { id }
    );
    return results[0] || null;
  },

  // ─── Créer un encadrant universitaire ────────────────────────────────────
  async create(data) {
    const { nom, prenom, mail, mot_de_passe, specialite, grade, tel, id_universite } = data;

    if (!nom || !prenom || !mail || !mot_de_passe) {
      throw new Error('Nom, prénom, mail et mot de passe sont requis');
    }

    if (id_universite) {
      const universite = await executeQuery(
        'SELECT 1 FROM etablissement WHERE id = ? LIMIT 1',
        [id_universite]
      );
      if (!universite.length) throw new Error('Université non trouvée');
    }

    const sql = `
      INSERT INTO encadrant_univ
        (nom, prenom, mail, mot_de_passe, tel, specialite, grade, id_universite,
         needs_password_change, profile_completed, is_verified)
      VALUES
        (:nom, :prenom, :mail, :mot_de_passe, :tel, :specialite, :grade, :id_universite,
         1, 1, 1)
    `;

    const params = {
      nom,
      prenom,
      mail,
      mot_de_passe,
      tel:           tel           || null,
      specialite:    specialite    || null,
      grade:         grade         || null,
      id_universite: id_universite || null,
    };

    const { insertId } = await executeQuery(sql, params);
    return {
      id: insertId,
      ...params,
      needs_password_change: true,
      profile_completed: true,
    };
  },

  async update(id, data) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('encadrant non trouvé');

    // Construire dynamiquement uniquement les champs fournis
    const allowed = ['nom', 'prenom', 'mail', 'mot_de_passe', 'specialite', 'id_universite'];
    const fields  = [];
    const params  = { id };

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = :${key}`);
        params[key] = data[key];
      }
    }

    if (!fields.length) return existing;

    await executeQuery(
      `UPDATE encadrant_univ SET ${fields.join(', ')} WHERE id = :id`,
      params
    );
    return { id, ...data };
  },

  async delete(id) {
    await executeQuery('DELETE FROM encadrant_univ WHERE id = :id', { id });
    return true;
  },
};

module.exports = encadrantUniv;

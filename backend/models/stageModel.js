const { executeQuery, executeTransaction } = require('./db');

const SELECT_FIELDS = `
  s.*,
  e.nom AS entreprise_nom,
  e.ville AS entreprise_ville,
  e.logo AS entreprise_logo,
  CONCAT(ee.prenom, ' ', ee.nom) AS encadrant_entr_nom,
  CONCAT(eu.prenom, ' ', eu.nom) AS encadrant_univ_nom
`;

const Stage = {
  // Liste paginée + filtres
  async getAll({ page = 1, pageSize = 10, domaine, type, entreprise, niveau }) {
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    let where = ' WHERE 1=1';
    const params = { offset, pageSize: parseInt(pageSize) };

    if (domaine) { where += ' AND s.domaine = :domaine'; params.domaine = domaine; }
    if (type) { where += ' AND s.type_offre = :type'; params.type = type; }
    if (entreprise) { where += ' AND e.nom LIKE :entreprise'; params.entreprise = `%${entreprise}%`; }
    if (niveau) { where += ' AND FIND_IN_SET(:niveau, s.niveaux) > 0'; params.niveau = niveau; }

    const sql = `
      SELECT ${SELECT_FIELDS}
      FROM stage s
      JOIN entreprise e ON s.id_entreprise = e.id
      LEFT JOIN encadrant_entr ee ON s.id_encadrant_entr = ee.id
      LEFT JOIN encadrant_univ eu ON s.id_encadrant_univ = eu.id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT :offset, :pageSize
    `;
    const countSql = `
      SELECT COUNT(*) AS total
      FROM stage s JOIN entreprise e ON s.id_entreprise = e.id ${where}
    `;

    const [rows, [total]] = await Promise.all([
      executeQuery(sql, params),
      executeQuery(countSql, params),
    ]);

    return {
      data: rows,
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total: total.total },
    };
  },

  async getById(id) {
    const sql = `
      SELECT s.*,
             e.nom AS entreprise_nom, e.ville AS entreprise_ville,
             e.responsable AS entreprise_responsable, e.tel AS entreprise_tel,
             e.mail AS entreprise_mail
      FROM stage s
      JOIN entreprise e ON s.id_entreprise = e.id
      WHERE s.id = :id
    `;
    const results = await executeQuery(sql, { id });
    return results[0] || null;
  },

  async create(data) {
    const { titre, type_stage, id_entreprise } = data;
    if (!titre || !type_stage || !id_entreprise) {
      throw new Error('Titre, type de stage et entreprise sont obligatoires');
    }

    return executeTransaction(async (connection) => {
      const [entreprise] = await connection.query('SELECT 1 FROM entreprise WHERE id = ? LIMIT 1', [id_entreprise]);
      if (!entreprise.length) throw new Error('Entreprise non trouvée');

      const [result] = await connection.query(
        `INSERT INTO stage
          (titre, description, id_entreprise, domaine, type_stage, type_offre, niveaux, localisation,
           competences_requises, avantages, nbr_postes, date_debut, date_fin, date_limite, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          titre, data.description || null, id_entreprise, data.domaine || null,
          type_stage, data.type_offre || 'pfe', data.niveaux || '3A', data.localisation || null,
          data.competences_requises || null, data.avantages || null, data.nbr_postes || 1,
          data.date_debut || null, data.date_fin || null, data.date_limite || null, data.statut || 'ouvert',
        ],
      );
      return { id: result.insertId, ...data };
    });
  },

  async update(id, data) {
    return executeTransaction(async (connection) => {
      const [stage] = await connection.query('SELECT * FROM stage WHERE id = ? LIMIT 1', [id]);
      if (!stage.length) throw new Error('Stage non trouvé');
      const cur = stage[0];

      const [result] = await connection.query(
        `UPDATE stage SET
          titre = ?, description = ?, domaine = ?, type_stage = ?, type_offre = ?, niveaux = ?, localisation = ?,
          competences_requises = ?, avantages = ?, nbr_postes = ?,
          date_debut = ?, date_fin = ?, date_limite = ?, statut = ?
         WHERE id = ?`,
        [
          data.titre ?? cur.titre, data.description ?? cur.description,
          data.domaine ?? cur.domaine, data.type_stage ?? cur.type_stage,
          data.type_offre ?? cur.type_offre, data.niveaux ?? cur.niveaux,
          data.localisation ?? cur.localisation, data.competences_requises ?? cur.competences_requises,
          data.avantages ?? cur.avantages, data.nbr_postes ?? cur.nbr_postes,
          data.date_debut ?? cur.date_debut, data.date_fin ?? cur.date_fin,
          data.date_limite ?? cur.date_limite, data.statut ?? cur.statut, id,
        ],
      );
      return result.affectedRows > 0;
    });
  },

  async delete(id) {
    return executeTransaction(async (connection) => {
      const [voeux] = await connection.query('SELECT 1 FROM classement WHERE id_stage = ? LIMIT 1', [id]);
      if (voeux.length) throw new Error('Impossible de supprimer - des candidatures sont associées à ce stage');
      const [result] = await connection.query('DELETE FROM stage WHERE id = ?', [id]);
      return result.affectedRows > 0;
    });
  },

  async getByEntreprise(id_entreprise) {
    const sql = `
      SELECT s.*, COUNT(c.id_etudiant) AS nombre_candidatures,
             MAX(CONCAT(ee.prenom, ' ', ee.nom)) AS encadrant_entr_nom,
             MAX(CONCAT(eu.prenom, ' ', eu.nom)) AS encadrant_univ_nom
      FROM stage s
      LEFT JOIN classement c ON s.id = c.id_stage
      LEFT JOIN encadrant_entr ee ON s.id_encadrant_entr = ee.id
      LEFT JOIN encadrant_univ eu ON s.id_encadrant_univ = eu.id
      WHERE s.id_entreprise = :id_entreprise
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;
    return executeQuery(sql, { id_entreprise });
  },

  // Affecte un encadrant (entreprise ou université) au stage,
  async assignencadrant(id_stage, { id_encadrant_entr, id_encadrant_univ }) {
    return executeTransaction(async (connection) => {
      const stageSets = []; const stageParams = [];
      const affSets = []; const affParams = [];
      if (id_encadrant_entr !== undefined) {
        stageSets.push('id_encadrant_entr = ?'); stageParams.push(id_encadrant_entr || null);
        affSets.push('id_encadrant_entr = ?'); affParams.push(id_encadrant_entr || null);
      }
      if (id_encadrant_univ !== undefined) {
        stageSets.push('id_encadrant_univ = ?'); stageParams.push(id_encadrant_univ || null);
        affSets.push('id_encadrant_univ = ?'); affParams.push(id_encadrant_univ || null);
      }
      if (!stageSets.length) throw new Error('Aucun encadrant à affecter');

      stageParams.push(id_stage);
      const [r] = await connection.query(`UPDATE stage SET ${stageSets.join(', ')} WHERE id = ?`, stageParams);
      if (!r.affectedRows) throw new Error('Stage non trouvé');

      affParams.push(id_stage);
      const [r2] = await connection.query(`UPDATE affectation SET ${affSets.join(', ')} WHERE id_stage = ?`, affParams);
      return { stageUpdated: true, affectationsUpdated: r2.affectedRows };
    });
  },

  setDateLimite: async (dateLimite, id) => {
    await executeQuery('UPDATE stage SET date_limite = :dateLimite WHERE id = :id', { dateLimite, id });
    return true;
  },

  setDateLimiteAll: async (dateLimite) => {
    await executeQuery('UPDATE stage SET date_limite = :dateLimite', { dateLimite });
    return true;
  },

  // ── Date limite de classement par niveau (table deadline_classement) ──
  getDeadlines: async () => executeQuery('SELECT niveau, date_limite FROM deadline_classement ORDER BY niveau'),

  setDeadline: async (niveau, dateLimite) => {
    const { affectedRows } = await executeQuery(
      'UPDATE deadline_classement SET date_limite = :d WHERE niveau = :n',
      { d: dateLimite || null, n: niveau },
    );
    if (!affectedRows) throw new Error('Niveau invalide');
    return true;
  },

  getStats: async () => {
    const sql = `
      SELECT domaine, COUNT(*) AS count,
        SUM(CASE WHEN statut = 'ouvert' THEN 1 ELSE 0 END) AS ouverts,
        SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END) AS termines
      FROM stage
      GROUP BY domaine
    `;
    return executeQuery(sql);
  },
};

module.exports = Stage;

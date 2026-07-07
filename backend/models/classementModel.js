const { executeQuery, executeTransaction } = require('./db');

const Classement = {
  getAll: async () => {
    const sql = `
      SELECT c.*,
             e.nom AS etudiant_nom, e.prenom AS etudiant_prenom,
             s.titre AS stage_titre, ent.nom AS entreprise_nom,
             et.nom AS etablissement_nom
      FROM classement c
      JOIN etudiant e ON c.id_etudiant = e.id
      JOIN stage s ON c.id_stage = s.id
      JOIN entreprise ent ON s.id_entreprise = ent.id
      LEFT JOIN etablissement et ON e.id_universite = et.id
      ORDER BY c.id_stage, c.rang
    `;
    return executeQuery(sql);
  },

  getById: async (id) => {
    const sql = `
      SELECT c.*,
             e.nom AS etudiant_nom, e.prenom AS etudiant_prenom,
             s.titre AS stage_titre, ent.nom AS entreprise_nom
      FROM classement c
      JOIN etudiant e ON c.id_etudiant = e.id
      JOIN stage s ON c.id_stage = s.id
      JOIN entreprise ent ON s.id_entreprise = ent.id
      WHERE c.id = :id
    `;
    const results = await executeQuery(sql, { id });
    return results[0] || null;
  },

  create: async ({ id_etudiant, id_stage, rang }) => {
    return executeTransaction(async (connection) => {
      const [etudiant] = await connection.query('SELECT 1 FROM etudiant WHERE id = ? LIMIT 1', [id_etudiant]);
      const [stage] = await connection.query('SELECT 1 FROM stage WHERE id = ? LIMIT 1', [id_stage]);
      if (!etudiant.length || !stage.length) throw new Error('Étudiant ou stage non trouvé');

      const [existing] = await connection.query(
        'SELECT 1 FROM classement WHERE id_etudiant = ? AND id_stage = ? LIMIT 1',
        [id_etudiant, id_stage],
      );
      if (existing.length) throw new Error('Un vœu existe déjà pour cet étudiant et ce stage');

      const [result] = await connection.query(
        'INSERT INTO classement (id_etudiant, id_stage, rang) VALUES (?, ?, ?)',
        [id_etudiant, id_stage, rang],
      );
      return { id: result.insertId, id_etudiant, id_stage, rang };
    });
  },

  update: async (id, { rang }) => {
    const { affectedRows } = await executeQuery(
      'UPDATE classement SET rang = :rang WHERE id = :id', { id, rang },
    );
    if (affectedRows === 0) throw new Error('Vœu non trouvé');
    return { id, rang };
  },

  delete: async (id) => {
    const { affectedRows } = await executeQuery('DELETE FROM classement WHERE id = :id', { id });
    if (affectedRows === 0) throw new Error('Vœu non trouvé');
    return true;
  },

  getByEtudiant: async (id_etudiant) => {
    const sql = `
      SELECT c.*, s.titre AS stage_titre, s.date_debut, s.date_fin,
             ent.nom AS entreprise_nom, ent.ville AS entreprise_ville
      FROM classement c
      JOIN stage s ON c.id_stage = s.id
      JOIN entreprise ent ON s.id_entreprise = ent.id
      WHERE c.id_etudiant = :id_etudiant
      ORDER BY c.rang
    `;
    return executeQuery(sql, { id_etudiant });
  },

  updateStatus: async (id_etudiant, statut) => {
    const { affectedRows } = await executeQuery(
      'UPDATE classement SET statut = :statut WHERE id_etudiant = :id_etudiant',
      { id_etudiant, statut },
    );
    if (affectedRows === 0) throw new Error('Aucun vœu trouvé pour cet étudiant');
    return { id_etudiant, statut };
  },

  checkDateLimite: async (id_stage) => {
    const result = await executeQuery('SELECT date_limite FROM stage WHERE id = :id_stage', { id_stage });
    if (!result.length || !result[0].date_limite) {
      return { estDepassee: false, dateLimite: null };
    }
    const dateLimite = new Date(result[0].date_limite);
    return { estDepassee: new Date() > dateLimite, dateLimite };
  },

  // L'étudiant ne peut postuler qu'aux stages correspondant à son niveau
  canApply: async (id_etudiant, id_stage) => {
    const rows = await executeQuery(
      `SELECT e.niveau AS etu_niveau, s.niveaux AS stage_niveaux
       FROM etudiant e JOIN stage s ON s.id = :id_stage
       WHERE e.id = :id_etudiant`,
      { id_etudiant, id_stage },
    );
    if (!rows.length) return { ok: false, reason: 'Étudiant ou stage introuvable' };
    const niveaux = String(rows[0].stage_niveaux || '').split(',').filter(Boolean);
    if (!niveaux.includes(rows[0].etu_niveau)) {
      return { ok: false, reason: 'Ce stage ne correspond pas à votre niveau' };
    }
    return { ok: true };
  },

  // Date limite de classement selon le niveau de l'étudiant
  checkDeadlineByNiveau: async (id_etudiant) => {
    const rows = await executeQuery(
      `SELECT d.date_limite
       FROM etudiant e JOIN deadline_classement d ON d.niveau = e.niveau
       WHERE e.id = :id_etudiant`,
      { id_etudiant },
    );
    const dl = rows.length ? rows[0].date_limite : null;
    if (!dl) return { estDepassee: false, dateLimite: null };
    const dateLimite = new Date(dl);
    return { estDepassee: new Date() > dateLimite, dateLimite };
  },
};

module.exports = Classement;

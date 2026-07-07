const { executeQuery } = require('./db');

const Tache = {
  getByStage: async (id_stage) => {
    const sql = `
      SELECT t.*, s.titre AS stage_titre, e.nom AS entreprise_nom
      FROM tache t
      JOIN stage s ON t.id_stage = s.id
      JOIN entreprise e ON s.id_entreprise = e.id
      WHERE t.id_stage = :id_stage
      ORDER BY t.date_echeance ASC
    `;
    return executeQuery(sql, { id_stage });
  },

  getByEtudiant: async (id_etudiant) => {
    const sql = `
      SELECT t.*, s.titre AS stage_titre, e.nom AS entreprise_nom
      FROM tache t
      JOIN stage s ON t.id_stage = s.id
      JOIN entreprise e ON s.id_entreprise = e.id
      WHERE t.id_etudiant = :id_etudiant
      ORDER BY t.date_echeance ASC
    `;
    return executeQuery(sql, { id_etudiant });
  },

  getById: async (id) => {
    const sql = `
      SELECT t.*, s.titre AS stage_titre, e.nom AS entreprise_nom
      FROM tache t
      JOIN stage s ON t.id_stage = s.id
      JOIN entreprise e ON s.id_entreprise = e.id
      WHERE t.id = :id
    `;
    const results = await executeQuery(sql, { id });
    return results[0] || null;
  },

  create: async ({ titre, description, id_stage, id_etudiant, id_encadrant_entr, priorite, date_echeance }) => {
    if (!titre || !id_stage) throw new Error('Le titre et le stage sont obligatoires');
    const sql = `
      INSERT INTO tache (titre, description, id_stage, id_etudiant, id_encadrant_entr, priorite, date_echeance)
      VALUES (:titre, :description, :id_stage, :id_etudiant, :id_encadrant_entr, :priorite, :date_echeance)
    `;
    const params = {
      titre,
      description: description || null,
      id_stage,
      id_etudiant: id_etudiant || null,
      id_encadrant_entr: id_encadrant_entr || null,
      priorite: priorite || 'moyenne',
      date_echeance: date_echeance || null,
    };
    const { insertId } = await executeQuery(sql, params);
    return { id: insertId, statut: 'a_faire', ...params };
  },

  update: async (id, data) => {
    const allowed = ['titre', 'description', 'id_etudiant', 'statut', 'priorite', 'date_echeance'];
    const fields = [];
    const params = { id };
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = :${key}`); params[key] = data[key]; }
    }
    if (!fields.length) return false;
    const { affectedRows } = await executeQuery(`UPDATE tache SET ${fields.join(', ')} WHERE id = :id`, params);
    return affectedRows > 0;
  },

  markAsDone: async (id) => {
    const { affectedRows } = await executeQuery(
      "UPDATE tache SET statut = 'terminee' WHERE id = :id", { id },
    );
    return affectedRows > 0;
  },

  delete: async (id) => {
    const { affectedRows } = await executeQuery('DELETE FROM tache WHERE id = :id', { id });
    return affectedRows > 0;
  },

  getStats: async (id_stage) => {
    const sql = `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN statut = 'terminee' THEN 1 ELSE 0 END) AS terminees,
        SUM(CASE WHEN statut <> 'terminee' THEN 1 ELSE 0 END) AS en_attente,
        SUM(CASE WHEN date_echeance < CURDATE() AND statut <> 'terminee' THEN 1 ELSE 0 END) AS en_retard
      FROM tache
      WHERE id_stage = :id_stage
    `;
    const results = await executeQuery(sql, { id_stage });
    return results[0];
  },
};

module.exports = Tache;

const { executeQuery } = require('./db');

const Document = {
  getById: async (id) => {
    const sql = `
      SELECT d.*, CONCAT(e.prenom, ' ', e.nom) AS etudiant_nom, s.titre AS stage_titre
      FROM document d
      LEFT JOIN etudiant e ON d.id_etudiant = e.id
      LEFT JOIN stage s ON d.id_stage = s.id
      WHERE d.id = :id
    `;
    const results = await executeQuery(sql, { id });
    return results[0] || null;
  },

  getByEtudiant: async (id_etudiant) =>
    executeQuery('SELECT * FROM document WHERE id_etudiant = :id_etudiant ORDER BY created_at DESC', { id_etudiant }),

  setStatut: async (id, statut, commentaire = null) => {
    const { affectedRows } = await executeQuery(
      'UPDATE document SET statut = :statut, commentaire = :commentaire WHERE id = :id',
      { id, statut, commentaire },
    );
    if (affectedRows === 0) throw new Error('Document non trouvé');
    return true;
  },
};

module.exports = Document;

const { executeQuery } = require('./db');
const Affectation = require('./affectationModel');

const EtudiantStage = {
  getAll: () => Affectation.getAll(),
  getByStage: (id_stage) => Affectation.getByStage(id_stage),

  getByEtudiant: async (id_etudiant) => {
    const sql = `
      SELECT a.*, e.nom, e.prenom, s.titre AS stage_titre, ent.nom AS entreprise_nom
      FROM affectation a
      JOIN etudiant e ON a.id_etudiant = e.id
      JOIN stage s ON a.id_stage = s.id
      JOIN entreprise ent ON s.id_entreprise = ent.id
      WHERE a.id_etudiant = :id_etudiant
    `;
    return executeQuery(sql, { id_etudiant });
  },

  getById: (id) => Affectation.getById(id),
  create: (data) => Affectation.create(data),
  update: (id, data) => Affectation.update(id, data),
  delete: (id) => Affectation.delete(id),
  updateFileByEtudiant: (id_etudiant, field, path) => Affectation.updateFileByEtudiant(id_etudiant, field, path),
};

module.exports = EtudiantStage;

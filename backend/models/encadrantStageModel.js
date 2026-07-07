const { executeQuery } = require('./db');
const Affectation = require('./affectationModel');
const Stage = require('./stageModel');


const encadrantStage = {
  getByStage: (id_stage) => Affectation.getByStage(id_stage),

  getByencadrant: (type, id) => Affectation.getByencadrant(type, id),

  // Affecte un encadrant au stage (et propage aux affectations existantes)
  async assignToStage(id_stage, { id_encadrant_entr, id_encadrant_univ }) {
    const r = await Stage.assignencadrant(id_stage, { id_encadrant_entr, id_encadrant_univ });
    return r.affectationsUpdated;
  },

  // Retire un encadrant d'une affectation précise
  async removeFromAffectation(id_affectation) {
    const { affectedRows } = await executeQuery(
      'UPDATE affectation SET id_encadrant_entr = NULL, id_encadrant_univ = NULL WHERE id = :id',
      { id: id_affectation },
    );
    return affectedRows > 0;
  },
};

module.exports = encadrantStage;

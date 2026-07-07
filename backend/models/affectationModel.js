const { executeQuery, executeTransaction } = require('./db');

const BASE_SELECT = `
  SELECT a.*,
         e.nom AS etudiant_nom, e.prenom AS etudiant_prenom, e.niveau AS etudiant_niveau,
         s.titre AS stage_titre, s.id_entreprise AS id_entreprise,
         ent.nom AS entreprise_nom,
         CONCAT(eu.prenom, ' ', eu.nom) AS encadrant_univ_nom,
         CONCAT(ee.prenom, ' ', ee.nom) AS encadrant_entr_nom
  FROM affectation a
  JOIN etudiant e ON a.id_etudiant = e.id
  JOIN stage s ON a.id_stage = s.id
  JOIN entreprise ent ON s.id_entreprise = ent.id
  LEFT JOIN encadrant_univ eu ON a.id_encadrant_univ = eu.id
  LEFT JOIN encadrant_entr ee ON a.id_encadrant_entr = ee.id
`;

const Affectation = {
  getAll: async () => executeQuery(`${BASE_SELECT} ORDER BY a.created_at DESC`),

  getById: async (id) => {
    const rows = await executeQuery(`${BASE_SELECT} WHERE a.id = :id`, { id });
    return rows[0] || null;
  },

  getByEtudiant: async (id_etudiant) => {
    const rows = await executeQuery(`${BASE_SELECT} WHERE a.id_etudiant = :id_etudiant`, { id_etudiant });
    return rows[0] || null;
  },

  getByStage: async (id_stage) => executeQuery(`${BASE_SELECT} WHERE a.id_stage = :id_stage`, { id_stage }),

  getByencadrant: async (type, id) => {
    const field = type === 'univ' ? 'a.id_encadrant_univ' : 'a.id_encadrant_entr';
    return executeQuery(`${BASE_SELECT} WHERE ${field} = :id`, { id });
  },

  create: async (data) => {
    const { id_etudiant, id_stage } = data;
    if (!id_etudiant || !id_stage) throw new Error('Étudiant et stage sont requis');
    const sql = `
      INSERT INTO affectation
        (id_etudiant, id_stage, id_encadrant_entr, id_encadrant_univ, date_affectation, statut)
      VALUES (:id_etudiant, :id_stage, :id_encadrant_entr, :id_encadrant_univ, :date_affectation, :statut)
    `;
    const params = {
      id_etudiant, id_stage,
      id_encadrant_entr: data.id_encadrant_entr || null,
      id_encadrant_univ: data.id_encadrant_univ || null,
      date_affectation: data.date_affectation || new Date(),
      statut: data.statut || 'confirmee',
    };
    const { insertId } = await executeQuery(sql, params);
    return { id: insertId, ...params };
  },

  update: async (id, data) => {
    const allowed = ['id_stage', 'id_encadrant_entr', 'id_encadrant_univ', 'statut',
      'rapport_pdf', 'rapport_statut', 'convention_pdf', 'note_finale', 'commentaire'];
    const fields = [];
    const params = { id };
    for (const key of allowed) {
      if (data[key] !== undefined) { fields.push(`${key} = :${key}`); params[key] = data[key]; }
    }
    if (!fields.length) throw new Error('Aucune donnée à mettre à jour');
    const { affectedRows } = await executeQuery(`UPDATE affectation SET ${fields.join(', ')} WHERE id = :id`, params);
    if (affectedRows === 0) throw new Error('Affectation non trouvée');
    return { id, ...data };
  },

  // Mise à jour rapport/convention via l'id étudiant (upload côté étudiant)
  updateFileByEtudiant: async (id_etudiant, field, path) => {
    const map = {
      rapport: 'rapport_pdf = :path, rapport_statut = \'en_attente\'',
      convention: 'convention_pdf = :path',
    };
    if (!map[field]) throw new Error('Champ invalide');
    const { affectedRows } = await executeQuery(
      `UPDATE affectation SET ${map[field]} WHERE id_etudiant = :id_etudiant`,
      { id_etudiant, path },
    );
    if (affectedRows === 0) throw new Error('Aucune affectation pour cet étudiant');
    return true;
  },

  delete: async (id) => {
    const { affectedRows } = await executeQuery('DELETE FROM affectation WHERE id = :id', { id });
    return affectedRows > 0;
  },

  // ── Affectations d'une entreprise (pour le suivi côté entreprise) ──
  getByEntreprise: async (id_entreprise) =>
    executeQuery(`${BASE_SELECT} WHERE s.id_entreprise = :id_entreprise ORDER BY a.created_at DESC`, { id_entreprise }),

  // ── Note d'un encadrant (entr ou univ) + recalcul de la moyenne ──
  setNoteencadrant: async (id, type, note) => {
    const col = type === 'entr' ? 'note_encadrant_entr' : 'note_encadrant_univ';
    const { affectedRows } = await executeQuery(
      `UPDATE affectation SET ${col} = :note WHERE id = :id`, { id, note },
    );
    if (affectedRows === 0) throw new Error('Affectation non trouvée');
    // note_finale = moyenne des deux notes lorsque les deux sont présentes
    await executeQuery(
      `UPDATE affectation
         SET note_finale = CASE
               WHEN note_encadrant_entr IS NOT NULL AND note_encadrant_univ IS NOT NULL
               THEN ROUND((note_encadrant_entr + note_encadrant_univ) / 2, 2)
               ELSE NULL
             END
       WHERE id = :id`, { id },
    );
    return Affectation.getById(id);
  },

  // ── Campagne d'affectation par niveau ──
  getRun: async (niveau) => {
    const rows = await executeQuery('SELECT * FROM affectation_run WHERE niveau = :niveau', { niveau });
    return rows[0] || null;
  },

  startRun: async (niveau) => {
    await executeQuery(
      `INSERT INTO affectation_run (niveau, date_affectation) VALUES (:niveau, NOW())
       ON DUPLICATE KEY UPDATE date_affectation = NOW()`,
      { niveau },
    );
  },

  // Phase d'un niveau : 'avant' | 'desistement' | 'suivi'
  computePhase: (run) => {
    if (!run || !run.date_affectation) {
      return { phase: 'avant', date_affectation: null, deadline: null, delai_jours: run ? run.delai_desistement_jours : 7 };
    }
    const start = new Date(run.date_affectation);
    const jours = run.delai_desistement_jours || 7;
    const deadline = new Date(start.getTime() + jours * 24 * 60 * 60 * 1000);
    const phase = new Date() > deadline ? 'suivi' : 'desistement';
    return { phase, date_affectation: run.date_affectation, deadline, delai_jours: jours };
  },

  getStatus: async (niveau) => {
    const run = await Affectation.getRun(niveau);
    return Affectation.computePhase(run);
  },

  // Statut des 3 niveaux d'un coup 
  getStatusAll: async () => {
    const rows = await executeQuery('SELECT * FROM affectation_run');
    const byNiveau = new Map(rows.map((r) => [r.niveau, r]));
    const out = {};
    for (const n of ['1A', '2A', '3A']) out[n] = Affectation.computePhase(byNiveau.get(n));
    return out;
  },

  // ── Recalcul d'un seul niveau ──
  recompute: async (niveau) => {
    return executeTransaction(async (connection) => {
      const [etudiants] = await connection.query(
        'SELECT id FROM etudiant WHERE a_desiste = FALSE AND niveau = ? ORDER BY score DESC, id ASC',
        [niveau],
      );
      const etuIds = etudiants.map((e) => e.id);
      if (etuIds.length) {
        await connection.query('DELETE FROM affectation WHERE id_etudiant IN (?)', [etuIds]);
        await connection.query("UPDATE classement SET statut = 'en_attente' WHERE id_etudiant IN (?)", [etuIds]);
      }

      const [stages] = await connection.query(
        'SELECT id, nbr_postes, id_encadrant_entr, id_encadrant_univ FROM stage',
      );
      const capacites = new Map(stages.map((s) => [s.id, s.nbr_postes]));
      const encMap = new Map(stages.map((s) => [s.id, { entr: s.id_encadrant_entr, univ: s.id_encadrant_univ }]));


      const [counts] = await connection.query('SELECT id_stage, COUNT(*) AS n FROM affectation GROUP BY id_stage');
      const occupes = new Map(counts.map((r) => [r.id_stage, r.n]));

      const affectations = [];
      const nonAffectes = [];

      for (const etu of etudiants) {
        const [voeux] = await connection.query(
          'SELECT id_stage FROM classement WHERE id_etudiant = ? ORDER BY rang ASC',
          [etu.id],
        );
        if (!voeux.length) { nonAffectes.push({ etudiant: etu.id, raison: 'Aucun vœu' }); continue; }

        let affecte = false;
        for (const v of voeux) {
          const cap = capacites.get(v.id_stage) ?? 1;
          const occ = occupes.get(v.id_stage) ?? 0;
          if (occ < cap) {
            const enc = encMap.get(v.id_stage) || {};
            await connection.query(
              `INSERT INTO affectation
                 (id_etudiant, id_stage, id_encadrant_entr, id_encadrant_univ, date_affectation, statut)
               VALUES (?, ?, ?, ?, CURDATE(), 'confirmee')`,
              [etu.id, v.id_stage, enc.entr || null, enc.univ || null],
            );
            await connection.query(
              "UPDATE classement SET statut = 'accepte' WHERE id_etudiant = ? AND id_stage = ?",
              [etu.id, v.id_stage],
            );
            occupes.set(v.id_stage, occ + 1);
            affectations.push({ etudiant: etu.id, stage: v.id_stage });
            affecte = true;
            break;
          }
        }
        if (!affecte) nonAffectes.push({ etudiant: etu.id, raison: 'Aucun vœu disponible' });
      }

      const affectedStageIds = [...occupes.keys()].filter((id) => (occupes.get(id) || 0) > 0);
      if (affectedStageIds.length) {
        await connection.query("UPDATE stage SET statut = 'en_cours' WHERE id IN (?)", [affectedStageIds]);
      }

      return { affectations, nonAffectes };
    });
  },

  // Affectation automatique d'un niveau (lancée par l'admin)
  autoAffect: async (niveau) => {
    await Affectation.startRun(niveau);
    return Affectation.recompute(niveau);
  },

  // ── Désistement d'un étudiant ──
  desister: async (id_etudiant) => {
    const rows = await executeQuery('SELECT niveau, a_desiste FROM etudiant WHERE id = :id', { id: id_etudiant });
    if (!rows.length) throw new Error('Étudiant non trouvé');
    if (rows[0].a_desiste) throw new Error('Cet étudiant s\'est déjà désisté.');
    const niveau = rows[0].niveau;

    const status = await Affectation.getStatus(niveau);
    if (status.phase !== 'desistement') {
      throw new Error('Le désistement n\'est pas autorisé : la campagne de votre niveau est close ou non lancée.');
    }

    await executeQuery(
      'UPDATE etudiant SET a_desiste = TRUE, date_desistement = NOW() WHERE id = :id',
      { id: id_etudiant },
    );
    const result = await Affectation.recompute(niveau);
    return { message: 'Désistement enregistré, affectations recalculées.', niveau, ...result };
  },
};

module.exports = Affectation;

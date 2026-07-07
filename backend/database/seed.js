
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, executeQuery } = require('../models/db');

const TEST_PASSWORD = 'Test@1234';

const ENSIAS = {
  nom: 'ENSIAS',
  type_etablissement: 'École d\'ingénieurs',
  responsable: 'Direction ENSIAS',
  ville: 'Rabat',
  mail: process.env.ADMIN_UNIV_EMAIL || 'admin@ensias.um5.ac.ma',
  password: process.env.ADMIN_UNIV_PASSWORD || 'Ensias@2026',
};

async function seed() {
  try {
    const existing = await executeQuery('SELECT id FROM etablissement LIMIT 1');
    if (existing.length) {
      console.log('ℹ️  Un établissement existe déjà — seed ignoré (relancez `npm run db:init` pour repartir de zéro).');
      return;
    }

    const adminHash = await bcrypt.hash(ENSIAS.password, 12);
    const testHash = await bcrypt.hash(TEST_PASSWORD, 12);

    // ── Admin université (ENSIAS) ──────────────────────────────
    const etab = await executeQuery(
      `INSERT INTO etablissement
         (nom, type_etablissement, responsable, ville, mail, mot_de_passe,
          is_verified, profile_completed, needs_password_change)
       VALUES (:nom, :type, :resp, :ville, :mail, :hash, 1, 1, 0)`,
      { nom: ENSIAS.nom, type: ENSIAS.type_etablissement, resp: ENSIAS.responsable, ville: ENSIAS.ville, mail: ENSIAS.mail, hash: adminHash },
    );
    const universiteId = etab.insertId;

    // ── Entreprise (admin entreprise) ──────────────────────────
    const entr = await executeQuery(
      `INSERT INTO entreprise
         (nom, secteur, responsable, ville, mail, mot_de_passe,
          is_verified, profile_completed, needs_password_change)
       VALUES ('TechNova', 'Informatique', 'Sara Alaoui', 'Casablanca',
               'entreprise@test.com', :hash, 1, 1, 0)`,
      { hash: testHash },
    );
    const entrepriseId = entr.insertId;

    // ── Encadrant université ───────────────────────────────────
    await executeQuery(
      `INSERT INTO encadrant_univ
         (nom, prenom, mail, mot_de_passe, tel, specialite, grade, id_universite,
          is_verified, profile_completed, needs_password_change)
       VALUES ('Bennani', 'Karim', 'encadrant.univ@test.com', :hash, '0600000001',
               'Génie Logiciel', 'Professeur', :uni, 1, 1, 0)`,
      { hash: testHash, uni: universiteId },
    );

    // ── Encadrant entreprise ───────────────────────────────────
    const encEntr = await executeQuery(
      `INSERT INTO encadrant_entr
         (nom, prenom, mail, mot_de_passe, tel, poste, specialite, id_entreprise,
          is_verified, profile_completed, needs_password_change)
       VALUES ('Idrissi', 'Nadia', 'encadrant.entr@test.com', :hash, '0600000002',
               'Lead Developer', 'Backend', :ent, 1, 1, 0)`,
      { hash: testHash, ent: entrepriseId },
    );
    void encEntr;

    // ── Étudiants (par niveau ; scores variés pour tester l'ordre) ──
    const etudiants = [
      // 3A → PFE
      { nom: 'Amrani', prenom: 'Yasmine', mail: 'etudiant1@test.com', filiere: 'GL', niveau: '3A', score: 18.50 },
      { nom: 'Tahiri', prenom: 'Omar', mail: 'etudiant2@test.com', filiere: 'BIA', niveau: '3A', score: 16.00 },
      { nom: 'El Fassi', prenom: 'Salma', mail: 'etudiant3@test.com', filiere: 'GL', niveau: '3A', score: 14.25 },
      // 2A → PFA
      { nom: 'Berrada', prenom: 'Mehdi', mail: 'etudiant4@test.com', filiere: 'SSE', niveau: '2A', score: 15.00 },
      { nom: 'Chraibi', prenom: 'Lina', mail: 'etudiant5@test.com', filiere: '2IA', niveau: '2A', score: 13.50 },
      { nom: 'Naciri', prenom: 'Adam', mail: 'etudiant6@test.com', filiere: 'GL', niveau: '2A', score: 17.00 },
      // 1A → PFA
      { nom: 'Bennis', prenom: 'Sara', mail: 'etudiant7@test.com', filiere: 'IDF', niveau: '1A', score: 16.50 },
      { nom: 'Othmani', prenom: 'Ilyas', mail: 'etudiant8@test.com', filiere: 'GL', niveau: '1A', score: 12.75 },
    ];
    const etudiantIds = {};
    for (const e of etudiants) {
      const r = await executeQuery(
        `INSERT INTO etudiant
           (nom, prenom, mail, mot_de_passe, niveau, filiere, id_universite, score,
            is_verified, profile_completed, needs_password_change)
         VALUES (:nom, :prenom, :mail, :hash, :niveau, :filiere, :uni, :score, 1, 1, 0)`,
        { nom: e.nom, prenom: e.prenom, mail: e.mail, hash: testHash, niveau: e.niveau, filiere: e.filiere, uni: universiteId, score: e.score },
      );
      etudiantIds[e.mail] = r.insertId;
    }

    // ── Stages (PFE pour 3A ; PFA pour 1A/2A) ──────────────────
    const stages = [
      { titre: 'Développement Web Full-Stack', domaine: 'Web', type_offre: 'pfe', niveaux: '3A', postes: 2 },
      { titre: 'Data Science & IA', domaine: 'Data', type_offre: 'pfe', niveaux: '3A', postes: 1 },
      { titre: 'Ingénierie DevOps', domaine: 'DevOps', type_offre: 'pfe', niveaux: '3A', postes: 1 },
      { titre: 'Initiation Cloud (PFA)', domaine: 'Cloud', type_offre: 'pfa', niveaux: '2A', postes: 2 },
      { titre: 'Découverte Cybersécurité (PFA)', domaine: 'Sécurité', type_offre: 'pfa', niveaux: '1A', postes: 1 },
      { titre: 'Projet Mobile (PFA)', domaine: 'Mobile', type_offre: 'pfa', niveaux: '1A,2A', postes: 2 },
    ];
    const stageIds = {};
    for (const s of stages) {
      const r = await executeQuery(
        `INSERT INTO stage
           (titre, description, id_entreprise, domaine, type_stage, type_offre, niveaux, localisation,
            nbr_postes, date_debut, date_fin, date_limite, statut)
         VALUES (:titre, :desc, :ent, :domaine, 'Présentiel', :type_offre, :niveaux, 'Casablanca',
                 :postes, '2026-02-01', '2026-07-31', NULL, 'ouvert')`,
        { titre: s.titre, desc: `Stage ${s.titre} chez TechNova.`, ent: entrepriseId, domaine: s.domaine, type_offre: s.type_offre, niveaux: s.niveaux, postes: s.postes },
      );
      stageIds[s.titre] = r.insertId;
    }

    // ── Vœux (classement) cohérents avec le niveau de chaque étudiant ──
    const PFE_WEB = stageIds['Développement Web Full-Stack'];
    const PFE_DATA = stageIds['Data Science & IA'];
    const PFE_DEVOPS = stageIds['Ingénierie DevOps'];
    const PFA_CLOUD = stageIds['Initiation Cloud (PFA)'];
    const PFA_CYBER = stageIds['Découverte Cybersécurité (PFA)'];
    const PFA_MOBILE = stageIds['Projet Mobile (PFA)'];

    const voeux = [
      // 3A
      { mail: 'etudiant1@test.com', ordre: [PFE_WEB, PFE_DATA, PFE_DEVOPS] },
      { mail: 'etudiant2@test.com', ordre: [PFE_DATA, PFE_WEB] },
      { mail: 'etudiant3@test.com', ordre: [PFE_WEB, PFE_DEVOPS] },
      // 2A
      { mail: 'etudiant4@test.com', ordre: [PFA_CLOUD, PFA_MOBILE] },
      { mail: 'etudiant5@test.com', ordre: [PFA_MOBILE, PFA_CLOUD] },
      { mail: 'etudiant6@test.com', ordre: [PFA_CLOUD, PFA_MOBILE] },
      // 1A
      { mail: 'etudiant7@test.com', ordre: [PFA_CYBER, PFA_MOBILE] },
      { mail: 'etudiant8@test.com', ordre: [PFA_MOBILE, PFA_CYBER] },
    ];
    for (const v of voeux) {
      let rang = 1;
      for (const idStage of v.ordre) {
        await executeQuery(
          `INSERT INTO classement (id_etudiant, id_stage, rang) VALUES (:etu, :stage, :rang)`,
          { etu: etudiantIds[v.mail], stage: idStage, rang },
        );
        rang += 1;
      }
    }

    console.log('✅ Seed terminé.');
    console.log('───────────────────────────────────────────────');
    console.log('  Admin ENSIAS   :', ENSIAS.mail, '/', ENSIAS.password);
    console.log('  Entreprise     : entreprise@test.com /', TEST_PASSWORD);
    console.log('  Encadrant univ : encadrant.univ@test.com /', TEST_PASSWORD);
    console.log('  Encadrant entr : encadrant.entr@test.com /', TEST_PASSWORD);
    console.log('  Étudiants 3A   : etudiant1..3@test.com   /', TEST_PASSWORD);
    console.log('  Étudiants 2A   : etudiant4..6@test.com   /', TEST_PASSWORD);
    console.log('  Étudiants 1A   : etudiant7..8@test.com   /', TEST_PASSWORD);
    console.log('───────────────────────────────────────────────');
  } catch (err) {
    console.error('❌ Seed échoué :', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();

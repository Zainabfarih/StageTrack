const { executeQuery, executeTransaction } = require('./db');

const Entreprise = {
  // Récupérer toutes les entreprises
  async getAll() {
    const sql = `
      SELECT * FROM entreprise
      ORDER BY nom ASC
    `;
    return executeQuery(sql);
  },

  // Récupérer une entreprise par ID
  async getById(id) {
    const sql = 'SELECT * FROM entreprise WHERE id = :id';
    const results = await executeQuery(sql, { id });
    return results[0] || null;
  },

  // Créer une nouvelle entreprise
  async create(entrepriseData) {
    const { nom, adresse, tel, ville, mail, mot_de_passe, secteur, responsable, site_web, description, taille_entreprise } = entrepriseData;

    const sql = `
      INSERT INTO entreprise
      (nom, adresse, tel, ville, mail, mot_de_passe, secteur, responsable, site_web,
       description, taille_entreprise, is_verified, profile_completed)
      VALUES
      (:nom, :adresse, :tel, :ville, :mail, :mot_de_passe, :secteur, :responsable, :site_web,
       :description, :taille_entreprise, 1, 1)
    `;

    const params = {
      nom,
      adresse: adresse || null,
      tel: tel || null,
      ville: ville || null,
      mail,
      mot_de_passe,
      secteur: secteur || null,
      responsable: responsable || null,
      site_web: site_web || null,
      description: description || null,
      taille_entreprise: taille_entreprise || null,
    };

    const { insertId } = await executeQuery(sql, params);
    return { id: insertId, ...params };
  },

  // Mettre à jour une entreprise
  async update(id, entrepriseData) {
    const { nom, adresse, tel, ville, mail, mot_de_passe, secteur, responsable, site_web, description, taille_entreprise } = entrepriseData;

    const existing = await this.getById(id);
    if (!existing) throw new Error('Entreprise non trouvée');

    const sql = `
      UPDATE entreprise SET
        nom = :nom,
        adresse = :adresse,
        tel = :tel,
        ville = :ville,
        mail = :mail,
        mot_de_passe = COALESCE(:mot_de_passe, mot_de_passe),
        secteur = :secteur,
        responsable = :responsable,
        site_web = :site_web,
        description = :description,
        taille_entreprise = :taille_entreprise
      WHERE id = :id
    `;

    const params = {
      id,
      nom: nom ?? existing.nom,
      adresse: adresse ?? existing.adresse,
      tel: tel ?? existing.tel,
      ville: ville ?? existing.ville,
      mail: mail ?? existing.mail,
      mot_de_passe: mot_de_passe || null,
      secteur: secteur ?? existing.secteur,
      responsable: responsable ?? existing.responsable,
      site_web: site_web ?? existing.site_web,
      description: description ?? existing.description,
      taille_entreprise: taille_entreprise ?? existing.taille_entreprise,
    };

    await executeQuery(sql, params);
    return { id, ...params };
  },

  // Supprimer une entreprise
  async delete(id) {
    return executeTransaction(async (connection) => {
      // Vérifier d'abord si l'entreprise existe
      const [entreprise] = await connection.query(
        'SELECT 1 FROM entreprise WHERE id = ? LIMIT 1',
        [id]
      );

      if (!entreprise.length) {
        throw new Error('Entreprise non trouvée');
      }

      // Vérifier s'il y a des stages associés
      const [stages] = await connection.query(
        'SELECT 1 FROM stage WHERE id_entreprise = ? LIMIT 1',
        [id]
      );

      if (stages.length) {
        throw new Error('Impossible de supprimer - des stages sont associés à cette entreprise');
      }

      // Supprimer l'entreprise
      const [result] = await connection.query(
        'DELETE FROM entreprise WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    });
  },

  // Rechercher des entreprises par critères
  async search({ nom, ville, secteur }) {
    let sql = 'SELECT * FROM entreprise WHERE 1=1';
    const params = {};

    if (nom) {
      sql += ' AND nom LIKE :nom';
      params.nom = `%${nom}%`;
    }

    if (ville) {
      sql += ' AND ville LIKE :ville';
      params.ville = `%${ville}%`;
    }

    if (secteur) {
      sql += ' AND secteur = :secteur';
      params.secteur = secteur;
    }

    sql += ' ORDER BY nom ASC';

    return executeQuery(sql, params);
  },

  // Authentifier une entreprise 
  async authenticate(mail, mot_de_passe) {
    const bcrypt = require('bcryptjs');
    const results = await executeQuery('SELECT * FROM entreprise WHERE mail = :mail LIMIT 1', { mail });
    if (results.length === 0) throw new Error('Entreprise non trouvée');

    const entreprise = results[0];
    const valid = await bcrypt.compare(mot_de_passe, entreprise.mot_de_passe);
    if (!valid) throw new Error('Mot de passe incorrect');

    delete entreprise.mot_de_passe;
    return entreprise;
  },

  // Vérifier si un email existe déjà
  async emailExists(mail, excludeId = null) {
    let sql = 'SELECT 1 FROM entreprise WHERE mail = :mail';
    const params = { mail };

    if (excludeId) {
      sql += ' AND id != :excludeId';
      params.excludeId = excludeId;
    }

    sql += ' LIMIT 1';

    const results = await executeQuery(sql, params);
    return results.length > 0;
  }
};

module.exports = Entreprise;
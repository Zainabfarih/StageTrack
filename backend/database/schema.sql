-- ============================================================
-- StageTrack — Schéma de base de données 
-- ============================================================

DROP DATABASE IF EXISTS stagetrack;
CREATE DATABASE stagetrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stagetrack;


CREATE TABLE refresh_tokens (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    role        VARCHAR(40) NOT NULL,
    token       VARCHAR(128) NOT NULL UNIQUE,
    expires_at  DATETIME NOT NULL,
    is_revoked  BOOLEAN DEFAULT FALSE,
    revoked_at  DATETIME NULL,
    user_agent  TEXT,
    ip_address  VARCHAR(45),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id, role),
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;


CREATE TABLE etablissement (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    uuid                CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    nom                 VARCHAR(255) NOT NULL,
    type_etablissement  VARCHAR(100),
    responsable         VARCHAR(255),
    adresse             TEXT,
    ville               VARCHAR(100),
    tel                 VARCHAR(20),
    mail                VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe        VARCHAR(255) NOT NULL,
    logo                VARCHAR(255),
    site_web            VARCHAR(255),
    description         TEXT,
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token      VARCHAR(128) NULL,
    verification_token_expires DATETIME NULL,
    reset_token             VARCHAR(128) NULL,
    reset_token_expires     DATETIME NULL,
    last_login              DATETIME NULL,
    login_attempts          INT NOT NULL DEFAULT 0,
    locked_until            DATETIME NULL,
    profile_completed       BOOLEAN NOT NULL DEFAULT FALSE,
    needs_password_change   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_mail (mail),
    INDEX idx_uuid (uuid),
    INDEX idx_verification_token (verification_token),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB;


CREATE TABLE entreprise (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    uuid                CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    nom                 VARCHAR(255) NOT NULL,
    secteur             VARCHAR(100),
    taille_entreprise   VARCHAR(50),
    responsable         VARCHAR(255),
    adresse             TEXT,
    ville               VARCHAR(100),
    tel                 VARCHAR(20),
    mail                VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe        VARCHAR(255) NOT NULL,
    logo                VARCHAR(255),
    site_web            VARCHAR(255),
    description         TEXT,
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token      VARCHAR(128) NULL,
    verification_token_expires DATETIME NULL,
    reset_token             VARCHAR(128) NULL,
    reset_token_expires     DATETIME NULL,
    last_login              DATETIME NULL,
    login_attempts          INT NOT NULL DEFAULT 0,
    locked_until            DATETIME NULL,
    profile_completed       BOOLEAN NOT NULL DEFAULT FALSE,
    needs_password_change   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_mail (mail),
    INDEX idx_uuid (uuid),
    INDEX idx_secteur (secteur),
    INDEX idx_verification_token (verification_token),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB;



CREATE TABLE encadrant_univ (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    nom           VARCHAR(255) NOT NULL,
    prenom        VARCHAR(255) NOT NULL,
    mail          VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe  VARCHAR(255) NOT NULL,
    tel           VARCHAR(20),
    specialite    VARCHAR(100),
    grade         VARCHAR(100),
    id_universite INT,
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token      VARCHAR(128) NULL,
    verification_token_expires DATETIME NULL,
    reset_token             VARCHAR(128) NULL,
    reset_token_expires     DATETIME NULL,
    last_login              DATETIME NULL,
    login_attempts          INT NOT NULL DEFAULT 0,
    locked_until            DATETIME NULL,
    profile_completed       BOOLEAN NOT NULL DEFAULT FALSE,
    needs_password_change   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_universite) REFERENCES etablissement(id) ON DELETE SET NULL,
    INDEX idx_mail (mail),
    INDEX idx_uuid (uuid),
    INDEX idx_universite (id_universite),
    INDEX idx_verification_token (verification_token),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB;



CREATE TABLE encadrant_entr (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    nom           VARCHAR(255) NOT NULL,
    prenom        VARCHAR(255) NOT NULL,
    mail          VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe  VARCHAR(255) NOT NULL,
    tel           VARCHAR(20),
    poste         VARCHAR(100),
    specialite    VARCHAR(100),
    id_entreprise INT,
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token      VARCHAR(128) NULL,
    verification_token_expires DATETIME NULL,
    reset_token             VARCHAR(128) NULL,
    reset_token_expires     DATETIME NULL,
    last_login              DATETIME NULL,
    login_attempts          INT NOT NULL DEFAULT 0,
    locked_until            DATETIME NULL,
    profile_completed       BOOLEAN NOT NULL DEFAULT FALSE,
    needs_password_change   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_entreprise) REFERENCES entreprise(id) ON DELETE SET NULL,
    INDEX idx_mail (mail),
    INDEX idx_uuid (uuid),
    INDEX idx_entreprise (id_entreprise),
    INDEX idx_verification_token (verification_token),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB;



CREATE TABLE etudiant (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    nom           VARCHAR(100) NOT NULL,
    prenom        VARCHAR(100) NOT NULL,
    date_naissance DATE,
    sexe          ENUM('H','F'),
    adresse       TEXT,
    ville         VARCHAR(100),
    tel           VARCHAR(20),
    mail          VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe  VARCHAR(255) NOT NULL,
    niveau        ENUM('1A','2A','3A'),
    filiere       ENUM('GL','BIA','SSE','2IA','IDF','2SCL','D2S','CSCC'),
    id_universite INT,
    score         DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (score >= 0 AND score <= 20),
    a_desiste     BOOLEAN NOT NULL DEFAULT FALSE,
    date_desistement DATETIME NULL,
    cv_pdf        VARCHAR(255),
    lm_pdf        VARCHAR(255),
    is_verified             BOOLEAN NOT NULL DEFAULT TRUE,
    verification_token      VARCHAR(128) NULL,
    verification_token_expires DATETIME NULL,
    reset_token             VARCHAR(128) NULL,
    reset_token_expires     DATETIME NULL,
    last_login              DATETIME NULL,
    login_attempts          INT NOT NULL DEFAULT 0,
    locked_until            DATETIME NULL,
    profile_completed       BOOLEAN NOT NULL DEFAULT TRUE,
    needs_password_change   BOOLEAN NOT NULL DEFAULT TRUE,
    oauth_provider      ENUM('local','google') NOT NULL DEFAULT 'local',
    oauth_id            VARCHAR(255) NULL,
    mfa_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret          VARCHAR(64) NULL,
    avatar_url          VARCHAR(500) NULL,
    theme_preference    ENUM('light','dark') NOT NULL DEFAULT 'light',
    language_preference ENUM('fr','en','ar') NOT NULL DEFAULT 'fr',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_universite) REFERENCES etablissement(id) ON DELETE SET NULL,
    INDEX idx_mail (mail),
    INDEX idx_uuid (uuid),
    INDEX idx_universite (id_universite),
    INDEX idx_filiere (filiere),
    INDEX idx_score (score),
    INDEX idx_verification_token (verification_token),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB;



CREATE TABLE stage (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    uuid          CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    titre         VARCHAR(255) NOT NULL,
    description   TEXT,
    id_entreprise INT NOT NULL,
    domaine       VARCHAR(100),
    type_stage    VARCHAR(100),
    type_offre    ENUM('pfa','pfe') NOT NULL DEFAULT 'pfe',
    niveaux       SET('1A','2A','3A') NOT NULL DEFAULT '3A',
    localisation  VARCHAR(150),
    competences_requises TEXT,
    avantages     TEXT,
    nbr_postes    INT NOT NULL DEFAULT 1,
    date_debut    DATE,
    date_fin      DATE,
    date_limite   DATE,
    statut        ENUM('ouvert','ferme','en_cours','termine') NOT NULL DEFAULT 'ouvert',
    id_encadrant_entr INT NULL,
    id_encadrant_univ INT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_entreprise) REFERENCES entreprise(id) ON DELETE CASCADE,
    FOREIGN KEY (id_encadrant_entr) REFERENCES encadrant_entr(id) ON DELETE SET NULL,
    FOREIGN KEY (id_encadrant_univ) REFERENCES encadrant_univ(id) ON DELETE SET NULL,
    INDEX idx_titre (titre),
    INDEX idx_uuid (uuid),
    INDEX idx_entreprise (id_entreprise),
    INDEX idx_statut (statut),
    INDEX idx_domaine (domaine),
    INDEX idx_date_limite (date_limite)
) ENGINE=InnoDB;


CREATE TABLE classement (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    uuid        CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    id_etudiant INT NOT NULL,
    id_stage    INT NOT NULL,
    rang        INT NOT NULL,
    statut      ENUM('en_attente','accepte','refuse') NOT NULL DEFAULT 'en_attente',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_etudiant) REFERENCES etudiant(id) ON DELETE CASCADE,
    FOREIGN KEY (id_stage) REFERENCES stage(id) ON DELETE CASCADE,
    UNIQUE KEY uq_voeu (id_etudiant, id_stage),
    INDEX idx_etudiant (id_etudiant),
    INDEX idx_stage (id_stage),
    INDEX idx_rang (rang)
) ENGINE=InnoDB;



CREATE TABLE affectation (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    uuid                CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    id_etudiant         INT NOT NULL,
    id_stage            INT NOT NULL,
    id_encadrant_entr   INT NULL,
    id_encadrant_univ   INT NULL,
    date_affectation    DATE,
    statut              ENUM('en_attente','confirmee','en_cours','terminee') NOT NULL DEFAULT 'en_attente',
    rapport_pdf         VARCHAR(255) NULL,
    rapport_statut      ENUM('non_depose','en_attente','valide','rejete') NOT NULL DEFAULT 'non_depose',
    convention_pdf      VARCHAR(255) NULL,
    note_finale         DECIMAL(5,2) NULL,
    note_encadrant_entr DECIMAL(5,2) NULL,
    note_encadrant_univ DECIMAL(5,2) NULL,
    commentaire         TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_etudiant) REFERENCES etudiant(id) ON DELETE CASCADE,
    FOREIGN KEY (id_stage) REFERENCES stage(id) ON DELETE CASCADE,
    FOREIGN KEY (id_encadrant_entr) REFERENCES encadrant_entr(id) ON DELETE SET NULL,
    FOREIGN KEY (id_encadrant_univ) REFERENCES encadrant_univ(id) ON DELETE SET NULL,
    UNIQUE KEY uq_etudiant (id_etudiant),
    INDEX idx_uuid (uuid),
    INDEX idx_stage (id_stage),
    INDEX idx_encadrant_entr (id_encadrant_entr),
    INDEX idx_encadrant_univ (id_encadrant_univ),
    INDEX idx_statut (statut)
) ENGINE=InnoDB;



CREATE TABLE affectation_run (
    niveau                   ENUM('1A','2A','3A') PRIMARY KEY,
    date_affectation         DATETIME NULL,
    delai_desistement_jours  INT NOT NULL DEFAULT 7,
    updated_at               DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO affectation_run (niveau) VALUES ('1A'), ('2A'), ('3A');



CREATE TABLE deadline_classement (
    niveau      ENUM('1A','2A','3A') PRIMARY KEY,
    date_limite DATE NULL,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO deadline_classement (niveau) VALUES ('1A'), ('2A'), ('3A');



CREATE TABLE tache (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    uuid              CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    titre             VARCHAR(255) NOT NULL,
    description       TEXT,
    id_stage          INT NOT NULL,
    id_etudiant       INT NULL,
    id_encadrant_entr INT NULL,
    statut            ENUM('a_faire','en_cours','terminee') NOT NULL DEFAULT 'a_faire',
    priorite          ENUM('basse','moyenne','haute') NOT NULL DEFAULT 'moyenne',
    date_echeance     DATE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_stage) REFERENCES stage(id) ON DELETE CASCADE,
    FOREIGN KEY (id_etudiant) REFERENCES etudiant(id) ON DELETE SET NULL,
    FOREIGN KEY (id_encadrant_entr) REFERENCES encadrant_entr(id) ON DELETE SET NULL,
    INDEX idx_uuid (uuid),
    INDEX idx_stage (id_stage),
    INDEX idx_etudiant (id_etudiant),
    INDEX idx_statut (statut)
) ENGINE=InnoDB;



CREATE TABLE document (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    uuid              CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    nom               VARCHAR(255) NOT NULL,
    type              VARCHAR(50),
    taille            INT,
    chemin            VARCHAR(500) NOT NULL,
    id_etudiant       INT NULL,
    id_stage          INT NULL,
    id_encadrant_entr INT NULL,
    id_encadrant_univ INT NULL,
    statut            ENUM('en_attente','valide','rejete') NOT NULL DEFAULT 'en_attente',
    commentaire       TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_etudiant) REFERENCES etudiant(id) ON DELETE CASCADE,
    FOREIGN KEY (id_stage) REFERENCES stage(id) ON DELETE SET NULL,
    FOREIGN KEY (id_encadrant_entr) REFERENCES encadrant_entr(id) ON DELETE SET NULL,
    FOREIGN KEY (id_encadrant_univ) REFERENCES encadrant_univ(id) ON DELETE SET NULL,
    INDEX idx_uuid (uuid),
    INDEX idx_etudiant (id_etudiant),
    INDEX idx_stage (id_stage),
    INDEX idx_type (type)
) ENGINE=InnoDB;



CREATE TABLE chat_conversation (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    participant_a_id   INT NOT NULL,
    participant_a_role VARCHAR(40) NOT NULL,
    participant_b_id   INT NOT NULL,
    participant_b_role VARCHAR(40) NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_conversation (participant_a_id, participant_a_role, participant_b_id, participant_b_role),
    INDEX idx_participant_a (participant_a_id, participant_a_role),
    INDEX idx_participant_b (participant_b_id, participant_b_role),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB;

CREATE TABLE chat_message (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id       INT NOT NULL,
    sender_role     VARCHAR(40) NOT NULL,
    content         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversation(id) ON DELETE CASCADE,
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender (sender_id, sender_role),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB;




CREATE VIEW users_auth AS
SELECT id, uuid, mail AS email, mot_de_passe AS password, 'ETUDIANT' AS role,
       is_verified, verification_token, verification_token_expires,
       reset_token, reset_token_expires, last_login, login_attempts, locked_until,
       needs_password_change, profile_completed,
       oauth_provider, oauth_id, mfa_enabled, mfa_secret,
       avatar_url, theme_preference, language_preference, created_at, updated_at
FROM etudiant
UNION ALL
SELECT id, uuid, mail, mot_de_passe, 'ENCADRANT_UNIV',
       is_verified, verification_token, verification_token_expires,
       reset_token, reset_token_expires, last_login, login_attempts, locked_until,
       needs_password_change, profile_completed,
       'local', NULL, FALSE, NULL, NULL, 'light', 'fr', created_at, updated_at
FROM encadrant_univ
UNION ALL
SELECT id, uuid, mail, mot_de_passe, 'ENCADRANT_ENTREPRISE',
       is_verified, verification_token, verification_token_expires,
       reset_token, reset_token_expires, last_login, login_attempts, locked_until,
       needs_password_change, profile_completed,
       'local', NULL, FALSE, NULL, NULL, 'light', 'fr', created_at, updated_at
FROM encadrant_entr
UNION ALL
SELECT id, uuid, mail, mot_de_passe, 'ADMIN_UNIV',
       is_verified, verification_token, verification_token_expires,
       reset_token, reset_token_expires, last_login, login_attempts, locked_until,
       needs_password_change, profile_completed,
       'local', NULL, FALSE, NULL, NULL, 'light', 'fr', created_at, updated_at
FROM etablissement
UNION ALL
SELECT id, uuid, mail, mot_de_passe, 'ADMIN_ENTREPRISE',
       is_verified, verification_token, verification_token_expires,
       reset_token, reset_token_expires, last_login, login_attempts, locked_until,
       needs_password_change, profile_completed,
       'local', NULL, FALSE, NULL, NULL, 'light', 'fr', created_at, updated_at
FROM entreprise;

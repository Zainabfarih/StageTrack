const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { executeQuery } = require('../models/db');

const CHAT_PERMISSIONS = {
  ADMIN_UNIV:           ['ETUDIANT', 'ENCADRANT_UNIV', 'ADMIN_ENTREPRISE'],
  ADMIN_ENTREPRISE:     ['ETUDIANT', 'ENCADRANT_ENTREPRISE', 'ADMIN_UNIV'],
  ETUDIANT:             ['ENCADRANT_UNIV', 'ENCADRANT_ENTREPRISE', 'ADMIN_UNIV', 'ADMIN_ENTREPRISE'],
  ENCADRANT_UNIV:       ['ETUDIANT', 'ADMIN_UNIV'],
  ENCADRANT_ENTREPRISE: ['ETUDIANT', 'ADMIN_ENTREPRISE'],
};

const canChat = (roleA, roleB) => (CHAT_PERMISSIONS[roleA] || []).includes(roleB);

const normalizePair = (idA, roleA, idB, roleB) => {
  const keyA = `${roleA}:${idA}`;
  const keyB = `${roleB}:${idB}`;
  return keyA < keyB
    ? { aId: idA, aRole: roleA, bId: idB, bRole: roleB }
    : { aId: idB, aRole: roleB, bId: idA, bRole: roleA };
};

async function getContactInfo(id, role) {
  const queries = {
    ETUDIANT:             `SELECT CONCAT(prenom, ' ', nom) AS name FROM etudiant WHERE id = ?`,
    ENCADRANT_UNIV:       `SELECT CONCAT(prenom, ' ', nom) AS name FROM encadrant_univ WHERE id = ?`,
    ENCADRANT_ENTREPRISE: `SELECT CONCAT(prenom, ' ', nom) AS name FROM encadrant_entr WHERE id = ?`,
    ADMIN_UNIV:           `SELECT nom AS name FROM etablissement WHERE id = ?`,
    ADMIN_ENTREPRISE:     `SELECT nom AS name FROM entreprise WHERE id = ?`,
  };
  const sql = queries[role];
  if (!sql) return null;
  const rows = await executeQuery(sql, [id]);
  return rows[0] || null;
}

// Conversations existantes
router.get('/contacts', verifyToken, async (req, res) => {
  const { userId, userRole } = req;
  try {
    const conversations = await executeQuery(
      `SELECT cc.*,
         (SELECT content    FROM chat_message cm WHERE cm.conversation_id = cc.id ORDER BY cm.created_at DESC LIMIT 1) AS last_message,
         (SELECT created_at FROM chat_message cm WHERE cm.conversation_id = cc.id ORDER BY cm.created_at DESC LIMIT 1) AS last_message_at,
         (SELECT COUNT(*)   FROM chat_message cm
          WHERE cm.conversation_id = cc.id AND cm.is_read = 0
            AND NOT (cm.sender_id = :userId AND cm.sender_role = :userRole)) AS unread_count
       FROM chat_conversation cc
       WHERE (cc.participant_a_id = :userId AND cc.participant_a_role = :userRole)
          OR (cc.participant_b_id = :userId AND cc.participant_b_role = :userRole)
       ORDER BY last_message_at DESC`,
      { userId, userRole },
    );

    const contacts = await Promise.all(conversations.map(async (conv) => {
      const isA = conv.participant_a_id === userId && conv.participant_a_role === userRole;
      const contactId = isA ? conv.participant_b_id : conv.participant_a_id;
      const contactRole = isA ? conv.participant_b_role : conv.participant_a_role;
      const info = await getContactInfo(contactId, contactRole);
      return {
        conversation_id: conv.id,
        contact_id: contactId,
        contact_role: contactRole,
        contact_name: info?.name || 'Utilisateur',
        last_message: conv.last_message,
        last_message_at: conv.last_message_at,
        unread_count: conv.unread_count,
      };
    }));

    res.json(contacts);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Contacts autorisés selon le rôle et les relations
router.get('/allowed-contacts', verifyToken, async (req, res) => {
  const { userId, userRole } = req;
  try {
    let contacts = [];

    switch (userRole) {
      case 'ADMIN_UNIV': {
        const etudiants = await executeQuery(
          `SELECT id, CONCAT(prenom, ' ', nom) AS name, 'ETUDIANT' AS role
           FROM etudiant WHERE id_universite = :userId`, { userId });
        const encadrantsUniv = await executeQuery(
          `SELECT id, CONCAT(prenom, ' ', nom) AS name, 'ENCADRANT_UNIV' AS role
           FROM encadrant_univ WHERE id_universite = :userId`, { userId });
        const entreprises = await executeQuery(
          `SELECT id, nom AS name, 'ADMIN_ENTREPRISE' AS role FROM entreprise`);
        contacts = [...etudiants, ...encadrantsUniv, ...entreprises];
        break;
      }

      case 'ADMIN_ENTREPRISE': {
        const encadrantsEntr = await executeQuery(
          `SELECT id, CONCAT(prenom, ' ', nom) AS name, 'ENCADRANT_ENTREPRISE' AS role
           FROM encadrant_entr WHERE id_entreprise = :userId`, { userId });
        const stagiaires = await executeQuery(
          `SELECT DISTINCT et.id, CONCAT(et.prenom, ' ', et.nom) AS name, 'ETUDIANT' AS role
           FROM affectation a
           JOIN etudiant et ON et.id = a.id_etudiant
           JOIN encadrant_entr ee ON ee.id = a.id_encadrant_entr
           WHERE ee.id_entreprise = :userId`, { userId });
        contacts = [...encadrantsEntr, ...stagiaires];
        break;
      }

      case 'ETUDIANT': {
        const adminUniv = await executeQuery(
          `SELECT etab.id, etab.nom AS name, 'ADMIN_UNIV' AS role
           FROM etudiant e JOIN etablissement etab ON etab.id = e.id_universite
           WHERE e.id = :userId`, { userId });
        const encUniv = await executeQuery(
          `SELECT DISTINCT eu.id, CONCAT(eu.prenom, ' ', eu.nom) AS name, 'ENCADRANT_UNIV' AS role
           FROM affectation a JOIN encadrant_univ eu ON eu.id = a.id_encadrant_univ
           WHERE a.id_etudiant = :userId`, { userId });
        const encEntr = await executeQuery(
          `SELECT DISTINCT ee.id, CONCAT(ee.prenom, ' ', ee.nom) AS name, 'ENCADRANT_ENTREPRISE' AS role
           FROM affectation a JOIN encadrant_entr ee ON ee.id = a.id_encadrant_entr
           WHERE a.id_etudiant = :userId`, { userId });
        const entreprise = await executeQuery(
          `SELECT DISTINCT en.id, en.nom AS name, 'ADMIN_ENTREPRISE' AS role
           FROM affectation a
           JOIN stage s ON s.id = a.id_stage
           JOIN entreprise en ON en.id = s.id_entreprise
           WHERE a.id_etudiant = :userId`, { userId });
        contacts = [...adminUniv, ...encUniv, ...encEntr, ...entreprise];
        break;
      }

      case 'ENCADRANT_UNIV': {
        const etudiants = await executeQuery(
          `SELECT et.id, CONCAT(et.prenom, ' ', et.nom) AS name, 'ETUDIANT' AS role
           FROM affectation a JOIN etudiant et ON et.id = a.id_etudiant
           WHERE a.id_encadrant_univ = :userId`, { userId });
        const adminUniv = await executeQuery(
          `SELECT etab.id, etab.nom AS name, 'ADMIN_UNIV' AS role
           FROM encadrant_univ eu JOIN etablissement etab ON etab.id = eu.id_universite
           WHERE eu.id = :userId`, { userId });
        contacts = [...etudiants, ...adminUniv];
        break;
      }

      case 'ENCADRANT_ENTREPRISE': {
        const etudiants = await executeQuery(
          `SELECT et.id, CONCAT(et.prenom, ' ', et.nom) AS name, 'ETUDIANT' AS role
           FROM affectation a JOIN etudiant et ON et.id = a.id_etudiant
           WHERE a.id_encadrant_entr = :userId`, { userId });
        const adminEntr = await executeQuery(
          `SELECT en.id, en.nom AS name, 'ADMIN_ENTREPRISE' AS role
           FROM encadrant_entr ee JOIN entreprise en ON en.id = ee.id_entreprise
           WHERE ee.id = :userId`, { userId });
        contacts = [...etudiants, ...adminEntr];
        break;
      }

      default:
        contacts = [];
    }

    const seen = new Set();
    const unique = contacts.filter((c) => {
      const key = `${c.role}:${c.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json(unique);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Créer ou retrouver une conversation
router.post('/conversation', verifyToken, async (req, res) => {
  const { userId, userRole } = req;
  const { contact_id, contact_role } = req.body;

  if (!contact_id || !contact_role) return res.status(400).json({ message: 'contact_id et contact_role requis' });
  if (!canChat(userRole, contact_role)) return res.status(403).json({ message: 'Communication non autorisée entre ces rôles' });

  try {
    const { aId, aRole, bId, bRole } = normalizePair(userId, userRole, contact_id, contact_role);
    const existing = await executeQuery(
      `SELECT id FROM chat_conversation
       WHERE participant_a_id = :aId AND participant_a_role = :aRole
         AND participant_b_id = :bId AND participant_b_role = :bRole`,
      { aId, aRole, bId, bRole },
    );
    if (existing.length) return res.json({ conversation_id: existing[0].id });

    const result = await executeQuery(
      `INSERT INTO chat_conversation (participant_a_id, participant_a_role, participant_b_id, participant_b_role)
       VALUES (:aId, :aRole, :bId, :bRole)`,
      { aId, aRole, bId, bRole },
    );
    res.status(201).json({ conversation_id: result.insertId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Messages d'une conversation
router.get('/conversation/:id/messages', verifyToken, async (req, res) => {
  const { userId, userRole } = req;
  const conversationId = parseInt(req.params.id);
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const access = await executeQuery(
      `SELECT id FROM chat_conversation
       WHERE id = :conversationId
         AND ((participant_a_id = :userId AND participant_a_role = :userRole)
           OR (participant_b_id = :userId AND participant_b_role = :userRole))`,
      { conversationId, userId, userRole },
    );
    if (!access.length) return res.status(403).json({ message: 'Accès non autorisé à cette conversation' });

    const messages = await executeQuery(
      `SELECT id, sender_id, sender_role, content, is_read, created_at
       FROM chat_message WHERE conversation_id = :conversationId
       ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
      { conversationId, limit, offset },
    );

    await executeQuery(
      `UPDATE chat_message SET is_read = 1
       WHERE conversation_id = :conversationId AND is_read = 0
         AND NOT (sender_id = :userId AND sender_role = :userRole)`,
      { conversationId, userId, userRole },
    );

    res.json(messages.reverse());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Envoyer un message
router.post('/conversation/:id/messages', verifyToken, async (req, res) => {
  const { userId, userRole } = req;
  const conversationId = parseInt(req.params.id);
  const { content } = req.body;

  if (!content || !content.trim()) return res.status(400).json({ message: 'Le message ne peut pas être vide' });

  try {
    const access = await executeQuery(
      `SELECT id FROM chat_conversation
       WHERE id = :conversationId
         AND ((participant_a_id = :userId AND participant_a_role = :userRole)
           OR (participant_b_id = :userId AND participant_b_role = :userRole))`,
      { conversationId, userId, userRole },
    );
    if (!access.length) return res.status(403).json({ message: 'Accès non autorisé à cette conversation' });

    const result = await executeQuery(
      `INSERT INTO chat_message (conversation_id, sender_id, sender_role, content)
       VALUES (:conversationId, :userId, :userRole, :content)`,
      { conversationId, userId, userRole, content: content.trim() },
    );
    await executeQuery(`UPDATE chat_conversation SET updated_at = NOW() WHERE id = :conversationId`, { conversationId });

    res.status(201).json({
      id: result.insertId,
      conversation_id: conversationId,
      sender_id: userId,
      sender_role: userRole,
      content: content.trim(),
      is_read: false,
      created_at: new Date(),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Nombre de messages non lus
router.get('/unread-count', verifyToken, async (req, res) => {
  const { userId, userRole } = req;
  try {
    const result = await executeQuery(
      `SELECT COUNT(*) AS total
       FROM chat_message cm JOIN chat_conversation cc ON cc.id = cm.conversation_id
       WHERE cm.is_read = 0
         AND NOT (cm.sender_id = :userId AND cm.sender_role = :userRole)
         AND ((cc.participant_a_id = :userId AND cc.participant_a_role = :userRole)
           OR (cc.participant_b_id = :userId AND cc.participant_b_role = :userRole))`,
      { userId, userRole },
    );
    res.json({ unread: result[0]?.total || 0 });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

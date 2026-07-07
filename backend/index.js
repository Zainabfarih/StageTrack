require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();


// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: (process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,OPTIONS').split(','),
  allowedHeaders: (process.env.CORS_HEADERS || 'Content-Type,Authorization').split(','),
}));

// ─── Body parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: process.env.BODY_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static files ─────────────────────────────────────────────────────────────
app.use('/public', express.static('public'));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',            require('./routes/authRoutes'));
app.use('/api/encadrant-univ',  require('./routes/encadrantUnivRoutes'));
app.use('/api/encadrant-entr',  require('./routes/encadrantEntrRoutes'));
app.use('/api/etudiants',       require('./routes/etudiantRoutes'));
app.use('/api/stages',          require('./routes/stageRoutes'));
app.use('/api/affectation',     require('./routes/affectationRoutes'));
app.use('/api/etablissements',  require('./routes/etablissementRoutes'));
app.use('/api/entreprises',     require('./routes/entrepriseRoutes'));
app.use('/api/documents',       require('./routes/documentRoutes'));
app.use('/api/taches',          require('./routes/tacheRoutes'));
app.use('/api/classement',      require('./routes/classementRoutes'));
app.use('/api/chat',            require('./routes/chatRoutes'));
app.use('/api/etudiant-stage',  require('./routes/etudiantStageRoutes'));
app.use('/api/encadrant-stage', require('./routes/encadrantStageRoutes'));


// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route non trouvée' }));

// ─── Error handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Erreur interne du serveur' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Serveur démarré sur le port ${PORT}`));

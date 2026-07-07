// Initialise la base : exécute database/schema.sql puis le seed admin.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dbConfig = require('../config/db.config');

async function init() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    console.log('✅ Schéma appliqué (base stagetrack recréée).');
  } catch (err) {
    console.error('❌ Erreur lors de l\'application du schéma :', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

init();

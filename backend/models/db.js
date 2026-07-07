const mysql = require('mysql2/promise');
const dbConfig = require("../config/db.config");

// Create a connection pool with promises
const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port:dbConfig.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true 
});


const sanitizeParams = (params) => {
  if (Array.isArray(params)) {
    return params.map((v) => (v === undefined ? null : v));
  }
  if (params && typeof params === 'object') {
    const safe = {};
    for (const key of Object.keys(params)) {
      safe[key] = params[key] === undefined ? null : params[key];
    }
    return safe;
  }
  return params;
};

// Utility function for executing queries
const executeQuery = async (sql, params = {}) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(sql, sanitizeParams(params));
    return rows;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Utility function for executing transactions
const executeTransaction = async (operations) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const result = await operations(connection);

    await connection.commit();
    return result;
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Transaction failed:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

 const executeStoredProcedure = async (procedureName, params = []) => {
  const connection = await pool.getConnection();
  try {
    const placeholders = params.map(() => '?').join(',');
    const query = `CALL ${procedureName}(${placeholders})`;
    
    const [results] = await connection.query(query, params);
    return results;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  executeQuery,
  executeTransaction,
  executeStoredProcedure
};
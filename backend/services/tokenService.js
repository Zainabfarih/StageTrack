const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/auth.config');
const { executeQuery } = require('../models/db');

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

class TokenService {
  // Access token JWT court (15 min)
  static generateAccessToken(payload) {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiration,
      issuer: 'stagetrack.tech',
      audience: 'stagetrack-users',
    });
  }

  // Refresh token opaque persisté (role inclus pour éviter la collision d'ID)
  static async generateRefreshToken(userId, role, userAgent = '', ip = null) {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    await this.cleanExpiredAndRevokedTokens(userId, role);

    await executeQuery(
      `INSERT INTO refresh_tokens (user_id, role, token, expires_at, user_agent, ip_address)
       VALUES (:userId, :role, :token, :expiresAt, :userAgent, :ip)`,
      { userId, role, token: refreshToken, expiresAt, userAgent, ip },
    );

    return refreshToken;
  }

  // Vérifie puis fait tourner le refresh token (rotation)
  static async verifyAndRotateRefreshToken(token, userAgent = '', ip = null) {
    const rows = await executeQuery(
      `SELECT user_id, role FROM refresh_tokens
       WHERE token = :token AND is_revoked = 0 AND expires_at > NOW()`,
      { token },
    );
    if (!rows.length) throw new Error('Refresh token invalide ou expiré');

    const { user_id, role } = rows[0];
    await this.revokeRefreshToken(token);
    const newToken = await this.generateRefreshToken(user_id, role, userAgent, ip);
    return { token: newToken, userId: user_id, role };
  }

  static async revokeRefreshToken(token) {
    await executeQuery(
      `UPDATE refresh_tokens SET is_revoked = 1, revoked_at = NOW() WHERE token = :token`,
      { token },
    );
  }

  static async revokeAllUserTokens(userId, role) {
    await executeQuery(
      `UPDATE refresh_tokens SET is_revoked = 1, revoked_at = NOW()
       WHERE user_id = :userId AND role = :role AND is_revoked = 0`,
      { userId, role },
    );
  }

  // Nettoyage applicatif avant chaque insertion
  static async cleanExpiredAndRevokedTokens(userId, role) {
    await executeQuery(
      `DELETE FROM refresh_tokens
       WHERE user_id = :userId AND role = :role AND (expires_at < NOW() OR is_revoked = 1)`,
      { userId, role },
    );
  }

  static async cleanAllExpiredTokens() {
    await executeQuery(`DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = 1`);
  }
}

module.exports = TokenService;

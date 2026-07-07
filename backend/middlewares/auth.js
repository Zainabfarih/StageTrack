const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) {
    return res.status(403).json({ 
      message: "Token d'authentification requis",
      error: "MISSING_TOKEN"
    });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  jwt.verify(token, config.jwtSecret, {
    issuer: 'stagetrack.tech',
    audience: 'stagetrack-users'
  }, (err, decoded) => {
    if (err) {
      let message = "Token invalide";
      let error = "INVALID_TOKEN";
      
      if (err.name === 'TokenExpiredError') {
        message = "Token expiré";
        error = "TOKEN_EXPIRED";
      } else if (err.name === 'JsonWebTokenError') {
        message = "Token mal formé";
        error = "MALFORMED_TOKEN";
      }
      
      return res.status(401).json({ 
        message, 
        error,
        expiresIn: 900
      });
    }
    
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    req.userUuid = decoded.uuid;
    req.tokenPayload = decoded;
    
    next();
  });
};

// Middleware optionnel (ne bloque pas si pas de token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) {
    return next();
  }
  
  // Tenter la vérification mais ne pas bloquer en cas d'échec
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  jwt.verify(token, config.jwtSecret, {
    issuer: 'stagetrack.tech',
    audience: 'stagetrack-users'
  }, (err, decoded) => {
    if (!err) {
      req.userId = decoded.id;
      req.userRole = decoded.role;
      req.userEmail = decoded.email;
      req.tokenPayload = decoded;
    }
    next();
  });
};

module.exports = {
  verifyToken,
  optionalAuth
};
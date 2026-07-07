const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const TokenService = require('../services/tokenService');
const { executeQuery } = require('../models/db');

class AuthMiddleware {
  // Middleware principal de vérification JWT
  static verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader) {
      return res.status(403).json({ 
        success: false,
        message: "Token d'authentification requis",
        error: "MISSING_TOKEN",
        code: "AUTH_001"
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    jwt.verify(token, config.jwtSecret, {
      issuer: 'stagetrack.tech',
      audience: 'stagetrack-users'
    }, async (err, decoded) => {
      if (err) {
        let message = "Token invalide";
        let error = "INVALID_TOKEN";
        let code = "AUTH_002";
        
        if (err.name === 'TokenExpiredError') {
          message = "Token expiré";
          error = "TOKEN_EXPIRED";
          code = "AUTH_003";
        } else if (err.name === 'JsonWebTokenError') {
          message = "Token mal formé";
          error = "MALFORMED_TOKEN";
          code = "AUTH_004";
        }
        
        return res.status(401).json({ 
          success: false,
          message, 
          error,
          code,
          expiresIn: 900,
          hint: "Utilisez /api/auth/refresh-token pour renouveler"
        });
      }
      
      // Vérifier que l'utilisateur existe toujours
      try {
        const userCheck = await executeQuery(
          "SELECT id, is_verified FROM users_auth WHERE id = :id AND role = :role",
          { id: decoded.id, role: decoded.role }
        );
        
        if (!userCheck.length) {
          return res.status(401).json({
            success: false,
            message: "Utilisateur non trouvé ou supprimé",
            error: "USER_NOT_FOUND",
            code: "AUTH_005"
          });
        }

        if (!userCheck[0].is_verified) {
          return res.status(403).json({
            success: false,
            message: "Compte non vérifié",
            error: "ACCOUNT_NOT_VERIFIED",
            code: "AUTH_006"
          });
        }
      } catch (dbError) {
        console.error('Erreur vérification utilisateur:', dbError);
        return res.status(500).json({
          success: false,
          message: "Erreur de vérification utilisateur",
          error: "DATABASE_ERROR",
          code: "AUTH_007"
        });
      }
      
      // Ajouter les informations utilisateur à la requête
      req.userId = decoded.id;
      req.userRole = decoded.role;
      req.userEmail = decoded.email;
      req.tokenPayload = decoded;
      
      next();
    });
  };

  // Middleware optionnel (ne bloque pas si pas de token)
  static optionalAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader) {
      return next();
    }
    
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

  // Middleware de vérification des rôles avec hiérarchie
  static checkRole = (allowedRoles) => {
    return (req, res, next) => {
      if (!req.userRole) {
        return res.status(403).json({
          success: false,
          message: "Rôle non défini",
          error: "ROLE_NOT_DEFINED",
          code: "AUTH_008"
        });
      }

      // Vérifier si le rôle est dans la liste des rôles autorisés
      if (!allowedRoles.includes(req.userRole)) {
        // Vérifier la hiérarchie des rôles
        const userRoleLevel = config.roleHierarchy[req.userRole] || 0;
        const requiredLevel = Math.max(...allowedRoles.map(role => config.roleHierarchy[role] || 0));
        
        if (userRoleLevel < requiredLevel) {
          return res.status(403).json({
            success: false,
            message: `Accès refusé. Rôle requis: ${allowedRoles.join(' ou ')}`,
            error: "INSUFFICIENT_PERMISSIONS",
            code: "AUTH_009",
            currentRole: req.userRole,
            requiredRoles: allowedRoles
          });
        }
      }

      next();
    };
  };

  // Middleware pour vérifier si l'utilisateur est propriétaire de la ressource
  static checkOwnership = (resourceIdParam = 'id', resourceType = 'generic') => {
    return async (req, res, next) => {
      try {
        const resourceId = req.params[resourceIdParam];
        const userId = req.userId;
        const userRole = req.userRole;

        // Les admins ont accès à tout
        const adminRoles = [config.roles.ADMIN_UNIV, config.roles.ADMIN_ENTREPRISE, config.roles.SUPER_ADMIN];
        if (adminRoles.includes(userRole)) {
          return next();
        }

        let query = '';
        let params = { userId, resourceId };

        // Adapter la requête selon le type de ressource
        switch (resourceType) {
          case 'etudiant':
            query = 'SELECT id FROM etudiant WHERE id = :resourceId AND id = :userId';
            break;
          case 'stage':
            query = `
              SELECT s.id FROM stage s 
              JOIN entreprise e ON s.id_entreprise = e.id 
              WHERE s.id = :resourceId AND e.id = :userId
            `;
            break;
          case 'tache':
            query = 'SELECT id FROM tache WHERE id = :resourceId AND id_etudiant = :userId';
            break;
          default:
            return res.status(400).json({
              success: false,
              message: "Type de ressource non supporté",
              error: "UNSUPPORTED_RESOURCE_TYPE",
              code: "AUTH_010"
            });
        }

        const result = await executeQuery(query, params);
        
        if (!result.length) {
          return res.status(403).json({
            success: false,
            message: "Accès refusé. Ressource non trouvée ou accès non autorisé",
            error: "RESOURCE_ACCESS_DENIED",
            code: "AUTH_011"
          });
        }

        next();
      } catch (error) {
        console.error('Erreur vérification ownership:', error);
        return res.status(500).json({
          success: false,
          message: "Erreur de vérification d'accès",
          error: "OWNERSHIP_CHECK_ERROR",
          code: "AUTH_012"
        });
      }
    };
  };

  // Middleware pour limiter le taux de requêtes par utilisateur
  static rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const userRequests = new Map();

    return (req, res, next) => {
      if (!req.userId) {
        return next(); 
      }

      const now = Date.now();
      const userKey = `${req.userId}:${req.path}`;
      const userData = userRequests.get(userKey) || { count: 0, resetTime: now + windowMs };

      if (now > userData.resetTime) {
        userData.count = 0;
        userData.resetTime = now + windowMs;
      }

      userData.count++;
      userRequests.set(userKey, userData);

      if (userData.count > maxRequests) {
        return res.status(429).json({
          success: false,
          message: "Trop de requêtes. Veuillez réessayer plus tard",
          error: "RATE_LIMIT_EXCEEDED",
          code: "AUTH_013",
          retryAfter: Math.ceil((userData.resetTime - now) / 1000)
        });
      }

      next();
    };
  };

  // Middleware pour logger les actions sensibles
  static auditLog = (action = 'UNKNOWN_ACTION') => {
    return (req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        setTimeout(() => {
          console.log(`[AUDIT] ${new Date().toISOString()} - ${action} - User: ${req.userId} (${req.userRole}) - IP: ${req.ip} - Path: ${req.path} - Status: ${res.statusCode}`);
        }, 0);
        
        originalSend.call(this, data);
      };

      next();
    };
  };

  // Middleware pour vérifier la fraîcheur du token
  static checkTokenFreshness = (maxAgeMinutes = 10) => {
    return (req, res, next) => {
      if (!req.tokenPayload) {
        return res.status(401).json({
          success: false,
          message: "Token payload non disponible",
          error: "MISSING_TOKEN_PAYLOAD",
          code: "AUTH_014"
        });
      }

      const tokenAge = (Date.now() / 1000) - req.tokenPayload.iat;
      const maxAgeSeconds = maxAgeMinutes * 60;

      if (tokenAge > maxAgeSeconds) {
        return res.status(401).json({
          success: false,
          message: "Token trop ancien. Veuillez le rafraîchir",
          error: "TOKEN_TOO_OLD",
          code: "AUTH_015",
          tokenAge: Math.floor(tokenAge),
          maxAge: maxAgeSeconds
        });
      }

      next();
    };
  };
}

module.exports = AuthMiddleware;

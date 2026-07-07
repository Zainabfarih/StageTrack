class ErrorHandler {
  // Codes d'erreur standardisés
  static ERROR_CODES = {
    // Authentification (AUTH_xxx)
    AUTH_MISSING_TOKEN: 'AUTH_001',
    AUTH_INVALID_TOKEN: 'AUTH_002',
    AUTH_TOKEN_EXPIRED: 'AUTH_003',
    AUTH_MALFORMED_TOKEN: 'AUTH_004',
    AUTH_USER_NOT_FOUND: 'AUTH_005',
    AUTH_ACCOUNT_NOT_VERIFIED: 'AUTH_006',
    AUTH_DATABASE_ERROR: 'AUTH_007',
    AUTH_ROLE_NOT_DEFINED: 'AUTH_008',
    AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_009',
    AUTH_UNSUPPORTED_RESOURCE_TYPE: 'AUTH_010',
    AUTH_RESOURCE_ACCESS_DENIED: 'AUTH_011',
    AUTH_OWNERSHIP_CHECK_ERROR: 'AUTH_012',
    AUTH_RATE_LIMIT_EXCEEDED: 'AUTH_013',
    AUTH_MISSING_TOKEN_PAYLOAD: 'AUTH_014',
    AUTH_TOKEN_TOO_OLD: 'AUTH_015',

    // Validation (VAL_xxx)
    VAL_REQUIRED_FIELD: 'VAL_001',
    VAL_INVALID_EMAIL: 'VAL_002',
    VAL_INVALID_PASSWORD: 'VAL_003',
    VAL_INVALID_FORMAT: 'VAL_004',
    VAL_DUPLICATE_VALUE: 'VAL_005',

    // Base de données (DB_xxx)
    DB_CONNECTION_ERROR: 'DB_001',
    DB_QUERY_ERROR: 'DB_002',
    DB_NOT_FOUND: 'DB_003',
    DB_CONSTRAINT_VIOLATION: 'DB_004',
    DB_TRANSACTION_ERROR: 'DB_005',

    // Business Logic (BIZ_xxx)
    BIZ_EMAIL_ALREADY_USED: 'BIZ_001',
    BIZ_INVALID_CREDENTIALS: 'BIZ_002',
    BIZ_ACCOUNT_LOCKED: 'BIZ_003',
    BIZ_RESOURCE_NOT_FOUND: 'BIZ_004',
    BIZ_OPERATION_NOT_ALLOWED: 'BIZ_005',

    // Système (SYS_xxx)
    SYS_INTERNAL_ERROR: 'SYS_001',
    SYS_SERVICE_UNAVAILABLE: 'SYS_002',
    SYS_RATE_LIMIT_EXCEEDED: 'SYS_003'
  };

  // Messages d'erreur pré-définis
  static ERROR_MESSAGES = {
    [this.ERROR_CODES.AUTH_MISSING_TOKEN]: "Token d'authentification requis",
    [this.ERROR_CODES.AUTH_INVALID_TOKEN]: "Token invalide",
    [this.ERROR_CODES.AUTH_TOKEN_EXPIRED]: "Token expiré",
    [this.ERROR_CODES.AUTH_MALFORMED_TOKEN]: "Token mal formé",
    [this.ERROR_CODES.AUTH_USER_NOT_FOUND]: "Utilisateur non trouvé ou supprimé",
    [this.ERROR_CODES.AUTH_ACCOUNT_NOT_VERIFIED]: "Compte non vérifié",
    [this.ERROR_CODES.AUTH_DATABASE_ERROR]: "Erreur de vérification utilisateur",
    [this.ERROR_CODES.AUTH_ROLE_NOT_DEFINED]: "Rôle non défini",
    [this.ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: "Permissions insuffisantes",
    [this.ERROR_CODES.VAL_REQUIRED_FIELD]: "Champ obligatoire manquant",
    [this.ERROR_CODES.VAL_INVALID_EMAIL]: "Format d'email invalide",
    [this.ERROR_CODES.VAL_INVALID_PASSWORD]: "Mot de passe invalide",
    [this.ERROR_CODES.DB_CONNECTION_ERROR]: "Erreur de connexion à la base de données",
    [this.ERROR_CODES.DB_QUERY_ERROR]: "Erreur lors de l'exécution de la requête",
    [this.ERROR_CODES.DB_NOT_FOUND]: "Ressource non trouvée",
    [this.ERROR_CODES.BIZ_EMAIL_ALREADY_USED]: "Cet email est déjà utilisé",
    [this.ERROR_CODES.BIZ_INVALID_CREDENTIALS]: "Identifiants invalides",
    [this.ERROR_CODES.SYS_INTERNAL_ERROR]: "Erreur interne du serveur"
  };

  // Créer une erreur formatée
  static createError(code, message = null, details = null, statusCode = null) {
    const error = new Error(message || this.ERROR_MESSAGES[code] || 'Erreur inconnue');
    error.code = code;
    error.details = details;
    error.statusCode = statusCode || this.getDefaultStatusCode(code);
    error.timestamp = new Date().toISOString();
    return error;
  }

  // Obtenir le code HTTP par défaut selon le code d'erreur
  static getDefaultStatusCode(errorCode) {
    if (errorCode.startsWith('AUTH_')) return 401;
    if (errorCode.startsWith('VAL_')) return 400;
    if (errorCode.startsWith('DB_')) return 500;
    if (errorCode.startsWith('BIZ_')) return 400;
    if (errorCode.startsWith('SYS_')) return 500;
    return 500;
  }

  // Middleware de gestion des erreurs
  static handleErrors = (err, req, res, next) => {
    // Log détaillé de l'erreur
    console.error(`[${new Date().toISOString()}] ERROR:`, {
      code: err.code || 'SYS_INTERNAL_ERROR',
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.userId,
      userRole: req.userRole
    });

    // Ne pas exposer les détails techniques en production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const response = {
      success: false,
      error: {
        code: err.code || this.ERROR_CODES.SYS_INTERNAL_ERROR,
        message: err.message || this.ERROR_MESSAGES[this.ERROR_CODES.SYS_INTERNAL_ERROR],
        timestamp: new Date().toISOString(),
        path: req.path
      }
    };

    // Ajouter des détails supplémentaires en développement
    if (isDevelopment) {
      response.error.stack = err.stack;
      response.error.details = err.details;
    }

    // Gérer les erreurs de validation Mongoose/Sequelize
    if (err.name === 'ValidationError') {
      response.error.code = this.ERROR_CODES.VAL_REQUIRED_FIELD;
      response.error.message = 'Erreur de validation';
      response.error.details = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json(response);
    }

    // Gérer les erreurs de duplicate key
    if (err.code === 11000 || err.errno === 1062) {
      response.error.code = this.ERROR_CODES.BIZ_EMAIL_ALREADY_USED;
      response.error.message = 'Cet email est déjà utilisé';
      return res.status(400).json(response);
    }

    res.status(err.statusCode || 500).json(response);
  };

  // Middleware pour les routes non trouvées
  static handleNotFound = (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'SYS_NOT_FOUND',
        message: `Route ${req.method} ${req.path} non trouvée`,
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  };

  // Wrapper async pour les contrôleurs
  static asyncHandler = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  // Validation des entrées
  static validateInput = (schema) => {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body, { abortEarly: false });
      
      if (error) {
        const validationError = this.createError(
          this.ERROR_CODES.VAL_REQUIRED_FIELD,
          'Erreur de validation des données',
          error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context.value
          }))
        );
        return next(validationError);
      }
      
      req.validatedBody = value;
      next();
    };
  };

  // Logger structuré pour les actions importantes
  static logAction = (action, level = 'info') => {
    return (req, res, next) => {
      const logData = {
        timestamp: new Date().toISOString(),
        action,
        level,
        user: {
          id: req.userId,
          role: req.userRole,
          email: req.userEmail
        },
        request: {
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      };

      console.log(`[AUDIT] ${JSON.stringify(logData)}`);
      next();
    };
  };

  // Validation des schémas courants
  static schemas = {
    // Validation pour l'inscription
    register: {
      email: (value) => {
        if (!value) throw this.createError(this.ERROR_CODES.VAL_REQUIRED_FIELD, 'Email requis');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw this.createError(this.ERROR_CODES.VAL_INVALID_EMAIL, 'Format d\'email invalide');
        }
        return value.toLowerCase();
      },
      password: (value) => {
        if (!value) throw this.createError(this.ERROR_CODES.VAL_REQUIRED_FIELD, 'Mot de passe requis');
        if (value.length < 8) {
          throw this.createError(this.ERROR_CODES.VAL_INVALID_PASSWORD, 'Le mot de passe doit contenir au moins 8 caractères');
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          throw this.createError(this.ERROR_CODES.VAL_INVALID_PASSWORD, 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre');
        }
        return value;
      },
      role: (value) => {
        const validRoles = ['ETUDIANT', 'ENCADRANT_UNIV', 'ENCADRANT_ENTREPRISE', 'ADMIN_UNIV', 'ADMIN_ENTREPRISE'];
        if (!validRoles.includes(value)) {
          throw this.createError(this.ERROR_CODES.VAL_INVALID_FORMAT, 'Rôle invalide');
        }
        return value;
      }
    },

    // Validation pour le login
    login: {
      email: (value) => {
        if (!value) throw this.createError(this.ERROR_CODES.VAL_REQUIRED_FIELD, 'Email requis');
        return value.toLowerCase();
      },
      password: (value) => {
        if (!value) throw this.createError(this.ERROR_CODES.VAL_REQUIRED_FIELD, 'Mot de passe requis');
        return value;
      }
    }
  };
}

module.exports = ErrorHandler;

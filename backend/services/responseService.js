class ResponseService {
  // Réponse de succès standardisée
  static success(res, data = null, message = 'Opération réussie', statusCode = 200) {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    // Ajouter des métadonnées si nécessaire
    if (data && typeof data === 'object' && data.pagination) {
      response.pagination = data.pagination;
      response.data = data.items || data;
    } else {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  // Réponse d'erreur standardisée
  static error(res, error, statusCode = 500) {
    const response = {
      success: false,
      error: {
        code: error.code || 'SYS_INTERNAL_ERROR',
        message: error.message || 'Erreur interne du serveur',
        timestamp: new Date().toISOString()
      }
    };

    // Ajouter des détails en développement
    if (process.env.NODE_ENV === 'development') {
      response.error.stack = error.stack;
      response.error.details = error.details;
    }

    return res.status(statusCode).json(response);
  }

  // Réponse de validation
  static validationError(res, errors, message = 'Erreur de validation') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details: errors,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Réponse paginée
  static paginated(res, items, pagination, message = 'Données récupérées') {
    return res.status(200).json({
      success: true,
      message,
      data: items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1
      },
      timestamp: new Date().toISOString()
    });
  }

  // Réponse de création
  static created(res, data, message = 'Ressource créée avec succès') {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Réponse de mise à jour
  static updated(res, data, message = 'Ressource mise à jour avec succès') {
    return res.status(200).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Réponse de suppression
  static deleted(res, message = 'Ressource supprimée avec succès') {
    return res.status(200).json({
      success: true,
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Réponse d'authentification
  static auth(res, tokens, user, message = 'Authentification réussie') {
    return res.status(200).json({
      success: true,
      message,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.is_verified || false
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: 'Bearer',
          expiresIn: tokens.expiresIn || 900
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  // Réponse d'erreur d'authentification
  static authError(res, message, code = 'AUTH_ERROR') {
    return res.status(401).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Réponse de permission refusée
  static forbidden(res, message = 'Accès refusé', code = 'FORBIDDEN') {
    return res.status(403).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Réponse de ressource non trouvée
  static notFound(res, message = 'Ressource non trouvée', code = 'NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Réponse de conflit
  static conflict(res, message = 'Conflit de données', code = 'CONFLICT') {
    return res.status(409).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Réponse de trop de requêtes
  static tooManyRequests(res, message = 'Trop de requêtes', retryAfter = null, code = 'RATE_LIMIT') {
    const response = {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      }
    };

    if (retryAfter) {
      response.error.retryAfter = retryAfter;
    }

    return res.status(429).json(response);
  }

  // Réponse d'erreur serveur
  static serverError(res, message = 'Erreur interne du serveur', code = 'SERVER_ERROR') {
    return res.status(500).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Réponse pour les fichiers
  static file(res, filePath, fileName, mimeType) {
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);
    return res.sendFile(filePath);
  }

  // Réponse pour les téléchargements
  static download(res, filePath, fileName) {
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.download(filePath, fileName);
  }

  // Réponse vide (no content)
  static noContent(res) {
    return res.status(204).send();
  }

  // Réponse avec métadonnées
  static withMetadata(res, data, metadata = {}, message = 'Opération réussie') {
    return res.status(200).json({
      success: true,
      message,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }
}

module.exports = ResponseService;

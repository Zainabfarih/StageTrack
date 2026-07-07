const config = require('../config/auth.config');

const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ 
        success: false,
        message: "Aucun rôle fourni",
        error: "NO_ROLE_PROVIDED",
        code: "ROLE_001"
      });
    }

    // Convert single role to array for uniform handling
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (rolesArray.includes(req.userRole)) {
      return next();
    }

    // Vérifier la hiérarchie des rôles
    const userRoleLevel = config.roleHierarchy[req.userRole] || 0;
    const requiredLevel = Math.max(...rolesArray.map(role => config.roleHierarchy[role] || 0));
    
    if (userRoleLevel >= requiredLevel) {
      return next();
    }

    res.status(403).json({ 
      success: false,
      message: `Rôle requis: ${rolesArray.join(' ou ')}`,
      error: "INSUFFICIENT_ROLE",
      code: "ROLE_002",
      currentRole: req.userRole,
      requiredRoles: rolesArray
    });
  };
};

module.exports = checkRole;
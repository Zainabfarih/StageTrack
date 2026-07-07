module.exports = {

  jwtSecret: process.env.JWT_SECRET ,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  
  jwtExpiration: "15m",     
  jwtRefreshExpiration: "7d", 
  
  bcryptRounds: 12,
  
  roles: {
    ETUDIANT: "ETUDIANT",
    ENCADRANT_UNIV: "ENCADRANT_UNIV", 
    ENCADRANT_ENTREPRISE: "ENCADRANT_ENTREPRISE",
    ADMIN_UNIV: "ADMIN_UNIV",
    ADMIN_ENTREPRISE: "ADMIN_ENTREPRISE",
    SUPER_ADMIN: "SUPER_ADMIN" 
  }
};

module.exports.roleHierarchy = {
  [module.exports.roles.ETUDIANT]: 1,
  [module.exports.roles.ENCADRANT_UNIV]: 2,
  [module.exports.roles.ENCADRANT_ENTREPRISE]: 2,
  [module.exports.roles.ADMIN_UNIV]: 3,
  [module.exports.roles.ADMIN_ENTREPRISE]: 3,
  [module.exports.roles.SUPER_ADMIN]: 4
};

const express = require("express");
const router = express.Router();
const classementController = require("../controllers/classementController");
const checkRole = require("../middlewares/roles");
const config = require("../config/auth.config");
const { verifyToken } = require("../middlewares/auth");

// Routes de base pour les classements
// get all classments
router.get("/", classementController.getAll); 
// get by id classment
router.get("/:IdClassement", classementController.getById); 
// create classment par l'etudiant
router.post("/", verifyToken, checkRole([config.roles.ETUDIANT]), classementController.create); 
// update classment par l'etudiant avant date limite
router.put("/:IdClassement", verifyToken, checkRole([config.roles.ETUDIANT]), classementController.update); 
// delete classment par l'etudiant avant date limite
router.delete("/:IdClassement", verifyToken, classementController.delete); 
// get all classment d'un etudiant
router.get("/etudiant/:IdEtudiant", classementController.getByEtudiant); 
// set le status de classement par l'admin de l'entreprise
router.put(
  "/updateStatus/:idEtudiant",
  verifyToken,
  checkRole([config.roles.ENCADRANT_UNIV, config.roles.ADMIN_UNIV]),
  classementController.updateStatus
); 

module.exports = router;

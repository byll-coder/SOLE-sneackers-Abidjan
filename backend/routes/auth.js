const express = require("express");
const router = express.Router();
const {
  inscription,
  connexion,
  moi,
  modifierProfil,
  changerMotDePasse,
} = require("../controllers/authController");
const { proteger } = require("../middleware/auth");

router.post("/inscription", inscription);
router.post("/connexion", connexion);
router.get("/moi", proteger, moi);
router.put("/profil", proteger, modifierProfil);
router.put("/mot-de-passe", proteger, changerMotDePasse);

module.exports = router;

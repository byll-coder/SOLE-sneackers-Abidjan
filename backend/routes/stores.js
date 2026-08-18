const express = require("express");
const router = express.Router();
const { proteger, autoriser } = require("../middleware/auth");
const {
  getStores,
  getStore,
  creerStore,
  modifierStore,
  supprimerStore,
  maBoutique,
  getQuartiers,
  ajouterAvis,
  getAvis,
  publierStore,
} = require("../controllers/storeController");

router.get("/", getStores);
router.get("/quartiers", getQuartiers);
router.get("/ma-boutique", proteger, autoriser("seller", "admin"), maBoutique);
router.get("/:id", getStore);
router.post("/", proteger, autoriser("seller"), creerStore);
router.put("/:id", proteger, autoriser("seller", "admin"), modifierStore);
router.delete("/:id", proteger, autoriser("seller", "admin"), supprimerStore);
router.get("/:id/avis", getAvis);
router.post("/:id/avis", proteger, autoriser("customer"), ajouterAvis);
router.put("/:id/publier", proteger, autoriser("admin"), publierStore);

module.exports = router;

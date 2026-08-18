const express = require("express");
const router = express.Router();
const { proteger, autoriser } = require("../middleware/auth");
const {
  getProducts,
  getProduct,
  creerProduct,
  modifierProduct,
  supprimerProduct,
  getProductsByStore,
  mesProduits,
  marquerVendu,
} = require("../controllers/productController");

router.get("/", getProducts);
router.get("/mes-produits", proteger, autoriser("seller"), mesProduits);
router.get("/store/:storeId", getProductsByStore);
router.get("/:id", getProduct);
router.post("/", proteger, autoriser("seller"), creerProduct);
router.put("/:id", proteger, autoriser("seller", "admin"), modifierProduct);
router.delete("/:id", proteger, autoriser("seller", "admin"), supprimerProduct);
router.put("/:id/vendu", proteger, autoriser("seller"), marquerVendu);

module.exports = router;

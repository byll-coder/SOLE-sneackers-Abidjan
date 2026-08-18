const express = require("express");
const router = express.Router();
const { proteger } = require("../middleware/auth");
const {
  getFavorisProducts,
  getFavorisStores,
  toggleProductFavori,
  toggleStoreFavori,
  checkProductFavori,
  checkStoreFavori,
} = require("../controllers/favoriteController");

router.get("/products", proteger, getFavorisProducts);
router.get("/stores", proteger, getFavorisStores);
router.post("/product/:id", proteger, toggleProductFavori);
router.post("/store/:id", proteger, toggleStoreFavori);
router.get("/check/product/:id", proteger, checkProductFavori);
router.get("/check/store/:id", proteger, checkStoreFavori);

module.exports = router;

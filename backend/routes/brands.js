const express = require("express");
const router = express.Router();
const Brand = require("../models/Brand");
const { proteger, autoriser } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ nom: 1 });
    res.json({ success: true, data: brands });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand)
      return res
        .status(404)
        .json({ success: false, message: "Marque introuvable" });
    res.json({ success: true, data: brand });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.post("/", proteger, autoriser("admin"), async (req, res) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json({ success: true, data: brand });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;

const Store = require("../models/Store");
const User = require("../models/User");
const Review = require("../models/Review");

const paginer = (page, limit) => {
  const p = parseInt(page) || 1,
    l = parseInt(limit) || 12;
  return { skip: (p - 1) * l, limit: l, page: p };
};

// GET /api/stores
exports.getStores = async (req, res) => {
  try {
    const { q, quartier, marque, tri, premium, page, limit } = req.query;
    const filtre = { estActif: true, estPublie: true };
    if (quartier) filtre.quartier = { $regex: quartier, $options: "i" };
    if (marque) filtre.marques = marque;
    if (premium === "true") filtre.isPremium = true;
    if (q) filtre.$text = { $search: q };

    const tris = {
      recent: { createdAt: -1 },
      note: { noteGlobale: -1 },
      vues: { vues: -1 },
      followers: { followers: -1 },
    };
    const sortBy = tris[tri] || tris.recent;

    const { skip, limit: lim, page: p } = paginer(page, limit);
    const [stores, total] = await Promise.all([
      Store.find(filtre)
        .sort(sortBy)
        .skip(skip)
        .limit(lim)
        .select("-__v")
        .populate("proprietaire", "nom email avatar"),
      Store.countDocuments(filtre),
    ]);

    res.json({
      success: true,
      total,
      page: p,
      pages: Math.ceil(total / lim),
      data: stores,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/stores/:id
exports.getStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate("proprietaire", "nom avatar telephone")
      .populate("marques", "nom logo");
    if (!store || !store.estActif)
      return res
        .status(404)
        .json({ success: false, message: "Boutique introuvable" });
    await Store.findByIdAndUpdate(req.params.id, { $inc: { vues: 1 } });
    res.json({ success: true, data: store });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// POST /api/stores
exports.creerStore = async (req, res) => {
  try {
    if (await Store.findOne({ proprietaire: req.user._id }))
      return res.status(400).json({
        success: false,
        message: "Tu as déjà une boutique enregistrée",
      });

    const { nom, quartier } = req.body;
    if (!nom || !quartier)
      return res
        .status(400)
        .json({ success: false, message: "Nom et quartier obligatoires" });

    const store = await Store.create({
      ...req.body,
      proprietaire: req.user._id,
      estPublie: true,
    });
    await User.findByIdAndUpdate(req.user._id, { storeRef: store._id });
    res.status(201).json({
      success: true,
      message: "Boutique créée, en attente de validation",
      data: store,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/stores/:id
exports.modifierStore = async (req, res) => {
  try {
    let store = await Store.findById(req.params.id);
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Boutique introuvable" });
    if (
      store.proprietaire.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    )
      return res.status(403).json({ success: false, message: "Non autorisé" });

    const {
      estPublie,
      isVerifie,
      proprietaire,
      noteGlobale,
      nbAvis,
      nbProduits,
      vues,
      followers,
      ...updates
    } = req.body;
    store = await Store.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: store });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// DELETE /api/stores/:id
exports.supprimerStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Boutique introuvable" });
    if (
      store.proprietaire.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    )
      return res.status(403).json({ success: false, message: "Non autorisé" });
    await store.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { storeRef: null });
    res.json({ success: true, message: "Boutique supprimée" });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/stores/ma-boutique
exports.maBoutique = async (req, res) => {
  try {
    const store = await Store.findOne({ proprietaire: req.user._id }).populate(
      "marques",
      "nom logo",
    );
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Aucune boutique trouvée" });
    res.json({ success: true, data: store });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/stores/quartiers
exports.getQuartiers = async (req, res) => {
  try {
    const quartiers = await Store.distinct("quartier", {
      estActif: true,
      estPublie: true,
    });
    res.json({ success: true, data: quartiers.sort() });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// POST /api/stores/:id/avis
exports.ajouterAvis = async (req, res) => {
  try {
    const { note, commentaire } = req.body;
    if (!note || !commentaire)
      return res
        .status(400)
        .json({ success: false, message: "Note et commentaire obligatoires" });
    if (note < 1 || note > 5)
      return res
        .status(400)
        .json({ success: false, message: "Note entre 1 et 5" });

    const store = await Store.findById(req.params.id);
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Boutique introuvable" });

    const existe = await Review.findOne({
      auteur: req.user._id,
      store: req.params.id,
    });
    if (existe)
      return res.status(400).json({
        success: false,
        message: "Tu as déjà laissé un avis sur cette boutique",
      });

    const avis = await Review.create({
      auteur: req.user._id,
      store: req.params.id,
      note,
      commentaire,
    });

    // Recalculer la note globale
    const avisStore = await Review.find({ store: req.params.id });
    const noteGlobale =
      Math.round(
        (avisStore.reduce((a, r) => a + r.note, 0) / avisStore.length) * 10,
      ) / 10;
    await Store.findByIdAndUpdate(req.params.id, {
      noteGlobale,
      nbAvis: avisStore.length,
    });

    res.status(201).json({ success: true, data: avis });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/stores/:id/avis
exports.getAvis = async (req, res) => {
  try {
    const avis = await Review.find({ store: req.params.id })
      .populate("auteur", "nom avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: avis });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// PUT /api/stores/:id/publier (admin)
exports.publierStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { estPublie: true, isVerifie: true },
      { new: true },
    );
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Boutique introuvable" });
    res.json({ success: true, data: store });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

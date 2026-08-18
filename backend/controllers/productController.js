const Product = require("../models/Product");
const Store = require("../models/Store");

const paginer = (page, limit) => {
  const p = parseInt(page) || 1,
    l = parseInt(limit) || 16;
  return { skip: (p - 1) * l, limit: l, page: p };
};

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const {
      q,
      marque,
      categorie,
      genre,
      quartier,
      taille,
      prixMin,
      prixMax,
      etat,
      tri,
      featured,
      page,
      limit,
    } = req.query;
    const filtre = { isActive: true, estDisponible: true };

    if (marque) filtre.marque = marque;
    if (categorie) filtre.categorie = categorie;
    if (genre) filtre.genre = genre;
    if (etat) filtre.etat = etat;
    if (taille) filtre.tailles = taille;
    if (featured === "true") filtre.isFeatured = true;
    if (prixMin || prixMax) {
      filtre.prix = {};
      if (prixMin) filtre.prix.$gte = parseFloat(prixMin);
      if (prixMax) filtre.prix.$lte = parseFloat(prixMax);
    }
    if (q) filtre.$text = { $search: q };

    // Filtrer par quartier via store
    let storeIds;
    if (quartier) {
      const stores = await Store.find({
        quartier: { $regex: quartier, $options: "i" },
        estPublie: true,
      }).select("_id");
      storeIds = stores.map((s) => s._id);
      filtre.store = { $in: storeIds };
    }

    const tris = {
      recent: { createdAt: -1 },
      "prix-asc": { prix: 1 },
      "prix-desc": { prix: -1 },
      populaire: { vues: -1 },
      favoris: { favoris: -1 },
    };
    const sortBy = tris[tri] || tris.recent;

    const { skip, limit: lim, page: p } = paginer(page, limit);
    const [products, total] = await Promise.all([
      Product.find(filtre)
        .sort(sortBy)
        .skip(skip)
        .limit(lim)
        .populate("store", "nom quartier logo noteGlobale isVerifie")
        .populate("marque", "nom logo")
        .select("-__v"),
      Product.countDocuments(filtre),
    ]);

    res.json({
      success: true,
      total,
      page: p,
      pages: Math.ceil(total / lim),
      data: products,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate(
        "store",
        "nom quartier adresse logo coverImage telephone whatsapp noteGlobale isVerifie",
      )
      .populate("marque", "nom logo")
      .populate("vendeur", "nom avatar");
    if (!product || !product.isActive)
      return res
        .status(404)
        .json({ success: false, message: "Produit introuvable" });
    await Product.findByIdAndUpdate(req.params.id, { $inc: { vues: 1 } });
    res.json({ success: true, data: product });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// POST /api/products
exports.creerProduct = async (req, res) => {
  try {
    const store = await Store.findOne({ proprietaire: req.user._id });
    if (!store)
      return res
        .status(400)
        .json({ success: false, message: "Crée d'abord ta boutique" });

    const { nom, marque, marqueNom, prix } = req.body;
    if (!nom || !marque || !marqueNom || !prix)
      return res
        .status(400)
        .json({ success: false, message: "Nom, marque et prix obligatoires" });

    const product = await Product.create({
      ...req.body,
      store: store._id,
      vendeur: req.user._id,
    });
    await Store.findByIdAndUpdate(store._id, { $inc: { nbProduits: 1 } });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/products/:id
exports.modifierProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Produit introuvable" });
    if (
      product.vendeur.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    )
      return res.status(403).json({ success: false, message: "Non autorisé" });

    const { vendeur, store, vues, favoris, ...updates } = req.body;
    product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: product });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// DELETE /api/products/:id
exports.supprimerProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Produit introuvable" });
    if (
      product.vendeur.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    )
      return res.status(403).json({ success: false, message: "Non autorisé" });
    await product.deleteOne();
    await Store.findByIdAndUpdate(product.store, { $inc: { nbProduits: -1 } });
    res.json({ success: true, message: "Produit supprimé" });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/products/store/:storeId
exports.getProductsByStore = async (req, res) => {
  try {
    const { page, limit, categorie, tri } = req.query;
    const filtre = { store: req.params.storeId, isActive: true };
    if (categorie) filtre.categorie = categorie;
    const tris = {
      recent: { createdAt: -1 },
      "prix-asc": { prix: 1 },
      populaire: { vues: -1 },
    };
    const sortBy = tris[tri] || tris.recent;
    const { skip, limit: lim, page: p } = paginer(page, limit);
    const [products, total] = await Promise.all([
      Product.find(filtre)
        .sort(sortBy)
        .skip(skip)
        .limit(lim)
        .populate("marque", "nom logo"),
      Product.countDocuments(filtre),
    ]);
    res.json({
      success: true,
      total,
      page: p,
      pages: Math.ceil(total / lim),
      data: products,
    });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/products/mes-produits
exports.mesProduits = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const filtre = { vendeur: req.user._id };
    const { skip, limit: lim, page: p } = paginer(page, limit);
    const [products, total] = await Promise.all([
      Product.find(filtre)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate("marque", "nom logo"),
      Product.countDocuments(filtre),
    ]);
    res.json({
      success: true,
      total,
      page: p,
      pages: Math.ceil(total / lim),
      data: products,
    });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// PUT /api/products/:id/vendu
exports.marquerVendu = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Produit introuvable" });
    if (product.vendeur.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Non autorisé" });
    product.estVendu = true;
    product.estDisponible = false;
    product.stock = 0;
    await product.save();
    res.json({ success: true, data: product });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

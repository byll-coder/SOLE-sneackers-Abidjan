const Favorite = require("../models/Favorite");
const Product = require("../models/Product");
const Store = require("../models/Store");

// GET /api/favorites/products
exports.getFavorisProducts = async (req, res) => {
  try {
    const favs = await Favorite.find({ user: req.user._id, type: "product" })
      .populate({
        path: "product",
        populate: [
          { path: "store", select: "nom quartier logo" },
          { path: "marque", select: "nom logo" },
        ],
      })
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: favs.map((f) => f.product).filter(Boolean),
    });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/favorites/stores
exports.getFavorisStores = async (req, res) => {
  try {
    const favs = await Favorite.find({ user: req.user._id, type: "store" })
      .populate("store")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: favs.map((f) => f.store).filter(Boolean) });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// POST /api/favorites/product/:id
exports.toggleProductFavori = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Produit introuvable" });

    const existe = await Favorite.findOne({
      user: req.user._id,
      product: req.params.id,
      type: "product",
    });
    if (existe) {
      await existe.deleteOne();
      await Product.findByIdAndUpdate(req.params.id, { $inc: { favoris: -1 } });
      return res.json({
        success: true,
        action: "retiré",
        message: "Retiré des favoris",
      });
    }

    await Favorite.create({
      user: req.user._id,
      product: req.params.id,
      type: "product",
    });
    await Product.findByIdAndUpdate(req.params.id, { $inc: { favoris: 1 } });
    res.json({
      success: true,
      action: "ajouté",
      message: "Ajouté aux favoris",
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// POST /api/favorites/store/:id
exports.toggleStoreFavori = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Boutique introuvable" });

    const existe = await Favorite.findOne({
      user: req.user._id,
      store: req.params.id,
      type: "store",
    });
    if (existe) {
      await existe.deleteOne();
      await Store.findByIdAndUpdate(req.params.id, { $inc: { followers: -1 } });
      return res.json({
        success: true,
        action: "retiré",
        message: "Boutique retirée des favoris",
      });
    }

    await Favorite.create({
      user: req.user._id,
      store: req.params.id,
      type: "store",
    });
    await Store.findByIdAndUpdate(req.params.id, { $inc: { followers: 1 } });
    res.json({
      success: true,
      action: "ajouté",
      message: "Boutique ajoutée aux favoris",
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/favorites/check/product/:id
exports.checkProductFavori = async (req, res) => {
  try {
    const existe = await Favorite.findOne({
      user: req.user._id,
      product: req.params.id,
      type: "product",
    });
    res.json({ success: true, isFavori: !!existe });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/favorites/check/store/:id
exports.checkStoreFavori = async (req, res) => {
  try {
    const existe = await Favorite.findOne({
      user: req.user._id,
      store: req.params.id,
      type: "store",
    });
    res.json({ success: true, isFavori: !!existe });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

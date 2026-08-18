const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    vendeur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Infos produit
    nom: { type: String, required: true, trim: true, maxlength: 200 },
    marque: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    marqueNom: { type: String, required: true }, // dénormalisé pour les recherches rapides
    modele: { type: String, default: "", trim: true },
    description: { type: String, default: "", maxlength: 2000 },

    // Prix
    prix: { type: Number, required: true, min: 0 },
    prixOriginal: { type: Number, default: null }, // avant remise
    remise: { type: Number, default: 0, min: 0, max: 100 }, // %

    // Caractéristiques
    images: [{ type: String }],
    tailles: [{ type: String }], // ['39','40','41','42','43','44']
    couleur: { type: String, default: "" },
    genre: {
      type: String,
      enum: ["homme", "femme", "enfant", "unisexe"],
      default: "unisexe",
    },
    categorie: {
      type: String,
      enum: [
        "sneakers",
        "casual",
        "sport",
        "luxe",
        "sandales",
        "bottes",
        "autres",
      ],
      default: "sneakers",
    },
    etat: {
      type: String,
      enum: ["neuf", "occasion", "neuf-sans-boite"],
      default: "neuf",
    },
    couleurCode: { type: String, default: "" }, // ex: '#E50914'

    // Stock
    stock: { type: Number, default: 1, min: 0 },
    estDisponible: { type: Boolean, default: true },
    estVendu: { type: Boolean, default: false },

    // Stats
    vues: { type: Number, default: 0 },
    favoris: { type: Number, default: 0 },

    // Statut
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Index de recherche
ProductSchema.index({ store: 1 });
ProductSchema.index({ marque: 1 });
ProductSchema.index({ prix: 1 });
ProductSchema.index({ categorie: 1 });
ProductSchema.index({ genre: 1 });
ProductSchema.index({ estDisponible: 1 });
ProductSchema.index({
  nom: "text",
  modele: "text",
  marqueNom: "text",
  description: "text",
});

module.exports = mongoose.model("Product", ProductSchema);

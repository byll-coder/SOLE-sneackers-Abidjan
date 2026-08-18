const mongoose = require("mongoose");

const HoraireSchema = new mongoose.Schema(
  {
    ouvert: Boolean,
    debut: String,
    fin: String,
  },
  { _id: false },
);

const StoreSchema = new mongoose.Schema(
  {
    proprietaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nom: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: "", maxlength: 2000 },
    slogan: { type: String, default: "", maxlength: 200 },
    logo: { type: String, default: null },
    coverImage: { type: String, default: null },
    galerie: [{ type: String }],

    // Localisation
    quartier: { type: String, required: true },
    adresse: { type: String, default: "" },
    ville: { type: String, default: "Abidjan" },
    coordonnees: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // Contact
    telephone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    email: { type: String, default: "" },
    instagram: { type: String, default: "" },
    siteWeb: { type: String, default: "" },

    // Horaires
    horaires: {
      lundi: HoraireSchema,
      mardi: HoraireSchema,
      mercredi: HoraireSchema,
      jeudi: HoraireSchema,
      vendredi: HoraireSchema,
      samedi: HoraireSchema,
      dimanche: HoraireSchema,
    },

    // Marques disponibles
    marques: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],

    // Stats
    noteGlobale: { type: Number, default: 0, min: 0, max: 5 },
    nbAvis: { type: Number, default: 0 },
    nbProduits: { type: Number, default: 0 },
    vues: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },

    // Statut
    isVerifie: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    estActif: { type: Boolean, default: true },
    estPublie: { type: Boolean, default: true },
  },
  { timestamps: true },
);

StoreSchema.index({ quartier: 1 });
StoreSchema.index({ noteGlobale: -1 });
StoreSchema.index({ nom: "text", description: "text", quartier: "text" });

module.exports = mongoose.model("Store", StoreSchema);

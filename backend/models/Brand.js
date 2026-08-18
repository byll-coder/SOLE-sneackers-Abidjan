const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique: true, trim: true },
    logo: { type: String, default: null },
    description: { type: String, default: "" },
    slug: { type: String, required: true, unique: true, lowercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Brand", BrandSchema);

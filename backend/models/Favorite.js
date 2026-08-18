const mongoose = require("mongoose");

const FavoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },
    type: { type: String, enum: ["product", "store"], required: true },
  },
  { timestamps: true },
);

FavoriteSchema.index({ user: 1, type: 1 });
FavoriteSchema.index({ user: 1, product: 1 }, { unique: true, sparse: true });
FavoriteSchema.index({ user: 1, store: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Favorite", FavoriteSchema);

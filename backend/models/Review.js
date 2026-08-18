const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    note: { type: Number, required: true, min: 1, max: 5 },
    commentaire: { type: String, required: true, maxlength: 1000 },
    images: [{ type: String }],
  },
  { timestamps: true },
);

ReviewSchema.index({ store: 1 });
ReviewSchema.index({ auteur: 1, store: 1 }, { unique: true }); // Un avis par user/store

module.exports = mongoose.model("Review", ReviewSchema);

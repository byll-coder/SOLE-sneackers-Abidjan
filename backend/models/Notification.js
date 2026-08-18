const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    destinataire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["message", "avis", "favori", "commande", "systeme"],
      required: true,
    },
    titre: { type: String, required: true },
    contenu: { type: String, default: "" },
    lien: { type: String, default: null },
    lu: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NotificationSchema.index({ destinataire: 1, lu: 1 });

module.exports = mongoose.model("Notification", NotificationSchema);

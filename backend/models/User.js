const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalide"],
    },
    telephone: { type: String, default: null },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    avatar: { type: String, default: null },
    bio: { type: String, default: "", maxlength: 500 },
    location: { type: String, default: "Abidjan, Côte d'Ivoire" },
    quartier: { type: String, default: "" },

    // Customer
    favoris: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    boutiquesFavorites: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    ],

    // Seller
    storeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },

    // Notifications
    notificationsNonLues: { type: Number, default: 0 },
    messagesNonLus: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.verifierPassword = async function (mdp) {
  return bcrypt.compare(mdp, this.password);
};

module.exports = mongoose.model("User", UserSchema);

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Store = require("../models/Store");
const config = require("../config/config");

const genToken = (id) =>
  jwt.sign({ id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRE });

const repondre = (user, code, res) => {
  const token = genToken(user._id);
  res.status(code).json({
    success: true,
    token,
    user: {
      _id: user._id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      storeRef: user.storeRef,
    },
  });
};

// POST /api/auth/inscription
exports.inscription = async (req, res) => {
  try {
    const { nom, email, password, role, telephone, quartier } = req.body;
    if (!nom || !email || !password)
      return res.status(400).json({
        success: false,
        message: "Nom, email et mot de passe obligatoires",
      });
    if (!["customer", "seller"].includes(role))
      return res.status(400).json({ success: false, message: "Rôle invalide" });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res
        .status(400)
        .json({ success: false, message: "Cet email est déjà utilisé" });

    const user = await User.create({
      nom,
      email,
      password,
      role,
      telephone: telephone || null,
      quartier: quartier || "",
    });
    repondre(user, 201, res);
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// POST /api/auth/connexion
exports.connexion = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe obligatoires",
      });

    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+password")
      .populate("storeRef", "_id nom");
    if (!user || !(await user.verifierPassword(password)))
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect" });

    repondre(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/auth/moi
exports.moi = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "storeRef",
      "_id nom logo coverImage isVerifie estPublie",
    );
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// PUT /api/auth/profil
exports.modifierProfil = async (req, res) => {
  try {
    const { nom, telephone, avatar, bio, quartier } = req.body;
    const champs = {};
    if (nom) champs.nom = nom;
    if (telephone !== undefined) champs.telephone = telephone;
    if (avatar) champs.avatar = avatar;
    if (bio !== undefined) champs.bio = bio;
    if (quartier) champs.quartier = quartier;
    const user = await User.findByIdAndUpdate(req.user._id, champs, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, user });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/auth/mot-de-passe
exports.changerMotDePasse = async (req, res) => {
  try {
    const { ancienPassword, nouveauPassword } = req.body;
    if (!ancienPassword || !nouveauPassword)
      return res.status(400).json({
        success: false,
        message: "Les deux mots de passe sont requis",
      });
    if (nouveauPassword.length < 6)
      return res
        .status(400)
        .json({ success: false, message: "Mot de passe trop court (6 min)" });
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.verifierPassword(ancienPassword)))
      return res
        .status(401)
        .json({ success: false, message: "Ancien mot de passe incorrect" });
    user.password = nouveauPassword;
    await user.save();
    repondre(user, 200, res);
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

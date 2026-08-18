const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/config");

exports.proteger = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token)
    return res.status(401).json({ success: false, message: "Token manquant" });
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user || !req.user.isActive)
      return res.status(401).json({
        success: false,
        message: "Utilisateur introuvable ou désactivé",
      });
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Token invalide ou expiré" });
  }
};

exports.autoriser =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé — rôle requis : ${roles.join(" ou ")}`,
      });
    }
    next();
  };

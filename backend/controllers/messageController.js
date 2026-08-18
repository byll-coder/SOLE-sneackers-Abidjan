const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

// GET /api/messages/conversations
exports.getConversations = async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user._id })
      .sort({ dernierMessageAt: -1 })
      .populate("participants", "nom avatar role storeRef")
      .populate("store", "nom logo")
      .populate("dernierMessage", "contenu createdAt expediteur");
    res.json({ success: true, data: convs });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/messages/conversations/:id
exports.getMessages = async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv || !conv.participants.includes(req.user._id.toString()))
      return res
        .status(403)
        .json({ success: false, message: "Accès non autorisé" });

    const messages = await Message.find({ conversation: req.params.id })
      .sort({ createdAt: 1 })
      .populate("expediteur", "nom avatar")
      .populate("produitRef", "nom prix images marqueNom");

    // Marquer comme lu
    await Message.updateMany(
      {
        conversation: req.params.id,
        expediteur: { $ne: req.user._id },
        lu: false,
      },
      { lu: true, $addToSet: { luPar: req.user._id } },
    );
    if (conv.nonLus?.get(req.user._id.toString()) > 0) {
      conv.nonLus.set(req.user._id.toString(), 0);
      await conv.save();
    }

    res.json({ success: true, data: messages });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// POST /api/messages/conversations
exports.ouvrirConversation = async (req, res) => {
  try {
    const { destinataireId, storeId } = req.body;
    if (!destinataireId)
      return res
        .status(400)
        .json({ success: false, message: "Destinataire requis" });
    if (destinataireId === req.user._id.toString())
      return res.status(400).json({
        success: false,
        message: "Tu ne peux pas te contacter toi-même",
      });

    // Vérifier si une conversation existe déjà
    let conv = await Conversation.findOne({
      participants: { $all: [req.user._id, destinataireId] },
    });

    if (!conv) {
      conv = await Conversation.create({
        participants: [req.user._id, destinataireId],
        store: storeId || null,
        nonLus: { [req.user._id]: 0, [destinataireId]: 0 },
      });
    }

    await conv.populate("participants", "nom avatar role");
    res.json({ success: true, data: conv });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// POST /api/messages/conversations/:id
exports.envoyerMessage = async (req, res) => {
  try {
    const { contenu, produitRef } = req.body;
    if (!contenu && !produitRef)
      return res
        .status(400)
        .json({ success: false, message: "Contenu ou produit requis" });

    const conv = await Conversation.findById(req.params.id);
    if (!conv || !conv.participants.includes(req.user._id.toString()))
      return res
        .status(403)
        .json({ success: false, message: "Accès non autorisé" });

    const message = await Message.create({
      conversation: req.params.id,
      expediteur: req.user._id,
      contenu: contenu || "",
      produitRef: produitRef || null,
    });

    // Mettre à jour la conversation
    conv.dernierMessage = message._id;
    conv.dernierMessageAt = new Date();
    conv.participants.forEach((pid) => {
      if (pid.toString() !== req.user._id.toString()) {
        const actuel = conv.nonLus?.get(pid.toString()) || 0;
        conv.nonLus.set(pid.toString(), actuel + 1);
      }
    });
    await conv.save();

    await message.populate("expediteur", "nom avatar");
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/messages/non-lus
exports.nonLus = async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user._id });
    const total = convs.reduce(
      (acc, c) => acc + (c.nonLus?.get(req.user._id.toString()) || 0),
      0,
    );
    res.json({ success: true, total });
  } catch {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

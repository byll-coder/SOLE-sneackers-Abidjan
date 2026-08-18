const express = require("express");
const router = express.Router();
const { proteger } = require("../middleware/auth");
const {
  getConversations,
  getMessages,
  ouvrirConversation,
  envoyerMessage,
  nonLus,
} = require("../controllers/messageController");

router.get("/non-lus", proteger, nonLus);
router.get("/conversations", proteger, getConversations);
router.post("/conversations", proteger, ouvrirConversation);
router.get("/conversations/:id", proteger, getMessages);
router.post("/conversations/:id", proteger, envoyerMessage);

module.exports = router;

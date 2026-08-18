const config = require("./config/config");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ── Connexion MongoDB ────────────────────────────────
connectDB();

// ── Middleware ───────────────────────────────────────
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Routes API ───────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/stores", require("./routes/stores"));
app.use("/api/products", require("./routes/products"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/favorites", require("./routes/favorites"));
app.use("/api/brands", require("./routes/brands"));

// ── Frontend statique (production) ───────────────────
if (config.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend")));
  app.get("*", (req, res) =>
    res.sendFile(path.join(__dirname, "../frontend/index.html")),
  );
}

// ── Health check ──────────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({
    success: true,
    message: "SOLE Sneakers CI API opérationnelle 🔴",
  }),
);

// ── Routes inconnues ──────────────────────────────────
app.use((req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} introuvable` }),
);

// ── Gestion globale des erreurs ───────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Erreur serveur" });
});

// ══════════════════════════════════════════════════════
//  SOCKET.IO — Messagerie temps réel
// ══════════════════════════════════════════════════════
const usersEnLigne = new Map(); // userId → socketId

io.on("connection", (socket) => {
  console.log(`🔌 Socket connecté : ${socket.id}`);

  // L'utilisateur s'identifie
  socket.on("user:join", (userId) => {
    usersEnLigne.set(userId, socket.id);
    socket.userId = userId;
    io.emit("users:online", Array.from(usersEnLigne.keys()));
    console.log(`👤 User ${userId} en ligne`);
  });

  // Rejoindre une conversation
  socket.on("conversation:join", (conversationId) => {
    socket.join(`conv_${conversationId}`);
  });

  // Quitter une conversation
  socket.on("conversation:leave", (conversationId) => {
    socket.leave(`conv_${conversationId}`);
  });

  // Nouveau message
  socket.on("message:send", (data) => {
    const { conversationId, message } = data;
    // Diffuser à tous les membres de la conversation sauf l'expéditeur
    socket.to(`conv_${conversationId}`).emit("message:receive", message);
  });

  // Indicateur "en train d'écrire"
  socket.on("typing:start", ({ conversationId, userId, nom }) => {
    socket.to(`conv_${conversationId}`).emit("typing:start", { userId, nom });
  });
  socket.on("typing:stop", ({ conversationId }) => {
    socket.to(`conv_${conversationId}`).emit("typing:stop");
  });

  // Notification
  socket.on("notification:send", ({ destinataireId, notification }) => {
    const socketDest = usersEnLigne.get(destinataireId);
    if (socketDest)
      io.to(socketDest).emit("notification:receive", notification);
  });

  // Déconnexion
  socket.on("disconnect", () => {
    if (socket.userId) {
      usersEnLigne.delete(socket.userId);
      io.emit("users:online", Array.from(usersEnLigne.keys()));
      console.log(`❌ User ${socket.userId} hors ligne`);
    }
  });
});

// ── Démarrage ─────────────────────────────────────────
server.listen(config.PORT, () => {
  console.log(`\n🔴  SOLE Sneakers CI API → http://localhost:${config.PORT}`);
  console.log(`🔌  Socket.IO activé`);
  console.log(
    `📡  Endpoints : /api/auth | /api/stores | /api/products | /api/messages | /api/favorites | /api/brands\n`,
  );
});

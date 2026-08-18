// ── URL de base ───────────────────────────────────
const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001/api"
    : "/api";

// ── Helper fetch ──────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("sole_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch {
    throw new Error(
      "Impossible de joindre le serveur. Vérifie que le backend est démarré.",
    );
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur serveur");
  return data;
}

// ── AUTH ──────────────────────────────────────────
const Auth = {
  inscription: (body) =>
    apiFetch("/auth/inscription", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  connexion: (body) =>
    apiFetch("/auth/connexion", { method: "POST", body: JSON.stringify(body) }),
  moi: () => apiFetch("/auth/moi"),
  modifierProfil: (body) =>
    apiFetch("/auth/profil", { method: "PUT", body: JSON.stringify(body) }),
  changerPassword: (body) =>
    apiFetch("/auth/mot-de-passe", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

// ── STORES ────────────────────────────────────────
const Stores = {
  liste: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/stores${qs ? "?" + qs : ""}`);
  },
  detail: (id) => apiFetch(`/stores/${id}`),
  quartiers: () => apiFetch("/stores/quartiers"),
  maBoutique: () => apiFetch("/stores/ma-boutique"),
  creer: (body) =>
    apiFetch("/stores", { method: "POST", body: JSON.stringify(body) }),
  modifier: (id, body) =>
    apiFetch(`/stores/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  supprimer: (id) => apiFetch(`/stores/${id}`, { method: "DELETE" }),
  ajouterAvis: (id, body) =>
    apiFetch(`/stores/${id}/avis`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getAvis: (id) => apiFetch(`/stores/${id}/avis`),
};

// ── MESSAGES ─────────────────────────────────────
const Messages = {
  conversations: () => apiFetch("/messages/conversations"),
  getMessages: (convId) => apiFetch(`/messages/conversations/${convId}`),
  ouvrirConversation: (body) =>
    apiFetch("/messages/conversations", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  envoyerMessage: (convId, body) =>
    apiFetch(`/messages/conversations/${convId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  nonLus: () => apiFetch("/messages/non-lus"),
};

// ── FAVORIS ───────────────────────────────────────
const Favorites = {
  stores: () => apiFetch("/favorites/stores"),
  toggleStore: (id) => apiFetch(`/favorites/store/${id}`, { method: "POST" }),
  checkStore: (id) => apiFetch(`/favorites/check/store/${id}`),
};

// ── BRANDS ───────────────────────────────────────
const Brands = {
  liste: () => apiFetch("/brands"),
};

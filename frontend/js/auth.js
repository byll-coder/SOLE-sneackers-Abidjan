// ── Session ───────────────────────────────────────
const Session = {
  setToken: (t) => localStorage.setItem("sole_token", t),
  getToken: () => localStorage.getItem("sole_token"),
  setUser: (u) => localStorage.setItem("sole_user", JSON.stringify(u)),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem("sole_user"));
    } catch {
      return null;
    }
  },
  clear: () => {
    localStorage.removeItem("sole_token");
    localStorage.removeItem("sole_user");
  },
  estConnecte: () => !!localStorage.getItem("sole_token"),
};

// ── Redirection après connexion ───────────────────
function redigerApresConnexion(user) {
  // ✅ CORRIGÉ : les pages sont dans /pages/, le JS est dans /js/ → ../pages/
  const destination =
    user?.role === "seller"
      ? "../pages/dashboard-vendeur.html"
      : "../pages/dashboard-client.html";
  window.location.replace(destination);
}

// ── Protéger une page ─────────────────────────────
function protegerPage(roleRequis = null) {
  if (!Session.estConnecte()) {
    // ✅ CORRIGÉ : chemin vers ../pages/auth.html
    window.location.replace("../pages/auth.html?mode=connexion");
    return false;
  }
  if (roleRequis) {
    const user = Session.getUser();
    const role = (user?.role || "").toLowerCase().trim();
    const requis = roleRequis.toLowerCase().trim();
    if (role !== requis) {
      // ✅ CORRIGÉ : index.html est à la racine → ../index.html
      window.location.replace("../index.html");
      return false;
    }
  }
  return true;
}

// ── Mettre à jour la navbar ───────────────────────
function majNavbar() {
  const user = Session.getUser();
  const actionsEl = document.getElementById("navbar-actions");
  if (!actionsEl) return;

  if (user && Session.estConnecte()) {
    // ✅ CORRIGÉ : chemins dashboard et message
    const dash =
      user.role === "seller"
        ? "../pages/dashboard-vendeur.html"
        : "../pages/dashboard-client.html";
    actionsEl.innerHTML = `
      <a href="../pages/message.html" class="btn btn-icon btn-glass" id="msg-btn" title="Messages">
        <i class="ti ti-message-circle"></i>
        <span class="notif-badge" id="notif-msg" style="display:none;"></span>
      </a>
      <a href="${dash}" class="btn btn-glass btn-sm">
        <i class="ti ti-user-circle"></i> ${user.nom ? user.nom.split(" ")[0] : "Mon compte"}
      </a>
      <button class="btn btn-outline btn-sm" onclick="deconnexion()">
        <i class="ti ti-logout"></i>
      </button>`;

    if (typeof Messages !== "undefined" && Messages.nonLus) {
      chargerNonLus();
    }
  } else {
    // ✅ CORRIGÉ : chemins auth.html
    actionsEl.innerHTML = `
      <a href="../pages/auth.html?mode=connexion" class="btn btn-outline btn-sm">
        <i class="ti ti-login"></i> Connexion
      </a>
      <a href="../pages/auth.html?mode=inscription" class="btn btn-red btn-sm">
        <i class="ti ti-user-plus"></i> S'inscrire
      </a>`;
  }
}

// ── Charger les messages non lus ──────────────────
async function chargerNonLus() {
  try {
    const res = await Messages.nonLus();
    if (!res) return;
    const total = res.total || 0;
    const badge = document.getElementById("notif-msg");
    if (badge) {
      badge.textContent = total > 9 ? "9+" : total;
      badge.style.display = total > 0 ? "flex" : "none";
    }
  } catch (err) {
    console.warn("Impossible de charger les messages non lus:", err);
  }
}

// ── Déconnexion ───────────────────────────────────
function deconnexion() {
  Session.clear();
  // ✅ CORRIGÉ : index.html est à la racine → ../index.html
  window.location.replace("../index.html");
}

// ── Toast ─────────────────────────────────────────
function afficherToast(message, type = "info") {
  let toast = document.getElementById("global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "global-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  const icons = {
    success: "circle-check",
    error: "alert-circle",
    info: "info-circle",
    warning: "alert-triangle",
  };
  toast.innerHTML = `<i class="ti ti-${icons[type] || icons.info}"></i> ${message}`;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3500);
}

// ── Init ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", majNavbar);

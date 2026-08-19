/* ══════════════════════════════════════════════════
   main.js — SOLE Sneakers CI
   Helpers partagés toutes pages
══════════════════════════════════════════════════ */

// ── Scroll Reveal ─────────────────────────────────
const rvObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("visible");
        rvObs.unobserve(en.target);
      }
    });
  },
  { threshold: 0.08 },
);

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".rv").forEach((el) => rvObs.observe(el));

  // Hamburger
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobile-menu");
  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      mobileMenu.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target))
        mobileMenu.classList.remove("open");
    });
  }

  // Navbar scroll
  const navbar = document.getElementById("navbar");
  if (navbar) {
    window.addEventListener(
      "scroll",
      () => navbar.classList.toggle("scrolled", window.scrollY > 60),
      { passive: true },
    );
  }
});

// ── Helpers DOM ───────────────────────────────────
function showLoading() {
  const el = document.getElementById("loading-overlay");
  if (el) el.classList.add("show");
}
function hideLoading() {
  const el = document.getElementById("loading-overlay");
  if (el) el.classList.remove("show");
}

// ── Rendu étoiles ─────────────────────────────────
function renderStars(note) {
  const plein = Math.floor(note || 0);
  const demi = (note || 0) - plein >= 0.5 ? 1 : 0;
  const vide = 5 - plein - demi;
  return `<span class="stars">
    ${'<i class="ti ti-star-filled"></i>'.repeat(plein)}
    ${demi ? '<i class="ti ti-star-half-filled"></i>' : ""}
    ${'<i class="ti ti-star"></i>'.repeat(vide)}
  </span>`;
}

// ── Statut ouverture ──────────────────────────────
function isStoreOpen(horaires) {
  if (!horaires) return null;
  const jours = [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ];
  const now = new Date();
  const jour = jours[now.getDay()];
  const h = horaires[jour];
  if (!h || !h.ouvert) return false;
  const [dh, dm] = (h.debut || "08:00").split(":").map(Number);
  const [fh, fm] = (h.fin || "18:00").split(":").map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const debMin = dh * 60 + dm;
  const finMin = fh * 60 + fm;
  return nowMin >= debMin && nowMin <= finMin;
}

// ── Rendu carte boutique ──────────────────────────
function renderStoreCard(store) {
  const ouvert = isStoreOpen(store.horaires);
  const statutHtml =
    ouvert === null
      ? ""
      : ouvert
        ? `<span class="store-status-open"><i class="ti ti-clock"></i> Ouvert</span>`
        : `<span class="store-status-closed"><i class="ti ti-clock-off"></i> Fermé</span>`;

  const noteStr = store.noteGlobale > 0 ? store.noteGlobale.toFixed(1) : "—";

  // ✅ CORRIGÉ : chemin vers ../pages/boutique-detail.html + guillemet manquant
  return `
    <article class="store-card rv" onclick="window.location.href='../pages/boutique-detail.html?id=${store._id}'">
      ${
        store.coverImage
          ? `<img src="${store.coverImage}" class="store-card-cover" alt="${store.nom}" loading="lazy">`
          : `<div class="store-card-cover-ph"><i class="ti ti-building-store"></i></div>`
      }
      <div class="store-card-body">
        <div class="store-card-header">
          ${
            store.logo
              ? `<img src="${store.logo}" class="store-logo" alt="Logo">`
              : `<div class="store-logo-ph"><i class="ti ti-shoe"></i></div>`
          }
          <div>
            <div class="store-name">${store.nom}</div>
            ${
              store.isVerifie
                ? `<div class="store-verified"><i class="ti ti-shield-check"></i> Vérifié</div>`
                : ""
            }
          </div>
        </div>
        <div class="store-card-meta">
          <span><i class="ti ti-map-pin"></i> ${store.quartier}${store.ville ? ", " + store.ville : ""}</span>
          <span>${renderStars(store.noteGlobale)} <strong>${noteStr}</strong> (${store.nbAvis || 0})</span>
          ${statutHtml}
        </div>
        <div class="store-card-footer">
          <a href="../pages/boutique-detail.html?id=${store._id}" class="btn btn-glass btn-sm" onclick="event.stopPropagation()">
            <i class="ti ti-eye"></i> Voir
          </a>
          <button class="btn btn-red btn-sm" onclick="event.stopPropagation(); contacterStore('${store._id}', '${store.proprietaire?._id || store.proprietaire}')">
            <i class="ti ti-message-circle"></i> Contacter
          </button>
        </div>
      </div>
    </article>`;
}

// ── Contacter une boutique ────────────────────────
async function contacterStore(storeId, proprietaireId) {
  if (!Session.estConnecte()) {
    afficherToast("Connecte-toi pour envoyer un message", "error");
    // ✅ CORRIGÉ : chemin vers ../pages/auth.html
    setTimeout(() => (window.location.href = "../pages/auth.html"), 1000);
    return;
  }
  try {
    showLoading();
    const { data } = await Messages.ouvrirConversation({
      destinataireId: proprietaireId,
      storeId,
    });
    hideLoading();
    // ✅ CORRIGÉ : chemin vers ../pages/message.html
    window.location.href = `../pages/message.html?conv=${data._id}`;
  } catch (err) {
    hideLoading();
    afficherToast(err.message, "error");
  }
}

// ── Pagination ────────────────────────────────────
function renderPagination(containerId, page, totalPages, onPageChange) {
  const el = document.getElementById(containerId);
  if (!el || totalPages <= 1) {
    if (el) el.innerHTML = "";
    return;
  }

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }

  el.innerHTML = `
    <button class="page-btn" ${page === 1 ? "disabled" : ""} onclick="(${onPageChange.toString()})(${page - 1})">
      <i class="ti ti-chevron-left"></i>
    </button>
    ${pages
      .map((p) =>
        p === "..."
          ? `<span class="page-btn" style="cursor:default;opacity:.4;">…</span>`
          : `<button class="page-btn ${p === page ? "active" : ""}" onclick="(${onPageChange.toString()})(${p})">${p}</button>`,
      )
      .join("")}
    <button class="page-btn" ${page === totalPages ? "disabled" : ""} onclick="(${onPageChange.toString()})(${page + 1})">
      <i class="ti ti-chevron-right"></i>
    </button>`;
}

// ── Debounce ──────────────────────────────────────
function debounce(fn, delay = 350) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ── Format date ───────────────────────────────────
function formatDate(d) {
  const date = new Date(d);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} j`;
  return date.toLocaleDateString("fr-FR");
}

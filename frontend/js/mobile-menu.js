/* ═══════════════════════════════════════════════════════════════
   SOLE — TOGGLE HAMBURGER / MENU MOBILE
   À inclure avant </body> sur toutes les pages.
   Injecte automatiquement un bouton ✕ dans le menu.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobile-menu");
  const body = document.body;

  if (!hamburger || !mobileMenu) return;

  // ── Injecter le bouton ✕ "Fermer" dans le menu ──────────────
  const btnClose = document.createElement("button");
  btnClose.className = "mobile-menu-close";
  btnClose.setAttribute("aria-label", "Fermer le menu");
  btnClose.innerHTML = "&#x2715;"; // ✕

  const labelClose = document.createElement("span");
  labelClose.className = "mobile-menu-close-label";
  labelClose.textContent = "Fermer";

  // Positionner le menu en relative pour que le bouton absolu soit bien calé
  mobileMenu.style.position = "fixed";
  mobileMenu.appendChild(btnClose);
  mobileMenu.appendChild(labelClose);

  // ── Fonctions ouvrir / fermer ────────────────────────────────
  function ouvrirMenu() {
    hamburger.classList.add("open");
    mobileMenu.classList.add("open");
    body.style.overflow = "hidden";
    hamburger.setAttribute("aria-expanded", "true");
  }

  function fermerMenu() {
    hamburger.classList.remove("open");
    mobileMenu.classList.remove("open");
    body.style.overflow = "";
    hamburger.setAttribute("aria-expanded", "false");
  }

  // ── Événements ───────────────────────────────────────────────

  // Hamburger (3 traits) → ouvre/ferme
  hamburger.addEventListener("click", () => {
    mobileMenu.classList.contains("open") ? fermerMenu() : ouvrirMenu();
  });

  // Bouton ✕ dans le menu → ferme
  btnClose.addEventListener("click", fermerMenu);

  // Clic sur un lien du menu → ferme
  mobileMenu.querySelectorAll("a").forEach((lien) => {
    lien.addEventListener("click", fermerMenu);
  });

  // Touche Escape → ferme
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fermerMenu();
  });

  // Clic en dehors du menu (sur le fond) → ferme
  mobileMenu.addEventListener("click", (e) => {
    if (e.target === mobileMenu) fermerMenu();
  });
})();

/* ══════════════════════════════════════════════════
   scroll.js — SOLE Sneakers CI
   Version Premium — Scroll lent, fluide & cinématique
   Améliorations :
     ✦ Vitesse réduite via SPEED + container 500vh
     ✦ Lenis pour scroll inertiel premium
     ✦ EASE monté à 0.07 (plus doux, moins élastique)
     ✦ Zoom réduit à 1.02 (plus subtil)
     ✦ Fade-in cinématique au chargement
     ✦ prefers-reduced-motion respecté
══════════════════════════════════════════════════ */

/* ── Config ──────────────────────────────────────── */
const SCROLL_CFG = {
  TOTAL: 200, // Nombre total de frames
  PATH: (n) => `public/Sneackers dossier/Sneackers (${n}).jpg`,
  EASE: 0.07, // Lerp interne (plus haut = plus réactif)
  ZOOM: 1.02, // Zoom max (réduit pour plus de subtilité)
  SPEED: 0.4, // Multiplicateur de vitesse (< 1 = plus lent)
  // 0.5 = 2× plus lent, 0.35 = très cinématique
  CONTAINER_HEIGHT: "900vh", // Hauteur du scroll container (ajuste ici)
  LENIS_LERP: 0.6, // Inertie Lenis (0.05 = très smooth, 0.12 = vif)
};

/* ── State ───────────────────────────────────────── */
const state = {
  frames: [],
  current: 0,
  target: 0,
  progress: 0,
  loaded: false,
  rafId: null,
  lenis: null,
};

/* ── DOM ─────────────────────────────────────────── */
const heroCanvas = document.getElementById("hero-canvas");
const hCtx = heroCanvas?.getContext("2d");
const loader = document.getElementById("loader");
const loaderBar = document.getElementById("loader-bar");
const loaderPct = document.getElementById("loader-pct");
const scrollHint = document.getElementById("scroll-hint");
const progBar = document.getElementById("scroll-progress");

/* ── Reduced motion ──────────────────────────────── */
const prefersReduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (!heroCanvas || !hCtx) {
  if (loader) loader.classList.add("hidden");
} else {
  init();
}

/* ══════════════════════════════════════════════════
   LENIS — Scroll inertiel premium
══════════════════════════════════════════════════ */
function initLenis() {
  // Lenis est chargé via CDN dans le HTML :
  // <script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>
  if (typeof Lenis === "undefined" || prefersReduced) return null;

  const lenis = new Lenis({
    lerp: SCROLL_CFG.LENIS_LERP, // Inertie globale du scroll
    smoothWheel: true,
    syncTouch: false, // Désactivé sur touch pour éviter les conflits iOS
  });

  // Boucle RAF dédiée à Lenis
  function lenisRaf(time) {
    lenis.raf(time);
    requestAnimationFrame(lenisRaf);
  }
  requestAnimationFrame(lenisRaf);

  return lenis;
}

/* ══════════════════════════════════════════════════
   HAUTEUR DU CONTAINER — Clé de la vitesse
══════════════════════════════════════════════════ */
function setContainerHeight() {
  const container = document.getElementById("scroll-container");
  if (!container) return;
  // Plus cette valeur est grande, plus le scroll est lent et cinématique
  container.style.height = SCROLL_CFG.CONTAINER_HEIGHT;
}

/* ══════════════════════════════════════════════════
   PRÉCHARGEMENT
══════════════════════════════════════════════════ */
function preloadFrames() {
  return new Promise((resolve) => {
    let done = 0;

    for (let i = 1; i <= SCROLL_CFG.TOTAL; i++) {
      const img = new Image();
      img.src = SCROLL_CFG.PATH(i);

      img.onload = img.onerror = () => {
        done++;
        const pct = Math.round((done / SCROLL_CFG.TOTAL) * 100);
        if (loaderBar) loaderBar.style.width = pct + "%";
        if (loaderPct) loaderPct.textContent = pct + "%";
        if (done === SCROLL_CFG.TOTAL) resolve();
      };

      state.frames[i - 1] = img;
    }
  });
}

/* ══════════════════════════════════════════════════
   RESIZE
══════════════════════════════════════════════════ */
function resizeCanvas() {
  if (!heroCanvas) return;
  heroCanvas.width = window.innerWidth;
  heroCanvas.height = window.innerHeight;
  drawFrame(Math.floor(state.current));
}

/* ══════════════════════════════════════════════════
   RENDU FRAME
══════════════════════════════════════════════════ */
function drawFrame(idx) {
  const safeIdx = Math.max(0, Math.min(idx, SCROLL_CFG.TOTAL - 1));
  const img = state.frames[safeIdx];
  if (!img?.complete || !img.naturalWidth) return;

  const cw = heroCanvas.width;
  const ch = heroCanvas.height;

  // Cover : l'image remplit toujours le canvas
  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  // Zoom subtil au passage (sin pour aller-retour doux)
  const zoom = 1 + (SCROLL_CFG.ZOOM - 1) * Math.sin(state.progress * Math.PI);

  hCtx.save();
  hCtx.clearRect(0, 0, cw, ch);
  hCtx.translate(cw / 2, ch / 2);
  hCtx.scale(zoom, zoom);
  hCtx.translate(-cw / 2, -ch / 2);
  hCtx.drawImage(img, dx, dy, dw, dh);
  hCtx.restore();
}

/* ══════════════════════════════════════════════════
   BOUCLE D'ANIMATION (Lerp interne)
══════════════════════════════════════════════════ */
function animate() {
  state.rafId = requestAnimationFrame(animate);

  // Interpolation douce vers la cible
  state.current += (state.target - state.current) * SCROLL_CFG.EASE;

  // Snap final pour éviter les micro-oscillations
  if (Math.abs(state.target - state.current) < 0.005) {
    state.current = state.target;
  }

  drawFrame(Math.round(state.current));
}

/* ══════════════════════════════════════════════════
   SCROLL → FRAME
   SPEED < 1 = ralentit la progression des frames
   par rapport au scroll réel
══════════════════════════════════════════════════ */
function onScroll() {
  const container = document.getElementById("scroll-container");
  if (!container) return;

  const scrollY = window.scrollY;
  const maxScroll = container.offsetHeight - window.innerHeight;

  if (maxScroll <= 0) return;

  // Progression brute 0→1
  const rawProgress = Math.max(0, Math.min(scrollY / maxScroll, 1));

  // ── Vitesse réduite ──────────────────────────────
  // SPEED × 2 pour que SPEED=0.5 corresponde à 50% de la vitesse normale
  // clamp à 1 pour ne jamais dépasser la dernière frame
  const slowProgress = Math.min(rawProgress * (SCROLL_CFG.SPEED * 2), 1);

  state.progress = rawProgress;
  state.target = slowProgress * (SCROLL_CFG.TOTAL - 1);

  // UI
  if (progBar) progBar.style.width = rawProgress * 100 + "%";
  if (scrollHint) scrollHint.classList.toggle("hidden", scrollY > 80);

  const navbar = document.getElementById("navbar");
  if (navbar) navbar.classList.toggle("scrolled", scrollY > 80);

  // Fade-out du canvas en fin de section
  if (heroCanvas) {
    const container = document.getElementById("scroll-container");
    const past = scrollY >= (container?.offsetHeight ?? 0) - 10;
    heroCanvas.style.opacity = past ? "0" : "1";
  }
}

/* ══════════════════════════════════════════════════
   FADE-IN CINÉMATIQUE AU CHARGEMENT
══════════════════════════════════════════════════ */
function fadeInCanvas() {
  if (!heroCanvas) return;
  heroCanvas.style.opacity = "0";
  heroCanvas.style.transition = "opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)";
  // Délai court pour laisser le loader disparaître d'abord
  setTimeout(() => {
    heroCanvas.style.opacity = "1";
  }, 100);
}

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
async function init() {
  // Hauteur du container en premier (avant tout calcul de scroll)
  setContainerHeight();

  resizeCanvas();
  window.addEventListener("resize", () => {
    setContainerHeight();
    resizeCanvas();
  });
  window.addEventListener("scroll", onScroll, { passive: true });

  // Préchargement de toutes les frames
  await preloadFrames();

  // Masque le loader avec transition
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => loader.classList.add("hidden"), 600);
  }

  // Lenis (scroll inertiel) — nécessite le CDN dans ton HTML
  state.lenis = initLenis();

  state.loaded = true;

  // Sync état initial
  onScroll();

  // Fade-in du canvas
  fadeInCanvas();

  // Lance la boucle d'animation
  animate();
}

/* ══════════════════════════════════════════════════
   NOTES D'INTÉGRATION
   ────────────────────────────────────────────────
   1. Ajoute Lenis dans ton HTML (avant ce script) :
      <script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>

   2. Ajuste SCROLL_CFG.CONTAINER_HEIGHT pour la vitesse :
      "300vh" = rapide
      "500vh" = équilibré (défaut)
      "700vh" = très cinématique / lent

   3. Ajuste SCROLL_CFG.SPEED pour affiner :
      0.7 = légèrement plus lent que la normale
      0.55 = défaut recommandé
      0.35 = très lent, effet séquence photo

   4. SCROLL_CFG.LENIS_LERP pour l'inertie du scroll :
      0.05 = très lourd / huilé
      0.07 = équilibré premium (défaut)
      0.12 = léger / réactif

   5. Canvas CSS recommandé :
      #hero-canvas {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        will-change: transform;  ← force le GPU
        z-index: 0;
      }
══════════════════════════════════════════════════ */

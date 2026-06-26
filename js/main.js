// =========================================================
// APOLLO EVE — Main entry
// Boots the 3D scenes and wires up the page interactions.
// =========================================================
import { initHeroScene } from "./scene.js";
import { initEveScene } from "./eve.js";

/* ---------- Disable page zoom ---------- */
function disableZoom() {
  // Ctrl/Cmd + mouse wheel zoom
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    },
    { passive: false }
  );
  // Ctrl/Cmd + (+/-/0) keyboard zoom
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) {
      e.preventDefault();
    }
  });
  // Safari pinch-zoom gestures
  ["gesturestart", "gesturechange", "gestureend"].forEach((evt) =>
    document.addEventListener(evt, (e) => e.preventDefault(), { passive: false })
  );
}

/* ---------- Boot / preloader ---------- */
function runBoot() {
  const boot = document.getElementById("boot");
  const bar = document.getElementById("bootBar");
  let p = 0;
  const tick = setInterval(() => {
    p = Math.min(100, p + Math.random() * 22);
    if (bar) bar.style.width = p + "%";
    if (p >= 100) {
      clearInterval(tick);
      setTimeout(() => boot && boot.classList.add("is-done"), 350);
    }
  }, 140);
}

/* ---------- Hero 3D ---------- */
let hero = null;
function bootScenes() {
  const heroCanvas = document.getElementById("scene");
  if (heroCanvas) {
    try {
      hero = initHeroScene(heroCanvas);
    } catch (e) {
      console.warn("Hero scene failed to start:", e);
    }
  }
  const eveCanvas = document.getElementById("eveScene");
  if (eveCanvas) {
    try {
      initEveScene(eveCanvas);
    } catch (e) {
      console.warn("Eve scene failed to start:", e);
    }
  }
}

/* ---------- Scroll-driven state ---------- */
function wireScroll() {
  const hudPct = document.getElementById("hudPct");
  const nav = document.getElementById("nav");

  function onScroll() {
    const max = document.body.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;

    if (hero) hero.setScroll(p);
    if (hudPct) hudPct.textContent = String(Math.round(p * 100)).padStart(3, "0");
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- Reveal on scroll ---------- */
function wireReveal() {
  const items = document.querySelectorAll(".reveal");
  // stagger siblings within a group
  document.querySelectorAll(".grid, .swatches, .evo, .spec, .abilities, .roster, .hero, .hero__tag")
    .forEach((group) => {
      group.querySelectorAll(":scope > .reveal, :scope .reveal").forEach((el, i) => {
        el.style.setProperty("--i", i);
      });
    });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  items.forEach((el) => io.observe(el));
}

/* ---------- Card pointer glow ---------- */
function wireCards() {
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });
}

/* ---------- Smooth anchor scrolling ---------- */
function wireNav() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id && id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
}

/* ---------- Hotspot tracking + About dialog ---------- */
function wireAbout() {
  const hotspot = document.getElementById("hotspot");
  const modal = document.getElementById("aboutModal");
  if (!hotspot || !modal) return;

  // Keep the hotspot glued to the orbiting dot
  function follow() {
    requestAnimationFrame(follow);
    if (!hero || !hero.getMoonScreen) return;
    const p = hero.getMoonScreen();
    if (p.visible) {
      hotspot.style.left = p.x + "px";
      hotspot.style.top = p.y + "px";
      hotspot.classList.add("is-ready");
    } else {
      hotspot.classList.remove("is-ready");
    }
  }
  follow();

  const open = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };
  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  };

  hotspot.addEventListener("click", open);
  modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });
}

/* ---------- Init ---------- */
window.addEventListener("DOMContentLoaded", () => {
  disableZoom();
  runBoot();
  bootScenes();
  wireScroll();
  wireReveal();
  wireCards();
  wireNav();
  wireAbout();
});

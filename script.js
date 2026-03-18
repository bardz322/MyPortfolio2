(() => {
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("nav-links");
  const navLinkEls = Array.from(document.querySelectorAll(".nav-link"));

  function setNavOpen(open) {
    if (!navToggle || !navLinks) return;
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navLinks.classList.toggle("is-open", open);
  }

  navToggle?.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    setNavOpen(!isOpen);
  });

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (!navLinks?.classList.contains("is-open")) return;
    const clickedInsideNav = target.closest(".site-nav");
    if (!clickedInsideNav) setNavOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setNavOpen(false);
  });

  navLinkEls.forEach((a) => {
    a.addEventListener("click", () => setNavOpen(false));
  });

  // Smooth scroll with header offset and focus management.
  const header = document.querySelector(".site-header");
  const headerOffset = () => (header instanceof HTMLElement ? header.offsetHeight + 12 : 76);

  function focusTargetAfterScroll(el) {
    if (!(el instanceof HTMLElement)) return;
    const prevTabIndex = el.getAttribute("tabindex");
    if (prevTabIndex === null) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    if (prevTabIndex === null) {
      setTimeout(() => el.removeAttribute("tabindex"), 400);
    }
  }

  function scrollToHash(hash) {
    if (!hash || hash === "#") return;
    const id = decodeURIComponent(hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    focusTargetAfterScroll(target);
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const link = t.closest('a[href^="#"]');
    if (!(link instanceof HTMLAnchorElement)) return;
    const href = link.getAttribute("href") || "";
    if (href.length <= 1) return;
    e.preventDefault();
    history.pushState(null, "", href);
    scrollToHash(href);
  });

  // Reveal on scroll.
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (!(el instanceof HTMLElement)) return;
          const delayAttr = el.getAttribute("data-reveal-delay");
          const delay = delayAttr ? Number.parseInt(delayAttr, 10) : 0;
          if (Number.isFinite(delay) && delay > 0) el.style.setProperty("--d", `${delay}ms`);
          el.classList.add("is-visible");
          io.unobserve(el);
        });
      },
      { root: null, threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Active nav link (scrollspy)
  const sectionIds = ["about", "projects", "skills", "contact"];
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter((el) => el instanceof HTMLElement);

  const linkById = new Map(
    navLinkEls
      .map((a) => {
        const href = a.getAttribute("href") || "";
        const id = href.startsWith("#") ? href.slice(1) : "";
        return [id, a];
      })
      .filter(([id]) => id)
  );

  function updateActiveLink() {
    const y = window.scrollY + headerOffset() + 10;
    let active = "";
    for (const sec of sections) {
      if (!(sec instanceof HTMLElement)) continue;
      if (sec.offsetTop <= y) active = sec.id;
    }
    linkById.forEach((a) => a.classList.remove("is-active"));
    const activeLink = linkById.get(active);
    if (activeLink) activeLink.classList.add("is-active");
  }

  window.addEventListener("scroll", () => {
    window.requestAnimationFrame(updateActiveLink);
  });
  updateActiveLink();

  // Contact form: lightweight client-side validation + feedback.
  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");

  function setError(input, errEl, message) {
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (errEl) errEl.textContent = message || "";
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!(form instanceof HTMLFormElement)) return;

    const name = form.querySelector("#name");
    const email = form.querySelector("#email");
    const message = form.querySelector("#message");

    const errName = document.getElementById("err-name");
    const errEmail = document.getElementById("err-email");
    const errMessage = document.getElementById("err-message");

    const nameVal = name instanceof HTMLInputElement ? name.value.trim() : "";
    const emailVal = email instanceof HTMLInputElement ? email.value.trim() : "";
    const messageVal = message instanceof HTMLTextAreaElement ? message.value.trim() : "";

    let ok = true;
    if (!nameVal) {
      setError(name, errName, "Please enter your name.");
      ok = false;
    } else setError(name, errName, "");

    if (!emailVal) {
      setError(email, errEmail, "Please enter your email.");
      ok = false;
    } else if (!validateEmail(emailVal)) {
      setError(email, errEmail, "Please enter a valid email.");
      ok = false;
    } else setError(email, errEmail, "");

    if (!messageVal) {
      setError(message, errMessage, "Please enter a short message.");
      ok = false;
    } else setError(message, errMessage, "");

    if (!ok) {
      note && (note.textContent = "Fix the highlighted fields, then try again.");
      return;
    }

    note && (note.textContent = "Message ready. Connect this form to EmailJS or a backend endpoint when you’re ready.");
    form.reset();
    [name, email, message].forEach((el) => {
      if (el instanceof HTMLElement) el.setAttribute("aria-invalid", "false");
    });
  });
})();

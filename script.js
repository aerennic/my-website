(function () {
  "use strict";

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- boot screen (once per browser session) ---------- */
  const boot = document.querySelector("#boot");
  if (sessionStorage.getItem("booted")) {
    boot.remove();
  } else {
    const fill = document.querySelector("#boot-fill");
    requestAnimationFrame(() => (fill.style.width = "100%"));
    setTimeout(() => {
      boot.classList.add("hide");
      sessionStorage.setItem("booted", "1");
      setTimeout(() => boot.remove(), 500);
    }, 1100);
  }

  /* ---------- floating particles ---------- */
  (function () {
    const canvas = document.querySelector("#particles");
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h, particles;

    const colorFor = (alpha) => `rgba(255, 255, 255, ${alpha})`;

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels, render crisp on hi-dpi screens
    };

    const makeParticle = (randomY) => ({
      x: Math.random() * w,
      y: randomY ? Math.random() * h : h + 10,
      r: 1 + Math.random() * 2.6,
      speed: 0.15 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.4,
      alpha: 0.25 + Math.random() * 0.5,
      twinkle: Math.random() * Math.PI * 2,
    });

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        const flicker = p.alpha * (0.7 + 0.3 * Math.sin(p.twinkle));
        ctx.beginPath();
        ctx.fillStyle = colorFor(flicker);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const tick = () => {
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += p.drift;
        p.twinkle += 0.03;
        if (p.y < -10) Object.assign(p, makeParticle(false));
      });
      draw();
      requestAnimationFrame(tick);
    };

    const init = () => {
      resize();
      const count = Math.min(70, Math.floor((w * h) / 18000));
      particles = Array.from({ length: count }, () => makeParticle(true));
      if (reduceMotion) draw(); // static frame; resizing clears the canvas, so redraw it
    };

    let resizeTimer;
    addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 150);
    });

    init();
    if (!reduceMotion) requestAnimationFrame(tick);
  })();

  /* ---------- rotating status line ---------- */
  const statuses = [
    "software developer",
    "aspiring creator",
    "UI/UX enthusiast",
    "aspiring web developer",
  ];
  const statusEl = document.querySelector("#status");
  let statusIndex = 0;

  const showStatus = () => {
    statusEl.style.opacity = 0;
    setTimeout(() => {
      statusEl.textContent = statuses[statusIndex % statuses.length];
      statusEl.style.opacity = 1;
      statusIndex++;
    }, 300);
  };

  if (reduceMotion) {
    statusEl.textContent = statuses[0]; // no auto-updating text for people who asked for less motion
  } else {
    showStatus();
    setInterval(showStatus, 3000);
  }

  /* ---------- windows: open / close / minimize / focus ---------- */
  const panels = [...document.querySelectorAll(".panel")];
  const panelById = (id) => document.getElementById(id);
  const taskbarEl = document.querySelector("#taskbar");
  const openers = new Map(); // panel id -> the element that opened it, so focus can go back
  let z = 10;

  const front = (p) => (p.style.zIndex = ++z);
  const isOpen = (p) => p.classList.contains("open") && !p.classList.contains("minimized");

  const renderTaskbar = () => {
    taskbarEl.innerHTML = "";
    panels
      .filter((p) => p.classList.contains("open"))
      .forEach((p) => {
        const b = document.createElement("button");
        b.textContent = p.querySelector("header span").textContent;
        b.classList.toggle("minimized", p.classList.contains("minimized"));
        b.addEventListener("click", () => {
          if (p.classList.contains("minimized")) {
            p.classList.remove("minimized");
            front(p);
            p.focus({ preventScroll: true });
          } else {
            p.classList.add("minimized");
          }
          renderTaskbar();
        });
        taskbarEl.append(b);
      });
  };

  /* The URL hash mirrors the most recently opened window (e.g. /#projects),
     so a window can be linked to and is restored on reload. */
  const setHash = (id) => {
    const url = id ? `#${id}` : location.pathname + location.search;
    history.replaceState(null, "", url);
  };

  const openPanel = (id, opener) => {
    const p = panelById(id);
    if (!p || !p.classList.contains("panel")) return;
    if (opener) openers.set(id, opener);
    p.classList.add("open");
    p.classList.remove("minimized");
    front(p);
    p.focus({ preventScroll: true });
    renderTaskbar();
    setHash(id);
  };

  const closePanel = (id) => {
    const p = panelById(id);
    if (!p) return;
    p.classList.remove("open");
    renderTaskbar();
    if (location.hash === `#${id}`) setHash("");
    const opener = openers.get(id);
    openers.delete(id);
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  };

  const minimizePanel = (id) => {
    panelById(id).classList.add("minimized");
    renderTaskbar();
  };

  document.querySelectorAll("[data-open]").forEach((b) =>
    b.addEventListener("click", () => openPanel(b.dataset.open, b))
  );
  document.querySelectorAll("[data-close]").forEach((b) =>
    b.addEventListener("click", () => closePanel(b.dataset.close))
  );
  document.querySelectorAll("[data-minimize]").forEach((b) =>
    b.addEventListener("click", () => minimizePanel(b.dataset.minimize))
  );

  // Escape closes the window that has focus, otherwise the one on top.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (menuEl) return closeMenu();
    const focused = document.activeElement && document.activeElement.closest(".panel");
    const target =
      focused && isOpen(focused)
        ? focused
        : panels.filter(isOpen).sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
    if (target) closePanel(target.id);
  });

  // Deep links: open the window named in the hash on load and when it changes.
  const openFromHash = () => {
    const id = location.hash.slice(1);
    if (id && panels.some((p) => p.id === id)) openPanel(id);
  };
  addEventListener("hashchange", openFromHash);

  panels.forEach((p) => {
    p.addEventListener("pointerdown", () => front(p));
    const handle = p.querySelector("[data-drag]");
    let startX, startY, originX, originY;
    let dragging = false;

    handle.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button") || innerWidth < 721) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const r = p.getBoundingClientRect();
      originX = r.left;
      originY = r.top;
      handle.setPointerCapture(e.pointerId);
      front(p);
    });
    handle.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      p.style.left =
        Math.max(8, Math.min(innerWidth - p.offsetWidth - 8, originX + e.clientX - startX)) + "px";
      p.style.top =
        Math.max(8, Math.min(innerHeight - p.offsetHeight - 8, originY + e.clientY - startY)) + "px";
      p.style.right = "auto";
    });
    handle.addEventListener("pointerup", () => (dragging = false));
  });

  /* ---------- click sound + mute toggle ---------- */
  const soundBtn = document.getElementById("sound");
  const clickAudio = document.getElementById("click-audio");
  let soundOn = true;

  const playClick = () => {
    if (!soundOn) return;
    clickAudio.currentTime = 0; // restart so rapid clicks retrigger
    clickAudio.play().catch(() => {}); // ignore blocked or interrupted playback
  };

  document.addEventListener("click", (e) => {
    if (e.target.closest("button")) playClick();
  });

  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    soundBtn.setAttribute("aria-pressed", String(soundOn));
  });

  /* ---------- right-click desktop menu ---------- */
  const menuItems = [{ label: "🔄 refresh", action: () => location.reload() }];
  let menuEl = null;

  function closeMenu() {
    if (menuEl) {
      menuEl.remove();
      menuEl = null;
    }
  }

  document.querySelector(".desktop").addEventListener("contextmenu", (e) => {
    // Leave the browser's own menu alone on windows, links and buttons
    // (so "save image", "copy link" and "inspect" keep working there).
    if (e.target.closest(".panel, a, button")) return;
    e.preventDefault();
    closeMenu();
    menuEl = document.createElement("div");
    menuEl.className = "context-menu";
    menuEl.setAttribute("role", "menu");
    menuItems.forEach((item) => {
      const b = document.createElement("button");
      b.setAttribute("role", "menuitem");
      b.textContent = item.label;
      b.addEventListener("click", () => {
        item.action();
        closeMenu();
      });
      menuEl.append(b);
    });
    menuEl.style.left = Math.min(e.clientX, innerWidth - 220) + "px";
    menuEl.style.top = Math.min(e.clientY, innerHeight - 160) + "px";
    document.body.append(menuEl);
  });
  document.addEventListener("click", closeMenu);
  document.addEventListener("scroll", closeMenu, true);

  /* ---------- "on repeat" playlist widget (about > interests) ---------- */
  const songs = [
    { title: "Perfect Night", artist: "LE SSERAFIM" },
    { title: "Nicole Kidman", artist: "ADELA" },
    { title: "Lost Island", artist: "ENHYPEN" },
    { title: "_WORLD", artist: "SEVENTEEN" },
  ];

  (function () {
    const root = document.querySelector("#playlist");
    if (!root) return;
    const list = root.querySelector("#pl-cards");
    const label = root.querySelector("#pl-label");
    const record = root.querySelector(".pl-record");
    const tints = ["#a0bbf3", "#c9a7c4", "#9cc4b5", "#d9c08f", "#a99fd6", "#86b3c9"];

    const setLabel = (i) => label.style.setProperty("--pl-label", tints[i % tints.length]);

    const cards = songs.map((song, i) => {
      const li = document.createElement("li");
      li.className = "pl-card";
      li.innerHTML = `<div class="pl-text"><div class="pl-name"></div><div class="pl-artist"></div></div>`;
      li.querySelector(".pl-name").textContent = song.title;
      li.querySelector(".pl-artist").textContent = song.artist;
      li.addEventListener("pointerenter", () => setLabel(i));
      list.append(li);
      return li;
    });
    setLabel(0);

    // nudge each card right so the stack hugs the curve of the record
    const hug = () => {
      const r = record.getBoundingClientRect();
      if (!r.width) return; // about window is closed
      const R = r.width / 2;
      const cx = r.left + R;
      const cy = r.top + R;
      cards.forEach((c) => (c.style.marginLeft = c.style.maxWidth = ""));
      cards.forEach((c) => {
        const b = c.getBoundingClientRect();
        // vertical distance from the record's centre to the closest point of the card
        const dy =
          b.top <= cy && b.bottom >= cy ? 0 : Math.min(Math.abs(b.top - cy), Math.abs(b.bottom - cy));
        const vinylEdge = dy < R ? cx + Math.sqrt(R * R - dy * dy) : cx;
        const m = Math.max(0, vinylEdge + 14 - b.left);
        c.style.marginLeft = `${m}px`;
        c.style.maxWidth = `calc(100% - ${m}px)`; // never push a card off the edge
      });
    };
    new ResizeObserver(hug).observe(root);
  })();

  /* ---------- photo collage captions (about) ---------- */
  const captions = {
    default: "Hover over photos for captions!",
    image1: "Taken when I was volunteering for FROSH 2025!",
    image2: "Me and my handcrafted bouquet at Sam's birthday party :)",
    image3: "Rare photo of my drawing process :O",
  };

  (function () {
    const root = document.querySelector(".photo-collage");
    if (!root) return;
    const images = root.querySelectorAll(".photo-collage-image");
    const captionEl = root.querySelector(".caption");

    const updateCaption = (img) => {
      const key = img ? img.dataset.key : "default";
      captionEl.textContent = captions[key] ?? captions.default;
    };

    images.forEach((img) => {
      img.addEventListener("pointerenter", () => updateCaption(img));
      img.addEventListener("pointerleave", () => updateCaption(null));
    });
    updateCaption(null);
  })();

  /* ---------- technical skills filter (about) ---------- */
  const skills = {
    Languages: ["HTML", "CSS", "Java", "Python", "C", "C++", "JavaScript", "TypeScript", "SQL", "RISCV-Assembly", "Bash", "LaTeX"],
    Frameworks: ["React", "Node.js", "JUnit", "Mockito"],
    "Tools & Systems": ["Git", "GitHub", "Docker", "Cloudflare", "Figma", "Expo", "Maven", "CMake", "VS Code", "UML", "Linux", "TCP/UDP", "Neovim", "Procreate", "MATLAB"],
  };
  const skillColours = {
    Languages: "#6b85af",
    Frameworks: "#c79bb8",
    "Tools & Systems": "#8fb8a8",
  };

  (function () {
    const root = document.querySelector("#skills");
    if (!root) return;
    const filters = root.querySelector(".sk-filters");
    const list = root.querySelector(".sk-list");
    const all = Object.entries(skills).flatMap(([cat, names]) => names.map((name) => ({ name, cat })));

    const show = (cat) => {
      filters
        .querySelectorAll("button")
        .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === cat)));
      list.innerHTML = "";
      all
        .filter((s) => cat === "All" || s.cat === cat)
        .forEach((s, i) => {
          const li = document.createElement("li");
          li.className = "sk-chip";
          li.textContent = s.name;
          li.title = s.cat;
          li.style.setProperty("--sk-dot", skillColours[s.cat] || "#6b85af");
          li.style.animationDelay = `${i * 30}ms`; // chips pop in one after another
          list.append(li);
        });
    };

    ["All", ...Object.keys(skills)].forEach((cat) => {
      const b = document.createElement("button");
      b.className = "sk-filter";
      b.dataset.cat = cat;
      const n = cat === "All" ? all.length : skills[cat].length;
      b.innerHTML = `${cat}<small>${n}</small>`;
      b.addEventListener("click", () => show(cat));
      filters.append(b);
    });
    show("Languages"); // default category
  })();

  /* ---------- open the window named in the URL hash, if any ---------- */
  openFromHash();
})();

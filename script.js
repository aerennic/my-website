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
                const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
                let w, h, particles;
 
                const colorFor = (alpha) => `rgba(255, 255, 255, ${alpha})`;
 
                const resize = () => {
                    w = canvas.width = canvas.offsetWidth;
                    h = canvas.height = canvas.offsetHeight;
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
 
                const init = () => {
                    resize();
                    const count = Math.min(70, Math.floor((w * h) / 18000));
                    particles = Array.from({ length: count }, () => makeParticle(true));
                };
 
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
 
                init();
                addEventListener("resize", init);
                reduceMotion ? draw() : requestAnimationFrame(tick);
            })();
 
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
            showStatus();
            setInterval(showStatus, 3000);
 
            /* ---------- windows: open / close / minimize / focus ---------- */
            const panels = [...document.querySelectorAll(".panel")];
            let z = 10;
            const front = (p) => (p.style.zIndex = ++z);
            const taskbar = () => {
                const bar = document.querySelector("#taskbar");
                bar.innerHTML = "";
                panels
                    .filter((p) => p.classList.contains("open"))
                    .forEach((p) => {
                        const b = document.createElement("button");
                        b.textContent = p.querySelector("header span").textContent;
                        b.classList.toggle("minimized", p.classList.contains("minimized"));
                        b.onclick = () => {
                            if (p.classList.contains("minimized")) {
                                p.classList.remove("minimized");
                                front(p);
                            } else {
                                p.classList.add("minimized");
                            }
                            taskbar();
                        };
                        bar.append(b);
                    });
            };
            document.querySelectorAll("[data-open]").forEach(
                (b) =>
                    (b.onclick = () => {
                        const p = document.querySelector("#" + b.dataset.open);
                        p.classList.add("open");
                        p.classList.remove("minimized");
                        front(p);
                        taskbar();
                    })
            );
            document.querySelectorAll("[data-close]").forEach(
                (b) =>
                    (b.onclick = () => {
                        document.querySelector("#" + b.dataset.close).classList.remove("open");
                        taskbar();
                    })
            );
            document.querySelectorAll("[data-minimize]").forEach(
                (b) =>
                    (b.onclick = () => {
                        document.querySelector("#" + b.dataset.minimize).classList.add("minimized");
                        taskbar();
                    })
            );
            panels.forEach((p) => {
                p.addEventListener("pointerdown", () => front(p));
                const h = p.querySelector("[data-drag]");
                let sx,
                    sy,
                    ox,
                    oy,
                    drag = false;
                h.addEventListener("pointerdown", (e) => {
                    if (e.target.closest("button") || innerWidth < 721) return;
                    drag = true;
                    sx = e.clientX;
                    sy = e.clientY;
                    const r = p.getBoundingClientRect();
                    ox = r.left;
                    oy = r.top;
                    h.setPointerCapture(e.pointerId);
                    front(p);
                });
                h.addEventListener("pointermove", (e) => {
                    if (!drag) return;
                    p.style.left = Math.max(8, Math.min(innerWidth - p.offsetWidth - 8, ox + e.clientX - sx)) + "px";
                    p.style.top = Math.max(8, Math.min(innerHeight - p.offsetHeight - 8, oy + e.clientY - sy)) + "px";
                    p.style.right = "auto";
                });
                h.addEventListener("pointerup", () => (drag = false));
 
                /* ---------- resizing ---------- */
                // const handle = p.querySelector("[data-resize]");
                // if (handle) {
                //     let rsx, rsy, rw, rh, resizing = false;
                //     handle.addEventListener("pointerdown", (e) => {
                //         if (innerWidth < 721) return;
                //         resizing = true;
                //         rsx = e.clientX;
                //         rsy = e.clientY;
                //         rw = p.offsetWidth;
                //         rh = p.offsetHeight;
                //         handle.setPointerCapture(e.pointerId);
                //         front(p);
                //         e.stopPropagation();
                //     });
                //     handle.addEventListener("pointermove", (e) => {
                //         if (!resizing) return;
                //         const newW = Math.max(280, Math.min(innerWidth - 16, rw + e.clientX - rsx));
                //         const newH = Math.max(220, Math.min(innerHeight - 16, rh + e.clientY - rsy));
                //         p.style.width = newW + "px";
                //         p.style.height = newH + "px";
                //     });
                //     handle.addEventListener("pointerup", () => (resizing = false));
                // }
            });
            const clickAudio = document.querySelector("#click-audio");
            let soundIsOn = true;
 
            function playClick() {
                if (!soundIsOn) return;
                clickAudio.currentTime = 0; // restart so rapid clicks retrigger properly
                clickAudio.play();
            }
 
            document.addEventListener("click", (e) => {
                if (e.target.closest("button")) {
                    playClick();
                }
            });
 
            const soundButton = document.querySelector("#sound");
            const soundIcon = soundButton.querySelector("img");
            soundButton.onclick = () => {
                soundIsOn = !soundIsOn;
                soundIcon.src = soundIsOn ? "images/volume.png" : "images/volume off.png";
                soundButton.setAttribute("aria-label", soundIsOn ? "Turn sound off" : "Turn sound on");
            };
 
            /* ---------- right-click desktop context menu ---------- */
            const menuItems = [
                { label: "🔄 refresh", action: () => location.reload() },
            ];
            let menuEl = null;
            const closeMenu = () => {
                if (menuEl) { menuEl.remove(); menuEl = null; }
            };
            document.querySelector(".desktop").addEventListener("contextmenu", (e) => {
                e.preventDefault();
                closeMenu();
                menuEl = document.createElement("div");
                menuEl.className = "context-menu";
                menuItems.forEach((item) => {
                    const b = document.createElement("button");
                    b.textContent = item.label;
                    b.onclick = () => { item.action(); closeMenu(); };
                    menuEl.append(b);
                });
                menuEl.style.left = Math.min(e.clientX, innerWidth - 220) + "px";
                menuEl.style.top = Math.min(e.clientY, innerHeight - 160) + "px";
                document.body.append(menuEl);
            });
            document.addEventListener("click", closeMenu);
            document.addEventListener("scroll", closeMenu, true);
 
            function toast(msg) {
                const t = document.createElement("div");
                t.className = "toast";
                t.textContent = msg;
                document.body.append(t);
                setTimeout(() => t.classList.add("show"), 10);
                setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2200);
            }


 
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
 
    const setLabel = (i) => {
        label.style.setProperty("--pl-label", tints[i % tints.length]);
    };
 
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
        const R = r.width / 2, cx = r.left + R, cy = r.top + R;
        const items = cards;
        items.forEach((c) => (c.style.marginLeft = c.style.maxWidth = ""));
        items.forEach((c) => {
            const b = c.getBoundingClientRect();
            // vertical distance from the record's centre to the closest point of the card
            const dy = b.top <= cy && b.bottom >= cy ? 0 : Math.min(Math.abs(b.top - cy), Math.abs(b.bottom - cy));
            const vinylEdge = dy < R ? cx + Math.sqrt(R * R - dy * dy) : cx;
            const m = Math.max(0, vinylEdge + 14 - b.left);
            c.style.marginLeft = `${m}px`;
            c.style.maxWidth = `calc(100% - ${m}px)`; // never push a card off the edge
        });
    };
    new ResizeObserver(hug).observe(root);
})();
 
const captions = {
    default: "Hover over photos for captions!",
    image1: "Taken when I was volunteering for FROSH 2025!",
    image2: "Me and my handcrafted bouquet at Sam's birthday party :)",
    image3: "Rare photo of my drawing process :O",
};

(function () {
    const root = document.querySelector(".photo-collage"); //grabs the photo collage container
    if (!root) {
        return; // exits if the container isn't on the page
    }

    const images = root.querySelectorAll(".photo-collage-image"); //grabs all the images in the photo collage
    const captionEl = root.querySelector(".caption"); //grabs the caption element in the photo collage

    const updateCaption = (img) => {
        const key = img ? img.dataset.key : "default";
        captionEl.textContent = captions[key] ?? captions.default; //updates the caption text based on the hovered image's data-key attribute, or shows the default caption if no image is hovered
    };

    images.forEach((img) => {
        img.addEventListener("pointerenter", () => updateCaption(img));
        img.addEventListener("pointerleave", () => updateCaption(null));
    });

    updateCaption(null);
})();


/* ---------- technical skills filter (about) ---------- */
const skills = {
    Languages: ["HTML", "CSS", "Java", "Python", "C", "C++", "JavaScript", "TypeScript", "SQL", "RISCV-assembly", "Bash", "LaTeX"],
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
        filters.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.cat === cat));
        list.innerHTML = "";
        all.filter((s) => cat === "All" || s.cat === cat).forEach((s, i) => {
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
        b.onclick = () => show(cat);
        filters.append(b);
    });
    show("Languages"); // default category
})();
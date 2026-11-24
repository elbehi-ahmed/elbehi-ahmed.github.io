(() => {
  "use strict";

  const GITHUB_USER = "elbehi-ahmed";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    sget(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  };

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const savedTheme = store.get("theme");
  if (savedTheme) root.dataset.theme = savedTheme;
  else if (window.matchMedia("(prefers-color-scheme: light)").matches) root.dataset.theme = "light";
  $("#themeToggle").addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    store.set("theme", next);
  });

  /* ---------- Nav, burger, progress, active link ---------- */
  const nav = $("#nav"), progress = $("#progress"), links = $("#navLinks"), burger = $("#burger");
  burger.addEventListener("click", () => { links.classList.toggle("open"); burger.classList.toggle("open"); });
  $$("#navLinks a").forEach(a => a.addEventListener("click", () => { links.classList.remove("open"); burger.classList.remove("open"); }));
  const sections = $$("main section[id]");
  const onScroll = () => {
    const y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("scrolled", y > 20);
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    let current = "";
    sections.forEach(s => { if (s.offsetTop - 140 <= y) current = s.id; });
    $$("#navLinks a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Cursor glow ---------- */
  const glow = $("#cursorGlow");
  if (!reduced && matchMedia("(pointer:fine)").matches) {
    addEventListener("pointermove", e => { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; }, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      en.target.dispatchEvent(new CustomEvent("revealed"));
      revealObs.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  const observeReveals = scope => {
    $$(".reveal:not(.in)", scope).forEach(el => {
      const siblings = [...el.parentElement.children].filter(c => c.classList.contains("reveal"));
      el.style.setProperty("--d", Math.min(siblings.indexOf(el), 6) * 0.08 + "s");
      revealObs.observe(el);
    });
  };
  observeReveals(document);

  /* ---------- Name scramble ---------- */
  const scramble = el => {
    const final = el.dataset.scramble, chars = "!<>-_\\/[]{}=+*^?#01";
    const t0 = performance.now(), dur = 900;
    const id = setInterval(() => {
      const p = (performance.now() - t0) / dur;
      if (p >= 1) { clearInterval(id); el.textContent = final; return; }
      el.textContent = final.split("").map((c, i) =>
        c === " " || p > i / final.length ? c : chars[(Math.random() * chars.length) | 0]).join("");
    }, 40);
  };
  if (!reduced) setTimeout(() => scramble($("[data-scramble]")), 250);

  /* ---------- Typed roles ---------- */
  const roles = [
    "Networking & Telecom Engineering student",
    "Cybersecurity & cryptography enthusiast",
    "CTF player @ Securinets INSAT",
    "Cisco CCNA ITN · SRWE · ENSA",
    "Android & IoT developer",
  ];
  const typed = $("#typed");
  if (reduced) typed.textContent = roles[0];
  else {
    let r = 0, i = 0, del = false;
    const loop = () => {
      const word = roles[r];
      typed.textContent = word.slice(0, i);
      if (!del && i < word.length) { i++; setTimeout(loop, 45 + Math.random() * 40); }
      else if (!del) { del = true; setTimeout(loop, 1800); }
      else if (i > 0) { i--; setTimeout(loop, 22); }
      else { del = false; r = (r + 1) % roles.length; setTimeout(loop, 300); }
    };
    setTimeout(loop, 900);
  }

  /* ---------- Terminal ---------- */
  const termLines = [
    { cmd: "whoami" },
    { out: [["", "ahmed.elbahi — 3rd-year Networking & Telecom Eng. @ INSAT"]] },
    { cmd: "cat focus.txt" },
    { out: [["k", "cybersecurity"], ["m", " · "], ["k", "cryptography"], ["m", " · "], ["k", "IoT"], ["m", " · "], ["k", "android"]] },
    { cmd: "ls clubs/" },
    { out: [["", "securinets_insat/   "], ["m", "# 2025 → now"]] },
    { out: [["", "android_club_insat/ "], ["m", "# 2026 → 2027"]] },
    { cmd: "ls certs/ --issuer=cisco" },
    { out: [["k", "ccna-itn.badge  ccna-srwe.badge  ccna-ensa.badge"]] },
    { cmd: "./achievements --top" },
    { out: [["w", "[#4] "], ["", "MPI Competition — model accuracy (0.7051)"]] },
    { out: [["w", "[TB] "], ["", "Baccalauréat Sciences 2024 — mention Très Bien"]] },
    { cmd: "echo $STATUS" },
    { out: [["c", "✔ open to internships"]] },
  ];
  const term = $("#term");
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const prompt = '<span class="c">➜</span> <span class="k">~</span> ';
  const renderOut = segs => segs.map(([c, t]) => c ? `<span class="${c}">${esc(t)}</span>` : esc(t)).join("");
  const runTerminal = async () => {
    let html = "";
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    for (const line of termLines) {
      if (line.cmd) {
        for (let i = 0; i <= line.cmd.length; i++) {
          term.innerHTML = html + prompt + esc(line.cmd.slice(0, i)) + '<span class="caret"></span>';
          await sleep(reduced ? 0 : 38 + Math.random() * 40);
        }
        html += prompt + esc(line.cmd) + "\n";
        await sleep(reduced ? 0 : 260);
      } else {
        html += renderOut(line.out) + "\n";
        term.innerHTML = html;
        await sleep(reduced ? 0 : 90);
      }
    }
    term.innerHTML = html + prompt + '<span class="caret"></span>';
  };
  $(".terminal").addEventListener("revealed", runTerminal, { once: true });

  /* ---------- Counters ---------- */
  const countUp = el => {
    const target = +el.dataset.count, prefix = el.dataset.prefix || "";
    if (reduced) { el.textContent = prefix + target; return; }
    const t0 = performance.now(), dur = 1400;
    const step = t => {
      const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { countUp(e.target); countObs.unobserve(e.target); }
  }), { threshold: 0.6 });
  $$("[data-count]").forEach(el => countObs.observe(el));
  $(".award-card").addEventListener("revealed", e => e.currentTarget.classList.add("in"));

  /* ---------- Tilt + spotlight + magnetic ---------- */
  const bindTilt = scope => {
    if (reduced || !matchMedia("(pointer:fine)").matches) return;
    $$(".tilt, .project, .cert", scope).forEach(card => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = 1;
      const strength = card.classList.contains("photo-frame") ? 10 : 5;
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * strength}deg) rotateY(${(x - 0.5) * strength}deg)`;
        card.style.setProperty("--mx", x * 100 + "%");
        card.style.setProperty("--my", y * 100 + "%");
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  };
  bindTilt(document);
  if (!reduced && matchMedia("(pointer:fine)").matches) {
    $$(".magnetic").forEach(btn => {
      btn.addEventListener("pointermove", e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- Network canvas (hero) ---------- */
  const canvas = $("#net"), ctx = canvas.getContext("2d");
  let W, H, nodes = [], mouse = { x: -9999, y: -9999 }, running = true, rgb = "46,230,166";
  const readColor = () => { rgb = getComputedStyle(root).getPropertyValue("--net").trim() || rgb; };
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(110, Math.floor((W * H) / 14000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6, pulse: Math.random() * Math.PI * 2,
    }));
  };
  const packets = [];
  const draw = () => {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    const maxD = 140;
    for (const p of nodes) {
      p.x += p.vx; p.y += p.vy; p.pulse += 0.02;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
      if (d < 180) { p.x -= dx * 0.004; p.y -= dy * 0.004; }
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < maxD) {
          ctx.strokeStyle = `rgba(${rgb},${(1 - d / maxD) * 0.22})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          if (!reduced && Math.random() < 0.0006 && packets.length < 14) packets.push({ a, b, t: 0 });
        }
      }
    }
    for (const p of nodes) {
      ctx.fillStyle = `rgba(${rgb},${0.45 + Math.sin(p.pulse) * 0.25})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    for (let k = packets.length - 1; k >= 0; k--) {
      const pk = packets[k]; pk.t += 0.02;
      if (pk.t >= 1) { packets.splice(k, 1); continue; }
      const x = pk.a.x + (pk.b.x - pk.a.x) * pk.t, y = pk.a.y + (pk.b.y - pk.a.y) * pk.t;
      ctx.fillStyle = `rgba(${rgb},0.95)`;
      ctx.shadowColor = `rgba(${rgb},1)`; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(draw);
  };
  readColor(); resize();
  addEventListener("resize", resize);
  canvas.parentElement.addEventListener("pointermove", e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  canvas.parentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  new MutationObserver(readColor).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was) draw(); }).observe(canvas);
  if (reduced) { running = false; requestAnimationFrame(() => { running = true; draw(); running = false; }); } else draw();

  /* ---------- Projects (live from GitHub, curated fallback) ---------- */
  const LANG_COLORS = {
    Kotlin: "#A97BFF", "C++": "#f34b7d", C: "#7f8c9b", Python: "#3572A5", PHP: "#4F5D95",
    Twig: "#c1d026", CSS: "#663399", JavaScript: "#f1e05a", HTML: "#e34c26", Dockerfile: "#384d54",
    Shell: "#89e051", Makefile: "#427819", Java: "#b07219",
  };
  const CURATED = {
    "IoT-Smart-Lighting-System": {
      title: "IoT Smart Lighting System", cats: ["iot"], featured: true, label: "IoT · Android · MQTT",
      points: [
        "Kotlin Android app controls an ESP32 in real time over MQTT (HiveMQ Cloud)",
        "TRIAC dimming, DHT11 monitoring, LCD and LDR closed-loop auto-brightness",
        "Local usage history & statistics with a Room database; two documented prototypes",
      ],
    },
    "university_assistant-": {
      title: "University Assistant", cats: ["web"], label: "Web · Symfony",
      points: [
        "Symfony 7.4 · PHP 8.3 · Doctrine · MySQL 8 — one-command Docker setup",
        "Student, teacher and admin roles with dashboards, assignments, exams and weighted grades",
        "Security first: invite-only whitelist, hashed passwords, CSRF, role-restricted areas",
      ],
    },
    "Wiener-s-Attack-RSA": {
      title: "Wiener's Attack on RSA", cats: ["security"], label: "Cryptanalysis",
      points: [
        "Recovers d, p, q from weak RSA keys via continued fractions",
        "Client-side BigInt calculator + Python reference implementation",
      ],
    },
    "Hashing-Algorithms": {
      title: "Hashing Algorithms in C", cats: ["security", "systems"], label: "Crypto · C",
      points: [
        "MD5, SHA-1, SHA-256, SHA-3 and BLAKE2 implemented from scratch",
        "Non-cryptographic hashes too: DJB2 and MurmurHash3",
      ],
    },
    "Dictionary-data-stucture": {
      title: "Dictionary (Hash Map) in C", cats: ["systems"], label: "Data structures · C",
      points: [
        "Insert, lookup, update and delete with collision handling",
        "Manual memory management, Makefile build and complexity notes",
      ],
    },
  };
  const ORDER = Object.keys(CURATED);
  const FALLBACK = [
    { name: "IoT-Smart-Lighting-System", description: "An end-to-end IoT smart solution utilizing an Android app to remotely control and monitor physical hardware appliances via ESP32 and MQTT.", stargazers_count: 1, html_url: `https://github.com/${GITHUB_USER}/IoT-Smart-Lighting-System`, homepage: "", pushed_at: "2026-11-24", languages: { Kotlin: 78932, "C++": 32234 } },
    { name: "university_assistant-", description: "A web platform that brings a student's whole academic life — subjects, assignments, exams and grades — into one place.", stargazers_count: 1, html_url: `https://github.com/${GITHUB_USER}/university_assistant-`, homepage: "", pushed_at: "2026-11-23", languages: { PHP: 257760, Twig: 181012, CSS: 63256, JavaScript: 15881 } },
    { name: "Wiener-s-Attack-RSA", description: "An educational platform and interactive calculator demonstrating Wiener's Attack on RSA cryptography.", stargazers_count: 2, html_url: `https://github.com/${GITHUB_USER}/Wiener-s-Attack-RSA`, homepage: `https://${GITHUB_USER}.github.io/Wiener-s-Attack-RSA/`, pushed_at: "2026-08-25", languages: { Python: 4306 } },
    { name: "Hashing-Algorithms", description: "A comprehensive collection of hashing algorithms implemented from scratch in C.", stargazers_count: 1, html_url: `https://github.com/${GITHUB_USER}/Hashing-Algorithms`, homepage: "", pushed_at: "2026-08-26", languages: { C: 27658 } },
    { name: "Dictionary-data-stucture", description: "An in-depth study of the Dictionary (Hash Map) data structure implemented in C.", stargazers_count: 1, html_url: `https://github.com/${GITHUB_USER}/Dictionary-data-stucture`, homepage: "", pushed_at: "2026-07-24", languages: { C: 9452, Makefile: 2905 } },
  ];

  const timeAgo = iso => {
    const d = (Date.now() - new Date(iso)) / 864e5;
    if (d < 1) return "today";
    if (d < 2) return "yesterday";
    if (d < 30) return `${Math.floor(d)} days ago`;
    if (d < 365) return `${Math.floor(d / 30)} mo ago`;
    return `${Math.floor(d / 365)} yr ago`;
  };
  const icon = {
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
    code: '<svg viewBox="0 0 24 24"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/></svg>',
    ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
  };

  const renderProjects = repos => {
    const grid = $("#projectsGrid");
    grid.innerHTML = repos.map(r => {
      const meta = CURATED[r.name] || { title: r.name.replace(/[-_]+/g, " ").trim(), cats: ["other"], label: r.language || "Project" };
      const langs = r.languages || {};
      const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
      const top = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const bar = top.map(([l, v]) => `<i style="width:${(v / total) * 100}%;background:${LANG_COLORS[l] || "#888"}"></i>`).join("");
      const legend = top.map(([l, v]) => `<span><b style="background:${LANG_COLORS[l] || "#888"}"></b>${esc(l)} ${((v / total) * 100).toFixed(0)}%</span>`).join("");
      const points = (meta.points || []).map(p => `<li>${esc(p)}</li>`).join("");
      return `
        <article class="project reveal${meta.featured ? " featured" : ""}" data-name="${esc(r.name)}" data-cats="${meta.cats.join(" ")}">
          <div class="p-top">
            <span class="p-cat">${esc(meta.label)}</span>
            <div class="p-meta"><span>${icon.star}${r.stargazers_count}</span>${r.pushed_at ? `<span class="updated">updated ${timeAgo(r.pushed_at)}</span>` : ""}</div>
          </div>
          <h3>${esc(meta.title)}</h3>
          <p>${esc(r.description || "")}</p>
          ${points ? `<ul class="p-points">${points}</ul>` : ""}
          ${top.length ? `<div class="langbar">${bar}</div><div class="langs">${legend}</div>` : ""}
          <div class="p-bottom">
            <div class="p-links">
              <a href="${r.html_url}" target="_blank" rel="noopener">${icon.code}Code</a>
              ${r.homepage ? `<a href="${r.homepage}" target="_blank" rel="noopener">${icon.ext}Live demo</a>` : ""}
            </div>
          </div>
        </article>`;
    }).join("");
    observeReveals(grid);
    bindTilt(grid);
    applyFilter(currentFilter);
  };

  let currentFilter = "all";
  const applyFilter = f => {
    currentFilter = f;
    $$("#projectsGrid .project").forEach(p => {
      const show = f === "all" || p.dataset.cats.split(" ").includes(f);
      p.classList.toggle("hide", !show);
      p.classList.toggle("featured", show && f === "all" && !!CURATED[p.dataset.name]?.featured);
    });
  };
  $$("#filters button").forEach(b => b.addEventListener("click", () => {
    $$("#filters button").forEach(x => x.classList.toggle("active", x === b));
    applyFilter(b.dataset.filter);
  }));

  const sortRepos = repos => repos.sort((a, b) => {
    const ia = ORDER.indexOf(a.name), ib = ORDER.indexOf(b.name);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return new Date(b.pushed_at) - new Date(a.pushed_at);
  });

  const loadRepos = async () => {
    const cached = store.sget("gh-repos");
    if (cached) {
      try {
        const { t, data } = JSON.parse(cached);
        if (Date.now() - t < 36e5) return data;
      } catch {}
    }
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`);
    if (!res.ok) throw new Error("GitHub " + res.status);
    const list = (await res.json()).filter(r => !r.fork && r.name !== GITHUB_USER && !/\.github\.io$/i.test(r.name));
    await Promise.all(list.map(async r => {
      try { const lr = await fetch(r.languages_url); r.languages = lr.ok ? await lr.json() : {}; }
      catch { r.languages = {}; }
    }));
    const slim = list.map(({ name, description, stargazers_count, html_url, homepage, pushed_at, language, languages }) =>
      ({ name, description, stargazers_count, html_url, homepage, pushed_at, language, languages }));
    store.sset("gh-repos", JSON.stringify({ t: Date.now(), data: slim }));
    return slim;
  };

  renderProjects(sortRepos([...FALLBACK]));
  loadRepos().then(repos => {
    if (!repos.length) return;
    renderProjects(sortRepos(repos));
    const rc = $("#repoCount");
    rc.dataset.count = repos.length;
    if (rc.textContent !== "0") rc.textContent = repos.length;
  }).catch(() => { /* offline or rate-limited: keep curated fallback */ });

  /* ---------- Tech band (marquee) ---------- */
  const DI = n => `https://cdn.jsdelivr.net/npm/devicon@2.16.0/icons/${n}.svg`;
  const ic = {
    brain: '<svg viewBox="0 0 24 24"><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/></svg>',
    net: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v5M12 12l-6 5M12 12l6 5"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    chip: '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></svg>',
  };
  // Edit these two lists to add/remove technologies.
  const BAND = [
    [
      ["Java", "java/java-original"], ["Python", "python/python-original"], ["C", "c/c-original"],
      ["C++", "cplusplus/cplusplus-original"], ["Kotlin", "kotlin/kotlin-original"], ["Machine Learning", null, "brain"],
      ["PHP", "php/php-original"], ["JavaScript", "javascript/javascript-original"], ["HTML5", "html5/html5-original"],
      ["CSS3", "css3/css3-original"], ["SQL / MySQL", "mysql/mysql-original"], ["Cryptography", null, "lock"],
    ],
    [
      ["Linux", "linux/linux-original"], ["Git", "git/git-original"], ["GitHub", "github/github-original", null, true],
      ["Docker", "docker/docker-original"], ["Android", "android/android-original"], ["Symfony", "symfony/symfony-original", null, true],
      ["Arduino / ESP32", "arduino/arduino-original"], ["MQTT", null, "net"], ["NumPy", "numpy/numpy-original"],
      ["Pandas", "pandas/pandas-original", null, true], ["scikit-learn", "scikitlearn/scikitlearn-original"],
      ["Jupyter", "jupyter/jupyter-original"], ["CTF / Security", null, "shield"], ["Networking", null, "chip"],
    ],
  ];
  BAND.forEach((items, idx) => {
    const row = $(`[data-band="${idx + 1}"]`);
    const html = items.map(([label, icon, svg, inv]) => `
      <span class="tech">${icon
        ? `<img src="${DI(icon)}" alt="" loading="lazy" width="26" height="26"${inv ? ' class="inv"' : ""}>`
        : `<span class="t-ic">${ic[svg]}</span>`}${esc(label)}</span>`).join("");
    row.innerHTML = html + html.replace(/class="tech"/g, 'class="tech" aria-hidden="true"'); // duplicated for a seamless loop
  });

  /* ---------- CV viewer ---------- */
  const CV_URL = "assets/Ahmed-Elbahi-CV.pdf";
  const cvModal = $("#cvModal"), cvFrame = $("#cvFrame");
  const openCv = async () => {
    cvModal.classList.add("open");
    cvModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (cvFrame.dataset.loaded) return;
    let ok = true;
    try { ok = (await fetch(CV_URL, { method: "HEAD" })).ok; } catch { ok = location.protocol === "file:"; }
    cvModal.classList.toggle("missing", !ok);
    if (ok) { cvFrame.src = CV_URL + "#view=FitH"; cvFrame.dataset.loaded = 1; }
  };
  const closeCv = () => {
    cvModal.classList.remove("open");
    cvModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  $$("[data-cv]").forEach(b => b.addEventListener("click", openCv));
  $("#cvClose").addEventListener("click", closeCv);
  cvModal.addEventListener("click", e => { if (e.target === cvModal) closeCv(); });
  addEventListener("keydown", e => { if (e.key === "Escape") closeCv(); });

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox");
  const openLb = () => { lb.classList.add("open"); lb.setAttribute("aria-hidden", "false"); };
  const closeLb = () => { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); };
  $("#openBoard").addEventListener("click", openLb);
  $("#openBoard2").addEventListener("click", openLb);
  $("#lbClose").addEventListener("click", closeLb);
  lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
  addEventListener("keydown", e => { if (e.key === "Escape") closeLb(); });
})();

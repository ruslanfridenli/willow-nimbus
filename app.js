(() => {
  // main.ts
  var I18N = { "en": { "tools": "Tools", "palette": "Palette", "gridlines": "Grid lines", "actions": "Actions", "clear": "\u232B Clear canvas", "png": "\u2913 Export PNG", "pencil": "Pencil", "eraser": "Eraser", "fill": "Fill", "picker": "Picker" }, "de": { "tools": "Werkzeuge", "palette": "Palette", "gridlines": "Gitterlinien", "actions": "Aktionen", "clear": "\u232B Leinwand leeren", "png": "\u2913 PNG exportieren", "pencil": "Stift", "eraser": "Radierer", "fill": "F\xFCllen", "picker": "Pipette" } };
  var lang = localStorage.getItem("lang") || "en";
  var t = (k) => I18N[lang][k] || k;
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i]").forEach((el) => el.textContent = t(el.dataset.i));
    document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
  }
  document.querySelectorAll(".lang button").forEach((b) => b.onclick = () => {
    lang = b.dataset.lang;
    localStorage.setItem("lang", lang);
    applyLang();
  });
  var cv = document.getElementById("cv");
  var ctx = cv.getContext("2d");
  var $ = (id) => document.getElementById(id);
  var N = 32;
  var PALETTE = ["#0b1020", "#4dd8ff", "#b18cff", "#ff6ec7", "#ffd479", "#8be28b", "#ff8a80", "#5eead4", "#f472b6", "#a78bfa", "#e8f6ff", "#1a2338", "#7cc7ff", "#fbbf24", "#34d399", "#f87171", "#c792ea", "#82aaff", "#fde68a", "#fb923c", "#2dd4bf", "#f472b6", "#94a3b8", "#e2e8f0"];
  var tool = "pencil";
  var color = 1;
  var px = [];
  var drawing = false;
  var lx = 0;
  var ly = 0;
  function resize() {
    const r = cv.parentElement.getBoundingClientRect();
    const s = Math.min(r.width, r.height) / N;
    cv.width = N * s * devicePixelRatio;
    cv.height = N * s * devicePixelRatio;
    cv.style.width = N * s + "px";
    cv.style.height = N * s + "px";
    cv.style.position = "absolute";
    cv.style.left = (r.width - N * s) / 2 + "px";
    cv.style.top = (r.height - N * s) / 2 + "px";
    draw();
  }
  addEventListener("resize", resize);
  resize();
  px = Array.from({ length: N * N }, () => 0);
  var TOOLS = [["pencil", "\u270F\uFE0F"], ["eraser", "\u25FB\uFE0F"], ["fill", "\u{1FAA3}"], ["picker", "\u{1F4A7}"]];
  var tw = $("tools");
  TOOLS.forEach(([k, ic]) => {
    const b = document.createElement("button");
    b.textContent = ic + " " + t(k);
    b.dataset.k = k;
    b.onclick = () => {
      tool = k;
      [...tw.children].forEach((x) => x.style.borderColor = "");
      b.style.borderColor = "var(--acc)";
    };
    tw.appendChild(b);
  });
  tw.children[0].style.borderColor = "var(--acc)";
  var pw = $("pal");
  PALETTE.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "sw" + (i === color ? " on" : "");
    d.style.background = c;
    d.onclick = () => {
      color = i;
      [...pw.children].forEach((x) => x.classList.remove("on"));
      d.classList.add("on");
    };
    pw.appendChild(d);
  });
  function cell(e) {
    const r = cv.getBoundingClientRect();
    const s = cv.width / devicePixelRatio / N;
    return [Math.floor((e.clientX - r.left) / s), Math.floor((e.clientY - r.top) / s)];
  }
  function paint(i, v) {
    if (i >= 0 && i < N * N) {
      px[i] = v;
      draw();
    }
  }
  function flood(sx, sy, v) {
    const target = px[sy * N + sx];
    if (target === v) return;
    const q = [[sx, sy]];
    const seen = /* @__PURE__ */ new Set();
    while (q.length) {
      const [x, y] = q.pop();
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      const i = y * N + x;
      if (seen.has(i) || px[i] !== target) continue;
      seen.add(i);
      px[i] = v;
      q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    draw();
  }
  function line(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      paint(y1 * N + x1, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
  cv.addEventListener("pointerdown", (e) => {
    drawing = true;
    const [x, y] = cell(e);
    lx = x;
    ly = y;
    if (tool === "fill") {
      flood(x, y, color);
    } else if (tool === "picker") {
      const i = y * N + x;
      if (px[i]) {
        color = px[i];
        [...pw.children].forEach((d, j) => d.classList.toggle("on", j === color));
      }
    } else paint(y * N + x, color);
  });
  cv.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const [x, y] = cell(e);
    if (tool === "pencil" || tool === "eraser") {
      line(lx, ly, x, y);
    }
    lx = x;
    ly = y;
  });
  addEventListener("pointerup", () => drawing = false);
  function draw() {
    const s = cv.width / devicePixelRatio / N;
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const c = px[y * N + x];
      if (c) {
        ctx.fillStyle = PALETTE[c];
        ctx.fillRect(x * s, y * s, s + 0.5, s + 0.5);
      }
    }
    if ($("gridlines").checked) {
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < N; i++) {
        ctx.moveTo(i * s, 0);
        ctx.lineTo(i * s, N * s);
        ctx.moveTo(0, i * s);
        ctx.lineTo(N * s, i * s);
      }
      ctx.stroke();
    }
  }
  $("gridlines").onchange = draw;
  $("clear").onclick = () => {
    px.fill(0);
    draw();
  };
  $("png").onclick = () => {
    const c2 = document.createElement("canvas");
    c2.width = N;
    c2.height = N;
    const x = c2.getContext("2d");
    for (let i = 0; i < N * N; i++) {
      if (px[i]) {
        x.fillStyle = PALETTE[px[i]];
        x.fillRect(i % N, i / N | 0, 1, 1);
      }
    }
    const a = document.createElement("a");
    a.download = "pixel-art-" + N + "px.png";
    a.href = c2.toDataURL();
    a.click();
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (x > 2 && x < N - 3 && y > 2 && y < N - 3 && (x + y) % 7 < 3 || x > N / 2 - 2 && x < N / 2 + 2 && y > 4 && y < N - 5) px[i] = 1 + (x + y) % 5;
  }
  draw();
  applyLang();
})();

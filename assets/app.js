/* Idioma (es/en) y versiones publicadas en las Releases de GitHub. */
(function () {
  "use strict";
  var REPO = "ChrZazueta/DinoLand3D-3DS";
  var ES = {};
  var lang = "es";
  var releases = null;

  function store(key, value) {
    try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); } catch (e) { return null; }
  }

  /* El español es el texto del HTML: se guarda al empezar para poder volver a él. */
  function remember() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) { ES[el.dataset.i18n] = el.textContent; });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) { ES[el.dataset.i18nHtml] = el.innerHTML; });
  }

  function t(key) { return lang === "en" ? (window.DINO_EN[key] || ES[key]) : ES[key]; }

  function apply(next) {
    lang = next;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) { el.innerHTML = t(el.dataset.i18nHtml); });
    document.getElementById("lang").textContent = lang === "en" ? "ES" : "EN";
    renderReleases();
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Notas de la release (markdown sencillo): listas con "-"/"*" y párrafos. */
  function notes(body) {
    var html = "", list = false;
    (body || "").split(/\r?\n/).forEach(function (line) {
      var m = line.match(/^\s*[-*]\s+(.*)/);
      var text = escapeHtml((m ? m[1] : line).replace(/^#+\s*/, "")).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");
      if (m) { if (!list) { html += "<ul>"; list = true; } html += "<li>" + text + "</li>"; return; }
      if (list) { html += "</ul>"; list = false; }
      if (text.trim()) html += "<p>" + text + "</p>";
    });
    return html + (list ? "</ul>" : "");
  }

  function renderReleases() {
    var box = document.getElementById("releases");
    if (releases === null) return;
    if (!releases.length) { box.innerHTML = '<p class="muted center">' + escapeHtml(t("news.empty")) + "</p>"; return; }
    var fmt = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-MX", { year: "numeric", month: "long", day: "numeric" });
    box.innerHTML = releases.slice(0, 5).map(function (r, i) {
      return '<article class="release"><header><h3>' + escapeHtml(r.name || r.tag_name) + "</h3>" +
        (i === 0 ? '<span class="tag">' + (lang === "en" ? "LATEST" : "ÚLTIMA") + "</span>" : "") +
        '<time datetime="' + r.published_at + '">' + fmt.format(new Date(r.published_at)) + "</time></header>" +
        notes(r.body) + "</article>";
    }).join("");
  }

  function loadReleases() {
    fetch("https://api.github.com/repos/" + REPO + "/releases?per_page=5", { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) {
        // Solo desde la 1.0: las versiones 0.x de prueba no se muestran.
        releases = (list || []).filter(function (r) { return !r.draft && !/^v?0\./.test(r.tag_name); });
        if (releases.length) document.getElementById("ver").textContent = releases[0].tag_name;
        renderReleases();
      })
      .catch(function () { releases = []; renderReleases(); });
  }

  remember();
  var saved = store("dino-lang");
  apply(saved === "en" || saved === "es" ? saved : (navigator.language || "es").toLowerCase().indexOf("es") === 0 ? "es" : "en");
  document.getElementById("lang").addEventListener("click", function () {
    var next = lang === "en" ? "es" : "en";
    store("dino-lang", next);
    apply(next);
  });
  loadReleases();
})();

(async function () {
  "use strict"; await window.QiqiyouAccount.ready;

  var config = window.QiqiyouAccount.playersLayout();
  var data = window.QiqiyouPlayers.people(window.QiqiyouAccount.publicProfiles());
  var categories = config.categories;
  var grid = document.getElementById("companion-grid");
  if (!grid) return;

  var title = document.getElementById("roster-title");
  var kicker = document.getElementById("roster-kicker");
  var count = document.getElementById("roster-count");
  var empty = document.getElementById("companion-empty");
  var dialog = document.getElementById("companion-dialog");
  var dialogClose = document.getElementById("companion-dialog-close");
  var dialogMedia = document.getElementById("companion-dialog-media");
  var dialogName = document.getElementById("companion-dialog-name");
  var dialogKicker = document.getElementById("companion-dialog-kicker");
  var dialogTags = document.getElementById("companion-dialog-tags");
  var dialogBio = document.getElementById("companion-dialog-bio");
  var dialogStatus = document.getElementById("companion-dialog-status");
  var audioWrap = document.getElementById("companion-dialog-audio");
  var audioPlayer = document.getElementById("companion-audio");
  var dialogMoments = document.getElementById("companion-dialog-moments");
  var lastTrigger = null;
  var momentObjectUrls = [];
  var activeFilter = "ge";
  var rosterMotionStarted = false;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initPageMotion() {
    if (reduceMotion) return;
    document.body.classList.add("companion-motion-ready");

    if (!window.QiqiyouNavigation) {
    var heroItems = document.querySelectorAll(".companion-copy > *");
    Array.prototype.forEach.call(heroItems, function (item, index) {
      item.animate([
        { opacity: 0, transform: "translateY(30px)", filter: "blur(7px)" },
        { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }
      ], { duration: 820, delay: 80 + index * 85, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
    });

    document.querySelectorAll(".showcase-card").forEach(function (card, index) {
      var baseRotate = index === 0 ? -3 : index === 1 ? 5 : 3;
      card.animate([
        { opacity: 0, transform: "translateY(48px) rotate(" + (baseRotate + 4) + "deg) scale(.94)" },
        { opacity: 1, transform: "translateY(0) rotate(" + baseRotate + "deg) scale(1)" }
      ], { duration: 980, delay: 260 + index * 110, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
    });
    }

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: "0px 0px -8%" });
    document.querySelectorAll(".companion-discovery, .companion-roster, .companion-cta").forEach(function (section) {
      section.classList.add("motion-section");
      revealObserver.observe(section);
    });

    var showcase = document.querySelector(".companion-showcase");
    if (showcase && window.matchMedia("(pointer:fine)").matches) {
      showcase.addEventListener("pointermove", function (event) {
        var rect = showcase.getBoundingClientRect();
        showcase.style.setProperty("--scene-x", (((event.clientX - rect.left) / rect.width) - .5).toFixed(3));
        showcase.style.setProperty("--scene-y", (((event.clientY - rect.top) / rect.height) - .5).toFixed(3));
      });
      showcase.addEventListener("pointerleave", function () {
        showcase.style.setProperty("--scene-x", "0");
        showcase.style.setProperty("--scene-y", "0");
      });
    }
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char];
    });
  }

  function mediaLabel(person) {
    var labels = [];
    if (person.video) labels.push("有视频");
    if (person.audio) labels.push("有声音");
    return labels.length ? labels.join(" · ") : "公开资料";
  }

  function applyLayout() {
    var main = document.getElementById('main-content');
    var sections = { announcements: '.companion-announcements', hero: '.companion-hero', discovery: '.companion-discovery', roster: '.companion-roster', cta: '.companion-cta' };
    config.sections.forEach(function (section) { var el = document.querySelector(sections[section.id]); el.hidden = !section.enabled; main.appendChild(el); });
    var copy = config.copy;
    document.getElementById('players-title').textContent = copy.title;
    document.querySelector('.companion-lead').textContent = copy.lead;
    document.getElementById('discovery-title').textContent = copy.discoveryTitle;
    document.querySelector('.companion-section-head > span').textContent = copy.discoveryLead;
    document.querySelector('.companion-cta h2').textContent = copy.ctaTitle;
    document.querySelector('.companion-cta p').textContent = copy.ctaLead;
    var showcase = document.querySelector('.companion-showcase');
    showcase.innerHTML = config.hero.map(function (id, index) {
      var person = data.find(function (p) { return p.accountId === id && config.hiddenIds.indexOf(id) === -1; });
      if (!person) return '';
      return '<button type="button" class="showcase-card' + (index === 0 ? ' showcase-card--lead' : '') + '" data-person-index="' + data.indexOf(person) + '"><img src="' + escapeHtml(person.cover || person.avatar) + '" alt="' + escapeHtml(person.name) + '" width="600" height="800"><span><strong>' + escapeHtml(person.name) + '</strong><small>' + escapeHtml(person.tone || person.service) + '</small></span></button>';
    }).join('');
    showcase.hidden = !showcase.children.length;
    var curator = document.querySelector('.curator-grid');
    config.categoryOrder.filter(function (key) { return key === 'ge' || key === 'yue'; }).forEach(function (key) {
      var button = curator.querySelector('[data-companion-filter="' + key + '"]');
      button.hidden = !categories[key].enabled;
      button.querySelector('strong').textContent = categories[key].title;
      var members = window.QiqiyouPlayers.selected(data, config, key);
      button.querySelector('em').textContent = members.length + ' 位精选搭子';
      button.querySelector('.curator-faces').innerHTML = members.slice(0, 3).map(function (p) { return '<img src="' + escapeHtml(p.avatar) + '" alt="' + escapeHtml(p.name) + '">'; }).join('');
      curator.appendChild(button);
    });
    curator.hidden = !categories.ge.enabled && !categories.yue.enabled;
    document.querySelector('.category-strip').innerHTML = config.categoryOrder.filter(function (key) { return categories[key].enabled; }).map(function (key, i) {
      return '<button type="button" data-companion-filter="' + key + '"><span>' + String(i + 1).padStart(2, '0') + '</span><strong>' + escapeHtml(categories[key].title) + '</strong><small>' + window.QiqiyouPlayers.selected(data, config, key).length + ' 位陪玩</small></button>';
    }).join('');
    var rosterEnabled = config.sections.find(function (s) { return s.id === 'roster'; }).enabled;
    document.querySelector('.companion-actions .button-primary').hidden = !rosterEnabled;
    if (!rosterEnabled) document.querySelectorAll('[data-companion-filter]').forEach(function (b) { b.disabled = true; });
  }

  function formatMomentDate(value) {
    return new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function clearMomentUrls() {
    momentObjectUrls.forEach(URL.revokeObjectURL);
    momentObjectUrls = [];
  }

  async function renderMoments(person) {
    if (!dialogMoments) return;
    clearMomentUrls();
    var api = window.QiqiyouAccount;
    if (!api || !person.accountId) { dialogMoments.innerHTML = '<p class="companion-moments-empty">这位陪玩暂未发布动态</p>'; return; }
    var moments = api.listMoments(person.accountId);
    if (!moments.length) { dialogMoments.innerHTML = '<p class="companion-moments-empty">这位陪玩暂未发布动态</p>'; return; }
    var rows = [];
    for (var i = 0; i < moments.length; i += 1) {
      var moment = moments[i];
      var urls = [];
      for (var j = 0; j < (moment.imageKeys || []).length; j += 1) {
        try { var blob = await api.getAsset(moment.imageKeys[j]); if (blob) { var url = URL.createObjectURL(blob); urls.push(url); momentObjectUrls.push(url); } } catch (_) { /* 单张图片损坏不影响动态 */ }
      }
      rows.push('<article class="companion-moment"><header><strong>' + escapeHtml(moment.author) + '</strong><time>' + formatMomentDate(moment.createdAt) + '</time></header>' + (moment.content ? '<p>' + escapeHtml(moment.content).replace(/\n/g, "<br>") + '</p>' : '') + (urls.length ? '<div class="companion-moment-images count-' + Math.min(urls.length, 3) + '">' + urls.map(function (url) { return '<img src="' + url + '" alt="陪玩动态图片" loading="lazy">'; }).join("") + '</div>' : '') + '</article>');
    }
    dialogMoments.innerHTML = rows.join("");
  }

  function cardMarkup(person, index) {
    var placeholderClass = person.placeholder ? " is-placeholder" : "";
    return '<button class="companion-card' + placeholderClass + '" type="button" data-person-index="' + index + '">' +
      '<span class="companion-card-image"><img src="' + escapeHtml(person.cover || person.avatar) + '" alt="' + escapeHtml(person.name) + '的公开形象" loading="lazy" decoding="async"><span class="companion-card-scan"></span></span>' +
      '<span class="companion-card-code">OP-' + String(index + 1).padStart(2, "0") + '</span>' +
      '<span class="companion-card-body"><span class="companion-card-top"><strong>' + escapeHtml(person.name) + '</strong><em>' + escapeHtml(person.level) + '</em></span>' +
      '<span class="companion-card-meta">' + escapeHtml(person.service) + '<i></i>' + escapeHtml(person.tone) + '</span>' +
      '<span class="companion-card-foot"><small>' + (person.community ? 'COMMUNITY ENTRY' : mediaLabel(person)) + '</small><b aria-hidden="true">VIEW PROFILE</b></span></span></button>';
  }

  function animateCards() {
    if (reduceMotion) return;
    Array.prototype.forEach.call(grid.children, function (card, index) {
      var entrance = card.animate([
        { opacity: 0, transform: "translateY(38px) scale(.96)", clipPath: "inset(14% 0 0 round 17px)" },
        { opacity: 1, transform: "translateY(0) scale(1)", clipPath: "inset(0 0 0 round 17px)" }
      ], { duration: 680, delay: Math.min(index * 70, 420), easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
      entrance.onfinish = function () { entrance.cancel(); };
    });
    bindCardTilt();
  }

  function animateRosterHeading() {
    if (reduceMotion) return;
    [kicker, title, count.parentElement].forEach(function (item, index) {
      item.animate([
        { opacity: 0, transform: "translateY(14px)", filter: "blur(4px)" },
        { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }
      ], { duration: 480, delay: index * 55, easing: "cubic-bezier(.16,1,.3,1)" });
    });
  }

  function bindCardTilt() {
    if (reduceMotion || !window.matchMedia("(pointer:fine)").matches) return;
    grid.querySelectorAll(".companion-card").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width;
        var y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty("--rx", ((.5 - y) * 7).toFixed(2) + "deg");
        card.style.setProperty("--ry", ((x - .5) * 9).toFixed(2) + "deg");
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", function () { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
    });
  }

  function render(filter, shouldScroll) {
    activeFilter = categories[filter] && categories[filter].enabled ? filter : config.defaultFilter;
    var selected = window.QiqiyouPlayers.selected(data, config, activeFilter);
    var category = categories[activeFilter];
    title.textContent = category.title;
    kicker.textContent = (window.COMPANION_CATEGORIES[activeFilter] || {}).kicker || "ALL COMPANIONS";
    count.textContent = selected.length;
    empty.hidden = selected.length > 0;
    grid.hidden = selected.length === 0;
    grid.innerHTML = selected.map(function (person) { return cardMarkup(person, data.indexOf(person)); }).join("");

    document.querySelectorAll("[data-companion-filter]").forEach(function (button) {
      var isActive = button.getAttribute("data-companion-filter") === activeFilter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    // The shared entrance layer owns the first render. Keep the existing filter
    // and roster interaction animations without replaying the opening twice.
    if (rosterMotionStarted || !window.QiqiyouNavigation) {
      animateCards();
      animateRosterHeading();
    } else bindCardTilt();
    rosterMotionStarted = true;
    if (shouldScroll) {
      document.getElementById("companion-roster").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }

  function openProfile(person, trigger) {
    lastTrigger = trigger;
    dialogName.textContent = person.name;
    dialogKicker.textContent = person.community ? "COMMUNITY OPERATOR" : "VERIFIED OPERATOR";
    dialogStatus.textContent = mediaLabel(person);
    dialogBio.textContent = person.bio || (person.service + "方向陪玩，" + (person.tone && person.tone !== "资料待补充" ? "声音特点为" + person.tone + "。" : "公开介绍正在补充中。"));
    dialogTags.innerHTML = [person.service, person.level, person.tone].map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");

    if (person.video) {
      dialogMedia.innerHTML = '<video src="' + escapeHtml(person.video) + '" poster="' + escapeHtml(person.cover || person.avatar) + '" controls playsinline preload="metadata"></video>';
    } else {
      dialogMedia.innerHTML = '<img src="' + escapeHtml(person.cover || person.avatar) + '" alt="' + escapeHtml(person.name) + '的公开形象">' + (person.placeholder ? '<span class="companion-placeholder-note">形象资料待补充</span>' : '');
    }

    if (person.audio) {
      audioPlayer.src = person.audio;
      audioWrap.hidden = false;
    } else {
      audioWrap.hidden = true;
      audioPlayer.removeAttribute("src");
    }
    if (dialogMoments) dialogMoments.innerHTML = '<p class="companion-moments-empty">正在载入动态…</p>';
    renderMoments(person);
    dialog.showModal();
    if (!reduceMotion) {
      dialog.animate([{ opacity: 0, transform: "translateY(18px) scale(.975)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: "cubic-bezier(.2,.8,.2,1)" });
      dialogMedia.animate([{ opacity: 0, transform: "translateX(-38px)" }, { opacity: 1, transform: "none" }], { duration: 520, easing: "cubic-bezier(.16,1,.3,1)" });
      dialog.querySelector(".companion-dialog-copy").animate([{ opacity: 0, transform: "translateX(34px)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: 60, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
    }
  }

  function closeProfile() {
    var video = dialogMedia.querySelector("video");
    if (video) video.pause();
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    clearMomentUrls();
    if (reduceMotion) {
      dialog.close();
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
      return;
    }
    var closing = dialog.animate([
      { opacity: 1, transform: "translateY(0) scale(1)" },
      { opacity: 0, transform: "translateY(14px) scale(.985)" }
    ], { duration: 220, easing: "cubic-bezier(.4,0,1,1)" });
    closing.onfinish = function () {
      dialog.close();
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    };
  }

  document.addEventListener("click", function (event) {
    var filterButton = event.target.closest("[data-companion-filter]");
    if (filterButton) render(filterButton.getAttribute("data-companion-filter"), true);

    var card = event.target.closest("[data-person-index]");
    if (card) openProfile(data[Number(card.getAttribute("data-person-index"))], card);
  });

  dialogClose.addEventListener("click", closeProfile);
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeProfile();
  });
  dialog.addEventListener("cancel", function (event) {
    event.preventDefault();
    closeProfile();
  });

  applyLayout();
  document.body.classList.remove("players-layout-loading");
  document.getElementById("players-loading").hidden = true;
  initPageMotion();
  var requested = new URLSearchParams(location.search).get("filter");
  render(requested || config.defaultFilter, Boolean(requested));
}()).catch(function (error) { document.getElementById("players-loading").hidden = true; window.QiqiyouAccountError(error); });

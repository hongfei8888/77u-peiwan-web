(function () {
  'use strict';
  var base = new URL('../', document.currentScript.src);
  var content = document.getElementById('poster-content');
  var data = window.POSTER_MENU;
  var prefix = 'qiqiyou-poster-return:';
  var title = document.getElementById('poster-page-title');
  var back = document.getElementById('poster-back');
  function local(value) { return new URL(value, base).href; }
  function detail(kind, id) { return local('price/detail.html?' + kind + '=' + encodeURIComponent(id)); }
  function element(tag, className, text) { var e = document.createElement(tag); if (className) e.className = className; if (text) e.textContent = text; return e; }
  function plainClick(event) { return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey; }
  function isMenuURL(value) {
    try {
      var u = new URL(value);
      return u.origin === base.origin && ['', 'index.html', 'home.html', 'activities.html', 'menu.html', 'players.html', 'reviews.html', 'contact.html', 'price/detail.html'].some(function (path) {
        return u.pathname === base.pathname + path;
      });
    } catch (_) { return false; }
  }
  function sameRoute(first, second) {
    try {
      var a = new URL(first), b = new URL(second);
      if (a.origin !== b.origin || a.pathname !== b.pathname) return false;
      // A footer link to the currently open poster must not create a return loop.
      if (a.pathname === base.pathname + 'price/detail.html') {
        return a.searchParams.get('category') === b.searchParams.get('category') && a.searchParams.get('item') === b.searchParams.get('item');
      }
      return a.search === b.search;
    } catch (_) { return false; }
  }
  function validReturn(value) {
    return isMenuURL(value) && !sameRoute(value, location.href);
  }
  function returnLabel(value) {
    var u = new URL(value), path = u.pathname.slice(base.pathname.length);
    var labels = { '': '玩法菜单', 'index.html': '玩法菜单', 'home.html': '首页', 'activities.html': '活动', 'menu.html': '玩法菜单', 'players.html': '陪玩社区', 'community.html': '交流社区', 'reviews.html': '好评', 'contact.html': '联系我们' };
    return '← 返回' + (labels[path] || (u.searchParams.has('category') ? '分类' : '上一页'));
  }
  // Each history entry stores its own position. Session storage carries only the
  // next same-tab navigation, so new tabs do not inherit another tab's back target.
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[data-menu-link]');
    if (!link || !plainClick(event) || !isMenuURL(link.href)) return;
    if (sameRoute(link.href, location.href)) { event.preventDefault(); return; }
    var state = Object.assign({}, history.state, { posterPosition: { y: window.scrollY, focus: link.id } });
    history.replaceState(state, '', location.href);
    try { sessionStorage.setItem(prefix + link.href, JSON.stringify({ from: location.href, at: Date.now() })); } catch (_) {}
  });
  try {
    var pendingKey = prefix + location.href;
    var pending = JSON.parse(sessionStorage.getItem(pendingKey));
    sessionStorage.removeItem(pendingKey);
    if (pending && Date.now() - pending.at >= 0 && Date.now() - pending.at < 30000 && validReturn(pending.from)) history.replaceState(Object.assign({}, history.state, { posterFrom: pending.from }), '', location.href);
  } catch (_) {}
  function restore(event) {
    var navigation = performance.getEntriesByType('navigation')[0];
    // A saved click position belongs to Back/Forward, never to a reload.
    if (!(event && event.persisted) && (!navigation || navigation.type !== 'back_forward')) return;
    var position = history.state && history.state.posterPosition;
    if (!position) return;
    var attempts = 0;
    function ready() {
      var loader = document.getElementById('loader');
      if (loader && getComputedStyle(loader).display !== 'none' && attempts++ < 100) { setTimeout(ready, 50); return; }
      requestAnimationFrame(function () {
        if (window.lenis) window.lenis.scrollTo(position.y, { immediate: true, force: true });
        else window.scrollTo(0, position.y);
        var focus = document.getElementById(position.focus);
        if (focus) focus.focus({ preventScroll: true });
      });
    }
    ready();
  }
  window.addEventListener('pageshow', restore);
  if (!content || !data) return;
  var params = new URLSearchParams(location.search);
  var category = data.categories.find(function (c) { return c.id === params.get('category'); });
  var item = data.entries.find(function (e) { return e.id === params.get('item'); });
  var fallback = local('menu.html#menu');
  function setTitle(value) { title.textContent = value; document.title = value + ' · 柒柒游电竞'; }
  function card(entry) {
    var link = element('a', 'poster-menu-card'); link.href = detail('item', entry.id); link.dataset.menuLink = ''; link.id = 'menu-link-' + entry.id;
    if (entry.icon) { var img = element('img', 'poster-menu-icon'); img.src = local(entry.icon.src); img.alt = entry.icon.alt || ''; img.width = entry.icon.width; img.height = entry.icon.height; img.loading = 'lazy'; img.decoding = 'async'; link.appendChild(img); }
    link.appendChild(element('span', 'poster-menu-name', entry.name));
    return link;
  }
  if (category && !params.has('item')) {
    setTitle(category.name + ' · 服务分区'); content.classList.add('poster-category-view');
    var grid = element('div', 'poster-menu-grid poster-service-grid');
    category.entries.forEach(function (id) { grid.appendChild(card(data.entries.find(function (e) { return e.id === id; }))); });
    content.appendChild(grid);
  } else if (item && !params.has('category')) {
    var parent = data.categories.find(function (c) { return c.id === item.parent; });
    var parentName = parent && ({ pc: '端游', mobile: '手游' }[parent.id] || parent.name);
    setTitle((parentName ? parentName + ' · ' : '') + item.name);
    if (parent) { fallback = detail('category', parent.id); back.textContent = '← 返回分类'; }
    var sheet = element('section', 'poster-sheet');
    var toolbar = element('div', 'poster-sheet-toolbar');
    var sheetTitle = element('h2', 'poster-sheet-title'); sheetTitle.id = 'poster-sheet-title';
    toolbar.appendChild(sheetTitle); sheet.appendChild(toolbar);
    var status = element('p', 'poster-loading'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    sheet.appendChild(status);
    var imageSlot = element('div', 'poster-image-slot'); sheet.appendChild(imageSlot);
    var error = element('div', 'poster-error'); error.hidden = true;
    error.appendChild(element('p', '', '海报暂时加载失败，请重试。'));
    var retry = element('button', 'poster-retry', '重新加载'); retry.type = 'button'; error.appendChild(retry); sheet.appendChild(error);
    var tabs, current = 0, request = 0;
    function show(index, updateURL) {
      current = index;
      var target = item.posters[index], asset = data.posters.find(function (p) { return p.id === target.id; });
      var ticket = ++request;
      var img = element('img', 'poster-image'); img.width = asset.width; img.height = asset.height; img.alt = title.textContent + ' — ' + target.label + '完整海报'; img.decoding = 'async';
      sheetTitle.textContent = target.label; error.hidden = true; status.textContent = '正在加载海报…';
      imageSlot.replaceChildren(img);
      img.onload = function () { if (ticket !== request) return; status.textContent = ''; };
      img.onerror = function () { if (ticket !== request) return; img.hidden = true; status.textContent = ''; error.hidden = false; };
      img.src = local(asset.displaySrc || asset.src);
      if (tabs) {
        tabs.querySelectorAll('button').forEach(function (b, i) { b.setAttribute('aria-selected', String(i === index)); b.tabIndex = i === index ? 0 : -1; });
        sheet.setAttribute('aria-labelledby', 'poster-tab-' + index);
      }
      if (updateURL) {
        var next = new URL(location.href); next.searchParams.set('tab', String(index + 1));
        history.replaceState(Object.assign({}, history.state, { posterPosition: null }), '', next);
      }
    }
    if (item.posters.length > 1) {
      tabs = element('div', 'poster-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', item.name + '海报');
      sheet.id = 'poster-tabpanel'; sheet.setAttribute('role', 'tabpanel');
      item.posters.forEach(function (p, index) {
        var b = element('button', 'poster-tab', p.label); b.type = 'button'; b.id = 'poster-tab-' + index; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', sheet.id);
        b.addEventListener('click', function () { show(index, true); });
        b.addEventListener('keydown', function (event) {
          var target = index;
          if (event.key === 'ArrowRight') target = (index + 1) % item.posters.length;
          else if (event.key === 'ArrowLeft') target = (index - 1 + item.posters.length) % item.posters.length;
          else if (event.key === 'Home') target = 0;
          else if (event.key === 'End') target = item.posters.length - 1;
          else return;
          event.preventDefault(); show(target, true); tabs.children[target].focus({ preventScroll: true });
        });
        tabs.appendChild(b);
      });
      content.appendChild(tabs);
    } else sheet.setAttribute('aria-labelledby', sheetTitle.id);
    content.appendChild(sheet);
    retry.addEventListener('click', function () { show(current, false); });
    var tabNumber = Number(params.get('tab') || 1);
    show(Number.isInteger(tabNumber) && tabNumber > 0 && tabNumber <= item.posters.length ? tabNumber - 1 : 0, false);
  } else {
    setTitle('未找到这个玩法');
    var invalid = element('div', 'poster-invalid'); invalid.appendChild(element('p', '', '这个链接暂时不可用，请返回菜单选择玩法。'));
    var home = element('a', 'poster-back', '返回玩法菜单'); home.href = fallback; invalid.appendChild(home); content.appendChild(invalid);
  }
  var source = history.state && history.state.posterFrom;
  back.href = validReturn(source) ? source : fallback;
  back.textContent = returnLabel(back.href);
  back.addEventListener('click', function (event) {
    if (plainClick(event) && history.state && validReturn(history.state.posterFrom) && history.length > 1) { event.preventDefault(); history.back(); }
  });
})();

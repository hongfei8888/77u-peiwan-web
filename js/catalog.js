/* Text-first catalog. Data is generated from content/77u-catalog.json. */
(function () {
  'use strict';
  var data = window.MENU_CATALOG;
  var section = document.getElementById('menu');
  if (!data || !section) return;
  var list = document.getElementById('menu-catalog');
  var browse = document.getElementById('menu-browse');
  var tabs = document.getElementById('menu-tabs');
  var search = document.getElementById('menu-search-input');
  var clear = document.getElementById('menu-search-clear');
  var empty = document.getElementById('menu-empty');
  var count = document.getElementById('menu-result-count');
  var panel = document.getElementById('menu-panel');
  var body = document.getElementById('menu-detail-body');
  var title = document.getElementById('menu-detail-title');
  var eyebrow = document.getElementById('menu-detail-eyebrow');
  var back = document.getElementById('menu-detail-back');
  var products = data.products.filter(function (p) { return p.kind !== 'utility'; });
  var category = 'all';
  var returnY = 0;
  var returnFocus = null;
  var platformNames = { pc: '三角洲端游', mobile: '三角洲手游' };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(className, text) {
    var node = el('button', className, text);
    node.type = 'button';
    return node;
  }
  function normalize(value) { return String(value).normalize('NFKC').toLowerCase().replace(/\s+/g, ''); }
  function searchable(p) {
    return normalize(JSON.stringify([p.name, p.group, p.summary, p.keywords, p.description, p.completion, p.notices, p.priceTables, p.sections, platformNames[p.platform]]));
  }
  var searchIndex = new Map(products.map(function (p) { return [p.id, searchable(p)]; }));
  function refresh() {
    requestAnimationFrame(function () {
      if (window.lenis) window.lenis.resize();
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  }
  function scrollToY(y) {
    if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }
  function paragraphs(parent, values) {
    (values || []).forEach(function (value) { parent.appendChild(el('p', '', value)); });
  }
  function bullets(parent, values) {
    if (!values || !values.length) return;
    var ul = el('ul', 'catalog-rules');
    values.forEach(function (value) { ul.appendChild(el('li', '', value)); });
    parent.appendChild(ul);
  }
  function table(parent, spec) {
    if (!spec || !spec.rows || !spec.rows.length) return;
    var t = el('table', 'catalog-table');
    if (spec.title) t.appendChild(el('caption', '', spec.title));
    var head = el('thead');
    var row = el('tr');
    spec.columns.forEach(function (label) {
      var cell = el('th', '', label); cell.scope = 'col'; row.appendChild(cell);
    });
    head.appendChild(row); t.appendChild(head);
    var tbody = el('tbody');
    spec.rows.forEach(function (values) {
      var tr = el('tr');
      values.forEach(function (value, index) {
        var td = el(index === 0 ? 'th' : 'td');
        if (index === 0) td.scope = 'row';
        td.dataset.label = spec.columns[index];
        td.appendChild(el('span', 'catalog-cell-value', value));
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    t.appendChild(tbody); parent.appendChild(t);
  }
  function detailSection(heading, className) {
    var block = el('section', 'catalog-detail-section ' + (className || ''));
    block.appendChild(el('h4', '', heading)); body.appendChild(block); return block;
  }
  function openProduct(p, trigger) {
    if (panel.hidden) { returnY = window.scrollY; returnFocus = trigger; }
    body.replaceChildren();
    title.textContent = p.name;
    eyebrow.textContent = [platformNames[p.platform] || (p.kind === 'utility' ? '服务说明' : (data.categories.find(function (c) { return c.id === p.category; }) || {}).name), p.group].filter(function (v, i, a) { return v && a.indexOf(v) === i; }).join(' · ');
    if (p.summary) body.appendChild(el('p', 'catalog-detail-summary', p.summary));
    if (p.scope) body.appendChild(el('p', 'catalog-detail-scope', p.scope));
    if (p.priceTables && p.priceTables.length) {
      var prices = detailSection(p.kind === 'utility' ? '充值金额与权益' : '价格与档位', 'catalog-prices');
      p.priceTables.forEach(function (spec) { table(prices, spec.title === '价格与档位' ? Object.assign({}, spec, {title: ''}) : spec); });
    }
    if ((p.description && p.description.length) || (p.sections && p.sections.length)) {
      var play = detailSection(p.kind === 'utility' ? '详细说明' : '玩法说明');
      paragraphs(play, p.description);
      (p.sections || []).forEach(function (s) {
        var sub = el('div', 'catalog-rule-group');
        if (s.title) sub.appendChild(el('h5', '', s.title));
        paragraphs(sub, s.paragraphs); bullets(sub, s.bullets); table(sub, s.table); play.appendChild(sub);
        if (s.grid) {
          var pattern = el('div', 'catalog-pattern');
          pattern.style.setProperty('--pattern-columns', s.grid.columns);
          pattern.setAttribute('role', 'img');
          pattern.setAttribute('aria-label', s.title + '，共 ' + s.grid.rows.flat().filter(Boolean).length + ' 个目标格，完整图示可查看原海报');
          s.grid.rows.forEach(function (row) { row.forEach(function (filled) { pattern.appendChild(el('span', filled ? 'filled' : '')); }); });
          sub.appendChild(pattern);
        }
      });
    }
    if (p.completion && p.completion.length) bullets(detailSection('完成条件', 'catalog-completion'), p.completion);
    if (p.notices && p.notices.length) bullets(detailSection('专项须知', 'catalog-notices'), p.notices);
    if (p.kind !== 'utility') {
      var related = el('div', 'catalog-related');
      related.appendChild(el('span', '', '通用服务说明'));
      ['order-notices', 'seven-guarantees'].forEach(function (id) {
        var target = data.products.find(function (item) { return item.id === id; });
        if (!target) return;
        var b = button('catalog-text-button', target.name);
        b.addEventListener('click', function () { openProduct(target, trigger); }); related.appendChild(b);
      });
      body.appendChild(related);
    }
    if (p.image) {
      var source = detailSection('查看原海报', 'catalog-source');
      var view = button('catalog-poster-button', '打开原海报 ↗');
      view.dataset.poster = p.image;
      view.addEventListener('click', function () {
        window.QiqiyouLightbox.open({ src: p.image, alt: p.name + '原海报' }, true);
      });
      source.appendChild(view);
      source.appendChild(el('p', 'catalog-source-note', '价格、单位和规则保留原海报口径。R 为价格单位，W 为万游戏币；具体适用范围见上方详情。'));
    }
    browse.hidden = true; panel.hidden = false; panel.classList.add('open'); panel.dataset.productId = p.id;
    refresh();
    requestAnimationFrame(function () {
      scrollToY(panel.getBoundingClientRect().top + window.scrollY - (document.getElementById('nav').offsetHeight + 22));
      title.focus({ preventScroll: true });
    });
  }
  function closeProduct() {
    panel.hidden = true; panel.classList.remove('open'); browse.hidden = false;
    refresh();
    requestAnimationFrame(function () {
      scrollToY(returnY);
      if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    });
  }
  back.addEventListener('click', closeProduct);
  data.products.filter(function (p) { return p.kind === 'utility'; }).forEach(function (p) {
    var b = button('menu-utility-btn', p.name); b.dataset.productId = p.id;
    b.addEventListener('click', function () { openProduct(p, b); });
    document.getElementById('menu-utilities').appendChild(b);
  });
  data.categories.forEach(function (c, i) {
    var b = button('menu-category-tab' + (c.id === category ? ' active' : ''), c.name);
    b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(c.id === category));
    b.setAttribute('aria-controls', 'menu-catalog'); b.id = 'catalog-tab-' + c.id;
    b.dataset.category = c.id; b.tabIndex = c.id === category ? 0 : -1;
    b.addEventListener('click', function () { category = c.id; renderList(); });
    b.addEventListener('keydown', function (event) {
      var next = i;
      if (event.key === 'ArrowRight') next = (i + 1) % data.categories.length;
      else if (event.key === 'ArrowLeft') next = (i + data.categories.length - 1) % data.categories.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = data.categories.length - 1;
      else return;
      event.preventDefault(); tabs.children[next].click(); tabs.children[next].focus();
    });
    tabs.appendChild(b);
  });
  function renderList() {
    var query = normalize(search.value);
    var matches = products.filter(function (p) { return (category === 'all' || p.category === category) && (!query || searchIndex.get(p.id).includes(query)); });
    list.replaceChildren();
    tabs.querySelectorAll('button').forEach(function (b) {
      var selected = b.dataset.category === category;
      b.classList.toggle('active', selected); b.setAttribute('aria-selected', String(selected)); b.tabIndex = selected ? 0 : -1;
    });
    list.setAttribute('aria-labelledby', 'catalog-tab-' + category);
    data.categories.filter(function (c) { return c.id !== 'all'; }).forEach(function (c) {
      var entries = matches.filter(function (p) { return p.category === c.id; });
      if (!entries.length) return;
      var cat = el('section', 'catalog-category');
      cat.appendChild(el('h3', '', c.name));
      var groups = new Map();
      entries.forEach(function (p) { var group = p.group || c.name; if (!groups.has(group)) groups.set(group, []); groups.get(group).push(p); });
      groups.forEach(function (items, group) {
        var block = el('div', 'catalog-group');
        if (group !== c.name) block.appendChild(el('h4', '', group));
        var grid = el('div', 'menu-entry-grid');
        items.forEach(function (p) {
          var b = button('menu-entry'); b.dataset.productId = p.id; b.dataset.platform = p.platform;
          b.appendChild(el('span', 'menu-entry-name', p.name));
          if (p.summary) b.appendChild(el('span', 'catalog-entry-summary', p.summary));
          var arrow = el('span', 'menu-entry-arrow', '↗'); arrow.setAttribute('aria-hidden', 'true'); b.appendChild(arrow);
          b.addEventListener('click', function () { openProduct(p, b); }); grid.appendChild(b);
        });
        block.appendChild(grid); cat.appendChild(block);
      });
      list.appendChild(cat);
    });
    clear.hidden = !search.value; empty.hidden = matches.length > 0;
    count.textContent = '共 ' + matches.length + ' 项' + (query ? '搜索结果' : '可选玩法与服务');
    refresh();
  }
  search.addEventListener('input', renderList);
  clear.addEventListener('click', function () { search.value = ''; renderList(); search.focus(); });
  document.getElementById('menu-empty-reset').addEventListener('click', function () { search.value = ''; category = 'all'; renderList(); search.focus(); });
  renderList();
})();

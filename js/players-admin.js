(async function () {
  'use strict';
  var api = window.QiqiyouAccount, $ = function (id) { return document.getElementById(id); };
  var layout, people = [], original = '', active = 'ge', busy = false;
  var sectionLabels = { announcements: '公共公告', hero: '首屏介绍与陪玩展示', discovery: '严选推荐与分类入口', roster: '陪玩卡片列表', cta: '客服匹配引导' };
  var copyLabels = { title: '首屏标题（可换行）', lead: '首屏介绍', discoveryTitle: '推荐区标题', discoveryLead: '推荐区说明', ctaTitle: '客服引导标题（可换行）', ctaLead: '客服引导提示' };
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function dirty() { return !!layout && JSON.stringify(layout) !== original; }
  function status(message, error) { $('pa-status').textContent = message; $('pa-status').classList.toggle('is-error', !!error); }
  function mark() {
    var changed = dirty();
    $('pa-change-state').textContent = changed ? '有未保存的修改' : '所有修改已保存';
    document.querySelector('.pa-savebar').classList.toggle('is-dirty', changed);
    $('pa-save').disabled = busy || !changed;
    var hidden = people.filter(function (p) { return layout.hiddenIds.indexOf(p.accountId) !== -1; }).length;
    $('pa-summary').textContent = people.length + ' 位已认证陪玩 · ' + (people.length - hidden) + ' 位展示 · ' + hidden + ' 位隐藏';
  }
  function person(id) { return people.find(function (p) { return p.accountId === id; }); }
  function options(selected, allowEmpty) {
    var out = allowEmpty ? '<option value="">留空此位置</option>' : '';
    out += people.map(function (p) { return '<option value="' + esc(p.accountId) + '"' + (selected === p.accountId ? ' selected' : '') + '>' + esc(p.name) + (layout.hiddenIds.indexOf(p.accountId) !== -1 ? '（全页隐藏）' : '') + '</option>'; }).join('');
    if (selected && !person(selected)) out += '<option selected value="' + esc(selected) + '">原陪玩暂未公开（不会展示）</option>';
    return out;
  }
  function renderHero() {
    $('pa-hero').innerHTML = layout.hero.map(function (id, index) {
      var p = person(id), hidden = layout.hiddenIds.indexOf(id) !== -1;
      return '<div class="pa-slot"><div class="pa-slot-preview">' + (p && !hidden ? '<img src="' + esc(p.cover || p.avatar) + '" alt="' + esc(p.name) + '">' : '<span>' + (hidden ? '已全页隐藏' : '不展示') + '</span>') + '<b>' + (index === 0 ? '主展示位' : '展示位 ' + (index + 1)) + '</b></div><label>选择陪玩<select data-hero="' + index + '">' + options(id, true) + '</select></label></div>';
    }).join('');
  }
  function renderSections() {
    $('pa-sections').innerHTML = layout.sections.map(function (s, i) { return '<div class="pa-section"><span>' + String(i + 1).padStart(2, '0') + '</span><label><input data-section="' + s.id + '" type="checkbox"' + (s.enabled ? ' checked' : '') + '>' + sectionLabels[s.id] + '</label><button type="button" data-section-move="' + i + '" data-delta="-1" aria-label="上移' + sectionLabels[s.id] + '"' + (i === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-section-move="' + i + '" data-delta="1" aria-label="下移' + sectionLabels[s.id] + '"' + (i === layout.sections.length - 1 ? ' disabled' : '') + '>↓</button></div>'; }).join('');
  }
  function renderTabs() {
    $('pa-tabs').innerHTML = layout.categoryOrder.map(function (key) {
      var c = layout.categories[key];
      return '<button type="button" data-tab="' + key + '" aria-pressed="' + (key === active) + '" class="' + (c.enabled ? '' : 'is-off') + '">' + esc(c.title) + '<small>' + (c.enabled ? window.QiqiyouPlayers.selected(people, layout, key).length : '已关闭') + '</small></button>';
    }).join('');
    $('pa-default').innerHTML = layout.categoryOrder.filter(function (k) { return layout.categories[k].enabled; }).map(function (key) { return '<option value="' + key + '"' + (layout.defaultFilter === key ? ' selected' : '') + '>' + esc(layout.categories[key].title) + '</option>'; }).join('');
    $('pa-category-up').disabled = layout.categoryOrder.indexOf(active) === 0;
    $('pa-category-down').disabled = layout.categoryOrder.indexOf(active) === layout.categoryOrder.length - 1;
  }
  function renderSelected() {
    var ids = layout.categories[active].members.slice();
    if (active === 'all') people.forEach(function (p) { if (ids.indexOf(p.accountId) === -1) ids.push(p.accountId); });
    $('pa-selected-count').textContent = ids.length;
    $('pa-all-note').hidden = active !== 'all';
    $('pa-selected').innerHTML = ids.length ? ids.map(function (id, i) {
      var p = person(id), hidden = layout.hiddenIds.indexOf(id) !== -1;
      return '<li class="pa-person' + (hidden || !p ? ' is-hidden' : '') + '"><span class="pa-number">' + String(i + 1).padStart(2, '0') + '</span>' + (p ? '<img src="' + esc(p.avatar) + '" alt="">' : '') + '<div><strong>' + esc(p ? p.name : '原陪玩暂未公开') + '</strong><small class="' + (hidden ? 'pa-hidden-label' : '') + '">' + (hidden ? '全页隐藏 · 位置保留' : p ? esc(p.service || '公开陪玩') : '当前不展示，可移除') + '</small></div><div class="pa-order"><button type="button" data-person-move="' + esc(id) + '" data-delta="-1" aria-label="上移' + esc(p ? p.name : '陪玩') + '"' + (i === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-person-move="' + esc(id) + '" data-delta="1" aria-label="下移' + esc(p ? p.name : '陪玩') + '"' + (i === ids.length - 1 ? ' disabled' : '') + '>↓</button>' + (active !== 'all' ? '<button type="button" class="pa-remove" data-remove="' + esc(id) + '">移除</button>' : '') + '</div></li>';
    }).join('') : '<li class="pa-empty">此分类还没有陪玩，从右侧陪玩库添加。</li>';
  }
  function renderPool() {
    var term = $('pa-search').value.trim().toLowerCase(), members = layout.categories[active].members;
    var found = people.filter(function (p) { return !term || [p.name, p.service, p.tone].join(' ').toLowerCase().indexOf(term) !== -1; });
    $('pa-pool').innerHTML = found.length ? found.map(function (p) {
      var hidden = layout.hiddenIds.indexOf(p.accountId) !== -1, added = active === 'all' || members.indexOf(p.accountId) !== -1;
      return '<article class="pa-person' + (hidden ? ' is-hidden' : '') + '"><img src="' + esc(p.avatar) + '" alt=""><div><strong>' + esc(p.name) + '</strong><small>' + esc([p.service, p.tone].filter(Boolean).join(' · ')) + '</small></div><div class="pa-pool-actions"><button type="button" data-add="' + esc(p.accountId) + '"' + (added ? ' disabled' : '') + '>' + (added ? '已在本分类' : '＋ 加入分类') + '</button><button type="button" class="pa-hide" data-hide="' + esc(p.accountId) + '" aria-pressed="' + hidden + '">' + (hidden ? '恢复展示' : '全页隐藏') + '</button></div></article>';
    }).join('') : '<p class="pa-empty">没有找到匹配的陪玩。</p>';
  }
  function renderCategory() {
    $('pa-category-title').value = layout.categories[active].title;
    $('pa-category-enabled').checked = layout.categories[active].enabled;
    renderTabs(); renderSelected(); renderPool();
  }
  function load() {
    layout = clone(api.playersLayout()); original = JSON.stringify(layout);
    people = window.QiqiyouPlayers.people(api.publicProfiles());
    $('pa-gate').hidden = true; $('pa-editor').hidden = false; $('pa-logout').hidden = false;
    $('pa-identity').textContent = api.current().username;
    $('pa-copy-fields').innerHTML = Object.keys(copyLabels).map(function (key) { return '<label>' + copyLabels[key] + '<textarea data-copy="' + key + '" rows="2" maxlength="250" required>' + esc(layout.copy[key]) + '</textarea></label>'; }).join('');
    renderHero(); renderSections(); renderCategory(); mark();
    status('配置已载入。选择陪玩、调整位置后，点击“保存展示配置”。');
  }
  function move(list, index, delta) { var next = index + delta; if (index < 0 || next < 0 || next >= list.length) return; var item = list.splice(index, 1)[0]; list.splice(next, 0, item); }
  $('pa-editor').addEventListener('click', function (event) {
    if (busy) return;
    var b = event.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.tab) { active = b.dataset.tab; renderCategory(); return; }
    if (b.hasAttribute('data-section-move')) { move(layout.sections, Number(b.dataset.sectionMove), Number(b.dataset.delta)); renderSections(); }
    else if (b.dataset.personMove) {
      var list = layout.categories[active].members;
      if (active === 'all') people.forEach(function (p) { if (list.indexOf(p.accountId) === -1) list.push(p.accountId); });
      move(list, list.indexOf(b.dataset.personMove), Number(b.dataset.delta)); renderSelected();
    } else if (b.dataset.add) { layout.categories[active].members.push(b.dataset.add); renderCategory(); }
    else if (b.dataset.remove) { var members = layout.categories[active].members; members.splice(members.indexOf(b.dataset.remove), 1); renderCategory(); }
    else if (b.dataset.hide) {
      var index = layout.hiddenIds.indexOf(b.dataset.hide);
      if (index === -1) layout.hiddenIds.push(b.dataset.hide); else layout.hiddenIds.splice(index, 1);
      renderHero(); renderCategory();
    } else if (b.id === 'pa-category-up' || b.id === 'pa-category-down') { move(layout.categoryOrder, layout.categoryOrder.indexOf(active), b.id === 'pa-category-up' ? -1 : 1); renderTabs(); }
    mark();
  });
  $('pa-editor').addEventListener('change', function (event) {
    if (busy) return;
    var el = event.target;
    if (el.hasAttribute('data-hero')) {
      var i = Number(el.dataset.hero), other = layout.hero.indexOf(el.value);
      if (el.value && other !== -1 && other !== i) { status('这位陪玩已经在首屏其他位置，请先留空原位置。', true); renderHero(); return; }
      layout.hero[i] = el.value; renderHero();
    } else if (el.dataset.section) layout.sections.find(function (s) { return s.id === el.dataset.section; }).enabled = el.checked;
    else if (el.id === 'pa-category-enabled') {
      if (!el.checked && layout.categoryOrder.filter(function (k) { return layout.categories[k].enabled; }).length === 1) { el.checked = true; status('请至少保留一个展示分类。', true); return; }
      layout.categories[active].enabled = el.checked;
      if (!el.checked && layout.defaultFilter === active) layout.defaultFilter = layout.categoryOrder.find(function (k) { return layout.categories[k].enabled; });
      renderTabs();
    } else if (el.id === 'pa-default') layout.defaultFilter = el.value;
    mark();
  });
  $('pa-editor').addEventListener('input', function (event) {
    var el = event.target;
    if (el.id === 'pa-search') { renderPool(); return; }
    if (el.dataset.copy) layout.copy[el.dataset.copy] = el.value;
    if (el.id === 'pa-category-title') { layout.categories[active].title = el.value; renderTabs(); }
    mark();
  });
  $('pa-editor').onsubmit = async function (event) {
    event.preventDefault(); if (busy || !dirty()) return;
    if (Object.keys(layout.categories).some(function (k) { return !layout.categories[k].title.trim(); })) { status('请填写所有分类的名称。', true); return; }
    busy = true; $('pa-fields').disabled = true; $('pa-reload').disabled = true; mark(); status('正在保存展示配置…');
    try { await api.savePlayersLayout(layout, layout.version); load(); status('展示配置已保存。访客刷新陪玩社区即可看到更新。'); }
    catch (error) { status(error.message, true); }
    finally { busy = false; $('pa-fields').disabled = false; $('pa-reload').disabled = false; mark(); }
  };
  $('pa-reload').onclick = async function () {
    if (dirty() && !confirm('重新载入会放弃当前未保存的修改，继续吗？')) return;
    busy = true; $('pa-fields').disabled = true; $('pa-reload').disabled = true; mark();
    try { await api.refresh(); if (!api.isAdmin()) { location.reload(); return; } load(); } catch (e) { status(e.message, true); }
    finally { busy = false; $('pa-fields').disabled = false; $('pa-reload').disabled = false; mark(); }
  };
  $('pa-login').onsubmit = async function (event) {
    event.preventDefault(); var form = event.currentTarget, b = form.querySelector('button'), f = new FormData(form); b.disabled = true;
    try { await api.login(f.get('username'), f.get('password')); if (!api.isAdmin()) throw Error('需要管理员账号才能管理展示'); form.reset(); load(); }
    catch (e) { status(e.message, true); } finally { b.disabled = false; }
  };
  $('pa-logout').onclick = async function () { if (dirty() && !confirm('有未保存的修改，仍要退出吗？')) return; await api.logout(); original = JSON.stringify(layout); location.reload(); };
  window.addEventListener('beforeunload', function (event) { if (dirty()) { event.preventDefault(); event.returnValue = ''; } });
  await api.ready;
  if (api.isAdmin()) load(); else { $('pa-gate').hidden = false; $('pa-identity').textContent = '仅管理员可操作'; status('请先登录管理员账号。'); }
}()).catch(window.QiqiyouAccountError);

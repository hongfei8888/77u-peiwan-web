(function () {
  'use strict';
  var state = {}, csrf = '';
  var questions = { first_game: '你最早长期玩的一款游戏是？', childhood_name: '你小时候最熟悉的昵称是？', favorite_role: '你最喜欢的游戏角色是？', memorable_place: '你最难忘的一座城市是？' };
  async function request(action, data) {
    var response = await fetch('api/community.php?action=' + action, {
      method: data ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: data ? { 'X-CSRF-Token': csrf, ...(data instanceof FormData ? {} : { 'Content-Type': 'application/json' }) } : {},
      body: data ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined
    });
    var body;
    try { body = await response.json(); } catch (_) { throw Error('账号服务未启动，请检查网站PHP配置'); }
    if (!response.ok) throw Error(body.error || '请求失败，请重试');
    if (body.snapshot) update(body.snapshot);
    return body;
  }
  function update(next) { state = next; csrf = next.csrf; }
  async function refresh() { update(await request('snapshot')); }
  async function change(action, data) { var result = await request(action, data); return result.value; }
  function current() { return state.current || null; }
  function getProfile(id) { return (state.profiles || {})[id] || (state.publicProfiles || []).find(function (p) { return p.accountId === id; }) || {}; }
  function listPosts() { return state.posts || []; }
  function forumRead(key, fallback) {
    var result = {};
    if (key === 'qiqiyou_forum_posts_v1') return listPosts();
    if (key === 'qiqiyou_forum_replies_v1') { listPosts().forEach(function (p) { result[p.id] = p.replyItems || []; }); return result; }
    if (key === 'qiqiyou_forum_likes_v1') { listPosts().forEach(function (p) { result[p.id] = p.likedBy || []; }); return result; }
    return fallback;
  }
  var ready = refresh();
  ready.catch(function () {});
  window.QiqiyouAccount = Object.freeze({
    ready: ready, refresh: refresh, current: current, isAdmin: function () { return !!current() && current().role === 'admin'; },
    login: async function (username, password) { await request('login', { username: username, password: password }); return current(); },
    register: async function (username, password, options) { await request('register', Object.assign({ username: username, password: password }, options)); return current(); },
    logout: async function () { await request('logout', {}); state.current = null; },
    changePassword: async function (oldPassword, newPassword) { await change('password', { oldPassword: oldPassword, newPassword: newPassword }); return current(); },
    createCaptcha: function () { return request('captcha'); },
    securityQuestions: function () { return Object.assign({}, questions); },
    getSecurityQuestion: async function (username) { var q = await request('question', { username: username }); return { id: q.id, question: questions[q.id] }; },
    resetPassword: function (username, answer, password) { return request('recover', { username: username, answer: answer, password: password }); },
    setSecurityQuestion: function (question, answer, password) { return change('security', { question: question, answer: answer, password: password }); },
    getProfile: getProfile, updateBasicProfile: function (id, updates) { return change('basic', { id: id, nickname: updates.nickname }); },
    submitCompanionProfile: function (id, profile) { return change('submit', { id: id, profile: profile }); },
    playersLayout: function () { return state.playersLayout; },
    savePlayersLayout: function (layout, version) { return change('players-layout-save', { layout: layout, version: version }); },
    publicProfiles: function () { return state.publicProfiles || []; },
    publicCompanionIdentities: function () { return (state.publicProfiles || []).map(function (p) { return { accountId: p.accountId, nickname: p.nickname }; }); },
    listMoments: function (id) { return (state.moments || []).filter(function (m) { return !id || m.accountId === id; }); },
    createMoment: function (id, payload) { return change('moment', { id: id, payload: payload }); },
    deleteOwnMoment: function (id) { return change('delete-moment', { id: id }); },
    adminDeleteMoment: function (id, reason) { return change('admin-delete-moment', { id: id, reason: reason }); },
    getAsset: async function (key) {
      var response = await fetch('api/community.php?action=asset&key=' + encodeURIComponent(key), { credentials: 'same-origin', cache: 'no-store' });
      if (response.status === 404) return null;
      if (!response.ok) throw Error('媒体读取失败');
      return response.blob();
    },
    putAsset: function (key, file) { var data = new FormData(); data.set('key', key); data.set('file', file); return request('upload', data); },
    deleteAsset: function (id) { return change('delete-asset', { id: id }); },
    hasAdmin: function () { return !!state.configured; },
    createInitialAdmin: function () { throw Error('管理员只能由服务器初始化'); },
    listAccounts: function () { return state.accounts || []; }, listProfiles: function () { return state.profiles || {}; },
    moderationLog: function () { return state.log || []; }, notices: function () { return state.notices || []; },
    warnAccount: function (id, reason) { return change('warn', { id: id, reason: reason }); },
    setAccountStatus: function (id, status, reason) { return change('status', { id: id, status: status, reason: reason }); },
    reviewCompanion: function (id, decision, reason) { return change('review', { id: id, decision: decision, reason: reason }); },
    adminUpdateProfile: function (id, profile) { return change('edit-profile', { id: id, profile: profile }); },
    seedCompanionAccounts: function () { return change('seed', {}); },
    listPosts: listPosts, forumRead: forumRead,
    createPost: function (post) { return change('post', { post: post }); },
    moderatePost: function (id, updates) { return change('moderate-post', Object.assign({ id: id }, updates)); },
    toggleLike: function (id) { return change('like', { id: id }); },
    reply: function (id, content) { return change('reply', { id: id, content: content }); }
  });
  window.QiqiyouAccountError = function (error) {
    var box = document.getElementById('account-service-error');
    if (!box) { box = document.createElement('p'); box.id = 'account-service-error'; box.setAttribute('role', 'alert'); box.style.cssText = 'padding:20px;margin:100px auto 20px;max-width:1000px;background:#fff0ed;color:#953d30;border-radius:12px'; (document.querySelector('main') || document.body).prepend(box); }
    box.textContent = error.message || '账号服务连接失败，请刷新重试';
  };
}());

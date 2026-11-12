(function () {
  'use strict';
  function people(profiles) {
    return profiles.map(function (p) {
      var seed = p.seedCard || {}, media = p.media || {};
      function asset(key) { return 'api/community.php?action=asset&key=' + encodeURIComponent(p.accountId + ':' + key); }
      return Object.assign({}, seed, { accountId: p.accountId, name: p.nickname, gender: p.gender, service: p.service, level: p.level, tone: p.tone, bio: p.bio,
        avatar: media.avatar ? asset('avatar') : seed.avatar || 'images/brand/duo-avatar-65d5590ce942.webp',
        cover: media.galleryCount ? asset('gallery:0') : '', audio: media.audio ? asset('audio') : seed.audio || '', video: media.video ? asset('video') : seed.video || '',
        placeholder: media.avatar ? false : Boolean(seed.placeholder), community: !p.seedCard });
    });
  }
  function selected(data, config, key) {
    var category = config.categories[key];
    if (!category || !category.enabled) return [];
    var eligible = data.filter(function (p) { return config.hiddenIds.indexOf(p.accountId) === -1; });
    var members = category.members.map(function (id) { return eligible.find(function (p) { return p.accountId === id; }); }).filter(Boolean);
    if (key === 'all') members = members.concat(eligible.filter(function (p) { return category.members.indexOf(p.accountId) === -1; }));
    return members;
  }
  window.QiqiyouPlayers = Object.freeze({ people: people, selected: selected });
}());

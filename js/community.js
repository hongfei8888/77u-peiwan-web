(async function () {
  "use strict"; await window.QiqiyouAccount.ready;

  var api = window.QiqiyouAccount;
  var account = api.current();
  var seeds = Array.from(window.COMMUNITY_SEED_POSTS || []);
  var POST_KEY = "qiqiyou_forum_posts_v1";
  var REPLY_KEY = "qiqiyou_forum_replies_v1";
  var LIKE_KEY = "qiqiyou_forum_likes_v1";
  var DELETED_KEY = "qiqiyou_forum_deleted_posts_v1";
  var OVERRIDE_KEY = "qiqiyou_forum_post_overrides_v1";
  var activeCategory = "全部";
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var list = document.getElementById("post-list");

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_) { return fallback; }
  }

  function esc(value) {
    return String(value || "").replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char];
    });
  }
  function allPosts() { return api.listPosts(); }
  function replies() { return read(REPLY_KEY, {}); }
  function likes() { return read(LIKE_KEY, {}); }
  function replyCount(post) { return Number(post.replies || 0) + (replies()[post.id] || []).length; }
  function likeCount(post) { return Number(post.likes || 0) + (likes()[post.id] || []).length; }
  function liked(post) { return Boolean(account && (likes()[post.id] || []).indexOf(account.id) !== -1); }
  function initials(name) { return String(name || "游").slice(0, 1); }
  function relative(post) {
    if (!post.createdAt) return post.time || "最近";
    var distance = Date.now() - post.createdAt;
    if (distance < 60000) return "刚刚";
    if (distance < 3600000) return Math.floor(distance / 60000) + " 分钟前";
    if (distance < 86400000) return Math.floor(distance / 3600000) + " 小时前";
    return Math.floor(distance / 86400000) + " 天前";
  }
  function avatarMarkup(post) {
    if (post.avatar) return '<div class="post-avatar"><img src="' + esc(post.avatar) + '" alt=""></div>';
    return '<div class="post-avatar" data-avatar-account="' + esc(post.accountId || "") + '">' + initials(post.author) + "</div>";
  }
  function plainText(post) {
    return String(post.contentMd || post.content || post.excerpt || "")
      .replace(/!\[[^\]]*\]\([^)]*\)|@\[[^\]]+\]\([^)]*\)/g, " ")
      .replace(/[#>*_`~-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function postMarkup(post) {
    var mediaKey = post.thumbnailKey;
    var thumb = post.images && post.images[0]
      ? '<div class="post-thumb"><img src="' + esc(post.images[0]) + '" alt="帖子图片"></div>'
      : mediaKey
        ? '<div class="post-thumb"><img data-asset-key="' + esc(mediaKey) + '" alt="帖子图片"></div>'
        : post.imageCount
          ? '<div class="post-thumb"><img data-asset-key="' + esc(post.id + ":image:0") + '" alt="帖子图片"></div>'
          : "";
    var plain = plainText(post);
    return '<article class="forum-post" tabindex="0" data-post-id="' + esc(post.id) + '">' +
      avatarMarkup(post) + '<div class="post-main"><div class="post-meta"><strong>' + esc(post.author) + "</strong>" +
      (post.official ? '<span class="post-badge">管理员</span>' : post.companion ? '<span class="post-badge">认证陪玩</span>' : "") +
      (post.pinned ? '<span class="post-pin">置顶</span>' : "") + '<span>' + esc(post.category) + '</span><time>' + esc(relative(post)) + '</time></div><h3>' +
      esc(post.title || plain.slice(0, 28)) + '</h3><p>' + esc(plain) + '</p></div>' + thumb +
      '<div class="post-stats"><button type="button" data-like-id="' + esc(post.id) + '" class="' + (liked(post) ? "is-liked" : "") +
      '">赞 <b>' + likeCount(post) + '</b></button><span>回复 <b>' + replyCount(post) + '</b></span><span>浏览 <b>' +
      Number(post.views || 0) + "</b></span></div></article>";
  }
  async function avatarFor(id) {
    if (!id) return "";
    try {
      var blob = await api.getAsset(id + ":avatar");
      return blob ? URL.createObjectURL(blob) : "";
    } catch (_) { return ""; }
  }
  async function hydrate(root) {
    var images = root.querySelectorAll("[data-asset-key]");
    for (var i = 0; i < images.length; i++) {
      try {
        var blob = await api.getAsset(images[i].dataset.assetKey);
        if (blob) images[i].src = URL.createObjectURL(blob);
      } catch (_) {}
    }
    var avatars = root.querySelectorAll("[data-avatar-account]");
    for (var j = 0; j < avatars.length; j++) {
      var url = await avatarFor(avatars[j].dataset.avatarAccount);
      if (url) avatars[j].innerHTML = '<img src="' + url + '" alt="">';
    }
  }
  function render() {
    var term = document.getElementById("forum-search").value.trim().toLowerCase();
    var posts = allPosts().filter(function (post) {
      var categoryMatches = activeCategory === "全部" || post.category === activeCategory ||
        (activeCategory === "攻略" && post.category === "攻略交流") ||
        (activeCategory === "找搭子" && post.category === "组队招募") ||
        (activeCategory === "战绩" && post.category === "战绩晒图");
      return categoryMatches && (!term || (post.author + " " + (post.title || "") + " " + plainText(post)).toLowerCase().indexOf(term) !== -1);
    });
    var sort = document.getElementById("post-sort").value;
    posts.sort(function (a, b) {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "hot") return likeCount(b) + replyCount(b) * 2 - likeCount(a) - replyCount(a) * 2;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
    list.innerHTML = posts.map(postMarkup).join("");
    document.getElementById("post-count").textContent = posts.length + " 篇";
    document.getElementById("forum-empty").hidden = posts.length > 0;
    hydrate(list);
    if (!reduceMotion) {
      list.querySelectorAll(".forum-post").forEach(function (card, index) {
        var animation = card.animate(
          [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }],
          { duration: 420, delay: Math.min(index * 45, 240), easing: "cubic-bezier(.16,1,.3,1)", fill: "both" }
        );
        animation.onfinish = function () { animation.cancel(); };
      });
    }
  }
  function openPost(id) { location.href = "post.html?id=" + encodeURIComponent(id); }
  async function toggleLike(id) {
    if (!account) { location.href = "account.html?next=community"; return; }
    try { await api.toggleLike(id); render(); } catch(error) { window.QiqiyouAccountError(error); }
  }
  function selectCategory(category) {
    document.querySelectorAll("[data-category]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.category === category);
    });
  }

  document.getElementById("new-post-button").onclick = function () {
    location.href = account ? "publish.html" : "account.html?next=publish";
  };
  document.getElementById("forum-categories").onclick = function (event) {
    var button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    selectCategory(activeCategory);
    render();
  };
  document.getElementById("forum-search").oninput = render;
  document.getElementById("post-sort").onchange = render;
  document.querySelectorAll("[data-search-tag]").forEach(function (button) {
    button.onclick = function () {
      document.getElementById("forum-search").value = button.dataset.searchTag;
      render();
    };
  });
  list.onclick = function (event) {
    var like = event.target.closest("[data-like-id]");
    if (like) { event.stopPropagation(); toggleLike(like.dataset.likeId); return; }
    var post = event.target.closest("[data-post-id]");
    if (post) openPost(post.dataset.postId);
  };
  list.onkeydown = function (event) {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-post-id]")) {
      event.preventDefault();
      openPost(event.target.dataset.postId);
    }
  };
  if (account) {
    var profile = api.getProfile(account.id);
    var entry = document.getElementById("community-account");
    entry.href = account.role === "admin" ? "admin.html" : "profile.html";
    entry.innerHTML = '<strong>' + esc(profile.nickname || account.username) + '</strong><small>' + (account.role === "admin" ? "进入管理中心" : "进入账号中心") + '</small>';
  }
  render();
}()).catch(window.QiqiyouAccountError);
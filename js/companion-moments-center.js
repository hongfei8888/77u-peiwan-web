(async function () {
  "use strict"; await window.QiqiyouAccount.ready;

  var api = window.QiqiyouAccount;
  var account = api && api.current();
  var locked = document.getElementById("moment-locked");
  var workspace = document.getElementById("moment-workspace");
  if (!api || !account || !locked || !workspace) return;

  var form = document.getElementById("moment-composer");
  var content = document.getElementById("moment-content");
  var counter = document.getElementById("moment-count");
  var input = document.getElementById("moment-image-input");
  var preview = document.getElementById("moment-image-preview");
  var message = document.getElementById("moment-message");
  var list = document.getElementById("my-moment-list");
  var total = document.getElementById("my-moment-total");
  var files = [];
  var objectUrls = [];

  function esc(value) { return String(value || "").replace(/[&<>'"]/g, function (char) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]; }); }
  function formatDate(value) { return new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  function clearUrls() { objectUrls.forEach(URL.revokeObjectURL); objectUrls = []; }
  function setMessage(value, error) { message.textContent = value || ""; message.classList.toggle("is-error", Boolean(error)); }

  function renderSelected() {
    clearUrls();
    preview.innerHTML = files.map(function (file, index) {
      var url = URL.createObjectURL(file); objectUrls.push(url);
      return '<figure><img src="' + url + '" alt="待发布图片"><button type="button" data-remove-image="' + index + '" aria-label="移除这张图片">×</button></figure>';
    }).join("");
  }

  async function momentImages(moment) {
    var urls = [];
    for (var i = 0; i < (moment.imageKeys || []).length; i += 1) {
      try { var blob = await api.getAsset(moment.imageKeys[i]); if (blob) urls.push(URL.createObjectURL(blob)); } catch (_) { /* 忽略损坏图片 */ }
    }
    return urls;
  }

  async function renderMoments() {
    var moments = api.listMoments(account.id);
    total.textContent = moments.length + " 条";
    if (!moments.length) { list.innerHTML = '<div class="moment-empty">第一条动态会出现在这里。</div>'; return; }
    var rows = [];
    for (var i = 0; i < moments.length; i += 1) {
      var moment = moments[i];
      var urls = await momentImages(moment);
      rows.push('<article class="my-moment"><header><div><strong>' + esc(moment.author) + '</strong><time>' + formatDate(moment.createdAt) + '</time></div><button type="button" data-delete-moment="' + esc(moment.id) + '">删除</button></header>' + (moment.content ? '<p>' + esc(moment.content).replace(/\n/g, "<br>") + '</p>' : '') + (urls.length ? '<div class="my-moment-images count-' + Math.min(urls.length, 3) + '">' + urls.map(function (url) { return '<img src="' + url + '" alt="动态图片">'; }).join("") + '</div>' : '') + '</article>');
    }
    list.innerHTML = rows.join("");
  }

  if (account.companionStatus !== "approved") {
    locked.hidden = false;
    workspace.hidden = true;
    return;
  }
  locked.hidden = true;
  workspace.hidden = false;
  renderMoments();

  content.addEventListener("input", function () { counter.textContent = content.value.length; });
  input.addEventListener("change", function () {
    var incoming = Array.from(input.files || []);
    incoming.forEach(function (file) {
      if (files.length >= 9) return;
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setMessage("仅支持 JPG、PNG、WebP 图片", true);
      if (file.size > 5 * 1024 * 1024) return setMessage(file.name + " 超过 5MB", true);
      files.push(file);
    });
    input.value = "";
    renderSelected();
  });
  preview.addEventListener("click", function (event) {
    var button = event.target.closest("[data-remove-image]");
    if (!button) return;
    files.splice(Number(button.getAttribute("data-remove-image")), 1);
    renderSelected();
  });
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true; setMessage("正在发布…");
    var storedKeys = [];
    try {
      if (!content.value.trim() && !files.length) throw new Error("请写点内容或选择图片");
      var momentId = "moment-" + Date.now() + "-" + Math.random().toString(16).slice(2);
      for (var i = 0; i < files.length; i += 1) {
        var key = momentId + ":image:" + i;
        await api.putAsset(key, files[i]); storedKeys.push(key);
      }
      await api.createMoment(account.id, { content: content.value, imageKeys: storedKeys });
      content.value = ""; counter.textContent = "0"; files = []; renderSelected();
      setMessage("发布成功，已同步到你的陪玩卡片");
      await renderMoments();
    } catch (error) {
      await Promise.all(storedKeys.map(function (key) { return api.deleteAsset(key).catch(function () {}); }));
      setMessage(error.message || "发布失败，请重试", true);
    } finally { button.disabled = false; }
  });
  list.addEventListener("click", async function (event) {
    var button = event.target.closest("[data-delete-moment]");
    if (!button || !confirm("确定删除这条动态？删除后无法恢复。")) return;
    try {
      var target = api.listMoments(account.id).find(function (moment) { return moment.id === button.getAttribute("data-delete-moment"); });
      await api.deleteOwnMoment(button.getAttribute("data-delete-moment"));
      if (target) await Promise.all((target.imageKeys || []).map(function (key) { return api.deleteAsset(key).catch(function () {}); }));
      setMessage("动态已删除"); await renderMoments();
    } catch (error) { setMessage(error.message || "删除失败", true); }
  });
}()).catch(window.QiqiyouAccountError);
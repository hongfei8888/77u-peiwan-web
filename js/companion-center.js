(async function () {
  "use strict"; await window.QiqiyouAccount.ready;
  var api = window.QiqiyouAccount;
  var account = api.current();
  if (!account) { location.replace("account.html?next=center"); return; }

  var form = document.getElementById("profile-form");
  var avatarInput = document.getElementById("avatar-input");
  var galleryInput = document.getElementById("gallery-input");
  var audioInput = document.getElementById("audio-input");
  var videoInput = document.getElementById("video-input");
  var avatarPreview = document.getElementById("avatar-preview");
  var cardAvatar = document.getElementById("card-avatar");
  var fileSummary = document.getElementById("file-summary");
  var saveMessage = document.getElementById("save-message");
  var saveButton = document.getElementById("save-button");
  var saveToast = document.getElementById("save-toast");
  var viewCardLink = document.getElementById("view-card-link");
  var profile = api.getProfile(account.id);
  var existingAvatar = Boolean(profile.media && profile.media.avatar);
  var objectUrls = [];
  var selectedGallery = [];
  var selectedAudio = null;
  var selectedVideo = null;
  function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, function (char) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]; }); }

  document.getElementById("account-name").textContent = account.username;
  document.getElementById("logout-button").addEventListener("click", async function () { await api.logout(); location.replace("account.html"); });

  function renderVerificationStatus() {
    var box = document.getElementById("verification-status");
    var state = account.companionStatus || "none";
    var messages = {
      none: ["普通用户", "你可以正常参与社区；如需成为陪玩，请完善下方资料并提交认证。"],
      pending: ["认证审核中", "资料已经提交，请等待管理员审核。审核前不会出现在陪玩社区。"],
      approved: ["认证陪玩", "认证已通过，公开卡片已展示。修改资料后需要重新审核。"],
      rejected: ["认证未通过", profile.reviewReason || "请根据审核意见完善资料后重新提交。"]
    };
    var message = messages[state] || messages.none;
    box.className = "verification-status is-" + state;
    box.innerHTML = "<strong>" + message[0] + "</strong><p>" + message[1] + "</p>";
    saveButton.textContent = state === "pending" ? "更新并重新提交" : state === "approved" ? "更新资料并重新审核" : "提交陪玩认证";
  }

  function renderNotices() {
    var box = document.getElementById("account-notices");
    var items = api.notices ? api.notices(account.id) : [];
    if (!items.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = '<strong>账号通知</strong>' + items.slice(0, 5).map(function (item) {
      return '<article class="notice-' + escapeHtml(item.type) + '"><span>' + new Date(item.createdAt).toLocaleString("zh-CN") + '</span><p>' + escapeHtml(item.message) + '</p></article>';
    }).join("");
  }

  function putAsset(key,file) { return api.putAsset(key,file); }
  function getAsset(key) { return api.getAsset(key); }

  function assetUrl(blob) {
    var url = URL.createObjectURL(blob); objectUrls.push(url); return url;
  }

  function checkFile(file, maxMb, allowedPrefix) {
    if (!file) return;
    if (allowedPrefix && !allowedPrefix.some(function (type) { return file.type.indexOf(type) === 0; })) throw new Error("文件格式不支持：" + file.name);
    if (file.size > maxMb * 1024 * 1024) throw new Error(file.name + " 超过 " + maxMb + "MB 限制");
  }

  function values() {
    var raw = new FormData(form);
    return {
      nickname: String(raw.get("nickname") || "").trim(), gender: raw.get("gender") || "", service: raw.get("service") || "",
      level: String(raw.get("level") || "").trim(), tone: String(raw.get("tone") || "").trim(), bio: String(raw.get("bio") || "").trim(),
      categories: raw.getAll("categories")
    };
  }

  function renderPreview() {
    var value = values();
    document.getElementById("preview-title").textContent = value.nickname || "你的昵称";
    document.getElementById("card-level").textContent = value.level || "等级待补充";
    document.getElementById("card-meta").textContent = [value.service, value.tone].filter(Boolean).join(" · ") || "选择主要服务和音色标签";
    document.getElementById("card-tags").innerHTML = (value.categories.length ? value.categories : ["陪玩社区"]).map(function (tag) { var span = document.createElement("span"); span.textContent = tag; return span.outerHTML; }).join("");
    var media = []; if (selectedGallery.length || (profile.media && profile.media.galleryCount)) media.push("有图片"); if (selectedAudio || (profile.media && profile.media.audio)) media.push("有声音"); if (selectedVideo || (profile.media && profile.media.video)) media.push("有视频");
    document.getElementById("card-media").textContent = media.join(" · ") || "资料待完善";
    document.getElementById("bio-count").textContent = value.bio.length;
    updateCompletion(value);
  }

  function updateCompletion(value) {
    var items = [value.nickname, value.gender, value.service, value.level, value.tone, value.categories.length, value.bio, avatarInput.files.length || existingAvatar];
    var percent = Math.round(items.filter(Boolean).length / items.length * 100);
    document.getElementById("completion-value").textContent = percent + "%";
    document.getElementById("completion-bar").style.width = percent + "%";
  }

  function renderFiles() {
    var items = [];
    if (selectedGallery.length) items.push("待保存形象图片 " + selectedGallery.length + " 张"); else if (profile.media && profile.media.galleryCount) items.push("已保存形象图片 " + profile.media.galleryCount + " 张");
    if (selectedAudio) items.push("待保存声音：" + selectedAudio.name); else if (profile.media && profile.media.audioName) items.push("已保存声音：" + profile.media.audioName);
    if (selectedVideo) items.push("待保存视频：" + selectedVideo.name); else if (profile.media && profile.media.videoName) items.push("已保存视频：" + profile.media.videoName);
    var previews = "";
    if (selectedGallery.length) {
      previews = '<div class="upload-previews">' + selectedGallery.map(function (file, index) {
        var url = assetUrl(file);
        return '<figure><img src="' + url + '" alt="待上传形象图片"><figcaption>' + escapeHtml(file.name) + '</figcaption><button type="button" data-remove-gallery="' + index + '" aria-label="移除' + escapeHtml(file.name) + '">×</button></figure>';
      }).join("") + "</div>";
    }
    var replacements = '<div class="media-reselect">';
    if (selectedAudio) replacements += '<span>声音已选择 <button type="button" data-clear-media="audio">移除并重选</button></span>';
    if (selectedVideo) replacements += '<span>视频已选择 <button type="button" data-clear-media="video">移除并重选</button></span>';
    if (selectedGallery.length) replacements += '<span><button type="button" data-clear-media="gallery">清空全部图片</button></span>';
    replacements += "</div>";
    fileSummary.innerHTML = previews + (items.length ? "<ul>" + items.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") + "</ul>" : "<p>尚未选择新的公开作品。</p>") + replacements;
  }

  var toastTimer;
  function toast(text, error) {
    clearTimeout(toastTimer); saveToast.textContent = text; saveToast.hidden = false; saveToast.classList.toggle("is-error", Boolean(error));
    toastTimer = setTimeout(function () { saveToast.hidden = true; }, 4500);
  }
  function showError(text) { saveMessage.textContent = text; saveMessage.classList.add("is-error"); toast(text, true); }

  function markInvalid(element, message) {
    if (element) { element.classList.add("field-error"); element.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(function () { element.focus({ preventScroll: true }); }, 350); }
    throw new Error(message);
  }

  function validate(value) {
    form.querySelectorAll(".field-error").forEach(function (element) { element.classList.remove("field-error"); });
    if (!value.nickname) markInvalid(form.elements.nickname, "请填写公开昵称");
    if (!value.gender) markInvalid(form.elements.gender, "请选择性别");
    if (!value.service) markInvalid(form.elements.service, "请选择主要服务");
    if (!value.categories.length) markInvalid(document.querySelector(".category-field span"), "请至少选择一种展示类型");
    if (!avatarInput.files[0] && !existingAvatar) markInvalid(document.getElementById("avatar-upload"), "请先上传头像");
    if (!form.elements.publicConfirm.checked) markInvalid(form.elements.publicConfirm, "请勾选公开确认后再保存");
  }

  async function restore() {
    ["nickname", "gender", "service", "level", "tone", "bio"].forEach(function (name) { if (profile[name] != null && form.elements[name]) form.elements[name].value = profile[name]; });
    (profile.categories || []).forEach(function (value) { var input = form.querySelector('input[name="categories"][value="' + CSS.escape(value) + '"]'); if (input) input.checked = true; });
    if (profile.publicConfirm) form.elements.publicConfirm.checked = true;
    if (existingAvatar) {
      var blob = await getAsset(account.id + ":avatar");
      if (blob) { var url = assetUrl(blob); avatarPreview.src = url; cardAvatar.src = url; }
    }
    if (account.companionStatus === "approved" && profile.status === "published") viewCardLink.hidden = false;
    renderVerificationStatus();
    renderFiles(); renderPreview(); renderNotices();
  }

  avatarInput.addEventListener("change", function () {
    try { checkFile(avatarInput.files[0], 3, ["image/"]); if (avatarInput.files[0]) { var url = assetUrl(avatarInput.files[0]); avatarPreview.src = url; cardAvatar.src = url; } saveMessage.textContent = ""; renderPreview(); }
    catch (error) { avatarInput.value = ""; showError(error.message); }
  });
  galleryInput.addEventListener("change", function () {
    selectedGallery = Array.from(galleryInput.files || []);
    galleryInput.value = "";
    renderFiles(); renderPreview(); saveMessage.textContent = ""; toast("图片已选择，可逐张移除或重新选择", false);
  });
  audioInput.addEventListener("change", function () {
    selectedAudio = audioInput.files[0] || null;
    audioInput.value = "";
    renderFiles(); renderPreview(); saveMessage.textContent = ""; toast("声音样片已替换，保存后生效", false);
  });
  videoInput.addEventListener("change", function () {
    selectedVideo = videoInput.files[0] || null;
    videoInput.value = "";
    renderFiles(); renderPreview(); saveMessage.textContent = ""; toast("形象视频已替换，保存后生效", false);
  });
  fileSummary.addEventListener("click", function (event) {
    var remove = event.target.closest("[data-remove-gallery]");
    var clear = event.target.closest("[data-clear-media]");
    if (remove) selectedGallery.splice(Number(remove.dataset.removeGallery), 1);
    if (clear && clear.dataset.clearMedia === "gallery") selectedGallery = [];
    if (clear && clear.dataset.clearMedia === "audio") selectedAudio = null;
    if (clear && clear.dataset.clearMedia === "video") selectedVideo = null;
    if (remove || clear) { renderFiles(); renderPreview(); toast("已移除，可点击上方区域重新选择", false); }
  });
  form.addEventListener("input", renderPreview);

  form.addEventListener("submit", async function (event) {
    event.preventDefault(); saveMessage.textContent = ""; saveMessage.classList.remove("is-error");
    try {
      var value = values(); validate(value);
      if (selectedGallery.length > 6) throw new Error("形象图片最多上传 6 张");
      selectedGallery.forEach(function (file) { checkFile(file, 5, ["image/"]); });
      checkFile(selectedAudio, 15, ["audio/"]); checkFile(selectedVideo, 40, ["video/"]);
      saveButton.disabled = true; saveButton.textContent = "正在保存...";
      var media = Object.assign({}, profile.media || {});
      if (avatarInput.files[0]) { await putAsset(account.id + ":avatar", avatarInput.files[0]); media.avatar = true; media.avatarName = avatarInput.files[0].name; existingAvatar = true; }
      if (selectedGallery.length) { for (var i = 0; i < selectedGallery.length; i += 1) await putAsset(account.id + ":gallery:" + i, selectedGallery[i]); media.galleryCount = selectedGallery.length; }
      if (selectedAudio) { await putAsset(account.id + ":audio", selectedAudio); media.audio = true; media.audioName = selectedAudio.name; }
      if (selectedVideo) { await putAsset(account.id + ":video", selectedVideo); media.video = true; media.videoName = selectedVideo.name; }
      profile = Object.assign(value, { publicConfirm: true, media: media, updatedAt: new Date().toISOString() });
      profile = await api.submitCompanionProfile(account.id, profile); account = api.current(); selectedGallery = []; selectedAudio = null; selectedVideo = null; renderFiles(); renderPreview(); renderVerificationStatus(); saveMessage.textContent = "资料已提交，等待管理员审核"; viewCardLink.hidden = true; toast("认证申请已提交，审核通过后才会公开展示", false);
    } catch (error) { showError(error.message || "保存失败，请重试"); }
    finally { saveButton.disabled = false; renderVerificationStatus(); }
  });

  window.addEventListener("beforeunload", function () { objectUrls.forEach(function (url) { URL.revokeObjectURL(url); }); });
  restore().catch(function () { showError("媒体读取失败，请刷新后重试"); renderPreview(); });
}()).catch(window.QiqiyouAccountError);

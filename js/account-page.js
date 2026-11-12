(async function () {
  "use strict"; await window.QiqiyouAccount.ready;
  var api = window.QiqiyouAccount;
  var tabs = document.querySelectorAll("[data-auth-tab]");
  var forms = { login: document.getElementById("login-panel"), register: document.getElementById("register-panel") };
  var params = new URLSearchParams(location.search);
  var next = params.get("next");
  var nextPage = next === "community" ? "community.html" : next === "publish" ? "publish.html" : next === "admin" ? "admin.html" : next === "center" ? "companion-center.html" : next === "post" && params.get("id") ? "post.html?id=" + encodeURIComponent(params.get("id")) : "profile.html";
  var captcha = null;

  async function refreshCaptcha() {
    try { captcha = await api.createCaptcha();
    document.getElementById("captcha-question").textContent = captcha.question;
    forms.register.elements.captchaAnswer.value = ""; } catch(error) { message(forms.register,error.message,true); }
  }

  function selectTab(name) {
    tabs.forEach(function (tab) { var active = tab.dataset.authTab === name; tab.setAttribute("aria-selected", String(active)); });
    Object.keys(forms).forEach(function (key) { forms[key].hidden = key !== name; });
    forms[name].querySelector("input").focus();
  }
  function setBusy(form, busy) {
    var button = form.querySelector("button[type=submit]");
    button.disabled = busy;
    button.textContent = busy ? "正在处理..." : (form.id === "login-panel" ? "登录账号" : "创建账号");
  }
  function message(form, text, error) {
    var box = form.querySelector("[data-form-message]");
    box.textContent = text;
    box.classList.toggle("is-error", Boolean(error));
  }
  tabs.forEach(function (tab) { tab.addEventListener("click", function () { selectTab(tab.dataset.authTab); }); });
  document.getElementById("refresh-captcha").addEventListener("click", refreshCaptcha);

  forms.login.addEventListener("submit", async function (event) {
    event.preventDefault(); message(forms.login, "", false); setBusy(forms.login, true);
    var values = new FormData(forms.login);
    try {
      var account = await api.login(values.get("username"), values.get("password"));
      if(account.role === "admin" && !next) nextPage="admin.html";
      location.href = account.mustChangePassword ? "change-password.html?next=" + encodeURIComponent(nextPage) : nextPage;
    } catch (error) { message(forms.login, error.message, true); setBusy(forms.login, false); }
  });
  forms.register.addEventListener("submit", async function (event) {
    event.preventDefault(); message(forms.register, "", false);
    var values = new FormData(forms.register);
    if (values.get("password") !== values.get("confirmPassword")) { message(forms.register, "两次输入的密码不一致", true); return; }
    setBusy(forms.register, true);
    try { await api.register(values.get("username"), values.get("password"), { securityQuestion: values.get("securityQuestion"), securityAnswer: values.get("securityAnswer"), captchaId: captcha && captcha.id, captchaAnswer: values.get("captchaAnswer") }); location.href = nextPage; }
    catch (error) { message(forms.register, error.message, true); setBusy(forms.register, false); refreshCaptcha(); }
  });

  var current = api.current();
  if (current) {
    var notice = document.querySelector(".local-notice");
    var href = current.role === "admin" ? "admin.html" : "profile.html";
    var label = current.role === "admin" ? "进入管理中心" : "进入个人中心";
    notice.innerHTML = '<strong>当前已有账号登录</strong><p><a href="' + href + '">' + label + " →</a></p>";
  }
  refreshCaptcha();
}()).catch(window.QiqiyouAccountError);
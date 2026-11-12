(async function () {
  "use strict"; await window.QiqiyouAccount.ready;
  var api = window.QiqiyouAccount;
  var account = api.current();
  var form = document.getElementById("password-form");
  var message = document.getElementById("password-message");
  var params = new URLSearchParams(location.search);
  var requestedNext = params.get("next");
  var allowedNext = ["profile.html", "admin.html", "companion-center.html"];
  var next = allowedNext.indexOf(requestedNext) >= 0 ? requestedNext : (account && account.role === "admin" ? "admin.html" : "profile.html");
  if (!account) { location.replace("account.html"); return; }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var password = data.get("nextPassword");
    var button = form.querySelector("button");
    message.textContent = "";
    message.classList.remove("is-error");
    if (password !== data.get("confirmPassword")) {
      message.textContent = "两次输入的新密码不一致";
      message.classList.add("is-error");
      return;
    }
    button.disabled = true;
    button.textContent = "正在保存...";
    try {
      await api.changePassword(data.get("currentPassword"), password);
      message.textContent = "密码已更新，正在返回账号中心";
      location.replace(next);
    } catch (error) {
      message.textContent = error.message;
      message.classList.add("is-error");
      button.disabled = false;
      button.textContent = "保存新密码";
    }
  });
}()).catch(window.QiqiyouAccountError);
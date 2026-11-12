(async function () {
  "use strict"; await window.QiqiyouAccount.ready;
  var api = window.QiqiyouAccount;
  var setup = document.getElementById("admin-setup");
  var loginRequired = document.getElementById("admin-login-required");
  var app = document.getElementById("admin-app");
  var toastBox = document.getElementById("admin-toast");
  var credentials = [];
  var POST_CATEGORIES = ["公告", "攻略", "找搭子", "战绩", "陪玩日常", "闲聊"];


  function esc(value) { return String(value || "").replace(/[&<>'"]/g,function(char){return{"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]}); }
  function toast(message) { toastBox.textContent = message; toastBox.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(function(){toastBox.hidden=true},3200); }
  function date(value) { if (!value) return "—"; return new Date(value).toLocaleString("zh-CN", { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" }); }
  function statusLabel(value) { return { none:"未申请", pending:"待审核", approved:"已认证", rejected:"已驳回", active:"正常", suspended:"已暂停", published:"已公开" }[value] || value || "—"; }
  function allPosts() { return api.listPosts(); }
  function accountName(account, profiles) { var profile=profiles[account.id]||{}; return profile.nickname || account.seedName || account.username; }
  async function avatarUrl(accountId) { try { var blob=await api.getAsset(accountId+":avatar"); return blob?URL.createObjectURL(blob):"images/brand/duo-avatar-65d5590ce942.webp"; } catch(_){ return "images/brand/duo-avatar-65d5590ce942.webp"; } }

  function renderStats(accounts, profiles, posts) {
    var pending=accounts.filter(function(a){return a.companionStatus==="pending"}).length;
    var approved=accounts.filter(function(a){return a.companionStatus==="approved"}).length;
    var suspended=accounts.filter(function(a){return a.status==="suspended"}).length;
    document.getElementById("admin-stats").innerHTML=[
      ["REGISTERED ACCOUNTS",accounts.length,"注册账号"],["PENDING REVIEW",pending,"待审核认证"],["VERIFIED PLAYERS",approved,"认证陪玩"],["VISIBLE POSTS",posts.length,"当前帖子"]
    ].map(function(item){return '<article class="admin-stat"><span>'+item[0]+'</span><strong>'+item[1]+'</strong><small>'+item[2]+(item[0]==="REGISTERED ACCOUNTS"&&suspended?" · "+suspended+" 已暂停":"")+'</small></article>'}).join("");
  }
  async function renderReviews(accounts, profiles) {
    var pending=accounts.filter(function(account){return account.companionStatus==="pending"&&profiles[account.id]});
    document.getElementById("pending-count").textContent=pending.length+" 待处理";
    var list=document.getElementById("review-list");
    if(!pending.length){list.innerHTML='<div class="empty-admin">目前没有待审核的陪玩认证</div>';return}
    var rows=[];
    for(var i=0;i<pending.length;i++){var account=pending[i],profile=profiles[account.id],avatar=await avatarUrl(account.id);rows.push('<article class="review-card"><img class="review-avatar" src="'+avatar+'" alt=""><div><h3>'+esc(profile.nickname||account.username)+'</h3><p>'+esc([profile.service,profile.level,profile.tone].filter(Boolean).join(" · ")||"资料待补充")+'<br>提交于 '+date(profile.submittedAt)+'</p></div><div class="review-actions"><button data-edit-profile="'+esc(account.id)+'">查看 / 修改</button><button class="approve" data-review="approved" data-account="'+esc(account.id)+'">通过</button><button class="reject" data-review="rejected" data-account="'+esc(account.id)+'">驳回</button></div></article>')}
    list.innerHTML=rows.join("");
  }
  function renderPosts(posts) {
    var term=document.getElementById("post-admin-search").value.trim().toLowerCase();
    var filtered=posts.filter(function(post){return !term||(String(post.title)+" "+post.author+" "+post.category).toLowerCase().indexOf(term)!==-1});
    document.getElementById("admin-posts").innerHTML=filtered.length?filtered.map(function(post){
      return '<tr><td><strong>'+(post.pinned?'<span class="post-admin-pin">置顶</span> ':"")+esc(post.title||"无标题")+'</strong><small>'+esc(String(post.content||post.excerpt||"").replace(/[#>*_`]/g," ").slice(0,58))+'</small></td><td>'+esc(post.author)+'</td><td>'+esc(post.category)+'</td><td><span class="status-chip '+(post.pinned?"pending":"active")+'">'+(post.pinned?"置顶中":"公开")+'</span></td><td><div class="table-actions"><a href="post.html?id='+encodeURIComponent(post.id)+'">查看</a><button data-toggle-pin="'+esc(post.id)+'" data-pin-next="'+(post.pinned?"false":"true")+'">'+(post.pinned?"取消置顶":"置顶")+'</button><button data-change-category="'+esc(post.id)+'">改分区</button><button class="danger" data-delete-post="'+esc(post.id)+'" data-source="'+post.source+'">删除</button></div></td></tr>';
    }).join(""):'<tr><td colspan="5" class="empty-admin">没有匹配的帖子</td></tr>';
  }
  function renderAdminMoments(moments) {
    var box=document.getElementById("admin-moments");
    document.getElementById("admin-moment-count").textContent=moments.length+" 条动态";
    box.innerHTML=moments.length?moments.map(function(moment){
      return '<article class="admin-moment-card"><header><strong>'+esc(moment.author||"未命名陪玩")+'</strong><time>'+date(moment.createdAt)+'</time></header><p>'+esc(moment.content||"仅图片动态").replace(/\n/g,"<br>")+'</p><footer><span>'+(moment.imageKeys||[]).length+' 张图片 · 只可删除，不可修改</span><button type="button" data-delete-moment="'+esc(moment.id)+'">删除动态</button></footer></article>';
    }).join(""):'<div class="empty-admin">目前没有陪玩动态</div>';
  }
  function renderAccounts(accounts, profiles) {
    var term=document.getElementById("account-admin-search").value.trim().toLowerCase(),current=api.current();
    var filtered=accounts.filter(function(account){return !term||(account.username+" "+accountName(account,profiles)).toLowerCase().indexOf(term)!==-1});
    document.getElementById("admin-accounts").innerHTML=filtered.map(function(account){
      var name=accountName(account,profiles),isSelf=account.id===current.id,hasProfile=Boolean(profiles[account.id]);
      return '<tr><td><strong>'+esc(name)+'</strong><small>'+esc(account.username)+' · '+date(account.createdAt)+'</small></td><td>'+esc(account.role==="admin"?"管理员":account.role==="companion"?"陪玩":"普通用户")+'</td><td><span class="status-chip '+esc(account.companionStatus)+'">'+esc(statusLabel(account.companionStatus))+'</span></td><td>'+Number(account.warnings||0)+'</td><td><span class="status-chip '+esc(account.status)+'">'+esc(statusLabel(account.status))+'</span></td><td><div class="table-actions">'+(hasProfile?'<button data-edit-profile="'+esc(account.id)+'">修改资料</button>':"")+(account.role==="admin"?'<small>管理员账号</small>':'<button data-warn-account="'+esc(account.id)+'">警告</button><button class="'+(account.status==="suspended"?"":"danger")+'" data-toggle-account="'+esc(account.id)+'" data-next-status="'+(account.status==="suspended"?"active":"suspended")+'">'+(account.status==="suspended"?"恢复":"暂停")+'</button>')+'</div></td></tr>';
    }).join("");
  }
  function renderAudit() {
    var items=api.moderationLog().slice(0,12);
    document.getElementById("audit-list").innerHTML=items.length?items.map(function(item){return '<div class="audit-item"><strong>'+esc(item.operatorName)+' · '+esc(item.action)+'</strong><span>'+esc(item.detail||item.targetId)+' · '+date(item.createdAt)+'</span></div>'}).join(""):'<div class="empty-admin">尚无管理操作</div>';
  }
  async function render() {
    var accounts=api.listAccounts(),profiles=api.listProfiles(),posts=allPosts(),moments=api.listMoments();
    renderStats(accounts,profiles,posts);await renderReviews(accounts,profiles);renderPosts(posts);renderAdminMoments(moments);renderAccounts(accounts,profiles);renderAudit();
  }
  async function boot() {
    if(!api.hasAdmin()){setup.hidden=false;return}
    var account=api.current();
    if(!account||account.role!=="admin"){loginRequired.hidden=false;return}
    app.hidden=false;document.getElementById("admin-logout").hidden=false;document.getElementById("admin-identity").textContent=account.username+" · 管理员";await render();
  }

  document.getElementById("admin-setup-form").addEventListener("submit",async function(event){event.preventDefault();var data=new FormData(event.currentTarget),message=document.getElementById("setup-message"),button=event.currentTarget.querySelector("button");message.textContent="";if(data.get("password")!==data.get("confirmPassword")){message.textContent="两次输入的密码不一致";return}button.disabled=true;try{await api.createInitialAdmin(data.get("username"),data.get("password"));setup.hidden=true;app.hidden=false;document.getElementById("admin-logout").hidden=false;await render()}catch(error){message.textContent=error.message;button.disabled=false}});
  document.getElementById("admin-logout").onclick=async function(){await api.logout();location.replace("account.html?next=admin")};
  document.getElementById("review-list").onclick=async function(event){var edit=event.target.closest("[data-edit-profile]");if(edit){openProfileEditor(edit.dataset.editProfile);return}var button=event.target.closest("[data-review]");if(!button)return;var reason="";if(button.dataset.review==="rejected"){reason=prompt("填写驳回原因（会通知申请人）：", "请补充清晰头像和完整服务介绍");if(reason===null)return}else reason=prompt("填写审核备注（可选）：", "资料核验通过")||"";await api.reviewCompanion(button.dataset.account,button.dataset.review,reason);toast(button.dataset.review==="approved"?"认证已通过":"申请已驳回");await render()};
  document.getElementById("admin-posts").onclick=async function(event){
    var pin=event.target.closest("[data-toggle-pin]"),category=event.target.closest("[data-change-category]"),remove=event.target.closest("[data-delete-post]");
    try {
      if(pin){await api.moderatePost(pin.dataset.togglePin,{operation:"pin",pinned:pin.dataset.pinNext==="true"});toast("置顶状态已更新");}
      else if(category){var post=allPosts().find(function(p){return p.id===category.dataset.changeCategory}),next=prompt("输入新分区："+POST_CATEGORIES.join(" / "),post?post.category:"攻略");if(next===null)return;await api.moderatePost(category.dataset.changeCategory,{operation:"category",category:next.trim()});toast("帖子分区已更新");}
      else if(remove){var reason=prompt("填写删帖原因：","违反社区内容规范");if(!reason||!confirm("确定删除这篇帖子？"))return;await api.moderatePost(remove.dataset.deletePost,{operation:"delete",reason:reason});toast("帖子已删除并记录原因");}
      else return;
      await render();
    }catch(error){toast(error.message);}
  };
  document.getElementById("admin-moments").onclick=async function(event){var button=event.target.closest("[data-delete-moment]");if(!button)return;var reason=prompt("填写删除动态原因（将写入审计记录）：","违反社区内容规范");if(reason===null||!reason.trim()){toast("取消删除：必须填写原因");return}if(!confirm("确定删除这条陪玩动态？删除后不可恢复。"))return;try{var target=api.listMoments().find(function(moment){return moment.id===button.dataset.deleteMoment});await api.adminDeleteMoment(button.dataset.deleteMoment,reason.trim());if(target&&api.deleteAsset)await Promise.all((target.imageKeys||[]).map(function(key){return api.deleteAsset(key).catch(function(){})}));toast("动态已删除，原作者无法再编辑或恢复");await render()}catch(error){toast(error.message||"删除失败")}};
  document.getElementById("admin-accounts").onclick=async function(event){var edit=event.target.closest("[data-edit-profile]"),warn=event.target.closest("[data-warn-account]"),toggle=event.target.closest("[data-toggle-account]");if(edit){openProfileEditor(edit.dataset.editProfile);return}if(warn){var reason=prompt("填写警告内容（用户可见）：", "请遵守社区规则，停止发布不当内容");if(reason===null||!reason.trim())return;await api.warnAccount(warn.dataset.warnAccount,reason.trim());toast("警告已发送");render()}if(toggle){var isSuspend=toggle.dataset.nextStatus==="suspended",text=prompt(isSuspend?"填写暂停账号原因：":"填写恢复账号备注：",isSuspend?"多次违反社区规则":"申诉处理完成");if(text===null||!text.trim())return;if(isSuspend&&!confirm("确定暂停该账号的登录权限？"))return;await api.setAccountStatus(toggle.dataset.toggleAccount,toggle.dataset.nextStatus,text.trim());toast(isSuspend?"账号已暂停":"账号已恢复");render()}};
  var profileDialog=document.getElementById("profile-editor-dialog"),profileForm=document.getElementById("profile-editor-form");
  function openProfileEditor(accountId){var profile=api.listProfiles()[accountId];if(!profile){toast("没有找到认证资料");return}profileForm.reset();profileForm.elements.accountId.value=accountId;["nickname","gender","service","level","tone","bio"].forEach(function(name){if(profileForm.elements[name])profileForm.elements[name].value=profile[name]||""});(profile.categories||[]).forEach(function(value){var input=profileForm.querySelector('input[name="categories"][value="'+CSS.escape(value)+'"]');if(input)input.checked=true});document.getElementById("profile-editor-message").textContent="";profileDialog.showModal()}
  document.getElementById("profile-editor-close").onclick=function(){profileDialog.close()};
  profileForm.onsubmit=async function(event){event.preventDefault();var data=new FormData(profileForm),button=profileForm.querySelector("button[type=submit]");button.disabled=true;try{await api.adminUpdateProfile(data.get("accountId"),{nickname:data.get("nickname"),gender:data.get("gender"),service:data.get("service"),level:data.get("level"),tone:data.get("tone"),bio:data.get("bio"),categories:data.getAll("categories")});document.getElementById("profile-editor-message").textContent="修改已保存并记录";toast("陪玩认证资料已更新");await render();setTimeout(function(){profileDialog.close()},450)}catch(error){document.getElementById("profile-editor-message").textContent=error.message}finally{button.disabled=false}};
  document.getElementById("post-admin-search").oninput=function(){renderPosts(allPosts())};
  document.getElementById("account-admin-search").oninput=function(){renderAccounts(api.listAccounts(),api.listProfiles())};
  document.getElementById("seed-accounts").onclick=async function(){var names=Array.from(window.COMPANION_DATA||[]).map(function(person){return person.name});if(!confirm("将为当前名册中尚未建号的陪玩生成临时账号。继续吗？"))return;this.disabled=true;this.textContent="正在生成...";try{credentials=await api.seedCompanionAccounts(names);if(!credentials.length){toast("所有名册账号都已经生成");return}document.getElementById("credential-list").innerHTML=credentials.map(function(item){return '<div class="credential-row"><strong>'+esc(item.nickname)+'</strong><span>'+esc(item.username)+'</span><code>'+esc(item.temporaryPassword)+'</code></div>'}).join("");document.getElementById("credential-dialog").showModal();await render()}catch(error){toast(error.message)}finally{this.disabled=false;this.textContent="生成预置陪玩账号"}};
  document.getElementById("credential-close").onclick=function(){document.getElementById("credential-dialog").close()};
  document.getElementById("credential-download").onclick=function(){if(!credentials.length)return;var csv="昵称,登录账号,临时密码,首次登录要求\r\n"+credentials.map(function(item){return [item.nickname,item.username,item.temporaryPassword,"必须修改密码"].map(function(value){return '"'+String(value).replace(/"/g,'""')+'"'}).join(",")}).join("\r\n"),blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="陪玩临时账号-仅此一次.csv";link.click();setTimeout(function(){URL.revokeObjectURL(url)},1000)};
  await boot();
  document.querySelectorAll("#admin-app button").forEach(function(b){b.disabled=false});
}()).catch(window.QiqiyouAccountError);
window.addEventListener("unhandledrejection",function(e){if(e.reason&&e.reason.message){window.QiqiyouAccountError(e.reason);e.preventDefault();}});

(function(){
  'use strict';
  var $=function(id){return document.getElementById(id)},board=$('assessment-message-board');if(!board)return;
  var viewer=null,csrf='',page=1,pages=1,ready=false,busy=false,requestId='',sequence=0,controller=null,signature='';
  var content=$('message-content'),author=$('message-author'),anonymous=$('message-anonymous'),form=$('assessment-message-form');
  function status(text,error){$('message-board-status').textContent=text;$('message-board-status').classList.toggle('is-error',!!error)}
  function count(){var n=Array.from(content.value).length;$('message-length').textContent=n+' / 500';$('message-submit').disabled=!ready||busy||n>500}
  function anonymousChoice(){author.disabled=anonymous.checked||busy;author.required=!anonymous.checked;author.placeholder=anonymous.checked?'匿名时无需填写':'名字或编号，填一个即可';requestId=''}
  async function request(action,data,signal){
    var owner=signal?null:new AbortController(),timeout=owner?setTimeout(function(){owner.abort()},12000):null,r;
    try{r=await fetch('api/community.php?action='+action,{method:data?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:data?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{},body:data?JSON.stringify(data):undefined,signal:signal||owner.signal})}
    catch(e){if(signal&&e.name==='AbortError')throw e;throw Error(e.name==='AbortError'?'连接超时，请重试。':'暂时无法连接留言服务，请稍后重试。')}
    finally{if(timeout)clearTimeout(timeout)}
    var body;try{body=await r.json()}catch(_){throw Error('留言服务暂不可用，请确认网站已启用PHP。')}
    if(body.csrf)csrf=body.csrf;
    if(!r.ok){var e=Error(body.error||'请求失败，请重试');e.status=r.status;throw e}return body;
  }
  function element(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
  function render(items){
    var list=$('message-list'),scroll=list.scrollTop;list.replaceChildren();
    if(!items.length){list.append(element('p','message-empty','还没有留言，来聊聊你的想法吧。'));return}
    items.forEach(function(m){
      var display=m.anonymous?'匿名陪玩':m.author;
      var article=element('article','message-item'),header=element('div','message-item-header'),mark=element('span','message-author-mark',m.anonymous?'匿':Array.from(display||'游')[0]);mark.setAttribute('aria-hidden','true');
      var meta=element('div','message-item-meta'),name=element('strong','',display);meta.append(name);
      if(!m.anonymous&&(m.official||m.companion))name.append(element('span','message-role',m.official?'管理员':'陪玩'));
      var time=element('time','',new Date(m.createdAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}));time.dateTime=m.createdAt;meta.append(time);header.append(mark,meta);
      if(viewer&&viewer.role==='admin'){var b=element('button','message-delete','删除');b.type='button';b.dataset.messageDelete=m.id;b.setAttribute('aria-label','删除 '+display+' 的留言');header.append(b)}
      article.append(header,element('p','message-content',m.content));list.append(article);
    });list.scrollTop=scroll;
  }
  async function load(next,silent){
    if(controller)controller.abort();controller=new AbortController();var current=++sequence,timer=setTimeout(function(){if(current===sequence)controller.abort()},10000);
    try{var data=await request('assessment-messages&page='+next,null,controller.signal);if(current!==sequence)return;
      csrf=data.csrf;ready=true;viewer=data.viewer;page=data.page;pages=data.pages;
      var sig=JSON.stringify([data.items,data.viewer&&data.viewer.role]);if(signature!==sig){signature=sig;render(data.items)}
      $('message-total').textContent=data.total?'共 '+data.total+' 条':'公开留言';$('message-page').textContent=page+' / '+pages;$('message-prev').disabled=page<=1;$('message-next').disabled=page>=pages;
      if(!silent)status('');count();return data;
    }catch(e){if(current!==sequence||e.name==='AbortError'&&document.hidden)return;if(!ready)$('message-list').replaceChildren(element('p','message-empty','留言暂时无法加载，请点击刷新重试。'));if(!silent||!ready)status(e.name==='AbortError'?'连接超时，请点击刷新重试。':e.message,true)}finally{clearTimeout(timer)}
  }
  content.addEventListener('input',function(){requestId='';count()});author.addEventListener('input',function(){requestId=''});anonymous.addEventListener('change',anonymousChoice);anonymousChoice();
  form.addEventListener('submit',async function(e){
    e.preventDefault();if(busy)return;
    var text=content.value.trim(),name=author.value.trim(),anon=anonymous.checked;
    if(!anon&&(!name||Array.from(name).length>30)){status('请填写名字或编号，最多30字；也可以勾选匿名留言。',true);return}
    if(!text||Array.from(text).length>500){status('请填写1–500字的留言。',true);return}
    if(!requestId){var bytes=new Uint8Array(12);crypto.getRandomValues(bytes);requestId=Array.from(bytes,function(n){return n.toString(16).padStart(2,'0')}).join('')}
    busy=true;content.disabled=author.disabled=anonymous.disabled=true;count();status('正在发布…');
    try{await request('assessment-message-create',{content:text,author:anon?'':name,anonymous:anon,requestId:requestId});content.value='';requestId='';signature='';await load(1,true);$('message-list').scrollTop=0;status(anon?'匿名留言已发布，仅显示“匿名陪玩”。':'留言已发布，所有人都能看到。')}
    catch(error){if(error.status===403)await load(page,true);status(error.message,true)}finally{busy=false;content.disabled=anonymous.disabled=false;author.disabled=anonymous.checked;count()}
  });
  $('message-list').addEventListener('click',async function(e){var b=e.target.closest('[data-message-delete]');if(!b)return;if(!confirm('确定删除这条公开留言吗？'))return;b.disabled=true;try{await request('assessment-message-delete',{id:b.dataset.messageDelete});signature='';await load(page,true);status('留言已删除。');$('message-refresh').focus({preventScroll:true})}catch(error){status(error.message,true);b.disabled=false}});
  $('message-refresh').addEventListener('click',function(){load(page,false)});$('message-prev').addEventListener('click',function(){load(page-1,false);$('message-list').scrollTop=0});$('message-next').addEventListener('click',function(){load(page+1,false);$('message-list').scrollTop=0});
  load(1,false);setInterval(function(){if(!document.hidden&&!busy)load(page,true)},15000);document.addEventListener('visibilitychange',function(){if(!document.hidden&&!busy)load(page,true)});window.addEventListener('pageshow',function(e){if(e.persisted)load(page,true)});window.addEventListener('pagehide',function(){if(controller)controller.abort()});
}());

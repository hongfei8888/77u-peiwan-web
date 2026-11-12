(function(){
  'use strict';
  var links=Array.from(document.querySelectorAll('[data-platform]'));
  var sections=Array.from(document.querySelectorAll('.join-platform'));
  function platform(id){sections.forEach(function(s){s.hidden=s.id!==id+'-standards'});links.forEach(function(a){if(a.dataset.platform===id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});}
  links.forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();platform(a.dataset.platform)})});
  platform(location.hash==='#mobile-standards'?'mobile':'pc');
  sections.forEach(function(section){var buttons=Array.from(section.querySelectorAll('[data-rule]')),panels=Array.from(section.querySelectorAll('[data-rule-panel]'));function select(name){buttons.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.rule===name))});panels.forEach(function(p){p.hidden=p.dataset.rulePanel!==name})}buttons.forEach(function(b){b.addEventListener('click',function(){select(b.dataset.rule)})});select('single');});
  document.documentElement.classList.add('join-ready');
  // Dates are inclusive in the club's timezone, independent of the visitor's timezone.
  var today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function availability(group,enabled,date){var expired=date<today,unavailable=!enabled||expired;group.classList.toggle('is-expired',unavailable);group.querySelector('.join-group-status').textContent=!enabled?'暂未开放':expired?'待更新':'报名中';group.querySelector('.join-qr-link').hidden=unavailable;group.querySelector('.join-save').hidden=unavailable;var p=group.querySelector('.join-expired-message');if(p)p.remove();if(unavailable){p=document.createElement('p');p.className='join-expired-message';p.textContent=!enabled?'此报名入口暂未开放，如需咨询请联系客服。':'群二维码已过期，请联系客服获取最新报名入口。';group.querySelector('.join-group-heading').after(p)}}
  var groupTemplate=document.querySelector('.join-group').cloneNode(true),groupSignature=null;
  function renderGroups(data){
    var signature=JSON.stringify(data);if(signature===groupSignature)return;groupSignature=signature;
    var existing=Array.from(document.querySelectorAll('.join-group')),openIds=existing.filter(function(g){return g.open}).map(function(g){return g.dataset.group});
    existing.forEach(function(g){g.remove()});
    var enroll=document.getElementById('join-groups'),help=enroll.querySelector('.join-qr-help'),count=0;
    var empty=enroll.querySelector('.join-groups-empty');if(empty)empty.remove();
    ['assessment','appearance','group3','group4','group5','group6'].forEach(function(id){
      var g=data[id];if(!g||!g.src||!g.enabled)return;
      var url=new URL(g.src,location.href);if(url.origin!==location.origin)return;
      var group=groupTemplate.cloneNode(true);group.dataset.group=id;group.open=openIds.includes(id);
      group.querySelector('h3').textContent=g.name;group.querySelector('.join-group-name').textContent=g.name;
      var date=group.querySelector('time');date.dateTime=g.expires;date.textContent=g.expires.replace(/-/g,'.');
      var link=group.querySelector('.join-qr-link'),img=link.querySelector('img'),save=group.querySelector('.join-save');
      link.href=url.href;link.setAttribute('aria-label','放大'+g.name+'二维码');img.src=url.href;img.alt=g.name+'报名二维码';img.loading='lazy';save.href=url.href;save.download=g.name+'.png';
      group.querySelector('.join-qr-window').classList.toggle('is-full',g.display==='full');
      availability(group,g.enabled,g.expires);enroll.insertBefore(group,help);count++;
    });
    if(!count){empty=document.createElement('p');empty.className='join-groups-empty';empty.textContent='暂无开放的报名群，请联系客服获取报名入口。';enroll.insertBefore(empty,help)}
  }
  document.querySelectorAll('.join-group').forEach(function(group){availability(group,true,group.querySelector('time').dateTime)});
  var refreshing=false;
  async function refreshGroups(){if(refreshing)return;refreshing=true;var controller=new AbortController(),timer=setTimeout(function(){controller.abort()},5000);try{var response=await fetch('api/join.php?action=assessment',{cache:'no-store',credentials:'omit',signal:controller.signal});if(!response.ok)throw Error('unavailable');var data=await response.json();if(/^\d{4}-\d{2}-\d{2}$/.test(data.today))today=data.today;if(data.groups)renderGroups(data.groups);var values=data.content&&data.content.values;if(values)document.querySelectorAll('[data-join-field]').forEach(function(el){var value=values[el.dataset.joinField];if(typeof value==='string')el.textContent=value});document.getElementById('assessment-status').textContent='内容已更新'}catch(_){document.getElementById('assessment-status').textContent='最新内容暂时无法加载，请刷新或联系管理员确认。'}finally{clearTimeout(timer);refreshing=false}}
  refreshGroups();window.addEventListener('pageshow',function(e){if(e.persisted)refreshGroups()});
  setInterval(function(){if(!document.hidden)refreshGroups()},30000);document.addEventListener('visibilitychange',function(){if(!document.hidden)refreshGroups()});
}());

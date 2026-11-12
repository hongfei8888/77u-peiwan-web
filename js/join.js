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
  var announcements=[],announcementSignature=null,refreshing=false;
  var noticeDialog=document.getElementById('join-announcement-dialog'),noticeOpener=null,noticeOverflow='',activeNotice='';
  function dateLabel(value){return new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})}
  function imageUrl(src){if(!src)return '';try{var url=new URL(src,location.href);return url.origin===location.origin?url.href:''}catch(_){return ''}}
  function renderAnnouncements(items){
    var signature=JSON.stringify(items);if(signature===announcementSignature)return;announcementSignature=signature;announcements=items;
    var list=document.getElementById('join-bulletin-list'),scrollTop=list.scrollTop;list.replaceChildren();document.getElementById('join-bulletin-count').textContent=items.length+' 条通知';
    if(!items.length){var empty=document.createElement('p');empty.className='join-bulletin-empty';empty.textContent='暂无公告，最新招募通知将在这里发布。';list.appendChild(empty)}
    items.forEach(function(a,index){var button=document.createElement('button');button.type='button';button.className='join-bulletin-item';button.dataset.announcementId=a.id;button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','join-announcement-dialog');
      var copy=document.createElement('span');copy.className='join-bulletin-copy';var title=document.createElement('strong');title.textContent=a.title||'公告通知';copy.appendChild(title);
      var excerpt=document.createElement('span');excerpt.className='join-bulletin-excerpt';excerpt.textContent=a.text||'图片公告 · 点击查看';copy.appendChild(excerpt);
      var meta=document.createElement('span');meta.className='join-bulletin-meta';meta.textContent=(index===0?'最新 · ':'')+dateLabel(a.createdAt)+' · 查看详情';copy.appendChild(meta);button.appendChild(copy);
      var url=imageUrl(a.image);if(url){var img=document.createElement('img');img.src=url;img.alt='公告图片预览';img.loading='lazy';button.appendChild(img)}list.appendChild(button)});
    list.scrollTop=scrollTop;if(noticeDialog.open&&!items.some(function(a){return a.id===activeNotice}))noticeDialog.close();
  }
  document.getElementById('join-bulletin-list').addEventListener('click',function(event){var button=event.target.closest('[data-announcement-id]');if(!button)return;var a=announcements.find(function(a){return a.id===button.dataset.announcementId});if(!a)return;
    noticeOpener=button;activeNotice=a.id;noticeOverflow=document.body.style.overflow;
    document.getElementById('join-announcement-title').textContent=a.title;document.getElementById('join-announcement-time').textContent='发布于 '+dateLabel(a.createdAt);
    var text=document.getElementById('join-announcement-text');text.textContent=a.text;text.hidden=!a.text;
    var link=document.getElementById('join-announcement-image-link'),img=document.getElementById('join-announcement-image'),url=imageUrl(a.image);link.hidden=!url;if(url){link.href=url;img.src=url;img.alt=a.title+'公告图片'}else{link.removeAttribute('href');img.removeAttribute('src')}
    noticeDialog.showModal();document.body.style.overflow='hidden';
  });
  noticeDialog.querySelector('.report-close').addEventListener('click',function(){noticeDialog.close()});
  noticeDialog.addEventListener('click',function(event){var r=noticeDialog.getBoundingClientRect();if(event.target===noticeDialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))noticeDialog.close()});
  noticeDialog.addEventListener('close',function(){document.body.style.overflow=noticeOverflow;if(noticeOpener&&noticeOpener.isConnected)noticeOpener.focus({preventScroll:true});else document.getElementById('join-bulletin-title').focus({preventScroll:true});activeNotice=''});
  async function refreshGroups(){if(refreshing)return;refreshing=true;var controller=new AbortController(),timer=setTimeout(function(){controller.abort()},5000);try{var response=await fetch('api/join.php?action=groups',{cache:'no-store',credentials:'omit',signal:controller.signal});if(!response.ok)throw Error('unavailable');var data=await response.json();if(/^\d{4}-\d{2}-\d{2}$/.test(data.today))today=data.today;if(data.groups)renderGroups(data.groups);var values=data.content&&data.content.values;if(values)document.querySelectorAll('[data-join-field]').forEach(function(el){var value=values[el.dataset.joinField];if(typeof value==='string')el.textContent=value});renderAnnouncements(Array.isArray(data.announcements)?data.announcements:[])}catch(_){if(announcementSignature===null)document.getElementById('join-bulletin-list').textContent='公告暂时无法加载，请稍后刷新。'}finally{clearTimeout(timer);refreshing=false}}
  refreshGroups();window.addEventListener('pageshow',function(e){if(e.persisted)refreshGroups()});
  setInterval(function(){if(!document.hidden)refreshGroups()},30000);document.addEventListener('visibilitychange',function(){if(!document.hidden)refreshGroups()});
}());

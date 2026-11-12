/* Optional visuals only. Original auth, handlers, forms and requests own all state. */
(function(){
 'use strict';
 var main=document.querySelector('main');
 if(!main||!document.body.classList.contains('management-page')||!Element.prototype.animate||!window.IntersectionObserver)return;
 var reduced=matchMedia('(prefers-reduced-motion:reduce)'),enabled=true,seen=new WeakSet(),pending=new Set(),active=new Map(),messages=new Map(),snapshots=new Map(),snapshotTime=0,queued=false;
 try{enabled=localStorage.getItem('qiqiyou_lounge_effects')!=='off';}catch(_){}
 var ease='cubic-bezier(.16,1,.3,1)',panels='.admin-panel,.pa-panel,.qr-admin-panel,[data-admin-pane],[data-management-pane]',rows='.pa-person,.pa-section,.pa-slot,.admin-stat,.review-card,.admin-moment,.qr-announcement-card,.assessment-admin-card,.message-admin-card,.resource-admin-card,tbody>tr,#audit-list>*,#qr-audit>*';
 function allowed(){return enabled&&!reduced.matches&&!document.hidden;}
 function visible(el){return !el.closest('[hidden]')&&el.getBoundingClientRect().height>0;}
 function settle(el){var a=active.get(el);if(a){a.cancel();active.delete(el);}pending.delete(el);observer.unobserve(el);}
 function finishAll(){active.forEach(function(a){a.cancel();});active.clear();pending.forEach(function(el){observer.unobserve(el);});pending.clear();}
 function animate(el,frames,duration,delay){
  settle(el);if(!allowed()||!visible(el)||el.contains(document.activeElement))return;
  var a=el.animate(frames,{duration:duration,delay:delay||0,easing:ease,fill:'backwards'});a.mgOwned=true;active.set(el,a);
  a.finished.then(function(){if(active.get(el)===a)active.delete(el);a.cancel();},function(){if(active.get(el)===a)active.delete(el);});
 }
 function identity(el){
  var marker=el.querySelector('[data-person-move],[data-section],[data-notice-edit],[data-examiner-edit]'),parent=el.parentElement;
  var value=marker&&(marker.dataset.personMove||marker.dataset.section||marker.dataset.noticeEdit||marker.dataset.examinerEdit);
  if(!value){var img=el.querySelector('img');value=img?img.getAttribute('src'):el.textContent.trim().replace(/^\d+\s*/,'').slice(0,65);}
  return (parent.id||parent.className)+'|'+el.tagName+'|'+value;
 }
 function arrive(el,delay){
  var kind=el.dataset.mgMotion,old=performance.now()-snapshotTime<400&&snapshots.get(identity(el));
  if(kind==='row'&&old){var r=el.getBoundingClientRect();animate(el,[{opacity:.75,translate:(old.left-r.left)+'px '+(old.top-r.top)+'px'},{opacity:1,translate:'0 0'}],230,0);}
  else animate(el,[{opacity:kind==='row'?.55:.65,translate:'0 '+(kind==='row'?7:10)+'px'},{opacity:1,translate:'0 0'}],kind==='row'?180:230,delay);
 }
 var observer=new IntersectionObserver(function(entries){var n=0;entries.forEach(function(entry){if(!entry.isIntersecting)return;var el=entry.target;observer.unobserve(el);pending.delete(el);arrive(el,el.dataset.mgMotion==='row'?Math.min(n++*18,72):0);});},{threshold:.02,rootMargin:'0px 0px -8px 0px'});
 function register(el,kind){
  if(seen.has(el)||!visible(el)||el.closest('dialog')||el.closest('details:not([open])')&&el.closest('details:not([open])')!==el)return;
  seen.add(el);el.dataset.mgMotion=kind;if(allowed()){pending.add(el);observer.observe(el);}
 }
 function scan(){
  queued=false;
  active.forEach(function(_,el){if(!el.isConnected)settle(el);});pending.forEach(function(el){if(!el.isConnected)settle(el);});
  main.querySelectorAll(panels).forEach(function(el){var parent=el.parentElement.closest(panels);if(!parent||el.matches('[data-admin-pane],[data-management-pane]'))register(el,'panel');});
  main.querySelectorAll(rows).forEach(function(el){register(el,'row');});
  main.querySelectorAll('.management-page-heading').forEach(function(el){register(el,'heading');});
 }
 function queueScan(){if(!queued){queued=true;queueMicrotask(scan);}}
 var statusSelector='#pa-status,#qr-status,#admin-toast,#qr-content-status,#pa-change-state,[role="status"]';
 function feedback(){
  document.querySelectorAll(statusSelector).forEach(function(el){var text=el.textContent.trim(),previous=messages.get(el);messages.set(el,text);if(previous!==undefined&&previous!==text&&text&&visible(el))animate(el,[{opacity:.5},{opacity:1}],220,0);});
 }
 new MutationObserver(function(entries){
  var dirty=false;
  entries.forEach(function(e){
   if(e.type==='attributes'&&e.attributeName==='hidden'&&!e.target.hidden&&e.target.matches('[data-admin-pane],[data-management-pane]')){seen.add(e.target);e.target.dataset.mgMotion='panel';arrive(e.target,0);}
   if(e.type==='childList'||e.type==='attributes')dirty=true;
  });
  if(dirty)queueScan();feedback();
 }).observe(main,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
 // Status areas can sit above the main workspace.
 document.querySelectorAll(statusSelector).forEach(function(el){new MutationObserver(feedback).observe(el,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});});
 function remember(event){
  if(!allowed()||!event.target.closest('button,input[type=search],select'))return;
  snapshots.clear();snapshotTime=performance.now();
  var count=0;main.querySelectorAll(rows).forEach(function(el){if(count>80||!visible(el))return;var r=el.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;snapshots.set(identity(el),r);count++;});
 }
 ['click','input','change'].forEach(function(type){main.addEventListener(type,remember,true);});
 main.addEventListener('toggle',function(event){var details=event.target;if(details.tagName!=='DETAILS'||!details.open)return;Array.from(details.children).filter(function(el){return el.tagName!=='SUMMARY';}).forEach(function(el){animate(el,[{opacity:.5,translate:'0 -5px'},{opacity:1,translate:'0 0'}],220,0);});queueScan();},true);
 document.addEventListener('focusin',function(event){active.forEach(function(_,el){if(el.contains(event.target))settle(el);});});
 document.addEventListener('visibilitychange',function(){if(document.hidden)finishAll();});
 reduced.addEventListener('change',function(){if(reduced.matches)finishAll();});
 window.addEventListener('storage',function(event){if(event.key==='qiqiyou_lounge_effects'){enabled=event.newValue!=='off';if(!enabled)finishAll();}});
 window.addEventListener('pagehide',finishAll);
 feedback();scan();
}());

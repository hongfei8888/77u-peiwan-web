(function(){
  'use strict';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(min-width: 900px) and (pointer: fine)'),running=new Set(),observer;
  var ease='cubic-bezier(.22,1,.36,1)';
  function motion(el,frames,options){if(reduce.matches||!el||!el.animate)return null;var a=el.animate(frames,Object.assign({duration:380,easing:ease},options));running.add(a);a.finished.then(function(){running.delete(a)},function(){running.delete(a)});return a;}
  function reveal(el,delay){motion(el,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,delay:delay||0,fill:'backwards'});}
  var entries=Array.from(document.querySelectorAll('.join-process li,.join-notices,.join-supervision>div,.page-join .footer'));
  if('IntersectionObserver' in window){observer=new IntersectionObserver(function(items){var visible=items.filter(function(x){return x.isIntersecting});visible.forEach(function(item,i){observer.unobserve(item.target);item.target.dataset.motionSeen='true';reveal(item.target,Math.min(i*55,110))})},{threshold:0,rootMargin:'0px 0px 80px 0px'});entries.forEach(function(el){if(el.getBoundingClientRect().top<innerHeight+80){el.dataset.motionSeen='true';return}observer.observe(el)})}
  function panelReveal(section){if(!section)return;var panel=section.querySelector('[data-rule-panel]:not([hidden])');if(!panel)return;panel.getAnimations().forEach(function(a){a.cancel()});motion(panel,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:420});}
  document.addEventListener('click',function(event){var tab=event.target.closest('[data-platform],[data-rule]');if(!tab)return;panelReveal(document.querySelector('.join-platform:not([hidden])'));});
  document.querySelectorAll('.join-original').forEach(function(details){details.addEventListener('toggle',function(){if(details.open)motion(details.querySelector('.join-original-copy'),[{opacity:.4,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:250})});});
  // A small scroll offset on decorative artwork only; native scrolling remains intact.
  var art=document.querySelector('.join-intro-art'),hero=document.querySelector('.join-intro'),frame=0;
  function updateArt(){frame=0;if(!art||!hero)return;if(reduce.matches||!fine.matches){art.style.transform='';return}var r=hero.getBoundingClientRect();if(r.bottom<=0||r.top>=innerHeight)return;art.style.transform='translateY('+Math.max(-5,Math.min(5,(140-r.top)*.025)).toFixed(2)+'px)';}
  function scroll(){if(!frame&&!document.hidden&&!reduce.matches&&fine.matches)frame=requestAnimationFrame(updateArt)}
  window.addEventListener('scroll',scroll,{passive:true});fine.addEventListener('change',updateArt);
  function bindDialog(dialog,selector,prepare){if(!dialog)return;var opener=null,closing=false,bodyOverflow='';
    function open(event){if(typeof dialog.showModal!=='function')return;event.preventDefault();if(dialog.open)return;if(prepare&&prepare(event.currentTarget)===false)return;opener=event.currentTarget;bodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.classList.remove('is-closing');dialog.showModal();motion(dialog,[{opacity:0,transform:'translateY(16px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:360});}
    function close(){if(!dialog.open||closing)return;closing=true;dialog.getAnimations().forEach(function(a){a.cancel()});dialog.classList.add('is-closing');var a=motion(dialog,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(8px)'}],{duration:220,fill:'forwards'});function done(){dialog.close();dialog.classList.remove('is-closing');if(a)a.cancel();closing=false;}if(a)a.finished.then(done,done);else done();}
    document.addEventListener('click',function(event){var link=event.target.closest(selector);if(link)open({preventDefault:function(){event.preventDefault()},currentTarget:link})});dialog.querySelector('.report-close').addEventListener('click',close);dialog.addEventListener('cancel',function(e){e.preventDefault();close()});dialog.addEventListener('click',function(e){var r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))close()});dialog.addEventListener('close',function(){document.body.style.overflow=bodyOverflow;if(opener&&opener.isConnected)opener.focus({preventScroll:true})});
  }
  bindDialog(document.getElementById('report-dialog'),'[data-report-open]');
  bindDialog(document.getElementById('group-qr-dialog'),'[data-group-qr-open]',function(link){
    var group=link.closest('.join-group');if(!group||link.hidden)return false;
    var img=document.getElementById('group-modal-image'),status=document.getElementById('group-modal-status'),save=document.getElementById('group-modal-save');
    document.getElementById('group-modal-title').textContent=group.querySelector('h3').textContent;
    document.getElementById('group-modal-name').textContent=group.querySelector('.join-group-name').textContent;
    document.getElementById('group-modal-expiry').textContent=group.querySelector('.join-expiry').textContent;
    document.getElementById('group-modal-qr').classList.toggle('is-screenshot',!group.querySelector('.join-qr-window').classList.contains('is-full'));
    status.textContent='二维码加载中…';status.hidden=false;img.hidden=false;
    img.onload=function(){status.hidden=true;img.hidden=false};img.onerror=function(){img.hidden=true;status.hidden=false;status.textContent='二维码暂时加载失败，请关闭重试或联系客服。'};
    img.alt=group.querySelector('.join-group-name').textContent+'报名二维码';img.src=group.querySelector('.join-qr-window img').src;
    save.href=group.querySelector('.join-save').href;save.download=group.querySelector('.join-save').download;
    if(img.complete&&img.naturalWidth)status.hidden=true;
  });
  reduce.addEventListener('change',function(){if(reduce.matches){running.forEach(function(a){a.cancel()});if(frame)cancelAnimationFrame(frame);frame=0;}updateArt()});
  window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);frame=0;running.forEach(function(a){a.cancel()});});
}());

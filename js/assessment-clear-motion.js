(function () {
  'use strict';
  // A single motion owner for the page. Data/QR dialogs keep their existing owners.
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var motionReduced=reduce.matches;
  var coarse = matchMedia('(pointer: coarse)');
  var hero = document.querySelector('.arena-hero');
  var scene = document.querySelector('.arena-scene');
  var canvas = document.querySelector('.arena-particles');
  var gs = window.gsap, timelines = [], nativeAnimations = new Set(), openingTimelines=new Set(), openingNative=new Set(), observer;
  var currentNavigation=document.querySelector('.nav-link[href="assessment.html"]');
  if(currentNavigation){currentNavigation.classList.add('active');currentNavigation.setAttribute('aria-current','page')}
  var visualPreview=window.parent!==window&&new URLSearchParams(location.search).get('edit')==='1';
  var enabled=true,seen=new WeakSet(),observed=new WeakSet(),selectionTracks=new Map();
  try{enabled=localStorage.getItem('qiqiyou_lounge_effects')!=='off';}catch(_){}
  function allowed(){return enabled&&!motionReduced&&!document.hidden&&!visualPreview;}
  function arriving(el){return el&&window.QiqiyouNavigation&&window.QiqiyouNavigation.isArrivalElement(el);}
  function navigationPending(){return window.QiqiyouNavigation&&window.QiqiyouNavigation.isPending();}
  function holdTimeline(t){if(navigationPending()){t.pause(0);openingTimelines.add(t)}return t;}
  function shown(el){return !el.closest('[hidden]')&&el.getBoundingClientRect().height>0;}
  function stopEntrances(){
    nativeAnimations.forEach(function(a){a.cancel()});
    timelines.forEach(function(t){t.progress(1).kill()});timelines=[];
    openingTimelines.clear();openingNative.clear();
    if(observer)observer.disconnect();observed=new WeakSet();
  }
  function tween(el, frames, duration) {
    if (!el || !allowed() || !el.animate || !el.matches('dialog')&&el.contains(document.activeElement)) return null;
    var a = el.animate(frames, {duration:duration || 420,easing:'cubic-bezier(.22,1,.36,1)'});
    a.assessmentVisual=true;
    if(navigationPending()){a.pause();a.currentTime=0;openingNative.add(a);}
    nativeAnimations.add(a);
    a.finished.then(function(){nativeAnimations.delete(a)},function(){nativeAnimations.delete(a)});
    return a;
  }
  function reveal(el, delay) {
    if (!el || seen.has(el) || !shown(el)) return;
    seen.add(el);if(!allowed()||el.contains(document.activeElement))return;
    var heading=el.matches('.arena-section-heading,h2,.assessment-resources-heading'),card=el.matches('.assessment-document,.assessment-resource,.assessment-group-entry,.assessment-examiner-item,.assessment-notice-item');
    el.dataset.assessmentMotion=heading?'heading':card?'card':'panel';
    if (gs) {
      var from=heading?{y:14,opacity:.35,clipPath:'inset(0 0 85% 0)'}:card?{y:22,scale:.975,opacity:.3,clipPath:'inset(0 0 8% 0 round 8px)'}:{y:16,opacity:.55};
      var t = gs.fromTo(el,from,{y:0,scale:1,opacity:1,clipPath:'inset(0)',duration:heading?.6:card?.54:.46,delay:delay || 0,ease:'power3.out',clearProps:'transform,opacity,clipPath'});
      timelines.push(holdTimeline(t));
    } else tween(el,[{opacity:.4,translate:'0 20px',clipPath:'inset(0 0 8% 0)'},{opacity:1,translate:'0 0',clipPath:'inset(0)'}],540);
  }
  if (allowed()) {
    if (gs) {
      var intro = gs.timeline({defaults:{ease:'power3.out'}});
      intro.fromTo('.arena-scene img',{scale:1.045},{scale:1,duration:.85,clearProps:'transform'},0)
        .fromTo('.arena-kicker',{y:9,opacity:.4},{y:0,opacity:1,duration:.4,clearProps:'transform,opacity'},.03)
        .fromTo('.arena-copy h1>span',{y:18,opacity:.25,clipPath:'inset(0 0 90% 0)'},{y:0,opacity:1,clipPath:'inset(0)',duration:.68,stagger:.07,clearProps:'transform,opacity,clipPath'},.08)
        .fromTo('.arena-lead,.arena-actions',{y:14,opacity:.3},{y:0,opacity:1,duration:.48,stagger:.08,clearProps:'transform,opacity'},.23);
      timelines.push(holdTimeline(intro));
    } else reveal(document.querySelector('.arena-copy'));
  }
  document.addEventListener('qiqiyou:page-arrival',function(){
    nativeAnimations.forEach(function(a){if(arriving(a.effect&&a.effect.target)){a.pause();a.currentTime=0;openingNative.add(a)}});
    timelines.forEach(function(t){
      var tweens=t.getChildren?t.getChildren(true,true,false):[t];
      if(tweens.some(function(tween){return tween.targets().some(arriving)})){t.pause(0);openingTimelines.add(t)}
    });
  });
  document.addEventListener('qiqiyou:page-prepare',function(){
    if(!allowed())return;
    var n=0;document.querySelectorAll(revealTargets).forEach(function(el){if(arriving(el))reveal(el,Math.min(n++*.045,.15))});
  });
  document.addEventListener('qiqiyou:page-ready',function(){
    openingTimelines.forEach(function(t){if(allowed())t.play();else t.progress(1).kill()});openingTimelines.clear();
    openingNative.forEach(function(a){if(allowed()&&a.playState!=='idle')a.play();else a.cancel()});openingNative.clear();
  });
  if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function(entries){
        var index=0;
        entries.forEach(function(entry){
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          reveal(entry.target,Math.min(index++*.045,.15));
        });
      },{threshold:.06,rootMargin:'0px 0px -28px 0px'});
  }
  var revealTargets='.arena-section-heading,.assessment-resources-heading,.assessment-document,.assessment-resource,.join-notices,.club-enrol-panel,.assessment-quality,.join-supervision,.assessment-groups,.assessment-examiners,.assessment-message-board,.join-platform>header h2,.join-table-wrap,.join-facts,.join-deposits,.management-document-section,.talent-rule-card,.assessment-service-reminder,.assessment-notice-item,.assessment-group-entry,.assessment-examiner-preview-item';
  function watch(){
    if(!allowed())return;
    document.querySelectorAll(revealTargets).forEach(function(el){if(el.closest('dialog')||seen.has(el)||observed.has(el)||!shown(el))return;if(observer){observed.add(el);observer.observe(el)}else reveal(el,0)});
  }
  var scanQueued=false;
  var main=document.querySelector('main');
  if(main)new MutationObserver(function(entries){if(scanQueued||!entries.some(function(e){return e.addedNodes.length||e.type==='attributes'}))return;scanQueued=true;queueMicrotask(function(){scanQueued=false;watch()});}).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  document.addEventListener('click',function(e){
    var button=e.target.closest('[data-platform],[data-rule],[data-quality-kind]');
    if(!button)return;
    var section=document.querySelector('.join-platform:not([hidden])');
    var kind=section&&section.querySelector('[data-quality-panel]:not([hidden])');
    var panel=section&&((kind||section).querySelector('[data-rule-panel]:not([hidden])')||kind||section);
    if(!panel)return;
    panel.getAnimations().forEach(function(a){a.cancel()});
    var surfaces=[panel].concat(Array.from(panel.querySelectorAll(revealTargets)));
    if(gs)gs.killTweensOf(surfaces);
    surfaces.forEach(function(el){el.style.removeProperty('transform');el.style.removeProperty('opacity');el.style.removeProperty('clip-path')});
    panel.querySelectorAll(revealTargets).forEach(function(el){seen.add(el);if(observer)observer.unobserve(el)});
    tween(panel,[{opacity:.4,translate:'0 13px',clipPath:'inset(0 0 4% 0)'},{opacity:1,translate:'0 0',clipPath:'inset(0)'}],330);
  });

  function selectionTrack(host){
    if(selectionTracks.has(host)||visualPreview)return;
    host.classList.add('assessment-motion-tabs');var mark=document.createElement('i');mark.className='assessment-selection-track';mark.setAttribute('aria-hidden','true');host.append(mark);
    function move(target){target=target||host.querySelector('[aria-current="true"],[aria-pressed="true"]');if(!target||!shown(target)){mark.style.opacity='0';return}var a=host.getBoundingClientRect(),b=target.getBoundingClientRect();mark.style.width=b.width+'px';mark.style.translate=(b.left-a.left+host.scrollLeft)+'px 0';mark.style.opacity='1';}
    host.addEventListener('focusin',function(e){var t=e.target.closest('[data-platform],[data-rule],[data-quality-kind]');if(t)move(t)});
    host.addEventListener('focusout',function(){queueMicrotask(function(){if(!host.contains(document.activeElement))move()})});
    host.addEventListener('click',function(){queueMicrotask(function(){move()})});
    new MutationObserver(function(){move()}).observe(host,{attributes:true,subtree:true,attributeFilter:['aria-current','aria-pressed']});new ResizeObserver(function(){move()}).observe(host);selectionTracks.set(host,move);move();
  }
  document.querySelectorAll('[data-platform],[data-rule],[data-quality-kind]').forEach(function(button){selectionTrack(button.parentElement)});
  if(document.fonts)document.fonts.ready.then(function(){selectionTracks.forEach(function(move){move()})});
  var switcher;
  if(!visualPreview){var actions=document.querySelector('.platform-topbar-actions,.arena-actions');if(actions){switcher=document.createElement('button');switcher.type='button';switcher.className='assessment-motion-toggle';switcher.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z"/></svg>';actions.append(switcher);switcher.addEventListener('click',function(){enabled=!enabled;try{localStorage.setItem('qiqiyou_lounge_effects',enabled?'on':'off')}catch(_){}preferences()})}}
  document.addEventListener('focusin',function(e){var el=e.target.closest('[data-assessment-motion]');if(!el)return;if(gs)gs.killTweensOf(el);el.style.removeProperty('transform');el.style.removeProperty('opacity');el.style.removeProperty('clip-path');nativeAnimations.forEach(function(a){if(a.effect&&a.effect.target===el)a.cancel()});});

  // Airborne particles and camera depth share one throttled rendering loop.
  var context=canvas&&canvas.getContext('2d'), width=0,height=0,particles=[], raf=0,last=0,visible=true;
  var pointer={x:0,y:0},camera={x:0,y:0},dead=false,heroObserver,sizeObserver;
  function size(){
    if(!hero||!context)return;
    var rect=hero.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,coarse.matches?1:1.5);
    width=rect.width;height=rect.height;
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    var count=width<760?12:28;
    particles=Array.from({length:count},function(){return{x:width*(.57+Math.random()*.43),y:Math.random()*height,r:Math.random()*1.4+.45,vx:Math.random()*12+7,vy:Math.random()*-10-5,phase:Math.random()*6.28}});
    canvas.dataset.particles=String(count);
  }
  function shouldRun(){return !dead&&allowed()&&visible&&!!context}
  function run(t){
    raf=0;
    if(!shouldRun()){if(canvas)canvas.dataset.state='paused';return}
    if(t-last<32){raf=requestAnimationFrame(run);return}
    var dt=Math.min((t-last)/1000,.06);last=t;
    context.clearRect(0,0,width,height);
    particles.forEach(function(p){
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.y<-5){p.y=height+5;p.x=width*(.57+Math.random()*.43)}
      if(p.x>width+5)p.x=width*.57;
      var alpha=.17+(Math.sin(t*.0006+p.phase)+1)*.2;
      context.fillStyle='rgba(92,141,211,'+alpha+')';
      context.fillRect(p.x,p.y,p.r,p.r*1.8);
      if(p.r>1.5){context.fillStyle='rgba(163,199,245,.06)';context.beginPath();context.arc(p.x,p.y,p.r*4,0,6.283);context.fill()}
    });
    if(scene&&!coarse.matches){
      var scrollDepth=Math.max(-1,Math.min(1,-hero.getBoundingClientRect().top/height));
      camera.x+=(pointer.x*6-camera.x)*.06;
      camera.y+=((pointer.y*4+scrollDepth*8)-camera.y)*.06;
      scene.style.transform='translate3d('+camera.x.toFixed(2)+'px,'+camera.y.toFixed(2)+'px,0)';
    }
    canvas.dataset.state='running';
    raf=requestAnimationFrame(run);
  }
  function sync(){
    if(shouldRun()){if(!raf){last=performance.now();raf=requestAnimationFrame(run)}}
    else{if(raf)cancelAnimationFrame(raf);raf=0;if(canvas)canvas.dataset.state='paused';if(!allowed()){if(context)context.clearRect(0,0,width,height);if(scene)scene.style.transform=''}}
  }
  if(hero&&context){
    size();
    if('ResizeObserver' in window){sizeObserver=new ResizeObserver(size);sizeObserver.observe(hero)}
    else window.addEventListener('resize',size,{passive:true});
    if('IntersectionObserver' in window){heroObserver=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync()});heroObserver.observe(hero)}
    hero.addEventListener('pointermove',function(e){if(coarse.matches||!allowed())return;var r=hero.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=(e.clientY-r.top)/r.height*2-1},{passive:true});
    hero.addEventListener('pointerleave',function(){pointer.x=pointer.y=0},{passive:true});
    document.addEventListener('visibilitychange',preferences);sync();
  }
  document.querySelectorAll('.assessment-document').forEach(function(card){
    var pending=0,point=null;
    card.addEventListener('pointermove',function(e){
      if(coarse.matches||!allowed())return;
      point={x:e.clientX,y:e.clientY};
      if(pending)return;
      pending=requestAnimationFrame(function(){
        pending=0;if(!point)return;var rect=card.getBoundingClientRect(),x=point.x-rect.left,y=point.y-rect.top;
        card.style.setProperty('--pointer-x',x+'px');card.style.setProperty('--pointer-y',y+'px');
        card.style.setProperty('--tilt-x',((.5-y/rect.height)*6).toFixed(2)+'deg');card.style.setProperty('--tilt-y',((x/rect.width-.5)*7).toFixed(2)+'deg');
      });
    },{passive:true});
    card.addEventListener('pointerleave',function(){point=null;card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y')},{passive:true});
  });
  var links=Array.from(document.querySelectorAll('.arena-section-nav a')),activeFrame=0;
  function navigationState(){
    activeFrame=0;var active=null,best=-Infinity;
    links.forEach(function(link){var target=document.querySelector(link.getAttribute('href'));if(target){var top=target.getBoundingClientRect().top;if(top<innerHeight*.48&&top>best){best=top;active=link}}});
    links.forEach(function(link){link.classList.toggle('is-active',link===active)});
  }
  window.addEventListener('scroll',function(){if(!activeFrame)activeFrame=requestAnimationFrame(navigationState)},{passive:true});navigationState();

  // The reporting QR dialog was formerly owned by assessment-club-motion.js.
  var dialog=document.getElementById('report-dialog'),opener=null,overflow='',closing=false;
  document.addEventListener('click',function(e){
    var link=e.target.closest('[data-report-open]');if(!link||!dialog)return;
    e.preventDefault();if(dialog.open)return;opener=link;overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();
    tween(dialog,[{opacity:0,transform:'translateY(20px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],340);
  });
  function close(){
    if(!dialog||!dialog.open||closing)return;closing=true;
    dialog.getAnimations().forEach(function(a){a.cancel()});
    var a=tween(dialog,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(9px)'}],170);
    function done(){dialog.close();closing=false}
    if(a)a.finished.then(done,done);else done();
  }
  if(dialog){
    dialog.querySelector('.report-close').addEventListener('click',close);
    dialog.addEventListener('cancel',function(e){e.preventDefault();close()});
    dialog.addEventListener('click',function(e){var r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))close()});
    dialog.addEventListener('close',function(){document.body.style.overflow=overflow;if(opener&&opener.isConnected)opener.focus({preventScroll:true})});
  }
  function preferences(){
    document.body.classList.toggle('assessment-motion-paused',!enabled||motionReduced||visualPreview);
    if(switcher){switcher.disabled=motionReduced;switcher.setAttribute('aria-pressed',String(enabled&&!motionReduced));switcher.setAttribute('aria-label',motionReduced?'系统已开启减少动态':enabled?'关闭氛围特效':'开启氛围特效');switcher.title=switcher.getAttribute('aria-label')}
    if(!allowed())stopEntrances();else watch();sync();
  }
  reduce.addEventListener('change',function(event){motionReduced=event.matches;preferences()});
  window.addEventListener('storage',function(e){if(e.key==='qiqiyou_lounge_effects'){enabled=e.newValue!=='off';preferences()}});
  window.addEventListener('pagehide',function(e){
    stopEntrances();
    if(e.persisted){visible=false;sync();return}
    dead=true;sync();nativeAnimations.forEach(function(a){a.cancel()});timelines.forEach(function(t){t.kill()});
    if(observer)observer.disconnect();if(heroObserver)heroObserver.disconnect();if(sizeObserver)sizeObserver.disconnect();if(activeFrame)cancelAnimationFrame(activeFrame);
  });
  window.addEventListener('pageshow',function(e){if(e.persisted){visible=!!hero&&hero.getBoundingClientRect().bottom>0&&hero.getBoundingClientRect().top<innerHeight;preferences()}});
  preferences();
}());

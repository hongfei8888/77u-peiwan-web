(function () {
  'use strict';
  // A single motion owner for the page. Data/QR dialogs keep their existing owners.
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var coarse = matchMedia('(pointer: coarse)');
  var hero = document.querySelector('.arena-hero');
  var scene = document.querySelector('.arena-scene');
  var canvas = document.querySelector('.arena-particles');
  var gs = window.gsap, timelines = [], nativeAnimations = new Set(), observer;
  function tween(el, frames, duration) {
    if (!el || reduce.matches || !el.animate) return null;
    var a = el.animate(frames, {duration:duration || 420,easing:'cubic-bezier(.22,1,.36,1)'});
    nativeAnimations.add(a);
    a.finished.then(function(){nativeAnimations.delete(a)},function(){nativeAnimations.delete(a)});
    return a;
  }
  function reveal(el, delay) {
    if (!el || reduce.matches) return;
    if (gs) {
      var t = gs.fromTo(el,{y:28,opacity:.2},{y:0,opacity:1,duration:.85,delay:delay || 0,ease:'power3.out',clearProps:'transform,opacity'});
      timelines.push(t);
    } else tween(el,[{opacity:.2,transform:'translateY(28px)'},{opacity:1,transform:'none'}],850);
  }
  if (!reduce.matches) {
    if (gs) {
      var intro = gs.timeline({defaults:{ease:'power3.out'}});
      intro.fromTo('.arena-scene img',{scale:1.07},{scale:1,duration:1.65,clearProps:'transform'},0)
        .fromTo('.arena-kicker',{y:18,opacity:0},{y:0,opacity:1,duration:.65,clearProps:'transform,opacity'},.08)
        .fromTo('.arena-copy h1>span',{y:42,opacity:0},{y:0,opacity:1,duration:.92,stagger:.13,clearProps:'transform,opacity'},.2)
        .fromTo('.arena-lead,.arena-actions',{y:22,opacity:0},{y:0,opacity:1,duration:.75,stagger:.12,clearProps:'transform,opacity'},.58)
        .fromTo('.arena-foot',{opacity:0},{opacity:1,duration:1,clearProps:'opacity'},.8);
      timelines.push(intro);
    } else reveal(document.querySelector('.arena-copy'));
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          if (entry.target.matches('.assessment-documents')) {
            entry.target.querySelectorAll('.assessment-document').forEach(function(el,i){reveal(el,i*.085)});
          } else reveal(entry.target);
        });
      },{threshold:.06,rootMargin:'0px 0px -28px 0px'});
      document.querySelectorAll('.arena-section-heading,.assessment-documents,.join-content,.club-enrol-panel,.assessment-quality,.join-supervision').forEach(function(el){observer.observe(el)});
    }
  }
  document.addEventListener('click',function(e){
    var button=e.target.closest('[data-platform],[data-rule]');
    if(!button)return;
    var section=document.querySelector('.join-platform:not([hidden])');
    var panel=section&&section.querySelector('[data-rule-panel]:not([hidden])');
    if(!panel)return;
    panel.getAnimations().forEach(function(a){a.cancel()});
    tween(panel,[{opacity:.15,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],460);
  });

  // Airborne particles and camera depth share one throttled rendering loop.
  var context=canvas&&canvas.getContext('2d'), width=0,height=0,particles=[], raf=0,last=0,visible=true;
  var pointer={x:0,y:0},camera={x:0,y:0},dead=false,heroObserver,sizeObserver;
  function size(){
    if(!hero||!context)return;
    var rect=hero.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,coarse.matches?1:1.5);
    width=rect.width;height=rect.height;
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    var count=width<760?24:64;
    particles=Array.from({length:count},function(){return{x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.4+.45,vx:Math.random()*12+7,vy:Math.random()*-10-5,phase:Math.random()*6.28}});
    canvas.dataset.particles=String(count);
  }
  function shouldRun(){return !dead&&!reduce.matches&&!document.hidden&&visible&&!!context}
  function run(t){
    raf=0;
    if(!shouldRun()){if(canvas)canvas.dataset.state='paused';return}
    if(t-last<32){raf=requestAnimationFrame(run);return}
    var dt=Math.min((t-last)/1000,.06);last=t;
    context.clearRect(0,0,width,height);
    particles.forEach(function(p){
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.y<-5){p.y=height+5;p.x=Math.random()*width}
      if(p.x>width+5)p.x=-5;
      var alpha=.17+(Math.sin(t*.0006+p.phase)+1)*.2;
      context.fillStyle='rgba(220,243,130,'+alpha+')';
      context.fillRect(p.x,p.y,p.r,p.r*1.8);
      if(p.r>1.5){context.fillStyle='rgba(221,242,135,.06)';context.beginPath();context.arc(p.x,p.y,p.r*4,0,6.283);context.fill()}
    });
    if(scene&&!coarse.matches){
      var scrollDepth=Math.max(-1,Math.min(1,-hero.getBoundingClientRect().top/height));
      camera.x+=(pointer.x*11-camera.x)*.06;
      camera.y+=((pointer.y*7+scrollDepth*16)-camera.y)*.06;
      scene.style.transform='translate3d('+camera.x.toFixed(2)+'px,'+camera.y.toFixed(2)+'px,0)';
    }
    canvas.dataset.state='running';
    raf=requestAnimationFrame(run);
  }
  function sync(){
    if(shouldRun()){if(!raf){last=performance.now();raf=requestAnimationFrame(run)}}
    else{if(raf)cancelAnimationFrame(raf);raf=0;if(canvas)canvas.dataset.state='paused';if(reduce.matches){if(context)context.clearRect(0,0,width,height);if(scene)scene.style.transform=''}}
  }
  if(hero&&context){
    size();
    if('ResizeObserver' in window){sizeObserver=new ResizeObserver(size);sizeObserver.observe(hero)}
    else window.addEventListener('resize',size,{passive:true});
    if('IntersectionObserver' in window){heroObserver=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync()});heroObserver.observe(hero)}
    hero.addEventListener('pointermove',function(e){if(coarse.matches||reduce.matches)return;var r=hero.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=(e.clientY-r.top)/r.height*2-1},{passive:true});
    hero.addEventListener('pointerleave',function(){pointer.x=pointer.y=0},{passive:true});
    document.addEventListener('visibilitychange',sync);sync();
  }
  document.querySelectorAll('.assessment-document').forEach(function(card){
    var pending=0,point=null;
    card.addEventListener('pointermove',function(e){
      if(coarse.matches||reduce.matches)return;
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
    activeFrame=0;var active=null;
    links.forEach(function(link){var target=document.querySelector(link.getAttribute('href'));if(target&&target.getBoundingClientRect().top<innerHeight*.48)active=link});
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
  reduce.addEventListener('change',function(){
    if(reduce.matches){
      nativeAnimations.forEach(function(a){a.cancel()});
      timelines.forEach(function(t){t.progress(1).kill()});
      if(observer)observer.disconnect();
    }
    sync();
  });
  window.addEventListener('pagehide',function(e){
    if(e.persisted){visible=false;sync();return}
    dead=true;sync();nativeAnimations.forEach(function(a){a.cancel()});timelines.forEach(function(t){t.kill()});
    if(observer)observer.disconnect();if(heroObserver)heroObserver.disconnect();if(sizeObserver)sizeObserver.disconnect();if(activeFrame)cancelAnimationFrame(activeFrame);
  });
  window.addEventListener('pageshow',function(e){if(e.persisted){visible=!!hero&&hero.getBoundingClientRect().bottom>0&&hero.getBoundingClientRect().top<innerHeight;sync()}});
}());

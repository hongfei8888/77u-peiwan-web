(function(){
 'use strict';
 var reduced=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 var enabled=true,active=true,seen=new Set(),gliders=new Map(),snapshots=new Map(),owned=new Set();
 try{enabled=localStorage.getItem('qiqiyou_lounge_effects')!=='off';}catch(_){}
 function animate(el,frames,options){var a=el.animate(frames,options);owned.add(a);a.finished.then(function(){owned.delete(a);},function(){owned.delete(a);});return a;}
 function cancelOwned(){owned.forEach(function(a){a.cancel();});owned.clear();}
 var liveObserver=new IntersectionObserver(function(entries){entries.forEach(function(e){e.target.classList.toggle('fx-live',e.isIntersecting);});},{threshold:0});
 var header=document.querySelector('.platform-topbar-actions'),switcher;
 if(header){switcher=document.createElement('button');switcher.type='button';switcher.className='fx-motion-switch';switcher.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z"/></svg><span>特效</span>';header.prepend(switcher);switcher.addEventListener('click',function(){enabled=!enabled;try{localStorage.setItem('qiqiyou_lounge_effects',enabled?'on':'off');}catch(_){}sync();});}
 var canvas=document.createElement('canvas');canvas.className='fx-interaction-canvas';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 var ctx=canvas.getContext('2d'),trail=[],sparks=[],rings=[],frame=0,lastDraw=0,pointFrame=0,latest=null,viewportW=0,viewportH=0;
 function resize(){viewportW=innerWidth;viewportH=innerHeight;var dpr=Math.min(devicePixelRatio||1,1.25);canvas.width=Math.round(viewportW*dpr);canvas.height=Math.round(viewportH*dpr);if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);gliders.forEach(function(state){state.move();});}
 function schedule(){if(active&&ctx&&!frame&&(trail.length||sparks.length||rings.length))frame=requestAnimationFrame(drawInteraction);}
 function drawInteraction(now){
  frame=0;if(!active||!ctx)return;
  if(now-lastDraw<31){frame=requestAnimationFrame(drawInteraction);return;}lastDraw=now;
  ctx.clearRect(0,0,viewportW,viewportH);trail=trail.filter(function(p){return now-p.t<330;});sparks=sparks.filter(function(s){return now-s.t<510;});rings=rings.filter(function(s){return now-s.t<450;});
  if(trail.length>1){
   for(var i=1;i<trail.length;i++){var p=trail[i],old=trail[i-1],alpha=(1-(now-p.t)/330)*.65;ctx.strokeStyle='rgba(168,126,255,'+alpha+')';ctx.lineWidth=2.8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(old.x,old.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.strokeStyle='rgba(162,230,245,'+(alpha*.75)+')';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(old.x,old.y+2);ctx.lineTo(p.x,p.y+2);ctx.stroke();}
  }
  sparks.forEach(function(s){var age=(now-s.t)/510,ease=1-Math.pow(1-age,3),distance=8+s.distance*ease,x=s.x+Math.cos(s.angle)*distance,y=s.y+Math.sin(s.angle)*distance;ctx.globalAlpha=(1-age)*.95;ctx.strokeStyle=s.color;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(s.angle)*(7*(1-age)+1),y+Math.sin(s.angle)*(7*(1-age)+1));ctx.stroke();});
  rings.forEach(function(s){var age=(now-s.t)/450;ctx.globalAlpha=(1-age)*.5;ctx.strokeStyle='#c49bff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(s.x,s.y,5+age*25,0,Math.PI*2);ctx.stroke();});ctx.globalAlpha=1;schedule();
 }
 function clearInteraction(){cancelAnimationFrame(frame);frame=0;trail=[];sparks=[];rings=[];if(ctx)ctx.clearRect(0,0,viewportW,viewportH);}
 function sync(){
  active=enabled&&!reduced.matches&&!document.hidden;
  document.body.classList.toggle('fx-user-paused',!enabled||reduced.matches);
  if(switcher){switcher.setAttribute('aria-pressed',String(enabled&&!reduced.matches));switcher.disabled=reduced.matches;switcher.setAttribute('aria-label',reduced.matches?'系统已开启减少动态':enabled?'关闭氛围特效':'开启氛围特效');switcher.title=switcher.getAttribute('aria-label');}
  if(!active){clearInteraction();cancelOwned();document.querySelectorAll('.fx-magnetic').forEach(function(b){b.style.setProperty('--fx-magnet-x','0px');b.style.setProperty('--fx-magnet-y','0px');});}
  document.dispatchEvent(new CustomEvent('qiqiyou:motion-change',{detail:{enabled:active}}));
 }
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);fine.addEventListener('change',function(){trail=[];});
 window.addEventListener('resize',resize,{passive:true});window.addEventListener('pagehide',function(){active=false;clearInteraction();cancelOwned();cancelAnimationFrame(pointFrame);});window.addEventListener('pageshow',function(e){sync();if(e.persisted)gliders.forEach(function(state){state.reset();});});
 document.addEventListener('pointermove',function(e){
  if(!active||!fine.matches)return;latest={x:e.clientX,y:e.clientY,target:e.target};
  if(!e.target.closest('dialog,input,textarea,select')){var previous=trail[trail.length-1];if(!previous||Math.hypot(previous.x-e.clientX,previous.y-e.clientY)>3){trail.push({x:e.clientX,y:e.clientY,t:performance.now()});if(trail.length>28)trail.shift();schedule();}}
  if(pointFrame)return;pointFrame=requestAnimationFrame(function(){
   pointFrame=0;if(!active||!latest)return;
   var button=latest.target.closest('.fx-magnetic');if(button){var r=button.getBoundingClientRect();button.style.setProperty('--fx-magnet-x',Math.max(-5,Math.min(5,(latest.x-r.left-r.width/2)*.09))+'px');button.style.setProperty('--fx-magnet-y',Math.max(-4,Math.min(4,(latest.y-r.top-r.height/2)*.12))+'px');}
   var hero=latest.target.closest('.fx-hero-ready');if(hero){var r=hero.getBoundingClientRect();hero.style.setProperty('--hero-pan-x',((latest.x-r.left)/r.width-.5)*9+'px');hero.style.setProperty('--hero-pan-y',((latest.y-r.top)/r.height-.5)*7+'px');}
   var game=latest.target.closest('.poster-menu-card--feature');if(game){var r=game.getBoundingClientRect();game.style.setProperty('--fx-media-x',((latest.x-r.left)/r.width-.5)*9+'px');game.style.setProperty('--fx-media-y',((latest.y-r.top)/r.height-.5)*7+'px');}
  });
 },{passive:true});
 document.addEventListener('pointerout',function(e){var b=e.target.closest('.fx-magnetic');if(b&&!b.contains(e.relatedTarget)){b.style.setProperty('--fx-magnet-x','0px');b.style.setProperty('--fx-magnet-y','0px');}var hero=e.target.closest('.fx-hero-ready');if(hero&&!hero.contains(e.relatedTarget)){hero.style.setProperty('--hero-pan-x','0px');hero.style.setProperty('--hero-pan-y','0px');}var game=e.target.closest('.poster-menu-card--feature');if(game&&!game.contains(e.relatedTarget)){game.style.setProperty('--fx-media-x','0px');game.style.setProperty('--fx-media-y','0px');}});
 window.addEventListener('click',function(e){
  var button=e.target.closest('button,a');if(!active||!button||button.matches(':disabled,.fx-motion-switch')||button.closest('dialog'))return;
  var r=button.getBoundingClientRect(),x=e.detail?e.clientX:r.left+r.width/2,y=e.detail?e.clientY:r.top+r.height/2,t=performance.now(),count=fine.matches?10:6;
  for(var i=0;i<count;i++)sparks.push({x:x,y:y,t:t,angle:Math.PI*2*i/count-.2,distance:18+(i%3)*7,color:i%2?'#bc91ff':'#a1e7f2'});
  if(sparks.length>100)sparks.splice(0,sparks.length-100);rings.push({x:x,y:y,t:t});if(rings.length>8)rings.shift();schedule();
 });
 function glider(menu){
  if(gliders.has(menu))return gliders.get(menu).move();
  var mark=null,hover=null,positioned=false;
  function move(target){
   if(!mark||!mark.isConnected){mark=document.createElement('i');mark.className='fx-glider';mark.setAttribute('aria-hidden','true');positioned=false;}
   var selected=menu.querySelector(':scope>.is-active,:scope>.active');target=target&&target.isConnected?target:hover&&hover.isConnected?hover:selected;
   if(!target||!target.getBoundingClientRect().width){mark.style.opacity='0';return;}
   var a=menu.getBoundingClientRect(),b=target.getBoundingClientRect();mark.style.width=b.width+'px';mark.style.height=b.height+'px';mark.style.transform='translate('+(b.left-a.left+menu.scrollLeft)+'px,'+(b.top-a.top+menu.scrollTop)+'px)';mark.style.opacity='1';
   // Attach at the real selected position before enabling transitions. A fresh
   // document must never animate its indicator from the menu's top-left origin.
   if(!mark.isConnected)menu.prepend(mark);
   menu.classList.add('fx-glide-ready');
   if(!positioned){positioned=true;var initial=mark;requestAnimationFrame(function(){requestAnimationFrame(function(){if(initial.isConnected)initial.classList.add('fx-glider-positioned');});});}
  }
  menu.addEventListener('pointerover',function(e){var b=e.target.closest('a.nav-link,button');if(b&&b.parentElement===menu){hover=b;move(b);}});
  menu.addEventListener('pointerleave',function(){hover=null;move();});
  menu.addEventListener('focusin',function(e){var b=e.target.closest('a.nav-link,button');if(b&&b.parentElement===menu)move(b);});
  menu.addEventListener('focusout',function(){queueMicrotask(function(){if(!menu.contains(document.activeElement))move();});});
  menu.addEventListener('click',function(e){var target=e.target.closest('a.nav-link,button');if(!target)return;if(target.matches('a.nav-link')){hover=target;move(target);return;}queueMicrotask(function(){hover=null;move();});});
  new MutationObserver(function(){move();}).observe(menu,{childList:true});new ResizeObserver(function(){move();}).observe(menu);
  gliders.set(menu,{move:move,reset:function(){hover=null;positioned=false;if(mark)mark.classList.remove('fx-glider-positioned');move();}});move();
 }
 function decorate(root){
  root.querySelectorAll('.nav-links,.category-strip,.platform-home-filters,.forum-categories').forEach(glider);
  root.querySelectorAll('.platform-feature .button-primary,.companion-actions .button-primary,.platform-help .button-primary').forEach(function(b){b.classList.add('fx-magnetic');});
  root.querySelectorAll('.platform-feature').forEach(function(hero){if(seen.has(hero))return;seen.add(hero);hero.classList.add('fx-hero-ready');var dust=document.createElement('i');dust.className='fx-stardust';dust.setAttribute('aria-hidden','true');for(var i=0;i<12;i++){var star=document.createElement('i');star.className='fx-star-dot';star.style.cssText='left:'+((i*31+7)%97)+'%;top:'+((i*23+13)%91)+'%;--star-delay:'+(-i*.59)+'s';dust.append(star);}hero.append(dust);liveObserver.observe(hero);});
  root.querySelectorAll('.fx-holo').forEach(function(card){if(card.querySelector(':scope>.fx-foil-dust'))return;var dust=document.createElement('i');dust.className='fx-foil-dust';dust.setAttribute('aria-hidden','true');card.append(dust);});
  root.querySelectorAll('.poster-menu-card--feature img').forEach(function(img){img.classList.add('fx-game-media');});
 }
 function remember(grid){var positions=new Map();grid.querySelectorAll(':scope>.companion-card,:scope>.platform-person').forEach(function(card){if(card.hidden)return;var key=card.dataset.personIndex||card.querySelector('[data-home-audio]')?.dataset.homeAudio;if(key!==undefined)positions.set(key,card.getBoundingClientRect());});snapshots.set(grid,positions);}
 function transitionGrid(grid){
  decorate(grid);if(!active)return;
  var entrance=window.QiqiyouEntrance;
  if(entrance&&!snapshots.has(grid)){grid.getAnimations().forEach(function(a){a.cancel();});grid.querySelectorAll(':scope>.companion-card,:scope>.platform-person').forEach(function(card){card.getAnimations().forEach(function(a){if(!a.entOwned)a.cancel();});});entrance.scan();return;}
  if(entrance)entrance.releaseGrid(grid);
  var previous=snapshots.get(grid)||new Map(),cards=grid.querySelectorAll(':scope>.companion-card,:scope>.platform-person');
  grid.getAnimations().forEach(function(a){a.cancel();});var n=0;
  cards.forEach(function(card){card.getAnimations().forEach(function(a){a.cancel();});if(card.hidden)return;var r=card.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||n>13)return;
   var key=card.dataset.personIndex||card.querySelector('[data-home-audio]')?.dataset.homeAudio,old=previous.get(key),from;
   if(old)from={opacity:.8,transform:'translate('+(old.left-r.left)+'px,'+(old.top-r.top)+'px) scale(.98)'};
   else from={opacity:.25,transform:'translateY(24px) rotateX(6deg) scale(.96)',filter:'blur(3px)'};
   animate(card,[from,{opacity:1,transform:'none',filter:'blur(0)'}],{duration:470,delay:Math.min(n++*27,135),easing:'cubic-bezier(.16,1,.3,1)'});
  });snapshots.delete(grid);
 }
 document.addEventListener('click',function(e){if(e.target.closest('[data-companion-filter]')){var grid=document.getElementById('companion-grid');if(grid)remember(grid);}if(e.target.closest('[data-home-filter]')){var grid=document.getElementById('platform-home-people');if(grid)remember(grid);}},true);
 ['input','change'].forEach(function(type){document.addEventListener(type,function(e){if(e.target.closest('.platform-roster-search')){var grid=document.getElementById('companion-grid');if(grid)remember(grid);}},true);});
 ['companion-grid','platform-home-people'].forEach(function(id){var grid=document.getElementById(id);if(grid)new MutationObserver(function(entries){if(entries.some(function(e){return e.type==='childList'&&e.target===grid||e.type==='attributes';}))transitionGrid(grid);}).observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});});
 var showcase=document.querySelector('.companion-showcase');if(showcase)new MutationObserver(function(){decorate(showcase);}).observe(showcase,{childList:true});
 // The home filter buttons are populated asynchronously by the original view.
 var filters=document.querySelector('.platform-home-filters');if(filters)new MutationObserver(function(){glider(filters);}).observe(filters,{childList:true});
 decorate(document);resize();sync();
}());

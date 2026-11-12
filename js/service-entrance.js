/* Presentation only: no data, routing interception or business-handler replacement. */
(function () {
 'use strict';
 var main=document.querySelector('main');
 if(!main||!Element.prototype.animate||!window.IntersectionObserver)return;
 var reduced=matchMedia('(prefers-reduced-motion:reduce)'),phone=matchMedia('(max-width:600px)');
 var states=new Map(),headings=new Map(),owned=new Set(),opening=new Set(),echoes=new Set(),started=false,queued=false;
 var ease='cubic-bezier(.16,1,.3,1)';
 document.body.classList.add('ent-motion');
 function allowed(){return !reduced.matches&&!document.hidden&&!document.body.classList.contains('fx-user-paused');}
 function navigationPending(){return window.QiqiyouNavigation&&window.QiqiyouNavigation.isPending();}
 function openingElement(el){return window.QiqiyouNavigation&&window.QiqiyouNavigation.isArrivalElement(el);}
 function cancelLegacy(el){el.getAnimations().forEach(function(a){if(!a.entOwned&&a.constructor.name==='Animation')a.cancel();});}
 function motion(el,frames,duration,delay){
  if(!allowed())return;
  var a=el.animate(frames,{duration:duration,delay:delay||0,easing:ease,fill:'backwards'});
  a.entOwned=true;owned.add(a);
  if(navigationPending()){a.pause();a.currentTime=0;opening.add(a);}
  a.finished.then(function(){owned.delete(a);opening.delete(a);a.cancel();},function(){owned.delete(a);opening.delete(a);});return a;
 }
 function settle(el){
  var state=states.get(el);if(state)state.phase='done';
  if(observer)observer.unobserve(el);
  owned.forEach(function(a){var target=a.effect&&a.effect.target;if(target&&(target===el||el.contains(target)))a.cancel();});
 }
 // Measure the real rendered lines. Only plain headings and explicit <br> are split;
 // linked/structured headings keep their existing children and handlers intact.
 function split(el){
  if(headings.has(el)){
   var cached=headings.get(el);
   if(cached.lines.every(function(ink){return ink.isConnected&&el.contains(ink);}))return cached.lines;
   headings.delete(el);
  }
  if(el.textContent.length>120||Array.from(el.children).some(function(n){return n.tagName!=='BR';}))return [];
  var nodes=Array.from(el.childNodes),rows=[],range=document.createRange(),line=null;
  nodes.forEach(function(node){
   if(node.nodeType===1){line=null;return;}
   if(node.nodeType!==3)return;
   var offset=0;
   Array.from(node.textContent).forEach(function(char){
    range.setStart(node,offset);offset+=char.length;range.setEnd(node,offset);
    var rect=range.getBoundingClientRect(),top=Math.round(rect.top*2)/2;
    if(!line||(rect.width&&Math.abs(line.top-top)>2)){line={top:top,text:''};rows.push(line);}
    line.text+=char;
   });
  });
  range.detach();
  if(!rows.length||rows.map(function(r){return r.text;}).join('')!==el.textContent)return [];
  var height=el.getBoundingClientRect().height,fragment=document.createDocumentFragment(),lines=[];
  rows.forEach(function(row){var mask=document.createElement('span'),ink=document.createElement('span');mask.className='ent-line';ink.textContent=row.text;mask.append(ink);fragment.append(mask);lines.push(ink);});
  el.replaceChildren(fragment);
  if(Math.abs(el.getBoundingClientRect().height-height)>2){el.replaceChildren.apply(el,nodes);return [];}
  headings.set(el,{nodes:nodes,lines:lines});return lines;
 }
 function title(el,delay,quick){
  cancelLegacy(el);var lines=split(el),duration=quick?460:650;
  if(!lines.length){motion(el,[{opacity:.25,translate:'0 15px',clipPath:'inset(0 0 90% 0)'},{opacity:1,translate:'0 0',clipPath:'inset(0)'}],duration,delay);return;}
  lines.forEach(function(ink,i){motion(ink,[{opacity:.2,translate:'0 108%',rotate:'1.3deg'},{opacity:1,translate:'0 0',rotate:'0deg'}],duration,(delay||0)+Math.min(i*65,130));});
 }
 function enter(el,delay){
  var state=states.get(el);if(!state||state.phase!=='pending')return;
  if(!allowed()||el.contains(document.activeElement)){settle(el);return;}
  state.phase='done';observer.unobserve(el);cancelLegacy(el);
  var kind=state.kind,small=phone.matches,dy=small?14:26;
  if(kind==='title'){title(el,delay,false);return;}
  if(kind==='scene')motion(el,[{opacity:.65,scale:'1.018',clipPath:'inset(0 12% 0 0 round 15px)'},{opacity:1,scale:'1',clipPath:'inset(0 0 0 0 round 15px)'}],740,delay);
  else if(kind==='portrait')motion(el,[{opacity:.15,translate:'0 '+dy+'px',scale:'.965',rotate:(small?'0':'1.6deg'),clipPath:'inset(6% 0 0 round 13px)'},{opacity:1,translate:'0 0',scale:'1',rotate:'0deg',clipPath:'inset(0 0 0 round 13px)'}],small?490:640,delay);
  else if(kind==='game')motion(el,[{opacity:.25,translate:'0 '+dy+'px',clipPath:'inset(0 0 16% round 12px)'},{opacity:1,translate:'0 0',clipPath:'inset(0 round 12px)'}],small?460:580,delay);
  else if(kind==='promo')motion(el,[{opacity:.3,translate:(small?'0 14px':'22px 0'),scale:'.97'},{opacity:1,translate:'0 0',scale:'1'}],600,delay);
  else if(kind==='copy')motion(el,[{opacity:.25,translate:'0 10px',filter:'blur(2px)'},{opacity:1,translate:'0 0',filter:'blur(0)'}],430,delay);
  else motion(el,[{opacity:.25,translate:'0 '+(small?12:20)+'px',scale:'.985'},{opacity:1,translate:'0 0',scale:'1'}],small?440:540,delay);
 }
 function revealEntries(entries){
  var groups=new Map();
  entries.filter(function(e){return e.isIntersecting;}).sort(function(a,b){return a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left;}).forEach(function(entry){
   var el=entry.target,state=states.get(el);if(!state||state.phase!=='pending')return;
   var parent=el.parentElement,n=groups.get(parent)||0;groups.set(parent,n+1);
   var delay=Math.min(n*(phone.matches?45:65),phone.matches?120:180);
   if(el.closest('.platform-feature-panel'))delay+=state.kind==='title'?100:220;
   if(el.closest('.companion-copy')&&state.kind!=='title')delay+=100;
   enter(el,delay);
  });
 }
 var observer=new IntersectionObserver(revealEntries,{threshold:.04,rootMargin:'0px 0px -18px 0px'});
 var cards='.platform-person,.companion-card,.showcase-card,.curator-card,.poster-menu-card,.platform-promo,.service-quick-item,.contact-card,.recruit-card,.forum-post,.account-card,.auth-panel,.profile-section,.editor-card,.rules-panel,.active-panel,.review-card,.poster-menu-benefit,.recruit-notices,.feedback-benefits>*,.menu-assurance-grid>*,.forum-sidebar>section';
 function add(el,kind){
  if(states.has(el)||el.closest('dialog,[hidden]')||el.matches('.visually-hidden,.sr-only')||!el.getBoundingClientRect().height)return;
  var state={kind:kind,phase:allowed()?'pending':'done'};states.set(el,state);el.dataset.entKind=kind;cancelLegacy(el);
  if(state.phase==='pending')observer.observe(el);
 }
 function scan(){
  queued=false;if(!started)return;
  states.forEach(function(_,el){if(!el.isConnected){settle(el);states.delete(el);headings.delete(el);}});
  main.querySelectorAll(cards).forEach(function(el){
   if(el.parentElement.closest(cards))return;
   add(el,el.matches('.platform-person,.companion-card,.showcase-card,.curator-card')?'portrait':el.matches('.poster-menu-card')?'game':el.matches('.platform-promo')?'promo':'card');
  });
  main.querySelectorAll('h1,h2').forEach(function(el){if(!el.closest(cards))add(el,'title');});
  main.querySelectorAll('.platform-welcome p,.platform-welcome-link,.platform-feature-panel>p,.platform-feature-panel>.button,.companion-copy>p,.companion-actions,.companion-trust,.recruit-copy>p,.recruit-entry,.page-intro-row>p,.contact-welcome>p,.auth-intro>p,.forum-toolbar,.forum-page-head>.button,.platform-roster-search,.category-strip,.companion-section-head>p,.companion-cta p,.companion-cta .button,.recruit-section-head>p').forEach(function(el){add(el,'copy');});
  main.querySelectorAll('.platform-feature,.recruit-art,.contact-scene,.feedback-art,.carousel,.poster-sheet').forEach(function(el){add(el,'scene');});
 }
 function queueScan(){if(!queued){queued=true;queueMicrotask(scan);}}
 new MutationObserver(function(entries){if(entries.some(function(e){return e.type==='attributes'||Array.from(e.addedNodes).some(function(n){return n.nodeType===1&&!n.matches('.ent-line,.ent-feature-echo,.fx-material,.fx-foil-dust,.fx-glider,.fx-electric-canvas');});}))queueScan();}).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 // The original roster initializes after its account data arrives. Its page-copy
 // animation runs synchronously; take over that visual work at the loading boundary.
 new MutationObserver(function(entries){if(entries.some(function(e){return e.oldValue&&e.oldValue.includes('players-layout-loading')&&!document.body.classList.contains('players-layout-loading');})){
  main.querySelectorAll('.companion-copy>*,.showcase-card,.companion-section-head h2').forEach(cancelLegacy);queueScan();
 }}).observe(document.body,{attributes:true,attributeOldValue:true,attributeFilter:['class']});
 function finishAll(){states.forEach(function(_,el){settle(el);});owned.forEach(function(a){a.cancel();});opening.clear();echoes.forEach(function(el){el.remove();});echoes.clear();}
 document.addEventListener('qiqiyou:page-arrival',function(){owned.forEach(function(a){a.pause();a.currentTime=0;opening.add(a);});});
 document.addEventListener('qiqiyou:page-prepare',function(){
  if(!allowed())return;
  start();scan();
  var entries=[];
  states.forEach(function(state,el){if(state.phase==='pending'&&openingElement(el))entries.push({target:el,isIntersecting:true,boundingClientRect:el.getBoundingClientRect()});});
  revealEntries(entries);
 });
 document.addEventListener('qiqiyou:page-ready',function(){opening.forEach(function(a){if(allowed()&&a.playState!=='idle')a.play();else a.cancel();});opening.clear();});
 document.addEventListener('qiqiyou:motion-change',function(){if(!allowed())finishAll();});
 reduced.addEventListener('change',function(){if(reduced.matches)finishAll();});
 document.addEventListener('visibilitychange',function(){if(document.hidden)finishAll();});
 document.addEventListener('focusin',function(e){var el=e.target.closest('[data-ent-kind]');if(el)settle(el);});
 window.addEventListener('pagehide',finishAll);
 var resizeTimer=0;
 window.addEventListener('resize',function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(function(){headings.forEach(function(state,el){settle(el);if(state.lines.every(function(ink){return ink.isConnected&&el.contains(ink);}))el.replaceChildren.apply(el,state.nodes);headings.delete(el);});},120);},{passive:true});
 // Feature state still changes in service-platform.js. This hook handles only
 // a noninteractive, short-lived visual echo and the new copy's arrival.
 function leaveFeature(panel){
  echoes.forEach(function(el){el.remove();});echoes.clear();if(!panel||!allowed())return;
  settle(panel);var clone=panel.cloneNode(true);clone.hidden=false;clone.classList.add('ent-feature-echo');clone.setAttribute('aria-hidden','true');clone.inert=true;
  clone.querySelectorAll('h1,h2,h3').forEach(function(heading){var original=panel.querySelector(heading.tagName),style=getComputedStyle(original),replacement=document.createElement('div');replacement.className='ent-echo-title';replacement.style.cssText='font:'+style.font+';letter-spacing:'+style.letterSpacing+';margin:'+style.margin+';color:'+style.color;replacement.append.apply(replacement,Array.from(heading.childNodes));heading.replaceWith(replacement);});
  clone.querySelectorAll('[id],[href],[data-ent-kind]').forEach(function(el){el.removeAttribute('id');el.removeAttribute('href');el.removeAttribute('data-ent-kind');});
  clone.removeAttribute('data-feature-panel');clone.removeAttribute('id');clone.removeAttribute('data-ent-kind');panel.parentElement.append(clone);echoes.add(clone);
  var a=motion(clone,[{opacity:.85,translate:'0 0'},{opacity:0,translate:'0 -12px',filter:'blur(2px)'}],140,0);
  if(a)a.finished.then(function(){clone.remove();echoes.delete(clone);},function(){clone.remove();echoes.delete(clone);});else{clone.remove();echoes.delete(clone);}
 }
 function enterFeature(panel){
  cancelLegacy(panel);if(!allowed())return;
  panel.querySelectorAll('h2').forEach(function(el){settle(el);title(el,45,true);});
  panel.querySelectorAll(':scope>p,:scope>.button').forEach(function(el,i){settle(el);motion(el,[{opacity:.2,translate:'0 13px'},{opacity:1,translate:'0 0'}],420,110+i*60);});
 }
 window.QiqiyouEntrance={
  scan:queueScan,
  releaseGrid:function(grid){grid.querySelectorAll('.companion-card,.platform-person').forEach(function(el){settle(el);if(!states.has(el))states.set(el,{kind:'portrait',phase:'done'});el.dataset.entKind='portrait';});},
  leaveFeature:leaveFeature,
  enterFeature:enterFeature
 };
 function start(){if(started)return;started=true;scan();}
 if(document.fonts)document.fonts.ready.then(start);else start();
}());

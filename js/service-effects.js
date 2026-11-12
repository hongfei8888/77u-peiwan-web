(function () {
 'use strict';
 var reduced = matchMedia('(prefers-reduced-motion: reduce)');
 var fine = matchMedia('(hover:hover) and (pointer:fine)');
 var surfaces = new Map(), visible = new Set(), observed = new Set();
 var frame = 0, last = 0, clock = 0, disposed = false;
 var observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
   if(!entry.target.isConnected){visible.delete(entry.target);return;}
   entry.target.classList.toggle('fx-in-view', entry.isIntersecting);
   if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
  });
  schedule();
 }, { threshold:0 });
 function observe(el) { if (!observed.has(el)) { observed.add(el); observer.observe(el); } }
 function clean() {
  observed.forEach(function (el) { if (!el.isConnected) { observer.unobserve(el); resize.unobserve(el); observed.delete(el); visible.delete(el); surfaces.delete(el); } });
 }
 function canvasFor(host, kind) {
  var canvas = document.createElement('canvas'); canvas.className = kind === 'sky' ? 'fx-sky' : 'fx-electric-canvas';
  canvas.setAttribute('aria-hidden','true'); host.prepend(canvas);
  var ctx = canvas.getContext('2d'); if (!ctx) { canvas.remove(); return; }
  var surface = { host:host, canvas:canvas, ctx:ctx, kind:kind, w:0, h:0, x:.5, y:.3 };
  surfaces.set(canvas, surface); observe(canvas); resize.observe(canvas); fit(surface); paint(surface,0);
 }
 function fit(s) {
  var rect=s.canvas.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,1.5);
  s.w=rect.width; s.h=rect.height;
  s.canvas.width=Math.max(1,Math.round(s.w*dpr)); s.canvas.height=Math.max(1,Math.round(s.h*dpr));
  s.ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 var resize=new ResizeObserver(function(entries){ entries.forEach(function(entry){var s=surfaces.get(entry.target);if(s){fit(s);paint(s,clock);}}); });
 function sky(s,t) {
  var c=s.ctx,w=s.w,h=s.h; c.clearRect(0,0,w,h);
  c.globalCompositeOperation='screen';
  // Broad luminous curtains drift across the lounge ceiling, away from copy.
  ['142,71,246','76,91,224','76,202,215'].forEach(function(color,k){
   var x=w*(.40+k*.24+Math.sin(t*.22+k*1.6)*.12)+(s.x-.5)*w*.07;
   var y=h*(.15+Math.cos(t*.26+k)*.07);
   var r=Math.max(w*.4,h*.55),g=c.createRadialGradient(x,y,0,x,y,r);
   g.addColorStop(0,'rgba('+color+','+(k===0?.3:.15)+')');g.addColorStop(.48,'rgba('+color+',.07)');g.addColorStop(1,'rgba('+color+',0)');
   c.fillStyle=g;c.fillRect(0,0,w,h);
  });
  // Translucent silk ribbons supply the body of the aurora; fine threads sit above.
  for(var band=0;band<5;band++) {
   var curtain=c.createLinearGradient(0,0,0,h*.65);
   curtain.addColorStop(0,'#b785ff00');curtain.addColorStop(.22,band%3===2?'#86dfe21c':'#ae73f326');curtain.addColorStop(.45,'#9c74fa14');curtain.addColorStop(1,'#9c74fa00');
   c.fillStyle=curtain;c.beginPath();
   for(var col=0;col<=64;col++){var bx=w*col/64,by=h*(.12+band*.035)+Math.sin(col*.09+t*.46+band*.55)*h*.10+Math.cos(col*.2-t*.28)*h*.015;if(col===0)c.moveTo(bx,by);else c.lineTo(bx,by);}
   for(var back=64;back>=0;back--){var by2=h*(.28+band*.045)+Math.sin(back*.09+t*.46+band*.55+.35)*h*.12;c.lineTo(w*back/64,by2);}
   c.closePath();c.fill();
  }
  for(var j=0;j<4;j++) {
   c.beginPath();
   for(var i=0;i<=64;i++) {
    var px=w*i/64,py=h*(.17+j*.047)+Math.sin(i*.085+t*.4+j*.65)*h*.09+Math.sin(i*.21-t*.25+j)*h*.018;
    if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
   }
   var g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,'#9d62fb00');g.addColorStop(.4,'#b888ff60');g.addColorStop(.73,'#8cdae47a');g.addColorStop(1,'#aa79ff00');
   c.strokeStyle=g;c.lineWidth=j===0?2:1;c.shadowBlur=14;c.shadowColor='#ab79f0';c.stroke();
  }
  c.shadowBlur=0;
  // A pair of short comet glints travel with the lounge's light canopy.
  for(var comet=0;comet<2;comet++) {
   var age=(t+comet*4.2)%9.5;
   if(age>1.5)continue;
   var travel=age/1.5,cx=w*(.6+comet*.12)-travel*w*.23,cy=h*(.09+comet*.10)+travel*h*.13;
   var length=Math.min(w*.09,90),tail=c.createLinearGradient(cx,cy,cx+length,cy-length*.45);
   tail.addColorStop(0,'#e8e2ff');tail.addColorStop(.18,'#aadeff9c');tail.addColorStop(1,'#b88aff00');
   c.globalAlpha=Math.sin(travel*Math.PI)*.8;c.strokeStyle=tail;c.lineWidth=1.4;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+length,cy-length*.45);c.stroke();c.globalAlpha=1;
  }
  for(var n=0;n<23;n++) {
   var sx=((n*173.37+31)%997)/997*w,sy=((n*67.31+19)%313)/313*h*.57;
   var alpha=.16+(Math.sin(t*.7+n*2.1)+1)*.18;c.fillStyle='rgba(214,197,255,'+alpha+')';
   c.beginPath();c.arc(sx,sy,n%5===0?1.6:.85,0,Math.PI*2);c.fill();
   if(n%7===0){c.fillRect(sx-3,sy-.4,6,.8);c.fillRect(sx-.4,sy-3,.8,6);}
  }
  c.globalCompositeOperation='source-over';
 }
 function borderPoint(p,w,h,r) {
  var straightX=w-2*r,straightY=h-2*r,arc=Math.PI*r/2;
  var lengths=[straightX,arc,straightY,arc,straightX,arc,straightY,arc],k=0;
  for(;k<7&&p>lengths[k];k++)p-=lengths[k];
  if(k===0)return[r+p,0];if(k===2)return[w,r+p];if(k===4)return[w-r-p,h];if(k===6)return[0,h-r-p];
  var a=[-Math.PI/2,0,Math.PI/2,Math.PI][(k-1)/2]+p/r;
  return[[w-r,w-r,r,r][(k-1)/2]+Math.cos(a)*r,[r,h-r,h-r,r][(k-1)/2]+Math.sin(a)*r];
 }
 function electric(s,t) {
  var c=s.ctx,w=s.w-7,h=s.h-7,r=11,perimeter=2*(w+h-4*r)+2*Math.PI*r;
  c.clearRect(0,0,s.w,s.h);if(w<25||h<25)return;
  var phase=Math.floor(t*12);
  for(var layer=0;layer<2;layer++) {
   c.beginPath();
   for(var i=0;i<=150;i++) {
    var p=borderPoint(perimeter*i/150,w,h,r);
    var noise=(Math.sin(i*17.13+phase*4.71+layer)*Math.cos(i*8.31-phase*.9))* (reduced.matches?0:layer?1.9:1.2);
    var x=p[0]+3.5+(p[0]-w/2)/Math.max(w,h)*noise*2,y=p[1]+3.5+(p[1]-h/2)/Math.max(w,h)*noise*2;
    if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
   }
   c.closePath();c.strokeStyle=layer?'#f1cfff':'#b17af0';c.lineWidth=layer?.65:1.3;c.shadowColor='#af71ee';c.shadowBlur=layer?2:7;c.globalAlpha=layer?.75:.85;c.stroke();
  }
  c.shadowBlur=8;c.shadowColor='#99ecf0';c.strokeStyle='#b9f8ff';c.lineWidth=1.5;c.globalAlpha=.9;
  for(var j=0;j<2;j++) {
   c.beginPath();for(var n=0;n<12;n++){var at=(((t*.08+j*.51+n*.002)%1)+1)%1;var q=borderPoint(at*perimeter,w,h,r);if(n===0)c.moveTo(q[0]+3.5,q[1]+3.5);else c.lineTo(q[0]+3.5,q[1]+3.5);}c.stroke();
  }
  c.globalAlpha=1;c.shadowBlur=0;
 }
 function paint(s,t) { if(s.kind==='sky')sky(s,t);else electric(s,t); }
 function running() { return !disposed&&!document.hidden&&!reduced.matches&&!document.body.classList.contains('fx-user-paused')&&Array.from(surfaces.keys()).some(function(el){return visible.has(el);}); }
 function schedule() { if(running()&&!frame) { last=0;frame=requestAnimationFrame(tick); } else if(!running()&&frame) { cancelAnimationFrame(frame);frame=0;last=0; } }
 function tick(now) {
  frame=0;if(!running())return;
  var step=fine.matches?1000/30:1000/24;
  if(!last||now-last>=step-1) {
   clock+=last?Math.min((now-last)/1000,.1):step/1000;last=now;
   surfaces.forEach(function(s,el){if(visible.has(el))paint(s,clock);});
  }
  frame=requestAnimationFrame(tick);
 }
 function material(card,holo) {
  if(card.classList.contains('fx-card'))return;
  card.classList.add('fx-card');if(holo)card.classList.add('fx-holo');
  var layer=document.createElement('i');layer.className='fx-material';layer.setAttribute('aria-hidden','true');card.append(layer);observe(card);
  if(/魔王/.test((card.querySelector('.platform-person-level,.companion-card-top em')||{}).textContent||'')) {
   card.classList.add('fx-electric');canvasFor(card,'electric');
  }
 }
 function decorate(root) {
  root.querySelectorAll('.showcase-card,.platform-person,.companion-card,.curator-card,.platform-game,.poster-menu-card').forEach(function(card){material(card,card.matches('.showcase-card,.platform-person'));});
  clean();schedule();
 }
 var stage=document.querySelector('.platform-home,.companion-hero');
 if(stage) {stage.classList.add('fx-aurora-stage');canvasFor(stage,'sky');}
 document.querySelectorAll('.platform-promo').forEach(function(host){
  host.classList.add('fx-beam-host');
  var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');svg.classList.add('fx-beam');
  var rect=document.createElementNS(svg.namespaceURI,'rect');[['x','1'],['y','1'],['width','98'],['height','98'],['rx','6'],['pathLength','100']].forEach(function(a){rect.setAttribute(a[0],a[1]);});svg.append(rect);host.append(svg);observe(host);
 });
 document.querySelectorAll('.platform-feature .button-primary,.companion-actions .button-primary').forEach(function(button){button.classList.add('fx-control-shine');});
 decorate(document);
 ['platform-home-people','companion-grid'].forEach(function(id){var grid=document.getElementById(id);if(grid)new MutationObserver(function(){decorate(grid);}).observe(grid,{childList:true});});
 var showcase=document.querySelector('.companion-showcase');if(showcase)new MutationObserver(function(){decorate(showcase);}).observe(showcase,{childList:true});
 var pointerFrame=0,point=null;
 document.addEventListener('pointermove',function(e){
  if(!fine.matches||reduced.matches||document.body.classList.contains('fx-user-paused'))return;point={x:e.clientX,y:e.clientY,target:e.target};if(pointerFrame)return;
  pointerFrame=requestAnimationFrame(function(){pointerFrame=0;var card=point.target.closest('.fx-card');
   if(card){var rect=card.getBoundingClientRect(),x=Math.max(0,Math.min(1,(point.x-rect.left)/rect.width)),y=Math.max(0,Math.min(1,(point.y-rect.top)/rect.height));card.style.setProperty('--fx-x',(x*100).toFixed(1)+'%');card.style.setProperty('--fx-y',(y*100).toFixed(1)+'%');card.style.setProperty('--fx-rx',((.5-y)*8).toFixed(2)+'deg');card.style.setProperty('--fx-ry',((x-.5)*10).toFixed(2)+'deg');}
   surfaces.forEach(function(s){if(s.kind==='sky'){var r=s.canvas.getBoundingClientRect();s.x=Math.max(0,Math.min(1,(point.x-r.left)/r.width));}});
  });
 },{passive:true});
 document.addEventListener('pointerout',function(e){var card=e.target.closest('.fx-card');if(card&&!card.contains(e.relatedTarget)){card.style.setProperty('--fx-rx','0deg');card.style.setProperty('--fx-ry','0deg');}});
 var audio=document.getElementById('companion-audio');
 if(audio) {
  var wrap=audio.closest('.companion-audio'),label=wrap.querySelector('span'),wave=document.createElement('i');wave.className='platform-wave fx-audio-wave';wave.setAttribute('aria-hidden','true');wave.innerHTML='<i></i>'.repeat(9);label.append(wave);
  ['playing','pause','ended','emptied','waiting'].forEach(function(type){audio.addEventListener(type,function(){wrap.classList.toggle('is-playing',type==='playing');});});
 }
 function preference() { document.body.classList.toggle('fx-suspended',document.hidden||reduced.matches||document.body.classList.contains('fx-user-paused'));surfaces.forEach(function(s){paint(s,0);});schedule(); }
 document.addEventListener('qiqiyou:motion-change',preference);
 reduced.addEventListener('change',preference);document.addEventListener('visibilitychange',preference);
 window.addEventListener('pagehide',function(){disposed=true;cancelAnimationFrame(frame);cancelAnimationFrame(pointerFrame);frame=0;document.body.classList.add('fx-suspended');});
 window.addEventListener('pageshow',function(){disposed=false;preference();});
 preference();
}());

/* Native cross-document lifecycle must be registered in <head>, before paint. */
(function(){
 'use strict';
 var reduced=matchMedia('(prefers-reduced-motion:reduce)');
 var arrival=null;
 var pending=false;
 // Components prepare behind the old snapshot, then start once the new page
 // is ready. Navigation and content entrances share one visible timeline.
 window.QiqiyouNavigation={isPending:function(){return pending;},isArrivalElement:function(el){
  if(!arrival)return false;
  var r=el.getBoundingClientRect(),top=r.top+scrollY;
  return r.height>0&&top<arrival.top+arrival.height&&top+r.height>arrival.top;
 }};
 function prepareArrival(view){
  var root=document.documentElement,released=false;
  pending=true;
  root.classList.add('ent-navigation-pending');
  function release(){
   if(released)return;released=true;clearTimeout(limit);
   document.dispatchEvent(new CustomEvent('qiqiyou:page-prepare'));
   pending=false;root.classList.remove('ent-navigation-pending');
   document.dispatchEvent(new CustomEvent('qiqiyou:page-ready'));
  }
  // Hold the outgoing snapshot, never an empty overlay. Continue immediately
  // when the initial content is ready, with a strict bound for slow/failed loads.
  var limit=setTimeout(release,900);
  var parsed=document.readyState==='loading'?new Promise(function(resolve){document.addEventListener('DOMContentLoaded',resolve,{once:true});}):Promise.resolve();
  parsed.then(function(){
   var waits=[];
   if(document.fonts)waits.push(document.fonts.ready);
   if(window.QiqiyouAccount)waits.push(window.QiqiyouAccount.ready.catch(function(){}));
   if(window.QiqiyouNoticeReady)waits.push(window.QiqiyouNoticeReady);
   return Promise.all(waits);
  }).then(function(){
   return Promise.all(Array.from(document.querySelectorAll('main img')).filter(function(img){
    var r=img.getBoundingClientRect();return img.loading!=='lazy'&&r.height>0&&r.bottom>0&&r.top<innerHeight;
   }).map(function(img){return img.decode?img.decode().catch(function(){}):Promise.resolve();}));
  }).then(release,release);
  view.finished.then(release,release);
 }
 function transition(event){
  var view=event.viewTransition;if(!view)return;
  view.ready.catch(function(){});
  var off=false;try{off=localStorage.getItem('qiqiyou_lounge_effects')==='off';}catch(_){}
  if(reduced.matches||off){view.skipTransition();return;}
  if(event.type==='pagereveal'){
   arrival={top:scrollY,height:innerHeight};
   prepareArrival(view);
   document.dispatchEvent(new CustomEvent('qiqiyou:page-arrival'));
  }
 }
 window.addEventListener('pageswap',transition);
 window.addEventListener('pagereveal',transition);
}());

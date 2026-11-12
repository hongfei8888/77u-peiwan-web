/* Presentation bridge: preserves the main site's companions.js and all API logic. */
(async function () {
 'use strict';
 if (!window.QiqiyouAccount || !document.getElementById('companion-grid')) return;
 await window.QiqiyouAccount.ready;
 var api=window.QiqiyouAccount, config=api.playersLayout();
 var people=window.QiqiyouPlayers.people(api.publicProfiles());
 var grid=document.getElementById('companion-grid'),empty=document.getElementById('companion-empty');
 var count=document.getElementById('roster-count'),dialog=document.getElementById('companion-dialog');
 var preference=matchMedia('(prefers-reduced-motion: reduce)'),trigger=null,closing=false;
 var params=new URLSearchParams(location.search),searchTerm=(params.get('search')||'').trim(),media='';
 var originalEmpty=[empty.querySelector('strong').textContent,empty.querySelector('p').textContent];
 var box=document.createElement('div');box.className='platform-roster-search';
 box.innerHTML='<label><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span class="visually-hidden">搜索陪玩名字、声音或服务</span><input id="companion-search" type="search" placeholder="搜索名字、声音或服务" autocomplete="off"></label><label class="visually-hidden" for="companion-media-filter">资料类型</label><select id="companion-media-filter"><option value="">全部资料</option><option value="audio">有声音样片</option><option value="video">有视频介绍</option></select>';
 grid.before(box);var input=box.querySelector('input');input.value=searchTerm;
 function filterView() {
  var shown=0,key=searchTerm.toLocaleLowerCase();
  grid.querySelectorAll('.companion-card').forEach(function(card){
   var person=people[Number(card.dataset.personIndex)];
   var matches=Boolean(person)&&(!key||[person.name,person.service,person.tone,person.level,person.bio].join(' ').toLocaleLowerCase().includes(key))&&(!media||Boolean(person[media]));
   card.hidden=!matches;if(matches)shown++;
  });
  count.textContent=shown;grid.hidden=!shown;empty.hidden=shown>0;
  empty.querySelector('strong').textContent=searchTerm||media?'暂时没有匹配的陪玩':originalEmpty[0];
  empty.querySelector('p').textContent=searchTerm||media?'试试其他关键词或资料类型，也可以切换分类、联系客服推荐。':originalEmpty[1];
 }
 input.addEventListener('input',function(){searchTerm=input.value.trim();filterView();});
 box.querySelector('select').addEventListener('change',function(e){media=e.target.value;filterView();});
 new MutationObserver(filterView).observe(grid,{childList:true});
 function stopVisualAnimations(){[dialog,dialog.querySelector('.companion-dialog-media'),dialog.querySelector('.companion-dialog-copy')].forEach(function(el){el.getAnimations().forEach(function(a){a.cancel();});});}
 function animateProfile(card) {
  if(!dialog.open)return;closing=false;trigger=card;stopVisualAnimations();
  if(preference.matches)return;
  var area=dialog.querySelector('.companion-dialog-media'),copy=dialog.querySelector('.companion-dialog-copy');
  var image=card.querySelector('.companion-card-image,img'),from=image&&image.getBoundingClientRect(),to=area.getBoundingClientRect();
  var origin=from&&from.width&&to.width&&to.height&&from.top<innerHeight&&from.bottom>0
   ?'translate('+(from.left-to.left)+'px,'+(from.top-to.top)+'px) scale('+(from.width/to.width)+','+(from.height/to.height)+')'
   :'translateY(20px) scale(.97)';
  dialog.animate([{opacity:.3},{opacity:1}],{duration:320,easing:'cubic-bezier(.16,1,.3,1)'});
  area.animate([{opacity:.6,transform:origin,transformOrigin:'0 0',borderRadius:'14px'},{opacity:1,transform:'none',transformOrigin:'0 0',borderRadius:'0'}],{duration:480,easing:'cubic-bezier(.16,1,.3,1)'});
  copy.animate([{opacity:0,transform:'translateX(22px)'},{opacity:1,transform:'none'}],{duration:400,delay:60,easing:'cubic-bezier(.16,1,.3,1)'});
 }
 // The existing handler still populates/cleans media and moments. Only its visual
 // transitions are replaced, after the original document click listener runs.
 window.addEventListener('click',function(e){
  var card=e.target.closest('[data-person-index]');if(card)animateProfile(card);
  if(e.target.closest('#companion-dialog-close')&&preference.matches&&dialog.open){stopVisualAnimations();dialog.close();if(trigger&&trigger.isConnected)trigger.focus({preventScroll:true});}
 });
 document.addEventListener('click',function(e){if(!e.target.closest('#companion-dialog-close'))return;if(closing){e.preventDefault();e.stopImmediatePropagation();}else if(dialog.open)closing=true;},true);
 dialog.addEventListener('close',function(){closing=false;});
 dialog.addEventListener('cancel',function(){if(preference.matches&&dialog.open){stopVisualAnimations();dialog.close();if(trigger&&trigger.isConnected)trigger.focus({preventScroll:true});}});
 preference.addEventListener('change',function(){if(preference.matches){stopVisualAnimations();if(closing&&dialog.open){dialog.close();if(trigger&&trigger.isConnected)trigger.focus({preventScroll:true});closing=false;}}});
 if(searchTerm&&config.categories.all&&config.categories.all.enabled){var all=document.querySelector('[data-companion-filter="all"]');if(all)all.click();}
 filterView();
 var requested=params.get('person');
 if(requested){
  var index=people.findIndex(function(p){return p.accountId===requested&&config.hiddenIds.indexOf(p.accountId)===-1;});
  if(index>=0){
   var card=document.querySelector('.showcase-card[data-person-index="'+index+'"]');
   if(card&&!card.closest('[hidden]'))card.click();
   else {
    var category=config.categoryOrder.find(function(key){return config.categories[key].enabled&&window.QiqiyouPlayers.selected(people,config,key).some(function(p){return p.accountId===requested;});});
    var categoryButton=category&&document.querySelector('[data-companion-filter="'+category+'"]');if(categoryButton)categoryButton.click();
    card=grid.querySelector('[data-person-index="'+index+'"]');if(card)card.click();
   }
  }
 }
}()).catch(function(error){if(window.QiqiyouAccountError)window.QiqiyouAccountError(error);});

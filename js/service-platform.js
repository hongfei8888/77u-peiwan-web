(function () {
 'use strict';
 var script = document.currentScript;
 var base = new URL('../', script.src);
 var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 var playingAudio = null, playingButton = null;
 function local(path) { return new URL(path, base).href; }
 function esc(value) { return String(value || '').replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
 function stopAudio() {
  if (playingAudio) playingAudio.pause();
  if (playingButton) { playingButton.classList.remove('is-playing'); playingButton.setAttribute('aria-pressed','false'); playingButton.querySelector('.audio-label').textContent='听听声音'; }
  playingAudio = null; playingButton = null;
 }
 var tabs = document.querySelectorAll('[data-feature-tab]');
 tabs.forEach(function (button) {
  button.addEventListener('click',function () {
   var key=button.dataset.featureTab;
   if(button.classList.contains('is-active'))return;
   var entrance=window.QiqiyouEntrance,previous=document.querySelector('.platform-feature-panel:not([hidden])');
   if(entrance)entrance.leaveFeature(previous);
   document.querySelector('.platform-feature').dataset.feature=key;
   tabs.forEach(function (b) {var active=b===button;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
   document.querySelectorAll('[data-feature-panel]').forEach(function(panel) {
    var active=panel.dataset.featurePanel===key;panel.hidden=!active;
    if(active&&entrance)entrance.enterFeature(panel);
    else if(active&&!reduced.matches)panel.animate([{opacity:.25,transform:'translateY(12px)',filter:'blur(4px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:450,easing:'cubic-bezier(.16,1,.3,1)'});
   });
  });
 });

 // Account routes have a reduced legacy header; provide the same menu controls.
 var toggle=document.getElementById('nav-toggle'),navLinks=document.getElementById('nav-links');
 if(toggle&&!document.querySelector('script[src*="js/main.js"]')) {
  toggle.addEventListener('click',function(){var open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));navLinks.classList.toggle('open',open);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){toggle.setAttribute('aria-expanded','false');navLinks.classList.remove('open');toggle.focus();}});
 }
 var form=document.querySelector('.platform-search');
 if(form)form.addEventListener('submit',function(e){var input=form.querySelector('input');input.value=input.value.trim();if(!input.value){e.preventDefault();location.href=local('players.html');}});
 document.addEventListener('visibilitychange',function(){if(document.hidden)stopAudio();});
 window.addEventListener('pagehide',stopAudio);
 if(!window.QiqiyouAccount)return;
 window.QiqiyouAccount.ready.then(function(){
  var current=window.QiqiyouAccount.current();
  if(current){var account=document.querySelector('.platform-account');if(account){account.textContent='个人中心';account.href=local('account.html');}}
  var grid=document.getElementById('platform-home-people');
  if(!grid)return;
  var config=window.QiqiyouAccount.playersLayout();
  var people=window.QiqiyouPlayers.people(window.QiqiyouAccount.publicProfiles());
  var filters=document.getElementById('platform-home-filters');
  var categories=config.categoryOrder.filter(function(key){return config.categories[key].enabled;});
  var active=config.defaultFilter;
  // A hidden roster section also hides homepage roster previews.
  var roster=config.sections.find(function(section){return section.id==='roster';});
  if(roster&&!roster.enabled){grid.closest('section').hidden=true;return;}
  filters.innerHTML=categories.map(function(key){return '<button type="button" data-home-filter="'+esc(key)+'" aria-pressed="false">'+esc(config.categories[key].title)+'</button>';}).join('');
  function render(key){
   stopAudio();active=key;
   var selected=window.QiqiyouPlayers.selected(people,config,key).slice(0,4);
   filters.querySelectorAll('button').forEach(function(b){var on=b.dataset.homeFilter===active;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});
   if(!selected.length){grid.innerHTML='<p class="platform-load">这个分类的资料正在补充，<a href="'+local('contact.html')+'">可以先向客服咨询推荐</a>。</p>';return;}
   grid.innerHTML=selected.map(function(p){
    var href=local('players.html?person='+encodeURIComponent(p.accountId));
    var availableTone=p.tone&&p.tone!=='资料待补充'?p.tone:'公开资料';
    return '<article class="platform-person"><a class="platform-person-visual" href="'+href+'"><img src="'+esc(p.cover||p.avatar)+'" alt="'+esc(p.name)+'的公开形象" width="400" height="400" loading="lazy"><span class="platform-person-level">'+esc(p.level&&p.level!=='资料待补充'?p.level:p.service)+'</span></a><div class="platform-person-copy"><div class="platform-person-heading"><a href="'+href+'"><strong>'+esc(p.name)+'</strong></a><a href="'+href+'">查看资料 ↗</a></div><p>'+esc(p.service)+' · '+esc(availableTone)+'</p><div class="platform-person-tags"><span>'+esc(availableTone)+'</span><span>'+(p.video?'视频介绍':p.placeholder?'形象待补充':'人物展示')+'</span></div><button class="platform-person-audio" type="button" data-home-audio="'+esc(p.accountId)+'" aria-pressed="false" '+(!p.audio?'disabled':'')+'><span class="audio-label">'+(p.audio?'听听声音':'暂无声音样片')+'</span><span class="platform-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></button></div></article>';
   }).join('');
   if(!reduced.matches)grid.animate([{opacity:.4,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:350,easing:'cubic-bezier(.16,1,.3,1)'});
  }
  filters.addEventListener('click',function(e){var b=e.target.closest('[data-home-filter]');if(b&&b.dataset.homeFilter!==active)render(b.dataset.homeFilter);});
  grid.addEventListener('click',function(e){
   var button=e.target.closest('[data-home-audio]');if(!button||button.disabled)return;
   if(button===playingButton){stopAudio();return;}
   stopAudio();
   var person=people.find(function(p){return p.accountId===button.dataset.homeAudio;});if(!person||!person.audio)return;
   var audio=new Audio(person.audio);playingAudio=audio;playingButton=button;
   button.querySelector('.audio-label').textContent='声音加载中…';button.setAttribute('aria-pressed','true');
   audio.addEventListener('playing',function(){if(playingAudio===audio){button.classList.add('is-playing');button.querySelector('.audio-label').textContent='正在试听 · 点击暂停';}});
   audio.addEventListener('ended',stopAudio);
   audio.addEventListener('error',function(){if(playingAudio===audio){stopAudio();button.querySelector('.audio-label').textContent='暂时无法播放，请重试';}});
   audio.play().catch(function(){if(playingAudio===audio){stopAudio();button.querySelector('.audio-label').textContent='暂时无法播放，请重试';}});
  });
  render(categories.includes(active)?active:categories[0]);
 }).catch(function(){var grid=document.getElementById('platform-home-people');if(grid)grid.innerHTML='<p class="platform-load">陪玩资料暂时无法载入，<a href="'+local('players.html')+'">前往陪玩社区重试</a>，或向客服咨询。</p>';});
}());

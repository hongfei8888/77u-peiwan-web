(function(){
  'use strict';
  var $=function(id){return document.getElementById(id)},examiners=[],notices=[],selectedExaminer='',selectedNotice='',examinerTag='',signatures={},refreshing=false;
  var visual=window.parent!==window&&new URLSearchParams(location.search).get('edit')==='1';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)');
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function url(src){try{var u=new URL(src,location.href);return src&&u.origin===location.origin&&/^https?:$/.test(u.protocol)?u.href:''}catch(_){return ''}}
  function date(value){return new Date(value).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})}
  function animate(el,frames,options){if(!reduce.matches&&el.animate)return el.animate(frames,Object.assign({duration:260,easing:'cubic-bezier(.22,1,.36,1)'},options))}
  var platformLinks=Array.from(document.querySelectorAll('[data-platform]')),sections=Array.from(document.querySelectorAll('.join-platform'));
  function platform(id){sections.forEach(function(s){s.hidden=s.id!==id+'-standards'});platformLinks.forEach(function(a){if(a.dataset.platform===id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')})}
  platformLinks.forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();platform(a.dataset.platform)})});
  var requested=location.hash.replace(/^#/, '').replace(/-standards$/, '');platform(['pc','mobile','quality','talent'].includes(requested)?requested:'pc');
  var ruleGroups=[];sections.forEach(function(section){var groups=Array.from(section.querySelectorAll('[data-rule-group]'));ruleGroups=ruleGroups.concat(groups.length?groups:[section])});
  ruleGroups.forEach(function(section){var buttons=Array.from(section.querySelectorAll('[data-rule]')),panels=Array.from(section.querySelectorAll('[data-rule-panel]'));function select(name){buttons.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.rule===name))});panels.forEach(function(p){p.hidden=p.dataset.rulePanel!==name})}buttons.forEach(function(b){b.addEventListener('click',function(){select(b.dataset.rule)})});select('single')});
  var qualityKinds=Array.from(document.querySelectorAll('[data-quality-kind]')),qualityPanels=Array.from(document.querySelectorAll('[data-quality-panel]'));
  function qualityKind(name){qualityKinds.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.qualityKind===name))});qualityPanels.forEach(function(p){p.hidden=p.dataset.qualityPanel!==name})}
  qualityKinds.forEach(function(b){b.addEventListener('click',function(){qualityKind(b.dataset.qualityKind)})});qualityKind('priority');
  document.documentElement.classList.add('join-ready');
  function dialog(id){var el=$(id),opener=null,overflow='',closing=false;
    function open(){if(el.open)return;opener=document.activeElement;overflow=document.body.style.overflow;document.body.style.overflow='hidden';el.showModal();animate(el,[{opacity:0,transform:'translateY(12px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}])}
    function close(){if(!el.open||closing)return;closing=true;el.getAnimations().forEach(function(a){a.cancel()});var a=animate(el,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(7px)'}],{duration:170,fill:'forwards'});function done(){el.close();if(a)a.cancel();closing=false}if(a)a.finished.then(done,done);else done()}
    el.querySelector('.assessment-dialog-close').addEventListener('click',close);el.addEventListener('cancel',function(e){e.preventDefault();close()});
    el.addEventListener('click',function(e){var r=el.getBoundingClientRect();if(e.target===el&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))close()});
    el.addEventListener('close',function(){document.body.style.overflow=overflow;if(opener&&opener.isConnected)opener.focus({preventScroll:true})});return {open:open,close:close,el:el};
  }
  var picker=dialog('examiner-dialog'),noticeDialog=dialog('assessment-notice-dialog');
  function tagBadges(tags){return (tags||[]).map(function(tag){return '<span>'+esc(tag)+'</span>'}).join('')}
  function listExaminers(){var q=$('examiner-search').value.trim().toLocaleLowerCase(),found=examiners.filter(function(e){return (!examinerTag||(e.tags||[]).includes(examinerTag))&&(e.name+' '+e.description+' '+(e.tags||[]).join(' ')).toLocaleLowerCase().includes(q)});
    document.querySelectorAll('[data-examiner-tag]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.examinerTag===examinerTag))});
    $('examiner-count').textContent=(examinerTag?examinerTag+' · ':'')+(q?'找到 ':'共 ')+found.length+' 位考官';
    $('examiner-list').innerHTML=found.length?found.map(function(e){return '<button class="assessment-examiner-item" type="button" data-examiner="'+esc(e.id)+'"><span class="assessment-avatar" aria-hidden="true">'+esc(e.name.slice(0,1))+'</span><span><strong>'+esc(e.name)+'</strong><span class="examiner-tag-badges">'+tagBadges(e.tags)+'</span><small>'+esc(e.description||'扫码联系考官')+'</small></span><span class="assessment-item-arrow" aria-hidden="true">↗</span></button>'}).join(''):'<p class="assessment-empty">'+(q?'未找到匹配考官，可清空搜索或切换标签。':examinerTag?'暂无该标签的考官，请切换其他标签或联系客服。':'考官二维码待更新，请稍后查看或联系客服。')+'</p>';
  }
  $('examiner-type-filters').addEventListener('click',function(e){var b=e.target.closest('[data-examiner-tag]');if(!b)return;examinerTag=b.dataset.examinerTag;listExaminers()});
  function showList(){selectedExaminer='';$('examiner-detail').hidden=true;$('examiner-picker').hidden=false;$('examiner-dialog-title').textContent='选择考官';listExaminers()}
  function showExaminer(id){var e=examiners.find(function(e){return e.id===id});if(!e)return;selectedExaminer=id;$('examiner-picker').hidden=true;$('examiner-detail').hidden=false;$('examiner-dialog-title').textContent='考官二维码';$('examiner-name').textContent=e.name;$('examiner-description').textContent=e.description;$('examiner-detail-tags').innerHTML=tagBadges(e.tags);
    var img=$('examiner-image'),status=$('examiner-image-status'),save=$('examiner-save'),src=url(e.src);img.hidden=true;save.hidden=true;status.hidden=false;status.textContent='二维码加载中…';
    img.onload=function(){if(selectedExaminer!==id)return;img.hidden=false;status.hidden=true;save.hidden=false};img.onerror=function(){if(selectedExaminer!==id)return;img.hidden=true;save.hidden=true;status.hidden=false;status.textContent='二维码加载失败，请返回列表重新打开或联系客服。'};
    img.alt=e.name+'联系二维码';if(src){img.src=src;save.href=src;save.download=e.name+'-二维码.png'}else{img.removeAttribute('src');status.textContent='二维码暂不可用，请联系客服。'}
    animate($('examiner-detail'),[{opacity:.3,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}]);
    if(picker.el.open)$('examiner-back').focus({preventScroll:true});
  }
  function openPicker(id){examinerTag='';$('examiner-search').value='';showList();if(id)showExaminer(id);picker.open()}
  $('assessment-examiner-open').addEventListener('click',function(){openPicker()});$('examiner-search').addEventListener('input',listExaminers);
  $('examiner-back').addEventListener('click',function(){var id=selectedExaminer;showList();var previous=$('examiner-list').querySelector('[data-examiner="'+id+'"]');if(previous)previous.focus({preventScroll:true})});
  document.addEventListener('click',function(e){var item=e.target.closest('[data-examiner]');if(!item)return;if(item.closest('#examiner-dialog'))showExaminer(item.dataset.examiner);else openPicker(item.dataset.examiner)});
  function fillNotice(n){$('assessment-notice-title').textContent=n.title;$('assessment-notice-date').dateTime=n.createdAt;$('assessment-notice-date').textContent=date(n.createdAt);$('assessment-notice-text').textContent=n.text;var img=$('assessment-notice-image'),src=url(n.image);img.hidden=!src;img.onerror=function(){img.hidden=true};if(src)img.src=src;else img.removeAttribute('src')}
  $('assessment-notice-list').addEventListener('click',function(e){var item=e.target.closest('[data-notice]'),n=item&&notices.find(function(n){return n.id===item.dataset.notice});if(!n)return;selectedNotice=n.id;fillNotice(n);noticeDialog.open()});
  function render(data){
    window.QIQIYOU_ASSESSMENT_DATA=data;
    window.dispatchEvent(new CustomEvent('assessment:data',{detail:data}));
    var values=data.content&&data.content.values;if(values&&!visual)document.querySelectorAll('[data-join-field]').forEach(function(el){var value=values[el.dataset.joinField];if(el.dataset.joinField==='supervision.5'&&['考官违规举报','违举报'].includes(value))value='违规举报';if(typeof value==='string')el.textContent=value});
    if(values&&!visual)document.querySelectorAll('[data-join-href]').forEach(function(el){var value=values[el.dataset.joinHref];try{var u=new URL(value);if(/^https?:$/.test(u.protocol)&&!u.username&&!u.password)el.href=u.href}catch(_){}});
    if(signatures.notices!==JSON.stringify(data.notices)){
      notices=data.notices||[];signatures.notices=JSON.stringify(data.notices);
      $('assessment-notice-list').innerHTML=notices.length?notices.map(function(n,i){return '<button type="button" class="assessment-notice-item" data-notice="'+esc(n.id)+'"><span class="assessment-notice-meta">'+(i===0?'<b>最新</b>':'')+'<time datetime="'+esc(n.createdAt)+'">'+esc(date(n.createdAt))+'</time></span><strong>'+esc(n.title)+'</strong><span class="assessment-notice-excerpt">'+esc(n.text||'点击查看通知图片')+'</span><span class="assessment-notice-more">查看通知 ↗</span></button>'}).join(''):'<p class="assessment-empty">暂无重要通知，最新安排将在这里发布。</p>';
      if(noticeDialog.el.open){var current=notices.find(function(n){return n.id===selectedNotice});if(current)fillNotice(current);else noticeDialog.close()}
    }
    if(signatures.examiners!==JSON.stringify(data.examiners)){
      var old=examiners.find(function(e){return e.id===selectedExaminer});examiners=(data.examiners||[]).filter(function(e){return !!url(e.src)});signatures.examiners=JSON.stringify(data.examiners);
      $('assessment-examiner-preview').innerHTML=examiners.length?examiners.slice(0,3).map(function(e){return '<button type="button" data-examiner="'+esc(e.id)+'"><span>'+esc(e.name)+'</span><span aria-hidden="true">↗</span></button>'}).join('')+'<p>共 '+examiners.length+' 位考官可选</p>':'<p class="assessment-empty">考官二维码待更新</p>';
      $('assessment-examiner-open').innerHTML=(examiners.length?'查看全部考官':'查看考官列表')+' <span aria-hidden="true">↗</span>';
      if(picker.el.open){var current=examiners.find(function(e){return e.id===selectedExaminer});if(!selectedExaminer||!current)showList();else if(JSON.stringify(current)!==JSON.stringify(old))showExaminer(current.id)}
    }
  }
  async function refresh(){if(refreshing)return;refreshing=true;var controller=new AbortController(),timer=setTimeout(function(){controller.abort()},8000);try{var response=await fetch('api/join.php?action=assessment',{cache:'no-store',credentials:'omit',signal:controller.signal});if(!response.ok)throw Error('unavailable');var data=await response.json();render(data);$('assessment-status').textContent='内容已更新'}catch(_){$('assessment-status').textContent='暂时无法加载最新消息，请稍后刷新。';if(!signatures.notices)$('assessment-notice-list').innerHTML='<p class="assessment-empty">通知暂时无法加载，请刷新重试。</p>';if(!signatures.examiners)$('assessment-examiner-preview').innerHTML='<p class="assessment-empty">考官信息暂时无法加载</p>'}finally{clearTimeout(timer);refreshing=false}}
  refresh();setInterval(function(){if(!document.hidden)refresh()},30000);window.addEventListener('pageshow',function(e){if(e.persisted)refresh()});document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh()});
}());

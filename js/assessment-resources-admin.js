(function(){
  'use strict';
  var $=function(id){return document.getElementById(id)},admin=window.QIQIYOU_ASSESSMENT_ADMIN,records=[],contacts={},previewURL='',contactDirty=false;if(!admin)return;
  var form=$('assessment-quality-form'),contactForm=$('assessment-contact-form');
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function safe(src){try{var u=new URL(src,location.href);return src&&u.origin===location.origin&&/^https?:$/.test(u.protocol)?u.href:''}catch(_){return ''}}
  function typeLabel(type){return type==='priority'?'优先派单群质检':type==='after-sales'?'售后质检':'历史未分类（不公示）'}
  var countInput=$('quality-member-count'),second=$('quality-second-member'),mapInputs=Array.from(form.querySelectorAll('[name=qualityMap]'));
  function membersOf(r){return r.members&&r.members.length?r.members:[{number:r.number,orderId:r.orderId}]}
  function memberMode(){var pair=countInput.value==='2';second.hidden=!pair;second.disabled=!pair;$('quality-first-member-label').textContent=pair?'成员一':'成员信息'}
  countInput.addEventListener('change',memberMode);
  form.elements.grade.addEventListener('change',function(){countInput.value=this.value.startsWith('双考')?'2':'1';memberMode()});
  mapInputs.forEach(function(el){el.addEventListener('change',function(){mapInputs[0].setCustomValidity('')})});
  function render(){
    var q=$('quality-admin-search').value.trim().toLocaleLowerCase(),found=records.filter(function(r){return (membersOf(r).map(function(m){return m.number+' '+m.orderId}).join(' ')+' '+r.grade+' '+(r.maps||[]).join(' ')+' '+typeLabel(r.type)).toLocaleLowerCase().includes(q)});
    $('quality-admin-body').innerHTML=found.length?found.map(function(r){return '<tr><td><div class="quality-admin-members">'+membersOf(r).map(function(m){return '<span><strong>'+esc(m.orderId)+'</strong><small>'+esc(m.number)+'</small></span>'}).join('')+'</div></td><td>'+esc(r.grade)+'</td><td>'+esc((r.maps||[]).join('、')||'待补充')+'</td><td>'+esc(typeLabel(r.type))+'</td><td><div><button type="button" data-quality-edit="'+esc(r.id)+'">编辑</button><button type="button" data-quality-delete="'+esc(r.id)+'">删除</button></div></td></tr>'}).join(''):'<tr><td colspan="5">'+(q?'未找到匹配的名单':'暂无质检通过名单')+'</td></tr>';
    $('quality-admin-count').textContent=records.length+' / 2000 组';$('quality-admin-status').textContent=q?'找到 '+found.length+' 组':'共 '+records.length+' 组';
  }
  function reset(){$('quality-form-heading').textContent='录入质检名单';form.reset();form.querySelectorAll('[data-legacy-grade]').forEach(function(el){el.remove()});form.elements.grade.selectedIndex=0;form.elements.id.value='';form.elements.version.value='';countInput.value='1';memberMode();mapInputs[0].setCustomValidity('');$('quality-admin-cancel').hidden=true;form.querySelector('[type=submit]').textContent='添加质检名单'}
  $('quality-admin-cancel').addEventListener('click',reset);$('quality-admin-search').addEventListener('input',render);
  form.addEventListener('submit',async function(e){
    e.preventDefault();var maps=mapInputs.filter(function(el){return el.checked}).map(function(el){return el.value});
    if(!maps.length){mapInputs[0].setCustomValidity('请至少选择一张质检地图');mapInputs[0].reportValidity();return}
    var members=[{number:form.elements.number.value.trim(),orderId:form.elements.orderId.value.trim()}];
    if(countInput.value==='2')members.push({number:form.elements.number2.value.trim(),orderId:form.elements.orderId2.value.trim()});
    if(members.length===2&&members[0].number===members[1].number){admin.message('同组两位成员的编号不可重复。',true);return}
    var b=form.querySelector('[type=submit]');b.disabled=true;
    try{var body=new FormData(form);body.set('members',JSON.stringify(members));body.set('maps',JSON.stringify(maps));var data=await admin.request('assessment-quality-save',body);records=data.qualityRecords;render();reset();admin.message('质检名单已保存，仅优先派单群质检在前台展示。');await admin.audit()}catch(error){admin.message(error.message,true)}finally{b.disabled=false}
  });
  $('quality-admin-body').addEventListener('click',async function(e){
    var edit=e.target.closest('[data-quality-edit]'),remove=e.target.closest('[data-quality-delete]'),button=edit||remove;if(!button)return;
    var id=button.getAttribute(edit?'data-quality-edit':'data-quality-delete'),item=records.find(function(r){return r.id===id});if(!item)return;
    if(edit){
      reset();$('quality-form-heading').textContent='编辑质检名单';form.elements.id.value=item.id;form.elements.version.value=item.version;form.elements.type.value=item.type||'unclassified';
      if(!Array.from(form.elements.grade.options).some(function(o){return o.value===item.grade})){var o=document.createElement('option');o.value='';o.textContent='原等级：'+item.grade+'（请选择单考或双考）';o.dataset.legacyGrade='';o.disabled=true;form.elements.grade.insertBefore(o,form.elements.grade.firstChild);form.elements.grade.value=''}else form.elements.grade.value=item.grade;
      var members=membersOf(item);form.elements.number.value=members[0].number;form.elements.orderId.value=members[0].orderId;countInput.value=String(members.length);memberMode();
      if(members[1]){form.elements.number2.value=members[1].number;form.elements.orderId2.value=members[1].orderId}
      mapInputs.forEach(function(el){el.checked=(item.maps||[]).includes(el.value)});
      form.querySelector('[type=submit]').textContent='保存修改';$('quality-admin-cancel').hidden=false;form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});form.elements.number.focus({preventScroll:true});return;
    }
    if(!confirm('确定删除「'+membersOf(item).map(function(m){return m.number}).join('、')+'」的整组质检名单吗？'))return;
    button.disabled=true;try{var f=new FormData();f.set('id',item.id);f.set('version',item.version);var result=await admin.request('assessment-quality-delete',f);records=result.qualityRecords;render();if(form.elements.id.value===id)reset();admin.message('整组质检名单已删除。');await admin.audit()}catch(error){admin.message(error.message,true)}finally{button.disabled=false}
  });
  $('quality-admin-refresh').addEventListener('click',async function(){this.disabled=true;try{var data=await admin.request('assessment-editor');records=data.qualityRecords;render();admin.message('质检通过名单已刷新。')}catch(error){admin.message(error.message,true)}finally{this.disabled=false}});
  function showContact(){if(previewURL){URL.revokeObjectURL(previewURL);previewURL=''}var c=contacts[contactForm.elements.id.value];if(!c)return;contactForm.reset();contactForm.elements.id.value=c.id;contactForm.elements.version.value=c.version;contactForm.elements.name.value=c.name;contactForm.elements.contactUrl.value=c.contactUrl;contactForm.elements.contactUrl.disabled=c.id==='report';var img=$('assessment-contact-preview'),src=safe(c.src);img.hidden=!src;if(src)img.src=src;else img.removeAttribute('src');contactDirty=false}
  contactForm.elements.id.addEventListener('change',showContact);contactForm.addEventListener('input',function(){contactDirty=true});
  contactForm.elements.image.addEventListener('change',function(){var file=this.files[0];if(!file)return;if(file.size>4*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)){this.value='';admin.message('请选择4MB以内的PNG、JPG或WebP二维码图片。',true);return}if(previewURL)URL.revokeObjectURL(previewURL);previewURL=URL.createObjectURL(file);$('assessment-contact-preview').src=previewURL;$('assessment-contact-preview').hidden=false;contactForm.elements.contactUrl.value='';contactDirty=true});
  contactForm.addEventListener('submit',async function(e){e.preventDefault();var b=contactForm.querySelector('[type=submit]');b.disabled=true;try{var result=await admin.request('assessment-contact-save',new FormData(contactForm));contacts=result.contacts;showContact();admin.message('联系二维码已更新。');await admin.audit()}catch(error){admin.message(error.message,true)}finally{b.disabled=false}});
  $('assessment-contacts-refresh').addEventListener('click',async function(){this.disabled=true;try{var e=await admin.request('assessment-editor');contacts=e.contacts;showContact();admin.message('联系二维码资料已刷新。')}catch(error){admin.message(error.message,true)}finally{this.disabled=false}});
  function apply(e){if(!e){records=[];contacts={};contactDirty=false;reset();render();return}records=e.qualityRecords||[];contacts=e.contacts||{};render();if(!contactDirty)showContact()}
  window.addEventListener('assessment:editor',function(e){apply(e.detail)});if(window.QIQIYOU_ASSESSMENT_EDITOR_DATA)apply(window.QIQIYOU_ASSESSMENT_EDITOR_DATA);
}());

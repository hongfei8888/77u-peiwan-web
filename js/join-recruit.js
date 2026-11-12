(function(){
  'use strict';
  var grid=document.getElementById('recruit-grid'),dialog=document.getElementById('recruit-qr-dialog'),groups={},signature='',refreshing=false,opener=null,activeId='',closing=false,overflow='',animation=null;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)');
  var today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function unavailable(g){return !g.enabled||!g.expires||g.expires<today;}
  function urlFor(g){try{var u=new URL(g.src,location.href);return u.origin===location.origin&&/^https?:$/.test(u.protocol)?u.href:''}catch(_){return '';}}
  function element(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
  function imageFailure(img){img.addEventListener('error',function(){var note=element('span','recruit-unavailable','二维码暂时无法加载');img.parentElement.replaceChildren(note);});}
  function prepare(g){
    document.getElementById('recruit-modal-title').textContent=g.name;
    var img=document.getElementById('recruit-modal-image'),status=document.getElementById('recruit-modal-message'),save=document.getElementById('recruit-modal-save');
    document.getElementById('recruit-modal-frame').classList.toggle('is-screenshot',g.display==='screenshot');
    status.textContent='二维码加载中…';status.hidden=false;img.hidden=false;
    img.onload=function(){status.hidden=true;img.hidden=false;};img.onerror=function(){img.hidden=true;status.hidden=false;status.textContent='二维码暂时无法加载，请关闭后重试。';};
    img.src=urlFor(g);img.alt=g.name+'二维码';save.href=urlFor(g);save.download=g.name+'.png';
    if(img.complete&&img.naturalWidth)status.hidden=true;
  }
  function close(){if(!dialog.open||closing)return;closing=true;if(animation)animation.cancel();function finish(){dialog.close();if(animation)animation.cancel();animation=null;closing=false;}
    if(reduce.matches){finish();return;}animation=dialog.animate([{opacity:1,translate:'0 0'},{opacity:0,translate:'0 8px'}],{duration:200,easing:'ease-in',fill:'forwards'});animation.finished.then(finish,finish);
  }
  grid.addEventListener('click',function(e){var b=e.target.closest('[data-qr-open]');if(!b)return;var g=groups[b.dataset.qrOpen];if(!g||unavailable(g)||!urlFor(g))return;opener=b;activeId=b.dataset.qrOpen;overflow=document.body.style.overflow;prepare(g);document.body.style.overflow='hidden';dialog.showModal();if(!reduce.matches)animation=dialog.animate([{opacity:0,translate:'0 14px'},{opacity:1,translate:'0 0'}],{duration:340,easing:'cubic-bezier(.22,1,.36,1)'});});
  dialog.querySelector('.recruit-close').addEventListener('click',close);dialog.addEventListener('cancel',function(e){e.preventDefault();close();});
  dialog.addEventListener('click',function(e){var r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))close();});
  dialog.addEventListener('close',function(){document.body.style.overflow=overflow;if(opener&&opener.isConnected)opener.focus({preventScroll:true});else document.getElementById('recruit-groups-title').focus({preventScroll:true});activeId='';});
  function render(data){var next=JSON.stringify([data,today]);if(next===signature)return;signature=next;groups=data;grid.replaceChildren();
    var ids=Object.keys(data).filter(function(id){return data[id].enabled&&urlFor(data[id]);});grid.classList.toggle('has-many',ids.length>2);
    ids.forEach(function(id,index){var g=data[id],card=element('article','recruit-card'),copy=element('div','recruit-card-copy');copy.append(element('span','recruit-card-number','GROUP / '+String(index+1).padStart(2,'0')),element('h3','',g.name));
      if(unavailable(g)){copy.append(element('p','','等待更新二维码'));card.append(copy,element('div','recruit-unavailable','二维码已过期\n请联系客服获取新码'));}
      else{copy.append(element('p','','有效期至 '+g.expires.replace(/-/g,'.')),element('p','recruit-card-hint','点击二维码，放大查看 ↗'));var button=element('button','recruit-qr-button');button.type='button';button.dataset.qrOpen=id;button.setAttribute('aria-label','放大'+g.name+'二维码');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','recruit-qr-dialog');var frame=element('span','recruit-qr-frame'+(g.display==='screenshot'?' is-screenshot':'')),img=element('img');img.src=urlFor(g);img.alt=g.name+'二维码';img.decoding='async';imageFailure(img);frame.append(img);button.append(frame);card.append(copy,button);}grid.append(card);
    });
    if(!ids.length){var empty=element('p','recruit-empty','入群二维码正在准备中，');var link=element('a','','联系客服');link.href='contact.html';empty.append(link,document.createTextNode('获取最新入口。'));grid.append(empty);}
    grid.setAttribute('aria-busy','false');if(dialog.open){var g=data[activeId];if(!g||unavailable(g)||!urlFor(g))close();else prepare(g);}
  }
  async function refresh(){if(refreshing)return;refreshing=true;var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},7000);try{
    var response=await fetch('api/join.php?action=groups',{cache:'no-store',credentials:'omit',signal:controller.signal});if(!response.ok)throw Error('unavailable');var data=await response.json();if(/^\d{4}-\d{2}-\d{2}$/.test(data.today))today=data.today;if(!data.groups||typeof data.groups!=='object')throw Error('invalid');render(data.groups);
  }catch(_){if(!signature){grid.replaceChildren(element('p','recruit-empty','二维码暂时无法加载，请稍后刷新，或联系客服获取入群入口。'));grid.setAttribute('aria-busy','false');}}finally{clearTimeout(timer);refreshing=false;}}
  refresh();window.addEventListener('pageshow',function(e){if(e.persisted)refresh();});setInterval(function(){if(!document.hidden)refresh();},30000);document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh();});
  reduce.addEventListener('change',function(){if(animation)animation.cancel();});
}());

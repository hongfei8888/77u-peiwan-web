(function () {
  'use strict';
  var base = new URL('../', document.currentScript.src);
  function local(value) { return new URL(value, base).href; }
  var config = window.QIQIYOU_CUSTOMER_SERVICE;
  var dialog = document.getElementById('support-dialog');
  if (!config || !dialog || typeof dialog.showModal !== 'function') return;

  var triggers = Array.from(document.querySelectorAll('[data-support-open]'));
  var list = document.getElementById('support-list');
  var detail = document.getElementById('support-detail');
  var body = dialog.querySelector('.support-body');
  var closeButton = document.getElementById('support-close');
  var backButton = document.getElementById('support-back');
  var image = document.getElementById('support-qr');
  var status = document.getElementById('support-qr-status');
  var statusText = document.getElementById('support-qr-status-text');
  var retry = document.getElementById('support-retry');
  var save = document.getElementById('support-save');
  var openLink = document.getElementById('support-open-link');
  var selected = null;
  var returnFocus = null;
  var listFocus = null;
  var savedScroll = null;
  var pointerOutside = false;
  var managedLoading=false,managedAt=0;
  async function managedCodes(){
    if(managedLoading||Date.now()-managedAt<15000||location.protocol==='file:')return;
    managedLoading=true;var controller=new AbortController(),timeout=setTimeout(function(){controller.abort()},5000);
    try{var r=await fetch(local('api/join.php?action=contact-codes'),{cache:'no-store',credentials:'omit',signal:controller.signal});if(!r.ok)return;var data=await r.json(),changed=false;
      config.agents.forEach(function(agent){var c=data.contacts&&data.contacts[agent.id];if(!c)return;var src=new URL(c.src,base);if(src.origin!==base.origin)return;var link='';if(c.contactUrl){var u=new URL(c.contactUrl);if(u.protocol==='https:')link=u.href}if(agent.qr!==src.href||agent.label!==c.name||agent.contactUrl!==link){agent.qr=src.href;agent.label=c.name;agent.contactUrl=link;changed=true}});
      managedAt=Date.now();if(changed){renderAgents();if(selected){var button=list.querySelector('[data-support-id="'+selected.id+'"]');showAgent(selected,button)}}
    }catch(_){/* Keep the existing local contact cards available if the service is offline. */}finally{clearTimeout(timeout);managedLoading=false}
  }


  var dismissNudge = setupNudge();

  function setupNudge() {
    var nudge = document.getElementById('support-nudge');
    var copy = document.getElementById('support-nudge-copy');
    var dismiss = document.getElementById('support-nudge-close');
    if (!nudge || !copy || !dismiss) return function () {};
    var text = copy.textContent;
    var readable = document.createElement('span');
    readable.className = 'support-nudge-readable';
    readable.textContent = text;
    nudge.insertBefore(readable, copy);
    copy.setAttribute('aria-hidden', 'true');
    copy.textContent = '';
    var characters = Array.from(text).map(function (letter) {
      var character = document.createElement('span');
      character.className = 'support-nudge-char';
      character.textContent = letter;
      copy.appendChild(character);
      return character;
    });
    var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var timer = null, cursor = 0, ready = false, dismissed = false;
    function cancelTimer() { window.clearTimeout(timer); timer = null; }
    function finish() {
      cancelTimer();
      cursor = characters.length;
      characters.forEach(function (character) { character.style.opacity = '1'; character.classList.remove('is-current'); });
      nudge.dataset.complete = 'true';
    }
    function schedule(delay) {
      if (!ready || dismissed || document.hidden || timer !== null || preference.matches || cursor === characters.length) return;
      timer = window.setTimeout(advance, delay);
    }
    function advance() {
      timer = null;
      if (dismissed || document.hidden) return;
      if (preference.matches) return finish();
      if (cursor === characters.length) return;
      if (cursor) characters[cursor - 1].classList.remove('is-current');
      characters[cursor].style.opacity = '1';
      characters[cursor].classList.add('is-current');
      cursor += 1;
      if (cursor === characters.length) {
        finish();
      } else schedule(85);
    }
    function start() {
      if (ready || dismissed) return;
      ready = true;
      if (preference.matches) finish();
      else schedule(450);
    }
    function visibilityChanged() {
      if (document.hidden) cancelTimer();
      else schedule(120);
    }
    function motionChanged() {
      if (preference.matches) finish();
      else schedule(450);
    }
    function hide() {
      dismissed = true;
      nudge.hidden = true;
      cancelTimer();
      document.removeEventListener('visibilitychange', visibilityChanged);
      preference.removeEventListener('change', motionChanged);
    }
    dismiss.hidden = false;
    dismiss.addEventListener('click', function () {
      var restoreFocus = document.activeElement === dismiss;
      hide();
      if (restoreFocus) document.getElementById('support-entry').focus({ preventScroll: true });
    });
    document.addEventListener('visibilitychange', visibilityChanged);
    preference.addEventListener('change', motionChanged);
    start();
    return hide;
  }

  function renderAgents(){list.replaceChildren();config.agents.forEach(function (agent) {
    var row = document.createElement('li');
    row.className = 'support-row';
    var icon = document.createElement('img');
    icon.src = local(config.icon);
    icon.alt = '';
    icon.width = icon.height = 36;
    var label = document.createElement('span');
    label.className = 'support-name';
    label.textContent = agent.label;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'support-button';
    button.dataset.supportId = agent.id;
    button.textContent = '添加';
    button.setAttribute('aria-label', '添加' + agent.label);
    button.addEventListener('click', function () { showAgent(agent, button); });
    row.append(icon, label, button);
    list.appendChild(row);
  });
  }renderAgents();managedCodes();

  function showList(restoreFocus) {
    selected = null;
    image.onload = image.onerror = null;
    image.removeAttribute('src');
    detail.hidden = true;
    list.hidden = false;
    body.scrollTop = 0;
    if (restoreFocus && listFocus) {
      listFocus.focus({ preventScroll: true });
      listFocus.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
  }

  function loadQr() {
    if (!selected) return;
    var id = selected.id;
    image.hidden = true;
    save.hidden = true;
    retry.hidden = true;
    status.hidden = false;
    statusText.textContent = '二维码加载中…';
    image.onload = function () {
      if (!selected || selected.id !== id) return;
      image.hidden = false;
      save.hidden = false;
      status.hidden = true;
    };
    image.onerror = function () {
      if (!selected || selected.id !== id) return;
      statusText.textContent = '二维码暂时未能加载';
      retry.hidden = false;
    };
    image.src = local(selected.qr);
  }

  function showAgent(agent, button) {
    selected = agent;
    listFocus = button;
    document.getElementById('support-agent-name').textContent = agent.label;
    image.alt = agent.label + '企业微信二维码';
    image.width = agent.width;
    image.height = agent.height;
    save.href = local(agent.qr);
    save.download = agent.label + '-企业微信二维码.png';
    openLink.hidden=!agent.contactUrl;
    if(agent.contactUrl)openLink.href = agent.contactUrl;else openLink.removeAttribute('href');
    list.hidden = true;
    detail.hidden = false;
    body.scrollTop = 0;
    loadQr();
    document.getElementById('support-agent-name').focus({ preventScroll: true });
  }

  function lockScroll() {
    var style = document.body.style;
    savedScroll = { x: window.scrollX, y: window.scrollY, styles: {}, lenis: window.lenis, lenisWasStopped: window.lenis && window.lenis.isStopped };
    ['position', 'top', 'left', 'right', 'width', 'overflow', 'paddingRight'].forEach(function (key) { savedScroll.styles[key] = style[key]; });
    var gutter = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    if (gutter) style.paddingRight = (parseFloat(getComputedStyle(document.body).paddingRight) + gutter) + 'px';
    if (savedScroll.lenis) savedScroll.lenis.stop();
    style.position = 'fixed';
    style.top = -savedScroll.y + 'px';
    style.left = -savedScroll.x + 'px';
    style.right = '0';
    style.width = '100%';
    style.overflow = 'hidden';
  }

  function unlockScroll() {
    if (!savedScroll) return;
    var state = savedScroll;
    savedScroll = null;
    Object.keys(state.styles).forEach(function (key) { document.body.style[key] = state.styles[key]; });
    window.scrollTo({ left: state.x, top: state.y, behavior: 'instant' });
    if (state.lenis && !state.lenisWasStopped) state.lenis.start();
  }

  function open(trigger, event) {
    if (dialog.open) return;
    managedCodes();
    dismissNudge();
    var lightbox = document.getElementById('lightbox');
    if (lightbox && !lightbox.hidden && window.QiqiyouLightbox) window.QiqiyouLightbox.close();
    if (window.QiqiyouNav) window.QiqiyouNav.close({ restoreFocus: false });
    var navLinks = document.getElementById('nav-links');
    var navToggle = document.getElementById('nav-toggle');
    if (navLinks) navLinks.classList.remove('open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', '打开菜单');
    }
    returnFocus = trigger;
    listFocus = null;
    showList(false);
    lockScroll();
    dialog.dataset.input = event && event.detail > 0 ? 'pointer' : 'keyboard';
    dialog.showModal();
    triggers.forEach(function (el) { el.setAttribute('aria-expanded', 'true'); });
    closeButton.focus({ preventScroll: true });
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  triggers.forEach(function (trigger) {
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', dialog.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', function (event) { event.preventDefault(); open(trigger, event); });
    trigger.addEventListener('keydown', function (event) {
      if (event.key === ' ') { event.preventDefault(); open(trigger, event); }
    });
  });
  closeButton.addEventListener('click', close);
  setInterval(function(){if(dialog.open&&!document.hidden)managedCodes()},30000);
  backButton.addEventListener('click', function () { showList(true); });
  retry.addEventListener('click', loadQr);
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
  dialog.addEventListener('close', function () {
    unlockScroll();
    triggers.forEach(function (el) { el.setAttribute('aria-expanded', 'false'); });
    showList(false);
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
  });
  // Only a press and release outside the panel count as a backdrop click.
  function outside(event) {
    var rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }
  dialog.addEventListener('pointerdown', function (event) { pointerOutside = event.target === dialog && outside(event); });
  dialog.addEventListener('click', function (event) {
    if (pointerOutside && event.target === dialog && outside(event)) close();
    pointerOutside = false;
  });
  dialog.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    var focusable = Array.from(dialog.querySelectorAll('button, a[href]')).filter(function (el) { return !el.disabled && el.getClientRects().length > 0; });
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  });
})();

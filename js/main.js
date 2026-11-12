/* 柒柒游电竞 — carousel, navigation, image viewer and real-content marquees. */
(function () {
  'use strict';
  var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  var track = document.getElementById('carousel-track');
  var dotsBox = document.getElementById('carousel-dots');
  var carousel = document.getElementById('carousel');
  var pauseButton = document.getElementById('carousel-pause');
  var slides = track ? Array.from(track.children) : [];
  var current = 0, timer = null, userPaused = false, hovered = false, focused = false;
  var visible = !('IntersectionObserver' in window);

  function goTo(index, immediate) {
    if (!track || !slides.length) return;
    current = (index + slides.length) % slides.length;
    track.style.transition = preference.matches || immediate ? 'none' : '';
    track.style.transform = 'translateX(-' + current * 100 + '%)';
    if (carousel) carousel.dataset.slideIndex = String(current);
    slides.forEach(function (slide, index) {
      slide.setAttribute('aria-hidden', String(index !== current));
      slide.inert = index !== current;
    });
    if (dotsBox) Array.from(dotsBox.children).forEach(function (dot, index) {
      dot.classList.toggle('active', index === current);
      dot.setAttribute('aria-current', index === current ? 'true' : 'false');
    });
  }

  function updateAuto() {
    if (timer !== null) { window.clearInterval(timer); timer = null; }
    var reason = preference.matches ? 'reduced' : document.hidden ? 'hidden' :
      !visible ? 'offscreen' : userPaused ? 'manual' : focused ? 'focus' : hovered ? 'hover' :
      slides.length < 2 ? 'single' : '';
    if (!reason) timer = window.setInterval(function () { goTo(current + 1, false); }, 4000);
    if (carousel) {
      carousel.dataset.autoplayState = reason ? 'paused' : 'playing';
      carousel.dataset.autoplayReason = reason;
    }
    if (pauseButton) {
      pauseButton.disabled = preference.matches || slides.length < 2;
      pauseButton.textContent = preference.matches ? '已减少动态' : userPaused ? '继续播放' : '暂停轮播';
      pauseButton.setAttribute('aria-pressed', String(userPaused));
      pauseButton.setAttribute('aria-label', preference.matches ? '已按系统偏好停止自动轮播' : userPaused ? '继续自动轮播' : '暂停自动轮播');
    }
  }

  if (track && dotsBox && carousel && slides.length) {
    slides.forEach(function (slide, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', '切换到第 ' + (index + 1) + ' 张横幅');
      dot.addEventListener('click', function (event) { goTo(index, event.detail === 0); updateAuto(); });
      dot.addEventListener('keydown', function (event) {
        var next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 :
          event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : null;
        if (next === null) return;
        event.preventDefault();
        goTo(next, true);
        dotsBox.children[current].focus();
        updateAuto();
      });
      dotsBox.appendChild(dot);
    });
    carousel.addEventListener('mouseenter', function () { hovered = true; updateAuto(); });
    carousel.addEventListener('mouseleave', function () { hovered = false; updateAuto(); });
    var carouselRegion = carousel.closest('.activities') || carousel.parentElement;
    carouselRegion.addEventListener('focusin', function () { focused = true; updateAuto(); });
    carouselRegion.addEventListener('focusout', function () {
      window.queueMicrotask(function () { focused = carouselRegion.contains(document.activeElement); updateAuto(); });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; updateAuto(); },
        { threshold: .1 }).observe(carousel);
    }
    if (pauseButton) pauseButton.addEventListener('click', function () { userPaused = !userPaused; updateAuto(); });
    goTo(0, true);
    updateAuto();
    preference.addEventListener('change', function () { goTo(current, true); updateAuto(); });
    document.addEventListener('visibilitychange', updateAuto);
  }

  /* Each document owns its navigation state; scrolling only changes the bar. */
  var navLinks = Array.from(document.querySelectorAll('.nav-link'));
  var pageNames = { 'index.html': 'home', 'home.html': 'home', 'activities.html': 'activities', 'menu.html': 'menu', 'players.html': 'players', 'join.html': 'join', 'reviews.html': 'reviews', 'contact.html': 'contact', 'detail.html': 'menu' };
  function pageName(value) {
    var pathname = new URL(value, location.href).pathname;
    return pageNames[pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html'];
  }
  var currentPage = document.body.dataset.page || pageName(location.href);
  navLinks.forEach(function (link) {
    var active = pageName(link.href) === currentPage;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  var nav = document.getElementById('nav');
  if (currentPage === 'home' && nav) {
    // The panels follow the viewport; the illustration keeps its own size.
    var lastNavHeight = 0;
    function measureHomeNav() {
      var height = nav.getBoundingClientRect().height;
      if (height > 0 && Math.abs(height - lastNavHeight) > .01) {
        lastNavHeight = height;
        document.documentElement.style.setProperty('--home-nav-height', height + 'px');
      }
    }
    measureHomeNav();
    if ('ResizeObserver' in window) new ResizeObserver(measureHomeNav).observe(nav);
    else window.addEventListener('resize', measureHomeNav);
  }
  function onScrollFrame() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(function () { onScrollFrame(); scrollTicking = false; });
  }, { passive: true });
  onScrollFrame();

  function holdPageScroll() {
    var style = document.body.style;
    var state = { x: window.scrollX, y: window.scrollY, styles: {} };
    ['position', 'top', 'left', 'right', 'width', 'overflow', 'paddingRight'].forEach(function (key) { state.styles[key] = style[key]; });
    var gutter = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    if (gutter) style.paddingRight = (parseFloat(getComputedStyle(document.body).paddingRight) + gutter) + 'px';
    style.position = 'fixed';
    style.top = -state.y + 'px';
    style.left = -state.x + 'px';
    style.right = '0';
    style.width = '100%';
    style.overflow = 'hidden';
    return function () {
      Object.keys(state.styles).forEach(function (key) { style[key] = state.styles[key]; });
      window.scrollTo({ left: state.x, top: state.y, behavior: 'instant' });
    };
  }

  var toggle = document.getElementById('nav-toggle');
  var links = document.getElementById('nav-links');
  var releaseNavScroll = null;
  function setNavInput(event) {
    var keyboard = !event || event.detail === 0;
    if (nav) nav.dataset.input = keyboard ? 'keyboard' : 'pointer';
    if (links) links.style.transition = keyboard || preference.matches ? 'none' : '';
    if (toggle) toggle.querySelectorAll('span').forEach(function (line) {
      line.style.transition = keyboard || preference.matches ? 'none' : '';
    });
  }
  function closeMobileNav(options) {
    if (!toggle || !links) return;
    var wasOpen = links.classList.contains('open');
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '打开菜单');
    if (releaseNavScroll) { releaseNavScroll(); releaseNavScroll = null; }
    if (options && options.restoreFocus && wasOpen) toggle.focus({ preventScroll: true });
  }
  window.QiqiyouNav = { close: closeMobileNav };
  if (toggle && links) {
    toggle.setAttribute('aria-controls', 'nav-links');
    toggle.addEventListener('click', function (event) {
      setNavInput(event);
      if (links.classList.contains('open')) { closeMobileNav(); return; }
      links.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', '关闭菜单');
      releaseNavScroll = holdPageScroll();
    });
    links.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', function () { closeMobileNav(); }); });
    document.addEventListener('pointerdown', function (event) {
      if (links.classList.contains('open') && nav && !nav.contains(event.target)) closeMobileNav();
    });
    document.addEventListener('keydown', function (event) {
      if (!links.classList.contains('open')) return;
      if (event.key === 'Escape') { setNavInput(); closeMobileNav({ restoreFocus: true }); }
      if (event.key === 'Tab') {
        var items = [toggle].concat(Array.from(links.querySelectorAll('a,button')).filter(function (item) {
          return !item.disabled && item.getClientRects().length;
        }));
        var first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', function () {
      if (getComputedStyle(toggle).display === 'none') closeMobileNav();
    });
    preference.addEventListener('change', function () { if (preference.matches) setNavInput(); });
  }

  /* No clones and no perpetual motion are created for placeholder content. */
  function initMarquee(id) {
    var rail = document.getElementById(id);
    if (!rail) return;
    var box = rail.parentElement;
    var originals = Array.from(rail.children);
    var real = originals.filter(function (item) { return !item.className.includes('--placeholder') && item.querySelector('img'); });
    rail.dataset.motionState = 'static';
    if (!real.length || !rail.animate) return;
    var clones = originals.map(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a, button, input, [tabindex]').forEach(function (child) { child.setAttribute('tabindex', '-1'); });
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(function (child) { child.removeAttribute('id'); });
      rail.appendChild(clone);
      return clone;
    });
    if (!box.hasAttribute('tabindex')) box.tabIndex = 0;
    var animation = null, inView = !('IntersectionObserver' in window), hover = false, focus = false;
    function update() {
      var allowed = !preference.matches && !document.hidden && inView && !hover && !focus;
      rail.dataset.motionState = preference.matches ? 'reduced' : allowed ? 'playing' : 'paused';
      if (!animation) return;
      if (preference.matches) { animation.pause(); animation.currentTime = 0; }
      else if (allowed) animation.play();
      else animation.pause();
    }
    function measure() {
      if (animation) { animation.cancel(); animation = null; }
      clones.forEach(function (clone) { clone.style.display = preference.matches ? 'none' : ''; });
      box.style.overflowX = preference.matches ? 'auto' : '';
      if (preference.matches) { update(); return; }
      var distance = clones[0].offsetLeft - originals[0].offsetLeft;
      if (!(distance > 0)) return;
      animation = rail.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-' + distance + 'px)' }],
        { duration: Math.max(36000, distance / 28 * 1000), iterations: Infinity, easing: 'linear' });
      update();
    }
    box.addEventListener('mouseenter', function () { hover = true; update(); });
    box.addEventListener('mouseleave', function () { hover = false; update(); });
    box.addEventListener('focusin', function () { focus = true; update(); });
    box.addEventListener('focusout', function () {
      window.queueMicrotask(function () { focus = box.contains(document.activeElement); update(); });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; update(); }).observe(box);
    }
    preference.addEventListener('change', measure);
    document.addEventListener('visibilitychange', update);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(box);
    else window.addEventListener('resize', measure);
    rail.querySelectorAll('img').forEach(function (image) { image.addEventListener('load', measure, { once: true }); });
    measure();
  }
  initMarquee('players-track');
  initMarquee('reviews-track');

  function markPlayerImage(event) {
    var image = event.target;
    if (image && image.tagName === 'IMG' && image.closest('.player-card')) image.classList.add('img-loaded');
  }
  document.addEventListener('load', markPlayerImage, true);
  document.addEventListener('error', markPlayerImage, true);
  document.querySelectorAll('.player-card img').forEach(function (image) { if (image.complete) image.classList.add('img-loaded'); });

  var lightbox = document.getElementById('lightbox');
  var lightboxImage = document.getElementById('lightbox-img');
  var lightboxClose = document.getElementById('lightbox-close');
  var lightboxBackdrop = document.getElementById('lightbox-backdrop');
  var lightboxReturnFocus = null, releaseLightboxScroll = null;
  function openLightbox(image, long) {
    if (!lightbox || !lightboxImage || !lightboxClose) return;
    if (!lightbox.hidden) closeLightbox();
    closeMobileNav();
    lightboxReturnFocus = document.activeElement;
    releaseLightboxScroll = holdPageScroll();
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || '';
    lightbox.classList.toggle('lightbox-long', !!long);
    lightbox.hidden = false;
    lightbox.scrollTop = 0;
    lightboxClose.focus({ preventScroll: true });
  }
  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    lightboxImage.removeAttribute('src');
    lightbox.classList.remove('lightbox-long');
    if (releaseLightboxScroll) { releaseLightboxScroll(); releaseLightboxScroll = null; }
    if (lightboxReturnFocus && lightboxReturnFocus.isConnected) lightboxReturnFocus.focus({ preventScroll: true });
  }
  window.QiqiyouLightbox = { open: openLightbox, close: closeLightbox };
  if (lightbox && lightboxImage && lightboxClose) {
    document.querySelectorAll('.players-marquee, .reviews-marquee').forEach(function (box) {
      box.addEventListener('click', function (event) { if (event.target.tagName === 'IMG') openLightbox(event.target); });
    });
    document.querySelectorAll('img.contact-card-qr').forEach(function (image) {
      image.addEventListener('click', function () { openLightbox(image); });
    });
    lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (event) {
      if (lightbox.hidden) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'Tab') { event.preventDefault(); lightboxClose.focus(); }
    });
  }
})();

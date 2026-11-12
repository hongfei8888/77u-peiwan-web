/* 柒柒游电竞 — restrained hero motion.
   Content is visible before JavaScript. Motion uses native Web Animations and
   never owns scrolling, delays access, or depends on an animation library. */
(function () {
  'use strict';
  var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var stage = document.querySelector('.mascot-stage');
  var introAnimations = [];
  var shineAnimation = null;
  var visible = true;
  var frame = null;
  var pointer = { x: 0, y: 0 };
  var layers = stage ? Array.from(stage.querySelectorAll('.stage-background, .mascot-character')) : [];
  var returning = [];

  function cancelIntro() {
    introAnimations.forEach(function (animation) { animation.cancel(); });
    introAnimations = [];
    if (shineAnimation) { shineAnimation.cancel(); shineAnimation = null; }
  }

  function playIntro() {
    if (preference.matches || !Element.prototype.animate) return;
    var targets = document.querySelectorAll('.hero-kicker, .hero-title, .hero-tagline, .hero-actions, .hero-community, .hero-right');
    Array.from(targets).forEach(function (element, index) {
      var animation = element.animate([
        { opacity: 0, translate: element.classList.contains('hero-right') ? '0 0' : '0 12px' },
        { opacity: 1, translate: '0 0' }
      ], { duration: 480, delay: index * 80, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
      introAnimations.push(animation);
    });
    var shine = stage && stage.querySelector('.stage-shine');
    if (shine) {
      shineAnimation = shine.animate([
        { opacity: 0, translate: '-130% 0' },
        { opacity: .52, translate: '100% 0', offset: .35 },
        { opacity: 0, translate: '430% 0' }
      ], { duration: 900, delay: 200, easing: 'ease-out' });
    }
  }

  function cancelReturn() {
    returning.forEach(function (animation) { animation.cancel(); });
    returning = [];
  }

  function resetLayers(animate) {
    if (frame !== null) { window.cancelAnimationFrame(frame); frame = null; }
    var positions = layers.map(function (layer) { return getComputedStyle(layer).translate; });
    cancelReturn();
    layers.forEach(function (layer, index) {
      layer.style.translate = '0 0';
      if (animate && layer.animate && positions[index] !== 'none' && positions[index] !== '0px') {
        returning.push(layer.animate([
          { translate: positions[index] }, { translate: '0 0' }
        ], { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' }));
      }
    });
    pointer.x = pointer.y = 0;
  }

  function canMove() {
    return !preference.matches && finePointer.matches && visible && !document.hidden;
  }

  function updateState() {
    if (preference.matches) cancelIntro();
    introAnimations.concat(shineAnimation ? [shineAnimation] : []).forEach(function (animation) {
      if (animation.playState === 'finished' || animation.playState === 'idle') return;
      if (document.hidden || !visible) animation.pause();
      else animation.play();
    });
    if (!stage) return;
    stage.dataset.motionReady = String(!preference.matches);
    stage.dataset.motionState = preference.matches ? 'reduced' :
      !finePointer.matches ? 'static' : canMove() ? 'active' : 'paused';
    if (!canMove()) resetLayers(false);
  }

  /* Shared page motion: quiet reveals and shallow depth, never scroll ownership. */
  var pageAnimations = [];
  var revealObserver = null;

  function animateReveal(elements, options) {
    if (preference.matches || !Element.prototype.animate) return;
    var settings = options || {};
    Array.from(elements).filter(function (element) {
      return element && element.dataset.motionRevealed !== 'true';
    }).forEach(function (element, index) {
      element.dataset.motionRevealed = 'true';
      var animation = element.animate([
        {
          opacity: settings.fromOpacity == null ? 0 : settings.fromOpacity,
          translate: (settings.x || 0) + 'px ' + (settings.y == null ? 24 : settings.y) + 'px',
          filter: 'blur(' + (settings.blur == null ? 5 : settings.blur) + 'px)'
        },
        { opacity: 1, translate: '0 0', filter: 'blur(0)' }
      ], {
        duration: settings.duration || 620,
        delay: (settings.delay || 0) + index * (settings.stagger == null ? 70 : settings.stagger),
        easing: 'cubic-bezier(.2,.7,.2,1)',
        fill: 'backwards'
      });
      pageAnimations.push(animation);
    });
  }

  function observeReveal(container, targets, options) {
    if (!container || !targets.length) return;
    if (!('IntersectionObserver' in window)) {
      animateReveal(targets, options);
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var item = entry.target;
          animateReveal(item._motionTargets || [item], item._motionOptions || {});
          revealObserver.unobserve(item);
        });
      }, { threshold: .08, rootMargin: '0px 0px -5% 0px' });
    }
    container._motionTargets = targets;
    container._motionOptions = options;
    revealObserver.observe(container);
  }

  function initPageMotion() {
    if (preference.matches || !Element.prototype.animate) return;

    var intro = document.querySelector('.page-intro');
    if (intro) animateReveal(intro.querySelectorAll('h1, .page-intro-row > p'), { y: 20, blur: 4, duration: 600, stagger: 90 });

    var featureCards = Array.from(document.querySelectorAll('.poster-menu-card--feature'));
    var compactCards = Array.from(document.querySelectorAll('.poster-menu-card--compact, .poster-menu-card--secondary'));
    var menuGrid = document.querySelector('.poster-menu-grid');
    if (menuGrid) {
      observeReveal(menuGrid, featureCards, { y: 26, blur: 5, duration: 680, stagger: 100 });
      if (compactCards.length) observeReveal(compactCards[0], compactCards, { y: 20, blur: 3, duration: 560, stagger: 65 });
    }

    var sceneGroups = [
      ['.companion-hero', '.companion-copy, .companion-scene'],
      ['.people-gallery', '.minor-heading, #players-track'],
      ['.streamers-section', '.section-title, .streamer-rows'],
      ['.page-activities-content', '.carousel'],
      ['.recruit-strip', ':scope > *'],
      ['.feedback-section', '#reviews-track, .feedback-benefits'],
      ['.contact-layout', '.contact-welcome, .contact-panel']
    ];
    sceneGroups.forEach(function (selectors) {
      var container = document.querySelector(selectors[0]);
      if (!container) return;
      observeReveal(container, Array.from(container.querySelectorAll(selectors[1])), { y: 26, blur: 5, duration: 650, stagger: 90 });
    });

    var footer = document.querySelector('.footer');
    if (footer) observeReveal(footer, [footer], { y: 24, blur: 3, fromOpacity: .45, duration: 700, stagger: 0 });
  }

  function initFeatureParallax() {
    if (preference.matches || !finePointer.matches) return;
    document.querySelectorAll('.poster-menu-card--feature').forEach(function (card) {
      var art = card.querySelector('.poster-feature-art');
      if (!art || card.dataset.parallaxReady === 'true') return;
      card.dataset.parallaxReady = 'true';
      var cardFrame = null;
      var nextX = 0, nextY = 0;
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        nextX = ((event.clientX - rect.left) / rect.width - .5) * 12;
        nextY = ((event.clientY - rect.top) / rect.height - .5) * 8;
        if (cardFrame !== null) return;
        cardFrame = window.requestAnimationFrame(function () {
          cardFrame = null;
          art.style.setProperty('--pm-parallax-x', nextX.toFixed(2) + 'px');
          art.style.setProperty('--pm-parallax-y', nextY.toFixed(2) + 'px');
        });
      }, { passive: true });
      card.addEventListener('pointerleave', function () {
        if (cardFrame !== null) { window.cancelAnimationFrame(cardFrame); cardFrame = null; }
        art.style.setProperty('--pm-parallax-x', '0px');
        art.style.setProperty('--pm-parallax-y', '0px');
      });
    });
  }

  if (stage) {
    var bounds = stage.getBoundingClientRect();
    visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        updateState();
      }, { threshold: 0 }).observe(stage);
    }
    stage.addEventListener('pointermove', function (event) {
      if (!canMove() || event.pointerType === 'touch') return;
      cancelReturn();
      var rect = stage.getBoundingClientRect();
      pointer.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
      pointer.y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
      if (frame !== null) return;
      frame = window.requestAnimationFrame(function () {
        frame = null;
        if (!canMove()) return;
        layers.forEach(function (layer) {
          var distance = layer.classList.contains('stage-background') ? 8 : 4;
          layer.style.translate = (pointer.x * distance).toFixed(2) + 'px ' + (pointer.y * distance).toFixed(2) + 'px';
        });
      });
    }, { passive: true });
    stage.addEventListener('pointerleave', function () { resetLayers(canMove()); });
  }
  playIntro();
  initPageMotion();
  initFeatureParallax();
  updateState();
  preference.addEventListener('change', function () {
    if (preference.matches) pageAnimations.forEach(function (animation) { animation.cancel(); });
    updateState();
  });
  finePointer.addEventListener('change', function () { updateState(); initFeatureParallax(); });
  document.addEventListener('visibilitychange', updateState);
})();

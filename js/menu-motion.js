/* Menu motion: short entrances, shallow image depth, quiet ambient points. */
(function () {
  'use strict';
  if (!document.body.classList.contains('page-menu')) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktop = window.matchMedia('(hover: hover) and (pointer: fine)');
  var animations = new Set();
  var observer = null;
  var targets = Array.from(document.querySelectorAll('.poster-menu-card, .menu-after-games, .menu-lottery, .menu-owner-rights .menu-section-heading'));

  function reveal(elements) {
    elements.forEach(function (element, index) {
      if (element.dataset.menuRevealed) return;
      element.dataset.menuRevealed = 'true';
      if (reduced.matches || !element.animate) return;
      var animation = element.animate([
        { opacity: .45, translate: '0 12px' },
        { opacity: 1, translate: '0 0' }
      ], { duration: 440, delay: Math.min(index * 45, 135), easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      animations.add(animation);
      function remove() { animations.delete(animation); }
      animation.onfinish = remove;
      animation.oncancel = remove;
    });
  }

  if (!reduced.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (entry) { return entry.isIntersecting; });
      reveal(batch.map(function (entry) { observer.unobserve(entry.target); return entry.target; }));
    }, { threshold: .04, rootMargin: '0px 0px -12px 0px' });
    targets.forEach(function (element) { observer.observe(element); });
  } else reveal(targets);

  // Animate only the image. Text and hit areas never tilt or follow the pointer.
  var depthLayers = [];
  document.querySelectorAll('.poster-menu-card--feature').forEach(function (card) {
    var art = card.querySelector('.poster-feature-art');
    if (!art) return;
    var x = 0, y = 0, aimX = 0, aimY = 0, frame = null;
    function tick() {
      frame = null;
      x += (aimX - x) * .15;
      y += (aimY - y) * .15;
      if (Math.abs(aimX - x) + Math.abs(aimY - y) < .04) { x = aimX; y = aimY; }
      art.style.setProperty('--pm-parallax-x', x.toFixed(2) + 'px');
      art.style.setProperty('--pm-parallax-y', y.toFixed(2) + 'px');
      if (x !== aimX || y !== aimY) frame = requestAnimationFrame(tick);
    }
    function reset(immediate) {
      aimX = aimY = 0;
      if (immediate) {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null; x = y = 0;
        art.style.setProperty('--pm-parallax-x', '0px');
        art.style.setProperty('--pm-parallax-y', '0px');
      } else if (frame === null) frame = requestAnimationFrame(tick);
    }
    depthLayers.push(reset);
    card.addEventListener('pointermove', function (event) {
      if (reduced.matches || !desktop.matches || document.hidden || event.pointerType === 'touch') return;
      var rect = card.getBoundingClientRect();
      aimX = Math.max(-.5, Math.min(.5, (event.clientX - rect.left) / rect.width - .5)) * 6;
      aimY = Math.max(-.5, Math.min(.5, (event.clientY - rect.top) / rect.height - .5)) * 4;
      if (frame === null) frame = requestAnimationFrame(tick);
    }, { passive: true });
    card.addEventListener('pointerleave', function () { reset(false); });
    card.addEventListener('pointercancel', function () { reset(true); });
  });

  var canvas = document.createElement('canvas');
  canvas.className = 'menu-ambient-points';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  var context = canvas.getContext('2d');
  var width = 0, height = 0, points = [], ambientFrame = null, last = 0;
  function resize() {
    width = innerWidth; height = innerHeight;
    var ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    var count = width < 769 ? 8 : 22;
    points = Array.from({ length: count }, function () {
      return { x: Math.random() * width, y: Math.random() * height, speed: .08 + Math.random() * .12, radius: .8 + Math.random() * .6 };
    });
  }
  function draw(time) {
    ambientFrame = null;
    if (!context || reduced.matches || document.hidden) return;
    if (time - last >= 32) {
      var delta = Math.min((time - last) / 16.67, 3); last = time;
      context.clearRect(0, 0, width, height);
      context.fillStyle = 'rgba(105, 149, 195, .48)';
      points.forEach(function (point) {
        point.y -= point.speed * delta;
        if (point.y < -3) point.y = height + 3;
        context.beginPath(); context.arc(point.x, point.y, point.radius, 0, Math.PI * 2); context.fill();
      });
    }
    ambientFrame = requestAnimationFrame(draw);
  }
  function sync() {
    if (reduced.matches) {
      if (observer) { observer.disconnect(); observer = null; }
      animations.forEach(function (animation) { animation.cancel(); });
      reveal(targets);
    }
    if (reduced.matches || document.hidden) {
      depthLayers.forEach(function (reset) { reset(true); });
      if (ambientFrame !== null) cancelAnimationFrame(ambientFrame);
      ambientFrame = null;
      if (context) context.clearRect(0, 0, width, height);
    } else if (context && ambientFrame === null) {
      last = performance.now(); ambientFrame = requestAnimationFrame(draw);
    }
    animations.forEach(function (animation) { if (document.hidden) animation.pause(); else animation.play(); });
  }
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('blur', function () { depthLayers.forEach(function (reset) { reset(true); }); });
  window.addEventListener('pagehide', function () {
    animations.forEach(function (animation) { animation.cancel(); });
    depthLayers.forEach(function (reset) { reset(true); });
    if (ambientFrame !== null) cancelAnimationFrame(ambientFrame);
    ambientFrame = null;
  });
  window.addEventListener('pageshow', sync);
  desktop.addEventListener('change', function () { depthLayers.forEach(function (reset) { reset(true); }); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  resize(); sync();
})();

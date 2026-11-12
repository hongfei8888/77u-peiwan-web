/* Fresh menu visits and reloads start at the top; history traversal keeps its place. */
(function () {
  'use strict';
  var navigation = performance.getEntriesByType('navigation')[0];
  var fresh = !navigation || navigation.type !== 'back_forward';
  var interacted = false;
  var previous = history.scrollRestoration;
  if (fresh && !location.hash) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    // Old bundles may have saved a position in this same history entry.
    var state = Object.assign({}, history.state);
    delete state.posterPosition;
    history.replaceState(state, '', location.href);
  }
  function top() {
    if (!fresh || location.hash || interacted) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
  function input() { interacted = true; }
  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (type) {
    window.addEventListener(type, input, { passive: true, once: true });
  });
  top();
  document.addEventListener('DOMContentLoaded', top, { once: true });
  window.addEventListener('load', top, { once: true });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) return;
    top();
  });
  window.addEventListener('pagehide', function () {
    if ('scrollRestoration' in history) history.scrollRestoration = previous || 'auto';
  });
})();

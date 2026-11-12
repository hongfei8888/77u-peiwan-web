/* Keep existing single-page bookmarks working after the move to real pages. */
(function () {
  'use strict';
  var base = new URL('../', document.currentScript.src);
  var routes = {
    '#activities': 'activities.html',
    '#menu': 'menu.html#menu',
    '#players': 'players.html',
    '#streamers': 'players.html#streamers',
    '#reviews': 'reviews.html',
    '#contact': 'contact.html'
  };
  function redirect() {
    if (location.pathname !== base.pathname && location.pathname !== base.pathname + 'index.html' && location.pathname !== base.pathname + 'home.html') return;
    var route = routes[location.hash];
    if (!route) return;
    var destination = new URL(route, base);
    destination.search = location.search;
    location.replace(destination.href);
  }
  redirect();
  window.addEventListener('hashchange', redirect);
})();

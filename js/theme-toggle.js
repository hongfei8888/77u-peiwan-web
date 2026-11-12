/* 主题切换 · 柒柒游电竞
   用法：在 </head> 前引入 <script src="js/theme-toggle.js?v=1"></script>
   行为：head 解析阶段同步设置 data-theme（防闪白）→ 注入浅色样式 → 注入切换按钮。
   首次访问跟随系统 prefers-color-scheme，之后以 localStorage 记忆为准。 */
(function () {
  'use strict';
  var KEY = 'qiqiyou-theme';
  var script = document.currentScript || (function () { var s = document.getElementsByTagName('script'); return s[s.length - 1]; })();
  var base = script && script.src ? script.src.replace(/js\/theme-toggle\.js.*$/, '') : '';
  var doc = document.documentElement;

  function stored() { try { return localStorage.getItem(KEY); } catch (_) { return null; } }
  function systemLight() { return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches; }

  function apply() {
    var v = stored();
    var light = v === 'light' || (!v && systemLight());
    doc.setAttribute('data-theme', light ? 'light' : 'dark');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#f5f5f6' : '#101014');
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(light));
      btn.setAttribute('aria-label', light ? '切换到深色模式' : '切换到浅色模式');
    }
  }

  if (!document.querySelector('link[href*="theme-light.css"]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = base + 'css/theme-light.css?v=1';
    (document.head || doc).appendChild(link);
  }
  apply();

  window.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('theme-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.type = 'button';
    btn.innerHTML =
      '<svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
      '<svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8Z"/></svg>';
    btn.addEventListener('click', function () {
      var next = doc.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(KEY, next); } catch (_) {}
      apply();
    });
    // 优先放进顶栏动作区（"特效"按钮旁边），后台页放管理操作区，都没有则悬浮兜底
    var actions = document.querySelector('.platform-topbar-actions');
    if (actions) {
      var fx = actions.querySelector('.fx-motion-switch');
      if (fx) fx.insertAdjacentElement('afterend', btn);
      else actions.insertBefore(btn, actions.firstChild);
    } else if (document.querySelector('.management-actions')) {
      document.querySelector('.management-actions').insertBefore(btn, document.querySelector('.management-actions').firstChild);
    } else {
      document.body.appendChild(btn);
      btn.classList.add('theme-toggle--float');
    }
    apply();
  });
}());

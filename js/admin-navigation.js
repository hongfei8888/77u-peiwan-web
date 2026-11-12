(function(){
  'use strict';
  var buttons=Array.from(document.querySelectorAll('[data-management-tab]')),panes=Array.from(document.querySelectorAll('[data-management-pane]'));
  function select(name){if(!buttons.some(function(b){return b.dataset.managementTab===name}))return;buttons.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.managementTab===name))});panes.forEach(function(p){p.hidden=p.dataset.managementPane!==name});history.replaceState(null,'','#'+name)}
  buttons.forEach(function(b){b.addEventListener('click',function(){select(b.dataset.managementTab)})});
  if(buttons.length)select(location.hash.slice(1)||buttons[0].dataset.managementTab);
  window.addEventListener('hashchange',function(){select(location.hash.slice(1))});
  document.querySelectorAll('.management-section-links a').forEach(function(a){a.addEventListener('click',function(){var target=document.getElementById(a.hash.slice(1));if(target&&target.tagName==='DETAILS')target.open=true})});
}());

'use strict';

window.addEventListener('load', function() {
  console.log('translating page');
  translatePage();
}, false);

function translatePage() {
  var nodes = document.querySelectorAll('[data-resource]');
  Array.prototype.forEach.call(nodes, function(node) {
    var resourceName = node.getAttribute('data-resource');
    var resourceText = chrome.i18n.getMessage(resourceName);
    node.innerText = resourceText;
  });
}

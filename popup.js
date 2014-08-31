'use strict';

window.addEventListener('load', function() {
  console.log('popup onload');
  console.log(localStorage.accepted);

  if (localStorage.accepted) {
    document.getElementById('eula').style.display = 'none';
  } else {
    document.getElementById('settings').style.display = 'none';
  }

  document.getElementById('clear_cache').onclick = function() {
    chrome.runtime.getBackgroundPage(function(eventPage) {
      eventPage.KindleLocalCache.clear();
      document.getElementById('message').innerText = chrome.i18n.getMessage('clearedCache');
    });
  };

  document.getElementById('accept_button').onclick = function() {
    localStorage.accepted = true;
    location.href = chrome.extension.getURL('welcome.html');
  };

  document.getElementById('refuse_button').onclick = function() {
    window.close();
  };
}, false);

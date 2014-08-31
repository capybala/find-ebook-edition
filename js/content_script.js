'use strict';

var DEBUG = true;
var LOADING_ICON_CLASS_NAME = 'kindlish-loading-icon';
var debug = DEBUG ? console.log.bind(console) : (function() {});

debug('kindlish start');

var port = chrome.extension.connect();
var mapAsinToPlaceholders = {};

chrome.extension.sendMessage({action: 'isAccepted'}, function(isAccepted) {
  // Confirm that user already accepted EULA
  if (!isAccepted) {
    return; // do nothing
  }

  port.onMessage.addListener(onRecievedMessage);
  addKindleButtons(document);
  observePager();
  observeAutoPagerize();
});

function addKindleButtons(rootNode) {
  // for design since 2014
  addKindleButtonsToLinks(
    rootNode.querySelectorAll('a[id^=itemName_][href^="/dp/"], td a[href^="/dp/"]'));

  // for design until 2013 (may work)
  addKindleButtonsToLinks(
    rootNode.querySelectorAll('.itemWrapper .productTitle a[href^="/dp/"]'));
}

function addKindleButtonsToLinks(linksToProduct) {
  var asins = [];

  debug(linksToProduct);

  Array.prototype.forEach.call(linksToProduct, function(linkToProduct) {
    if (linkToProduct.hasAttribute('data-found-by-find-ebook-edition')) {
      return;
    }
    // mark as found
    linkToProduct.setAttribute('data-found-by-find-ebook-edition', '');

    var asin = extractAsinFromLink(linkToProduct);
    if (!asin) {
      return; // ignore links not having asin
    }

    asins.push(asin);

    var loadingIcon = createLoadingIcon();
    if (linkToProduct.getAttribute('target')) {
      // preserve target attribute to use later if exists
      loadingIcon.setAttribute('data-target', linkToProduct.getAttribute('target'));
    }
    getParentOfButton(linkToProduct).appendChild(loadingIcon);

    mapAsinToPlaceholders[asin] = loadingIcon;
  });

  if (asins.length) {
    debug('sending from content');
    debug(asins);
    port.postMessage({'asins': asins, 'hostname': location.hostname});
  }
}

function onRecievedMessage(response) {
  if (response.error) {
    debug('error');
    onError(response);
  } else {
    debug('success');
    debug(response.items);
    onRecievedKindleEditions(response.items);
  }
}

function onError(response) {
  response.asins.forEach(function(asin) {
    var placeholder = mapAsinToPlaceholders[item.asin];

    var spanError = document.createElement('span');
    spanError.innerText = chrome.i18n.getMessage('errorAPI');
    spanError.setAttribute('style', 'color: #ccc');

    placeholder.parentNode.replaceChild(spanError, placeholder);
  });
}

function onRecievedKindleEditions(items) {
  items.forEach(function(item) {
    var placeholder = mapAsinToPlaceholders[item.asin];
    if (item.kindle) {
      var button = createKindleButton(item, placeholder.getAttribute('data-target'));
      placeholder.parentNode.replaceChild(button, placeholder);
    } else {
      placeholder.parentNode.removeChild(placeholder);
    }
  });
}

// ---- Observers ----

function observePager() {
  var wrapperObserver = new MutationObserver(function(mutations) {
    debug('mutations-wrapper');
    debug(mutations);
    mutations.forEach(function(mutation) {
      if (mutation.type == 'childList') {
        Array.prototype.forEach.call(mutation.addedNodes, function(addedNode) {
          debug(addedNode);
          // items are lazy loaded. So observe addedNode recursively by itemObserver
          itemObserver.disconnect();
          itemObserver.observe(addedNode, {childList: true, subtree: true});
        });
      }
    });
  });

  wrapperObserver.observe(document.querySelector('#item-page-wrapper'), {childList: true});

  var itemObserver = new MutationObserver(function(mutations) {
    debug('mutations-item');
    debug(mutations);
    mutations.forEach(function(mutation) {
      if (mutation.type == 'childList') {
        Array.prototype.forEach.call(mutation.addedNodes, function(addedNode) {
          debug(addedNode);
          if (addedNode.nodeType == 1 && addedNode.tagName == 'DIV') {
            // only when node is TAG, because sometimes TextNode is added
            addKindleButtons(addedNode);
          }
        });
      }
    });
  });
}

// currently this does not work
function observeAutoPagerize() {
  var observer = new MutationObserver(function(mutations) {
    debug('mutations-autopagerize');
    debug(mutations);
    mutations.forEach(function(mutation) {
      if (mutation.type == 'childList') {
        Array.prototype.forEach.call(mutation.addedNodes, function(addedNode) {
          debug(addedNode);
          addKindleButtons(addedNode);
        });
      }
    });
  });

  var containers = document.querySelectorAll('table.wlrdZeroTable');
  var targetOfAutopagerized = containers[containers.length - 1];
  if (targetOfAutopagerized) {
    observer.observe(targetOfAutopagerized.parentNode, {childList: true});
  }
}

// ---- Utils ----

function extractAsinFromLink(linkToProduct) {
  var match = linkToProduct.getAttribute('href').match(/\/dp\/(\w+)\//);
  return match[1];
}

// return the parent node where kindle button should be appended
function getParentOfButton(linkToProduct) {
  var parent = linkToProduct.parentNode;
  if (parent.classList.contains('clip-text')) {
    // return parentNode because button is not shown when the button is clip-text's child
    parent = parent.parentNode;
  }
  return parent;
}

function createLoadingIcon() {
  var loadingIcon = document.createElement('img');
  loadingIcon.setAttribute('src', chrome.extension.getURL('img/loading_icon.gif'));
  loadingIcon.setAttribute('class', LOADING_ICON_CLASS_NAME);
  return loadingIcon;
}

function createKindleButton(item, target) {
  var a = document.createElement('a');
  a.setAttribute('href', item.kindle.url);
  if (target) {
    a.setAttribute('target', target);
  }
  var img = document.createElement('img');
  var buttonFilename = 'img/kindle_button_' + chrome.i18n.getMessage('buttonLang') + '.png';
  img.setAttribute('src', chrome.extension.getURL(buttonFilename));
  img.alt = chrome.i18n.getMessage('buttonAlt');
  a.appendChild(img);

  return a;
}

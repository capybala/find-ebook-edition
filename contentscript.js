'use strict';

var DEBUG = false;
var LOADING_ICON_CLASS_NAME = 'kindlish-loading-icon';

if (!DEBUG) {
  console.log = function() {};
}

console.log('kindlish start');

var mapAsinToElements = {};

var containers = document.querySelectorAll('table.wlrdZeroTable');
console.log(containers);
var autoPagerizeTarget = containers[containers.length - 1]; // last container
console.log(autoPagerizeTarget);

if (autoPagerizeTarget) {
  // enable only when target exists
  console.log(autoPagerizeTarget.parentNode);

  var port = chrome.extension.connect();

  chrome.extension.sendMessage({action: 'isAccepted'}, function(isAccepted) {
    if (isAccepted) {
      observeAutoPagerize(autoPagerizeTarget.parentNode, function(addedNodes) {
        // when nodes are added
        Array.prototype.forEach.call(addedNodes, function(node) {
          if (node.tagName == 'TABLE' && node.className == 'wlrdZeroTable') {
            // when node contains products
            addKindleButtons(node);
          }
        });
      });

      port.onMessage.addListener(onKindleEditionsReceived);

      addKindleButtons(document);
    }
  });
}

function observeAutoPagerize(target, onAdded) {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  var observer = new MutationObserver(function(mutations) {
    console.log('mutations');
    console.log(mutations);
    mutations.forEach(function(mutation) {
      if (mutation.type == 'childList' && mutation.addedNodes) {
        onAdded(mutation.addedNodes);
      }
    });
  });

  observer.observe(target, {attributes: true, childList: true, characterData: true});
}

function addKindleButtons(rootNode) {
  var itemElements = rootNode.querySelectorAll('.itemWrapper');
  var asins = [];

  Array.prototype.forEach.call(itemElements, function(itemElement) {
    var name = itemElement.getAttribute('name');
    if (!name) {
      // exclude elements not having "name" attribute
      return;
    }
    var match = name.match(/\w+$/);
    if (!match) {
      // exclude elements of "何でもほしい物リスト" which does not have ASIN
      return;
    }

    var asin = match[0];
    asins.push(asin);
    mapAsinToElements[asin] = itemElement;

    var loadingIcon = document.createElement('img');
    loadingIcon.setAttribute('src', chrome.extension.getURL('img/loading_icon.gif'));
    loadingIcon.setAttribute('class', LOADING_ICON_CLASS_NAME);
    addButton(loadingIcon, itemElement);
  });

  console.log(mapAsinToElements);
  console.log('send from content');
  port.postMessage({'asins': asins, 'hostname': location.hostname});
}

function onKindleEditionsReceived(response) {
  console.log(response);

  if (response.error) {
    console.log('error');
    onError(response);
  } else {
    console.log('success');
    onSuccess(response);
  }

  console.log(mapAsinToElements);
}

function onError(response) {
  response.asins.forEach(function(asin) {
    var itemElement = popItemElement(asin);

    var span = document.createElement('span');
    span.innerText = chrome.i18n.getMessage('errorAPI');
    span.setAttribute('style', 'color: #ccc');

    addButton(span, itemElement);
  });
}

function onSuccess(response) {
  response.items.forEach(function(item) {
    var itemElement = popItemElement(item.asin);

    if (item.kindle) {
      var titleElement = itemElement.querySelector('.productTitle a');

      var a = document.createElement('a');
      a.setAttribute('href', item.kindle.url);
      if (titleElement.hasAttribute('target')) {
        a.setAttribute('target', titleElement.getAttribute('target')); // for AutoPagerized page
      }
      var img = document.createElement('img');
      var buttonFilename = 'img/kindle_button_' + chrome.i18n.getMessage('buttonLang') + '.png';
      img.setAttribute('src', chrome.extension.getURL(buttonFilename));
      img.alt = chrome.i18n.getMessage('buttonAlt');
      a.appendChild(img);

      addButton(a, itemElement);
    }
  });
}

function popItemElement(asin) {
  var itemElement = mapAsinToElements[asin];
  delete mapAsinToElements[asin];

  // remove loading icon
  var loadingIcon = itemElement.querySelector('.' + LOADING_ICON_CLASS_NAME);
  if (loadingIcon) {
    // assert always true
    loadingIcon.parentNode.removeChild(loadingIcon);
  }

  return itemElement;
}

function addButton(button, itemElement) {
  // Note that :nth-of-type(3) does not mean the same thing.
  var priceRow = itemElement.querySelectorAll('.lineItemGroup')[2];

  if (priceRow) {
    // when normal view
    var pricePart = priceRow.childNodes[0];
    if (pricePart) {
      pricePart.appendChild(button);
    }
  } else {
    // when compact view

    // The first row contains two <tr>s, header and item,
    // tr:last-child is necessary to retrive the item row.
    var buyColumn = itemElement.querySelector('tr:last-child td:nth-child(3)');
    if (buyColumn) {
      buyColumn.appendChild(button);
    }
  }
}

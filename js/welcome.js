'use strict';

window.addEventListener('load', function() {
  var locale = chrome.i18n.getMessage('@@ui_locale');
  var stores = getStoresForLocale(locale);

  var ul = document.getElementById('stores');

  stores.forEach(function(store) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    var wishlistURL = store.url + 'gp/registry/wishlist/';

    a.href = wishlistURL;
    a.innerText = chrome.i18n.getMessage('getStarted', store.name);
    li.appendChild(a);

    ul.appendChild(li);
  });
}, false);


function getStoresForLocale(locale) {
  var stores = {
    'us': {
      'name': 'Amazon.com',
      'url': 'http://www.amazon.com/'
    },
    'jp': {
      'name': 'Amazon.co.jp',
      'url': 'http://www.amazon.co.jp/'
    },
    'uk': {
      'name': 'Amazon.co.uk',
      'url': 'http://www.amazon.co.uk/'
    },
    'ca': {
      'name': 'Amazon.ca',
      'url': 'http://www.amazon.ca/'
    },
    'de': {
      'name': 'Amazon.de',
      'url': 'http://www.amazon.de/'
    },
    'fr': {
      'name': 'Amazon.fr',
      'url': 'http://www.amazon.fr/'
    },
    'cn': {
      'name': 'Amazon.cn',
      'url': 'http://www.amazon.cn/'
    }
  };

  var mainCountry = localeToCountry(locale);

  var restCountries = Object.keys(stores).filter(function(country) {
    return country != mainCountry;
  });

  var counties = [mainCountry].concat(restCountries);

  return counties.map(function(country) {
    return stores[country];
  });
}


function localeToCountry(locale) {
  switch (locale) {
    case 'ja':
      return 'jp';
    case 'en_GB':
      return 'uk';
    case 'fr':
      return 'fr';
    case 'zh_CN':
      case 'zh_TW':
      return 'cn';
    case 'de':
      return 'de';
    default:
      return 'us';
  }
}

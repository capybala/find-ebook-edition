'use strict';

var API_URL = 'http://prefer-ebooks.capybala.com/';

console.log('eventPage started');

chrome.runtime.onInstalled.addListener(function(details) {
  console.log('oninstalled');
  console.log(details);
  if (details.reason == 'install') {
    chrome.tabs.create({url: chrome.extension.getURL('popup.html')});
  }
});

var KindleLocalCache = new LocalCache('kindle:');
KindleLocalCache.clearExpired();

chrome.extension.onConnect.addListener(function(port) {
  console.log('port connected');
  console.log(port);

  if (!port.sender.tab) {
    // do nothing when connected by other than tabs
    return;
  }
  // Show the PageAction's icon when connected (= contentscript is executed)
  chrome.pageAction.show(port.sender.tab.id);

  port.onMessage.addListener(function(request) {
    console.log('request received');
    console.log(request);

    var country = getCountry(request.hostname);
    var cachedItems = [];
    var remainingAsins = [];
    request.asins.forEach(function(asin) {
      var item = KindleLocalCache.getItem(country + ':' + asin);
      if (item === undefined) {
        // miss
        remainingAsins.push(asin);
      } else {
        // hit
        cachedItems.push({
          asin: asin,
          kindle: item
        });
      }
    });

    if (cachedItems.length > 0) {
      success(cachedItems, true);
    }

    var asin_chunks = chunk(remainingAsins, 10);

    asin_chunks.forEach(function(asins, i) {
      setTimeout(function() {
        var url = API_URL + 'kindle_versions?country=' + country +
          '&asin=' + asins.join(',');
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (this.readyState == this.DONE) {
            if (this.status == 200 && this.responseText != null) {
              // success!
              var items = JSON.parse(this.responseText);
              items.forEach(function(item) {
                KindleLocalCache.setItem(country + ':' + item.asin, item.kindle);
              });
              success(items);
              return;
            }
            // something went wrong
            error(asins); // asins are bound
          }
        };
        xhr.open('GET', url);
        xhr.send();
      }, i * 1000);
    });

    function success(items, fromCache) {
      console.log('success' + (fromCache ? ' (from cache)' : ''));
      console.log(items);
      port.postMessage({'items': items});
    }

    function error(asins) {
      console.log('error');
      port.postMessage({error: true, asins: asins});
    }
  });
});

chrome.extension.onMessage.addListener(function(message, sender, callback) {
  if (message.action == 'isAccepted') {
    var isAccepted = !!localStorage.accepted;
    callback(isAccepted);
  }
});

function chunk(items, count) {
  var chunks = [];
  while (items.length) {
    chunks.push(items.splice(0, count));
  }
  return chunks;
}

function getCountry(hostname) {
  var match = hostname.match(/[^.]+$/);
  var country = match[0];

  if (country == 'com') {
    country = 'us';
  }

  return country;
}

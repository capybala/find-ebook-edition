'use strict';

var LocalCache = function(prefix) {
  this.prefix = prefix;
  this.ttlMilliseconds = 24 * 60 * 60 * 1000;
};

LocalCache.prototype.setItem = function(key, value) {
  var item = {
    value: value,
    expires: (new Date()).getTime() + this.ttlMilliseconds
  };
  localStorage.setItem(this.prefix + key, JSON.stringify(item));
};

LocalCache.prototype.getItem = function(key) {
  var item = localStorage.getItem(this.prefix + key);
  if (item) {
    return JSON.parse(item).value;
  } else {
    return undefined;
  }
};

LocalCache.prototype.clearExpired = function() {
  var now = (new Date()).getTime();
  for (var key in localStorage) {
    if (key.indexOf(this.prefix) == 0 && localStorage.getItem(key).expires > now) {
      localStorage.removeItem(key);
    }
  }
};

LocalCache.prototype.clear = function() {
  for (var key in localStorage) {
    if (key.indexOf(this.prefix) == 0) {
      localStorage.removeItem(key);
    }
  }
};

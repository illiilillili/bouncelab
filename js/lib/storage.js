window.BL = window.BL || {};

/* localStorage 래퍼. 막혀 있으면(시크릿 모드 등) 메모리에만 담아 둔다. */
(function (BL) {
  var PREFIX = (BL.site && BL.site.storagePrefix) || 'bl:';
  var mem = {};
  var ok = (function () {
    try {
      localStorage.setItem(PREFIX + 'probe', '1');
      localStorage.removeItem(PREFIX + 'probe');
      return true;
    } catch (e) { return false; }
  })();

  function key(k) { return PREFIX + k; }

  function get(k, fallback) {
    try {
      var raw = ok ? localStorage.getItem(key(k)) : mem[key(k)];
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }

  function set(k, value) {
    var raw = JSON.stringify(value);
    try {
      if (ok) localStorage.setItem(key(k), raw);
      else mem[key(k)] = raw;
    } catch (e) { mem[key(k)] = raw; }
  }

  function remove(k) {
    try { if (ok) localStorage.removeItem(key(k)); } catch (e) { }
    delete mem[key(k)];
  }

  BL.storage = { get: get, set: set, remove: remove, prefix: PREFIX, persisted: ok };
})(window.BL);
window.BL = window.BL || {};

/* 아이콘. 직접 그린 24px 선화라서 색은 currentColor 를 따라간다.
   mask 는 아직 안 연 기능(???) 자리에 쓴다. */
(function (BL) {
  var PATH = {
    roulette: '<circle cx="12" cy="12" r="7.6"/><circle cx="12" cy="12" r="2.1"/><path d="M12 4.4v3.1M18.8 8.4l-2.6 1.6M16.2 17.7l-1.7-2.2M7.4 17.5l1.6-2M5.2 8.2l2.6 1.7"/>',
    mask: '<rect x="4.4" y="4.4" width="15.2" height="15.2" rx="3.2" stroke-dasharray="3.2 3.2"/><path d="M9.7 9.9a2.35 2.35 0 1 1 3.3 2.15c-.75.32-1.05.85-1.05 1.6"/><circle cx="12" cy="16.6" r="0.95"/>',
    colors: '<path d="M12 4.4c3.1 4.1 5.1 6.4 5.1 9.2a5.1 5.1 0 0 1-10.2 0c0-2.8 2-5.1 5.1-9.2z"/><path d="M9.6 14.6a2.6 2.6 0 0 0 2.4 2.6"/>',
    missions: '<path d="M7.2 20.2V4.2"/><path d="M7.2 5.1h8.6l-2.1 3 2.1 3H7.2"/>',
    picker: '<rect x="4.4" y="4.4" width="15.2" height="15.2" rx="2.6"/><circle cx="9" cy="9" r="1.15"/><circle cx="12" cy="12" r="1.15"/><circle cx="15" cy="15" r="1.15"/>',
    objects: '<rect x="3.6" y="10.2" width="8.8" height="8.8" rx="1.1"/><rect x="11.6" y="4.6" width="8.8" height="8.8" rx="1.1"/>',
    colorset: '<rect x="4.2" y="5" width="15.6" height="4" rx="1.2"/><rect x="4.2" y="11" width="10.2" height="4" rx="1.2"/><rect x="4.2" y="17" width="13" height="3.2" rx="1.2"/>',
    progress: '<path d="M4.6 7.1l1.7 1.8 3-3.3"/><path d="M4.6 16.3l1.7 1.8 3-3.3"/><path d="M13.2 7.6h6.4M13.2 16.6h6.4"/>',
    timer: '<circle cx="12" cy="12.6" r="7.4"/><path d="M12 8.6v4.3l2.9 1.7"/><path d="M9.4 3.6h5.2"/>',
    stats: '<path d="M3.8 20.3h16.4"/><path d="M7.4 20.3v-6.4M12 20.3V7.6M16.6 20.3v-4.8"/>',
    backup: '<path d="M12 4.4v9.8"/><path d="M8.6 10.9l3.4 3.3 3.4-3.3"/><path d="M5 18.6h14"/>',
    codex: '<path d="M4.8 5.4c2.3-1 4.7-1 7.1 0v13.2c-2.4-1-4.8-1-7.1 0z"/><path d="M11.9 5.4c2.4-1 4.8-1 7.2 0v13.2c-2.4-1-4.8-1-7.2 0z"/>',
    help: '<rect x="3.2" y="7" width="17.6" height="10" rx="2.2"/><path d="M6.6 10.6h.01M9.6 10.6h.01M12.6 10.6h.01M15.6 10.6h.01M6.8 13.8h10.4"/>',
    about: '<circle cx="12" cy="12" r="7.8"/><path d="M12 11.2v5.1"/><circle cx="12" cy="8.3" r="0.95"/>'
  };

  function get(name) {
    var d = PATH[name];
    if (!d) return null;
    var box = document.createElement('span');
    box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
    return box.firstChild;
  }

  BL.icons = { get: get, has: function (name) { return !!PATH[name]; } };
})(window.BL);
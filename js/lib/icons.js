window.BL = window.BL || {};

/* 아이콘 두 가지.
 *   get(name)  직접 그린 24px 선화. 색은 currentColor 를 따라간다 (버튼·안내에 쓴다)
 *   art(name)  기능 그림. img/ 안의 그림 파일을 그대로 쓴다 (홈 카드·기능 제목에 쓴다) */
(function (BL) {
  var PATH = {
    roulette: '<rect x="2" y="10" width="12" height="12" rx="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01M10 14h.01M15 6h.01M18 9h.01"/>',
    controls: '<path d="M6 11h4M8 9v3.9"/><path d="M15 12h.01M18 10h.01"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
    colors: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    rating: '<path d="M12 4l1.94 5.33 5.67.2-4.47 3.49 1.56 5.45L12 15.3l-4.7 3.17 1.56-5.45L4.39 9.53l5.67-.2z"/>',
    dice: '<rect x="4.2" y="4.2" width="15.6" height="15.6" rx="3.4"/><circle cx="9" cy="9" r="1.15" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.15" fill="currentColor" stroke="none"/>',
    rotate: '<path d="M19.4 12a7.4 7.4 0 1 1-2.2-5.3"/><path d="M19.8 4.6v4.2h-4.2"/>',
    copy: '<rect x="9" y="9" width="10.6" height="10.6" rx="2.2"/><path d="M15.4 9V6.8a2.2 2.2 0 0 0-2.2-2.2H6.8A2.2 2.2 0 0 0 4.6 6.8v6.4a2.2 2.2 0 0 0 2.2 2.2H9"/>',
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

  /* ── 기능 그림 ──────────────────────────────
     직접 그리지 않고 준 그림 파일(img/)을 그대로 쓴다.
     홈 카드와 기능 제목에 쓰는 게임 그림이라 파일 이름만 여기서 정한다. */
  var ART = {
    roulette: 'img/feature-roulette.png',   /* 금색 룰렛 타일 */
    controls: 'img/feature-controls.png',   /* 가운데가 뚫린 톱니별 */
    colors: 'img/feature-colors.png',       /* 색 부채꼴 8칸 타일 */
    rating: 'img/feature-rating.png'        /* 노란 별 */
  };



  function get(name) {
    var d = PATH[name];
    if (!d) return null;
    var box = document.createElement('span');
    box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
    return box.firstChild;
  }

  /* 기능 그림. 그림 파일을 그대로 쓴다. 이름이 없으면 null (그때는 선화로 대신한다) */
  function art(name) {
    var src = ART[name];
    if (!src) return null;
    var img = document.createElement('img');
    img.src = src;
    img.alt = '';
    return img;
  }

  BL.icons = { get: get, art: art, has: function (name) { return !!PATH[name]; } };
})(window.BL);

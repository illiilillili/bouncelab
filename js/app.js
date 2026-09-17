window.BL = window.BL || {};

/* 해시 주소: #/ (메인) · #/f/<id> (기능) · #/f/<id>/<안쪽 화면> (예: #/f/rating/star) */
(function (BL) {
  var el = BL.dom.el;
  var clear = BL.dom.clear;
  var HOME = 'home';

  BL.views = BL.views || {};
  BL.soonViews();

  function feature(id) {
    for (var i = 0; i < BL.features.length; i++) {
      if (BL.features[i].id === id) return BL.features[i];
    }
    return null;
  }

  function parse() {
    var parts = String(location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
    if (parts[0] === 'f' && parts[1] && feature(parts[1])) {
      return { id: parts[1], sub: parts[2] || '' };
    }
    return { id: HOME, sub: '' };
  }

  /* 홈 카드에 쓰는 그림 — 기능 그림이 있으면 그걸, 없으면 선화를 쓴다 */
  function icon(f) {
    return BL.icons.art(f.id) || BL.icons.get(f.id);
  }

  function tags(f) {
    var list = [];
    if (f.status === 'soon') list.push(el('span', { class: 'tag tag--soon', text: '준비 중' }));
    if (f.needsData) list.push(el('span', { class: 'tag tag--need', text: '데이터 필요' }));
    return list.length ? el('span', { class: 'item__tags' }, list) : null;
  }

  /* 카드 : 그림 + 이름만. 설명·수치 줄은 두지 않는다 */
  function card(f) {
    return el('a', { class: 'item item--' + f.id, href: '#/f/' + f.id }, [
      el('span', { class: 'item__icon' }, icon(f)),
      el('span', { class: 'item__name', text: f.name }),
      tags(f)
    ]);
  }

  function renderHome(root) {
    clear(root);

    root.appendChild(el('section', { class: 'hero' }, [
      el('h1', { text: BL.site.nameKo })
    ]));

    /* 카드 수에 맞춰 열이 자동으로 잡힌다 (좁은 화면 2열 → 넓으면 네 장이 한 줄) */
    root.appendChild(el('section', { class: 'list-wrap' }, [
      el('h2', { class: 'list-title', text: '기능' }),
      el('div', { class: 'list' }, (BL.features || []).map(card))
    ]));

    window.scrollTo(0, 0);
  }

  function renderTool(root, id, sub) {
    var f = feature(id);
    clear(root);
    root.appendChild(el('div', { class: 'bar' }, [
      el('a', { class: 'bar__back', href: '#/', text: '← 홈' }),
      el('h1', {}, [icon(f), f.name])
    ]));
    var body = el('div');
    root.appendChild(body);
    /* 화면이 제목을 돌려주면 그걸 쓴다 (안쪽 화면이 있는 기능 — 예: 오브젝트 평점) */
    var title = BL.views[id].render(body, sub);
    document.title = (title || f.name) + ' · ' + BL.site.nameKo;
    window.scrollTo(0, 0);
  }

  function render() {
    var r = parse();
    var root = document.getElementById('view');
    if (r.id === HOME) {
      document.title = BL.site.nameKo + ' · ' + BL.site.nameEn;
      renderHome(root);
    } else {
      renderTool(root, r.id, r.sub);
    }
  }

  BL.dom.qsa('[data-version]').forEach(function (n) { n.textContent = 'v' + BL.site.version; });
  if (BL.site.repo) BL.dom.qsa('[data-repo]').forEach(function (n) { n.setAttribute('href', BL.site.repo); });
  window.addEventListener('hashchange', render);
  render();
})(window.BL);
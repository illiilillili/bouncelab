window.BL = window.BL || {};

/* 해시 주소: #/ (메인) · #/f/<id> (기능) */
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
    if (parts[0] === 'f' && parts[1] && feature(parts[1])) return parts[1];
    return HOME;
  }

  function row(f) {

    return el('a', { class: 'item', href: '#/f/' + f.id }, [
      el('span', { class: 'item__icon' }, BL.icons.get(f.id)),
      el('span', { class: 'item__main' }, [
        el('span', { class: 'item__name', text: f.name }),
        el('span', { class: 'item__desc', text: f.desc })
      ]),
      el('span', { class: 'item__meta' }, [
        f.status === 'soon' ? el('span', { class: 'tag tag--soon', text: '준비 중' }) : null,
        f.needsData ? el('span', { class: 'tag tag--need', text: '데이터 필요' }) : null,
        el('span', { class: 'item__go', text: '→' })
      ])
    ]);
  }

  function renderHome(root) {
    clear(root);

    root.appendChild(el('section', { class: 'hero' }, [
      el('h1', { text: BL.site.nameKo }),
      el('p', { text: '바운스볼 하면서 쓰려고 만든 도구. 설치 없이 브라우저에서 바로 돌아갑니다.' })
    ]));

    root.appendChild(el('section', { class: 'list-wrap' }, [
      el('h2', { class: 'list-title', text: '기능' }),
      el('div', { class: 'list' }, BL.features.map(row))
    ]));

    root.appendChild(el('p', { class: 'note', text: '맵 룰렛과 랜덤 색상 추천, 둘만 있습니다.' }));
    window.scrollTo(0, 0);
  }

  function renderTool(root, id) {
    var f = feature(id);
    clear(root);
    root.appendChild(el('div', { class: 'bar' }, [
      el('a', { class: 'bar__back', href: '#/', text: '← 홈' }),
      el('h1', {}, [BL.icons.get(f.id), f.name])
    ]));
    var body = el('div');
    root.appendChild(body);
    BL.views[id].render(body);
    document.title = f.name + ' · ' + BL.site.nameKo;
    window.scrollTo(0, 0);
  }

  function render() {
    var id = parse();
    var root = document.getElementById('view');
    if (id === HOME) {
      document.title = BL.site.nameKo + ' · ' + BL.site.nameEn;
      renderHome(root);
    } else {
      renderTool(root, id);
    }
  }

  BL.dom.qsa('[data-version]').forEach(function (n) { n.textContent = 'v' + BL.site.version; });
  window.addEventListener('hashchange', render);
  render();
})(window.BL);
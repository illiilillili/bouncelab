window.BL = window.BL || {};

/* 아직 안 만든 기능의 공통 화면 */
(function (BL) {
  var el = BL.dom.el;

  function make(f) {
    return {
      render: function (root) {
        var icon = BL.icons.get(f.id);
        root.appendChild(el('div', { class: 'box' }, [
          icon ? el('span', { class: 'box__icon' }, icon) : null,
          el('h2', { text: f.name }),
          el('p', { text: f.desc }),
          el('p', { text: '아직 안 만든 기능입니다. 화면 틀만 잡아둔 상태.' }),
          f.needsData ? el('p', { class: 'box__hint', text: '맵 이름 같은 데이터가 필요한 기능입니다. 알려주시는 값만 넣고 추측해서 채우지 않습니다.' }) : null
        ]));
      }
    };
  }

  BL.soonViews = function () {
    BL.views = BL.views || {};
    BL.features.forEach(function (f) {
      if (!BL.views[f.id]) BL.views[f.id] = make(f);
    });
  };
})(window.BL);
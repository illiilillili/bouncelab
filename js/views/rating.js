window.BL = window.BL || {};

/* 오브젝트 평점 — 두 화면으로 나뉜다.
 *   #/f/rating          오브젝트 고르는 화면 (별 · 공)
 *   #/f/rating/<오브젝트>  평점 매기는 창
 * 평점은 브라우저 localStorage 에만 저장한다 (서버 없음). */
(function (BL) {
  var el = BL.dom.el;
  var clear = BL.dom.clear;
  var storage = BL.storage;
  var objects = BL.objects;

  var MAX = 5;                                  /* 별 5개 만점 — 척도를 바꾸려면 여기만 고친다 */
  function key(id) { return 'rating.' + id; }

  function saved(id) {
    var v = Number(storage.get(key(id), 0));
    return isFinite(v) && v > 0 && v <= MAX ? v : 0;
  }

  /* ── 오브젝트 고르는 화면 ───────────────── */
  function pick(root) {
    root.appendChild(el('div', { class: 'objs' }, objects.list.map(function (o) {
      var score = saved(o.id);
      return el('a', { class: 'obj', href: '#/f/rating/' + o.id }, [
        el('span', { class: 'obj__art' }, objects.art(o.id)),
        el('span', { class: 'obj__main' }, [
          el('span', { class: 'obj__name', text: o.name }),
          el('span', { class: 'obj__meta', text: score ? '내 평점 ' + score + ' / ' + MAX : '아직 평점 없음' })
        ]),
        el('span', { class: 'obj__go', text: '→' })
      ]);
    })));
  }

  /* ── 평점 매기는 창 ─────────────────────── */
  function rate(root, id) {
    var o = objects.find(id);
    if (!o) {
      root.appendChild(el('div', { class: 'box' }, [
        el('h2', { text: '없는 오브젝트입니다' }),
        el('p', { text: '오브젝트 목록에서 다시 골라주세요.' }),
        el('p', {}, [el('a', { class: 'btn', href: '#/f/rating', text: '오브젝트 목록으로' })])
      ]));
      return;
    }

    var score = saved(o.id);
    var live = el('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    var nowEl = el('p', { class: 'rate__now' });
    var resetBtn = el('button', { class: 'btn', type: 'button', text: '지우기', onClick: function () { save(0); } });
    var stars = [];

    function paint() {
      stars.forEach(function (btn, i) {
        btn.setAttribute('aria-pressed', i < score ? 'true' : 'false');
        clear(btn);
        btn.appendChild(objects.star());
      });
      nowEl.textContent = score ? '내 평점 ' + score + ' / ' + MAX : '아직 평점이 없습니다';
      resetBtn.disabled = !score;
    }

    function save(v) {
      score = v;
      /* 고른 값만 남긴다 : 지우면 저장된 것도 지운다 */
      if (v) storage.set(key(o.id), v);
      else storage.remove(key(o.id));
      paint();
      live.textContent = v ? o.name + ' 평점 ' + v + '점으로 저장했습니다.' : o.name + ' 평점을 지웠습니다.';
    }

    for (var i = 1; i <= MAX; i++) {
      (function (n) {
        stars.push(el('button', {
          class: 'star', type: 'button', 'aria-label': n + '점',
          onClick: function () { save(n); }
        }));
      })(i);
    }

    paint();

    root.appendChild(el('div', { class: 'tool' }, [
      el('div', { class: 'tool__main' }, [
        el('div', { class: 'ratecard' }, [
          el('div', { class: 'rate' }, [
            el('span', { class: 'rate__art' }, objects.art(o.id)),
            el('p', { class: 'rate__name', text: o.name }),
            el('div', { class: 'rate__stars', role: 'group', 'aria-label': o.name + ' 평점' }, stars),
            nowEl,
            el('div', { class: 'rate__btns' }, [
              resetBtn,
              el('a', { class: 'btn', href: '#/f/rating', text: '← 오브젝트 목록' })
            ])
          ])
        ]),
        live
      ]),
      el('div', { class: 'tool__side' }, [
        el('p', { class: 'hint', text: '별을 눌러 1~' + MAX + '점을 매깁니다. 평점은 이 브라우저에만 저장되고 다른 사람과 공유되지 않습니다.' })
      ])
    ]));
  }

  BL.views = BL.views || {};
  BL.views.rating = {
    /* 화면 제목을 돌려주면 app.js 가 그걸 쓴다 (없으면 기능 이름) */
    render: function (root, sub) {
      var o = sub ? objects.find(sub) : null;
      if (sub) rate(root, sub);
      else pick(root);
      return o ? o.name + ' 평점' : '';
    }
  };
})(window.BL);

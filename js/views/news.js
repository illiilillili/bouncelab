window.BL = window.BL || {};

/* 바운스볼 뉴스 — 두 화면으로 나뉜다.
 *   #/f/news        기사 목록 (오브젝트 평점 화면과 같은 카드에 부제 · 분류 · 날짜를 더한다)
 *   #/f/news/<id>   기사 본문 (분류 · 날짜 · 제목 · 부제 · 리드 · 본문 …)
 * 기사는 서버가 아니라 data/news.js 에 적어 둔 것을 그대로 읽는다 (쓰는 방식이 정해지면 그 파일만 바뀐다). */
(function (BL) {
  var el = BL.dom.el;

  /* 2026-09-19 → 2026.09.19 (형식이 다르면 적힌 그대로 보여준다) */
  function when(iso) {
    var s = String(iso == null ? '' : iso);
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    return m ? m[1] + '.' + m[2] + '.' + m[3] : s;
  }

  /* 최신순 — 날짜 문자열(YYYY-MM-DD)을 그대로 비교한다 (기사는 목록 어디에 넣어도 된다) */
  function latest() {
    return (BL.news || []).slice().sort(function (a, b) {
      var x = String(a.date || ''), y = String(b.date || '');
      if (x === y) return 0;
      return x > y ? -1 : 1;
    });
  }

  function find(id) {
    var list = BL.news || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* 목록 카드 그림 — 사진(thumb)이 있으면 그걸, 없으면 뉴스 선화(icons.js)를 쓴다 */
  function art(n) {
    return n.thumb ? el('img', { src: n.thumb, alt: '' }) : BL.icons.get('news');
  }

  /* 분류 칩 · 날짜 · 기자 (목록과 기사 머리에서 같은 순서) */
  function meta(n) {
    return [
      n.tag ? el('span', { class: 'tag tag--news', text: n.tag }) : null,
      el('span', { text: when(n.date) }),
      n.writer ? el('span', { text: n.writer }) : null
    ];
  }

  /* ── 기사 목록 ─────────────────────────────
   * 오브젝트 평점의 고르는 화면과 같은 카드(.objs · .obj)를 쓰고,
   * 카드에 부제 한 줄(obj__deck)과 분류 · 날짜 · 기자(obj__meta)를 더한다. */
  function list(root) {
    var all = latest();
    if (!all.length) {
      root.appendChild(el('p', { class: 'hint', text: '아직 기사가 없습니다.' }));
      return;
    }

    root.appendChild(el('p', { class: 'news__count', text: '전체 ' + all.length + '건 · 최신순' }));
    root.appendChild(el('div', { class: 'objs' }, all.map(function (n) {
      return el('a', { class: 'obj', href: '#/f/news/' + n.id }, [
        el('span', { class: 'obj__art' }, art(n)),
        el('span', { class: 'obj__main' }, [
          el('span', { class: 'obj__name', text: n.title }),
          n.deck ? el('span', { class: 'obj__deck', text: n.deck }) : null,
          el('span', { class: 'obj__meta' }, meta(n))
        ]),
        el('span', { class: 'obj__go', text: '→' })
      ]);
    })));
  }

  /* ── 기사 본문 ─────────────────────────────
   * 소식을 전하는 글처럼 분류 · 날짜 → 제목 → 부제 → 사진 → 리드 → 본문 → 강조 · 출처 순서. */
  function article(root, id) {
    var n = find(id);
    if (!n) {
      root.appendChild(el('div', { class: 'box' }, [
        el('h2', { text: '없는 기사입니다' }),
        el('p', { text: '뉴스 목록에서 다시 골라주세요.' }),
        el('p', {}, [el('a', { class: 'btn', href: '#/f/news', text: '뉴스 목록으로' })])
      ]));
      return;
    }

    var head = [
      el('p', { class: 'news__meta' }, [
        n.tag ? el('span', { class: 'tag tag--news', text: n.tag }) : null,
        el('time', { class: 'news__date', datetime: n.date || '', text: when(n.date) }),
        n.writer ? el('span', { class: 'news__who', text: n.writer }) : null
      ]),
      el('h1', { class: 'news__title', text: n.title })
    ];
    if (n.deck) head.push(el('p', { class: 'news__deck', text: n.deck }));
    if (n.thumb) head.push(el('div', { class: 'news__pic' }, el('img', { src: n.thumb, alt: '' })));

    var body = [];
    if (n.lead) body.push(el('p', { class: 'news__lead', text: n.lead }));
    (n.body || []).forEach(function (t) { body.push(el('p', { text: t })); });
    if (n.quote) body.push(el('blockquote', { class: 'news__quote', text: n.quote }));
    if (n.source) body.push(el('p', { class: 'news__source', text: n.source }));

    root.appendChild(el('article', { class: 'newscard' }, [
      el('div', null, head),
      body.length ? el('div', { class: 'news__body' }, body) : null,
      el('div', { class: 'news__btns' }, [
        el('a', { class: 'btn', href: '#/f/news', text: '← 뉴스 목록' })
      ])
    ]));
  }

  BL.views = BL.views || {};
  BL.views.news = {
    /* 화면 제목을 돌려주면 app.js 가 그걸 쓴다 (기사 화면에서는 기사 제목) */
    render: function (root, sub) {
      var n = sub ? find(sub) : null;
      if (sub) article(root, sub);
      else list(root);
      return n ? n.title : '';
    }
  };
})(window.BL);

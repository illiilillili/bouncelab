window.BL = window.BL || {};

/* 오브젝트 리뷰 — 두 화면으로 나뉜다.
 *   #/f/rating          오브젝트 고르는 화면 (별 · 공 · 가시 · 표창 · 톱니 · 블록) — 평균 별점과 리뷰 수
 *   #/f/rating/<오브젝트>  쓰고 보는 창 — 최종 평점 · 작성 폼 · 리뷰 목록
 * 리뷰는 Supabase 의 익명 표에 쌓여서 누구나 본다 (js/lib/reviews.js).
 * 서버를 못 쓰면 마지막으로 받아 둔 목록만 보여주고 저장은 막는다. */
(function (BL) {
  var el = BL.dom.el;
  var clear = BL.dom.clear;
  var objects = BL.objects;
  var reviews = BL.reviews;

  var MAX = reviews.limits.stars;
  var NICK_MAX = reviews.limits.nick;
  var BODY_MAX = reviews.limits.body;
  var PAGE = (BL.site && BL.site.reviews && BL.site.reviews.pageSize) || 10;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* 2026.09.19 */
  function when(iso) {
    var d = new Date(iso);
    if (!iso || isNaN(d.getTime())) return '';
    return d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate());
  }

  /* 별 한 겹 — 바탕(빈 별)과 채움(색 별)을 겹쳐 소수점까지 보여주려고 나눠 그린다 */
  function layer(cls) {
    var img = objects.star();
    if (img) img.className = cls;
    return img;
  }

  /* 별 그림 — 평균만큼 채운다 (읽기용).
   * value 는 0~MAX 사이의 실수. 소수점은 마지막 별을 --fill 비율만큼만 칠해서 보여준다.
   * 평균 숫자와 눈금을 맞추려고 소수 한 자리에서 끊는다 — 4.3 → 별 4개 + 마지막 별 30%. */
  function stars(value, big, label) {
    var v = Math.round((Number(value) || 0) * 10) / 10;
    if (v < 0) v = 0;
    if (v > MAX) v = MAX;
    var whole = Math.floor(v);
    var rest = Math.round((v - whole) * 100);   /* 0 · 10 · 20 … 90 (%) */

    var row = [];
    for (var i = 1; i <= MAX; i++) {
      var attrs = { class: 'stars__i', 'aria-hidden': 'true' };
      var kids;
      if (i <= whole) {
        kids = [layer('stars__fg')];                 /* 꽉 찬 별은 채움 한 겹 */
      } else if (i === whole + 1 && rest) {
        attrs.class = 'stars__i part';
        attrs.style = '--fill:' + rest + '%';        /* 마지막 별만 이만큼 채운다 */
        kids = [layer('stars__bg'), layer('stars__fg')];
      } else {
        kids = [layer('stars__bg')];                 /* 빈 별은 바탕 한 겹 */
      }
      row.push(el('span', attrs, kids));
    }

    var txt = (v % 1 === 0) ? String(v) : reviews.avgText(v);
    return el('span', {
      class: 'stars' + (big ? ' stars--lg' : ''), role: 'img',
      'aria-label': label || (MAX + '점 만점에 ' + txt + '점')
    }, row);
  }

  /* ── 오브젝트 고르는 화면 ───────────────── */
  function pick(root) {
    var metas = {};
    var warn = el('p', { class: 'hint', role: 'status', 'aria-live': 'polite' });

    root.appendChild(el('div', { class: 'objs' }, objects.list.map(function (o) {
      metas[o.id] = el('span', { class: 'obj__meta', text: '리뷰를 불러오는 중…' });
      return el('a', { class: 'obj', href: '#/f/rating/' + o.id }, [
        el('span', { class: 'obj__art' }, objects.art(o.id)),
        el('span', { class: 'obj__main' }, [
          el('span', { class: 'obj__name', text: o.name }),
          metas[o.id]
        ]),
        el('span', { class: 'obj__go', text: '→' })
      ]);
    })));
    root.appendChild(warn);

    reviews.listAll(function (res) {
      objects.list.forEach(function (o) {
        var s = reviews.stats(res.byId[o.id] || []);
        var mine = reviews.mineCount(o.id);
        var meta = metas[o.id];
        clear(meta);
        /* 평점은 숫자 대신 별 그림으로 (상세 화면과 같은 이미지) — 소수점은 마지막 별이 부분 채움 */
        if (s.count) {
          meta.appendChild(stars(s.avg, false, '평균 ' + reviews.avgText(s.avg) + '점'));
          meta.appendChild(el('span', { text: '리뷰 ' + s.count + '개' }));
        } else {
          meta.appendChild(el('span', { text: '아직 리뷰 없음' }));
        }
        if (mine) meta.appendChild(el('span', { text: '· 내 리뷰 있음' }));
      });
      if (!res.ok) warn.textContent = res.error + (res.cached ? ' 저장해 둔 목록을 보여줍니다.' : '');
    });
  }  /* ── 리뷰 쓰고 보는 창 ─────────────────── */
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

    var rows = reviews.cached(o.id);      /* 먼저 보여주고, 서버에서 받아 갱신한다 */
    var shown = PAGE;
    var open = false;
    var busy = false;
    var removing = false;
    var score = reviews.legacyStars(o.id);   /* 예전에 별점만 매겨 둔 값이 있으면 초기값으로 */

    var statBox = el('div', { class: 'rate__stat' });
    var listBox = el('div', { class: 'ratelist' });
    var listHead = el('p', { class: 'rate__listhead' });
    var formBox = el('div', { class: 'formbox' });
    var warn = el('p', { class: 'hint' });
    var live = el('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    var writeBtn = el('button', {
      class: 'btn btn--main', type: 'button', 'aria-expanded': 'false',
      onClick: toggle, text: '평점 매기기'
    });

    /* 최종 평점 : 채운 별 · 큰 숫자 · 리뷰 수를 한 줄로 */
    function paintStat() {
      var s = reviews.stats(rows);
      clear(statBox);
      statBox.appendChild(stars(s.avg, true));
      statBox.appendChild(el('span', { class: 'rate__avg' }, [
        s.count ? reviews.avgText(s.avg) : '—',
        el('small', { text: ' / ' + MAX })
      ]));
      statBox.appendChild(el('span', {
        class: 'rate__count',
        text: s.count ? '리뷰 ' + s.count + '개' : '아직 리뷰 없음'
      }));
    }

    /* 리뷰 한 줄 — 내 리뷰에는 [삭제] 가 붙는다 */
    function item(r) {
      var mine = reviews.isMine(r);
      var top = [
        stars(r.stars, false),
        el('span', { class: 'rateitem__who', text: r.nickname || '익명' }),
        el('time', { class: 'rateitem__at', text: when(r.at) })
      ];
      if (mine) top.push(el('span', { class: 'rateitem__mine', text: '내 리뷰' }));

      var kids = [el('div', { class: 'rateitem__top' }, top)];
      if (r.body) kids.push(el('p', { class: 'rateitem__body', text: r.body }));
      if (mine) {
        kids.push(el('div', { class: 'rateitem__btns' }, [
          el('button', {
            class: 'btn btn--small', type: 'button', text: '삭제',
            onClick: function () { askRemove(r); }
          })
        ]));
      }
      return el('article', { class: 'rateitem' }, kids);
    }

    /* 내 리뷰 지우기 — 확인을 한 번 받고, 서버가 내 것일 때만 지워진다 */
    function askRemove(r) {
      if (removing) return;
      if (!window.confirm('내 리뷰를 지울까요? 되돌릴 수 없습니다.')) return;
      removing = true;
      reviews.remove(r.id, function (res) {
        removing = false;
        if (!res.ok) { warn.textContent = res.error; return; }
        rows = rows.filter(function (x) { return String(x.id) !== String(r.id); });
        paintStat();
        paintList();
        warn.textContent = '';
        live.textContent = '내 리뷰를 지웠습니다.';
      });
    }

    function paintList() {
      clear(listBox);
      listHead.textContent = rows.length ? '리뷰 ' + rows.length + '개 · 최신순' : '리뷰';
      if (!rows.length) {
        listBox.appendChild(el('p', { class: 'hint', text: '아직 리뷰가 없습니다. 첫 리뷰를 남겨보세요.' }));
        return;
      }
      rows.slice(0, shown).forEach(function (r) { listBox.appendChild(item(r)); });
      if (rows.length > shown) {
        listBox.appendChild(el('button', {
          class: 'btn btn--small rate__more', type: 'button',
          text: '리뷰 더 보기 (' + (rows.length - shown) + '개)',
          onClick: function () { shown += PAGE; paintList(); }
        }));
      }
    }    /* ── 작성 폼 ──────────────────────────── */
    var nickInput = el('input', {
      class: 'field__input', type: 'text', id: 'rv-nick', maxlength: NICK_MAX,
      value: reviews.nick(), placeholder: '최대 ' + NICK_MAX + '자'
    });
    var bodyInput = el('textarea', {
      class: 'field__input field__area', id: 'rv-body', maxlength: BODY_MAX, rows: 2,
      placeholder: '리뷰를 적어주세요 (최대 ' + BODY_MAX + '자)'
    });
    var bodyCount = el('span', { class: 'field__count', text: '0 / ' + BODY_MAX });
    var errStars = el('p', { class: 'field__err', role: 'alert' });
    var errNick = el('p', { class: 'field__err', role: 'alert' });
    var errBody = el('p', { class: 'field__err', role: 'alert' });
    var formMsg = el('p', { class: 'field__err', role: 'alert' });
    var submitBtn = el('button', { class: 'btn btn--main', type: 'submit', text: '리뷰 남기기' });
    var starBtns = [];
    var i;

    function setScore(n) {
      score = n;
      starBtns.forEach(function (b, k) {
        b.setAttribute('aria-pressed', k < score ? 'true' : 'false');
        clear(b);
        b.appendChild(objects.star());
      });
    }

    for (i = 1; i <= MAX; i++) {
      (function (n) {
        starBtns.push(el('button', {
          class: 'star', type: 'button', 'aria-label': n + '점',
          onClick: function () { setScore(n); }
        }));
      })(i);
    }
    setScore(score);

    bodyInput.addEventListener('input', function () {
      bodyCount.textContent = bodyInput.value.length + ' / ' + BODY_MAX;
    });

    function clearErrors() {
      errStars.textContent = '';
      errNick.textContent = '';
      errBody.textContent = '';
      formMsg.textContent = '';
    }

    function showErrors(errors, msg) {
      errStars.textContent = errors.stars || '';
      errNick.textContent = errors.nickname || '';
      errBody.textContent = errors.body || '';
      formMsg.textContent = errors.form || msg || '';
    }

    var form = el('form', {
      class: 'rateform', novalidate: true,
      onSubmit: function (e) { e.preventDefault(); submit(); }
    }, [
      el('div', { class: 'field' }, [
        el('span', { class: 'field__label', text: '별점' }),
        el('div', { class: 'rateform__stars', role: 'group', 'aria-label': o.name + ' 별점' }, starBtns),
        errStars
      ]),
      el('div', { class: 'field' }, [
        el('label', { class: 'field__label', for: 'rv-nick', text: '닉네임' }),
        nickInput,
        errNick
      ]),
      el('div', { class: 'field' }, [
        el('label', { class: 'field__label', for: 'rv-body', text: '리뷰' }),
        bodyInput,
        el('div', { class: 'field__foot' }, [
          el('span', { text: '닉네임과 리뷰는 누구나 볼 수 있습니다.' }),
          bodyCount
        ]),
        errBody
      ]),
      formMsg,
      el('div', { class: 'rateform__btns' }, [
        submitBtn,
        el('button', { class: 'btn', type: 'button', text: '취소', onClick: closeForm })
      ])
    ]);

    function openForm() {
      open = true;
      writeBtn.setAttribute('aria-expanded', 'true');
      clear(formBox);
      if (reviews.mineCount(o.id) >= reviews.maxPerObject) {
        /* 남길 수 있는 수를 넘었다 — 지우면 다시 남길 수 있다 */
        formBox.appendChild(el('p', {
          class: 'hint',
          text: '이 오브젝트에는 리뷰를 ' + reviews.maxPerObject + '개까지 남길 수 있습니다. 남긴 리뷰를 지우면 다시 남길 수 있습니다.'
        }));
        return;
      }
      if (reviews.ready()) {
        formBox.appendChild(form);
      } else {
        formBox.appendChild(el('p', {
          class: 'hint',
          text: '지금은 리뷰 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.'
        }));
      }
    }

    function closeForm() {
      open = false;
      writeBtn.setAttribute('aria-expanded', 'false');
      clear(formBox);
    }

    function toggle() { if (open) closeForm(); else openForm(); }    /* ── 저장 ─────────────────────────────── */
    function submit() {
      if (busy) return;
      clearErrors();

      var raw = { objectId: o.id, stars: score, nickname: nickInput.value, body: bodyInput.value };
      var v = reviews.validate(raw);
      if (!v.ok) {
        showErrors(v.errors, '입력한 내용을 다시 확인해 주세요.');
        if (v.errors.stars) starBtns[0].focus();
        else if (v.errors.nickname) nickInput.focus();
        else bodyInput.focus();
        return;
      }

      busy = true;
      submitBtn.disabled = true;
      submitBtn.textContent = '남기는 중…';

      reviews.add(raw, function (res) {
        busy = false;
        submitBtn.disabled = false;
        submitBtn.textContent = '리뷰 남기기';

        if (!res.ok) {
          if (res.errors) showErrors(res.errors, res.error);
          else formMsg.textContent = res.error;
          return;
        }

        reviews.clearLegacy(o.id);        /* 예전에 매겨 둔 별점은 리뷰로 옮겼으니 지운다 */
        rows = [res.row].concat(rows);
        bodyInput.value = '';
        bodyCount.textContent = '0 / ' + BODY_MAX;
        paintStat();
        paintList();
        closeForm();
        live.textContent = o.name + ' 리뷰를 남겼습니다.';
      });
    }

    /* 서버에서 최신 목록을 받아 다시 그린다 */
    function refresh() {
      reviews.list(o.id, function (res) {
        rows = res.rows;
        paintStat();
        paintList();
        warn.textContent = res.ok ? '' : res.error + (res.cached ? ' 저장해 둔 목록을 보여줍니다.' : '');
      });
    }

    /* ── 화면 조립 ────────────────────────── */
    paintStat();

    root.appendChild(el('div', { class: 'ratecard' }, [
      el('div', { class: 'rate' }, [
        el('span', { class: 'rate__art' }, objects.art(o.id)),
        el('p', { class: 'rate__name', text: o.name }),
        statBox,
        el('div', { class: 'rate__btns' }, [
          writeBtn,
          el('a', { class: 'btn', href: '#/f/rating', text: '← 오브젝트 목록' })
        ]),
        formBox
      ])
    ]));
    root.appendChild(el('div', { class: 'ratecard ratecard--list' }, [listHead, listBox]));
    root.appendChild(warn);
    root.appendChild(live);

    paintList();
    refresh();
  }

  BL.views = BL.views || {};
  BL.views.rating = {
    /* 화면 제목을 돌려주면 app.js 가 그걸 쓴다 (없으면 기능 이름) */
    render: function (root, sub) {
      var o = sub ? objects.find(sub) : null;
      if (sub) rate(root, sub);
      else pick(root);
      return o ? o.name + ' 리뷰' : '';
    }
  };
})(window.BL);
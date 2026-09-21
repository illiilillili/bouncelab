window.BL = window.BL || {};

/* 컨트롤 룰렛 — 도감(스프레드시트)의 컨트롤 631개 중 하나를 뽑는다.
 * 그림은 도감 DB(bbDB)의 gif 칸에 걸린 드라이브 파일을 그대로 불러온다.
 * 그림이 없거나 못 불러오면 이름에서 뽑은 색 타일로 대신한다. */
(function (BL) {
  var el = BL.dom.el;
  var clear = BL.dom.clear;
  var rng = BL.rng;
  var storage = BL.storage;

  var K = { filters: 'controls.filters' };
  var ITEM_H = 58;          /* style.css 의 --reel-h 와 같아야 함 */
  var ROLL_MS = 1700;
  var TRACK_ITEMS = 22;
  var DIFFS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  var BAR_CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];   /* 막대는 10칸 — 난이도 10 이면 전부 켜짐 */

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* 이름 -> 0 이상의 정수 (타일 첫 글자용) */
  function initial(name) {
    var clean = String(name).replace(/[^0-9A-Za-z가-힣]/g, '');
    return (clean.charAt(0) || '?').toUpperCase();
  }

  function tile(c) {
    return el('div', { class: 'shot shot--empty', 'aria-hidden': 'true' }, [
      el('span', { class: 'shot__ini', text: initial(c.name) })
    ]);
  }

  /* 그림 자리 : 있으면 드라이브 GIF, 없거나 실패하면 색 타일 */
  function shot(c) {
    if (!c.imgs || !c.imgs.length) return tile(c);
    var id = String(c.imgs[0]).split('/').pop();
    var backup = 'https://drive.google.com/uc?export=view&id=' + id;
    var img = el('img', { class: 'shot__img', src: c.imgs[0], alt: '', loading: 'lazy' });
    var box = el('div', { class: 'shot' }, [img]);
    img.addEventListener('error', function () {
      if (img.getAttribute('src') !== backup) { img.setAttribute('src', backup); return; }
      if (box.parentNode) box.parentNode.replaceChild(tile(c), box);
    });
    return box;
  }

  function diffBar(n) {
    return el('span', { class: 'diffbar' }, BAR_CELLS.map(function (i) {
      return el('i', { class: i < n ? 'on' : '' });
    }));
  }

  function chips(list, emptyText) {
    if (!list || !list.length) return el('span', { class: 'ctrl__none', text: emptyText });
    return el('span', { class: 'ctrl__chips' }, list.map(function (t) {
      return el('span', { class: 'ctrlchip', text: t });
    }));
  }

  function sheetUrl(c) {
    var meta = BL.controlsMeta || {};
    var base = 'https://docs.google.com/spreadsheets/d/' + (meta.sheetId || '') + '/edit#gid=' + (meta.gid || '');
    return c.cell ? base + '&range=' + c.cell : base;
  }

  BL.views = BL.views || {};

  /* ── 목록 받아오기 ──────────────────────────
   * data/controls.js 는 297KB(도감 631개)라 첫 화면에서 받지 않는다.
   * 이 화면을 처음 열 때 그때 받고, 그동안은 '불러오는 중' 을 보여준다.
   * 캐시 무효화 값(?v=)은 HTML 이 쓰는 값과 같아야 하므로 script 주소에서 그대로 물려받는다. */
  var DATA = 'data/controls.js';
  var waiting = false;

  function stamp() {
    var n = document.querySelector('script[src*="data/"]');
    var m = n && /\?v=(\d+)/.exec(n.getAttribute('src') || '');
    return m ? '?v=' + m[1] : '';
  }

  function loadData(root) {
    if (waiting) return;
    waiting = true;
    var tag = document.createElement('script');
    tag.src = DATA + stamp();
    tag.async = true;
    tag.onload = function () {
      waiting = false;
      if (root.isConnected) { clear(root); BL.views.controls.render(root); }
    };
    tag.onerror = function () {
      waiting = false;
      BL.controlsFailed = true;          /* 다시 시도하지 않고 안내만 보여준다 */
      if (root.isConnected) { clear(root); BL.views.controls.render(root); }
    };
    document.head.appendChild(tag);
  }

  /* 평균 3.43 → 3.4 (리뷰 평균과 같은 한 자리 표기) */
  function avgText(v) { return (Math.round(Number(v) * 10) / 10).toFixed(1); }

  /* ── 재미도 : 평균 박스 + 점수 매기기 ────────
   * '도감에서 보기' 자리에 들어간다. 박스에는 모두가 매긴 점수의 **평균**이 보이고 (아무도 안 매겼으면 '-'),
   * 누르면 1~5 작은 목록이 떠서 하나를 고른다. 고르면 박스가 살짝 커졌다 돌아오는 효과로 알려준다.
   * 내가 고른 점수는 목록에서 표시되고, 서버(control_fun 표)에 쌓여 모두와 공유된다.
   * 서버를 못 쓰면 이 브라우저에만 저장되고, 아래 한 줄이 그 사실을 알려준다. */
  function funPick(c) {
    var note = el('p', { class: 'fun__note' });
    var wrap = el('div', { class: 'funwrap' });
    var txt = el('span', { class: 'funpick__txt', text: '재미도 : -' });
    var box = el('button', {
      class: 'funpick', type: 'button',
      'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-label': '재미도 점수',
      onClick: function () { open(list.hidden); },
      onKeydown: onKey
    }, [txt]);
    var list = el('div', {
      class: 'funlist', role: 'listbox', 'aria-label': '재미도 고르기',
      hidden: true, onKeydown: onKey
    });
    var items = [];
    var last = null;               /* 마지막으로 받은 값 (평균 · 내 점수) */
    var mine = 0;

    for (var i = BL.fun.min; i <= BL.fun.max; i++) {
      (function (score) {
        var it = el('button', {
          class: 'funlist__i', type: 'button', role: 'option', 'aria-selected': 'false',
          text: String(score),
          onClick: function () { pick(score); }
        });
        items.push(it);
        list.appendChild(it);
      })(i);
    }
    wrap.appendChild(box);
    wrap.appendChild(list);

    function open(v) {
      list.hidden = !v;
      box.setAttribute('aria-expanded', v ? 'true' : 'false');
    }

    function onKey(e) {
      if (e.key === 'Escape' || e.keyCode === 27) { open(false); box.focus(); }
    }

    function paint(res) {
      var r = res || {};
      last = r;
      var total = r.total || 0;
      mine = r.mine || BL.fun.mineLocal(c.name) || 0;
      txt.textContent = '재미도 : ' + (total ? avgText(r.avg) : '-');
      box.title = (total ? '평균 ' + avgText(r.avg) + '점 · ' + total + '명' : '아직 아무도 안 매겼습니다') +
        (mine ? ' · 내 점수 : ' + mine : '') + ' · 누르면 ' + (mine ? '바꿀 수 있습니다' : '매길 수 있습니다');
      items.forEach(function (it, i) {
        var isMine = mine === i + 1;
        it.classList.toggle('is-mine', isMine);
        it.setAttribute('aria-selected', isMine ? 'true' : 'false');
      });
    }

    /* 매겼을 때 박스를 살짝 (효과). 움직임을 줄이는 설정이면 CSS 가 알아서 끕니다 */
    function pop() {
      box.classList.remove('is-pop');
      void box.offsetWidth;
      box.classList.add('is-pop');
      window.setTimeout(function () { box.classList.remove('is-pop'); }, 700);
    }

    function pick(score) {
      if (!score) return;
      open(false);
      note.textContent = '';
      paint({ total: last ? last.total : 0, avg: last ? last.avg : 0, mine: score });   /* 고른 즉시 표시 */
      pop();
      BL.fun.set(c.name, score, function (res) {
        if (!res.ok && res.error) note.textContent = res.error + ' 이 브라우저에만 저장했습니다.';
        BL.fun.get(c.name, function (got) {
          paint(got);
          if (!got.ok && got.error && !note.textContent) note.textContent = got.error;
        });
      });
    }

    /* 목록 밖으로 포커스가 나가면 닫는다 (목록 항목으로 옮겨간 경우는 그대로) */
    box.addEventListener('blur', function () {
      window.setTimeout(function () {
        if (!wrap.contains(document.activeElement)) open(false);
      }, 120);
    });

    /* 처음부터 서버 평균까지 보여준다 — 이때 Supabase SDK 가 아직이면 그때 받는다 (js/lib/fun.js 의 get) */
    BL.fun.get(c.name, paint);

    return { box: wrap, note: note };
  }

  BL.views.controls = {
    render: function (root) {
      /* 아직 안 받았으면 받는 동안 안내만 (목록이 없는 것과 다르다) */
      if (!BL.controls) {
        root.appendChild(el('div', { class: 'box' }, [
          el('h2', { text: '컨트롤 룰렛' }),
          el('p', BL.controlsFailed
            ? { text: '컨트롤 목록을 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.' }
            : { class: 'hint', text: '컨트롤 목록' + (BL.controlsCount ? ' (' + BL.controlsCount + '개)' : '') + '을 불러오는 중…' })
        ]));
        if (!BL.controlsFailed) loadData(root);
        return;
      }

      var all = BL.controls;

      if (!all.length) {
        root.appendChild(el('div', { class: 'box' }, [
          el('h2', { text: '컨트롤 룰렛' }),
          el('p', { text: '컨트롤 목록이 없습니다. npm run sync:controls 로 도감에서 받아오면 여기서 바로 돌아갑니다.' })
        ]));
        return;
      }

      var meta = BL.controlsMeta || {};
      var saved = storage.get(K.filters, {});
      var state = {
        min: saved.min == null ? '' : String(saved.min),
        max: saved.max == null ? '' : String(saved.max),
        rolling: false,
        winner: null
      };

      function baseList() {
        /* 최저·최고를 뒤집어 골라도(9~7) 그 사이 난이도가 나오게 정렬해서 쓴다 */
        var a = state.min === '' ? -Infinity : Number(state.min);
        var b = state.max === '' ? Infinity : Number(state.max);
        var lo = Math.min(a, b), hi = Math.max(a, b);
        return all.filter(function (c) { return c.diff >= lo && c.diff <= hi; });
      }

      function diffOptions() {
        return [el('option', { value: '', text: '전체' })].concat(DIFFS.map(function (d) {
          return el('option', { value: String(d), text: String(d), selected: String(d) === state.min });
        }));
      }

      var minSel = el('select', { 'aria-label': '난이도 최저', onChange: function () { onRange('min', minSel.value); } }, diffOptions());
      var maxSel = el('select', { 'aria-label': '난이도 최고', onChange: function () { onRange('max', maxSel.value); } },
        [el('option', { value: '', text: '전체' })].concat(DIFFS.map(function (d) {
          return el('option', { value: String(d), text: String(d), selected: String(d) === state.max });
        })));

      var countEl = el('span');
      var emptyMsg = el('p', { class: 'hint' });
      var live = el('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
      var track = el('div', { class: 'reel__track' });
      var resultEl = el('div', { class: 'result result--empty' });
      var spinBtn = el('button', { class: 'btn btn--main', type: 'button', onClick: spin }, [el('span', { text: '컨트롤 뽑기' })]);

      function ph(text) {
        return el('p', { class: 'ph' }, [BL.icons.get('dice'), el('span', { text: text })]);
      }

      function reelItem(c) {
        return el('div', { class: 'reel__item' }, [
          el('span', { class: 'reel__by', text: '난이도 ' + c.diff }),
          el('span', { class: 'reel__name', text: c.name }),
          el('span', { class: 'reel__diff', text: c.cell || '-' })
        ]);
      }

      /* 아직 안 뽑았을 때 — 슬롯 가운데에 표시 하나만 (이름을 미리 보여주지 않는다) */
      function dashItem() {
        return el('div', { class: 'reel__item reel__item--dash' }, [
          el('span', { class: 'reel__dash', text: '-' })
        ]);
      }

      function restReel() {
        var list = baseList();
        clear(track);
        track.style.transition = 'none';
        track.style.transform = 'translateY(0)';
        if (state.winner) track.appendChild(reelItem(state.winner));
        else if (list.length) track.appendChild(dashItem());
        else track.appendChild(el('div', { class: 'reel__item' }, [el('span', { class: 'reel__name', text: '후보 없음' })]));
      }

      function onRange(which, value) {
        state[which] = value;
        storage.set(K.filters, { min: state.min, max: state.max });
        refresh();
      }

      function spin() {
        var list = baseList();
        if (state.rolling || !list.length) return;
        state.rolling = true;
        spinBtn.disabled = true;
        spinBtn.textContent = '뽑는 중…';
        resultEl.className = 'result result--empty';
        clear(resultEl);
        resultEl.appendChild(ph('뽑는 중…'));

        var winner = rng.pick(list);
        var items = rng.shuffle(list).slice(0, TRACK_ITEMS - 1).map(reelItem);
        items.push(reelItem(winner));
        clear(track);
        items.forEach(function (node) { track.appendChild(node); });
        track.style.transition = 'none';
        track.style.transform = 'translateY(0)';
        void track.offsetHeight;

        var target = -(items.length - 1) * ITEM_H;
        if (reduced()) {
          track.style.transform = 'translateY(' + target + 'px)';
          finish(winner);
        } else {
          track.style.transition = 'transform ' + ROLL_MS + 'ms cubic-bezier(.16,.66,.14,1)';
          track.style.transform = 'translateY(' + target + 'px)';
          window.setTimeout(function () { finish(winner); }, ROLL_MS + 80);
        }
      }

      function finish(winner) {
        state.rolling = false;
        state.winner = winner;
        spinBtn.disabled = false;
        spinBtn.textContent = '다시 뽑기';
        showResult(winner);
        refresh();
        live.textContent = winner.name + ', 난이도 ' + winner.diff;
      }

      function showResult(c) {
        resultEl.className = 'result';
        clear(resultEl);
        resultEl.appendChild(el('div', { class: 'ctrl' }, [
          shot(c),
          el('div', { class: 'ctrl__main' }, [
            el('p', { class: 'result__name', text: c.name }),
            el('div', { class: 'diffrow' }, [
              diffBar(c.diff),
              el('span', { class: 'diffnum', text: String(c.diff) }),
              el('span', { class: 'diffof', text: '/ 10' })
            ]),
            el('div', { class: 'ctrl__rows' }, [el('span', { class: 'ctrl__label', text: '태그' }), chips(c.tags, '없음')]),
            el('div', { class: 'ctrl__rows' }, [el('span', { class: 'ctrl__label', text: '재료' }), chips(c.mats, '없음')]),
            c.tip ? el('div', { class: 'ctrl__rows' }, [el('span', { class: 'ctrl__label', text: '설명' }), el('span', { class: 'ctrl__tip', text: c.tip })]) : null
          ])
        ]));
        var fun = funPick(c);
        resultEl.appendChild(el('div', { class: 'result__btns result__btns--pair' }, [
          el('button', { class: 'btn btn--main', type: 'button', onClick: spin },
            [BL.icons.get('rotate'), el('span', { text: '다시 뽑기' })]),
          fun.box
        ]));
        resultEl.appendChild(fun.note);
      }

      function refresh() {
        var list = baseList();
        countEl.textContent = list.length + ' / ' + all.length + '개';
        restReel();
        spinBtn.disabled = state.rolling || !list.length;
        emptyMsg.textContent = list.length ? '' : '조건에 맞는 컨트롤이 없습니다. 난이도 범위를 바꿔보세요.';
      }

      resultEl.appendChild(ph('컨트롤 뽑기를 눌러주세요.'));

      /* 좁은 화면 : 위에서 아래로 한 줄 / 넓은 화면 : 왼쪽(고르기) + 오른쪽 옆칸(결과) */
      root.appendChild(el('div', { class: 'tool' }, [
        el('div', { class: 'tool__main' }, [
          /* 필터와 슬롯은 한 덩어리(뽑기 판)라서 한 면(.board) 안에 묶는다 */
          el('div', { class: 'board' }, [
            el('div', { class: 'filters' }, [
              el('div', { class: 'f' }, [
                el('span', { class: 'f__label', text: '난이도' }),
                el('span', { class: 'f__row' }, [minSel, el('em', { class: 'dash', text: '~' }), maxSel])
              ]),
              el('span', { class: 'count' }, countEl)
            ]),
            el('div', { class: 'reel' }, track)
          ]),
          el('div', { class: 'roll-row' }, spinBtn),
          emptyMsg
        ]),
        el('div', { class: 'tool__side' }, [resultEl]),
        el('div', { class: 'tool__foot' }, [
          el('p', { class: 'hint', text: '도감 컨트롤 ' + all.length + '개 · 그림 ' + (meta.withImg || 0) + '개 · 자료 출처: 바운스볼 도감' }),
          live
        ])
      ]));

      refresh();
    }
  };
})(window.BL);

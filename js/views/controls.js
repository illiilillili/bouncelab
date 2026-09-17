window.BL = window.BL || {};

/* 랜덤 컨트롤 룰렛 — 도감(스프레드시트)의 컨트롤 631개 중 하나를 뽑는다.
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

  BL.views.controls = {
    render: function (root) {
      var all = BL.controls || [];

      if (!all.length) {
        root.appendChild(el('div', { class: 'box' }, [
          el('h2', { text: '랜덤 컨트롤 룰렛' }),
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

      function restReel() {
        var list = baseList();
        var show = state.winner || list[0] || null;
        clear(track);
        track.style.transition = 'none';
        track.style.transform = 'translateY(0)';
        if (show) track.appendChild(reelItem(show));
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
        resultEl.appendChild(el('div', { class: 'result__btns' }, [
          el('button', { class: 'btn btn--main', type: 'button', onClick: spin },
            [BL.icons.get('rotate'), el('span', { text: '다시 뽑기' })]),
          el('a', { class: 'btn', href: sheetUrl(c), target: '_blank', rel: 'noopener' }, ['도감에서 보기 ↗'])
        ]));
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
          el('div', { class: 'filters' }, [
            el('div', { class: 'f' }, [
              el('span', { class: 'f__label', text: '난이도' }),
              el('span', { class: 'f__row' }, [minSel, el('em', { class: 'dash', text: '~' }), maxSel])
            ]),
            el('span', { class: 'count' }, countEl)
          ]),
          el('div', { class: 'reel' }, track),
          el('div', { class: 'roll-row' }, spinBtn),
          emptyMsg
        ]),
        el('div', { class: 'tool__side' }, [resultEl]),
        el('div', { class: 'tool__foot' }, [
          el('p', { class: 'hint', text: '도감 컨트롤 ' + all.length + '개 · 그림 ' + (meta.withImg || 0) + '개 · 자료 출처: 바운스볼 도감' }),
          BL.contact.row(function () {
            var c = state.winner;
            if (!c) return [];
            var lines = ['컨트롤: ' + c.name, '난이도: ' + c.diff];
            if (c.tags.length) lines.push('태그: ' + c.tags.join(' '));
            if (c.cell) lines.push('도감 위치: ' + c.cell);
            return lines;
          }),
          live
        ])
      ]));

      refresh();
    }
  };
})(window.BL);

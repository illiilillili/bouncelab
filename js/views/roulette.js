window.BL = window.BL || {};

/* 맵 룰렛 — 슬롯 롤링으로 맵 하나를 뽑는다. */
(function (BL) {
  var el = BL.dom.el;
  var clear = BL.dom.clear;
  var query = BL.query;
  var rng = BL.rng;
  var storage = BL.storage;

  var K = { filters: 'roulette.filters' };
  var ITEM_H = 58;          /* style.css 의 --reel-h 와 같아야 함 */
  var ROLL_MS = 1900;
  var TRACK_ITEMS = 26;

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* 맵 이름에서 뽑은 색으로 블럭 타일을 그린다 (맵 그림 데이터가 없어서 만든 도형) */
  function hash(text) {
    var s = String(text), h = 7;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003;
    return h;
  }

  function mapTile(m) {
    var h = hash(m.by + '|' + m.name);
    var ink = ['#1f7a8c', '#022b3a'][h % 2];
    var cells = '';
    for (var i = 0; i < 16; i++) {
      var on = ((h >> ((i + h) % 12)) & 1) === 1;
      cells += '<rect x="' + (i % 4) * 6 + '" y="' + Math.floor(i / 4) * 6 +
        '" width="5" height="5" rx="1" fill="' + (on ? ink : '#e6ecf5') + '"/>';
    }
    var box = document.createElement('span');
    box.className = 'mtile';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<svg viewBox="0 0 23 23">' + cells + '</svg>';
    return box;
  }

  function optionList(placeholder, values, current) {
    return [el('option', { value: '', text: placeholder })].concat(values.map(function (v) {
      return el('option', { value: v, text: v, selected: v === current });
    }));
  }

  BL.views = BL.views || {};

  BL.views.roulette = {
    render: function (root) {
      var maps = BL.maps || [];

      if (!maps.length) {
        root.appendChild(el('div', { class: 'box' }, [
          el('h2', { text: '맵 룰렛' }),
          el('p', { text: '맵 목록이 아직 없습니다. data/maps.js 를 채우면 여기서 바로 돌아갑니다.' })
        ]));
        return;
      }

      var diffs = query.diffOptions(maps);
      var allTags = query.tagOptions(maps);
      var saved = storage.get(K.filters, {});
      var state = {
        min: typeof saved.min === 'string' ? saved.min : '',
        max: typeof saved.max === 'string' ? saved.max : '',
        tags: saved.tags instanceof Array ? saved.tags : [],
        rolling: false,
        winner: null
      };
      var tagChips = [];

      var minSel = el('select', { 'aria-label': '난이도 최저', onChange: function () { onRange('min', minSel.value); } }, optionList('전체', diffs, state.min));
      var maxSel = el('select', { 'aria-label': '난이도 최고', onChange: function () { onRange('max', maxSel.value); } }, optionList('전체', diffs, state.max));
      var countEl = el('span');
      var tagWrap = el('span', { class: 'tags__row' });
      var emptyMsg = el('p', { class: 'hint' });
      var msgEl = el('p', { class: 'hint' });
      var live = el('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
      var tableBody = el('tbody');
      var tableCount = el('span');
      var resultEl = el('div', { class: 'result result--empty' });
      var spinBtn = el('button', { class: 'btn btn--main', type: 'button', onClick: spin, text: '맵 뽑기' });
      var track = el('div', { class: 'reel__track', 'aria-hidden': 'true' });

      function saveFilters() {
        storage.set(K.filters, { min: state.min, max: state.max, tags: state.tags });
      }

      /* 난이도를 '전체' 로 바꾼 그 순간에만 양쪽을 전체로 돌린다.
         한쪽만 전체인 상태(예: 5 ~ 전체)는 그대로 둔다. */
      function onRange(side, value) {
        if (value === '') {
          state.min = '';
          state.max = '';
        } else if (side === 'min') {
          state.min = value;
        } else {
          state.max = value;
        }
        minSel.value = state.min;
        maxSel.value = state.max;
        saveFilters();
        refresh();
      }

      function baseList() {
        return query.filter(maps, { min: state.min, max: state.max, tags: state.tags });
      }

      function renderTags() {
        clear(tagWrap);
        tagChips = [];
        if (!allTags.length) {
          tagWrap.appendChild(el('span', { class: 'tags__empty', text: '아직 등록된 해시태그가 없습니다 (나중에 추가 예정)' }));
          return;
        }
        allTags.forEach(function (t) {
          var on = state.tags.indexOf(t) >= 0;
          var btn = el('button', {
            class: 'tchip', type: 'button', 'aria-pressed': on ? 'true' : 'false',
            text: '#' + t, onClick: function () { toggleTag(t); }
          });
          tagChips.push({ tag: t, btn: btn });
          tagWrap.appendChild(btn);
        });
      }

      function syncTags() {
        tagChips.forEach(function (c) {
          c.btn.setAttribute('aria-pressed', state.tags.indexOf(c.tag) >= 0 ? 'true' : 'false');
        });
      }

      function toggleTag(t) {
        var i = state.tags.indexOf(t);
        if (i >= 0) state.tags.splice(i, 1);
        else state.tags.push(t);
        saveFilters();
        syncTags();
        refresh();
      }

      function reelItem(m) {
        return el('div', { class: 'reel__item' }, [
          el('span', { class: 'reel__by', text: m.by }),
          el('span', { class: 'reel__name', text: m.name }),
          el('span', { class: 'reel__diff', text: '난이도 ' + m.diff })
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

      function flash(text) {
        msgEl.textContent = text;
        window.setTimeout(function () { if (msgEl.textContent === text) msgEl.textContent = ''; }, 2200);
      }

      function spin() {
        var list = baseList();
        if (state.rolling || !list.length) return;
        state.rolling = true;
        spinBtn.disabled = true;
        spinBtn.textContent = '뽑는 중…';
        resultEl.className = 'result result--empty';
        clear(resultEl);
        resultEl.appendChild(el('p', { text: '뽑는 중…' }));

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
        spinBtn.textContent = '맵 뽑기';
        showResult(winner);
        refresh();
        live.textContent = winner.name + ', 제작자 ' + winner.by + ', 난이도 ' + winner.diff;
      }

      function showResult(m) {
        resultEl.className = 'result';
        clear(resultEl);
        resultEl.appendChild(el('div', { class: 'result__top' }, [
          mapTile(m),
          el('div', { class: 'result__head' }, [
            el('p', { class: 'result__name', text: m.name }),
            el('p', { class: 'result__meta', text: '제작자 ' + m.by + ' · 난이도 ' + m.diff })
          ])
        ]));
        resultEl.appendChild(el('div', { class: 'result__btns' }, [
          el('button', { class: 'btn btn--main', type: 'button', onClick: spin, text: '다시 뽑기' }),
          el('button', { class: 'btn', type: 'button', onClick: function () { copy(m); }, text: '복사' })
        ]));
      }

      function copy(m) {
        BL.contact.copyLine(m.name + ' / ' + m.by + ' / ' + m.diff, flash);
      }

      function renderTable() {
        var list = baseList();
        tableCount.textContent = '(' + list.length + ' / ' + maps.length + ')';
        if (!detailsEl.open) return;
        clear(tableBody);
        list.forEach(function (m) {
          tableBody.appendChild(el('tr', {}, [
            el('td', { text: m.by }),
            el('td', { text: m.name }),
            el('td', { text: m.diff })
          ]));
        });
      }

      function refresh() {
        var list = baseList();
        countEl.textContent = list.length + ' / ' + maps.length + '개';
        restReel();
        renderTable();
        spinBtn.disabled = state.rolling || !list.length;
        emptyMsg.textContent = list.length ? '' : '조건에 맞는 맵이 없습니다. 난이도 범위나 해시태그를 바꿔보세요.';
      }

      var detailsEl = el('details', { class: 'details', onToggle: function () { if (detailsEl.open) renderTable(); } }, [
        el('summary', {}, ['전체 맵 목록 ', tableCount]),
        el('div', { class: 'details__body' }, [
          el('table', { class: 'map-table' }, [
            el('thead', {}, [el('tr', {}, [el('th', { text: '제작자' }), el('th', { text: '맵 제목' }), el('th', { text: '난이도' })])]),
            tableBody
          ])
        ])
      ]);

      resultEl.appendChild(el('p', { text: '맵 뽑기를 눌러주세요.' }));

      /* 좁은 화면 : 위에서 아래로 한 줄 / 넓은 화면 : 왼쪽(고르기) + 오른쪽 옆칸(결과) */
      root.appendChild(el('div', { class: 'tool' }, [
        el('div', { class: 'tool__main' }, [
          el('div', { class: 'filters' }, [
            el('div', { class: 'f' }, [
              el('span', { class: 'f__label', text: '난이도' }),
              el('span', { class: 'f__row' }, [minSel, el('em', { class: 'dash', text: '~' }), maxSel])
            ]),
            el('div', { class: 'f' }, [el('span', { class: 'f__label', text: '해시태그' }), tagWrap]),
            el('span', { class: 'count' }, countEl)
          ]),
          el('div', { class: 'reel' }, track),
          el('div', { class: 'roll-row' }, spinBtn),
          emptyMsg
        ]),
        el('div', { class: 'tool__side' }, [resultEl, msgEl]),
        el('div', { class: 'tool__foot' }, [
          detailsEl,
          BL.contact.row(function () {
            var m = state.winner;
            return m ? ['맵 제목: ' + m.name, '제작자: ' + m.by, '난이도: ' + m.diff] : [];
          }),
          live
        ])
      ]));

      renderTags();
      refresh();
    }
  };
})(window.BL);
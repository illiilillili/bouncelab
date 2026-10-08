window.BL = window.BL || {};

/* 맵 룰렛 — 슬롯 롤링으로 맵 하나를 뽑는다. */
(function (BL) {
  var el = BL.dom.el;
  var clear = BL.dom.clear;
  var query = BL.query;
  var rng = BL.rng;
  var storage = BL.storage;

  var K = {
    filters: 'roulette.filters',
    cleared: 'roulette.cleared'    /* 이 브라우저가 클리어한 맵 — '제작자|맵이름' 목록 */
  };

  var ITEM_H = 58;          /* style.css 의 --reel-h 와 같아야 함 */
  var ROLL_MS = 1900;
  var TRACK_ITEMS = 26;

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* 맵 그림 자리 — 아직 맵 그림 데이터가 없다. 회색 칸에 '썸네일' 만 적어 둔다.
     (맵 그림이 생기면 이 함수만 진짜 그림으로 바꾸면 된다) */
  function thumb() {
    return el('span', { class: 'mtile mtile--ph', 'aria-hidden': 'true', text: '썸네일' });
  }

  /* 맵 하나를 가리키는 키 — 점검 스크립트(scripts/check-deploy.js)가 중복을 검사하는 조합과 같다 */
  function mapKey(m) {
    return m.by + '|' + m.name;
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
      var saved = storage.get(K.filters, {});
      var state = {
        min: typeof saved.min === 'string' ? saved.min : '',
        max: typeof saved.max === 'string' ? saved.max : '',
        rolling: false,
        winner: null
      };

      var minSel = el('select', { 'aria-label': '난이도 최저', onChange: function () { onRange('min', minSel.value); } }, optionList('전체', diffs, state.min));
      var maxSel = el('select', { 'aria-label': '난이도 최고', onChange: function () { onRange('max', maxSel.value); } }, optionList('전체', diffs, state.max));
      var countEl = el('span');
      var emptyMsg = el('p', { class: 'hint' });
      var msgEl = el('p', { class: 'hint' });
      var live = el('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
      var tableBody = el('tbody');
      var tableCount = el('span');
      var resultEl = el('div', { class: 'result result--empty' });
      var spinBtn = el('button', { class: 'btn btn--main', type: 'button', onClick: spin, text: '맵 뽑기' });
      var track = el('div', { class: 'reel__track', 'aria-hidden': 'true' });

      /* ── 클리어한 맵 (이 브라우저) ─────────────────────
       * 결과 카드와 전체 맵 목록 양쪽에서 체크할 수 있고, 어느 쪽을 눌러도 여기 한 곳에 모여 저장된다.
       * 맵 키는 점검 스크립트(scripts/check-deploy.js)가 중복을 검사하는 조합('제작자|맵이름')과 같다. */
      var cleared = {};
      (function () {
        var savedCleared = storage.get(K.cleared, []);
        if (savedCleared instanceof Array) savedCleared.forEach(function (k) { cleared[String(k)] = 1; });
      })();

      function isCleared(m) { return cleared[mapKey(m)] === 1; }

      function setCleared(m, on) {
        if (on) cleared[mapKey(m)] = 1; else delete cleared[mapKey(m)];
        storage.set(K.cleared, Object.keys(cleared));
        syncChecks();
        /* 안내는 켤 때만 띄운다 — 끌 때는 조용히 (방금 켠 안내가 떠 있으면 그것도 지운다) */
        if (on) flash('클리어한 맵으로 표시했습니다');
        else if (msgEl.textContent === '클리어한 맵으로 표시했습니다') msgEl.textContent = '';
      }

      /* 화면에 그려 둔 체크박스(결과 카드 · 목록 표)를 저장된 값에 맞춘다 */
      function syncChecks() {
        BL.dom.qsa('[data-clear]').forEach(function (n) {
          n.checked = !!cleared[n.getAttribute('data-clear')];
        });
      }

      /* 체크박스 하나 — data-clear 에 맵 키를 담아 두어 나중에 한 번에 맞출 수 있게 한다 */
      function clearCheck(m, label, cls) {
        var input = el('input', {
          type: 'checkbox', 'data-clear': mapKey(m), 'aria-label': label, title: '클리어한 맵으로 표시',
          onChange: function () { setCleared(m, input.checked); }
        });
        input.checked = isCleared(m);
        return el('label', { class: cls || 'chk' }, [input]);
      }

      /* 맵 신청 — 자기 맵을 룰렛에 넣고 싶은 사람이 누르면 연락처(data/site.js 의 contact.copyText,
         지금은 메일 주소)를 복사한다 (js/lib/contact.js). */
      var inviteBtn = el('button', {
        class: 'invite__btn', type: 'button', text: '맵 신청하기',
        onClick: function () { BL.contact.copyLine(BL.contact.config().copyText, flash); }
      });

      function saveFilters() {
        storage.set(K.filters, { min: state.min, max: state.max });
      }

      /* 난이도를 '전체' 로 바꾼 그 순간에만 양쪽을 전체로 돌린다.
         뒤집어 골라도(12 ~ 10) 보이는 값은 그대로 두고, 거르는 값만 10~12 로 본다 (js/lib/query.js 의 filter). */
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
        return query.filter(maps, { min: state.min, max: state.max });
      }

      function reelItem(m) {
        return el('div', { class: 'reel__item' }, [
          el('span', { class: 'reel__by', text: m.by }),
          el('span', { class: 'reel__name', text: m.name }),
          el('span', { class: 'reel__diff', text: '난이도 ' + m.diff })
        ]);
      }

      /* 아직 안 뽑았을 때 — 슬롯 가운데에 표시 하나만 (제목·제작자를 미리 보여주지 않는다) */
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
          thumb(),
          el('div', { class: 'result__head' }, [
            /* 제목 끝에 클리어 체크박스 — 이 맵을 깼는지 스스로 표시해 둔다 */
            el('p', { class: 'result__name' }, [
              m.name,
              clearCheck(m, '클리어한 맵', 'chk result__check')
            ]),
            el('p', { class: 'result__meta', text: '제작자 ' + m.by + ' · 난이도 ' + m.diff })
          ])
        ]));
        /* 다시 뽑기와 복사를 같은 폭·같은 높이로 (컨트롤 룰렛과 같은 틀) */
        resultEl.appendChild(el('div', { class: 'result__btns result__btns--pair' }, [
          el('button', { class: 'btn btn--main', type: 'button', onClick: spin, text: '다시 뽑기' }),
          el('button', { class: 'btn', type: 'button', onClick: function () { copy(m); }, text: '복사' })
        ]));
      }

      /* 복사 — 맵 이름만 (제작자·난이도는 붙이지 않는다) */
      function copy(m) {
        BL.contact.copyLine(m.name, flash);
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
            el('td', { text: m.diff }),
            el('td', { class: 'map-table__check' }, [clearCheck(m, m.name + ' 클리어')])
          ]));
        });
      }

      function refresh() {
        var list = baseList();
        countEl.textContent = list.length + ' / ' + maps.length + '개';
        restReel();
        renderTable();
        spinBtn.disabled = state.rolling || !list.length;
        emptyMsg.textContent = list.length ? '' : '조건에 맞는 맵이 없습니다. 난이도 범위를 바꿔보세요.';
      }

      var detailsEl = el('details', { class: 'details', onToggle: function () { if (detailsEl.open) renderTable(); } }, [
        el('summary', {}, ['전체 맵 목록 ', tableCount]),
        el('div', { class: 'details__body' }, [
          el('table', { class: 'map-table' }, [
            el('thead', {}, [el('tr', {}, [
              el('th', { text: '제작자' }), el('th', { text: '맵 제목' }), el('th', { text: '난이도' }),
              el('th', { class: 'map-table__check', text: '클리어' })
            ])]),
            tableBody
          ])
        ])
      ]);

      resultEl.appendChild(el('p', { text: '맵 뽑기를 눌러주세요.' }));

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
          emptyMsg,
          el('p', { class: 'invite' }, inviteBtn)
        ]),
        el('div', { class: 'tool__side' }, [resultEl, msgEl]),
        el('div', { class: 'tool__foot' }, [
          detailsEl,
          live
        ])
      ]));

      refresh();
    }
  };
})(window.BL);
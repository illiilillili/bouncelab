window.BL = window.BL || {};

/* 랜덤 색상 추천 — H·S·V 인덱스(0~39)를 뽑아 색과 게임 타일 모양으로 보여준다.
   조건은 체크박스 3개로만 켜고 끈다 (설명 문구는 두지 않는다). */
(function (BL) {
  var el = BL.dom.el;
  var color = BL.color;
  var storage = BL.storage;

  var K = {
    avoidDull: 'colors.avoidDull',
    pastel: 'colors.pastel',
    vivid: 'colors.vivid'
  };

  /* 화면을 열면 처음 보이는 예시 색 (H21 S30 V30 = 밝은 청록) */
  var EXAMPLE = { h: 21, s: 30, v: 30 };

  function channelRow(label) {
    var value = el('span', { class: 'pick__value', text: '-' });
    var num = el('span', { class: 'pick__num', text: '' });
    return {
      row: el('div', { class: 'pick__row' }, [
        el('span', { class: 'pick__label', text: label }),
        value,
        num
      ]),
      value: value,
      num: num
    };
  }

  /* 게임 타일 모양 (기본 / 대각선 / 빈 타일) */
  function tile(variant) {
    return el('div', { class: 'blk blk--' + variant, 'aria-hidden': 'true' }, [
      el('div', { class: 'blk__fill' })
    ]);
  }

  function checkLabel(chk, text) {
    return el('label', { class: 'chk' }, [chk, el('span', { text: text })]);
  }

  BL.views = BL.views || {};

  BL.views.colors = {
    render: function (root) {
      var opt = {
        avoidDull: storage.get(K.avoidDull, false) === true,
        pastel: storage.get(K.pastel, false) === true,
        vivid: storage.get(K.vivid, false) === true
      };
      var cur = EXAMPLE;

      var swatch = el('div', { class: 'swatch', 'aria-hidden': 'true' });
      var tiles = [tile('solid'), tile('corner'), tile('hollow')];
      var rows = { h: channelRow('H'), s: channelRow('S'), v: channelRow('V') };
      var hexEl = el('p', { class: 'swatch__hex', text: '-' });
      var rgbEl = el('p', { class: 'swatch__rgb', text: 'RGB -' });
      var live = el('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
      var chkDull = el('input', { type: 'checkbox', onChange: function () { onToggle('dull'); } });
      var chkPastel = el('input', { type: 'checkbox', onChange: function () { onToggle('pastel'); } });
      var chkVivid = el('input', { type: 'checkbox', onChange: function () { onToggle('vivid'); } });
      var rollBtn = el('button', { class: 'btn btn--main', type: 'button', onClick: pick, text: '색 뽑기' });
      var gradBtn = el('button', {
        class: 'btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'gradPanel',
        onClick: toggleGrad, text: '그라데이션'
      });
      var gradPanel = el('div', { class: 'grad', id: 'gradPanel', hidden: true });
      var gradChips = [];              /* 두 줄(밝기 · 색) 합쳐 22칸 */
      var selKind = 'v';               /* 지금 테두리가 있는 줄 : 'v' 밝기 / 'h' 색 */
      var selStep = 0;                 /* 그 줄에서 고른 칸 (-5 ~ +5) */
      var nearBtn = el('button', {
        class: 'btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'nearPanel',
        onClick: toggleNear, text: '비슷한 색'
      });
      var nearPanel = el('div', { class: 'near', id: 'nearPanel', hidden: true });
      var nearChips = [];              /* 가운데 5칸 (-2 ~ +2) */
      var nearSel = 0;                 /* 지금 테두리가 있는 칸 */

      function apply(idx) {
        var hsv = color.hsvOf(idx.h, idx.s, idx.v);
        var rgb = color.rgbOf(idx.h, idx.s, idx.v);
        var hex = color.hexOf(idx.h, idx.s, idx.v);

        cur = idx;
        swatch.style.background = hex;
        tiles.forEach(function (t) { t.style.setProperty('--blk', hex); });
        rows.h.value.textContent = String(idx.h);
        rows.h.num.textContent = '(' + hsv.h.toFixed(1) + '°)';
        rows.s.value.textContent = String(idx.s);
        rows.s.num.textContent = '(' + hsv.s.toFixed(2) + '%)';
        rows.v.value.textContent = String(idx.v);
        rows.v.num.textContent = '(' + hsv.v.toFixed(2) + '%)';
        hexEl.textContent = hex;
        rgbEl.textContent = 'RGB ' + rgb.join(', ');
        live.textContent = hex + ' / H ' + idx.h + ' S ' + idx.s + ' V ' + idx.v;
      }

      function pick() {
        apply(color.randomIndices(opt));
        resetGrad();             /* 새로 뽑았으면 그라데이션도 그 색 기준으로 다시 (테두리는 0 으로) */
        resetNear();             /* 비슷한 색 패널도 함께 */
      }

      function onToggle(src) {
        opt.avoidDull = chkDull.checked === true;
        opt.pastel = chkPastel.checked === true;
        opt.vivid = chkVivid.checked === true;

        /* 파스텔(S 43.6% 이하)과 쨍한 색(S 71.8% 이상)은 겹치는 색이 없다 : 방금 켠 쪽만 남긴다 */
        if (opt.pastel && opt.vivid) {
          if (src === 'vivid') {
            opt.pastel = false;
            chkPastel.checked = false;
          } else {
            opt.vivid = false;
            chkVivid.checked = false;
          }
        }

        storage.set(K.avoidDull, opt.avoidDull);
        storage.set(K.pastel, opt.pastel);
        storage.set(K.vivid, opt.vivid);
        /* 켠 순간 지금 색이 조건 밖이면 바로 다시 뽑아서 바뀌는 걸 보여준다 */
        if (!color.allows(opt, cur.h, cur.s, cur.v)) pick();
      }

      /* ── 그라데이션 (지금 색에서 이어지는 색 11개) ──────────────
       * 색 계산은 js/lib/color.js 의 shades() 가 맡는다 (색조는 그대로, 밝기·채도만 단계적으로).
       * 칩을 누르면 그 색이 현재 색이 된다 — H·S·V · HEX · RGB 와 타일 색까지 함께 바뀐다.
       * 처음에는 접혀 있고, 버튼을 누르면 펼쳐지고 다시 누르면 접힌다. */
      var stepList = (function () {
        var out = [];
        for (var d = -color.glow; d <= color.glow; d++) out.push(d);
        return out;
      })();

      function labelOf(step) { return step > 0 ? '+' + step : String(step); }

      /* 테두리(지금 고른 칸)를 옮긴다.
         칩을 눌러도 0 칸은 기준 색 그대로라, 언제든 0 을 눌러 원래 색으로 돌아올 수 있다. */
      function markChips() {
        gradChips.forEach(function (c) {
          var now = c.kind === selKind && c.step === selStep;
          c.btn.classList.toggle('is-now', now);
          c.btn.title = (now ? '지금 색 ' : labelOf(c.step) + ' 단계 ') + c.hex;
          c.btn.setAttribute('aria-label', (now ? '지금 색 ' : labelOf(c.step) + ' ') + c.hex);
        });
      }

      /* 기준 색이 바뀌었을 때 (색 뽑기 · 패널 열기) : 두 줄 22칸을 그 색 기준으로 다시 계산하고 테두리는 0 으로 */
      function resetGrad() {
        if (gradPanel.hidden) return;
        var list = { v: color.shades(cur), h: color.hues(cur) };
        gradChips.forEach(function (c) {
          var s = list[c.kind][c.step + color.glow];
          c.idx = s;
          c.hex = color.hexOf(s.h, s.s, s.v);
          c.chip.style.background = c.hex;
        });
        selKind = 'v';
        selStep = 0;
        markChips();
      }

      function toggleGrad() {
        var open = gradPanel.hidden;                 /* 지금 접혀 있으면 편다 */
        gradPanel.hidden = !open;
        gradBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open) return;
        /* 두 패널은 한 번에 하나만 — 비슷한 색이 열려 있으면 닫는다 */
        if (!nearPanel.hidden) { nearPanel.hidden = true; nearBtn.setAttribute('aria-expanded', 'false'); }
        resetGrad();
      }

      function chipOf(kind, step) {
        for (var i = 0; i < gradChips.length; i++) {
          if (gradChips[i].kind === kind && gradChips[i].step === step) return gradChips[i];
        }
        return null;
      }

      function pickShade(kind, step) {
        var c = chipOf(kind, step);
        if (!c || !c.idx) return;
        selKind = kind;                              /* 테두리를 누른 칸으로 옮기고 */
        selStep = step;
        markChips();
        apply(c.idx);                                /* 그 색만 적용 — 그라데이션 기준은 그대로 둔다 */
      }

      /* 칸은 한 번만 만들고 색만 다시 칠한다 (색이 바뀌어도 다시 만들지 않는다)
         위 줄 = 밝기 그라데이션 · 아래 줄 = 색(색조) 그라데이션 */
      function buildRow(kind, label) {
        var row = el('div', { class: 'grad__row', role: 'group', 'aria-label': label });
        stepList.forEach(function (step) {
          var chip = el('span', { class: 'grad__c' });
          var btn = el('button', {
            class: 'grad__i', type: 'button',
            onClick: function () { pickShade(kind, step); }
          }, [
            el('span', { class: 'grad__n', text: labelOf(step) }),
            chip
          ]);
          gradChips.push({ kind: kind, step: step, chip: chip, btn: btn, idx: null, hex: '' });
          row.appendChild(btn);
        });
        gradPanel.appendChild(row);
      }

      buildRow('v', '밝기 그라데이션');
      buildRow('h', '색 그라데이션');

      /* ── 비슷한 색 패널 ─────────────────────────
       * 그라데이션과 같은 방식(접었다 펴기 · 칸을 누르면 그 색이 현재 색 · 0 칸은 기준 색)이되,
       * 양옆으로 2개씩(모두 5개)만 · 숫자 없이 한 줄로만 보여준다.
       * 그라데이션과 같은 11칸 격자를 쓰고 가운데 5칸에만 칸을 두어, 두 패널의 색 자리가 나란히 맞는다. */
      function markNear() {
        nearChips.forEach(function (c) {
          var now = c.step === nearSel;
          c.btn.classList.toggle('is-now', now);
          c.btn.title = (now ? '지금 색 ' : '비슷한 색 ') + c.hex;
          c.btn.setAttribute('aria-label', (now ? '지금 색 ' : '비슷한 색 ') + c.hex);
        });
      }

      function resetNear() {
        if (nearPanel.hidden) return;
        var list = color.similars(cur);
        nearChips.forEach(function (c, i) {
          var s = list[i];
          c.idx = s;
          c.hex = color.hexOf(s.h, s.s, s.v);
          c.chip.style.background = c.hex;
        });
        nearSel = 0;
        markNear();
      }

      function toggleNear() {
        var open = nearPanel.hidden;                 /* 지금 접혀 있으면 편다 */
        nearPanel.hidden = !open;
        nearBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open) return;
        /* 두 패널은 한 번에 하나만 — 그라데이션이 열려 있으면 닫는다 */
        if (!gradPanel.hidden) { gradPanel.hidden = true; gradBtn.setAttribute('aria-expanded', 'false'); }
        resetNear();
      }

      function pickNear(step) {
        var c = null;
        for (var i = 0; i < nearChips.length; i++) if (nearChips[i].step === step) c = nearChips[i];
        if (!c || !c.idx) return;
        nearSel = step;                              /* 테두리를 누른 칸으로 옮기고 */
        markNear();
        apply(c.idx);                                /* 그 색만 적용 — 기준 색은 그대로 */
      }

      function buildNearChip(step) {
        var chip = el('span', { class: 'near__c' });
        var btn = el('button', {
          class: 'near__i', type: 'button',
          onClick: function () { pickNear(step); }
        }, chip);
        nearChips.push({ step: step, chip: chip, btn: btn, idx: null, hex: '' });
        nearPanel.appendChild(btn);
      }

      for (var n = 0; n <= 2 * color.glow; n++) {    /* 그라데이션과 같은 11칸 자리에 놓는다 */
        var nStep = n - color.glow;
        if (nStep < -color.near || nStep > color.near) nearPanel.appendChild(el('span', { 'aria-hidden': 'true' }));
        else buildNearChip(nStep);
      }

      chkDull.checked = opt.avoidDull;
      chkPastel.checked = opt.pastel;
      chkVivid.checked = opt.vivid;

      /* 좁은 화면 : 위에서 아래로 한 줄 / 넓은 화면 : 왼쪽(색) + 오른쪽 옆칸(값과 버튼) */
      root.appendChild(el('div', { class: 'tool' }, [
        el('div', { class: 'tool__main' }, [
          swatch,
          el('div', { class: 'blkrow' }, tiles)
        ]),
        el('div', { class: 'tool__side' }, [
          el('div', { class: 'pick' }, [rows.h.row, rows.s.row, rows.v.row]),
          hexEl,
          rgbEl,
          el('div', { class: 'roll-row' }, [rollBtn]),
          /* 색 뽑기보다 중요도가 낮은 보조 기능 2개 — UI 만 (기능은 아직 없음) */
          el('div', { class: 'btnrow' }, [
            gradBtn,
            nearBtn
          ]),
          gradPanel,
          nearPanel,
          /* 조건 체크박스는 따로 모아 둔다 (버튼과 한 줄에 섞이면 줄이 지저분해진다) */
          el('div', { class: 'opts' }, [
            checkLabel(chkDull, '칙칙한 색 제외'),
            checkLabel(chkPastel, '파스텔 색만'),
            checkLabel(chkVivid, '쨍한 색만')
          ])
        ]),
        el('div', { class: 'tool__foot' }, [live])
      ]));

      apply(EXAMPLE);
      /* 저장된 설정 때문에 예시 색이 조건 밖이면 바로 뽑아 준다 */
      if (!color.allows(opt, EXAMPLE.h, EXAMPLE.s, EXAMPLE.v)) pick();
    }
  };
})(window.BL);
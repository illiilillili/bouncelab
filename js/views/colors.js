window.BL = window.BL || {};

/* 랜덤 색상 추천 — H·S·V 인덱스(0~39)를 뽑아 색과 게임 타일 모양으로 보여준다. */
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

  function comma(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* 켜진 조건 이름 (안내 문구 · 스크린리더 알림에 같이 쓴다) */
  function partsOf(opt) {
    var parts = [];
    if (opt.pastel) parts.push('파스텔 색');
    if (opt.vivid) parts.push('쨍한 색');
    if (opt.avoidDull) parts.push('칙칙하지 않은 색');
    return parts;
  }

    function pct(index) {
    return (index * 100 / 39).toFixed(1) + '%';
  }

  /* 켜진 조건의 실제 기준 (숫자는 color.js 규칙에서 그대로 가져와서 어긋나지 않게 한다) */
  function condText(opt) {
    var d = color.dullRule, pa = color.pastelRule, vi = color.vividRule;
    var c = [];
    if (opt.vivid) c.push('채도 ' + pct(vi.sMin) + ' 이상 + 밝기 ' + pct(vi.vMin) + ' 이상');
    if (opt.pastel) c.push('채도 ' + pct(pa.sMin) + '~' + pct(pa.sMax) + ' + 밝기 ' + pct(pa.vMin) + ' 이상');
    if (opt.avoidDull) c.push('채도 ' + pct(d.sMin) + ' 이상 + 밝기 ' + pct(d.vMin) + ' 이상 (뿌연 색 제외)');
    return c.length ? ' (기준: ' + c.join(' / ') + ')' : '';
  }
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

  BL.views = BL.views || {};

  BL.views.colors = {
    render: function (root) {
      var opt = {
        avoidDull: storage.get(K.avoidDull, false) === true,
        pastel: storage.get(K.pastel, false) === true,
        vivid: storage.get(K.vivid, false) === true
      };
      var cur = EXAMPLE;
      var swapped = false;   /* 방금 파스텔 ↔ 쨍한 겹침을 정리했는지 */

      var swatch = el('div', { class: 'swatch', 'aria-hidden': 'true' });
      var tiles = [tile('solid'), tile('corner'), tile('hollow')];
      var rows = { h: channelRow('H'), s: channelRow('S'), v: channelRow('V') };
      var hexEl = el('p', { class: 'swatch__hex', text: '-' });
      var rgbEl = el('p', { class: 'swatch__rgb', text: 'RGB -' });
      var note = el('p', { class: 'hint', id: 'color-note' });
      var live = el('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
      var chkDull = el('input', { type: 'checkbox', 'aria-describedby': 'color-note', onChange: function () { onToggle('dull'); } });
      var chkPastel = el('input', { type: 'checkbox', 'aria-describedby': 'color-note', onChange: function () { onToggle('pastel'); } });
      var chkVivid = el('input', { type: 'checkbox', 'aria-describedby': 'color-note', onChange: function () { onToggle('vivid'); } });
      var rollBtn = el('button', { class: 'btn btn--main', type: 'button', onClick: pick, text: '색 뽑기' });

      function apply(idx) {
        var hsv = color.hsvOf(idx.h, idx.s, idx.v);
        var rgb = color.rgbOf(idx.h, idx.s, idx.v);
        var hex = color.hexOf(idx.h, idx.s, idx.v);
        var parts = partsOf(opt);

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
        live.textContent = hex + ' / H ' + idx.h + ' S ' + idx.s + ' V ' + idx.v +
          (parts.length ? ' (' + parts.join(' + ') + ')' : '');
      }

      function pick() {
        apply(color.randomIndices(opt));
      }

      function syncNote() {
        var all = comma(color.comboCount());
        var n = color.comboCount(opt);
        var parts = partsOf(opt);
        var line;

        if (!parts.length) {
          line = 'H·S·V 40단계 전체 ' + all + '가지에서 뽑습니다.';
        } else if (parts.length === 1 && opt.avoidDull) {
          line = '칙칙한 색(회색빛 · 어두운 색 · 뿌연 색)을 뺀 ' + comma(n) + ' / ' + all + '가지에서만 뽑습니다.';
        } else {
          line = parts.join(' · ') + '만 ' + comma(n) + ' / ' + all + '가지에서 뽑습니다.' +
            (n < 2000 ? ' 조건이 겹쳐서 아주 좁습니다.' : '');
        }
        line += condText(opt);
        if (swapped) {
          line += ' 파스텔 색과 쨍한 색은 반대 방향이라 함께 켤 수 없어서, 방금 켠 쪽만 켜 뒀습니다.';
        }
        note.textContent = line;
      }

      function onToggle(src) {
        opt.avoidDull = chkDull.checked === true;
        opt.pastel = chkPastel.checked === true;
        opt.vivid = chkVivid.checked === true;

        /* 파스텔(S 43.6% 이하)과 쨍한 색(S 66.7% 이상)은 겹치는 색이 없다 : 방금 켠 쪽만 남긴다 */
        swapped = false;
        if (opt.pastel && opt.vivid) {
          swapped = true;
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
        syncNote();
        /* 켠 순간 지금 색이 조건 밖이면 바로 다시 뽑아서 바뀌는 걸 보여준다 */
        if (!color.allows(opt, cur.h, cur.s, cur.v)) pick();
      }

      chkDull.checked = opt.avoidDull;
      chkPastel.checked = opt.pastel;
      chkVivid.checked = opt.vivid;

      root.appendChild(swatch);
      root.appendChild(el('div', { class: 'blkrow' }, tiles));
      root.appendChild(el('div', { class: 'pick' }, [rows.h.row, rows.s.row, rows.v.row]));
      root.appendChild(hexEl);
      root.appendChild(rgbEl);
      root.appendChild(el('div', { class: 'roll-row' }, [
        rollBtn,
        el('label', { class: 'chk' }, [chkDull, el('span', { text: '칙칙한 색 제외' })]),
        el('label', { class: 'chk' }, [chkPastel, el('span', { text: '파스텔 색만' })]),
        el('label', { class: 'chk' }, [chkVivid, el('span', { text: '쨍한 색만' })])
      ]));
      root.appendChild(note);
      root.appendChild(live);

      syncNote();
      apply(EXAMPLE);
      /* 저장된 설정 때문에 예시 색이 조건 밖이면 바로 뽑아 준다 */
      if (!color.allows(opt, EXAMPLE.h, EXAMPLE.s, EXAMPLE.v)) pick();
    }
  };
})(window.BL);
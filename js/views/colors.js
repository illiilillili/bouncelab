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
          el('div', { class: 'roll-row' }, [
            rollBtn,
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
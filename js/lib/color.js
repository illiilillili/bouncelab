window.BL = window.BL || {};

/* 바운스볼 맵 에디터 HSV 색. H·S·V 모두 0~39 인덱스(40단계).
   H(도) = index * 9.0          (0 ~ 351도, 9도 간격)
   S(%) = V(%) = index * 100/39  (0 ~ 100%, 약 2.5641% 간격) */
(function (BL) {
  var INDEX_MAX = 39;
  var SV_DIV = 39;

  /* 칙칙한 색 (인덱스 기준)
     - s < 14  : 채도가 낮아 회색빛 (S 35.9% 미만)
     - v < 22  : 어둡거나 중간 이하 (V 56.4% 미만) → 좀 어두운 색도 칙칙한 색으로 본다
     - v >= 36 이면서 s < 18 : 밝은데 색기 없이 뿌연 색 (V 92.3% 이상 / S 46.2% 미만) */
  var DULL = { sMin: 14, vMin: 22, vWash: 36, sWash: 18 };

  /* 파스텔 색 (인덱스 기준)
     - s 4 ~ 17 (S 10.3% ~ 43.6%) : 색기는 있지만 쨍하지 않게
     - v >= 34 (V 87.2% 이상)     : 밝게 */
  var PASTEL = { sMin: 4, sMax: 17, vMin: 34 };

  /* 쨍한 색 = 채도가 높고 선명한 색 (인덱스 기준)
     - s >= 28 (S 71.8% 이상) : 채도 높게
     - v >= 32 (V 82.1% 이상) : 밝고 선명하게
     → 가장 탁한 조합이 S 71.8% · V 82.1% = #D13B3B 정도라서 어두운 벽돌색이 안 나온다.
       파스텔(s<=17)과는 겹치는 색이 없고, 칙칙한 색 규칙에는 전부 걸리지 않는다. */
  var VIVID = { sMin: 28, vMin: 32 };

  function hsvOf(iH, iS, iV) {
    return { h: iH * 9.0, s: iS * 100 / SV_DIV, v: iV * 100 / SV_DIV };
  }

  function rgbOf(iH, iS, iV) {
    var o = hsvOf(iH, iS, iV);
    var S = o.s / 100;
    var V = o.v / 100;
    var hp = (((o.h % 360) + 360) % 360) / 60;
    var i = Math.floor(hp);
    var fr = hp - i;
    var p = V * (1 - S);
    var q = V * (1 - S * fr);
    var t = V * (1 - S * (1 - fr));
    var tbl = [[V, t, p], [q, V, p], [p, V, t], [p, q, V], [t, p, V], [V, p, q]];
    return tbl[i].map(function (k) { return Math.round(k * 255); });
  }

  function hexOf(iH, iS, iV) {
    return '#' + rgbOf(iH, iS, iV).map(function (n) {
      return ('0' + n.toString(16).toUpperCase()).slice(-2);
    }).join('');
  }

  /* 칙칙한 색 · 파스텔 색 · 쨍한 색인가? (색상 H 는 셋 다 상관없다) */
  function isDull(iH, iS, iV) {
    return iS < DULL.sMin || iV < DULL.vMin || (iV >= DULL.vWash && iS < DULL.sWash);
  }

  function isPastel(iH, iS, iV) {
    return iS >= PASTEL.sMin && iS <= PASTEL.sMax && iV >= PASTEL.vMin;
  }

  function isVivid(iH, iS, iV) {
    return iS >= VIVID.sMin && iV >= VIVID.vMin;
  }

  /* opt : { avoidDull: true } / { pastel: true } / { vivid: true } 조합 / 없음(= 전부 허용) */
  function allows(opt, iH, iS, iV) {
    if (opt && opt.avoidDull && isDull(iH, iS, iV)) return false;
    if (opt && opt.pastel && !isPastel(iH, iS, iV)) return false;
    if (opt && opt.vivid && !isVivid(iH, iS, iV)) return false;
    return true;
  }

  function keyOf(opt) {
    var k = (opt && opt.avoidDull ? 'd' : '') + (opt && opt.pastel ? 'p' : '') + (opt && opt.vivid ? 'v' : '');
    return k || 'all';
  }

  /* 조건에 맞는 (S,V) 조합 목록. H 는 판정에 안 쓰이므로 한 번만 만들어 캐시한다. */
  var pairCache = {};
  function pairsOf(opt) {
    var key = keyOf(opt);
    if (!pairCache[key]) {
      var list = [];
      for (var s = 0; s <= INDEX_MAX; s++) {
        for (var v = 0; v <= INDEX_MAX; v++) {
          if (allows(opt, 0, s, v)) list.push([s, v]);
        }
      }
      /* 파스텔 + 쨍한 처럼 서로 반대라 남는 색이 없는 조합은 전체로 되돌린다 (화면에서는 함께 못 켜게 막아 둠) */
      pairCache[key] = list.length ? list : pairsOf(null);
    }
    return pairCache[key];
  }

  /* H·S·V 40단계 전체 = 64,000가지. 조건을 켜면 그중 맞는 조합만 센다. */
  function comboCount(opt) {
    return pairsOf(opt).length * (INDEX_MAX + 1);
  }

  function randomIndex() {
    return BL.rng.randomInt(INDEX_MAX + 1);
  }

  /* 조건에 맞는 (S,V) 중 하나와 색상(H) 하나를 뽑는다.
     다시 뽑기를 반복하지 않아서 조건이 아무리 좁아도 결과가 고르게 나오고 빠르다. */
  function randomIndices(opt) {
    var pair = BL.rng.pick(pairsOf(opt)) || [INDEX_MAX, INDEX_MAX];
    return { h: randomIndex(), s: pair[0], v: pair[1] };
  }

  function clampIndex(n) {
    return n < 0 ? 0 : (n > INDEX_MAX ? INDEX_MAX : n);
  }

  /* ── 그라데이션 (같은 색 계열 이어가기) ──────────────────────
   * 현재 색에서 밝기(V)와 채도(S)만 단계적으로 움직여 색 11개를 만든다.
   * RGB 를 각각 더하는 방식이 아니고, 색조(H)는 그대로 두어 같은 색 계열로 보이게 한다.
   *   밝은 쪽(+1~+5) : V 를 남은 만큼 올리고 S 는 조금씩 낮춘다 (파스텔 쪽으로)
   *   어두운 쪽(-1~-5): V 를 절반까지만 내리고 S 는 조금씩 올린다 (진한 쪽으로 · 너무 어두워지지 않게)
   * V 가 한계(0 · 39)에 닿으면 S 변화가 단계 차이를 이어 간다.
   * 돌려주는 배열은 -5 ~ +5 순서이고, 가운데([GLOW])가 지금 색과 정확히 같다. */
  var GLOW = 5;             /* 한쪽으로 몇 단계 (-5 ~ +5 = 11개) */
  var DARK_KEEP = 0.5;      /* 어두운 쪽에서 남겨 두는 밝기 비율 (0.25 = 아주 어둡게 · 0.5 = 절반까지) */
  var SAT_MOVE = 0.35;      /* 채도가 움직이는 최대 비율 */

  function shadeOf(idx, step) {
    if (!step) return { h: idx.h, s: idx.s, v: idx.v };    /* 0 = 지금 색 그대로 */
    var t = step / GLOW;                                   /* -1 ~ +1 */
    var s, v;
    if (step > 0) {
      v = idx.v + t * (INDEX_MAX - idx.v);
      s = idx.s * (1 - t * SAT_MOVE);
    } else {
      v = idx.v * (1 + t * (1 - DARK_KEEP));
      s = idx.s + (-t) * (INDEX_MAX - idx.s) * SAT_MOVE;
    }
    return { h: idx.h, s: clampIndex(Math.round(s)), v: clampIndex(Math.round(v)) };
  }

  function shades(idx) {
    var list = [];
    for (var step = -GLOW; step <= GLOW; step++) list.push(shadeOf(idx, step));
    return list;
  }

  /* ── 색(색조) 그라데이션 ────────────────────────────────────
   * 밝기·채도는 그대로 두고 색조(H)만 옮긴 색 11개 (가운데가 지금 색).
   * 한 칸에 2단계(18도)씩 → 양 끝은 ±10단계(±90도). 색상은 40단계라 넘어가면 되돌아온다(0~39 로 감쌈). */
  var HUE_STEP = 2;
  var HUE_MAX = INDEX_MAX + 1;

  function wrapHue(h) { return ((h % HUE_MAX) + HUE_MAX) % HUE_MAX; }

  function hueShadeOf(idx, step) {
    if (!step) return { h: idx.h, s: idx.s, v: idx.v };
    return { h: wrapHue(idx.h + step * HUE_STEP), s: idx.s, v: idx.v };
  }

  function hues(idx) {
    var list = [];
    for (var step = -GLOW; step <= GLOW; step++) list.push(hueShadeOf(idx, step));
    return list;
  }

  /* ── 비슷한 색 (유사 색상 + 톤온톤) ────────────────────────
   * 기준은 **지금 색**, 거기서 4개를 만든다 (색 뽑기로 색이 바뀌면 4개도 따라 바뀐다).
   *   1) 기준 색 그대로
   *   2) 색상 +9도   ((H + 9) % 360)   — 이 사이트 색 단계(9도)만큼만 옮겨 가장 가깝게
   *   3) 색상 -9도   ((H - 9 + 360) % 360)
   *   4) 톤온톤      (채도 -10%p · 명도 +5%p — 살짝 차분하게)
   * 값은 0~100(색상은 0~360) 밖으로 나가지 않게 자르고(clamp),
   * 돌려주는 것은 HEX · RGB 로 바꾸기 쉬운 HSV 객체 배열이다. */
  var NEAR_HUE = 9;          /* 좌우로 돌리는 각도(도) — 1단계 = 가장 가까운 다른 색상 */
  var TONE_S = -10;          /* 톤온톤 : 채도 %p */
  var TONE_V = 5;            /* 톤온톤 : 명도 %p */

  function clampRange(n, lo, hi) {
    var x = Number(n);
    if (isNaN(x)) return lo;
    return x < lo ? lo : (x > hi ? hi : x);
  }

  function ring360(h) { return ((Number(h) % 360) + 360) % 360; }

  /* 기준 색에서 비슷한 색 4개 (HSV 객체 배열 · h 0~360 · s·v 0~100) */
  function similarsOf(base) {
    var b = base || {};
    var h = ring360(b.h || 0);
    var s = clampRange(b.s, 0, 100);
    var v = clampRange(b.v, 0, 100);
    return [
      { h: h, s: s, v: v },
      { h: ring360(h + NEAR_HUE), s: s, v: v },
      { h: ring360(h - NEAR_HUE), s: s, v: v },
      { h: h, s: clampRange(s + TONE_S, 0, 100), v: clampRange(v + TONE_V, 0, 100) }
    ];
  }

  /* 도·% 로 된 색을 이 사이트의 인덱스(0~39)로 바꾼다 — 화면은 인덱스로 다닌다 */
  function indicesOfHsv(c) {
    var x = c || {};
    return {
      h: clampIndex(Math.round(ring360(x.h || 0) / 9.0)),
      s: clampIndex(Math.round(clampRange(x.s, 0, 100) * INDEX_MAX / 100)),
      v: clampIndex(Math.round(clampRange(x.v, 0, 100) * INDEX_MAX / 100))
    };
  }

  BL.color = {
    INDEX_MAX: INDEX_MAX,
    hsvOf: hsvOf,
    rgbOf: rgbOf,
    hexOf: hexOf,
    randomIndex: randomIndex,
    randomIndices: randomIndices,
    shades: shades,
    glow: GLOW,
    hues: hues,
    hueStep: HUE_STEP,
    similarsOf: similarsOf,
    indicesOfHsv: indicesOfHsv,
    isDull: isDull,
    isPastel: isPastel,
    isVivid: isVivid,
    allows: allows,
    comboCount: comboCount,
    dullRule: DULL,
    pastelRule: PASTEL,
    vividRule: VIVID
  };
})(window.BL);
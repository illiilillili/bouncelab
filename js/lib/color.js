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

  BL.color = {
    INDEX_MAX: INDEX_MAX,
    hsvOf: hsvOf,
    rgbOf: rgbOf,
    hexOf: hexOf,
    randomIndex: randomIndex,
    randomIndices: randomIndices,
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
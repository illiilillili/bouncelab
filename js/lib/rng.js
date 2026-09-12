window.BL = window.BL || {};

/* 뽑기용 난수 도구. 순수 함수라 Node에서도 그대로 돌려볼 수 있다. */
(function (BL) {
  function randomInt(max) { return Math.floor(Math.random() * max); }

  function pick(list) {
    return list && list.length ? list[randomInt(list.length)] : null;
  }

  function shuffle(list) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = randomInt(i + 1);
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }

  BL.rng = { randomInt: randomInt, pick: pick, shuffle: shuffle };
})(window.BL);
/* 리듬 게임 노트 생성기. 끝이 없고, 노트마다 열(0~3)을 랜덤으로 뽑는다.
 * 직전 노트와 같은 열은 뽑지 않는다 (같은 칸이 연속으로 두 번 나오지 않게).
 * 0 = D, 1 = F, 2 = J, 3 = K */
(function () {
  var BL = window.BL = window.BL || {};
  var prev1 = -1;   // 직전 노트의 열. 없으면 -1
  var prev2 = -1;   // 그 전 노트의 열. 없으면 -1

  /* 뽑으면 안 되는 열: 직전과 같은 열, 그리고 직전·그 전이 인접한 두 열(a, b)일 때의 a.
   * 금지가 최대 2개라서 후보는 항상 2개 이상 남는다. */
  function forbidden() {
    var list = [];
    if (prev1 >= 0) list.push(prev1);
    if (prev1 >= 0 && prev2 >= 0 && Math.abs(prev1 - prev2) === 1) list.push(prev2);
    return list;
  }

  BL.rhythmChart = {
    next: function () {
      var ban = forbidden();
      var pool = [0, 1, 2, 3].filter(function (c) { return ban.indexOf(c) < 0; });
      var c = pool[Math.floor(Math.random() * pool.length)];
      prev2 = prev1;
      prev1 = c;
      return c;
    }
  };
})();

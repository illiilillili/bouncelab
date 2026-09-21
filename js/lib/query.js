window.BL = window.BL || {};

/* 맵 목록을 거르는 순수 함수들. 화면 코드와 떼어 둬서 Node에서도 검증할 수 있다. */
(function (BL) {
  /* 정렬용 난이도 값. 13- 는 13 바로 아래, 12+ 바로 위가 되도록 겹치지 않게 만든다.
     값: n+ = 2n+0.5 , n = 2n , n- = 2n-0.5 , R = 1000 */
  function diffRank(diff) {
    var s = String(diff).trim();
    if (s.toUpperCase() === 'R') return 1000;
    var m = /^(\d+)([+-])?$/.exec(s);
    if (!m) return 500;
    var n = Number(m[1]);
    if (m[2] === '+') return n * 2 + 0.5;
    if (m[2] === '-') return n * 2 - 0.5;
    return n * 2;
  }

  function diffOptions(maps) {
    var seen = {}, list = [];
    maps.forEach(function (m) {
      var d = String(m.diff);
      if (!seen[d]) { seen[d] = 1; list.push(d); }
    });
    return list.sort(function (a, b) { return diffRank(a) - diffRank(b); });
  }

  /* 맵에 달린 해시태그. 아직 없으면 빈 배열.
     룰렛 화면의 거르는 칸은 뺐지만, 데이터에 태그가 쌓이면 tagOptions 로 목록을 뽑아 다시 붙이면 된다. */
  function tagsOf(m) {
    return m.tags instanceof Array ? m.tags : [];
  }

  function tagOptions(maps) {
    var seen = {}, list = [];
    maps.forEach(function (m) {
      tagsOf(m).forEach(function (t) {
        if (!seen[t]) { seen[t] = 1; list.push(t); }
      });
    });
    return list.sort(function (a, b) { return a.localeCompare(b, 'ko'); });
  }

  /* min / max 는 난이도 문자열(빈 값이면 제한 없음),
     tags 는 고른 해시태그 — 고른 걸 모두 가진 맵만 남긴다.
     3~1 처럼 뒤집어 골라도 1~3 으로 보고 거른다. */
  function filter(maps, opts) {
    var o = opts || {};
    var a = o.min ? diffRank(o.min) : -Infinity;
    var b = o.max ? diffRank(o.max) : Infinity;
    var lo = Math.min(a, b), hi = Math.max(a, b);
    var tags = o.tags instanceof Array ? o.tags : [];
    return maps.filter(function (m) {
      var r = diffRank(m.diff);
      if (r < lo || r > hi) return false;
      if (tags.length) {
        var mine = tagsOf(m);
        for (var i = 0; i < tags.length; i++) {
          if (mine.indexOf(tags[i]) < 0) return false;
        }
      }
      return true;
    });
  }


  BL.query = { diffRank: diffRank, diffOptions: diffOptions, tagsOf: tagsOf, tagOptions: tagOptions, filter: filter };
})(window.BL);
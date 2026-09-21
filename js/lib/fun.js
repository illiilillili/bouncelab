window.BL = window.BL || {};

/* 컨트롤 재미도 — 8칸 중 하나를 고르면 그 컨트롤의 재미도가 된다.
 *   peek(name, cb)   지금 아는 것만 (서버가 아직 안 받아졌으면 이 브라우저 값만 · 서버를 새로 받지 않는다)
 *   get(name, cb)    서버가 필요하면 받아서 알려준다 (사람들이 고른 칸 수까지)
 *   set(name, score, cb)  내 재미도 저장 (한 사람 한 표 · 다시 누르면 바뀐다)
 *
 * 저장은 익명 리뷰와 같은 Supabase 저장소의 control_fun 표 (표 만드는 SQL 은 README 참고).
 * 표가 없거나 인터넷이 막혀도 이 브라우저(localStorage)에는 남고, 그때는 shared:false 로 알려준다.
 * 익명 신분은 리뷰와 같은 것을 쓴다 (BL.reviews.ensureUser). */
(function (BL) {
  var cfg = (BL.site && BL.site.reviews) || {};
  var TABLE = cfg.funTable || 'control_fun';
  var MIN = 1, MAX = 8;
  var K = 'fun.';                      /* bl:fun.<컨트롤 이름> = 내 점수 */

  function ready() { return !!(BL.sb && BL.sb.ready && BL.sb.client); }
  function key(name) { return String(name == null ? '' : name).trim(); }

  function zeros() {
    var list = [];
    for (var i = 0; i < MAX; i++) list.push(0);
    return list;
  }

  /* 이 브라우저가 고른 값 (없으면 0) */
  function mineLocal(name) {
    var v = Number(BL.storage.get(K + key(name), 0));
    return isFinite(v) && v >= MIN && v <= MAX ? v : 0;
  }

  function fail(e) {
    var msg = (e && (e.message || e.details || e.hint)) || '';
    if (/control_fun|does not exist|schema cache|relation/i.test(msg)) return '재미도 저장소(control_fun 표)가 아직 없습니다.';
    if (!msg) return '알 수 없는 오류입니다.';
    if (/fetch|network|load failed|timeout|timed out/i.test(msg)) return '리뷰 서버에 연결하지 못했습니다.';
    return (BL.reviews && BL.reviews.fail) ? BL.reviews.fail(e) : msg;
  }

  /* name 의 재미도 읽기. wait=true 면 서버(SDK)를 받아서라도 읽는다 */
  function read(name, cb, wait) {
    var mine = mineLocal(name);

    function local(error) {
      cb({ ok: false, mine: mine, counts: zeros(), total: 0, shared: false, error: error || '' });
    }

    if (!BL.sb || typeof BL.sb.ensure !== 'function') { local(''); return; }
    if (!ready()) {
      if (!wait) { local(''); return; }
      BL.sb.ensure(function () { read(name, cb, false); });
      return;
    }
    BL.reviews.ensureUser(function (uid, uerr) {
      if (!uid) { local(uerr || ''); return; }
      var q = BL.sb.client.from(TABLE).select('score,user_id').eq('control_key', key(name));
      Promise.resolve(q).then(function (res) {
        if (res && res.error) { local(fail(res.error)); return; }
        var counts = zeros(), total = 0, found = 0;
        ((res && res.data) || []).forEach(function (r) {
          var s = Number(r.score);
          if (s >= MIN && s <= MAX) { counts[s - MIN]++; total++; }
          if (r.user_id === uid) found = s;
        });
        if (found) { mine = found; BL.storage.set(K + key(name), found); }
        cb({ ok: true, mine: mine, counts: counts, total: total, shared: true, error: '' });
      }, function (e) { local(fail(e)); });
    });
  }

  function set(name, score, cb) {
    var s = Number(score);
    if (!(s >= MIN && s <= MAX)) {
      cb({ ok: false, mine: 0, shared: false, error: '재미도는 ' + MIN + '~' + MAX + ' 중 하나입니다.' });
      return;
    }
    BL.storage.set(K + key(name), s);            /* 먼저 이 브라우저에 (즉시 반영 · 서버가 없어도 남는다) */

    function local(error) { cb({ ok: false, mine: s, shared: false, error: error || '' }); }

    if (!BL.sb || typeof BL.sb.ensure !== 'function') { local(''); return; }
    BL.sb.ensure(function () {
      if (!ready()) { local(''); return; }
      BL.reviews.ensureUser(function (uid, uerr) {
        if (!uid) { local(uerr || ''); return; }
        var q = BL.sb.client.from(TABLE).upsert({
          control_key: key(name),
          score: s,
          user_id: uid,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,control_key' });
        Promise.resolve(q).then(function (res) {
          if (res && res.error) { local(fail(res.error)); return; }
          cb({ ok: true, mine: s, shared: true, error: '' });
        }, function (e) { local(fail(e)); });
      });
    });
  }

  BL.fun = {
    min: MIN,
    max: MAX,
    table: TABLE,
    ready: ready,
    mineLocal: mineLocal,
    peek: function (name, cb) { read(name, cb, false); },
    get: function (name, cb) { read(name, cb, true); },
    set: set,
    fail: fail
  };
})(window.BL);

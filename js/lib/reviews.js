window.BL = window.BL || {};

/* 리뷰 — Supabase 의 reviews 표를 읽고 쓴다 (연결은 js/lib/supabase.js 가 맡는다).
 *
 *   list(id, cb)     한 오브젝트의 리뷰 (최신순)       cb({ ok, rows, error, cached })
 *   listAll(cb)      모든 오브젝트의 리뷰 (고르는 화면)  cb({ ok, byId, error, cached })
 *   add(input, cb)   리뷰 저장                      cb({ ok, row, error, errors })
 *   validate(raw)    빈 값 · 글자 수 검증 (DB 의 check 제약과 같은 규칙)
 *   stats(rows)      개수 · 평균 · 별점 분포
 *
 * 서버가 안 되면 마지막으로 받아 둔 목록(localStorage 캐시)을 그대로 보여준다. */
(function (BL) {
  var storage = BL.storage;
  var cfg = (BL.site && BL.site.reviews) || {};
  var TABLE = cfg.table || 'reviews';
  var MAX_STARS = cfg.maxStars || 5;
  var MAX_NICK = cfg.maxNick || 12;
  var MAX_BODY = cfg.maxBody || 50;
  var COLUMNS = 'id,object_id,stars,nickname,body,created_at,user_id';
  var LIMIT = 300;                     /* 한 번에 받아 오는 최대 줄 수 */

  var K = {
    nick: 'reviews.nick',              /* 마지막으로 쓴 닉네임 */
    mine: 'reviews.mine',              /* 이 브라우저가 남긴 리뷰 id */
    cache: 'reviews.cache.'            /* 오브젝트별 마지막 목록 */
  };

  function ready() { return !!(BL.sb && BL.sb.ready && BL.sb.client); }

  /* 사람이 읽을 수 있는 오류 문구로 바꾼다 */
  function fail(e) {
    var msg = (e && (e.message || e.details || e.hint)) || '';
    if (!msg) return '알 수 없는 오류입니다.';
    if (/fetch|network|load failed|timeout|timed out/i.test(msg)) return '리뷰 서버에 연결하지 못했습니다.';
    return msg;
  }

  /* SDK 는 결과를 res.error 로 주지만 연결이 끊기면 던질 수도 있어서 둘 다 받는다 */
  function run(builder, ok) {
    Promise.resolve(builder).then(ok, function (e) { ok({ error: { message: (e && e.message) || '' } }); });
  }

  /* ── 익명 신분 ─────────────────────────────
   * 브라우저마다 서버가 인정하는 고유 신분을 하나 만든다 (사용자는 아무것도 입력하지 않는다).
   * 이 신분이 있어야 서버(RLS)가 내 리뷰만 지우게 해준다. */
  var meId = '';
  var pending = null;      /* 신분을 만드는 중이면 그 결과를 기다리는 콜백 목록 */

  function auth() { return (BL.sb && BL.sb.client && BL.sb.client.auth) || null; }

  var NO_USER = '지금은 리뷰를 남길 수 없습니다. 잠시 뒤 다시 시도해 주세요.';

  /* 화면에는 쉬운 말만, 원인은 개발자 콘솔에 남긴다 (예: 익명 로그인이 꺼져 있음) */
  function warnSignIn(e) {
    if (window.console && console.warn) {
      console.warn('[reviews] 익명 신분을 만들지 못했습니다:', (e && (e.message || e.name)) || e);
    }
  }

  function ensureUser(cb) {
    if (!ready() || !auth()) { cb('', '리뷰 서버에 연결하지 못했습니다.'); return; }
    if (meId) { cb(meId, ''); return; }
    if (pending) { pending.push(cb); return; }
    pending = [cb];
    var wait = pending;

    function finish(id, err) {
      pending = null;
      wait.forEach(function (fn) { fn(id, err); });
    }

    auth().getSession().then(function (res) {
      var s = res && res.data && res.data.session;
      if (s && s.user && s.user.id) { meId = s.user.id; finish(meId, ''); return; }
      auth().signInAnonymously().then(function (r) {
        if (r && r.error) { warnSignIn(r.error); finish('', NO_USER); return; }
        var u = r && r.data && r.data.user;
        meId = (u && u.id) || '';
        if (!meId) warnSignIn('user 없음');
        finish(meId, meId ? '' : NO_USER);
      }, function (e) { warnSignIn(e); finish('', NO_USER); });
    }, function (e) { warnSignIn(e); finish('', NO_USER); });
  }

  /* 표의 한 줄 → 화면이 쓰는 모양 */
  function read(r) {
    var x = r || {};
    return {
      id: String(x.id == null ? '' : x.id),
      objectId: String(x.object_id == null ? '' : x.object_id),
      stars: Number(x.stars) || 0,
      nickname: String(x.nickname == null ? '' : x.nickname),
      body: String(x.body == null ? '' : x.body),
      at: String(x.created_at == null ? '' : x.created_at),
      userId: String(x.user_id == null ? '' : x.user_id)
    };
  }

  function cached(objectId) {
    var rows = storage.get(K.cache + objectId, []);
    return rows instanceof Array ? rows : [];
  }

  function nameOf(id) {
    var o = BL.objects.find(id);
    return o ? o.name : id;
  }

  /* ── 읽기 ─────────────────────────────── */
  function list(objectId, cb) {
    var keep = cached(objectId);
    if (!ready()) {
      cb({ ok: false, rows: keep, error: '리뷰 서버에 연결하지 못했습니다.', cached: keep.length > 0 });
      return;
    }
    run(BL.sb.client.from(TABLE).select(COLUMNS)
      .eq('object_id', objectId)
      .order('created_at', { ascending: false })
      .limit(LIMIT), function (res) {
      if (res.error) {
        cb({ ok: false, rows: keep, error: fail(res.error), cached: keep.length > 0 });
        return;
      }
      var rows = (res.data || []).map(read);
      storage.set(K.cache + objectId, rows);
      cb({ ok: true, rows: rows, error: '', cached: false });
    });
  }

  function listAll(cb) {
    var ids = BL.objects.list.map(function (o) { return o.id; });
    var keep = {}, any = false;
    ids.forEach(function (id) {
      keep[id] = cached(id);
      if (keep[id].length) any = true;
    });
    if (!ready()) {
      cb({ ok: false, byId: keep, error: '리뷰 서버에 연결하지 못했습니다.', cached: any });
      return;
    }
    run(BL.sb.client.from(TABLE).select(COLUMNS)
      .in('object_id', ids)
      .order('created_at', { ascending: false })
      .limit(LIMIT), function (res) {
      if (res.error) {
        cb({ ok: false, byId: keep, error: fail(res.error), cached: any });
        return;
      }
      var byId = {};
      ids.forEach(function (id) { byId[id] = []; });
      (res.data || []).forEach(function (r) {
        var row = read(r);
        if (byId[row.objectId]) byId[row.objectId].push(row);
      });
      ids.forEach(function (id) { storage.set(K.cache + id, byId[id]); });
      cb({ ok: true, byId: byId, error: '' });
    });
  }

  /* ── 검증 : DB 의 check 제약과 같은 규칙 (화면에서 먼저 막는다) ── */
  function validate(raw) {
    var input = raw || {};
    var stars = Math.round(Number(input.stars) || 0);
    var nickname = String(input.nickname == null ? '' : input.nickname).trim();
    var body = String(input.body == null ? '' : input.body).trim();
    var objectId = String(input.objectId == null ? '' : input.objectId);
    var errors = {};

    if (!(stars >= 1 && stars <= MAX_STARS)) errors.stars = '별점을 1~' + MAX_STARS + '점에서 골라주세요.';
    if (!nickname) errors.nickname = '닉네임을 적어주세요.';
    else if (nickname.length > MAX_NICK) errors.nickname = '닉네임은 ' + MAX_NICK + '자까지 쓸 수 있습니다.';
    if (!body) errors.body = '리뷰 내용을 적어주세요.';
    else if (body.length > MAX_BODY) errors.body = '리뷰는 ' + MAX_BODY + '자까지 쓸 수 있습니다.';
    if (!objectId) errors.object = '오브젝트를 찾지 못했습니다.';

    /* 저장 전 검열 — 부적절한 표현 · 연락처 · 광고 (js/lib/review-filter.js) */
    var filter = BL.reviewFilter;
    if (filter) {
      if (!errors.nickname) {
        var fn = filter.validateReviewContent(nickname);
        if (!fn.ok) errors.nickname = fn.message;
      }
      if (!errors.body) {
        var fb = filter.validateReviewContent(body);
        if (!fb.ok) errors.body = fb.message;
      }
    }

    var ok = true;
    for (var k in errors) { if (errors.hasOwnProperty(k)) { ok = false; break; } }

    return {
      ok: ok,
      errors: errors,
      value: { objectId: objectId, stars: stars, nickname: nickname, body: body }
    };
  }

  /* ── 쓰기 ─────────────────────────────── */
  function add(input, cb) {
    var v = validate(input);
    if (!v.ok) { cb({ ok: false, error: '입력한 내용을 다시 확인해 주세요.', errors: v.errors }); return; }
    if (!ready()) { cb({ ok: false, error: '리뷰 서버에 연결하지 못했습니다.' }); return; }

    ensureUser(function (uid, uerr) {
      if (!uid) { cb({ ok: false, error: uerr || '리뷰 신분을 만들지 못했습니다.' }); return; }
      insertReview(v.value, uid, cb);
    });
  }

  /* 리뷰 한 줄 저장 — 내 신분(user_id)을 함께 넣는다. 서버는 이 값이 내 신분과 같을 때만 받아 준다 */
  function insertReview(value, uid, cb) {
    run(BL.sb.client.from(TABLE).insert({
      object_id: value.objectId,
      stars: value.stars,
      nickname: value.nickname,
      body: value.body,
      user_id: uid
    }).select(COLUMNS).single(), function (res) {
      if (res.error) { cb({ ok: false, error: fail(res.error) }); return; }
      if (!res.data) { cb({ ok: false, error: '저장 결과를 받지 못했습니다. 새로 고쳐 보세요.' }); return; }
      var row = read(res.data);
      rememberMine(row.id);
      rememberNick(row.nickname);
      /* 캐시 맨 앞에 넣어 두면 새로고침해도 바로 보인다 */
      storage.set(K.cache + row.objectId, [row].concat(cached(row.objectId)));
      cb({ ok: true, row: row, error: '' });
    });
  }

  /* 내 리뷰 지우기 — 서버(RLS)가 내 것인지 확인하고 지운다. 남의 리뷰는 0건이라 지워지지 않는다 */
  function remove(id, cb) {
    if (!ready()) { cb({ ok: false, error: '리뷰 서버에 연결하지 못했습니다.' }); return; }
    ensureUser(function (uid, uerr) {
      if (!uid) { cb({ ok: false, error: uerr || '리뷰 신분을 만들지 못했습니다.' }); return; }
      run(BL.sb.client.from(TABLE).delete().eq('id', id).select('id'), function (res) {
        if (res.error) { cb({ ok: false, error: fail(res.error) }); return; }
        if (!(res.data || []).length) { cb({ ok: false, error: '지울 수 없는 리뷰입니다.' }); return; }
        forget(id);
        cb({ ok: true, error: '' });
      });
    });
  }

  /* ── 집계 ─────────────────────────────── */
  function stats(rows) {
    var list = rows instanceof Array ? rows : [];
    var hist = [], sum = 0, i;
    for (i = 1; i <= MAX_STARS; i++) hist.push(0);
    list.forEach(function (r) {
      sum += r.stars;
      if (hist[r.stars - 1] != null) hist[r.stars - 1]++;
    });
    return {
      count: list.length,
      avg: list.length ? sum / list.length : 0,
      hist: hist,
      filled: list.length ? Math.round(sum / list.length) : 0   /* 평균을 채운 별 개수로 */
    };
  }

  /* 평균 4.3 처럼 소수 한 자리로 */
  function avgText(avg) { return (Math.round(Number(avg) * 10) / 10).toFixed(1); }

  /* ── 닉네임 · 내 리뷰 · 예전 별점 ──────── */
  function nick() { return String(storage.get(K.nick, '') || ''); }
  function rememberNick(n) { storage.set(K.nick, String(n == null ? '' : n)); }

  function mineIds() {
    var ids = storage.get(K.mine, []);
    return ids instanceof Array ? ids : [];
  }
  /* 내 리뷰인가 — 서버가 준 신분(user_id)이 있으면 그걸로, 옛 리뷰는 이 브라우저가 남긴 id 목록으로 본다 */
  function isMine(row) {
    if (typeof row === 'string') return mineIds().indexOf(String(row)) >= 0;
    if (!row) return false;
    if (meId && row.userId) return row.userId === meId;
    return mineIds().indexOf(String(row.id)) >= 0;
  }
  function mineCount(objectId) {
    var n = 0;
    cached(objectId).forEach(function (r) { if (isMine(r)) n++; });
    return n;
  }

  /* 내 리뷰를 목록·캐시에서 뺀다 (서버에서 지운 뒤) */
  function forget(id) {
    var s = String(id);
    storage.set(K.mine, mineIds().filter(function (x) { return String(x) !== s; }));
    BL.objects.list.forEach(function (o) {
      var rows = cached(o.id);
      var kept = rows.filter(function (r) { return String(r.id) !== s; });
      if (kept.length !== rows.length) storage.set(K.cache + o.id, kept);
    });
  }
  function rememberMine(id) {
    var ids = mineIds(), s = String(id);
    if (ids.indexOf(s) < 0) ids.push(s);
    storage.set(K.mine, ids.slice(-300));
  }

  /* 예전에 별점만 저장해 둔 값 (bl:rating.<오브젝트>) — 폼의 초기값으로만 쓴다 */
  function legacyStars(objectId) {
    var v = Number(storage.get('rating.' + objectId, 0));
    return isFinite(v) && v >= 1 && v <= MAX_STARS ? v : 0;
  }
  function clearLegacy(objectId) { storage.remove('rating.' + objectId); }

  BL.reviews = {
    limits: { stars: MAX_STARS, nick: MAX_NICK, body: MAX_BODY },
    ready: ready,
    fail: fail,
    ensureUser: ensureUser,
    me: function () { return meId; },
    list: list,
    listAll: listAll,
    add: add,
    remove: remove,
    validate: validate,
    stats: stats,
    avgText: avgText,
    nameOf: nameOf,
    cached: cached,
    nick: nick,
    rememberNick: rememberNick,
    isMine: isMine,
    mineCount: mineCount,
    legacyStars: legacyStars,
    clearLegacy: clearLegacy
  };
})(window.BL);
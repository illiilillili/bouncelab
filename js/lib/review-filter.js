window.BL = window.BL || {};

/* 리뷰 내용 검열 — 부적절한 표현 · 개인 연락처 · 광고를 등록 전에 막는다.
 *
 * 저장 직전에 js/lib/reviews.js 의 validate() 가 validateReviewContent() 를 부른다.
 * 목록과 규칙은 이 파일 한 곳에서만 관리한다 (고칠 때는 여기만 보면 된다).
 *
 *   normalizeText(text)            우회 표현을 잡기 위한 비교용 정규화
 *   containsBannedWord(text)       금지어 검사          → { hit, group, name }
 *   containsContactPattern(text)   연락처 · 연락 유도 검사 → { hit, group }
 *   validateReviewContent(text)    둘을 합친 결과        → { ok, code, message }
 *
 * 화면에는 어떤 단어가 걸렸는지 알려주지 않는다 (알려주면 그 단어만 피해가는 우회가 쉬워진다). */
(function (BL) {
  /* ── 1) 욕설 · 비속어 ─────────────────────── */
  var PROFANITY = [
    '씨발', '시발', '씨빨', '시빨', '씨이발', '시이발', 'ㅅㅂ', 'ㅆㅂ',
    '병신', 'ㅂㅅ', 'ㅄ', '병1신',
    '개새끼', '개색기', '개세끼', '개새기',
    '좆', '좃', 'ㅈㄴ', '존나',
    'ㅈ같', '좆같',
    '씹새끼', '씹새', '씹년', '씹놈',
    '꺼져', '닥쳐',
    '미친놈', '미친년', '미친새끼'
  ];

  /* ── 2) 성적 · 음란 표현 ──────────────────── */
  var SEXUAL = ['섹스', '섹쓰', '쎅스', '야동', '야짤', '포르노', '자위', '딸딸이'];

  /* ── 3) 혐오 · 비하 ──────────────────────── */
  var HATE = ['한남', '한녀', '김치녀', '틀딱', '급식충', '맘충'];

  /* ── 4) 직접적인 공격 · 위협 ───────────────── */
  var THREAT = ['죽여버', '뒤져라'];

  /* ── 5) 도박 ─────────────────────────────── */
  var GAMBLING = ['카지노', '바카라', '토토', '도박', '홀덤', '슬롯머신', '슬롯사이트', '슬롯게임'];

  /* ── 6) 광고 · 불법 홍보 ──────────────────── */
  var AD = ['무료머니', '무료코인', '돈벌기', '대출', '리딩방'];

  /* 정상 문장이라 봐주는 단어 — 검사 전에 지운다 (예: "불이 꺼져 있다", "이 일의 시발점") */
  var ALLOW = ['시발점', '시발역', '꺼져있', '꺼져서', '자위권', '자위대', '아이디어'];

  /* ── 외부 연락 : 단어만으로는 막지 않는다 ─────
   * "이 게임 디코에서도 유명하던데" 는 통과, "디코로 연락하세요" 는 차단.
   * 플랫폼 이름이 있을 때만 아래 SOLICIT · 계정 패턴 · 개인정보 패턴을 함께 본다. */
  var PLATFORM = [
    '디스코드', '디코', 'discord', '카카오톡', '카톡', 'ㅋㅌ',
    '텔레그램', '텔레', '인스타그램', '인스타', '인별', '유튜브', '유튭',
    '오픈채팅', '오픈카톡', '단톡', '디엠'
  ];
  var SOLICIT = ['연락', '연락처', '쪽지', '번호', '아이디', '친추', '초대', '디엠', 'dm', '오픈톡'];

  /* ── 우회 대응 정규화 ───────────────────────
   *   '씨.발' '씨 발' '씨-발' '씨***발' → '씨발'
   *   '시이이발' → '시발'      (같은 글자가 반복된 것은 하나로 줄인다)
   *   완성형 한글 · 자모(ㅅㅂ 같은 것) · 영문 · 숫자만 남기고 나머지는 지운다. */
  function normalizeText(text) {
    var s = String(text == null ? '' : text).toLowerCase();
    s = s.replace(/(.)\1+/g, '$1');
    s = s.replace(/[^0-9a-z\u3131-\u318E\uAC00-\uD7A3]/g, '');
    return s;
  }  /* ── 금지어 검사 ──────────────────────────── */
  var GROUPS = [
    { key: 'profanity', name: '욕설', words: PROFANITY },
    { key: 'sexual', name: '성적 표현', words: SEXUAL },
    { key: 'hate', name: '혐오 표현', words: HATE },
    { key: 'threat', name: '위협', words: THREAT },
    { key: 'gambling', name: '도박', words: GAMBLING },
    { key: 'ad', name: '광고', words: AD }
  ];

  /* 목록도 같은 규칙으로 미리 정규화해 둔다 — '딸딸이' 처럼 글자가 반복된 단어는
     본문에서 '딸이' 로 줄어드는데 목록이 그대로면 영영 안 걸리기 때문이다. */
  var BANNED = GROUPS.map(function (g) {
    return { key: g.key, name: g.name, words: g.words.map(normalizeText).filter(Boolean) };
  });
  var ALLOW_NORM = ALLOW.map(normalizeText).filter(Boolean);

  function containsBannedWord(text) {
    var s = normalizeText(text);
    ALLOW_NORM.forEach(function (w) { s = s.split(w).join(''); });
    for (var i = 0; i < BANNED.length; i++) {
      var g = BANNED[i];
      for (var j = 0; j < g.words.length; j++) {
        if (s.indexOf(g.words[j]) >= 0) return { hit: true, group: g.key, name: g.name };
      }
    }
    return { hit: false, group: '', name: '' };
  }

  /* ── 연락처 · 연락 유도 검사 ───────────────── */
  /* 문맥과 상관없이 막는 개인정보 패턴 */
  var PERSONAL = [
    /01[016789][\s.\-]?\d{3,4}[\s.\-]?\d{4}/,        /* 010-1234-5678 · 01012345678 */
    /\d{2,4}[\s.\-]\d{3,4}[\s.\-]\d{4}/,              /* 02-123-4567 같은 유선 형태 */
    /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/,         /* 이메일 */
    /https?:\/\//,                                      /* http(s) 주소 */
    /www\.[a-z0-9\-]+/,                                 /* www. 주소 */
    /[a-z0-9\-]+\.(com|net|org|kr|io|co|me|gg|xyz|shop|site|top|app|tv)\b/,   /* 도메인 */
    /discord\.gg\//,                                    /* 디스코드 초대 */
    /discord(app)?\.com\/invite/,                       /* 디스코드 초대(공식) */
    /open\.kakao\.com/,                                 /* 카카오 오픈채팅 */
    /(^|[^a-z0-9])@[a-z0-9._\-]{3,}/                    /* @아이디 */
  ];

  /* 짧은 영문 플랫폼 이름(dc · dm · ig)은 단어 경계로만 본다 (다른 단어 속에서 걸리지 않게) */
  /* 짧은 영문 플랫폼 이름(dc · dm · ig)은 단어 경계로만 본다 (다른 단어 속에서 걸리지 않게) */
  var ASCII_PLATFORM = /(^|[^a-z0-9])(dc|dm|ig)([^a-z0-9]|$)/;

  /* 아이디처럼 보이는 글자가 단어 바로 뒤에 붙었는지 */
  var ACCOUNT_TAIL = /^\s*[:：]?\s*[a-z0-9._\-]{3,}/;

  function containsContactPattern(text) {
    var s = String(text == null ? '' : text).toLowerCase();
    var i;

    /* 1) 문맥과 상관없이 막는 개인정보 패턴 (전화 · 메일 · 주소 · 초대 링크 · @아이디) */
    for (i = 0; i < PERSONAL.length; i++) {
      if (PERSONAL[i].test(s)) return { hit: true, group: 'personal' };
    }

    /* 2) 외부 플랫폼 이름 찾기 (리뷰가 짧아서 가장 먼저 나오는 하나만 본다) */
    var at = -1, word = '';
    for (i = 0; i < PLATFORM.length; i++) {
      var k = s.indexOf(PLATFORM[i]);
      if (k >= 0 && (at < 0 || k < at)) { at = k; word = PLATFORM[i]; }
    }
    if (at < 0) {
      var am = s.match(ASCII_PLATFORM);
      if (am) { word = am[2]; at = s.indexOf(word, am.index); }
    }
    if (at < 0) return { hit: false, group: '' };

    /* 3) 플랫폼 이름 바로 뒤에 아이디처럼 보이는 글자가 붙으면 차단
          ("디코 abc123" · "discord: abc#1234" · "카톡 id") */
    if (word && ACCOUNT_TAIL.test(s.slice(at + word.length))) return { hit: true, group: 'contact' };

    /* 4) 플랫폼 이름 가까이에 연락을 유도하는 말이 있으면 차단 ("디코로 연락하세요") */
    for (i = 0; i < SOLICIT.length; i++) {
      var w = SOLICIT[i], j = -1;
      if (/^[a-z]+$/.test(w)) {
        /* 영문 약어(dm)는 단어 경계로만 — 'admin' 같은 단어 속에서 걸리지 않게 */
        var m = s.match(new RegExp('(^|[^a-z0-9])(' + w + ')([^a-z0-9]|$)'));
        if (m) j = s.indexOf(m[2], m.index);
      } else {
        j = s.indexOf(w);
      }
      if (j >= 0 && Math.abs(j - at) <= 14) return { hit: true, group: 'contact' };
    }
    return { hit: false, group: '' };
  }

  /* ── 최종 판정 ────────────────────────────── */
  var MESSAGE = {
    banned: '부적절한 표현이 포함되어 있어 리뷰를 등록할 수 없습니다.',
    contact: '개인 연락처나 외부 연락을 유도하는 내용은 리뷰에 작성할 수 없습니다.',
    personal: '전화번호, 이메일 또는 외부 링크는 리뷰에 작성할 수 없습니다.'
  };

  function validateReviewContent(text) {
    var banned = containsBannedWord(text);
    if (banned.hit) return { ok: false, code: 'banned', group: banned.group, message: MESSAGE.banned };

    var contact = containsContactPattern(text);
    if (contact.hit) return { ok: false, code: contact.group, message: MESSAGE[contact.group] };

    return { ok: true, code: 'none', message: '' };
  }

  BL.reviewFilter = {
    normalizeText: normalizeText,
    containsBannedWord: containsBannedWord,
    containsContactPattern: containsContactPattern,
    validateReviewContent: validateReviewContent,
    message: MESSAGE
  };
})(window.BL);
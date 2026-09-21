window.BL = window.BL || {};

/* Supabase 연결 — 익명 리뷰 저장소에만 쓴다.
 * 주소와 키는 data/site.js 의 reviews 한 곳에서 온다.
 * 키는 공개되어도 되는 anon(publishable) 키이고, 비밀 키(service_role)는 절대 넣지 않는다.
 *
 * SDK 는 첫 화면에서 받지 않는다 — 평점 화면에서 처음 필요해질 때 ensure() 로 받는다.
 * (외부 CDN 이 느리거나 막혀도 홈·룰렛 같은 다른 화면은 그대로 뜬다.)
 * 버전은 박아 둔다 — CDN 이 새 버전을 내놓아도 예고 없이 동작이 바뀌지 않게.
 *
 * SDK 를 못 불러오거나(인터넷 차단) 설정이 비어 있으면 ready:false 로 두고,
 * 화면(js/views/rating.js)은 저장 버튼을 감추고 저장해 둔 목록만 보여준다. */
(function (BL) {
  var c = (BL.site && BL.site.reviews) || {};
  var url = c.url || '';
  var key = c.key || '';
  var SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0';
  var waiters = [];
  var loading = false;

  var sb = {
    client: null,
    ready: false,
    why: (!url || !key) ? '설정 없음' : '',
    table: c.table || 'reviews',
    ensure: ensure      /* ensure(cb) — 필요할 때 SDK 를 받아 연결을 만들고, 되면 cb() 를 부른다 */
  };
  BL.sb = sb;

  function flush() {
    var list = waiters;
    waiters = [];
    list.forEach(function (fn) { if (fn) fn(); });
  }

  function make() {
    var sdk = window.supabase;
    if (!sdk || typeof sdk.createClient !== 'function') { sb.why = 'SDK 못 불러옴'; return; }
    /* 익명 신분(auth.uid)을 계속 쓰려면 세션을 브라우저에 남겨야 한다.
       로그인 화면·메일 링크를 쓰지 않으므로 주소 감지는 끈다. */
    sb.client = sdk.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    sb.ready = true;
    sb.why = '';
  }

  function load() {
    loading = true;
    sb.why = '';                       /* 다시 시도하는 동안은 '실패' 를 지운다 */
    var tag = document.createElement('script');
    tag.src = SDK;
    tag.async = true;
    tag.onload = function () { loading = false; make(); flush(); };
    tag.onerror = function () { loading = false; sb.why = 'SDK 못 불러옴'; flush(); };
    document.head.appendChild(tag);
  }

  function ensure(cb) {
    if (typeof cb === 'function') waiters.push(cb);
    if (sb.ready || sb.why === '설정 없음') { flush(); return; }   /* 됐거나, 설정이 없어 안 되는 경우 */
    if (loading) return;                                           /* 받는 중 — 다 되면 부른다 */
    load();                                                        /* 처음이거나, 지난번에 실패했으면 다시 */
  }
})(window.BL);

window.BL = window.BL || {};

/* Supabase 연결 — 익명 리뷰 저장소에만 쓴다.
 * 주소와 키는 data/site.js 의 reviews 한 곳에서 온다.
 * 키는 공개되어도 되는 anon(publishable) 키이고, 비밀 키(service_role)는 절대 넣지 않는다.
 * SDK 를 못 불러오거나(인터넷 차단) 설정이 비어 있으면 ready:false 로 두고,
 * 화면(js/views/rating.js)은 저장 버튼을 감추고 저장해 둔 목록만 보여준다. */
(function (BL) {
  var c = (BL.site && BL.site.reviews) || {};
  var url = c.url || '';
  var key = c.key || '';
  var sdk = window.supabase;
  var why = '';

  if (!url || !key) why = '설정 없음';
  else if (!sdk || typeof sdk.createClient !== 'function') why = 'SDK 못 불러옴';

  /* 익명 신분(auth.uid)을 계속 쓰려면 세션을 브라우저에 남겨야 한다.
     로그인 화면·메일 링크를 쓰지 않으므로 주소 감지는 끈다. */
  var client = why ? null : sdk.createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });

  BL.sb = { client: client, ready: !!client, why: why, table: c.table || 'reviews' };
})(window.BL);
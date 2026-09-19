/* BounceLab 사이트 기본 정보 */
window.BL = window.BL || {};
window.BL.site = {
  id: 'bouncelab',
  nameKo: '바운스랩',
  nameEn: 'BounceLab',
  version: '0.1.0',
  repo: 'https://github.com/illiilillili/bouncelab',
  storagePrefix: 'bl:',

  /* 문의하기 — 홈 화면 맨 아래 버튼 하나
     href 에 오픈채팅·디스코드·구글폼 주소를 넣으면 그 링크로 열립니다.
     mail 에 주소를 넣으면 메일 쓰기로 열립니다.
     둘 다 비어 있으면 copyText 를 클립보드로 복사합니다 (지금은 임시로 '-메일-'). */
  contact: {
    label: '문의하기',
    hint: '',
    copyText: '-메일-',
    href: '',
    mail: ''
  },

  /* 익명 리뷰 (오브젝트 평점) — Supabase 저장소.
     url·key 는 공개되어도 되는 anon(publishable) 키입니다. 비밀 키(service_role)는 넣지 마세요.
     비워 두면 리뷰가 이 브라우저에만 저장되는 로컬 모드로 돌아갑니다.
     maxNick · maxBody 는 Supabase 표의 check 제약과 같아야 합니다. */
  reviews: {
    url: 'https://swyqrnienurjtqqtftpu.supabase.co',
    key: 'sb_publishable_MzBg-tXb5ZbktSoFA7p7Fw_LQSJR0np',
    table: 'reviews',
    pageSize: 10,
    maxStars: 5,
    maxNick: 12,
    maxBody: 50
  }
};
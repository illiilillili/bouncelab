/* 기능 목록. 화면이 전부 이 배열 하나를 읽는다.
 *
 * status     soon = 아직 안 만든 기능 / ready = 동작함
 * needsData  맵 이름처럼 알려줘야 하는 값이 필요한 기능
 * desc       준비 중 화면(js/views/_soon.js)에 나오는 설명
 *
 * 홈 카드에는 그림(js/lib/icons.js 의 art) · 이름 · desc 한 줄이 나온다.
 * 개수 같은 수치 줄은 두지 않는다 (홈 히어로의 숫자 한 줄이 그 몫을 맡는다).
 */
window.BL = window.BL || {};
window.BL.features = [
  { id: 'roulette', name: '맵 룰렛',
    desc: '무작위로 맵 하나를 뽑습니다. 난이도 범위로 걸러서 고릅니다.',
    status: 'ready' },

  { id: 'controls', name: '랜덤 컨트롤 룰렛',
    desc: '바운스볼 도감 컨트롤 중 하나를 뽑습니다. 난이도·태그·제작자와 함께 봅니다.',
    status: 'ready' },

  { id: 'colors', name: '랜덤 색상 추천',
    desc: 'HSV 40단계로 색을 뽑고 HEX·RGB 값을 바로 확인합니다.',
    status: 'ready' },

  /* 오브젝트 리뷰 — 별 · 공에 별점과 리뷰를 남기고 모두의 리뷰를 본다
     (js/views/rating.js · js/lib/reviews.js · Supabase) */
  { id: 'rating', name: '오브젝트 평점',
    desc: '오브젝트(별·공)에 별점과 리뷰를 남기고, 다른 사람이 남긴 리뷰도 봅니다.',
    status: 'ready' }
];
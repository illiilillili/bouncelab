/* 기능 목록. 화면이 전부 이 배열 하나를 읽는다.
 *
 * status     soon = 아직 안 만든 기능 / ready = 동작함
 * needsData  맵 이름처럼 알려줘야 하는 값이 필요한 기능
 * desc       홈 카드와 기능 화면 머리에 나오는 한 줄 설명 (준비 중 화면도 이 값을 쓴다)
 *
 * 홈 카드에는 그림(js/lib/icons.js 의 art) · 이름 · desc 한 줄이 나온다.
 * 개수 같은 수치 줄은 두지 않는다 (홈 히어로의 숫자 한 줄이 그 몫을 맡는다).
 */
window.BL = window.BL || {};
window.BL.features = [
  { id: 'roulette', name: '맵 룰렛',
    desc: '무작위로 맵 하나를 뽑습니다. 난이도 범위로 걸러서 고릅니다.',
    status: 'ready' },

  { id: 'controls', name: '컨트롤 룰렛',
    desc: '바운스볼 도감 컨트롤 중 하나를 뽑습니다.',
    status: 'ready' },

  { id: 'colors', name: '랜덤 색상 추천',
    desc: 'HSV 40단계로 색을 뽑고 비슷한 색을 추천받습니다.',
    status: 'ready' },

  /* 오브젝트 리뷰 — 별 · 공 · 가시 · 톱니 · SERVER ERROR 에 별점과 리뷰를 남기고 모두의 리뷰를 본다
     (표창 · 블록은 지금 임시로 뺐다 — js/lib/objects.js 의 HIDDEN)
     (js/views/rating.js · js/lib/reviews.js · Supabase) */
  { id: 'rating', name: '오브젝트 평점',
    desc: '오브젝트에 별점과 리뷰를 남기고, 다른 사람이 남긴 리뷰도 봅니다.',
    status: 'ready' },

  /* 바운스볼 뉴스 — 소식을 기사처럼 읽는다 (data/news.js · js/views/news.js).
     쓰는 방식(누가 어떻게 쓰는지)은 아직 정하지 않았다 — 지금은 data/news.js 의 예시 기사를 보여준다 */
  { id: 'news', name: '바운스볼 뉴스',
    desc: '바운스볼의 모든 소식을 빠르게 알립니다.',
    status: 'ready' }
];
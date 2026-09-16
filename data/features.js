/* 기능 목록. 화면이 전부 이 배열 하나를 읽는다.
 *
 * status     soon = 아직 안 만든 기능 / ready = 동작함
 * needsData  맵 이름처럼 알려줘야 하는 값이 필요한 기능
 */
window.BL = window.BL || {};
window.BL.features = [
  { id: 'roulette', name: '맵 룰렛',
    desc: '무작위로 맵 하나 뽑기. 난이도·해시태그 필터', status: 'ready' },

  { id: 'controls', name: '랜덤 컨트롤 룰렛',
    desc: '바운스볼 도감 컨트롤 631개 중 하나 뽑기. 난이도·태그·재료와 움짤', status: 'ready' },

  { id: 'colors', name: '랜덤 색상 추천',
    desc: 'HSV 40단계로 색 뽑기. HEX·RGB 표시', status: 'ready' }
];
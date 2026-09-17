/* 기능 목록. 화면이 전부 이 배열 하나를 읽는다.
 *
 * status     soon = 아직 안 만든 기능 / ready = 동작함
 * needsData  맵 이름처럼 알려줘야 하는 값이 필요한 기능
 * desc       홈 카드에 나오는 설명 (문장으로 끝맺는다)
 * stat       카드 아래 수치 줄. * 로 감싼 부분만 굵게 나온다 (예: '*631개* 컨트롤')
 *            데이터에서 세는 값이라 함수로 두고 카드를 그릴 때 부른다
 */
window.BL = window.BL || {};
window.BL.features = [
  { id: 'roulette', name: '맵 룰렛',
    desc: '무작위로 맵 하나를 뽑습니다. 난이도와 해시태그로 걸러서 고릅니다.',
    stat: function () {
      var maps = window.BL.maps || [], seen = {}, steps = 0;
      for (var i = 0; i < maps.length; i++) {
        if (!seen[maps[i].diff]) { seen[maps[i].diff] = 1; steps++; }
      }
      return '*' + maps.length + '개* 맵 · 난이도 *' + steps + '가지*';
    },
    status: 'ready' },

  { id: 'controls', name: '랜덤 컨트롤 룰렛',
    desc: '바운스볼 도감 컨트롤 중 하나를 뽑습니다. 난이도·태그·제작자와 함께 봅니다.',
    stat: function () {
      var list = window.BL.controls || [], pics = 0;
      for (var i = 0; i < list.length; i++) {
        if (list[i].imgs && list[i].imgs.length) pics++;
      }
      return '*' + list.length + '개* 컨트롤 · *' + pics + '개* 그림';
    },
    status: 'ready' },

  { id: 'colors', name: '랜덤 색상 추천',
    desc: 'HSV 40단계로 색을 뽑고 HEX·RGB 값을 바로 확인합니다.',
    stat: function () {
      var step = window.BL.color ? window.BL.color.INDEX_MAX + 1 : 40;
      return '*' + step + '단계* HSV 스텝';
    },
    status: 'ready' },

  /* 새 탭 — 별 · 공 오브젝트를 골라 별점을 매긴다 (js/views/rating.js) */
  { id: 'rating', name: '오브젝트 평점',
    desc: '오브젝트(별·공)를 고르고 나만의 별점을 매깁니다.',
    stat: function () {
      var list = (window.BL.objects && window.BL.objects.list) || [];
      return list.map(function (o) { return o.name; }).join(' · ') + ' *' + list.length + '종*';
    },
    status: 'ready' }
];
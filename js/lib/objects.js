window.BL = window.BL || {};

/* 오브젝트 평점에서 다루는 오브젝트 — 이름과 그림.
 * 그림은 직접 그리지 않고 준 그림 파일을 그대로 쓴다 (img/ 폴더).
 * 새 오브젝트를 넣으려면 img/ 에 그림을 두고 LIST 에 한 줄만 추가하면 화면에 바로 나온다.
 * id 는 주소(#/f/rating/<id>)와 서버의 reviews.object_id 에 그대로 남으므로 한 번 정하면 바꾸지 않는다. */
(function (BL) {
  var LIST = [
    { id: 'star', name: '별', img: 'img/object-star.png' },
    { id: 'ball', name: '공', img: 'img/object-ball.webp' },
    { id: 'spike', name: '가시', img: 'img/object-spike.png' },
    { id: 'shuriken', name: '표창', img: 'img/object-shuriken.png' },
    { id: 'saw', name: '톱니', img: 'img/object-saw.png' },
    { id: 'block', name: '블록', img: 'img/object-block.png' }
  ];

  function find(id) {
    for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i];
    return null;
  }

  function image(src) {
    var img = document.createElement('img');
    img.src = src;
    img.alt = '';
    return img;
  }

  /* 오브젝트 그림 */
  function art(id) {
    var o = find(id);
    return o ? image(o.img) : null;
  }

  /* 평점 매기는 창의 별 버튼 그림. 켜짐·꺼짐은 버튼의 aria-pressed 로 CSS 가 가른다 */
  function star() {
    return art('star');
  }

  BL.objects = { list: LIST, find: find, art: art, star: star };
})(window.BL);

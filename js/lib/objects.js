window.BL = window.BL || {};

/* 오브젝트 평점에서 다루는 오브젝트 — 이름과 그림.
 * 그림은 직접 그리지 않고 준 그림 파일을 그대로 쓴다 (img/ 폴더 · 형식은 WebP).
 * 새 오브젝트를 넣으려면 img/ 에 그림을 두고 LIST 에 한 줄만 추가하면 화면에 바로 나온다.
 * id 는 주소(#/f/rating/<id>)와 서버의 reviews.object_id 에 그대로 남으므로 한 번 정하면 바꾸지 않는다. */
(function (BL) {
  var LIST = [
    { id: 'star', name: '별', img: 'img/object-star.png' },
    { id: 'ball', name: '공', img: 'img/object-ball.webp' },
    { id: 'spike', name: '가시', img: 'img/object-spike.webp' },
    { id: 'shuriken', name: '표창', img: 'img/object-shuriken.webp' },
    { id: 'saw', name: '톱니', img: 'img/object-saw.webp' },
    { id: 'block', name: '블록', img: 'img/object-block.webp' }
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

  /* 오브젝트 그림 — 목록에 여러 장이 한꺼번에 나오므로 화면에 들어올 때 받는다.
     별(star)은 별점 한 줄에 5장씩 쓰는 작은 그림(0.7KB)이라 바로 받는다. */
  function art(id) {
    var o = find(id);
    if (!o) return null;
    var img = image(o.img);
    if (id !== 'star') { img.loading = 'lazy'; img.decoding = 'async'; }
    return img;
  }

  /* 평점 매기는 창의 별 버튼 그림. 켜짐·꺼짐은 버튼의 aria-pressed 로 CSS 가 가른다 */
  function star() {
    return art('star');
  }

  BL.objects = { list: LIST, find: find, art: art, star: star };
})(window.BL);

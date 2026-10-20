/* 리듬 게임. 노트는 자동으로 내려오지 않는다.
 * 가장 아래(지금 칠) 노트의 열과 입력한 열이 같을 때만 한 줄 내려가고 1점을 얻는다.
 * 틀린 입력은 무시한다. 입력은 키보드(D F J K)와 터치(보드 칸, 아래 키 버튼)를 모두 받는다.
 * 노트는 끝없이 생기므로, 화면에 필요한 줄만 DOM 으로 만들고 지나간 줄은 지운다. */
(function () {
  var BL = window.BL || {};
  var gen = BL.rhythmChart;

  var COLS = 4;
  var BEHIND = 2;   // 판정선 아래로 남겨 둘 줄 수 (화면 밖이라 안 보인다)
  var AHEAD = 8;    // 위쪽으로 미리 만들어 둘 줄 수 (보드는 5.5줄만 보인다)
  var TRIM_AT = 64; // 이 개수만큼 지난 노트 열 기록이 쌓이면 버린다
  var KEY_COL = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3 };

  var boardEl = document.getElementById('board');
  var rowsEl = document.getElementById('rows');
  var scoreEl = document.getElementById('score');
  var keyBtns = document.querySelectorAll('.keys button');

  var cols = [];          // cols[k] 는 절대 번호 base + k 노트의 열
  var base = 0;
  var rowsByIndex = {};   // 절대 번호 -> 줄 DOM
  var cursor = 0;         // 지금 칠 노트의 절대 번호
  var score = 0;

  /* 절대 번호 i 노트의 열. 아직 없으면 새로 뽑아 둔다. */
  function at(i) {
    while (base + cols.length <= i) cols.push(gen.next());
    return cols[i - base];
  }

  function offsetOf(i) {
    return 'translateY(' + (-(i - cursor) * 100) + '%)';
  }

  /* 위치를 먼저 정해 두고 붙인다. 그래야 새 줄이 보드 안에서 미끄러져 들어오지 않는다. */
  function makeRow(i) {
    var row = document.createElement('div');
    row.className = 'row';
    row.style.transform = offsetOf(i);
    var note = document.createElement('div');
    note.className = 'note';
    note.style.setProperty('--col', String(at(i)));
    row.appendChild(note);
    rowsEl.appendChild(row);
    return row;
  }

  /* 화면에 필요한 줄만 있게 맞추고, 현재 위치를 적용한다. */
  function sync() {
    var from = Math.max(0, cursor - BEHIND);
    var to = cursor + AHEAD;

    Object.keys(rowsByIndex).forEach(function (k) {
      var i = Number(k);
      if (i < from || i > to) {
        rowsEl.removeChild(rowsByIndex[k]);
        delete rowsByIndex[k];
      } else {
        rowsByIndex[k].style.transform = offsetOf(i);
      }
    });
    for (var i = from; i <= to; i++) {
      if (!rowsByIndex[i]) rowsByIndex[i] = makeRow(i);
    }

    /* 지나간 노트 열 기록은 버린다 (무한히 쌓이지 않게) */
    var keep = from;
    if (keep - base > TRIM_AT) {
      cols.splice(0, keep - base);
      base = keep;
    }
  }

  /* 틀린 입력: 점수는 그대로 두고 보드 테두리만 잠깐 빨갛게 한다.
   * 클래스를 뗐다가 다시 붙여서, 빠르게 연속으로 틀려도 매번 처음부터 보이게 한다. */
  var WRONG_MS = 280;
  var wrongTimer = null;

  function flashWrong() {
    boardEl.classList.remove('is-wrong');
    void boardEl.offsetWidth;
    boardEl.classList.add('is-wrong');
    clearTimeout(wrongTimer);
    wrongTimer = setTimeout(function () {
      boardEl.classList.remove('is-wrong');
    }, WRONG_MS);
  }

  /* 입력한 열이 지금 칠 노트의 열이면 한 줄 내려가고 1점. 아니면 빨갛게 알린다. */
  function press(col) {
    if (col !== at(cursor)) {
      flashWrong();
      return;
    }
    cursor += 1;
    score += 1;
    scoreEl.textContent = String(score);
    sync();
  }

  function onKeyDown(e) {
    if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
    if (!Object.prototype.hasOwnProperty.call(KEY_COL, e.code)) return;
    press(KEY_COL[e.code]);
  }

  /* 보드의 어느 칸을 눌러도 그 열이 입력된다. 터치 · 마우스 공용 */
  function onBoardDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    var r = boardEl.getBoundingClientRect();
    var col = Math.floor((e.clientX - r.left) / r.width * COLS);
    press(Math.min(COLS - 1, Math.max(0, col)));
  }

  function onKeyBtnDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    press(Number(e.currentTarget.getAttribute('data-col')));
  }

  /* 모바일 제스처 차단.
   * - touchmove : 스크롤 · 핀치 확대 (passive:false 여야 막힌다)
   * - gesture* : iOS Safari 의 핀치 확대
   * - contextmenu : 길게 누를 때 뜨는 메뉴 */
  function blockGesture(e) { e.preventDefault(); }
  document.addEventListener('touchmove', blockGesture, { passive: false });
  document.addEventListener('gesturestart', blockGesture, { passive: false });
  document.addEventListener('gesturechange', blockGesture, { passive: false });
  document.addEventListener('gestureend', blockGesture, { passive: false });
  document.addEventListener('contextmenu', blockGesture);

  sync();
  window.addEventListener('keydown', onKeyDown);
  boardEl.addEventListener('pointerdown', onBoardDown);
  keyBtns.forEach(function (btn) {
    btn.addEventListener('pointerdown', onKeyBtnDown);
  });
})();

window.BL = window.BL || {};

/* 문의하기 버튼 — 목적지(href/mail)가 있으면 그리로 보내고,
   아직 없으면 정해 둔 값(보통 메일 주소)만 클립보드로 복사한다. */
(function (BL) {
  function config() {
    var c = (BL.site && BL.site.contact) || {};
    return {
      label: c.label || '문의하기',
      hint: c.hint || '',
      copyText: c.copyText || '-메일-',
      href: c.href || '',
      mail: c.mail || ''
    };
  }

  function template(lines) {
    return ['[바운스랩 문의]', '종류: (맵 삭제 / 오타 / 기타)']
      .concat(lines || [])
      .concat(['내용: '])
      .join('\n');
  }

  function copyLine(line, done) {
    function ok() { if (done) done('복사됨 — ' + line); }
    function viaArea() {
      var area = document.createElement('textarea');
      area.className = 'copy-area';
      area.value = line;
      document.body.appendChild(area);
      area.select();
      var copied = false;
      try { copied = document.execCommand('copy'); } catch (e) { copied = false; }
      document.body.removeChild(area);
      if (done) done(copied ? '복사됨 — ' + line : '복사가 막혀 있습니다: ' + line);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(line).then(ok, viaArea);
    } else {
      viaArea();
    }
  }

  /* 목적지(href/mail)로 보내고, 아직 없으면 정해 둔 문구를 복사한다.
   * 화면마다 버튼 모양은 달라도(홈의 문의하기 · 뉴스의 제보 카드) 보내는 규칙은 이 한 곳을 쓴다. */
  function send(lines, note) {
    var c = config();
    var body = typeof lines === 'function' ? lines() : (lines || []);
    if (c.href) { window.open(c.href, '_blank', 'noopener'); return; }
    if (c.mail) {
      window.location.href = 'mailto:' + c.mail +
        '?subject=' + encodeURIComponent('[바운스랩 문의]') +
        '&body=' + encodeURIComponent(template(body));
      return;
    }
    /* 목적지가 아직 없을 때 — 정해 둔 문구만 복사해 준다.
       실제 주소가 생기면 data/site.js 의 contact.mail (또는 href) 을 채우면 그리로 보낸다. */
    copyLine(c.copyText, function (msg) { if (note) note.textContent = msg; });
  }

  function row(lines) {
    var el = BL.dom.el;
    var c = config();
    var note = el('p', { class: 'ask__note' });

    function ask() { send(lines, note); }

    /* 설명 없이 버튼만 (hint 를 비워 두면 문구도 안 나온다) */
    return el('div', { class: 'ask' }, [
      c.hint ? el('p', { class: 'ask__hint', text: c.hint }) : null,
      el('button', { class: 'btn', type: 'button', text: c.label, onClick: ask }),
      note
    ]);
  }

  BL.contact = { config: config, template: template, copyLine: copyLine, send: send, row: row };
})(window.BL);
window.BL = window.BL || {};

/* 문의하기 버튼 — 목적지(href/mail)가 있으면 그리로 보내고,
   없으면 맵 정보가 들어간 문의 양식을 클립보드로 복사한다. */
(function (BL) {
  function config() {
    var c = (BL.site && BL.site.contact) || {};
    return {
      label: c.label || '문의하기',
      hint: c.hint || '맵이 삭제되었거나 오타가 있으면 알려주세요.',
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

  function row(lines) {
    var el = BL.dom.el;
    var c = config();
    var note = el('p', { class: 'ask__note' });

    function ask() {
      var body = typeof lines === 'function' ? lines() : (lines || []);
      if (c.href) { window.open(c.href, '_blank', 'noopener'); return; }
      if (c.mail) {
        window.location.href = 'mailto:' + c.mail +
          '?subject=' + encodeURIComponent('[바운스랩 문의]') +
          '&body=' + encodeURIComponent(template(body));
        return;
      }
      copyLine(template(body), function (msg) {
        note.textContent = msg + ' 사용하는 커뮤니티·채팅방에 붙여넣어 주세요.';
      });
    }

    return el('div', { class: 'ask' }, [
      el('p', { class: 'ask__hint', text: c.hint }),
      el('button', { class: 'btn', type: 'button', text: c.label, onClick: ask }),
      note
    ]);
  }

  BL.contact = { config: config, template: template, copyLine: copyLine, row: row };
})(window.BL);
/* 바운스볼 도감(스프레드시트) -> data/controls.js 생성기
 * 사용법: npm run sync:controls
 * 의존성 없음. Node 18+ 내장 fetch 사용.
 * 컨트롤 GIF 는 scripts/control-gifs.json (도감 DB 의 gif1·gif2 하이퍼링크에서 뽑은 목록) 을 쓴다. */
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1oigeOzho6fp_deBIHgRnf8b92_EAXepWERYRWimlW6A';
const GID = '1670459966';
const URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&gid=' + GID;
const OUT = path.join(__dirname, '..', 'data', 'controls.js');
const GIFS = path.join(__dirname, 'control-gifs.json');
const TIPS = path.join(__dirname, 'control-tips.json');

/* GIF 주소 두 가지 : 화면에 띄우는 주소 / 원본 파일 페이지 */
const gifUrl = function (id) { return 'https://lh3.googleusercontent.com/d/' + id; };
const gifView = function (id) { return 'https://drive.google.com/file/d/' + id + '/view'; };

/* RFC4180 스타일 CSV 파서 (gviz 는 따옴표를 두 번 겹쳐 이스케이프한다) */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/* 재료 열: '"가시", "전기"' 또는 '"A" 또는 "B"' -> 이름 배열 */
function materials(cell) {
  const out = [];
  const re = /"([^"]+)"/g;
  let m;
  while ((m = re.exec(cell))) out.push(m[1].trim());
  if (!out.length) {
    String(cell).split(/[,]| 또는 /).forEach(function (s) {
      s = s.trim().replace(/^"/, '').replace(/"$/, '');
      if (s) out.push(s);
    });
  }
  return out;
}

function nameKey(name) { return String(name).trim().replace(/\s+/g, ' '); }

function loadTips() {
  if (!fs.existsSync(TIPS)) return { byName: {} };
  return { byName: JSON.parse(fs.readFileSync(TIPS, 'utf8')).byName || {} };
}

function loadGifs() {
  if (!fs.existsSync(GIFS)) return { byName: {}, used: false };
  const data = JSON.parse(fs.readFileSync(GIFS, 'utf8'));
  return { byName: data.byName || {}, used: true };
}

async function main() {
  const gifs = loadGifs();
  const tips = loadTips();
  const res = await fetch(URL);
  if (!res.ok) throw new Error('시트를 읽지 못했습니다: HTTP ' + res.status);
  const rows = parseCsv(await res.text());
  const head = rows.shift().map(function (s) { return s.trim(); });
  const col = function (name) { return head.indexOf(name); };
  const iName = col('이름'), iDiff = col('난이도(정수)'), iTag = col('태그'),
        iMat = col('재료'), iUp = col('갱신일'), iCell = col('주소');
  if (iName < 0 || iDiff < 0) throw new Error('열 이름이 예상과 다릅니다: ' + head.join(' | '));

  const controls = [];
  const names = {};
  const noImg = [];
  let blank = 0;
  rows.forEach(function (r) {
    const name = String(r[iName] || '').trim();
    if (!name) { blank++; return; }
    const diff = Number(String(r[iDiff] || '').trim());
    const tags = String(r[iTag] || '').split(/\s+/).filter(function (t) { return t.charAt(0) === '#'; });
    const ids = gifs.byName[nameKey(name)] || [];
    const tip = tips.byName[nameKey(name)] || '';
    if (!ids.length) noImg.push(name);
    controls.push({
      id: 'c' + (controls.length + 1),
      name: name,
      diff: isNaN(diff) ? 0 : diff,
      tags: tags,
      mats: materials(String(r[iMat] || '')),
      updated: String(r[iUp] || '').trim(),
      cell: String(r[iCell] || '').trim(),
      tip: tip,
      imgs: ids.map(gifUrl),
      views: ids.map(gifView)
    });
    names[name] = (names[name] || 0) + 1;
  });

  const counts = {};
  controls.forEach(function (c) { counts[c.diff] = (counts[c.diff] || 0) + 1; });
  const dups = Object.keys(names).filter(function (n) { return names[n] > 1; });
  const withImg = controls.filter(function (c) { return c.imgs.length > 0; }).length;
  const withTip = controls.filter(function (c) { return c.tip.length > 0; }).length;

  const header = '/* 자동 생성 파일 - scripts/sync-controls.js 로 갱신합니다. 직접 수정하지 마세요.\n' +
    ' * 출처: docs.google.com/spreadsheets/d/' + SHEET_ID + ' (탭: 컨트롤 검색, gid ' + GID + ')\n' +
    ' * 컨트롤 ' + controls.length + '개 (그림 ' + withImg + '개) / 난이도 0~10 / 동기화 ' + new Date().toISOString().slice(0, 10) + ' */\n';
  const body = 'window.BL = window.BL || {};\nwindow.BL.controls = ' + JSON.stringify(controls, null, 0)
    .replace(/\},\{/g, '},\n{') + ';\n\n' +
    'window.BL.controlsMeta = ' + JSON.stringify({
      sheetId: SHEET_ID, gid: GID, tab: '컨트롤 검색', count: controls.length, withImg: withImg,
      gifSource: gifs.used ? 'scripts/control-gifs.json' : '없음',
      withTip: withTip,
      tipSource: 'scripts/control-tips.json',
      diffCounts: counts, blankRows: blank, duplicateNames: dups,
      noImgNames: noImg, syncedAt: new Date().toISOString().slice(0, 10)
    }, null, 2) + ';\n';

  fs.writeFileSync(OUT, header + body, 'utf8');
  console.log('저장: ' + OUT);
  console.log('컨트롤 ' + controls.length + '개 (빈 행 ' + blank + '개 건너뜀) / GIF ' + withImg + '개 / 팁 ' + withTip + '개 연결');
  console.log('난이도 분포: ' + Object.keys(counts).sort(function (a, b) { return a - b; })
    .map(function (k) { return k + ':' + counts[k]; }).join(' '));
  console.log('중복 이름: ' + (dups.length ? dups.join(' / ') : '없음'));
  console.log('그림 없는 컨트롤 ' + noImg.length + '개: ' + (noImg.join(' / ') || '없음'));
  console.log('첫 항목: ' + JSON.stringify(controls[0]));
}

main().catch(function (e) { console.error('실패: ' + e.message); process.exit(1); });
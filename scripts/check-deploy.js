/* 배포 전 점검 — 정적 호스팅에 올렸을 때 깨지기 쉬운 것들을 본다.
 * 사용법: npm run check
 * 의존성 없음. */
const fs = require('fs');
const path = require('path');

const PROJ = path.join(__dirname, '..');
const out = [];
let fails = 0;
function t(label, got, want) {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  out.push((ok ? 'OK   ' : 'FAIL ') + label + '  got=' + got + '  want=' + want);
}

/* 파일 이름 대소문자까지 정확히 같은지 (?v=123 같은 캐시 무효화 값은 떼고 본다) */
function exact(rel) {
  let cur = PROJ;
  const parts = String(rel).split('?')[0].split('/');
  for (let i = 0; i < parts.length; i++) {
    if (!fs.existsSync(cur)) return false;
    if (fs.readdirSync(cur).indexOf(parts[i]) < 0) return false;
    cur = path.join(cur, parts[i]);
  }
  return true;
}

/* 1) 화면 파일이 부르는 경로가 실제 파일과 이름까지 같은지 */
const PAGES = ['index.html', 'block-preview.html', 'control-gif-preview.html'];
const refs = [];
const missing = [];
PAGES.forEach(function (page) {
  const html = fs.readFileSync(path.join(PROJ, page), 'utf8');
  [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(function (m) { return m[1]; })
    .filter(function (u) { return !/^(https?:|data:|#|mailto:)/.test(u); })
    .forEach(function (u) {
      refs.push(u);
      if (!exact(u)) missing.push(page + ' → ' + u);
    });
});
t('부르는 파일 이름 일치', missing.join(', ') || '없음', '없음');
out.push('  확인한 참조 ' + refs.length + '개');

/* 2) 서버 주소나 절대경로가 박혀 있지 않은지 (배포하면 깨짐) */
const SITE_FILES = [
  'index.html', 'block-preview.html', 'control-gif-preview.html',
  'css/style.css', 'css/tokens.css',
  'data/site.js', 'data/features.js', 'data/maps.js', 'data/controls.js', 'data/controls-count.js',
  'data/news.js',
  'js/app.js', 'js/lib/dom.js', 'js/lib/icons.js', 'js/lib/storage.js', 'js/lib/rng.js',
  'js/lib/query.js', 'js/lib/color.js', 'js/lib/contact.js', 'js/lib/objects.js',
  'js/lib/supabase.js', 'js/lib/reviews.js', 'js/lib/review-filter.js',
  'js/views/_soon.js', 'js/views/roulette.js', 'js/views/controls.js', 'js/views/colors.js',
  'js/views/rating.js', 'js/views/news.js'
];
const stuck = [];
SITE_FILES.forEach(function (f) {
  const s = fs.readFileSync(path.join(PROJ, f), 'utf8');
  if (/localhost|127\.0\.0\.1/.test(s)) stuck.push(f + '(localhost)');
  if (/(?:src|href)\s*[:=]\s*['"]\/[^'"]+/.test(s)) stuck.push(f + '(절대경로)');
});
t('서버주소·절대경로 없음', stuck.join(', ') || '없음', '없음');

/* 2-2) 화면 파일이 부르는 '외부 스크립트' 가 없는지
 * 외부 CDN 이 멈추면 그 스크립트 뒤에 있는 화면 코드가 통째로 안 돌아서 화면이 비어 버린다.
 * (Supabase SDK 는 평점 화면에서 필요할 때 js/lib/supabase.js 가 직접 받는다.) */
const extScript = [];
PAGES.forEach(function (page) {
  const html = fs.readFileSync(path.join(PROJ, page), 'utf8');
  [...html.matchAll(/<script[^>]+src=\"(https?:[^\"]+)\"/g)].forEach(function (m) {
    extScript.push(page + ' → ' + m[1]);
  });
});
t('외부 스크립트 없음', extScript.join(', ') || '없음', '없음');

/* 2-3) 웹 폰트 CSS 가 화면 그리기를 막지 않는지 (media="print" 로 받고 onload 에서 켠다) */
const fontBlock = [];
PAGES.forEach(function (page) {
  const html = fs.readFileSync(path.join(PROJ, page), 'utf8');
  [...html.matchAll(/<link[^>]+rel=\"stylesheet\"[^>]+href=\"(https?:[^\"]+)\"/g)].forEach(function (m) {
    if (m[0].indexOf('media=\"print\"') < 0) fontBlock.push(page + ' → ' + m[1]);
  });
});
t('웹 폰트 CSS 화면 안 막음', fontBlock.join(', ') || '없음', '없음');

/* 3) 배포에 꼭 있어야 하는 파일 */
const NEED = ['index.html', 'css/tokens.css', 'css/style.css', 'data/site.js', 'data/features.js',
  'data/maps.js', 'data/controls.js', 'data/controls-count.js', 'data/news.js', 'js/app.js',
  'js/views/roulette.js',
  'js/views/controls.js', 'js/views/colors.js', 'js/views/rating.js', 'js/views/news.js',
  'js/lib/icons.js', 'js/lib/objects.js', 'js/lib/reviews.js', 'js/lib/review-filter.js'];
const gone = NEED.filter(function (f) { return !fs.existsSync(path.join(PROJ, f)); });
t('필요한 파일 있음', gone.join(', ') || '없음', '없음');

/* 4) 데이터가 쓸 만한지 (룰렛이 비면 안 되니까) */
global.window = {};
require(path.join(PROJ, 'data', 'controls.js'));
const C = global.window.BL.controls || [];
const M = global.window.BL.controlsMeta || {};
t('컨트롤 개수', C.length, 631);
t('GIF 연결', C.filter(function (c) { return c.imgs.length; }).length, 624);
t('설명 연결', C.filter(function (c) { return c.tip; }).length, 630);
t('난이도 범위 값', C.every(function (c) { return Number.isInteger(c.diff) && c.diff >= 0 && c.diff <= 10; }), true);

/* 4-1) 뉴스 기사 (화면이 목록을 그리려면 id · 제목 · 날짜가 있어야 한다) */
require(path.join(PROJ, 'data', 'news.js'));
const NEWS = global.window.BL.news || [];
const newsBad = NEWS.filter(function (n) { return !n.id || !n.title || !n.date; })
  .map(function (n) { return n.id || '(id 없음)'; });
t('뉴스 기사 id·제목·날짜 있음', newsBad.join(', ') || '없음', '없음');
const newsDup = NEWS.map(function (n) { return n.id; })
  .filter(function (id, i, arr) { return arr.indexOf(id) !== i; });
t('뉴스 기사 id 안 겹침', newsDup.join(', ') || '없음', '없음');

/* 4-2) 맵 목록 (난이도 0 은 룰렛에서 뺐다 — 시트에서 다시 붙여넣을 때 섞여 들어오지 않게 본다) */
require(path.join(PROJ, 'data', 'maps.js'));
const MAPS = global.window.BL.maps || [];
const zero = MAPS.filter(function (m) { return String(m.diff).trim() === '0'; })
  .map(function (m) { return m.name; });
t('난이도 0 맵 없음', zero.join(', ') || '없음', '없음');
out.push('  확인한 맵 ' + MAPS.length + '개');

/* 맵 이름+제작자가 같은 줄이 두 번 들어갔는지 (시트에서 두 번 붙여넣는 사고) */
const seenMap = {}, dupMaps = [];
MAPS.forEach(function (m) {
  const k = m.by + '|' + m.name;
  if (seenMap[k]) dupMaps.push(k);
  seenMap[k] = 1;
});
t('맵 중복 없음', dupMaps.join(', ') || '없음', '없음');

/* 4-3) 첫 화면이 받는 개수 파일이 목록과 맞는지
 *     (홈 숫자는 data/controls-count.js 만 보고 쓰므로, 어긋나면 숫자가 틀린다) */
require(path.join(PROJ, 'data', 'controls-count.js'));
t('컨트롤 개수 파일 일치', global.window.BL.controlsCount, C.length);

/* 4-4) 오브젝트 평점 목록 — id 가 겹치면 리뷰가 한 칸에 섞인다 (서버의 object_id 로 쌓인다) */
const objSrc = fs.readFileSync(path.join(PROJ, 'js', 'lib', 'objects.js'), 'utf8');
const objIds = [...objSrc.matchAll(/\{ id: '([^']+)'/g)].map(function (m) { return m[1]; });
const dupObj = objIds.filter(function (id, i) { return objIds.indexOf(id) !== i; });
t('오브젝트 id 안 겹침', dupObj.join(', ') || '없음', '없음');
out.push('  확인한 오브젝트 ' + objIds.length + '개');

/* 그림 크기 — 화면에는 28~72px 로만 나오므로 40KB 넘는 파일이 들어오면 알려준다 */
const bigImg = fs.readdirSync(path.join(PROJ, 'img')).filter(function (f) {
  return fs.statSync(path.join(PROJ, 'img', f)).size > 40 * 1024;
}).map(function (f) {
  return f + ' ' + Math.round(fs.statSync(path.join(PROJ, 'img', f)).size / 1024) + 'KB';
});
out.push('  그림 40KB 넘는 것: ' + (bigImg.join(', ') || '없음'));

/* 5) 대문자 섞인 파일 이름 (윈도우에서 만들면 실수하기 쉬움) */
const caps = [];
(function walk(dir, rel) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    if (e.name === '.git' || e.name === 'node_modules') return;
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(path.join(dir, e.name), r);
    else if (/[A-Z]/.test(e.name) && e.name !== 'README.md') caps.push(r);
  });
})(PROJ, '');
t('대문자 파일명 없음', caps.join(', ') || '없음', '없음');

/* 6) 기능 그림·오브젝트 그림이 실제로 있는지 (대소문자까지)
 *    그림 경로는 화면 파일이 아니라 icons.js · objects.js 안에 적혀 있어서 따로 본다 */
const IMG_JS = ['js/lib/icons.js', 'js/lib/objects.js'];
const imgRefs = [];
IMG_JS.forEach(function (f) {
  const s = fs.readFileSync(path.join(PROJ, f), 'utf8');
  [...s.matchAll(/'(img\/[^']+)'/g)].forEach(function (m) { imgRefs.push([f, m[1]]); });
});
const noImg = imgRefs.filter(function (r) { return !exact(r[1]); })
  .map(function (r) { return r[0] + ' → ' + r[1]; });
t('그림 파일 있음', noImg.join(', ') || '없음', '없음');
out.push('  확인한 그림 ' + imgRefs.length + '개');

/* 뉴스 목록 카드 그림(thumb)도 실제 파일과 이름이 같은지 (없으면 선화를 쓰므로 비어 있어도 된다) */
const newsImgs = NEWS.map(function (n) { return n.thumb; }).filter(Boolean);
const noNewsImg = newsImgs.filter(function (p) { return !exact(p); });
t('뉴스 그림 파일 있음', noNewsImg.join(', ') || '없음', '없음');
out.push('  확인한 뉴스 그림 ' + newsImgs.length + '개');

t('fails', fails, 0);
console.log(out.join('\n'));
if (fails) process.exit(1);

/* 바뀐 파일을 커밋하고 GitHub 에 올린다.
 * 사용법: npm run save              (커밋 메시지 자동)
 *         npm run save -- "메시지"   (메시지 직접)
 * 의존성 없음. */
const { execSync } = require('child_process');
const path = require('path');

const fs = require('fs');
const ROOT = path.join(__dirname, '..');

/* ── 1) 캐시 무효화 ──────────────────────────────
 * GitHub Pages 는 max-age=600(10분)으로 파일을 보내서, 새로 배포해도
 * 브라우저가 예전 CSS/JS 를 계속 쓴다. 주소에 ?v=시각 을 붙이면 매번 새 주소가 되어
 * 배포 후 일반 새로고침만으로 최신 파일을 받는다. */
const STAMP = String(Date.now());
let stamped = 0;
['index.html', 'block-preview.html', 'control-gif-preview.html'].forEach(function (file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace(/((?:href|src)="(?:css|js|data)\/[^"?]+)(?:\?v=\d+)?(")/g, '$1?v=' + STAMP + '$2');
  if (after !== before) { fs.writeFileSync(p, after, 'utf8'); stamped++; }
});
console.log('캐시 무효화 ?v=' + STAMP + ' (파일 ' + stamped + '개)');


function git(cmd) {
  return execSync('git ' + cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function tryGit(cmd) {
  try { return { ok: true, text: git(cmd) }; }
  catch (e) { return { ok: false, text: String((e.stdout || '') + (e.stderr || e.message)).trim() }; }
}

const changes = git('status --porcelain');

if (!changes) {
  console.log('바뀐 파일이 없습니다.');
  const st = tryGit('status -sb');
  console.log('브랜치: ' + (st.text.split('\n')[0] || '?'));
  const push = tryGit('push');
  console.log(push.ok ? '원격도 최신입니다.' : '푸시 실패: ' + push.text);
  process.exit(push.ok ? 0 : 1);
}

console.log('바뀐 파일:');
console.log(changes);
git('add -A');

const msg = process.argv.slice(2).join(' ').trim() ||
  ('저장: ' + new Date().toLocaleString('ko-KR'));
const commit = tryGit('commit -m "' + msg.replace(/"/g, "'") + '"');
console.log(commit.ok ? commit.text.split('\n')[0] : '커밋 실패: ' + commit.text);

const push = tryGit('push');
if (push.ok) console.log(push.text || '푸시 완료 (1~2분 뒤 사이트에 반영)');
else console.log('푸시 실패: ' + push.text + '\n→ 터미널에서 git push 를 한 번 직접 실행해 주세요.');

process.exit(push.ok ? 0 : 1);

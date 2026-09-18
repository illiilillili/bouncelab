/* 지금 상태를 이름 붙은 스냅샷(태그)으로 남기고 GitHub 에도 올린다.
 * 사용법: npm run tag                 (남겨 둔 시점 목록 보기)
 *         npm run tag -- "저장3"      (지금 상태를 저장3 으로 남기기)
 *
 * 태그는 커밋과 달리 저절로 움직이지 않아서, 나중에 그 시점 파일을 그대로 꺼낼 수 있다.
 * 되돌리는 법은 README 의 '저장 시점 (스냅샷)' 참고. 의존성 없음. */
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
/* 이름에는 한글 · 영문 · 숫자 · - _ . 만 (git 이름 규칙 + 터미널에서 안전한 문자) */
const NAME_RE = /^[0-9A-Za-z가-힣._-]+$/;
/* 태그마다 이름 · 날짜 · 메시지 첫 줄 */
const FMT = '--format=%(refname:short)|%(creatordate:short)|%(subject)';

/* cmd 를 거치지 않고 git 을 바로 실행한다
 * (한글 이름과 % ^ 문자를 cmd 가 건드리지 않게) */
function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit']
  }).trim();
}
function tryGit(args) {
  try { return { ok: true, text: git(args) }; }
  catch (e) { return { ok: false, text: String((e.stdout || '') + (e.message || '')).trim() }; }
}

function snapshots() {
  const out = tryGit(['for-each-ref', '--sort=-creatordate', FMT, 'refs/tags']);
  if (!out.ok) return [];
  return out.text.split('\n').filter(Boolean).map(function (line) {
    const parts = line.split('|');
    return { name: parts[0], date: parts[1], subject: (parts[2] || '').replace(/\s+/g, ' ') };
  });
}

function list() {
  const tags = snapshots();
  if (!tags.length) {
    console.log('남겨 둔 시점이 없습니다.');
    return;
  }
  console.log('남겨 둔 시점 ' + tags.length + '개 (최근 순):');
  tags.forEach(function (t) {
    const behind = tryGit(['rev-list', '--count', t.name + '..HEAD']);
    const cnt = behind.ok ? behind.text : '?';
    console.log('  ' + t.name + '   ' + t.date + '   ' +
      (cnt === '0' ? '지금과 같은 시점' : '이후 커밋 ' + cnt + '개'));
    if (t.subject) console.log('      ' + t.subject);
  });
}

function nameProblem(name) {
  if (!NAME_RE.test(name)) return '한글 · 영문 · 숫자 · - _ . 만 쓸 수 있습니다.';
  if (name.charAt(0) === '-' || name.charAt(0) === '.') return '맨 앞에는 - 나 . 을 쓸 수 없습니다.';
  if (/\.$/.test(name) || name.indexOf('..') >= 0) return '마지막에 . 을 쓰거나 .. 을 넣을 수 없습니다.';
  return '';
}

function save(name) {
  const bad = nameProblem(name);
  if (bad) {
    console.log('이름 "' + name + '" 을 쓸 수 없습니다. ' + bad + ' (예: 저장3)');
    process.exit(1);
  }

  const there = tryGit(['rev-parse', '--verify', '--quiet', 'refs/tags/' + name]);
  if (there.ok) {
    console.log('"' + name + '" 은 이미 있습니다. 다른 이름을 쓰세요. (예: 저장3)');
    console.log('그 시점으로 돌아가려면: git checkout "' + name + '" -- .');
    process.exit(1);
  }

  const dirty = git(['status', '--porcelain']);
  if (dirty) {
    console.log('아직 저장하지 않은 변경이 있어서 지금 상태를 남길 수 없습니다.');
    console.log('먼저 npm run save 로 저장해 주세요. 바뀐 파일:');
    console.log(dirty);
    process.exit(1);
  }

  const head = git(['log', '-1', '--format=%h %s']);
  const msg = ['저장 시점: ' + name, new Date().toLocaleString('ko-KR') + ' · 커밋 ' + head,
    '(npm run tag 로 남긴 스냅샷)'].join('\n');

  const made = tryGit(['tag', '-a', name, '-m', msg]);
  if (!made.ok) {
    console.log('태그를 만들지 못했습니다: ' + made.text);
    process.exit(1);
  }
  console.log('"' + name + '" 을 만들었습니다 (' + head + ')');

  const push = tryGit(['push', 'origin', name]);
  if (push.ok) console.log('GitHub 에도 올렸습니다 ' + (push.text || ''));
  else console.log('푸시 실패: ' + push.text + '\n→ 터미널에서 git push origin "' + name + '" 를 한 번 직접 실행해 주세요.');

  console.log('');
  console.log('나중에 불러오는 법');
  console.log('  그때 파일로 되돌리기   git checkout "' + name + '" -- .   그 뒤 npm run save');
  console.log('  그때로 새 브랜치       git checkout -b 복원-' + name + ' "' + name + '"');
  console.log('  바뀐 것만 보기         git diff "' + name + '"');
  console.log('  목록 보기              npm run tag');
  process.exit(push.ok ? 0 : 1);
}

const args = process.argv.slice(2).filter(function (a) { return a !== '--'; }).join(' ').trim();

if (!args) {
  list();
  console.log('');
  console.log('지금 상태를 남기려면: npm run tag -- "저장3"');
} else if (args === 'help' || args === '--help' || args === '-h') {
  console.log('사용법: npm run tag                (남겨 둔 시점 목록)');
  console.log('        npm run tag -- "저장3"     (지금 상태를 저장3 으로 남기기)');
} else {
  save(args);
}

# 바운스랩 (BounceLab)

## 지금 있는 것

- **맵 룰렛** — 슬롯 롤링으로 맵 하나 뽑기. 난이도 범위 필터, 결과 복사, 전체 맵 목록 보기
- **랜덤 컨트롤 룰렛** — 바운스볼 도감 컨트롤 631개 중 하나 뽑기. 난이도 범위 필터, 태그·재료·설명(팁), 컨트롤 움짤(도감 DB 의 드라이브 GIF)
- **랜덤 색상 추천** — 맵 에디터용 HSV 색 뽑기 (H·S·V 각 0~39 인덱스, HEX·RGB 표시)
- **오브젝트 평점** — 별 · 공 오브젝트를 골라 별점(1~5) 매기기. 주소는 `#/f/rating`, 평점 매기는 창은 `#/f/rating/star` · `#/f/rating/ball`. 평점은 브라우저에만 저장

홈은 **히어로**(제목 · 한 줄 설명 · 숫자 한 줄)와 기능 카드로 그려집니다. 둘 다 `js/app.js` 가 `data/features.js` 를 읽어 만듭니다.
카드에는 **그림 · 이름 · 한 줄 설명**(`features.desc`)이 나옵니다. 개수 같은 수치 줄은 카드에 두지 않고 히어로의 숫자 줄 하나로 모읍니다.
카드 아이콘 칩은 중립 1색이고, 기능 색은 **hover 테두리에서만** 드러납니다(`css/style.css` 의 `.item--<기능 id>` 안 `--hover`).
그림은 `js/lib/icons.js` 의 `art()` 가 `img/` 안의 파일을 그대로 씁니다.
그림을 바꾸려면 코드가 아니라 `img/` 안의 파일을 바꾸면 됩니다.

## 화면 규칙 (UI)

고칠 때 지킬 것 — 요소를 늘리기보다 정리하는 쪽이 기본입니다.

- 면은 3단계만: 페이지 배경 / 카드(`--sh-2`) / 인셋(`--surface`, 그림자 없음)
- 그림자 2단계(`--sh-2` · `--sh-3`), 그라디언트는 페이지 배경 하나뿐 (색 타일 안의 명암은 그림 내용)
- 보라(`--brand`)는 ① 주 CTA ② 활성 상태 ③ 링크 ④ 포커스 링 — 이 네 곳에만
- 앰버(`--amber`)는 ① 난이도 막대 ② `준비 중` 표시 — 이 두 곳에만
- 라운드 3종(버튼 12 · 카드 16 · 알약 999), 간격 6종(`--sp-1`~`--sp-6`), 글자 단계는 15.5(본문) · 14.5(보조) · 13.5(메타) · 12.5(작은 값) · 11(최소 라벨)
- 전환 효과는 hover 에만. 등장 애니메이션·바운스·블러·글로우는 넣지 않습니다
- `--reel-h`(58px)는 `js/views/*.js` 의 `ITEM_H` 와 짝이라 따로 바꾸지 않습니다

## 실행

- index.html 을 브라우저로 열기
- 서버로 띄우려면: npm start → http://localhost:3000
- 밖에서 접속하게 하려면: ngrok http 3000
- 컨트롤 목록 갱신: npm run sync:controls (도감 시트 → data/controls.js)
- 배포 전 점검: npm run check (파일 이름 대소문자 · 절대경로 · 데이터 상태)
- 바뀐 내용 저장(커밋+푸시): npm run save   (또는 npm run save -- "메시지")

## 저장 시점 (스냅샷)

중요한 시점은 이름을 붙여 태그로 남깁니다. 태그는 커밋과 달리 저절로 움직이지 않고 GitHub 에도 함께 올라가서, 몇 달 뒤에도 그때 파일을 그대로 꺼낼 수 있습니다.

- 남겨 둔 시점 목록: npm run tag
- 지금 상태 남기기: npm run tag -- "저장3"   (이름은 한글 · 영문 · 숫자 · `-_.` 만. 저장 안 된 변경이 있으면 먼저 npm run save)
- 그때 파일로 되돌리기: `git checkout "저장2" -- .` → 그 뒤 `npm run save` (아직 저장 안 한 변경은 사라집니다)
- 그때로 새 브랜치에서 둘러보기: `git checkout -b 복원2 "저장2"` (끝나면 `git checkout master`)
- 다른 기기에서 태그 받기: `git fetch --tags` / GitHub 저장소 화면의 Tags 목록에서도 받을 수 있습니다

예: `저장1`(git 저장 도구를 만든 시점) · `저장2`(홈 카드 · 룰렛 정리)

## 배포 (다른 기기에서 쓰기)

정적 사이트라 **서버가 필요 없습니다.** 폴더를 그대로 올리면 끝입니다 (빌드 과정 없음).

- 올릴 것: 이 폴더 전체 (`index.html`, `control-gif-preview.html`, `css/`, `data/`, `js/`)
- 정적 호스팅이면 아무 데나 됨: GitHub Pages · Netlify · Cloudflare Pages · Vercel 등
- 올리기 전에 `npm run check` 한 번 (배포에서 깨지기 쉬운 것들을 봐줍니다)
- `server.js` · `package.json` 은 내 PC 확인용, `scripts/` 는 도감 데이터를 새로 받을 때만 씁니다
- 움짤은 도감 DB 의 드라이브 주소를 그대로 불러옵니다 → 인터넷 필요(막히면 색 타일로 표시)
- 폰에서는 움짤 1개가 1MB가 넘으니 와이파이 권장

## 파일 구조

    bouncelab/
      index.html            화면 틀 (상단바 · 본문 · 푸터)
      block-preview.html    블록 모양 예시 페이지 (확인용, 지워도 됨)
      control-gif-preview.html  컨트롤 움짤 예시 페이지 (확인용, 지워도 됨)
      css/tokens.css        색 · 폰트 · 간격 변수
      css/style.css         레이아웃과 컴포넌트
      data/site.js          사이트 이름 · 버전
      data/features.js      기능 목록 (이름 · 주소 · 홈 카드 그림)
      data/maps.js          맵 목록 (제작자 · 제목 · 난이도)
      js/lib/dom.js         DOM 조각 만들기
      js/lib/icons.js       선화 아이콘 + 기능 그림 파일 경로
      js/lib/objects.js     오브젝트 평점 대상 (이름 · 그림)
      js/lib/storage.js     localStorage 래퍼
      js/lib/rng.js         뽑기 난수 (pick · shuffle)
      js/lib/query.js       난이도 랭크 · 필터 (순수 함수)
      js/views/_soon.js     준비 중 화면
      js/views/roulette.js  맵 룰렛 화면
      js/views/controls.js  랜덤 컨트롤 룰렛 화면
      js/views/rating.js    오브젝트 평점 화면 (오브젝트 고르기 · 평점 매기는 창)
      js/app.js             해시 라우팅 (#/ · #/f/<id> · #/f/<id>/<안쪽 화면>) · 화면 렌더
      data/controls.js      컨트롤 목록 (도감 시트에서 자동 생성)
      scripts/sync-controls.js   도감 시트 → data/controls.js
      scripts/control-gifs.json  컨트롤 이름 → 드라이브 GIF 파일ID
      scripts/control-tips.json  컨트롤 이름 → 설명(팁)
      scripts/check-deploy.js    배포 전 점검 (npm run check)
      scripts/save.js            커밋+푸시 한 번에 (npm run save)
      scripts/tag.js             저장 시점(스냅샷) 태그 만들기 (npm run tag)
      server.js             정적 서버 (의존성 없음)
      package.json

## 색상 규칙 (맵 에디터 HSV)

H·S·V 모두 0~39 인덱스(40단계), 조합은 40 x 40 x 40 = 64,000 가지입니다.

- H(도) = 인덱스 x 9.0          (0 ~ 351도, 9도 간격)
- S(%) = 인덱스 x 100/39        (0 ~ 100%, 약 2.5641% 간격)
- V(%) = 인덱스 x 100/39        (0 ~ 100%, 약 2.5641% 간격)

화면에는 인덱스와 변환값, HEX(#RRGGBB), RGB 를 함께 보여줍니다.
반올림 때문에 HEX 가 겹치는 조합이 있어서(64,000개 중 서로 다른 HEX 는 55,780개)
색을 정확히 재현하려면 인덱스 값을 쓰는 게 안전합니다.

## 맵 데이터 넣는 법

스프레드시트에서 `제작자 · 맵제목 · 난이도` 3열을 복사해서 `data/maps.js` 항목 형식에 맞춰 넣으면 됩니다.
난이도는 숫자든 `15+` · `R` 같은 문자열이든 그대로 씁니다.

    { by: "scrapafton", name: "Hellkite", diff: "6" }

해시태그(`tags`)는 데이터 자리만 남겨 뒀습니다 — 넣어도 지금은 화면에 거르는 칸이 없습니다.
(나중에 태그가 쌓이면 룰렛 필터를 다시 붙입니다. `js/lib/query.js` 의 `filter` · `tagsOf` 가 그대로 읽습니다.)

    { by: "scrapafton", name: "Hellkite", diff: "6", tags: ["오토맵", "퍼즐"] }

## 저장되는 것

브라우저 localStorage(bl: 접두사)에만 저장되고 서버로 보내지 않습니다.

- `bl:roulette.filters` — 난이도 범위
- `bl:controls.filters` — 컨트롤 룰렛 난이도 범위
- `bl:rating.<오브젝트>` — 오브젝트 평점 (예: `bl:rating.star`, `bl:rating.ball`)

## 자료 출처

컨트롤 이름·난이도·태그·재료·설명(팁)·움짤은 **바운스볼 도감**(스프레드시트)에서 가져옵니다.
움짤은 도감 DB 시트의 gif 칸에 걸린 드라이브 GIF 주소를 그대로 불러오고, 권리는 원작자와 도감 제작자에게 있습니다.
# 바운스랩 (BounceLab)

바운스볼 하면서 쓰려고 만든 도구 모음. 설치도 빌드도 없이 브라우저에서 바로 돌아갑니다.

## 지금 있는 것

- **맵 룰렛** — 슬롯 롤링으로 맵 하나 뽑기. 난이도 범위·해시태그 필터, 결과 복사, 전체 맵 목록 보기
- **랜덤 컨트롤 룰렛** — 바운스볼 도감 컨트롤 631개 중 하나 뽑기. 난이도 범위 필터, 태그·재료·설명(팁), 컨트롤 움짤(도감 DB 의 드라이브 GIF)
- **랜덤 색상 추천** — 맵 에디터용 HSV 색 뽑기 (H·S·V 각 0~39 인덱스, HEX·RGB 표시)

## 실행

- index.html 을 브라우저로 열기
- 서버로 띄우려면: npm start → http://localhost:3000
- 밖에서 접속하게 하려면: ngrok http 3000
- 컨트롤 목록 갱신: npm run sync:controls (도감 시트 → data/controls.js)
- 배포 전 점검: npm run check (파일 이름 대소문자 · 절대경로 · 데이터 상태)

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
      data/features.js      기능 목록 (화면과 주소가 여기서 나옴)
      data/maps.js          맵 목록 (제작자 · 제목 · 난이도)
      js/lib/dom.js         DOM 조각 만들기
      js/lib/icons.js       아이콘 SVG
      js/lib/storage.js     localStorage 래퍼
      js/lib/rng.js         뽑기 난수 (pick · shuffle)
      js/lib/query.js       난이도 랭크 · 필터 (순수 함수)
      js/views/_soon.js     준비 중 화면
      js/views/roulette.js  맵 룰렛 화면
      js/views/controls.js  랜덤 컨트롤 룰렛 화면
      data/controls.js      컨트롤 목록 (도감 시트에서 자동 생성)
      scripts/sync-controls.js   도감 시트 → data/controls.js
      scripts/control-gifs.json  컨트롤 이름 → 드라이브 GIF 파일ID
      scripts/control-tips.json  컨트롤 이름 → 설명(팁)
      scripts/check-deploy.js    배포 전 점검 (npm run check)
      js/app.js             해시 라우팅 · 화면 렌더
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

해시태그는 나중에 붙일 수 있습니다. `tags` 를 넣으면 룰렛 화면의 해시태그 필터에 자동으로 나옵니다.

    { by: "scrapafton", name: "Hellkite", diff: "6", tags: ["오토맵", "퍼즐"] }

## 저장되는 것

브라우저 localStorage(bl: 접두사)에만 저장되고 서버로 보내지 않습니다.

- `bl:roulette.filters` — 난이도 범위와 고른 해시태그
- `bl:controls.filters` — 컨트롤 룰렛 난이도 범위

## 자료 출처

컨트롤 이름·난이도·태그·재료·설명(팁)·움짤은 **바운스볼 도감**(스프레드시트)에서 가져옵니다.
움짤은 도감 DB 시트의 gif 칸에 걸린 드라이브 GIF 주소를 그대로 불러오고, 권리는 원작자와 도감 제작자에게 있습니다.
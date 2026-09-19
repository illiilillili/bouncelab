# 바운스랩 (BounceLab)

## 지금 있는 것

- **맵 룰렛** — 슬롯 롤링으로 맵 하나 뽑기. 난이도 범위 필터, 결과 복사, 전체 맵 목록 보기
- **랜덤 컨트롤 룰렛** — 바운스볼 도감 컨트롤 631개 중 하나 뽑기. 난이도 범위 필터, 태그·재료·설명(팁), 컨트롤 움짤(도감 DB 의 드라이브 GIF)
- **랜덤 색상 추천** — 맵 에디터용 HSV 색 뽑기 (H·S·V 각 0~39 인덱스, HEX·RGB 표시)
- **오브젝트 평점 (리뷰)** — 별 · 공 오브젝트에 별점(1~5)과 리뷰(50자)를 남기고, 모두가 남긴 리뷰와 평균 별점을 봅니다. 주소는 `#/f/rating`, 쓰고 보는 창은 `#/f/rating/star` · `#/f/rating/ball`. 리뷰는 Supabase 에 쌓여 닉네임과 함께 공개됩니다. 내가 쓴 리뷰는 직접 지울 수 있습니다

홈은 **히어로**(제목 · 한 줄 설명 · 숫자 한 줄) · 기능 카드 · 맨 아래 **문의하기 버튼**(설명 없이 하나만)으로 그려집니다. 카드는 `js/app.js` 가 `data/features.js` 를 읽어 만듭니다. 문의하기가 보낼 곳은 `data/site.js` 의 `contact` 에서 채우고, 지금은 임시로 `-메일-` 만 복사합니다.
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
      js/lib/objects.js     오브젝트 리뷰 대상 (이름 · 그림)
      js/lib/storage.js     localStorage 래퍼
      js/lib/supabase.js    Supabase 연결 (익명 리뷰 저장소)
      js/lib/reviews.js     리뷰 읽기 · 쓰기 · 검증 · 집계
      js/lib/review-filter.js  리뷰 검열 (금지어 · 연락처 · 광고)
      js/lib/rng.js         뽑기 난수 (pick · shuffle)
      js/lib/query.js       난이도 랭크 · 필터 (순수 함수)
      js/views/_soon.js     준비 중 화면
      js/views/roulette.js  맵 룰렛 화면
      js/views/controls.js  랜덤 컨트롤 룰렛 화면
      js/views/rating.js    오브젝트 리뷰 화면 (고르기 · 최종 평점 · 작성 폼 · 리뷰 목록)
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

브라우저 localStorage(bl: 접두사)에 저장됩니다.

- `bl:roulette.filters` — 난이도 범위
- `bl:controls.filters` — 컨트롤 룰렛 난이도 범위
- `bl:reviews.nick` — 마지막으로 쓴 닉네임 (다음에 미리 채워 둔다)
- `bl:reviews.mine` — 이 브라우저가 남긴 리뷰 id (목록에 `내 리뷰` 표시)
- `bl:reviews.cache.<오브젝트>` — 마지막으로 받아 둔 리뷰 목록 (서버가 안 될 때 이걸 보여줍니다)
- `sb-…-auth-token` — Supabase 가 넣어 두는 **익명 신분**. 내 리뷰 판정과 삭제 권한이 이 신분에 묶여 있습니다. 지우면 내 리뷰를 못 지웁니다(관리자는 대시보드에서 삭제)
- `bl:rating.<오브젝트>` — 예전에 별점만 매겨 둔 값. 리뷰를 남기면 초기 별점으로만 쓰고 지웁니다

**오브젝트 리뷰만 서버(Supabase)로 갑니다.** 별점 · 닉네임 · 리뷰 내용이 `reviews` 표에 저장되어 누구나 봅니다(닉네임 공개). 나머지 값은 브라우저 밖으로 나가지 않습니다.

## 익명 리뷰 저장소 (Supabase)

`js/lib/supabase.js` 가 `data/site.js` 의 `reviews` 설정으로 연결만 만들고, `js/lib/reviews.js` 가 읽기 · 쓰기 · 검증 · 집계를 맡습니다. 화면(`js/views/rating.js`)은 이 둘만 부릅니다.

**먼저 켜야 하는 것 (한 번만)** : 대시보드 → Authentication → Sign In / Providers → `Anonymous sign-ins` 켜기.
그러면 방문자마다 서버가 인정하는 고유 신분(`auth.uid()`)이 조용히 하나 생깁니다. 사용자는 아무것도 입력하지 않습니다.

- 표 `reviews` : `object_id`(별 · 공) · `stars`(1~5) · `nickname`(1~12자) · `body`(1~50자) · `created_at` · `user_id`(익명 신분)
- 내 리뷰 : 목록에 `내 리뷰` 로 표시되고 **직접 지울 수 있습니다**. 지우기는 서버가 `user_id` 를 보고 내 것일 때만 허용합니다(남의 리뷰는 0건 처리)
- 한계 : 브라우저 저장소를 지우거나 다른 기기로 들어가면 신분이 새로 생겨 **내 리뷰를 못 지웁니다**(리뷰는 그대로 남고, 관리자가 대시보드에서 지울 수 있습니다)
- 빈 값(공백만 포함)은 저장되지 않습니다 — 서버 check 제약과 화면 검증이 같은 규칙입니다
- 권한(RLS) : 읽기와 새 글쓰기는 누구나, 삭제 · 수정은 **내 신분(`user_id`)의 리뷰만**. 스팸은 대시보드 Table Editor 에서 지웁니다
- `url` · `key` 는 공개되어도 되는 anon(publishable) 키입니다. 비밀 키(service_role)는 넣지 마세요
- 무료 플랜은 오래(약 7일) 접속이 없으면 프로젝트가 잠시 멈출 수 있습니다. 그때는 대시보드에서 Restore 하면 되고, 사이트는 마지막으로 받아 둔 목록을 보여주며 안내를 띄웁니다
- 표를 다시 만들 때 (대시보드 → SQL Editor) :

      drop table if exists public.reviews cascade;
      create table public.reviews (
        id         bigint generated by default as identity primary key,
        object_id  text     not null check (char_length(object_id) between 1 and 40),
        stars      smallint not null check (stars between 1 and 5),
        nickname   text     not null check (char_length(btrim(nickname)) between 1 and 12),
        body       text     not null check (char_length(btrim(body)) between 1 and 50),
        created_at timestamptz not null default now(),
        user_id    uuid     default auth.uid()
      );
      create index reviews_object_idx on public.reviews (object_id, created_at desc);
      create index reviews_user_idx   on public.reviews (user_id);
      alter table public.reviews enable row level security;
      create policy "리뷰 읽기"    on public.reviews for select to anon, authenticated using (true);
      create policy "리뷰 쓰기"    on public.reviews for insert to anon, authenticated with check (user_id = auth.uid());
      create policy "내 리뷰 삭제" on public.reviews for delete to anon, authenticated using (user_id = auth.uid());
      create policy "내 리뷰 수정" on public.reviews for update to anon, authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

- 이미 표를 만들어 둔 경우 (이번에 바뀐 부분만) :

      alter table public.reviews add column if not exists user_id uuid default auth.uid();
      create index if not exists reviews_user_idx on public.reviews (user_id);
      drop policy if exists "리뷰 읽기" on public.reviews;
      drop policy if exists "리뷰 쓰기" on public.reviews;
      create policy "리뷰 읽기"    on public.reviews for select to anon, authenticated using (true);
      create policy "리뷰 쓰기"    on public.reviews for insert to anon, authenticated with check (user_id = auth.uid());
      create policy "내 리뷰 삭제" on public.reviews for delete to anon, authenticated using (user_id = auth.uid());
      create policy "내 리뷰 수정" on public.reviews for update to anon, authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

## 리뷰 검열 (금지어 · 연락처 · 광고)

리뷰를 저장하기 전에 `js/lib/review-filter.js` 가 내용을 검사합니다(닉네임도 같이 검사). 목록과 규칙은 그 파일 한 곳에 모여 있습니다.

- 금지어 6묶음 : 욕설 · 성적 표현 · 혐오 · 위협 · 도박 · 광고 (`PROFANITY` `SEXUAL` `HATE` `THREAT` `GAMBLING` `AD`)
- 우회 대응 : 검사 전에 공백·특수문자를 지우고 같은 글자 반복을 하나로 줄입니다 → `씨.발` `씨 발` `씨-발` `씨***발` `ㅅㅂ` `ㅆㅂ` `개-새-끼` `ㅄ` `ㅈㄴ` 모두 걸립니다. 모음을 끼워 넣는 `시이이발` 은 변형 단어(`씨이발` `시이발`)로 대응합니다
- 봐주는 단어(`ALLOW`) : `시발점` `시발역` `꺼져있` `꺼져서` `자위권` `자위대` `아이디어` — 검사 전에 지웁니다(정상 문장 오탐 방지)
- 개인정보 패턴 : 전화번호 · 이메일 · URL · `discord.gg/…` · `open.kakao.com/…` · `@아이디` — 문맥과 상관없이 차단
- 외부 연락 : 플랫폼 이름(`디스코드` `디코` `카톡` `유튜브` …)은 **그 단어만으로는 차단하지 않습니다.** 플랫폼 이름 + 연락 유도어(`연락` `쪽지` `번호` `아이디` …) 이거나 이름 바로 뒤에 아이디 같은 글자가 붙을 때만 차단합니다
  - 통과 : `이 게임 디코에서도 유명하던데` / 차단 : `디코로 연락하세요` · `내 디코 아이디는 ABC123`
- 화면 문구 3종 : 부적절한 표현 / 연락 유도 / 전화·이메일·링크 (어떤 단어가 걸렸는지는 알려주지 않습니다 — 알려주면 그 단어만 피해가는 우회가 쉬워짐)
- 한계 : 화면(클라이언트)에서 검사하므로 화면을 거치지 않고 API 를 직접 부르면 건너뛸 수 있습니다. 같은 규칙을 서버(DB)에도 넣으려면 표·정책 추가가 필요합니다

## 자료 출처

컨트롤 이름·난이도·태그·재료·설명(팁)·움짤은 **바운스볼 도감**(스프레드시트)에서 가져옵니다.
움짤은 도감 DB 시트의 gif 칸에 걸린 드라이브 GIF 주소를 그대로 불러오고, 권리는 원작자와 도감 제작자에게 있습니다.
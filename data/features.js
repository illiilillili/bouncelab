/* 기능 목록. 화면이 전부 이 배열 하나를 읽는다.
 *
 * status     soon = 아직 안 만든 기능 / ready = 동작함
 * secret     아직 열지 않을 기능. 화면에는 ??? 로만 나오고 눌러도 아무 일 없음
 * needsData  맵 이름처럼 알려줘야 하는 값이 필요한 기능
 */
window.BL = window.BL || {};
window.BL.features = [
  { id: 'roulette', name: '맵 룰렛',
    desc: '무작위로 맵 하나 뽑기. 난이도·해시태그 필터', status: 'ready' },

  { id: 'missions', name: '랜덤 미션', desc: '조건 붙여서 뽑기', secret: true },
  { id: 'picker', name: '순서 뽑기', desc: '순서·팀 나누기', secret: true },
  { id: 'objects', name: '랜덤 장애물 조합', desc: '맵 요소 조합', secret: true },
  { id: 'colors', name: '랜덤 색상 추천', desc: 'HSV 40단계로 색 뽑기. HEX·RGB 표시', status: 'ready' },
  { id: 'colorset', name: '블록 색 세트', desc: '월드별 색 세트', secret: true },
  { id: 'progress', name: '진행도 체크리스트', desc: '클리어 상태 기록', secret: true },
  { id: 'timer', name: '스테이지 타이머', desc: '시간·사망 횟수', secret: true },
  { id: 'stats', name: '뽑기 기록·통계', desc: '뽑힌 결과 모아보기', secret: true },
  { id: 'backup', name: '세이브 백업/복원', desc: '내보내기·불러오기', secret: true },
  { id: 'codex', name: '오브젝트 사전', desc: '블록·아이템 설명', secret: true },
  { id: 'help', name: '도움말·단축키', desc: '사용법', secret: true },
  { id: 'about', name: '사이트 정보', desc: '버전·변경 내역', secret: true }
];
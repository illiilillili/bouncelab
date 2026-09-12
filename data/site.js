/* BounceLab 사이트 기본 정보 */
window.BL = window.BL || {};
window.BL.site = {
  id: 'bouncelab',
  nameKo: '바운스랩',
  nameEn: 'BounceLab',
  version: '0.1.0',
  storagePrefix: 'bl:',

  /* 문의하기 (맵 삭제·오타 제보)
     href 에 오픈채팅·디스코드·구글폼 주소를 넣으면 그 링크로 열립니다.
     mail 에 주소를 넣으면 메일 쓰기로 열립니다.
     둘 다 비어 있으면 맵 정보가 들어간 문의 양식을 클립보드로 복사합니다. */
  contact: {
    label: '문의하기',
    hint: '맵이 삭제되었거나 오타가 있나요?',
    href: '',
    mail: ''
  }
};
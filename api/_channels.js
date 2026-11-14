// 기타 자료 › 영상 자료 — 「최신 소방 영상」에 모으는 소방 기관 YouTube 채널
//  · id: 채널 ID(UC…) — 확인일 2026-11-14 (YouTube 채널 정보란 문구·누리집 연결로 기관 채널임을 확인)
//  · pin: true → 화면 맨 위 별도 줄로 표시
//  · 채널 추가: 한 줄 추가(채널 페이지 주소 /channel/UC… 또는 정보란에서 ID 확인)
//  · 쇼츠 제외: 각 채널의 「동영상」 재생목록(UULF + ID의 UC 뒤 부분)만 읽음
const CHANNELS = [
  { id: "UCvjJRJMM3-D185kjY6TaX0w", name: "119안방", org: "경북소방본부", g: "본부", pin: true },

  { id: "UCbPBCZhgG_kX_1Wb0cdu5lw", name: "소방청TV", org: "소방청", g: "소방청" },
  { id: "UC6sMQzBMSAciQKVtRTyY38g", name: "국립소방연구원", org: "소방청 국립소방연구원", g: "소방청" },
  { id: "UC-1Jfg0IOcuI54dBkvzvlFg", name: "NFSA 중앙소방학교", org: "소방청 중앙소방학교", g: "소방청" },
  { id: "UCxxWnGhFgJOzsNOwYSHN5cQ", name: "한국소방안전원", org: "한국소방안전원", g: "소방청" },

  { id: "UC0oWTzsS84bT3XaAhiDEw8w", name: "서울소방", org: "서울소방재난본부", g: "본부" },
  { id: "UCk8ljWWRskaE32IRqzhP6bw", name: "119부산", org: "부산소방재난본부", g: "본부" },
  { id: "UCxy7UGrUoM_VhX6FNT_y6Rg", name: "대구소방", org: "대구소방안전본부", g: "본부" },
  { id: "UCMlCCkRKn-6-7GDIvakeCeQ", name: "인천소방TV", org: "인천소방본부", g: "본부" },
  { id: "UCcV-rvqGamKnUQ7HtNaspRg", name: "이웃집소방관", org: "전남광주통합소방본부", g: "본부" },
  { id: "UCDqCZqRejTqJ8gkAMM8UGpw", name: "전남권역부본부", org: "전남광주통합소방본부 전남권역부본부", g: "본부" },
  { id: "UCarN2pCE1mxm4t1KQEHrXqA", name: "안전해U", org: "대전소방본부", g: "본부" },
  { id: "UCw82au7IEB2dvRTwKsxMnUg", name: "울산소방본부", org: "울산소방본부", g: "본부" },
  { id: "UC4345EpJGf3Qj18aSS9xnCA", name: "금화도감TV", org: "세종소방본부", g: "본부" },
  { id: "UC6mmbwPsf3O4ANC9R2kDEeQ", name: "경기도소방재난본부", org: "경기도소방재난본부", g: "본부" },
  { id: "UCbXAHxjawIRP4ngCVh3e0Yg", name: "강원소방", org: "강원특별자치도 소방본부", g: "본부" },
  { id: "UCuqyCAjd4lg5hUG_kDbsZOg", name: "충북소방본부", org: "충북소방본부", g: "본부" },
  { id: "UCFggee26wbKY9tEx8FjtJig", name: "충남소방본부", org: "충남소방본부", g: "본부" },
  { id: "UCrqrdYjvlf657TsFni82UbQ", name: "전북소방", org: "전북소방본부", g: "본부" },
  { id: "UCx3Jcg8ALWeqYWXWmHEgbqA", name: "경남소방", org: "경남소방본부", g: "본부" },
  { id: "UCQHBBAoBAPAhZ8eVIYN3q3A", name: "창원소방본부", org: "창원소방본부", g: "본부" },
  { id: "UCOiYqD8f1a9EB3AyaUAnPHQ", name: "제주소방TV", org: "제주소방안전본부", g: "본부" },

  { id: "UCPzE7xwMIxbUKLSgsA5Hp7w", name: "안동소방서TV", org: "안동소방서", g: "소방서" },
  { id: "UC8cZmbf6s2tUZWZA7LgW04w", name: "경산소방서", org: "경산소방서", g: "소방서" },
  { id: "UCMsk3J-a1dUnYAJeKiEVvWg", name: "해소TV", org: "해운대소방서", g: "소방서" },
  { id: "UC5bji_hha9Uj7qtmw6yWm7Q", name: "춘천소방TV", org: "춘천소방서", g: "소방서" },
  { id: "UC4rNlIjJDD6AQajNIzIhH9g", name: "장흥소방서", org: "장흥소방서", g: "소방서" },
];

module.exports = { CHANNELS };

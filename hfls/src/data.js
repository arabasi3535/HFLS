// ══════════════════════════════════════════════════════════════════════════
// HFLS data.js  v3.0  —  소방시설 연혁 법령 적용 지원 시스템
//
// 데이터 출처: 별표4·별표5 원문 PDF (국가법령정보센터)
//   ├ 소방시설설치유지법 시행령 별표4 (제15조 관련, 2004.5.30 시행 / 2005.11.11·2006.12.7 개정)
//   ├ 화재예방소방시설법 시행령 별표5 (제15조 관련, 2012.2.5 시행)
//   ├ 소방시설법 시행령 별표4 (제11조 관련, 2022.12.1 시행)
//   ├ 소방시설법 시행령 별표4 개정 2024.5.7
//   ├ 소방시설법 시행령 별표4 개정 2024.12.31
//   └ 소방시설법 시행령 별표4 개정 2025.11.25 (현행)
//
// ※ 소방법 시대(1958~2004) 기준은 소방법 시행령 별표 및 소방기술기준에관한규칙 반영
// ══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// 1. 법령 시대 정의
// ─────────────────────────────────────────────────────────────────────────
export const LAW_ERAS = [
  {
    id: "era0",
    label: "소방법 시대",
    start: "1958-03-11", end: "2004-05-29",
    lawName: "소방법",
    lawShort: "소방법",
    lawCode: "법률 제485호 (1958.3.11 제정)",
    decree: "소방법 시행령",
    rule: "소방법 시행규칙",
    standard: "소방기술기준에관한규칙",
    standardAuth: "내무부령 → 행정자치부령",
    mainArticle: "제8조(소방시설 설치), 제9조(특수장소)",
    selfCheck: "소방법 제8조의2 (자체점검)",
    safetyInspection: "소방특별조사 (소방서장)",
    color: "#6b7280",
    note: "단일법 체계. 스프링클러 11층↑, 자탐 1,000㎡↑ 기준 등 적용. 2004.5.29 폐지."
  },
  {
    id: "era1",
    label: "소방시설설치유지법 시대",
    start: "2004-05-30", end: "2012-02-04",
    lawName: "소방시설설치유지및안전관리에관한법률",
    lawShort: "소방시설설치유지법",
    lawCode: "법률 제6893호 (2003.5.29 제정, 2004.5.30 시행)",
    decree: "소방시설설치유지및안전관리에관한법률 시행령",
    rule: "소방시설설치유지및안전관리에관한법률 시행규칙",
    standard: "화재안전기준 (NFSC)",
    standardAuth: "소방방재청 고시",
    mainArticle: "제9조(소방시설 설치)", tableRef: "별표4 (제15조 관련)",
    selfCheck: "제25조 (소방시설등의 자체점검)",
    safetyInspection: "소방특별조사 (소방본부장·소방서장)",
    color: "#2563eb",
    note: "소방 4분법 시행(2004.5.30). 스프링클러 11층↑ 유지, 간이스프링클러 도입(2004). 2005.11.11·2006.12.7 개정.",
    amendments: [
      { date: "2004-05-30", summary: "소방 4분법 시행, 별표4 제15조 관련 최초 시행" },
      { date: "2005-11-11", summary: "노유자시설 소화기구 투척용 추가, 간이스프링클러 근린생활시설 1천㎡↑ 신설" },
      { date: "2006-12-07", summary: "간이스프링클러 다중이용업소 지하층 150㎡ 이상 삭제 등" }
    ]
  },
  {
    id: "era2",
    label: "화재예방소방시설법 시대",
    start: "2012-02-05", end: "2022-11-30",
    lawName: "화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률",
    lawShort: "화재예방소방시설법",
    lawCode: "법률 제11037호 (2011.8.4 제정, 2012.2.5 시행)",
    decree: "화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률 시행령",
    rule: "화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률 시행규칙",
    standard: "화재안전기준 (NFSC)",
    standardAuth: "국민안전처 → 소방청 고시",
    mainArticle: "제9조(소방시설 설치)", tableRef: "별표5 (제15조 관련)",
    selfCheck: "제25조 (소방시설등의 자체점검)",
    safetyInspection: "화재안전조사 (소방관서장)",
    color: "#d97706",
    note: "2017.1.26 아파트 스프링클러 6층↑ 의무화(핵심 개정). 노유자·의료시설 간이스프링클러 강화. NFSC 빈번 개정.",
    amendments: [
      { date: "2012-02-05", summary: "화재예방소방시설법 시행, 별표5로 전환" },
      { date: "2017-01-26", summary: "아파트 스프링클러 6층 이상 의무화(결정적 개정)" },
      { date: "2019-08-06", summary: "노유자 생활시설 간이스프링클러 강화" }
    ]
  },
  {
    id: "era3a",
    label: "소방시설법 시대 (2022.12~2024.4)",
    start: "2022-12-01", end: "2024-05-06",
    lawName: "소방시설 설치 및 관리에 관한 법률",
    lawShort: "소방시설법(2022.12)",
    lawCode: "법률 제18522호 (2021.11.30 제정, 2022.12.1 시행)",
    decree: "소방시설 설치 및 관리에 관한 법률 시행령",
    rule: "소방시설 설치 및 관리에 관한 법률 시행규칙",
    standard: "화재안전기술기준(NFTC) / 화재안전성능기준(NFPC)",
    standardAuth: "소방청 고시 (이원화)",
    mainArticle: "제12조(소방시설 설치)", tableRef: "별표4 (제11조 관련) 시행일 2023.12.1",
    selfCheck: "제22조 (소방시설등의 자체점검)",
    safetyInspection: "화재안전조사 (화재예방법 제7조)",
    color: "#0d9488",
    note: "2분법 시행. 연립·다세대 간이스프링클러 신설. 별표4 시행일 2023.12.1(일부 2024.12.1). 지하가(터널포함) 자탐 기준 변경."
  },
  {
    id: "era3b",
    label: "소방시설법 시대 (2024.5.7 개정)",
    start: "2024-05-07", end: "2024-12-30",
    lawName: "소방시설 설치 및 관리에 관한 법률",
    lawShort: "소방시설법(2024.5)",
    lawCode: "개정 2024.5.7 (시행령 개정)",
    decree: "소방시설 설치 및 관리에 관한 법률 시행령",
    rule: "소방시설 설치 및 관리에 관한 법률 시행규칙",
    standard: "화재안전기술기준(NFTC) / 화재안전성능기준(NFPC)",
    standardAuth: "소방청 고시",
    mainArticle: "제12조(소방시설 설치)", tableRef: "별표4 (제11조 관련) <개정 2024.5.7>",
    selfCheck: "제22조 (소방시설등의 자체점검)",
    safetyInspection: "화재안전조사 (화재예방법 제7조)",
    color: "#059669",
    note: "2024.5.7 개정: 지하가(터널 포함) → 터널 별도 구분. 자탐 조문 '지하가(터널제외)' → 터널 독립 항목화."
  },
  {
    id: "era3c",
    label: "소방시설법 시대 (2024.12.31 개정)",
    start: "2024-12-31", end: "2025-11-24",
    lawName: "소방시설 설치 및 관리에 관한 법률",
    lawShort: "소방시설법(2024.12)",
    lawCode: "개정 2024.12.31 (시행령 개정)",
    decree: "소방시설 설치 및 관리에 관한 법률 시행령",
    rule: "소방시설 설치 및 관리에 관한 법률 시행규칙",
    standard: "화재안전기술기준(NFTC) / 화재안전성능기준(NFPC)",
    standardAuth: "소방청 고시",
    mainArticle: "제12조(소방시설 설치)", tableRef: "별표4 (제11조 관련) <개정 2024.12.31>",
    selfCheck: "제22조 (소방시설등의 자체점검)",
    safetyInspection: "화재안전조사 (화재예방법 제7조)",
    color: "#16a34a",
    note: "2024.12.31 개정: 옥내소화전·스프링클러 조문 중 '지하가 중 터널' → '터널'로 전면 정비. 자탐 4) 지하상가 명확화."
  },
  {
    id: "era3d",
    label: "소방시설법 시대 (2025.11.25 개정, 현행)",
    start: "2025-11-25", end: "2099-12-31",
    lawName: "소방시설 설치 및 관리에 관한 법률",
    lawShort: "소방시설법(현행)",
    lawCode: "개정 2025.11.25 (시행령 개정)",
    decree: "소방시설 설치 및 관리에 관한 법률 시행령",
    rule: "소방시설 설치 및 관리에 관한 법률 시행규칙",
    standard: "화재안전기술기준(NFTC) / 화재안전성능기준(NFPC)",
    standardAuth: "소방청 고시",
    mainArticle: "제12조(소방시설 설치)", tableRef: "별표4 (제11조 관련) <개정 2025.11.25>",
    selfCheck: "제22조 (소방시설등의 자체점검)",
    safetyInspection: "화재안전조사 (화재예방법 제7조)",
    color: "#15803d",
    note: "2025.11.25 최신 현행 기준. 자탐 15) 건축물 지하 부분 자탐 의무 신설 등."
  }
];

// ─────────────────────────────────────────────────────────────────────────
// 2. 특정소방대상물 분류 [시행령 별표2 제5조 관련, 2025.11.25 개정]
// ─────────────────────────────────────────────────────────────────────────
export const BUILDING_TYPES = [
  { id: "apt",              name: "[별표2 제1호 가목] 공동주택 — 아파트등 (주거층 5층 이상)" },
  { id: "villa",            name: "[별표2 제1호 나·다목] 공동주택 — 연립·다세대주택" },
  { id: "dormitory",        name: "[별표2 제1호 라목] 공동주택 — 기숙사" },
  { id: "geunlin",          name: "[별표2 제2호] 근린생활시설 (제1종·제2종)" },
  { id: "culture",          name: "[별표2 제3호] 문화 및 집회시설 (공연장·집회장·관람장·전시장·동식물원)" },
  { id: "religion",         name: "[별표2 제4호] 종교시설 (종교집회장·봉안당)" },
  { id: "retail",           name: "[별표2 제5호] 판매시설 (도매시장·소매시장·전통시장·상점)" },
  { id: "transport",        name: "[별표2 제6호] 운수시설 (여객자동차터미널·철도·공항·항만)" },
  { id: "medical",          name: "[별표2 제7호] 의료시설 (병원·격리병원·정신의료기관·의료재활시설)" },
  { id: "education",        name: "[별표2 제8호] 교육연구시설 (학교·교육원·직업훈련소·학원·연구소·도서관)" },
  { id: "welfare_living",   name: "[별표2 제9호] 노유자시설 — 생활시설 (양로원·노인요양·장애인거주·아동양육·정신요양 등 24시간 거주형)" },
  { id: "welfare_use",      name: "[별표2 제9호] 노유자시설 — 이용시설 (경로당·어린이집·유치원·주야간보호·재가복지·직업재활 등 주간이용형)" },
  { id: "training",         name: "[별표2 제10호] 수련시설 (청소년수련관·수련원·야영장·유스호스텔)" },
  { id: "sports",           name: "[별표2 제11호] 운동시설 (체육관·운동장, 근린생활시설 미해당분)" },
  { id: "office",           name: "[별표2 제12호] 업무시설 (공공업무·일반업무·주민자치센터 등)" },
  { id: "lodging",          name: "[별표2 제13호] 숙박시설 (일반형·생활형 숙박업·고시원 등)" },
  { id: "entertainment",    name: "[별표2 제14호] 위락시설 (단란주점·유흥주점·테마파크·무도장·카지노)" },
  { id: "factory",          name: "[별표2 제15호] 공장" },
  { id: "warehouse",        name: "[별표2 제16호] 창고시설 (창고·하역장·물류터미널·집배송시설)" },
  { id: "hazmat",           name: "[별표2 제17호] 위험물 저장 및 처리 시설 (제조소등·가스시설)" },
  { id: "aviation",         name: "[별표2 제18호] 항공기 및 자동차 관련 시설 (격납고·주차장·세차장·정비공장 등)" },
  { id: "animal_plant",     name: "[별표2 제19호] 동물 및 식물 관련 시설 (축사·도축장·온실·재배사 등)" },
  { id: "recycling",        name: "[별표2 제20호] 자원순환 관련 시설 (하수처리·고물상·폐기물재활용·처분시설)" },
  { id: "correctional",     name: "[별표2 제21호] 교정 및 군사시설 (교도소·구치소·치료감호시설·소년원·군사시설)" },
  { id: "broadcast",        name: "[별표2 제22호] 방송통신시설 (방송국·전신전화국·데이터센터 등)" },
  { id: "power",            name: "[별표2 제23호] 발전시설 (원자력·화력·수력·풍력·전기저장시설 등)" },
  { id: "cemetery",         name: "[별표2 제24호] 묘지 관련 시설 (화장시설·봉안당·동물화장·건조장시설)" },
  { id: "tourism",          name: "[별표2 제25호] 관광 휴게시설 (야외음악당·야외극장·어린이회관·관망탑·휴게소)" },
  { id: "funeral",          name: "[별표2 제26호] 장례시설 (장례식장·동물전용 장례식장)" },
  { id: "underground",      name: "[별표2 제27호] 지하상가" },
  { id: "tunnel",           name: "[별표2 제27호의2] 터널 (차량 통행용 지하·수저·산악 터널·방음터널)" },
  { id: "underground_duct", name: "[별표2 제28호] 지하구 (전력·통신용 전력구·통신구·공동구)" },
  { id: "heritage",         name: "[별표2 제29호] 국가유산 (지정문화유산·천연기념물등 건축물)" },
  { id: "mixed_a",          name: "[별표2 제30호 가목] 복합건축물 — 가목 (둘 이상 용도 복합, 비주거)" },
  { id: "mixed_b",          name: "[별표2 제30호 나목] 복합건축물 — 나목 (근생·판매·업무·숙박·위락 + 주택 복합)" },
];

// ─────────────────────────────────────────────────────────────────────────
// 3. 날짜 → 법령 시대 매핑
// ─────────────────────────────────────────────────────────────────────────
export function getEraByDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return LAW_ERAS.find(e => d >= new Date(e.start) && d <= new Date(e.end)) || null;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. 소방시설 설치기준 산출 함수
//    출처: 별표4·5 원문 조문 직접 반영
//    분류 (별표1): 1.소화설비 2.경보설비 3.피난구조설비 4.소화용수설비 5.소화활동설비
// ─────────────────────────────────────────────────────────────────────────
export function getRequirements(type, area, gf, bf, occ, eraId) {
  const reqs = [];

  // 시대 판별 플래그
  const isEra0  = eraId === "era0";                       // 소방법 시대
  const isEra1  = eraId === "era1";                       // 소방시설설치유지법
  const isEra2  = eraId === "era2";                       // 화재예방소방시설법
  const isEra3a = eraId === "era3a";                      // 소방시설법 2022.12~
  const isEra3b = eraId === "era3b";                      // 소방시설법 2024.5~
  const isEra3c = eraId === "era3c";                      // 소방시설법 2024.12~
  const isEra3d = eraId === "era3d";                      // 소방시설법 2025.11~ (현행)
  const isNewLaw = isEra3a || isEra3b || isEra3c || isEra3d; // 소방시설법 전체
  const isOldLaw = isEra0 || isEra1 || isEra2;

  // 화재안전기준 표기
  const std = k => {
    if (isNewLaw) return "NFTC " + k;
    if (isEra0)   return "소방기술기준에관한규칙";
    return "NFSC " + k;
  };

  // 근거 법령 표기 헬퍼
  const art0  = (s) => "소방기술기준에관한규칙 " + s;
  const art1  = (s) => "소방시설설치유지법 시행령 별표4 " + s;
  const art2  = (s) => "화재예방소방시설법 시행령 별표5 " + s;
  const art3  = (s) => "소방시설법 시행령 별표4 " + s;
  const artN  = (s) => isEra0 ? art0(s) : isEra1 ? art1(s) : isEra2 ? art2(s) : art3(s);

  // ══════════════════════════════════════════
  // ① 소화설비 [별표1 제1호]
  // ══════════════════════════════════════════

  // ─ 소화기구 (모든 시대, 연면적 33㎡ 이상)
  if (area >= 33)
    reqs.push({
      cat: "소화설비",
      name: "소화기구 (소화기·간이소화용구·자동확산소화기)",
      cond: "연면적 33㎡ 이상",
      std: std("101"),
      art: artN("소화기구 제4조"),
      note: isEra1 && ["welfare_living","welfare_use"].includes(type)
        ? "노유자시설: 투척용 소화용구를 산정 소화기 수량의 1/2 이상 설치 의무 (2005.11.11 개정)" : null
    });

  // ─ 자동소화장치 — 주거용 주방자동소화장치 (소방시설법 시대, 아파트·기숙사·오피스텔)
  if (["apt","dormitory"].includes(type) && isNewLaw)
    reqs.push({
      cat: "소화설비",
      name: "자동소화장치 — 주거용 주방자동소화장치",
      cond: "아파트등·기숙사·오피스텔 모든 층 (주방 후드 및 덕트 설치 주방)",
      std: std("101"),
      art: art3("제11조 나목1) — 2022.12.1 시행")
    });

  // ─ 자동소화장치 — 상업용 주방자동소화장치 (소방시설법 시대)
  if (isNewLaw && ["geunlin","retail","entertainment","welfare_living","welfare_use",
      "lodging","education","training","culture","sports","office"].includes(type))
    reqs.push({
      cat: "소화설비",
      name: "자동소화장치 — 상업용 주방자동소화장치",
      cond: "후드 및 덕트가 설치된 주방 (해당 특정소방대상물 내 주방)",
      std: std("101"),
      art: art3("제11조 나목2) — 2022.12.1 시행")
    });

  // ─ 옥내소화전설비
  // era0: 연면적 1,000㎡ 이상 / 기타: 3,000㎡ 이상 또는 지하·무창·4층이상 600㎡ 이상 층
  // era1·2: 다목 - 근생·위락·판매·숙박·노유자·의료·업무·통신·공장·창고·운수·복합 1,500㎡ 이상
  const needHydrant = (() => {
    if (isEra0) return area >= 1000 || (bf > 0 && area >= 150);
    if (isOldLaw) {
      // 가목: 연면적 3,000㎡ 이상이거나 지하·무창·4층↑ 중 바닥 600㎡↑ 층
      if (area >= 3000) return true;
      if (bf > 0 && area >= 600) return true;
      if (gf >= 4 && area >= 600) return true;
      // 다목: 특정 용도 1,500㎡↑ 또는 지하·무창·4층↑ 300㎡↑
      const hydTypes1 = ["geunlin","entertainment","retail","lodging","welfare_living","welfare_use",
        "medical","office","broadcast","factory","warehouse","transport","mixed_a","mixed_b"];
      if (hydTypes1.includes(type) && area >= 1500) return true;
      if (hydTypes1.includes(type) && bf > 0 && area >= 300) return true;
      return false;
    }
    // 소방시설법: 연면적 3,000㎡↑ 또는 지하·무창·4층↑ 600㎡↑ 층
    if (area >= 3000) return true;
    if (bf > 0 && area >= 600) return true;
    if (gf >= 4 && area >= 600) return true;
    // 2목: 특정 용도 1,500㎡↑ 또는 지하·무창·4층↑ 300㎡↑
    const hydTypes2 = ["geunlin","retail","transport","medical","welfare_living","welfare_use",
      "office","lodging","entertainment","factory","warehouse","aviation","correctional",
      "broadcast","power","funeral","mixed_a","mixed_b"];
    if (hydTypes2.includes(type) && area >= 1500) return true;
    if (hydTypes2.includes(type) && bf > 0 && area >= 300) return true;
    return false;
  })();
  if (needHydrant)
    reqs.push({
      cat: "소화설비",
      name: "옥내소화전설비",
      cond: isEra0
        ? "연면적 1,000㎡ 이상 또는 지하층 포함 대상"
        : "연면적 3,000㎡ 이상 또는 지하·무창·4층이상 층 600㎡ 이상, 특정용도 1,500㎡ 이상",
      std: std("102"),
      art: artN("옥내소화전설비 기준")
    });

  // ─ 스프링클러설비
  const needSpk = (() => {
    // 아파트
    if (type === "apt") {
      if (isEra0 && gf >= 11) return { need: true, cond: "11층 이상 아파트 (소방법 시대)" };
      if (isEra1 && gf >= 11) return { need: true, cond: "11층 이상 아파트 (소방시설설치유지법 시대)" };
      if (isEra2 && gf >= 6)  return { need: true, cond: "6층 이상 아파트 (2017.1.26 개정 — 핵심 변경)", warn: "2017.1.26 개정 전 건축허가 아파트(6~10층)는 설치 의무 없음. 소급 적용 여부 부칙 확인 필요." };
      if (isNewLaw)           return { need: true, cond: "6층 이상 아파트 전층 (소방시설법 유지)" };
    }
    // 16층 이상 전 용도 (era0·era1: 11층↑, era2↑: 6층↑)
    if (isOldLaw && gf >= 11 && !["apt","villa","dormitory"].includes(type))
      return { need: true, cond: "11층 이상 특정소방대상물 전층" };
    if (isNewLaw && gf >= 6 && !["apt","villa","dormitory","animal_plant","heritage"].includes(type))
      return { need: true, cond: "6층 이상 특정소방대상물 전층" };
    // 문화·집회·운동시설 (era0·1: 수용인원 100인↑ 등)
    if (["culture","sports"].includes(type)) {
      if (isOldLaw && occ >= 100) return { need: true, cond: "문화집회·운동시설 수용인원 100인 이상" };
      if (isNewLaw && occ >= 100) return { need: true, cond: "문화집회·운동시설 수용인원 100명 이상" };
    }
    // 판매시설 (era1: 6,000㎡↑/3층↓ 또는 5,000㎡↑/4층↑, era2↑: 연면적 기준)
    if (type === "retail") {
      if (isOldLaw && ((gf <= 3 && area >= 6000) || (gf >= 4 && area >= 5000) || occ >= 500))
        return { need: true, cond: "판매시설 (층수별 면적 기준 또는 수용인원 500인↑)" };
      if (isNewLaw && area >= 1500)
        return { need: true, cond: "판매시설 연면적 1,500㎡ 이상" };
    }
    // 노유자시설·수련시설(숙박) (era1↑: 600㎡↑)
    if (["welfare_living","welfare_use","training"].includes(type)) {
      if ((isEra1||isEra2) && area >= 600) return { need: true, cond: "노유자·수련시설 연면적 600㎡ 이상" };
      if (isNewLaw && area >= 600) return { need: true, cond: "노유자 시설 연면적 600㎡ 이상 (이용시설 포함)" };
    }
    // 기숙사·복합건축물 (5,000㎡↑)
    if (["dormitory","mixed_a","mixed_b"].includes(type) && area >= 5000)
      return { need: true, cond: "기숙사·복합건축물 연면적 5,000㎡ 이상" };
    // 창고 — 랙크식 1,500㎡↑ (era1) / 소방시설법 전용기준
    if (type === "warehouse") {
      if (isOldLaw && area >= 1500) return { need: true, cond: "랙크식 창고 연면적 1,500㎡ 이상" };
      if (isNewLaw && area >= 1500) return { need: true, cond: "창고시설 연면적 1,500㎡ 이상 (NFTC 103A 적용)", warn: "NFTC 103A(창고전용) 2022.12.1 신설 — 기존 창고 소급 적용 여부 부칙 확인 필요" };
    }
    // 지하상가 1,000㎡↑
    if (type === "underground" && area >= 1000) return { need: true, cond: "지하상가 연면적 1,000㎡ 이상" };
    // 지하층·무창층·4층↑ 중 1,000㎡↑ (일반 기준)
    if ((bf > 0 || gf >= 4) && area >= 1000 &&
        !["tunnel","underground_duct","hazmat","animal_plant","heritage","cemetery"].includes(type))
      return { need: true, cond: "지하층·무창층·4층이상 층 바닥면적 1,000㎡ 이상" };
    return { need: false };
  })();
  if (needSpk.need)
    reqs.push({
      cat: "소화설비",
      name: type === "warehouse" && isNewLaw ? "스프링클러설비 (NFTC 103A 창고전용)" : "스프링클러설비",
      cond: needSpk.cond,
      std: type === "warehouse" && isNewLaw ? "NFTC 103A" : std("103"),
      art: artN("스프링클러설비 기준"),
      warn: needSpk.warn || null
    });

  // ─ 간이스프링클러설비
  // era1 (2004~2012): 근린생활시설 1,000㎡↑, 합숙소 100㎡↑
  // era2 (2012~2022): 근린생활시설 1,000㎡↑, 노유자시설, 의료시설 600㎡미만, 숙박 300~600㎡
  // era3 (2022~): 연립·다세대 신설, 근린생활 1,000㎡↑, 의료 600㎡미만, 노유자생활시설 전체, 이용시설 300~600㎡
  const needEasy = (() => {
    if (isEra0) return null; // era0: 간이스프링클러 규정 없음
    if (type === "geunlin" && area >= 1000)
      return { cond: "근린생활시설 바닥면적 합계 1,000㎡ 이상 (전층)" };
    if (type === "villa" && isNewLaw)
      return { cond: "연립·다세대주택 전체 (주택전용 간이스프링클러, 2022.12.1 신설)", warn: "연립·다세대 간이스프링클러는 2022.12.1 이후 건축허가 대상 적용 원칙" };
    if (type === "education" && area >= 100)
      return { cond: "교육연구시설 내 합숙소 연면적 100㎡ 이상" };
    if (type === "welfare_living") {
      if (isEra2)   return { cond: "노유자 생활시설 전체 — 면적 무관 (2019.8 이후 강화)", warn: "2014 장성화재 이후 노유자 생활시설 간이스프링클러 의무화" };
      if (isNewLaw) return { cond: "노유자 생활시설 전체 — 면적 무관 (24시간 거주형, 자력피난 곤란자 재실)", warn: "노유자 생활시설: 연면적·층수 무관 전체 설치 의무" };
      if (isEra1 && area >= 600) return { cond: "노유자시설 연면적 600㎡ 이상 (era1 기준)" };
    }
    if (type === "welfare_use") {
      if ((isEra2||isNewLaw) && area >= 300 && area < 600)
        return { cond: "노유자 이용시설 바닥면적 합계 300㎡ 이상 600㎡ 미만" };
      if (isEra1 && area >= 600) return { cond: "노유자시설 연면적 600㎡ 이상 (era1 기준)" };
    }
    if (type === "medical") {
      if ((isEra2||isNewLaw) && area < 600 && area >= 300)
        return { cond: "의료시설(정신·재활 제외) 바닥면적 합계 300㎡ 이상 600㎡ 미만" };
    }
    if (type === "lodging" && (isEra2||isNewLaw) && area >= 300 && area < 600)
      return { cond: "숙박시설 바닥면적 합계 300㎡ 이상 600㎡ 미만" };
    if (type === "mixed_b" && isNewLaw && area >= 1000)
      return { cond: "복합건축물(나목) 연면적 1,000㎡ 이상 (2022.12.1~)" };
    return null;
  })();
  if (needEasy)
    reqs.push({
      cat: "소화설비",
      name: "간이스프링클러설비",
      cond: needEasy.cond,
      std: std("103B"),
      art: artN("간이스프링클러설비 기준"),
      warn: needEasy.warn || null
    });

  // ─ 옥외소화전설비 (공장·창고·위험물, 지상 1·2층 바닥면적 합계 9,000㎡↑ / 지정문화재 1,000㎡↑)
  if (["factory","warehouse","hazmat"].includes(type) && area >= 9000)
    reqs.push({
      cat: "소화설비", name: "옥외소화전설비",
      cond: "지상 1·2층 바닥면적 합계 9,000㎡ 이상 (공장·창고·위험물시설)",
      std: std("109"), art: artN("옥외소화전설비 기준")
    });
  if (type === "heritage" && area >= 1000)
    reqs.push({
      cat: "소화설비", name: "옥외소화전설비",
      cond: "지정문화재(국가유산) 연면적 1,000㎡ 이상",
      std: std("109"), art: artN("옥외소화전설비 기준")
    });

  // ══════════════════════════════════════════
  // ② 경보설비 [별표1 제2호]
  // ══════════════════════════════════════════

  // ─ 자동화재탐지설비
  // era0·era1·era2: 조문 기반 분류
  // era3: 별표4 조문 직접 반영 (1)~15) 항목)
  const needAtd = (() => {
    if (isEra0) {
      // 소방법 시대: 자탐 기준 (연면적 기준)
      const A = ["geunlin","entertainment","lodging","medical","mixed_a","mixed_b"];
      if (A.includes(type) && area >= 600) return "연면적 600㎡ 이상";
      const B = ["culture","sports","tourism","underground","retail","apt","villa","office",
                 "transport","factory","warehouse","broadcast"];
      if (B.includes(type) && area >= 1000) return "연면적 1,000㎡ 이상";
      const C = ["education","animal_plant","recycling","correctional"];
      if (C.includes(type) && area >= 2000) return "연면적 2,000㎡ 이상";
      if (["welfare_living","welfare_use"].includes(type) && area >= 400 && occ >= 100)
        return "노유자시설 연면적 400㎡ 이상 + 수용인원 100인 이상";
      if (type === "underground_duct" || type === "tunnel") return "지하구·터널 전체";
      return null;
    }
    if (isEra1 || isEra2) {
      const A = ["geunlin","entertainment","lodging","medical","mixed_a","mixed_b"];
      if (A.includes(type) && area >= 600) return "연면적 600㎡ 이상";
      const B = ["culture","sports","tourism","underground","retail","apt","villa","office",
                 "transport","factory","warehouse","broadcast"];
      if (B.includes(type) && area >= 1000) return "연면적 1,000㎡ 이상";
      const C = ["education","animal_plant","recycling","correctional"];
      if (C.includes(type) && area >= 2000) return "연면적 2,000㎡ 이상";
      if (["welfare_living","welfare_use"].includes(type) && area >= 400) return "노유자시설 연면적 400㎡ 이상";
      if (type === "underground_duct" || type === "tunnel") return "지하구·터널 전체";
      return null;
    }
    // 소방시설법(era3) — 별표4 자동화재탐지설비 조문 직접 반영
    // 1) 아파트등·기숙사·숙박 전층
    if (["apt","dormitory","lodging"].includes(type)) return "모든 층 (아파트등·기숙사·숙박시설)";
    // 2) 6층 이상 전층
    if (gf >= 6) return "6층 이상 전층";
    // 3) 근린(목욕장 제외)·의료(정신·요양 제외)·위락·장례·복합 600㎡↑
    if (["geunlin","medical","entertainment","funeral","mixed_a","mixed_b"].includes(type) && area >= 600)
      return "연면적 600㎡ 이상";
    // 4) 목욕장·문화집회·종교·판매·운수·운동·업무·공장·창고·위험물·항공자동차·교정군사·방송·발전·관광 1,000㎡↑
    //    (2024.12.31 이후: 지하상가 포함, 터널 별도)
    const grp4 = ["culture","religion","retail","transport","sports","office","factory",
                  "warehouse","hazmat","aviation","broadcast","power","tourism"];
    if (isEra3c || isEra3d) {
      if ([...grp4,"underground"].includes(type) && area >= 1000) return "연면적 1,000㎡ 이상";
    } else {
      if ([...grp4,"underground"].includes(type) && area >= 1000) return "연면적 1,000㎡ 이상 (지하가 포함)";
    }
    // 5) 교육·수련·동식물·자원순환·교정(국방군사 제외)·묘지 2,000㎡↑
    if (["education","training","animal_plant","recycling","correctional","cemetery"].includes(type) && area >= 2000)
      return "연면적 2,000㎡ 이상";
    // 6) 노유자 생활시설 전층
    if (type === "welfare_living") return "노유자 생활시설 전층 (면적 무관)";
    // 7) 노유자 이용시설 400㎡↑
    if (type === "welfare_use" && area >= 400) return "노유자 이용시설 연면적 400㎡ 이상";
    // 10) 터널 1,000m↑ (2024.5.7 이후 별도 항목)
    if (type === "tunnel" && area >= 1000) return "터널 길이 1,000m 이상";
    // 11) 지하구
    if (type === "underground_duct") return "지하구 전체";
    return null;
  })();
  if (needAtd)
    reqs.push({
      cat: "경보설비", name: "자동화재탐지설비",
      cond: needAtd,
      std: std("203"),
      art: isEra0 ? art0("제11조") : artN("자동화재탐지설비 기준"),
      warn: (type === "welfare_living" && isNewLaw)
        ? "노유자 생활시설: 2019.8 이후 면적 무관 전층 자탐 의무 강화" : null
    });

  // ─ 비상경보설비 (자탐 미해당 400㎡↑)
  if (!needAtd && area >= 400 && !["underground_duct","tunnel","hazmat"].includes(type))
    reqs.push({
      cat: "경보설비", name: "비상경보설비 (비상벨·자동식사이렌)",
      cond: "연면적 400㎡ 이상 (자동화재탐지설비 미해당 대상)",
      std: std("201"), art: artN("비상경보설비 기준")
    });

  // ─ 단독경보형 감지기 (공동주택 자탐 미달 소규모)
  if (["apt","villa","dormitory"].includes(type) && !needAtd)
    reqs.push({
      cat: "경보설비", name: "단독경보형 감지기",
      cond: "소규모 공동주택 세대 내 (자동화재탐지설비 미설치 세대)",
      std: std("201"), art: artN("단독경보형감지기 기준")
    });

  // ─ 비상방송설비 (연면적 3,500㎡ 이상 또는 11층 이상)
  if (area >= 3500 || gf >= 11)
    reqs.push({
      cat: "경보설비", name: "비상방송설비",
      cond: "연면적 3,500㎡ 이상 또는 11층 이상",
      std: std("202"), art: artN("비상방송설비 기준")
    });

  // ─ 자동화재속보설비
  // era1: 노유자 500㎡↑, 공장·창고·업무 1,500㎡↑
  // era2↑: 노유자·의료·교정 500㎡↑
  if (!isEra0) {
    const needAtds = (() => {
      if (isEra1) {
        if (["welfare_living","welfare_use"].includes(type) && area >= 500) return "노유자시설 바닥면적 500㎡ 이상 층 보유";
        if (["factory","warehouse","office"].includes(type) && area >= 1500) return "공장·창고·업무시설 1,500㎡ 이상 (무인경비 시스템 관리시설)";
        return null;
      }
      if (["welfare_living","welfare_use","medical","correctional"].includes(type) && area >= 500)
        return "노유자·의료·교정시설 바닥면적 500㎡ 이상 층 보유";
      return null;
    })();
    if (needAtds)
      reqs.push({
        cat: "경보설비", name: "자동화재속보설비",
        cond: needAtds,
        std: std("204"), art: artN("자동화재속보설비 기준")
      });
  }

  // ─ 누전경보기 (계약전류 100A 초과)
  if (area >= 1000 && !["underground_duct","tunnel","heritage","cemetery","animal_plant","hazmat"].includes(type))
    reqs.push({
      cat: "경보설비", name: "누전경보기",
      cond: "계약전류 100A 초과 대상 건축물",
      std: std("205"), art: artN("누전경보기 기준")
    });

  // ─ 가스누설경보기
  if (!isEra0 && ["apt","villa","dormitory","geunlin","retail","welfare_living","welfare_use","lodging"].includes(type))
    reqs.push({
      cat: "경보설비", name: "가스누설경보기",
      cond: "가스(도시가스·LPG) 사용 설비 설치 공간",
      std: std("206"), art: artN("가스누설경보기 기준")
    });

  // ══════════════════════════════════════════
  // ③ 피난구조설비 [별표1 제3호]
  // ══════════════════════════════════════════
  if (gf >= 2 || area >= 400 || bf > 0) {
    const skip = ["underground_duct","tunnel"].includes(type);
    if (!skip && (gf >= 2 || bf > 0))
      reqs.push({
        cat: "피난구조설비", name: "피난기구 (완강기·구조대·피난사다리·간이완강기 등)",
        cond: "2층 이상 또는 지하층 — 피난층·옥상 제외",
        std: std("301"), art: artN("피난기구 기준")
      });
    if (!skip)
      reqs.push({
        cat: "피난구조설비", name: "유도등 및 유도표지 (피난구·통로·객석유도등·피난유도선·유도표지)",
        cond: "연면적 400㎡ 이상 또는 3층 이상",
        std: std("303"), art: artN("유도등 기준")
      });
    if (!skip)
      reqs.push({
        cat: "피난구조설비", name: "비상조명등 및 휴대용 비상조명등",
        cond: "연면적 400㎡ 이상 또는 3층 이상",
        std: std("304"), art: artN("비상조명등 기준")
      });
    if (gf >= 7 || ["medical","correctional","hazmat"].includes(type))
      reqs.push({
        cat: "피난구조설비", name: "인명구조기구 (방열복·공기호흡기·인공소생기)",
        cond: "7층 이상 또는 의료·교정·위험물시설",
        std: std("302"), art: artN("인명구조기구 기준")
      });
  }

  // ══════════════════════════════════════════
  // ④ 소화용수설비 [별표1 제4호]
  // ══════════════════════════════════════════
  const noWater = ["underground_duct","tunnel","heritage","cemetery","animal_plant","hazmat"];
  if (area >= 5000 && !noWater.includes(type))
    reqs.push({
      cat: "소화용수설비", name: "상수도소화용수설비",
      cond: "연면적 5,000㎡ 이상 (도로변 75m 이내 소화전 있는 경우 면제 가능)",
      std: std("401"), art: artN("상수도소화용수설비 기준")
    });
  if (area >= 5000 && ["factory","warehouse","hazmat"].includes(type))
    reqs.push({
      cat: "소화용수설비", name: "소화수조·저수조",
      cond: "공장·창고·위험물시설 연면적 5,000㎡ 이상 (상수도 미설치 지역 적용)",
      std: std("402"), art: artN("소화수조·저수조 기준")
    });

  // ══════════════════════════════════════════
  // ⑤ 소화활동설비 [별표1 제5호]
  // ══════════════════════════════════════════

  // 제연설비 — 특별피난계단 전실·비상용 승강기 승강장 (11층↑)
  if (gf >= 11)
    reqs.push({
      cat: "소화활동설비", name: "제연설비 (특별피난계단 전실·비상용 승강기 승강장)",
      cond: "11층 이상 (특별피난계단 설치 의무 대상)",
      std: std("501A"), art: artN("제연설비 기준")
    });
  // 제연설비 — 거실 제연 (지하층·판매·의료·위락·지하상가 1,000㎡↑)
  if ((bf > 0 || ["retail","transport","medical","entertainment","underground","culture"].includes(type)) && area >= 1000)
    reqs.push({
      cat: "소화활동설비", name: "제연설비 (거실 및 통로 제연)",
      cond: "지하층·판매·운수·의료·위락·지하상가 연면적 1,000㎡ 이상",
      std: std("501"), art: artN("제연설비 기준")
    });

  // 연결송수관설비 (5층↑ 또는 6,000㎡↑)
  if (gf >= 5 || area >= 6000)
    reqs.push({
      cat: "소화활동설비", name: "연결송수관설비",
      cond: "5층 이상 또는 연면적 6,000㎡ 이상",
      std: std("502"), art: artN("연결송수관설비 기준")
    });

  // 연결살수설비 (지하층 150㎡↑, 특정 용도)
  if (bf > 0 && area >= 150 &&
      ["retail","factory","warehouse","geunlin","entertainment","underground","hazmat"].includes(type))
    reqs.push({
      cat: "소화활동설비", name: "연결살수설비",
      cond: "지하층 바닥면적 150㎡ 이상 (해당 용도)",
      std: std("503"), art: artN("연결살수설비 기준")
    });

  // 비상콘센트설비 (11층↑ 또는 지하 3층↑)
  if (gf >= 11 || bf >= 3)
    reqs.push({
      cat: "소화활동설비", name: "비상콘센트설비",
      cond: "11층 이상 또는 지하 3층 이상",
      std: std("504"), art: artN("비상콘센트설비 기준")
    });

  // 무선통신보조설비 (지하층 3,000㎡↑ 또는 터널·지하상가)
  if ((bf > 0 && area >= 3000) || ["tunnel","underground"].includes(type))
    reqs.push({
      cat: "소화활동설비", name: "무선통신보조설비",
      cond: "지하층 포함 연면적 3,000㎡ 이상 또는 터널·지하상가",
      std: std("505"), art: artN("무선통신보조설비 기준")
    });

  // 연소방지설비 (지하구)
  if (type === "underground_duct")
    reqs.push({
      cat: "소화활동설비", name: "연소방지설비",
      cond: "지하구 케이블 구간 전체 (폭 1.8m 이상·길이 50m 이상)",
      std: std("506"), art: artN("연소방지설비 기준")
    });

  return reqs;
}

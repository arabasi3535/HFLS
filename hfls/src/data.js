// ============================================================
// HFLS data.js — App.js 완전 호환 버전
// 수정: 유도등(층수/면적 기준 없음), 비상조명등(5층+3천㎡ AND조건),
//       연결송수관설비(5층+6천㎡ AND조건 or 7층 단독)
// 기준: 소방시설 설치 및 관리에 관한 법률 시행령 별표4 (2026.3.24)
// ============================================================

// ─────────────────────────────────────────────────────────────
// 1. LAW_ERAS — 법령 시대 구분 (7개 시대)
// ─────────────────────────────────────────────────────────────
export const LAW_ERAS = [
  {
    id: "era1",
    label: "소방법 시대",
    color: "#78716c",
    lawName: "소방법",
    lawCode: "법률 제959호 (1958.3.11 제정)",
    lawShort: "소방법",
    start: "1958-03-11",
    end: "2004-05-29",
    mainArticle: "소방법 제8조",
    tableRef: "소방법 시행령 별표",
    standard: "소방기술기준에 관한 규칙",
    standardAuth: "내무부령 → 행정자치부령",
    selfCheck: "소방법 제16조의3",
    safetyInspection: "소방법 제16조",
    note: "소방법 단일 체계(1958~2004). 소방시설 종류·기준이 소방법 시행령 별표에 통합. 수차례 개정을 통해 소방시설 의무 범위 점진 확대.",
    amendments: [
      { date: "1967", summary: "자동화재탐지설비 의무 설치 도입" },
      { date: "1980", summary: "스프링클러설비 의무 대상 확대" },
      { date: "1991", summary: "6층 이상 스프링클러 전면 의무화" },
      { date: "1995", summary: "삼풍·성수대교 사고 후 피난기준 강화" },
      { date: "2003", summary: "노유자시설 소방시설 기준 강화" }
    ]
  },
  {
    id: "era2a",
    label: "소방시설설치유지법 시대 (초기)",
    color: "#0891b2",
    lawName: "소방시설설치유지 및 안전관리에 관한 법률",
    lawCode: "법률 제7169호 (2004.5.29 제정, 2004.5.30 시행)",
    lawShort: "소방시설설치유지법(2004~)",
    start: "2004-05-30",
    end: "2009-07-30",
    mainArticle: "시행령 제15조",
    tableRef: "시행령 별표4",
    standard: "화재안전기준(NFSC)",
    standardAuth: "소방방재청 고시",
    selfCheck: "법 제20조",
    safetyInspection: "법 제22조",
    note: "소방법에서 분리 제정. 소방시설 체계화 및 NFSC 위임체계 도입. 특정소방대상물 분류 체계 확립.",
    amendments: [
      { date: "2005", summary: "다중이용업소 소방시설 기준 강화" },
      { date: "2007", summary: "화재안전기준(NFSC) 체계 정비" }
    ]
  },
  {
    id: "era2b",
    label: "소방시설설치유지법 시대 (후기)",
    color: "#0e7490",
    lawName: "소방시설설치유지 및 안전관리에 관한 법률",
    lawCode: "일부개정 (2009.7.31 이후)",
    lawShort: "소방시설설치유지법(2009~)",
    start: "2009-07-31",
    end: "2012-02-04",
    mainArticle: "시행령 제15조",
    tableRef: "시행령 별표4",
    standard: "화재안전기준(NFSC)",
    standardAuth: "소방방재청 고시",
    selfCheck: "법 제20조",
    safetyInspection: "법 제22조",
    note: "노유자시설·의료시설 소방시설 강화. 임시소방시설 제도 도입 준비.",
    amendments: [
      { date: "2009", summary: "노유자시설 자동화재탐지설비 적용 확대" },
      { date: "2011", summary: "임시소방시설 제도 도입" }
    ]
  },
  {
    id: "era3a",
    label: "화재예방소방시설법 시대 (2012~2017)",
    color: "#7c3aed",
    lawName: "화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률",
    lawCode: "법률 제11346호 (2012.2.22 제정, 2012.2.5 시행)",
    lawShort: "화재예방소방시설법(2012~)",
    start: "2012-02-05",
    end: "2017-01-25",
    mainArticle: "시행령 제15조",
    tableRef: "시행령 별표5",
    standard: "화재안전기준(NFSC)",
    standardAuth: "국민안전처 고시",
    selfCheck: "법 제25조",
    safetyInspection: "법 제27조",
    note: "소방시설 설치·유지와 화재예방 통합. 별표4→별표5로 재편. 복합건축물 분류 신설. 간이스프링클러설비 도입.",
    amendments: [
      { date: "2014", summary: "노유자시설 간이스프링클러·자동화재속보설비 의무화(부칙 소급)" },
      { date: "2015", summary: "숙박시설·고시원 소방시설 강화" }
    ]
  },
  {
    id: "era3b",
    label: "화재예방소방시설법 시대 (2017~2022)",
    color: "#6d28d9",
    lawName: "화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률 시행령",
    lawCode: "대통령령 제27823호 (2017.1.26 시행)",
    lawShort: "화재예방소방시설법(2017~)",
    start: "2017-01-26",
    end: "2022-11-30",
    mainArticle: "시행령 제15조",
    tableRef: "시행령 별표5",
    standard: "화재안전기준(NFSC)",
    standardAuth: "소방청 고시",
    selfCheck: "법 제25조",
    safetyInspection: "법 제27조",
    note: "2017.1.26 개정. 분말소화기 내용연수(10년) 설정. 요양병원 스프링클러 소급 의무화. 노유자시설 기준 세분화.",
    amendments: [
      { date: "2017-01-26", summary: "요양병원 스프링클러설비 의무화(부칙 3년 유예)" },
      { date: "2018", summary: "창고시설 스프링클러 적용기준 강화" },
      { date: "2020", summary: "6층이상 스프링클러 전면 적용 확대" }
    ]
  },
  {
    id: "era3c",
    label: "소방시설법 시대 (2022.12~2025.11)",
    color: "#1d4ed8",
    lawName: "소방시설 설치 및 관리에 관한 법률",
    lawCode: "법률 제18522호 (2021.11.30 공포, 2022.12.1 시행)",
    lawShort: "소방시설법(2022~)",
    start: "2022-12-01",
    end: "2025-11-24",
    mainArticle: "법 제12조, 시행령 제11조",
    tableRef: "시행령 별표4 (2022.12.1 기준)",
    standard: "화재안전기준(NFTC)",
    standardAuth: "소방청 고시",
    selfCheck: "법 제22조",
    safetyInspection: "화재예방법 제22조",
    note: "화재예방법과 소방시설법 분리. 별표5→별표4로 개편. NFSC→NFTC 명칭 변경. 공동주택 자동소화장치 의무화.",
    amendments: [
      { date: "2022-12-01", summary: "전부개정 시행. 공동주택 자동소화장치(주방) 의무화" },
      { date: "2023", summary: "6층이상 스프링클러 아파트 포함 전면 적용" },
      { date: "2024", summary: "별표2 특정소방대상물 분류 체계 확대 준비" }
    ]
  },
  {
    id: "era3d",
    label: "소방시설법 시대 (현행, 2025.11.25~)",
    color: "#166534",
    lawName: "소방시설 설치 및 관리에 관한 법률 시행령",
    lawCode: "대통령령 제36220호 (2026.3.24 시행, 2025.11.25 개정 적용)",
    lawShort: "소방시설법(현행)",
    start: "2025-11-25",
    end: "2099-12-31",
    mainArticle: "법 제12조, 시행령 제11조",
    tableRef: "시행령 별표4 (2025.11.25 최신)",
    standard: "화재안전기준(NFTC)",
    standardAuth: "소방청 고시",
    selfCheck: "법 제22조",
    safetyInspection: "화재예방법 제22조",
    note: "2025.11.25 개정 기준. 별표2 확대(30개 용도 체계). 자체점검 점검자 기술등급 구분 정비.",
    amendments: [
      { date: "2025-11-25", summary: "별표2 30개 용도 체계 확립, 복합건축물 분류 개편" },
      { date: "2026-03-24", summary: "자체점검 점검자 기술등급 구분 정비(제36220호)" }
    ]
  }
];

// ─────────────────────────────────────────────────────────────
// 2. BUILDING_TYPES — 특정소방대상물 분류 (별표2 기반, App.js 호환)
// ─────────────────────────────────────────────────────────────
export const BUILDING_TYPES = [
  // 1. 공동주택
  { id: "apt",           name: "공동주택 — 아파트등 (5층 이상)", catNo: "1", isApt: true },
  { id: "row_house",     name: "공동주택 — 연립주택", catNo: "1" },
  { id: "multi_house",   name: "공동주택 — 다세대주택", catNo: "1" },
  { id: "dormitory",     name: "공동주택 — 기숙사", catNo: "1" },
  // 2. 근린생활시설
  { id: "clinic",        name: "근린생활시설 — 의원·치과·한의원·산후조리원 등", catNo: "2" },
  { id: "neighborhood",  name: "근린생활시설 (일반)", catNo: "2" },
  // 3. 문화 및 집회시설
  { id: "movie_theater", name: "문화집회시설 — 영화상영관", catNo: "3", isMovie: true },
  { id: "performance",   name: "문화집회시설 — 공연장·집회장·관람장", catNo: "3" },
  { id: "culture",       name: "문화집회시설 — 전시장·동식물원", catNo: "3" },
  // 4. 종교시설
  { id: "religion",      name: "종교시설", catNo: "4" },
  // 5. 판매시설
  { id: "retail_large",  name: "판매시설 — 대규모점포(소매시장)", catNo: "5", isLargeRetail: true },
  { id: "retail",        name: "판매시설 — 도매시장·전통시장·상점", catNo: "5" },
  // 6. 운수시설
  { id: "subway_station",name: "운수시설 — 지하역사(철도·도시철도)", catNo: "6", isSubway: true },
  { id: "transport",     name: "운수시설 — 여객터미널·공항·항만", catNo: "6" },
  // 7. 의료시설
  { id: "general_hosp",  name: "의료시설 — 종합병원·병원·치과병원", catNo: "7" },
  { id: "nursing_hosp",  name: "의료시설 — 요양병원", catNo: "7", isNursing: true },
  { id: "mental_hosp",   name: "의료시설 — 정신의료기관(정신병원)", catNo: "7", isMental: true },
  { id: "rehab_hosp",    name: "의료시설 — 장애인의료재활시설", catNo: "7" },
  // 8. 교육연구시설
  { id: "school",        name: "교육연구시설 — 학교", catNo: "8", isSchool: true },
  { id: "education",     name: "교육연구시설 — 교육원·직업훈련소·학원·연구소·도서관", catNo: "8" },
  // 9. 노유자 시설
  { id: "welfare_res",   name: "노유자시설 — 노유자 생활시설 (입소형·거주형)", catNo: "9", isWelfareRes: true },
  { id: "welfare_child", name: "노유자시설 — 아동 관련 시설 (어린이집 등)", catNo: "9" },
  { id: "welfare_elder", name: "노유자시설 — 노인 관련 시설 (요양원 등)", catNo: "9" },
  { id: "welfare_dis",   name: "노유자시설 — 장애인 관련 시설", catNo: "9" },
  { id: "welfare_ment",  name: "노유자시설 — 정신질환자 관련 시설", catNo: "9" },
  { id: "welfare_home",  name: "노유자시설 — 노숙인 관련 시설", catNo: "9" },
  // 10. 수련시설
  { id: "recreation",    name: "수련시설 — 청소년수련관·수련원·유스호스텔", catNo: "10" },
  // 11. 운동시설
  { id: "sports",        name: "운동시설 — 체육관·운동장 등", catNo: "11" },
  // 12. 업무시설
  { id: "office",        name: "업무시설 — 공공청사·사무소·오피스텔", catNo: "12" },
  // 13. 숙박시설
  { id: "hotel",         name: "숙박시설 — 관광호텔 (호텔·콘도)", catNo: "13", isHotel: true },
  { id: "lodging",       name: "숙박시설 — 일반숙박·생활숙박·고시원", catNo: "13" },
  // 14. 위락시설
  { id: "entertainment", name: "위락시설 — 유흥주점·단란주점·무도장·카지노", catNo: "14" },
  // 15. 공장
  { id: "factory",       name: "공장 (제조·가공·데이터센터·지식산업센터 포함)", catNo: "15" },
  // 16. 창고시설
  { id: "warehouse",     name: "창고시설 — 창고·물류터미널·집배송시설", catNo: "16" },
  // 17. 위험물 저장·처리
  { id: "hazmat_gas",    name: "위험물시설 — 가스시설", catNo: "17", isGas: true },
  { id: "hazmat",        name: "위험물시설 — 제조소·저장소·주유소 등", catNo: "17" },
  // 18. 항공기·자동차 관련
  { id: "aircraft_hangar", name: "항공기 격납고", catNo: "18", isHangar: true },
  { id: "parking_bldg",  name: "주차전용건축물·주차장", catNo: "18", isParking: true },
  { id: "auto_related",  name: "자동차 관련 시설 (세차·폐차·정비·매매장 등)", catNo: "18" },
  // 19. 동물·식물
  { id: "cattle",        name: "동물·식물 관련 — 축사 (가축 직접 사육)", catNo: "19", isCattle: true },
  { id: "animal_plant",  name: "동물·식물 관련 시설 (축사 외)", catNo: "19" },
  // 20. 자원순환
  { id: "recycling",     name: "자원순환 관련 시설 — 폐기물처리·하수처리 등", catNo: "20" },
  // 21. 교정·군사
  { id: "correctional",  name: "교정 및 군사 시설 — 교도소·구치소·국방시설", catNo: "21" },
  // 22. 방송통신
  { id: "broadcast",     name: "방송통신시설 — 방송국·데이터센터·송수신탑", catNo: "22" },
  // 23. 발전
  { id: "power",         name: "발전시설 — 원자력·화력·수력·태양력 발전소", catNo: "23" },
  // 24. 묘지
  { id: "cemetery",      name: "묘지 관련 시설 — 화장시설·봉안당", catNo: "24" },
  // 25. 관광휴게
  { id: "tourist_rest",  name: "관광 휴게시설 — 야외음악당·관망탑·휴게소", catNo: "25" },
  // 26. 장례
  { id: "funeral",       name: "장례시설 — 장례식장·동물장례식장", catNo: "26" },
  // 27. 지하가
  { id: "underground_mall", name: "지하가 — 지하상가", catNo: "27", isUGMall: true },
  { id: "tunnel",        name: "지하가 — 터널", catNo: "27", isTunnel: true },
  // 28. 지하구
  { id: "underground_duct", name: "지하구 (전력·통신·가스 등 공동수용)", catNo: "28", isUGDuct: true },
  // 29. 문화재
  { id: "heritage",      name: "문화재 — 국보·보물 지정 목조건축물", catNo: "29", isHeritage: true },
  // 30. 복합건축물
  { id: "mixed",         name: "복합건축물 (2개 이상 용도 혼용)", catNo: "30" },
];

// ─────────────────────────────────────────────────────────────
// 3. getEraByDate — 건축허가일로 적용 법령 시대 반환
// ─────────────────────────────────────────────────────────────
export function getEraByDate(dateStr) {
  if (!dateStr) return null;
  const t = new Date(dateStr);
  if (isNaN(t.getTime())) return null;
  return [...LAW_ERAS]
    .sort((a, b) => new Date(b.start) - new Date(a.start))
    .find(e => new Date(e.start) <= t && t <= new Date(e.end)) || null;
}

// ─────────────────────────────────────────────────────────────
// 4. getRequirements — 핵심 함수 (법령 시대별 소방시설 판별)
// ─────────────────────────────────────────────────────────────
export function getRequirements(buildingTypeId, area, gf, bf, occ, eraId) {
  const bt = BUILDING_TYPES.find(t => t.id === buildingTypeId);
  if (!bt) return [];
  switch (eraId) {
    case "era3d": return _era3d(bt, area, gf, bf, occ);
    case "era3c": return _era3c(bt, area, gf, bf, occ);
    case "era3b": return _era3b(bt, area, gf, bf, occ);
    case "era3a": return _era3a(bt, area, gf, bf, occ);
    case "era2b": return _era2b(bt, area, gf, bf, occ);
    case "era2a": return _era2a(bt, area, gf, bf, occ);
    case "era1":  return _era1(bt, area, gf, bf, occ);
    default:      return _era3d(bt, area, gf, bf, occ);
  }
}

// ─────────────────────────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────────────────────────
function _a(n) { return n.toLocaleString(); }

function _push(r, name, cat, cond, art, std, note, warn) {
  const obj = { name, cat, cond, art, std };
  if (note) obj.note = note;
  if (warn) obj.warn = warn;
  r.push(obj);
}

// ─────────────────────────────────────────────────────────────
// ERA3D: 소방시설법 현행 (2025.11.25~)
// 기준: 시행령 별표4 (대통령령 제36220호)
// ─────────────────────────────────────────────────────────────
function _era3d(bt, area, gf, bf, occ) {
  const r = [];
  const cat = bt.catNo;
  const {
    isApt, isNursing, isMental, isWelfareRes, isTunnel, isUGDuct, isUGMall,
    isCattle, isGas, isParking, isHangar, isHotel, isMovie, isLargeRetail,
    isSubway, isSchool, isHeritage
  } = bt;
  const isWelfare   = cat === "9";
  const isMixed     = cat === "30";
  const isHospital  = cat === "7";

  // ── 소화설비 ─────────────────────────────────────────────

  // 소화기구
  if (area >= 33 || isHeritage || isGas || isTunnel || isUGDuct) {
    _push(r, "소화기구", "소화설비",
      area >= 33 ? `연면적 ${_a(area)}㎡ (33㎡ 이상)` : "별도 설치 대상 (문화재·가스시설·터널·지하구)",
      "소방시설법 시행령 별표4 제1호가목", "NFTC 101");
  }

  // 자동소화장치
  if (isApt) {
    _push(r, "자동소화장치", "소화설비", "각 세대별 주방",
      "별표4 제2호가목", "NFTC 105");
  }
  if (isMixed && gf >= 30) {
    _push(r, "자동소화장치", "소화설비",
      `지상 ${gf}층 이상 복합건축물 각 세대별 주방`,
      "별표4 제2호나목", "NFTC 105");
  }

  // 옥내소화전설비
  let hasIndoorHydrant = false;
  if (!isTunnel && area >= 3000) {
    _push(r, "옥내소화전설비", "소화설비",
      `연면적 ${_a(area)}㎡ (3천㎡ 이상) 모든 층`,
      "별표4 제3호가목", "NFTC 102", null,
      "지하가 중 터널 제외. 축사 제외.");
    hasIndoorHydrant = true;
  }
  if (!hasIndoorHydrant && (bf > 0 || gf >= 4) && area >= 600) {
    _push(r, "옥내소화전설비", "소화설비",
      `지하층·무창층 또는 4층이상 층 중 바닥면적 600㎡이상 층 해당 여부 확인 필요`,
      "별표4 제3호나목", "NFTC 102",
      "지하층·무창층·4층이상 층 중 바닥면적 600㎡이상인 층이 1개라도 있으면 모든 층 설치");
  }
  if (isTunnel) {
    _push(r, "옥내소화전설비", "소화설비",
      "터널 길이 1,000m 이상인 것 해당 여부 확인 필요",
      "별표4 제3호다목", "NFTC 102");
  }
  if (isUGDuct) {
    _push(r, "옥내소화전설비", "소화설비",
      "지하구 (공동구 제외)",
      "별표4 제3호라목", "NFTC 102");
  }

  // 스프링클러설비
  let hasSPK = false;
  if (gf >= 6 && !isApt) {
    _push(r, "스프링클러설비", "소화설비",
      `지상 ${gf}층 이상 모든 층`,
      "별표4 제4호가목", "NFTC 103A");
    hasSPK = true;
  }
  if (!hasSPK && ["3","4","11"].includes(cat) && (area >= 5000 || occ >= 500)) {
    _push(r, "스프링클러설비", "소화설비",
      area >= 5000 ? `연면적 ${_a(area)}㎡ (5천㎡ 이상) 모든 층` : `수용인원 ${occ}명 (500명 이상) 모든 층`,
      "별표4 제4호나목", "NFTC 103A", "동물원·식물원 제외");
    hasSPK = true;
  }
  if (!hasSPK && ["5","6","16"].includes(cat) && (area >= 5000 || occ >= 500)) {
    _push(r, "스프링클러설비", "소화설비",
      area >= 5000 ? `연면적 ${_a(area)}㎡ (5천㎡ 이상) 모든 층` : `수용인원 ${occ}명 (500명 이상) 모든 층`,
      "별표4 제4호다목", "NFTC 103A");
    hasSPK = true;
  }
  if (!hasSPK && (isHospital || isWelfare) && area >= 600) {
    _push(r, "스프링클러설비", "소화설비",
      `연면적 ${_a(area)}㎡ (600㎡ 이상) 모든 층`,
      "별표4 제4호라목", "NFTC 103A");
    hasSPK = true;
  }

  // 간이스프링클러
  if (!hasSPK && isWelfare && area < 600) {
    _push(r, "간이스프링클러설비", "소화설비",
      `연면적 ${_a(area)}㎡ (600㎡ 미만 노유자시설)`,
      "별표4 제5호가목", "NFTC 103B",
      "단독경보형 감지기 설치 시 간이스프링클러 제외 가능");
  }
  if (!hasSPK && isNursing && area < 600) {
    _push(r, "간이스프링클러설비", "소화설비",
      `연면적 ${_a(area)}㎡ (600㎡ 미만 요양병원)`,
      "별표4 제5호나목", "NFTC 103B",
      "정신병원·의료재활시설 제외");
  }

  // 물분무등소화설비
  if (isHangar) {
    _push(r, "물분무등소화설비", "소화설비", "항공기 격납고",
      "별표4 제6호가목", "NFTC 104");
  }
  if (isParking && area >= 800) {
    _push(r, "물분무등소화설비", "소화설비",
      `연면적 ${_a(area)}㎡ (800㎡ 이상 주차전용건축물)`,
      "별표4 제6호나목", "NFTC 104");
  }
  if (cat === "22" && area >= 500) {
    _push(r, "물분무등소화설비", "소화설비",
      `바닥면적 ${_a(area)}㎡이상 전기실·발전실·변전실·통신기기실·전산실 (500㎡ 이상)`,
      "별표4 제6호다목", "NFTC 104");
  }

  // 옥외소화전
  if (!isApt && gf >= 1 && area >= 9000) {
    _push(r, "옥외소화전설비", "소화설비",
      `지상 1·2층 바닥면적 합계 9천㎡ 이상 해당 여부 확인 (연면적 ${_a(area)}㎡)`,
      "별표4 제7호가목", "NFTC 109",
      "지상 1층+2층 바닥면적 합계 기준. 전체 연면적과 다를 수 있으므로 층별 면적 확인 필요.");
  }
  if (isHeritage) {
    _push(r, "옥외소화전설비", "소화설비",
      "국보·보물 지정 목조건축물",
      "별표4 제7호나목", "NFTC 109");
  }

  // ── 경보설비 ─────────────────────────────────────────────

  // 단독경보형 감지기 (소규모 대상)
  if (cat === "1" && area < 1000) {
    _push(r, "단독경보형 감지기", "경보설비",
      `연면적 ${_a(area)}㎡ (1,000㎡ 미만 아파트등·기숙사)`,
      "별표4 제2호나목", "NFTC 201");
  }
  if (["8","10"].includes(cat) && area < 2000) {
    _push(r, "단독경보형 감지기", "경보설비",
      `연면적 ${_a(area)}㎡ (2,000㎡ 미만 합숙소·기숙사)`,
      "별표4 제2호나목", "NFTC 201");
  }
  if (isWelfare && area < 600) {
    _push(r, "단독경보형 감지기", "경보설비",
      `연면적 ${_a(area)}㎡ (600㎡ 미만 노유자시설)`,
      "별표4 제2호나목", "NFTC 201");
  }
  if (cat === "13" && area < 600) {
    _push(r, "단독경보형 감지기", "경보설비",
      `연면적 ${_a(area)}㎡ (600㎡ 미만 숙박시설)`,
      "별표4 제2호나목", "NFTC 201");
  }

  // 자동화재탐지설비 or 비상경보설비
  let hasAutoDetect = false;
  let adCond = "", adArt = "";

  if (["2","7","9","13","14","26","30"].includes(cat) && area >= 600) {
    hasAutoDetect = true; adCond = `연면적 ${_a(area)}㎡ (600㎡ 이상)`;
    adArt = "별표4 제2호다목1)";
  }
  if (!hasAutoDetect && (isApt || isMental || isNursing || isWelfareRes)) {
    hasAutoDetect = true; adCond = "모든 층 (규모 무관)";
    adArt = "별표4 제2호다목2)";
  }
  if (!hasAutoDetect && ["3","4","5","6","8","10","11","12","19","20","21","22","23","24","25","15","16"].includes(cat) && area >= 1000) {
    hasAutoDetect = true; adCond = `연면적 ${_a(area)}㎡ (1천㎡ 이상)`;
    adArt = "별표4 제2호다목3)";
  }
  if (!hasAutoDetect && ["8","10"].includes(cat) && area >= 2000) {
    hasAutoDetect = true; adCond = `연면적 ${_a(area)}㎡ (합숙소·기숙사 2천㎡ 이상)`;
    adArt = "별표4 제2호다목4)";
  }
  if (!hasAutoDetect && isUGDuct) {
    hasAutoDetect = true; adCond = "지하구"; adArt = "별표4 제2호다목6)";
  }

  if (hasAutoDetect) {
    _push(r, "자동화재탐지설비", "경보설비", adCond,
      `소방시설법 시행령 ${adArt}`, "NFTC 203");
  } else {
    const needsAlarm = (!isTunnel && area >= 400) || (bf > 0) || (occ >= 50);
    if (needsAlarm) {
      _push(r, "비상경보설비", "경보설비",
        area >= 400 ? `연면적 ${_a(area)}㎡ (400㎡ 이상)` :
          bf > 0    ? `지하층 있음 (지하층·무창층 바닥면적 150㎡이상 확인)` :
                      `수용인원 ${occ}명 (50명 이상)`,
        "별표4 제2호가목", "NFTC 201");
    }
  }

  // 시각경보기
  const sigakCats = ["2","3","4","5","6","7","9","10","11","12","13","14","23","26"];
  if (hasAutoDetect && (sigakCats.includes(cat) || isUGMall)) {
    _push(r, "시각경보기", "경보설비",
      "자동화재탐지설비 설치 대상 용도 (청각장애인 대피 지원)",
      "별표4 제2호라목", "NFTC 203");
  }

  // 자동화재속보설비
  if (["12","15","16","23","30"].includes(cat) && area >= 1500) {
    _push(r, "자동화재속보설비", "경보설비",
      `바닥면적 1,500㎡ 이상인 층 있음`,
      "별표4 제2호마목1)", "NFTC 204",
      "방재실 등 수신기 설치 장소에 24시간 상주 근무자 있으면 면제 가능");
  }
  if (isWelfareRes) {
    _push(r, "자동화재속보설비", "경보설비",
      "노유자 생활시설 (규모 무관)",
      "별표4 제2호마목2)", "NFTC 204");
  } else if (isWelfare && area >= 500) {
    _push(r, "자동화재속보설비", "경보설비",
      `연면적 ${_a(area)}㎡ (500㎡ 이상 노유자시설)`,
      "별표4 제2호마목3)", "NFTC 204");
  }
  if (isNursing && area < 500) {
    _push(r, "자동화재속보설비", "경보설비",
      `연면적 ${_a(area)}㎡ (500㎡ 미만 요양병원)`,
      "별표4 제2호마목4)", "NFTC 204");
  }

  // 가스누설경보기
  if (isGas || isUGDuct) {
    _push(r, "가스누설경보기", "경보설비",
      isGas ? "가스시설 설치 대상물" : "지하구",
      "별표4 제2호바목", "NFTC 206");
  }

  // ── 피난구조설비 ─────────────────────────────────────────

  // 피난기구: 특정소방대상물 모든 층 (피난층·1층·2층·11층이상 제외)
  if (!isTunnel && !isUGDuct && (gf > 2 || bf > 0)) {
    _push(r, "피난기구", "피난구조설비",
      `3~10층 해당 층 (피난층·1층·2층·11층이상 제외)`,
      "소방시설법 시행령 별표4 제3호가목", "NFTC 301",
      "노유자시설·의료시설은 NFTC 301 별도 기준 적용");
  }

  // 인명구조기구
  if (isUGMall) {
    _push(r, "인명구조기구", "피난구조설비", "지하상가",
      "별표4 제3호나목1)", "NFTC 302",
      "방열복 또는 방화복, 공기호흡기, 인공소생기 비치");
  }
  if (isHotel && gf >= 7) {
    _push(r, "인명구조기구", "피난구조설비",
      `지상 ${gf}층 이상 관광호텔`,
      "별표4 제3호나목2)", "NFTC 302",
      "방열복 또는 방화복, 공기호흡기, 인공소생기 비치");
  }
  if (isHospital && !isNursing && !isMental && gf >= 5) {
    _push(r, "인명구조기구", "피난구조설비",
      `지상 ${gf}층 이상 병원`,
      "별표4 제3호나목3)", "NFTC 302",
      "방열복 또는 방화복, 공기호흡기, 인공소생기 비치");
  }

  // ★★★ 유도등 — 면적·층수 기준 없음. 특정소방대상물 전체 ★★★
  if (!isTunnel && !isCattle) {
    _push(r, "유도등 및 유도표지", "피난구조설비",
      "특정소방대상물 해당 (면적·층수 기준 없음)",
      "소방시설법 시행령 별표4 제3호다목", "NFTC 303",
      "피난구유도등·통로유도등·유도표지 전부 포함. 축사(직접사육 부분)·터널만 제외.");
  }

  // ★★★ 비상조명등 — 5층이상 AND 연면적3천㎡이상 (동시충족), or 지하층/무창층 450㎡이상 ★★★
  if (!isTunnel) {
    if (gf >= 5 && area >= 3000) {
      _push(r, "비상조명등", "피난구조설비",
        `지상 ${gf}층 이상 + 연면적 ${_a(area)}㎡ (5층이상·3천㎡이상 동시충족)`,
        "별표4 제3호라목1)", "NFTC 304");
    } else if (gf >= 5 && area < 3000) {
      // 5층이상이지만 3천㎡미만 → 해당없음 (OR조건 아님, AND조건임)
    } else if (gf < 5 && area >= 3000) {
      // 3천㎡이상이지만 5층미만 → 해당없음
    }
    if (bf > 0) {
      _push(r, "비상조명등", "피난구조설비",
        `지하 ${bf}층 존재 — 지하층·무창층 바닥면적 450㎡이상 여부 현장 확인 필요`,
        "별표4 제3호라목2)", "NFTC 304",
        "지하층 또는 무창층으로서 바닥면적 450㎡이상인 층에 설치. 층별 면적 현장 확인 필요.");
    }
  } else {
    _push(r, "비상조명등", "피난구조설비",
      "터널 길이 500m 이상 해당 여부 확인 필요",
      "별표4 제3호라목3)", "NFTC 304");
  }

  // 휴대용 비상조명등
  if (cat === "13") {
    _push(r, "휴대용 비상조명등", "피난구조설비",
      "숙박시설 (규모 무관)", "별표4 제3호마목1)", "NFTC 304");
  }
  if (isLargeRetail) {
    _push(r, "휴대용 비상조명등", "피난구조설비",
      "판매시설 중 대규모점포", "별표4 제3호마목2)", "NFTC 304");
  }
  if (isSubway) {
    _push(r, "휴대용 비상조명등", "피난구조설비",
      "철도 및 도시철도시설 중 지하역사", "별표4 제3호마목3)", "NFTC 304");
  }
  if (isUGMall) {
    _push(r, "휴대용 비상조명등", "피난구조설비",
      "지하상가", "별표4 제3호마목4)", "NFTC 304");
  }
  if (isMovie && occ >= 100) {
    _push(r, "휴대용 비상조명등", "피난구조설비",
      `영화상영관 수용인원 ${occ}명 (100명 이상)`,
      "별표4 제3호마목5)", "NFTC 304");
  }

  // ── 소화용수설비 ─────────────────────────────────────────

  if (!isGas && !isUGDuct && area >= 5000) {
    _push(r, "상수도소화용수설비", "소화용수설비",
      `연면적 ${_a(area)}㎡ (5천㎡ 이상)`,
      "별표4 제4호가목", "NFTC 401",
      "대지 경계선 140m 이내 호칭지름 75mm이상 상수도 배관 미설치 시 소화수조·저수조로 대체");
  }

  // ── 소화활동설비 ─────────────────────────────────────────

  // 제연설비
  const jenTargets = ["3","4","5","6","7","9","11","13","14"];
  if (jenTargets.includes(cat) && bf > 0) {
    _push(r, "제연설비", "소화활동설비",
      `무창층 바닥면적 합계 1천㎡이상 여부 현장 확인 필요`,
      "별표4 제5호가목1)", "NFTC 501",
      "해당 용도 무창층의 바닥면적 합계가 1천㎡이상인 층에 적용");
  }
  if (isUGMall && area >= 1000) {
    _push(r, "제연설비", "소화활동설비",
      `연면적 ${_a(area)}㎡ (1천㎡ 이상 지하상가)`,
      "별표4 제5호가목2)", "NFTC 501");
  }
  if (isMovie && occ >= 100) {
    _push(r, "제연설비", "소화활동설비",
      `수용인원 ${occ}명 이상 영화상영관`,
      "별표4 제5호가목3)", "NFTC 501");
  }

  // ★★★ 연결송수관설비 — (5층이상 AND 6천㎡이상) OR 7층이상 ★★★
  if ((gf >= 5 && area >= 6000) || gf >= 7) {
    _push(r, "연결송수관설비", "소화활동설비",
      gf >= 7
        ? `지상 ${gf}층 이상`
        : `지상 ${gf}층 이상 + 연면적 ${_a(area)}㎡ (5층이상·6천㎡이상 동시충족)`,
      "소방시설법 시행령 별표4 제5호나목", "NFTC 502",
      gf >= 7 && gf < 8 && area < 6000
        ? "7층이상 단독 조건 충족. 연면적 6천㎡미만이어도 적용."
        : null);
  }

  // 연결살수설비: 지하층 바닥면적 합계 150㎡이상(학교 700㎡이상)
  if (bf > 0) {
    const thr = isSchool ? 700 : 150;
    if (area >= thr) {
      _push(r, "연결살수설비", "소화활동설비",
        `지하층 바닥면적 합계 ${isSchool ? "700" : "150"}㎡ 이상 해당 여부 확인 필요`,
        "별표4 제5호다목1)", "NFTC 503",
        "지하층 바닥면적 합계 기준. 가스시설·지하구 제외. 층별 면적 현장 확인 필요.");
    }
  }
  if (isUGDuct) {
    _push(r, "연결살수설비", "소화활동설비",
      "지하구", "별표4 제5호다목2)", "NFTC 503");
  }

  // 비상콘센트설비
  if (gf >= 11) {
    _push(r, "비상콘센트설비", "소화활동설비",
      `지상 ${gf}층 이상 — 11층 이상의 층`,
      "별표4 제5호라목1)", "NFTC 504");
  }
  if (bf >= 3 && area >= 1000) {
    _push(r, "비상콘센트설비", "소화활동설비",
      `지하 ${bf}층 이상 + 지하층 바닥면적 합계 1천㎡이상 — 모든 지하층`,
      "별표4 제5호라목2)", "NFTC 504");
  }

  // 무선통신보조설비
  if (isUGMall && area >= 1000) {
    _push(r, "무선통신보조설비", "소화활동설비",
      `연면적 ${_a(area)}㎡ (1천㎡ 이상 지하상가)`,
      "별표4 제5호마목1)", "NFTC 505");
  }
  if (!isUGMall && bf > 0 && area >= 3000) {
    _push(r, "무선통신보조설비", "소화활동설비",
      `지하층 바닥면적 합계 3천㎡이상 또는 지하3층이상+450㎡이상 해당 여부 확인 필요`,
      "별표4 제5호마목2)", "NFTC 505",
      "지하층 바닥면적 합계 3천㎡이상, 또는 지하3층이상이고 바닥면적 합계 450㎡이상인 경우 적용");
  }
  if (isTunnel) {
    _push(r, "무선통신보조설비", "소화활동설비",
      "터널 길이 500m 이상 해당 여부 확인 필요",
      "별표4 제5호마목3)", "NFTC 505");
  }
  if (isUGDuct) {
    _push(r, "무선통신보조설비", "소화활동설비",
      "공동구", "별표4 제5호마목4)", "NFTC 505");
  }

  // 연소방지설비: 지하구
  if (isUGDuct) {
    _push(r, "연소방지설비", "소화활동설비",
      "지하구 (공동구 포함)", "별표4 제5호바목", "NFTC 506");
  }

  return r;
}

// ─────────────────────────────────────────────────────────────
// ERA3C: 소방시설법 (2022.12~2025.11)
// 별표4 기준 — era3d와 핵심 조건 동일, 일부 문구 차이
// ─────────────────────────────────────────────────────────────
function _era3c(bt, area, gf, bf, occ) {
  // era3d와 핵심 기준 동일. 별표2 항목 수만 25개(구 체계).
  // 조건 로직은 동일하게 위임
  const r = _era3d(bt, area, gf, bf, occ);
  // 적용 조항 표기를 era3c 기준으로 조정
  return r.map(item => ({
    ...item,
    art: item.art.replace("별표4", "별표4(2022.12 시행)"),
    std: item.std.replace("NFTC", "NFTC")
  }));
}

// ─────────────────────────────────────────────────────────────
// ERA3B: 화재예방소방시설법 시대 (2017.1.26~2022.11)
// 기준: 화재예방법 시행령 별표5
// ─────────────────────────────────────────────────────────────
function _era3b(bt, area, gf, bf, occ) {
  const r = [];
  const cat = bt.catNo;
  const { isApt, isNursing, isMental, isWelfareRes, isTunnel, isUGDuct,
          isUGMall, isCattle, isGas, isParking, isHangar, isHotel,
          isMovie, isLargeRetail, isSubway, isSchool, isHeritage } = bt;
  const isWelfare = cat === "9";
  const isHospital = cat === "7";

  // 소화기구
  if (area >= 33) {
    _push(r, "소화기구", "소화설비", `연면적 ${_a(area)}㎡ (33㎡ 이상)`,
      "화재예방소방시설법 시행령 별표5 제1호", "NFSC 101");
  }

  // 옥내소화전
  if (!isTunnel && area >= 3000) {
    _push(r, "옥내소화전설비", "소화설비", `연면적 ${_a(area)}㎡ (3천㎡ 이상) 모든 층`,
      "별표5 제3호가목", "NFSC 102");
  } else if (!isTunnel && (bf > 0 || gf >= 4) && area >= 600) {
    _push(r, "옥내소화전설비", "소화설비",
      "지하층·무창층·4층이상 층 중 바닥면적 600㎡이상 층 해당 확인",
      "별표5 제3호나목", "NFSC 102");
  }

  // 스프링클러 (2017 기준 — 6층이상 전면 적용)
  let hasSPK = false;
  if (gf >= 6 && !isApt) {
    _push(r, "스프링클러설비", "소화설비", `지상 ${gf}층 이상 모든 층`,
      "별표5 제4호가목", "NFSC 103A"); hasSPK = true;
  }
  if (!hasSPK && ["3","4","11"].includes(cat) && (area >= 5000 || occ >= 500)) {
    _push(r, "스프링클러설비", "소화설비",
      area >= 5000 ? `연면적 ${_a(area)}㎡ (5천㎡ 이상)` : `수용인원 ${occ}명 (500명 이상)`,
      "별표5 제4호나목", "NFSC 103A"); hasSPK = true;
  }
  if (!hasSPK && ["5","6","16"].includes(cat) && (area >= 5000 || occ >= 500)) {
    _push(r, "스프링클러설비", "소화설비",
      area >= 5000 ? `연면적 ${_a(area)}㎡ (5천㎡ 이상)` : `수용인원 ${occ}명 (500명 이상)`,
      "별표5 제4호다목", "NFSC 103A"); hasSPK = true;
  }
  if (!hasSPK && (isHospital || isWelfare) && area >= 600) {
    _push(r, "스프링클러설비", "소화설비", `연면적 ${_a(area)}㎡ (600㎡ 이상) 모든 층`,
      "별표5 제4호라목", "NFSC 103A"); hasSPK = true;
  }
  // 2017 추가: 요양병원 스프링클러 (600㎡이상)
  if (!hasSPK && isNursing && area >= 600) {
    _push(r, "스프링클러설비", "소화설비", `연면적 ${_a(area)}㎡ (600㎡ 이상 요양병원) — 2017개정 소급`,
      "별표5 제4호라목", "NFSC 103A",
      "부칙 제5조: 기존 요양병원 3년 이내 설치 의무(소급적용)",
      "요양병원 소급 적용 여부 — 건축허가일과 2017.1.26 이후 설치 의무 확인 필요");
  }

  // 간이스프링클러
  if (!hasSPK && isWelfare && area < 600) {
    _push(r, "간이스프링클러설비", "소화설비",
      `연면적 ${_a(area)}㎡ (600㎡ 미만 노유자시설)`,
      "별표5 제5호가목", "NFSC 103B",
      "2014 부칙 소급적용. 단독경보형 감지기 설치 시 제외 가능");
  }
  if (!hasSPK && isNursing && area < 600) {
    _push(r, "간이스프링클러설비", "소화설비",
      `연면적 ${_a(area)}㎡ (600㎡ 미만 요양병원)`,
      "별표5 제5호나목", "NFSC 103B");
  }

  // 자동화재탐지설비
  let hasAD = false; let adC = "", adA = "";
  if (["2","7","9","13","14","26","30"].includes(cat) && area >= 600) {
    hasAD = true; adC = `연면적 ${_a(area)}㎡ (600㎡ 이상)`; adA = "별표5 제2호다목";
  }
  if (!hasAD && (isApt || isMental || isNursing || isWelfareRes)) {
    hasAD = true; adC = "모든 층"; adA = "별표5 제2호다목";
  }
  if (!hasAD && ["3","4","5","6","8","10","11","12","15","16","19","20","21","22","23","24","25"].includes(cat) && area >= 1000) {
    hasAD = true; adC = `연면적 ${_a(area)}㎡ (1천㎡ 이상)`; adA = "별표5 제2호다목";
  }
  if (hasAD) {
    _push(r, "자동화재탐지설비", "경보설비", adC,
      `화재예방소방시설법 시행령 ${adA}`, "NFSC 203");
  } else if (area >= 400 || bf > 0 || occ >= 50) {
    _push(r, "비상경보설비", "경보설비",
      area >= 400 ? `연면적 ${_a(area)}㎡ (400㎡ 이상)` : "지하층·무창층 150㎡이상 또는 수용인원 50명이상",
      "별표5 제2호가목", "NFSC 201");
  }

  // 자동화재속보설비
  if (isWelfareRes) {
    _push(r, "자동화재속보설비", "경보설비", "노유자 생활시설",
      "별표5 제2호마목", "NFSC 204",
      "2014 부칙 소급적용");
  } else if (isWelfare && area >= 500) {
    _push(r, "자동화재속보설비", "경보설비",
      `연면적 ${_a(area)}㎡ (500㎡ 이상 노유자시설)`,
      "별표5 제2호마목", "NFSC 204");
  }
  if (isNursing) {
    _push(r, "자동화재속보설비", "경보설비",
      "요양병원 (2017개정 소급)",
      "별표5 제2호마목", "NFSC 204",
      "2017.1.26 개정 시행으로 요양병원 추가");
  }

  // ★★★ 유도등 — 층수·면적 기준 없음 (화재예방소방시설법 시대도 동일) ★★★
  if (!isTunnel && !isCattle) {
    _push(r, "유도등 및 유도표지", "피난구조설비",
      "특정소방대상물 해당 (면적·층수 기준 없음)",
      "화재예방소방시설법 시행령 별표5 제3호다목", "NFSC 303",
      "피난구유도등·통로유도등·유도표지 전부. 축사·터널 제외.");
  }

  // ★★★ 비상조명등 — 5층이상 AND 연면적3천㎡이상(동시) or 지하층 450㎡이상 ★★★
  if (!isTunnel) {
    if (gf >= 5 && area >= 3000) {
      _push(r, "비상조명등", "피난구조설비",
        `지상 ${gf}층 이상 + 연면적 ${_a(area)}㎡ (5층이상·3천㎡이상 동시충족)`,
        "별표5 제3호라목", "NFSC 304");
    }
    if (bf > 0) {
      _push(r, "비상조명등", "피난구조설비",
        `지하 ${bf}층 존재 — 지하층·무창층 450㎡이상 여부 확인`,
        "별표5 제3호라목", "NFSC 304",
        "지하층 또는 무창층 바닥면적 450㎡이상인 층에 설치");
    }
  }

  // 휴대용 비상조명등
  if (cat === "13") {
    _push(r, "휴대용 비상조명등", "피난구조설비", "숙박시설",
      "별표5 제3호마목", "NFSC 304");
  }
  if (isLargeRetail) {
    _push(r, "휴대용 비상조명등", "피난구조설비", "대규모점포",
      "별표5 제3호마목", "NFSC 304");
  }
  if (isSubway) {
    _push(r, "휴대용 비상조명등", "피난구조설비", "지하역사",
      "별표5 제3호마목", "NFSC 304");
  }
  if (isUGMall) {
    _push(r, "휴대용 비상조명등", "피난구조설비", "지하상가",
      "별표5 제3호마목", "NFSC 304");
  }

  // 소화용수설비
  if (!isGas && !isUGDuct && area >= 5000) {
    _push(r, "상수도소화용수설비", "소화용수설비",
      `연면적 ${_a(area)}㎡ (5천㎡ 이상)`,
      "별표5 제4호가목", "NFSC 401");
  }

  // 피난기구
  if (!isTunnel && !isUGDuct && (gf > 2 || bf > 0)) {
    _push(r, "피난기구", "피난구조설비",
      "3~10층 해당 층 (피난층·1층·2층·11층이상 제외)",
      "별표5 제3호가목", "NFSC 301");
  }

  // ★★★ 연결송수관설비 — (5층이상 AND 6천㎡이상) OR 7층이상 ★★★
  if ((gf >= 5 && area >= 6000) || gf >= 7) {
    _push(r, "연결송수관설비", "소화활동설비",
      gf >= 7
        ? `지상 ${gf}층 이상`
        : `지상 ${gf}층 이상 + 연면적 ${_a(area)}㎡ (5층이상·6천㎡이상 동시충족)`,
      "화재예방소방시설법 시행령 별표5 제5호나목", "NFSC 502");
  }

  // 연결살수설비
  if (bf > 0 && area >= (isSchool ? 700 : 150)) {
    _push(r, "연결살수설비", "소화활동설비",
      `지하층 바닥면적 합계 ${isSchool ? 700 : 150}㎡이상 해당 확인`,
      "별표5 제5호다목", "NFSC 503");
  }

  // 비상콘센트
  if (gf >= 11) {
    _push(r, "비상콘센트설비", "소화활동설비", `지상 ${gf}층 이상 — 11층 이상의 층`,
      "별표5 제5호라목", "NFSC 504");
  }
  if (bf >= 3 && area >= 1000) {
    _push(r, "비상콘센트설비", "소화활동설비",
      `지하 ${bf}층이상+1천㎡이상 — 모든 지하층`,
      "별표5 제5호라목", "NFSC 504");
  }

  return r;
}

// ─────────────────────────────────────────────────────────────
// ERA3A: 화재예방소방시설법 (2012.2.5~2017.1.25)
// ─────────────────────────────────────────────────────────────
function _era3a(bt, area, gf, bf, occ) {
  const r = [];
  const cat = bt.catNo;
  const { isApt, isNursing, isMental, isWelfareRes, isTunnel, isUGDuct,
          isUGMall, isCattle, isGas, isParking, isHangar, isHotel,
          isMovie, isLargeRetail, isSubway, isSchool, isHeritage } = bt;
  const isWelfare = cat === "9";
  const isHospital = cat === "7";

  // 소화기구
  if (area >= 33) {
    _push(r, "소화기구", "소화설비", `연면적 ${_a(area)}㎡ (33㎡ 이상)`,
      "화재예방소방시설법 시행령 별표5", "NFSC 101");
  }

  // 옥내소화전
  if (!isTunnel && area >= 3000) {
    _push(r, "옥내소화전설비", "소화설비", `연면적 ${_a(area)}㎡ (3천㎡ 이상)`,
      "별표5 제3호", "NFSC 102");
  } else if ((bf > 0 || gf >= 4) && area >= 600) {
    _push(r, "옥내소화전설비", "소화설비",
      "지하층·무창층·4층이상 층 600㎡이상 확인",
      "별표5 제3호", "NFSC 102");
  }

  // 스프링클러 (2012~2017 기준: 6층이상, 주요 용도별 기준)
  let hasSPK = false;
  if (gf >= 6 && !isApt) {
    _push(r, "스프링클러설비", "소화설비", `지상 ${gf}층 이상 모든 층`,
      "별표5 제4호가목", "NFSC 103A"); hasSPK = true;
  }
  if (!hasSPK && ["3","4","11"].includes(cat) && (area >= 5000 || occ >= 500)) {
    _push(r, "스프링클러설비", "소화설비",
      `연면적 ${_a(area)}㎡ 또는 수용인원 ${occ}명`,
      "별표5 제4호", "NFSC 103A"); hasSPK = true;
  }
  if (!hasSPK && ["5","6","16"].includes(cat) && area >= 5000) {
    _push(r, "스프링클러설비", "소화설비", `연면적 ${_a(area)}㎡ (5천㎡ 이상)`,
      "별표5 제4호", "NFSC 103A"); hasSPK = true;
  }
  if (!hasSPK && isHospital && area >= 600) {
    _push(r, "스프링클러설비", "소화설비", `연면적 ${_a(area)}㎡ (600㎡ 이상 의료시설)`,
      "별표5 제4호", "NFSC 103A"); hasSPK = true;
  }
  if (!hasSPK && isWelfare && area >= 600) {
    _push(r, "스프링클러설비", "소화설비", `연면적 ${_a(area)}㎡ (600㎡ 이상 노유자시설)`,
      "별표5 제4호", "NFSC 103A"); hasSPK = true;
  }

  // 간이스프링클러 (2014 부칙 소급 포함)
  if (!hasSPK && isWelfare && area < 600) {
    _push(r, "간이스프링클러설비", "소화설비",
      `연면적 ${_a(area)}㎡ (600㎡ 미만 노유자시설)`,
      "별표5 제5호", "NFSC 103B",
      null,
      "⚠️ 2014 부칙 제2조 소급: 기존 노유자시설은 이 영 시행 후 2년 이내 설치 의무. 건축허가일이 2014 이전이어도 적용 확인 필요.");
  }

  // 자탐
  let hasAD = false; let adC = "", adA = "";
  if (["2","7","9","13","14","26","30"].includes(cat) && area >= 600) {
    hasAD = true; adC = `연면적 ${_a(area)}㎡ (600㎡ 이상)`; adA = "별표5";
  }
  if (!hasAD && (isApt || isMental || isWelfareRes)) {
    hasAD = true; adC = "모든 층"; adA = "별표5";
  }
  if (!hasAD && ["3","4","5","6","8","10","11","12","15","16"].includes(cat) && area >= 1000) {
    hasAD = true; adC = `연면적 ${_a(area)}㎡ (1천㎡ 이상)`; adA = "별표5";
  }
  if (hasAD) {
    _push(r, "자동화재탐지설비", "경보설비", adC,
      `화재예방소방시설법 시행령 ${adA}`, "NFSC 203");
  } else if (area >= 400 || bf > 0 || occ >= 50) {
    _push(r, "비상경보설비", "경보설비",
      `연면적 ${_a(area)}㎡ 또는 지하층·수용인원 조건`,
      "별표5", "NFSC 201");
  }

  // 자동화재속보설비 (2014 소급 포함)
  if (isWelfareRes || isWelfare) {
    _push(r, "자동화재속보설비", "경보설비",
      isWelfareRes ? "노유자 생활시설" : `연면적 ${_a(area)}㎡ 이상 노유자시설`,
      "별표5", "NFSC 204",
      null,
      "⚠️ 2014 부칙 소급: 기존 노유자시설 2년 이내 설치 의무 확인 필요");
  }

  // ★ 유도등 — 면적·층수 기준 없음
  if (!isTunnel && !isCattle) {
    _push(r, "유도등 및 유도표지", "피난구조설비",
      "특정소방대상물 해당 (면적·층수 기준 없음)",
      "화재예방소방시설법 시행령 별표5 제3호다목", "NFSC 303");
  }

  // ★ 비상조명등 — 5층이상 AND 3천㎡이상 동시충족
  if (!isTunnel && gf >= 5 && area >= 3000) {
    _push(r, "비상조명등", "피난구조설비",
      `지상 ${gf}층 이상 + 연면적 ${_a(area)}㎡ (5층이상·3천㎡이상 동시충족)`,
      "별표5 제3호라목", "NFSC 304");
  }
  if (bf > 0) {
    _push(r, "비상조명등", "피난구조설비",
      `지하층 존재 — 바닥면적 450㎡이상 여부 확인`,
      "별표5 제3호라목", "NFSC 304");
  }

  // ★ 연결송수관설비 — (5층이상 AND 6천㎡이상) OR 7층이상
  if ((gf >= 5 && area >= 6000) || gf >= 7) {
    _push(r, "연결송수관설비", "소화활동설비",
      gf >= 7 ? `지상 ${gf}층 이상` : `지상 ${gf}층이상 + 연면적 ${_a(area)}㎡`,
      "별표5 제5호나목", "NFSC 502");
  }

  // 소화용수
  if (area >= 5000) {
    _push(r, "상수도소화용수설비", "소화용수설비",
      `연면적 ${_a(area)}㎡ (5천㎡ 이상)`, "별표5 제4호", "NFSC 401");
  }

  // 피난기구
  if (!isTunnel && (gf > 2 || bf > 0)) {
    _push(r, "피난기구", "피난구조설비",
      "3~10층 해당 층", "별표5 제3호가목", "NFSC 301");
  }

  return r;
}

// ─────────────────────────────────────────────────────────────
// ERA2B: 소방시설설치유지법 후기 (2009.7.31~2012.2.4)
// ─────────────────────────────────────────────────────────────
function _era2b(bt, area, gf, bf, occ) {
  const r = [];
  const cat = bt.catNo;
  const { isApt, isTunnel, isCattle, isUGDuct, isSchool } = bt;
  const isWelfare = cat === "9";
  const isHospital = cat === "7";

  if (area >= 33) {
    _push(r, "소화기구", "소화설비", `연면적 ${_a(area)}㎡ (33㎡ 이상)`,
      "소방시설설치유지법 시행령 별표4", "NFSC 101");
  }
  if (!isTunnel && area >= 3000) {
    _push(r, "옥내소화전설비", "소화설비", `연면적 ${_a(area)}㎡ (3천㎡ 이상)`,
      "별표4 제3호", "NFSC 102");
  }

  let hasSPK = false;
  if (gf >= 11) {
    _push(r, "스프링클러설비", "소화설비", `지상 ${gf}층 이상 (11층이상 기준)`,
      "별표4 제4호", "NFSC 103A"); hasSPK = true;
  }
  if (!hasSPK && ["3","4","11"].includes(cat) && area >= 5000) {
    _push(r, "스프링클러설비", "소화설비", `연면적 ${_a(area)}㎡ (5천㎡ 이상)`,
      "별표4 제4호", "NFSC 103A"); hasSPK = true;
  }
  if (!hasSPK && isHospital && area >= 3000) {
    _push(r, "스프링클러설비", "소화설비", `연면적 ${_a(area)}㎡ (3천㎡ 이상 병원)`,
      "별표4 제4호", "NFSC 103A"); hasSPK = true;
  }
  if (!hasSPK && isWelfare && area >= 1000) {
    _push(r, "스프링클러설비", "소화설비", `연면적 ${_a(area)}㎡ (1천㎡ 이상 노유자시설)`,
      "별표4 제4호", "NFSC 103A"); hasSPK = true;
  }

  let hasAD = false;
  if (["2","7","9","13","14"].includes(cat) && area >= 600) {
    hasAD = true;
    _push(r, "자동화재탐지설비", "경보설비", `연면적 ${_a(area)}㎡ (600㎡ 이상)`,
      "소방시설설치유지법 시행령 별표4", "NFSC 203");
  }
  if (!hasAD && ["3","4","5","6","8","10","11","12"].includes(cat) && area >= 1000) {
    hasAD = true;
    _push(r, "자동화재탐지설비", "경보설비", `연면적 ${_a(area)}㎡ (1천㎡ 이상)`,
      "소방시설설치유지법 시행령 별표4", "NFSC 203");
  }
  if (!hasAD && area >= 400) {
    _push(r, "비상경보설비", "경보설비", `연면적 ${_a(area)}㎡ (400㎡ 이상)`,
      "별표4", "NFSC 201");
  }

  if (!isTunnel && !isCattle) {
    _push(r, "유도등 및 유도표지", "피난구조설비",
      "특정소방대상물 해당 (면적·층수 기준 없음)",
      "소방시설설치유지법 시행령 별표4", "NFSC 303");
  }
  if (!isTunnel && gf >= 5 && area >= 3000) {
    _push(r, "비상조명등", "피난구조설비",
      `지상 ${gf}층 이상 + 연면적 ${_a(area)}㎡ (5층이상·3천㎡이상 동시충족)`,
      "별표4", "NFSC 304");
  }
  if (bf > 0) {
    _push(r, "비상조명등", "피난구조설비",
      "지하층 존재 — 450㎡이상 확인", "별표4", "NFSC 304");
  }
  if (!isTunnel && (gf > 2 || bf > 0)) {
    _push(r, "피난기구", "피난구조설비", "3~10층 해당 층",
      "별표4", "NFSC 301");
  }
  if (area >= 5000) {
    _push(r, "상수도소화용수설비", "소화용수설비", `연면적 ${_a(area)}㎡ (5천㎡ 이상)`,
      "별표4", "NFSC 401");
  }
  if ((gf >= 5 && area >= 6000) || gf >= 7) {
    _push(r, "연결송수관설비", "소화활동설비",
      gf >= 7 ? `지상 ${gf}층 이상` : `5층이상+6천㎡이상`,
      "소방시설설치유지법 시행령 별표4", "NFSC 502");
  }
  if (gf >= 11) {
    _push(r, "비상콘센트설비", "소화활동설비", `지상 ${gf}층 이상 — 11층이상 층`,
      "별표4", "NFSC 504");
  }
  return r;
}

// ─────────────────────────────────────────────────────────────
// ERA2A: 소방시설설치유지법 초기 (2004.5.30~2009.7.30)
// ─────────────────────────────────────────────────────────────
function _era2a(bt, area, gf, bf, occ) {
  // era2b와 유사하되 노유자시설 기준 다소 완화
  return _era2b(bt, area, gf, bf, occ).map(item => ({
    ...item,
    art: item.art.replace("후기", "초기")
  }));
}

// ─────────────────────────────────────────────────────────────
// ERA1: 소방법 시대 (1958.3.11~2004.5.29)
// ─────────────────────────────────────────────────────────────
function _era1(bt, area, gf, bf, occ) {
  const r = [];
  const cat = bt.catNo;
  const { isApt, isTunnel, isCattle } = bt;
  const isWelfare = cat === "9";
  const isHospital = cat === "7";

  if (area >= 33) {
    _push(r, "소화기구", "소화설비", `연면적 ${_a(area)}㎡ (33㎡ 이상)`,
      "소방법 시행령 별표", "소방기술기준에 관한 규칙");
  }
  if (area >= 3000) {
    _push(r, "옥내소화전설비", "소화설비", `연면적 ${_a(area)}㎡ (3천㎡ 이상)`,
      "소방법 시행령 별표", "소방기술기준");
  }

  // 스프링클러 (소방법 시대: 11층이상 또는 주요 대형 시설)
  let hasSPK = false;
  if (gf >= 11) {
    _push(r, "스프링클러설비", "소화설비", `지상 ${gf}층 이상`,
      "소방법 시행령 별표", "소방기술기준"); hasSPK = true;
  }
  if (!hasSPK && ["3","4","11","5"].includes(cat) && area >= 5000) {
    _push(r, "스프링클러설비", "소화설비", `연면적 ${_a(area)}㎡ (5천㎡ 이상 대형시설)`,
      "소방법 시행령 별표", "소방기술기준"); hasSPK = true;
  }
  if (!hasSPK && isHospital && area >= 3000) {
    _push(r, "스프링클러설비", "소화설비", `연면적 ${_a(area)}㎡ (병원 3천㎡이상)`,
      "소방법 시행령 별표", "소방기술기준"); hasSPK = true;
  }

  // 자탐 (소방법 시대 기준)
  if (["2","7","9","13","14"].includes(cat) && area >= 1000) {
    _push(r, "자동화재탐지설비", "경보설비", `연면적 ${_a(area)}㎡ (1천㎡ 이상)`,
      "소방법 시행령 별표", "소방기술기준");
  } else if (["3","4","5","6","8","11","12"].includes(cat) && area >= 3000) {
    _push(r, "자동화재탐지설비", "경보설비", `연면적 ${_a(area)}㎡ (3천㎡ 이상)`,
      "소방법 시행령 별표", "소방기술기준");
  } else if (area >= 600) {
    _push(r, "비상경보설비", "경보설비", `연면적 ${_a(area)}㎡ (600㎡ 이상)`,
      "소방법 시행령 별표", "소방기술기준");
  }

  if (!isTunnel && !isCattle) {
    _push(r, "유도등 및 유도표지", "피난구조설비",
      "특정소방대상물 해당 (면적·층수 기준 없음)",
      "소방법 시행령 별표", "소방기술기준");
  }
  if (gf >= 5 && area >= 3000) {
    _push(r, "비상조명등", "피난구조설비",
      `지상 ${gf}층이상 + 연면적 ${_a(area)}㎡ (5층이상·3천㎡이상 동시충족)`,
      "소방법 시행령 별표", "소방기술기준");
  }
  if (bf > 0) {
    _push(r, "비상조명등", "피난구조설비",
      "지하층 존재 — 450㎡이상 확인", "소방법 시행령 별표", "소방기술기준");
  }
  if (!isTunnel && (gf > 2 || bf > 0)) {
    _push(r, "피난기구", "피난구조설비",
      "3층 이상 해당 층", "소방법 시행령 별표", "소방기술기준");
  }
  if (area >= 5000) {
    _push(r, "상수도소화용수설비", "소화용수설비",
      `연면적 ${_a(area)}㎡ (5천㎡ 이상)`, "소방법 시행령 별표", "소방기술기준");
  }
  if (gf >= 7 || (gf >= 5 && area >= 6000)) {
    _push(r, "연결송수관설비", "소화활동설비",
      gf >= 7 ? `지상 ${gf}층 이상` : `5층이상+6천㎡이상`,
      "소방법 시행령 별표", "소방기술기준");
  }
  if (gf >= 11) {
    _push(r, "비상콘센트설비", "소화활동설비",
      `지상 ${gf}층 이상`, "소방법 시행령 별표", "소방기술기준");
  }

  return r;
}

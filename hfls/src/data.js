// ============================================================
// src/data.js  —  HFLS 법령 데이터 및 판별 로직 v3.0
//
// 기준 법령:
//   ① 소방시설 설치 및 관리에 관한 법률 시행령 별표 2 (특정소방대상물 분류)
//   ② 소방시설 설치 및 관리에 관한 법률 시행령 별표 4 (소방시설 설치기준)
//   ③ 연혁: 소방법(1958~2004) → 소방시설설치유지법(2004~2012)
//           → 화재예방소방시설법(2012~2022) → 현행 소방시설법(2022~)
//
// ★ 주요 변경 (v3.0):
//   - 다중이용업소: 별도 특별법(다중이용업소의 안전관리에 관한 특별법,
//     법률 제7609호, 2006.3.24 시행) 적용 대상이므로 본 시스템에서 제외
//   - 노유자시설: 소방시설법 시행령 별표 2 제11호에 따라
//       가. 노유자생활시설 (24시간 거주) / 나. 노유자이용시설 (낮 이용)으로 분리
//   - 시행령 별표 4 각 호·목 조항 번호 정확 명시
// ============================================================

// ── 주요 개정 기준일 상수 ────────────────────────────────────
const D = {
  // ── 아파트 스프링클러 강화 연혁 ──
  APT_SPK_16F:       "1990-06-29", // 1990.6.29 시행령 개정 → 16층 이상 신설
  APT_SPK_11F:       "2005-01-01", // 2004.5.29 개정 → 아파트 11층 이상 (2005.1.1 시행)
  APT_SPK_6F:        "2017-01-26", // 2017.1.26 시행령 개정 → 6층 이상
  APT_SPK_ALL:       "2024-07-17", // 2024.7.17 NFTC 103 개정 → 전 층

  // ── 노유자시설 스프링클러 ──
  SENIOR_SPK:        "2001-05-20", // 2001.3.20 개정(2001.5.20 시행) → 노유자·의료시설 600㎡↑
                                   // 배경: 씨랜드 청소년수련원 화재(1999.6.30, 23명 사망)

  // ── 요양병원·의료시설 ──
  HOSP_SPK:          "2014-10-08", // 2014.7.7 개정(2014.10.8 시행) → 요양병원 스프링클러 전층
                                   // 배경: 장성 효사랑 요양병원 화재(2014.5.28, 21명 사망)
  HOSP_EASY_SPK:     "2015-07-01", // 2015.1.6 개정(2015.7.1 시행) → 요양병원 600㎡ 미만 간이SPK

  // ── 간이스프링클러 ──
  EASY_GEUNLIN:      "2004-05-30", // 2003.5.29 개정(2004.5.30 시행) → 근린생활시설 1,000㎡↑
  EASY_SENIOR_USER:  "2008-08-16", // 2008.2.15 개정(2008.8.16 시행) → 노유자이용시설 300~600㎡
                                   // 배경: 이천 냉동창고 화재(2008.1.7, 40명 사망) 후 개정
  EASY_SENIOR_LIFE:  "2012-02-05", // 2011.8.4 제정(2012.2.5 시행) → 노유자생활시설 전층
                                   // 화재예방소방시설법 시행 시 신설
  EASY_SENIOR_EXC:   "2013-02-10", // 2013.1.11 개정(2013.2.10 시행) → 단독·공동주택 내 제외 단서

  // ── 소급 적용 ──
  RETRO_PILOTI:      "2018-06-28", // 2018.3.27 개정(2018.6.28 시행) → 필로티 주차 SPK 소급
                                   // 배경: 제천 스포츠센터 화재(2017.12.21, 29명 사망)
  RETRO_WAREHOUSE:   "2021-08-01", // 2021.3.30 개정(2021.8.1 시행) → 물류창고 SPK 소급
                                   // 배경: 이천 물류창고 화재(2020.4.29, 38명 사망)

  // ── 기타 설비 ──
  SENIOR_LIFE_SPK:   "2012-02-05", // 노유자생활시설 스프링클러 (600㎡↑, 2001.5.20 신설 동일 기준)
};

// 날짜 비교 헬퍼
const gte = (dateStr, key) => new Date(dateStr) >= new Date(D[key]);
const lt  = (dateStr, key) => new Date(dateStr) <  new Date(D[key]);

// ── 법령 시대 정의 ──────────────────────────────────────────
export const LAW_ERAS = [
  {
    id: "era0", label: "소방법 시대",
    start: "1958-03-11", end: "2004-05-29",
    lawName: "소방법", lawShort: "소방법",
    lawCode: "법률 제485호 (1958.3.11 제정)",
    decree: "소방법 시행령 / 소방법 시행규칙",
    standard: "소방기술기준에관한규칙",
    standardAuth: "내무부령 → 행정자치부령",
    mainArticle: "소방법 제8조 (소방시설 설치·유지), 시행령 별표 1·2",
    selfCheck: "소방법 제8조의2 (자체점검)",
    safetyInspection: "소방특별조사 (소방서장)",
    color: "#6b7280",
    note: "단일법 체계. 소방조직·화재예방·소방시설·위험물을 통합 규율. 특정소방대상물 및 소방시설 기준은 시행령 별표로 규정. 1990~1999년 대형화재 이후 수차례 강화. 2004.5.29 폐지."
  },
  {
    id: "era1", label: "소방시설설치유지법 시대",
    start: "2004-05-30", end: "2012-02-04",
    lawName: "소방시설설치유지및안전관리에관한법률", lawShort: "소방시설설치유지법",
    lawCode: "법률 제6893호 (2003.5.29 제정, 2004.5.30 시행)",
    decree: "소방시설설치유지법 시행령",
    standard: "화재안전기준 (NFSC)",
    standardAuth: "소방방재청 고시",
    mainArticle: "제9조 (특정소방대상물 소방시설 설치), 시행령 별표 2·4",
    selfCheck: "제25조 (소방시설등의 자체점검)",
    safetyInspection: "소방특별조사 (소방본부장·소방서장)",
    color: "#2563eb",
    note: "소방 4분법 시행(소방시설설치유지법·소방기본법·위험물안전관리법·소방시설공사업법). NFSC 고시체계 도입. 대구지하철 화재(2003.2.18, 192명 사망) 후 제정. 특정소방대상물 분류 대폭 세분화."
  },
  {
    id: "era2", label: "화재예방소방시설법 시대",
    start: "2012-02-05", end: "2022-11-30",
    lawName: "화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률", lawShort: "화재예방소방시설법",
    lawCode: "법률 제11037호 (2011.8.4 제정, 2012.2.5 시행)",
    decree: "화재예방소방시설법 시행령",
    standard: "화재안전기준 (NFSC)",
    standardAuth: "국민안전처 → 소방청 고시",
    mainArticle: "제9조 (특정소방대상물 소방시설 설치), 시행령 별표 2·5",
    selfCheck: "제25조 (소방시설등의 자체점검)",
    safetyInspection: "화재안전조사 (소방관서장)",
    color: "#d97706",
    note: "노유자생활시설 별도 기준 신설(2012.2.5). 장성 요양병원 화재(2014) → 요양병원 소급강화. 제천화재(2017) → 아파트 6층↑ 의무화(2017.1.26). 밀양화재(2018) → 의료시설 추가 강화."
  },
  {
    id: "era3", label: "현행 소방시설법 시대",
    start: "2022-12-01", end: "2099-12-31",
    lawName: "소방시설 설치 및 관리에 관한 법률", lawShort: "소방시설법(현행)",
    lawCode: "법률 제18522호 (2021.11.30 제정, 2022.12.1 시행)",
    decree: "소방시설법 시행령",
    standard: "NFTC(화재안전기술기준) / NFPC(화재안전성능기준)",
    standardAuth: "소방청 고시 (이원화)",
    mainArticle: "제12조 (특정소방대상물 소방시설 설치), 시행령 별표 2·4",
    selfCheck: "제22조 (소방시설등의 자체점검)",
    safetyInspection: "화재안전조사 (화재의 예방 및 안전관리에 관한 법률 제7조)",
    color: "#16a34a",
    note: "2분법 시행(소방시설법+화재예방법). NFTC/NFPC 이원화. 창고시설 NFTC 103A 신설(2022.12.1). 2024.7.17 아파트 스프링클러 전층 의무화. 특정소방대상물 분류 정비."
  }
];

// ── 건물 용도 (소방시설법 시행령 별표 2 기준) ─────────────────
// ★ 다중이용업소: 「다중이용업소의 안전관리에 관한 특별법」 별도 적용 → 본 시스템 제외
// ★ 노유자시설: 시행령 별표 2 제11호 가·나목 기준으로 분리
export const BUILDING_TYPES = [
  {
    id: "apt",
    name: "공동주택 — 아파트",
    lawRef: "소방시설법 시행령 별표 2 제1호 가목 (주택법 시행령 제3조 아파트)",
    desc: "주택으로 쓰는 층수가 5층 이상인 주택"
  },
  {
    id: "villa",
    name: "공동주택 — 연립·다세대",
    lawRef: "소방시설법 시행령 별표 2 제1호 나·다목",
    desc: "연립주택(4층 이하, 연면적 660㎡ 초과), 다세대주택(4층 이하, 연면적 660㎡ 이하)"
  },
  {
    id: "geunlin",
    name: "근린생활시설 (1종·2종)",
    lawRef: "소방시설법 시행령 별표 2 제3호·제4호",
    desc: "1종: 슈퍼·의원·우체국 등. 2종: 공연장·종교집회장·학원·독서실 등"
  },
  {
    id: "office",
    name: "업무시설",
    lawRef: "소방시설법 시행령 별표 2 제10호",
    desc: "공공업무시설, 일반업무시설 (오피스텔 포함)"
  },
  {
    id: "retail",
    name: "판매시설",
    lawRef: "소방시설법 시행령 별표 2 제7호",
    desc: "도매시장·소매시장·상점 (바닥면적 합계 1,000㎡ 이상 또는 해당 용도 바닥면적 합계 300㎡ 이상)"
  },
  {
    id: "warehouse",
    name: "창고시설·물류창고",
    lawRef: "소방시설법 시행령 별표 2 제17호",
    desc: "창고, 하역장, 물류터미널, 집배송시설"
  },
  {
    id: "medical",
    name: "의료시설 (요양병원 포함)",
    lawRef: "소방시설법 시행령 별표 2 제6호",
    desc: "병원·요양병원·정신의료기관·의료재활시설. ★요양병원(정신병원·의료재활 제외)은 2014.10.8 이후 소급 기준 적용"
  },
  {
    id: "senior_life",
    name: "노유자시설 — 노유자생활시설 (24시간 거주)",
    lawRef: "소방시설법 시행령 별표 2 제11호 가목",
    desc: "노인요양시설·노인요양공동생활가정, 아동양육시설·아동일시보호시설·아동보호치료시설·공동생활가정, 장애인 거주시설, 정신요양시설·정신재활시설(공동생활가정), 노숙인자활·재활·요양시설 등 → 간이스프링클러 전층 의무(2012.2.5~)"
  },
  {
    id: "senior_user",
    name: "노유자시설 — 노유자이용시설 (낮 이용)",
    lawRef: "소방시설법 시행령 별표 2 제11호 나목",
    desc: "노인여가복지시설(경로당·노인복지관·노인교실), 어린이집·아동복지시설(거주시설 제외), 장애인 주간보호시설, 정신재활시설(공동생활가정 제외), 노숙인 일시보호시설 등 → 일반 노유자시설 기준 적용"
  },
  {
    id: "education",
    name: "교육연구시설",
    lawRef: "소방시설법 시행령 별표 2 제12호",
    desc: "학교·교육원·직업훈련소·학원·연구소·도서관"
  },
  {
    id: "factory",
    name: "공장",
    lawRef: "소방시설법 시행령 별표 2 제16호",
    desc: "물품의 제조·가공·수리에 사용되는 건축물"
  },
  {
    id: "complex",
    name: "복합건축물",
    lawRef: "소방시설법 시행령 별표 2 제28호",
    desc: "하나의 건축물에 둘 이상의 용도로 사용되는 것 (별표 2 각 호의 용도 복합)"
  },
];

// ── 주요 화재사고 & 법령 강화 연계 데이터 ─────────────────────
// ★ 소방방재 실무에서 핵심적으로 언급되는 사고 대응형 입법 사례
export const FIRE_ACCIDENTS = [
  {
    year: 1971, name: "서울 대연각호텔 화재",
    location: "서울 중구 충무로", deaths: 163,
    types: ["office", "complex", "retail"],
    amendment: "1972년 소방법 전면 개정",
    summary: "국내 최대 화재참사. 고층건축물 화재 대응 기준 없음이 피해 심화. 이후 특수건물 소방시설 기준 강화, 피난계단·배연설비 신설. 고층건물 소화활동설비 기준의 원점.",
    retroactive: false,
    lawDetail: "소방법 시행령 개정 — 특수건물 스프링클러·연결송수관 기준 신설"
  },
  {
    year: 1974, name: "서울 대왕코너 화재",
    location: "서울 중구", deaths: 88,
    types: ["retail", "complex"],
    amendment: "1975년 소방법 시행령 개정",
    summary: "지하 판매시설 화재. 피난구·유도등 기준 강화 계기. 판매시설 소방시설 의무 면적 기준 최초 설정.",
    retroactive: false,
    lawDetail: "소방법 시행령 — 판매시설·지하층 피난구조설비 기준 신설"
  },
  {
    year: 1999, name: "씨랜드 청소년수련원 화재",
    location: "경기 화성", deaths: 23,
    types: ["senior_life", "senior_user", "education"],
    amendment: "2001.3.20 개정 (2001.5.20 시행)",
    summary: "유아 19명 포함 23명 사망. 노유자시설·청소년시설 스프링클러 600㎡↑ 전층 의무화 최초 신설. 자동화재속보설비 노유자 500㎡↑ 신설. 아동·유아 이용 시설 소방시설 기준의 출발점.",
    retroactive: false,
    lawDetail: "소방법 시행령 별표 개정 — 노유자시설 스프링클러(600㎡↑) 및 자동화재속보설비(500㎡↑) 신설"
  },
  {
    year: 2003, name: "대구지하철 1호선 방화 화재",
    location: "대구 중구 중앙로역", deaths: 192,
    types: ["geunlin", "retail", "office"],
    amendment: "2004.5.30 소방 4분법 시행",
    summary: "192명 사망, 최대 지하철 화재 참사. 단일 소방법 체계의 한계 노출. 소방시설설치유지법 등 4분법 시행 직접 계기. 지하층 특정소방대상물 소방시설 기준 전면 강화.",
    retroactive: false,
    lawDetail: "소방시설설치유지및안전관리에관한법률 등 4법 제정 — 특정소방대상물 분류·소방시설기준 NFSC 체계 전환"
  },
  {
    year: 2008, name: "이천 냉동창고(코리아2000) 화재",
    location: "경기 이천 호법면", deaths: 40,
    types: ["warehouse", "factory"],
    amendment: "2008.2.15 개정 (2008.8.16 시행)",
    summary: "냉동창고 우레탄폼 단열재 화재. 창고시설 스프링클러 기준 강화 및 냉동창고 특례(건식·준비작동식 허용) 신설. 노유자이용시설 간이스프링클러 300~600㎡ 범위 추가. 건식스프링클러 NFSC 특례 최초 도입.",
    retroactive: false,
    lawDetail: "소방시설설치유지법 시행령 별표 4 개정 — 냉동창고 SPK 특례 신설, 간이SPK 노유자이용시설 적용 확대"
  },
  {
    year: 2014, name: "장성 효사랑 요양병원 화재",
    location: "전남 장성군", deaths: 21,
    types: ["medical", "senior_life"],
    amendment: "2014.7.7 개정 (2014.10.8 시행)",
    summary: "고령 거동불능 환자 21명 사망. 요양병원 스프링클러 전층 의무화(기존 건물 소급, 경과 조항 없음). 2015.7.1 시행 개정으로 600㎡ 미만 요양병원 간이스프링클러 추가. ★ 경과 규정 없는 소급 적용 사례 — 자체점검 실무상 핵심 쟁점",
    retroactive: true,
    lawDetail: "화재예방소방시설법 시행령 별표 5 제1호 나목 개정 — 요양병원 스프링클러 전층 (경과조항 없음 → 기존건물 소급)"
  },
  {
    year: 2017, name: "제천 스포츠센터 화재",
    location: "충북 제천시", deaths: 29,
    types: ["complex", "geunlin", "office"],
    amendment: "2018.3.27 개정 (2018.6.28 시행)",
    summary: "불법 증축·필로티 주차장 연소 확대. 필로티 구조 주차 공간 스프링클러 강화. 아파트 스프링클러는 이미 2017.1.26에 11층→6층↑ 강화됨. ★ 기존 건물 소급 이행 기한(2년) 부여. 화재 당시 사용승인된 건물의 법령 불소급 문제가 사회 문제화.",
    retroactive: true,
    lawDetail: "화재예방소방시설법 시행령 별표 5 개정 — 필로티 주차공간 SPK 의무화, 기존건물 이행기한 2년"
  },
  {
    year: 2018, name: "밀양 세종병원 화재",
    location: "경남 밀양시", deaths: 47,
    types: ["medical"],
    amendment: "2018.6. ~ 2018.9. 추가 개정",
    summary: "47명 사망(2018.1.26). 요양병원 자동화재탐지설비 전 구역 수신기 직결 의무화. 스프링클러 소급 적용 범위 추가 확대. 의료시설 화재안전기준(NFSC 203) 전면 재정비. ★ 연속 대형화재로 의료시설 소급강화 이중적용 사례 발생.",
    retroactive: true,
    lawDetail: "화재예방소방시설법 시행령 별표 5 개정 — 의료시설 자동화재탐지설비 강화(수신기·중계기 기준)"
  },
  {
    year: 2020, name: "이천 물류창고(한익스프레스) 화재",
    location: "경기 이천시 마장면", deaths: 38,
    types: ["warehouse"],
    amendment: "2021.3.30 개정 (2021.8.1 시행)",
    summary: "38명 사망. 2008년 이천 냉동창고 화재와 동일 지역 반복 발생. 기존 물류창고(5,000㎡↑) 스프링클러 소급 설치 의무화, 이행 기한 3년(~2024.7.31). 랙식 창고 750㎡↑ 기준 강화. ★ 반복 발생 사고 대응형 입법의 전형적 사례.",
    retroactive: true,
    lawDetail: "화재예방소방시설법 시행령 별표 5 개정 — 물류창고 SPK 소급(5,000㎡↑), 이행기한 3년"
  },
];

// ── 법령 시대 판별 ───────────────────────────────────────────
export function getEraByDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return LAW_ERAS.find(e => d >= new Date(e.start) && d <= new Date(e.end)) || null;
}

// ── 화재안전기준 코드 생성 헬퍼 ──────────────────────────────
// era0: 소방기술기준에관한규칙
// era1·era2: NFSC (화재안전기준)
// era3: NFTC (화재안전기술기준) / NFPC (화재안전성능기준)
function stdCode(n, eraId) {
  if (eraId === "era0") return "소방기술기준에관한규칙";
  if (eraId === "era3") return `NFTC ${n}`;
  return `NFSC ${n}`;
}

// 시행령 별표 4 조항 코드 생성 헬퍼
// era0: 소방법 시행령 / era1: 소방시설설치유지법 시행령 / era2: 화재예방소방시설법 시행령 / era3: 소방시설법 시행령
function scheduleRef(era, detail) {
  const base = {
    era0: "소방법 시행령 별표",
    era1: "소방시설설치유지법 시행령 별표 4",
    era2: "화재예방소방시설법 시행령 별표 5",
    era3: "소방시설법 시행령 별표 4"
  };
  return `${base[era] || base.era3}${detail ? " " + detail : ""}`;
}

// ============================================================
// ★ 핵심 함수: 의무 소방시설 판별
//   dateStr 파라미터 → era 내 세부 개정일 분기 처리
//   type: BUILDING_TYPES의 id
// ============================================================
export function getRequirements(type, area, gf, bf, occ, eraId, dateStr) {
  const reqs = [];
  const ds = dateStr || (eraId === "era0" ? "1980-01-01"
    : eraId === "era1" ? "2008-01-01"
    : eraId === "era2" ? "2015-01-01" : "2023-01-01");

  const push = (obj) => reqs.push({ ...obj, std: obj.std || stdCode("101", eraId) });

  // ── ① 소화기구 ────────────────────────────────────────────
  // 근거: 소방시설법 시행령 별표 4 제1호 가목
  // 연혁: 소방법 시행령 → NFSC 101 → NFTC 101 (동일 기준 유지)
  if (area >= 33) {
    push({
      cat: "소화설비", name: "소화기구 (소화기·간이소화용구·자동소화장치)",
      cond: `연면적 33㎡ 이상 (입력: ${area.toLocaleString()}㎡)`,
      art: eraId === "era0"
        ? "소방기술기준에관한규칙 제4조"
        : `${scheduleRef(eraId, "제1호 가목")} / ${stdCode("101", eraId)} 제4조`,
      std: stdCode("101", eraId),
      warn: (type === "senior_life" || type === "senior_user" || type === "medical")
        ? "노유자·의료시설: 투척용소화용구 1/2 이상 설치 가능 (NFSC 101 제4조 제5항, 2010.2.4 이후)"
        : null
    });
  }

  // ── ② 옥내소화전설비 ─────────────────────────────────────
  // 근거: 소방시설법 시행령 별표 4 제1호 라목
  // 의료·판매: 1,500㎡↑ / 일반: 3,000㎡↑ (era0: 2,100㎡↑)
  {
    const minA = eraId === "era0" ? 2100
      : ["retail", "medical"].includes(type) ? 1500 : 3000;
    if (area >= minA)
      push({
        cat: "소화설비", name: "옥내소화전설비",
        cond: `연면적 ${minA.toLocaleString()}㎡ 이상 (입력: ${area.toLocaleString()}㎡)`,
        art: `${scheduleRef(eraId, "제1호 라목")} / ${stdCode("102", eraId)}`,
        std: stdCode("102", eraId)
      });
  }

  // ── ③ 스프링클러설비 ─────────────────────────────────────
  // 근거: 소방시설법 시행령 별표 4 제1호 나목

  // [아파트] 날짜 기반 4단계 분기
  if (type === "apt") {
    let need = false, cond = "", note = null;
    if (eraId === "era0") {
      if (gte(ds, "APT_SPK_16F") && gf >= 16) {
        need = true;
        cond = `16층 이상 아파트 (1990.6.29 신설 기준, 입력: ${gf}층)`;
      }
    } else if (eraId === "era1") {
      if (lt(ds, "APT_SPK_11F") && gf >= 16) {
        need = true;
        cond = `16층 이상 아파트 (사용승인일 ${ds} — 2005.1.1 이전 구 기준)`;
      } else if (gte(ds, "APT_SPK_11F") && gf >= 11) {
        need = true;
        cond = `11층 이상 아파트 (2004.5.29 개정, 2005.1.1 시행, 입력: ${gf}층)`;
      }
    } else if (eraId === "era2") {
      if (lt(ds, "APT_SPK_6F") && gf >= 11) {
        need = true;
        cond = `11층 이상 아파트 (2017.1.26 개정 전 기준, 입력: ${gf}층)`;
        note = "2017.1.26 시행령 개정으로 6층↑으로 강화. 기존 건물 소급 여부 확인 필요.";
      } else if (lt(ds, "APT_SPK_6F") && gf >= 6 && gf < 11) {
        need = false; // 소급경고는 getRetroactiveWarnings에서 처리
      } else if (gte(ds, "APT_SPK_6F") && gf >= 6) {
        need = true;
        cond = `6층 이상 아파트 (2017.1.26 시행령 개정 적용, 입력: ${gf}층)`;
      }
    } else if (eraId === "era3") {
      if (lt(ds, "APT_SPK_ALL") && gf >= 6) {
        need = true;
        cond = `6층 이상 아파트 (2022.12.1 시행 기준, 입력: ${gf}층)`;
        note = "2024.7.17 NFTC 103 개정으로 전층 의무화. 소급 여부 확인 필요.";
      } else if (gte(ds, "APT_SPK_ALL")) {
        need = true;
        cond = `전층 (2024.7.17 NFTC 103 개정 — 아파트 전층 의무화, 입력: ${gf}층)`;
      }
    }
    if (need)
      push({
        cat: "소화설비", name: "스프링클러설비",
        cond, warn: note,
        art: `${scheduleRef(eraId, "제1호 나목 7)")} / ${stdCode("103", eraId)}`,
        std: stdCode("103", eraId)
      });
  }

  // [요양병원] 스프링클러 (2014.10.8 이후 전층, 이전 600㎡↑)
  if (type === "medical") {
    if (gte(ds, "HOSP_SPK"))
      push({
        cat: "소화설비", name: "스프링클러설비",
        cond: "요양병원(정신병원·의료재활시설 제외) — 전층 (2014.10.8 시행)",
        art: `${scheduleRef(eraId, "제1호 나목 6)")} / ${stdCode("103", eraId)}`,
        std: stdCode("103", eraId),
        warn: "★ 소급 적용(경과규정 없음): 2014.7.7 개정(2014.10.8 시행) — 장성 효사랑 요양병원 화재(2014.5.28, 21명 사망) 직후 즉각 강화. 기존 건물도 즉시 설치 의무 발생."
      });
    else if (gte(ds, "SENIOR_SPK") && area >= 600)
      push({
        cat: "소화설비", name: "스프링클러설비",
        cond: `의료시설 연면적 600㎡ 이상 (입력: ${area.toLocaleString()}㎡, 2001.5.20 이후 기준)`,
        art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
        std: stdCode("103", eraId)
      });
  }

  // [노유자생활시설] 스프링클러 — 600㎡ 이상 전층 (2001.5.20~)
  if (type === "senior_life" && gte(ds, "SENIOR_SPK") && area >= 600)
    push({
      cat: "소화설비", name: "스프링클러설비",
      cond: `노유자생활시설 연면적 600㎡ 이상 전층 (입력: ${area.toLocaleString()}㎡, 2001.5.20 신설)`,
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId),
      warn: "씨랜드 화재(1999) 이후 신설. 노유자생활시설은 간이스프링클러(전층, 2012.2.5~)도 별도 의무 있음."
    });

  // [노유자이용시설] 스프링클러 — 600㎡ 이상 전층 (2001.5.20~)
  if (type === "senior_user" && gte(ds, "SENIOR_SPK") && area >= 600)
    push({
      cat: "소화설비", name: "스프링클러설비",
      cond: `노유자이용시설 연면적 600㎡ 이상 전층 (입력: ${area.toLocaleString()}㎡, 2001.5.20 신설)`,
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId)
    });

  // [판매시설] 스프링클러
  if (type === "retail") {
    const thr = eraId === "era0" ? 9000 : eraId === "era1" ? 6000 : 5000;
    if (area >= thr || occ >= 500)
      push({
        cat: "소화설비", name: "스프링클러설비",
        cond: `판매시설 연면적 ${thr.toLocaleString()}㎡ 이상 또는 수용인원 500명 이상 (입력: ${area.toLocaleString()}㎡, ${occ}명)`,
        art: `${scheduleRef(eraId, "제1호 나목 8)")} / ${stdCode("103", eraId)}`,
        std: stdCode("103", eraId)
      });
  }

  // [창고시설] 스프링클러
  if (type === "warehouse") {
    if (eraId === "era3" && area >= 1500)
      push({
        cat: "소화설비", name: "스프링클러설비 (NFTC 103A — 창고 전용 기준)",
        cond: `창고시설 1,500㎡ 이상 (NFTC 103A, 2022.12.1 신설, 입력: ${area.toLocaleString()}㎡)`,
        art: `${scheduleRef("era3", "제1호 나목")} / NFTC 103A`,
        std: "NFTC 103A",
        warn: "창고전용 NFTC 103A (2022.12.1 신설). 이천 물류창고 화재(2020.4.29) 후 강화. 기존 창고(5,000㎡↑) 소급 이행기한(2021.8.1~2024.7.31) 확인 필요."
      });
    else if (area >= 5000)
      push({
        cat: "소화설비", name: "스프링클러설비",
        cond: `창고시설 5,000㎡ 이상 (입력: ${area.toLocaleString()}㎡)`,
        art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
        std: stdCode("103", eraId)
      });
  }

  // [11층 이상 전층] — 아파트 제외
  if (type !== "apt" && gf >= 11)
    push({
      cat: "소화설비", name: "스프링클러설비",
      cond: `11층 이상 전층 (입력: ${gf}층)`,
      art: `${scheduleRef(eraId, "제1호 나목 7)")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId)
    });

  // [복합건축물]
  if (type === "complex" && area >= 5000)
    push({
      cat: "소화설비", name: "스프링클러설비",
      cond: `복합건축물 연면적 5,000㎡ 이상 (입력: ${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId)
    });

  // ── ④ 간이스프링클러설비 ─────────────────────────────────
  // 근거: 소방시설법 시행령 별표 4 제1호 다목

  // [근린생활시설] 2004.5.30~, 1,000㎡↑
  if (type === "geunlin" && gte(ds, "EASY_GEUNLIN") && area >= 1000)
    push({
      cat: "소화설비", name: "간이스프링클러설비",
      cond: `근린생활시설 연면적 1,000㎡ 이상 전층 (2004.5.30 이후, 입력: ${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제1호 다목")} / ${stdCode("103B", eraId)}`,
      std: stdCode("103B", eraId)
    });

  // [노유자생활시설] 간이SPK — 전층 (2012.2.5 신설)
  // 근거: 화재예방소방시설법 시행령 별표 5 제1호 다목 / 현행 별표 4 제1호 다목 4)
  if (type === "senior_life") {
    if (gte(ds, "EASY_SENIOR_LIFE"))
      push({
        cat: "소화설비", name: "간이스프링클러설비",
        cond: "노유자생활시설 전층 (면적·층수 무관, 2012.2.5 신설)",
        art: eraId === "era3"
          ? `${scheduleRef("era3", "제1호 다목 4)")} / NFTC 103B`
          : `${scheduleRef(eraId, "제1호 다목")} / NFSC 103B`,
        std: stdCode("103B", eraId),
        warn: `단독주택·공동주택에 설치되는 노유자생활시설은 제외 (2013.2.10 개정 단서 — ${scheduleRef(eraId === "era3" ? "era3" : "era2", "제1호 다목 단서")}). 스프링클러(600㎡↑)와 동시 적용 가능.`
      });
  }

  // [노유자이용시설] 간이SPK — 300㎡↑600㎡ 미만 (2008.8.16 신설)
  if (type === "senior_user") {
    if (gte(ds, "EASY_SENIOR_USER") && area >= 300 && area < 600)
      push({
        cat: "소화설비", name: "간이스프링클러설비",
        cond: `노유자이용시설 바닥면적 300㎡ 이상 600㎡ 미만 (2008.8.16 기준, 입력: ${area.toLocaleString()}㎡)`,
        art: `${scheduleRef(eraId, "제1호 다목")} / ${stdCode("103B", eraId)}`,
        std: stdCode("103B", eraId),
        warn: "이천 냉동창고 화재(2008.1.7) 이후 노유자이용시설 적용 확대."
      });
  }

  // [요양병원] 간이SPK — 600㎡ 미만 (2015.7.1~)
  if (type === "medical" && gte(ds, "HOSP_EASY_SPK") && area < 600)
    push({
      cat: "소화설비", name: "간이스프링클러설비",
      cond: `요양병원 연면적 600㎡ 미만 (2015.7.1 이후, 입력: ${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제1호 다목")} / ${stdCode("103B", eraId)}`,
      std: stdCode("103B", eraId)
    });

  // ── ⑤ 자동화재탐지설비 ───────────────────────────────────
  // 근거: 소방시설법 시행령 별표 4 제2호 가목
  {
    const minArea = {
      apt: 0, villa: 0, geunlin: 600, office: 600, retail: 500,
      warehouse: 2000, education: 400, medical: 600,
      senior_life: 200, senior_user: 400,
      factory: 1000, complex: 600
    };
    const floorReq = { apt: 3, villa: 3 };
    let need = false, cond = "";

    if (floorReq[type] && gf >= floorReq[type])
      { need = true; cond = `공동주택 ${floorReq[type]}층 이상 (입력: ${gf}층)`; }
    else if (minArea[type] > 0 && area >= minArea[type])
      { need = true; cond = `연면적 ${minArea[type].toLocaleString()}㎡ 이상 (입력: ${area.toLocaleString()}㎡)`; }

    // 노유자생활시설 — 전층 강화 기준 (2012.2.5~)
    if (type === "senior_life" && gte(ds, "EASY_SENIOR_LIFE"))
      { need = true; cond = "노유자생활시설 전층 (2012.2.5 신설 — 면적·수용인원 무관)"; }

    // 요양병원 전 구역 강화 (2014.10.8~)
    if (type === "medical" && gte(ds, "HOSP_SPK"))
      { need = true; cond = "요양병원(정신병원 제외) 전 구역 (2014.10.8 이후, NFSC 203 기준)"; }

    if (need)
      push({
        cat: "경보설비", name: "자동화재탐지설비",
        cond,
        art: eraId === "era0"
          ? "소방기술기준에관한규칙 제11조"
          : `${scheduleRef(eraId, "제2호 가목")} / ${stdCode("203", eraId)}`,
        std: stdCode("203", eraId)
      });
  }

  // ── ⑥ 자동화재속보설비 ───────────────────────────────────
  // 근거: 소방시설법 시행령 별표 4 제2호 나목
  {
    let need = false, cond = "";

    // 노유자생활시설 전층 (2012.2.5~)
    if (type === "senior_life" && gte(ds, "EASY_SENIOR_LIFE"))
      { need = true; cond = "노유자생활시설 전층 (2012.2.5 신설)"; }
    // 노유자이용시설 500㎡↑ (2001.5.20~)
    else if (type === "senior_user" && eraId !== "era0" && area >= 500)
      { need = true; cond = `노유자이용시설 연면적 500㎡ 이상인 층 (2001.5.20 이후, 입력: ${area.toLocaleString()}㎡)`; }

    // 요양병원 (2014.7.7~)
    if (type === "medical" && gte(ds, "HOSP_SPK") && area >= 500)
      { need = true; cond = `요양병원 연면적 500㎡ 이상인 층 (2014.7.7 개정, 입력: ${area.toLocaleString()}㎡)`; }

    // 30층↑ 전체
    if (gf >= 30)
      { need = true; cond = `30층 이상 건물 (${gf}층, 2012.2.5 신설)`; }

    if (need)
      push({
        cat: "경보설비", name: "자동화재속보설비",
        cond,
        art: `${scheduleRef(eraId, "제2호 나목")} / ${stdCode("204", eraId)}`,
        std: stdCode("204", eraId)
      });
  }

  // ── ⑦ 비상경보설비 ───────────────────────────────────────
  // 근거: 소방시설법 시행령 별표 4 제2호 다목 (자동화재탐지 미설치 대상)
  const hasATD = reqs.some(r => r.name.includes("자동화재탐지"));
  if (!hasATD && area >= 400)
    push({
      cat: "경보설비", name: "비상경보설비",
      cond: `연면적 400㎡ 이상 (입력: ${area.toLocaleString()}㎡, 자동화재탐지설비 미설치 대상)`,
      art: `${scheduleRef(eraId, "제2호 다목")} / ${stdCode("201", eraId)}`,
      std: stdCode("201", eraId)
    });

  // ── ⑧ 비상방송설비 ───────────────────────────────────────
  // 근거: 소방시설법 시행령 별표 4 제2호 라목
  if (area >= 3500 || gf >= 11)
    push({
      cat: "경보설비", name: "비상방송설비",
      cond: `연면적 3,500㎡ 이상 또는 11층 이상 (입력: ${area.toLocaleString()}㎡, ${gf}층)`,
      art: `${scheduleRef(eraId, "제2호 라목")} / ${stdCode("202", eraId)}`,
      std: stdCode("202", eraId)
    });

  // ── ⑨ 피난기구 ───────────────────────────────────────────
  // 근거: 소방시설법 시행령 별표 4 제3호 가목
  // 노유자생활시설·의료시설은 경사로·미끄럼대 적용 의무 (NFTC 301)
  if (gf >= 2 || area >= 400) {
    const warn_evac = (type === "senior_life" || type === "medical")
      ? "노유자생활시설·의료시설: 경사로·미끄럼대 적용 의무 (NFTC 301 제7조 제2항)"
      : null;
    push({
      cat: "피난구조설비", name: "피난기구 (완강기·구조대·미끄럼대·경사로 등)",
      cond: "피난층·1층·2층·11층 이상 제외한 모든 층 (단, 노유자·의료시설은 4층 이하 전층)",
      art: `${scheduleRef(eraId, "제3호 가목")} / ${stdCode("301", eraId)}`,
      std: stdCode("301", eraId),
      warn: warn_evac
    });
    push({
      cat: "피난구조설비", name: "유도등·유도표지",
      cond: `연면적 400㎡ 이상 또는 2층 이상 (입력: ${area.toLocaleString()}㎡, ${gf}층)`,
      art: `${scheduleRef(eraId, "제3호 다목")} / ${stdCode("303", eraId)}`,
      std: stdCode("303", eraId)
    });
  }

  // ── ⑩ 비상조명등 ─────────────────────────────────────────
  // 근거: 소방시설법 시행령 별표 4 제3호 라목
  if ((gf >= 5 && area >= 3000) || bf >= 1)
    push({
      cat: "피난구조설비", name: "비상조명등",
      cond: `지하층·무창층 포함 5층 이상이고 연면적 3,000㎡ 이상 또는 지하층·무창층 바닥면적 450㎡↑`,
      art: `${scheduleRef(eraId, "제3호 라목")} / ${stdCode("304", eraId)}`,
      std: stdCode("304", eraId)
    });

  // ── ⑪ 연결송수관설비 ─────────────────────────────────────
  // 근거: 소방시설법 시행령 별표 4 제4호 나목
  if (gf >= 7 || (gf >= 5 && area >= 6000))
    push({
      cat: "소화활동설비", name: "연결송수관설비",
      cond: `지상 7층 이상 또는 5층 이상 연면적 6,000㎡ 이상 (${gf}층, ${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제4호 나목")} / ${stdCode("502", eraId)}`,
      std: stdCode("502", eraId)
    });

  // ── ⑫ 제연설비 (특별피난계단 부속실) ────────────────────
  // 근거: 소방시설법 시행령 별표 4 제4호 가목
  if (gf >= 11)
    push({
      cat: "소화활동설비", name: "제연설비 (특별피난계단 부속실·비상용 승강기 승강장)",
      cond: `11층 이상 특별피난계단 설치 대상 건물 (${gf}층) — 각 층 부속실 및 비상용 승강기 승강장`,
      art: `${scheduleRef(eraId, "제4호 가목")} / ${stdCode("501A", eraId)}`,
      std: stdCode("501A", eraId)
    });

  return reqs;
}

// ============================================================
// ★ 소급 적용 경고 — 사용승인 당시 의무 없었으나
//   이후 개정으로 소급 의무가 발생한 항목
// ============================================================
export function getRetroactiveWarnings(type, area, gf, eraId, dateStr) {
  const warns = [];
  if (!dateStr || !eraId) return warns;

  // ① 아파트 6층↑ 소급 (2017.1.26 이전 준공, 6~10층)
  if (type === "apt" && lt(dateStr, "APT_SPK_6F") && gf >= 6 && gf < 11) {
    warns.push({
      level: "warning",
      title: "아파트 스프링클러 6층↑ 소급 여부 확인 필요",
      content: `이 건물(사용승인 ${dateStr}, ${gf}층)은 당시 기준(11층↑)으로 스프링클러 설치 의무가 없었습니다. 2017.1.26 시행령 개정(화재예방소방시설법 시행령 별표 5 제1호 나목 개정)으로 아파트 6층↑ 의무화. 기존 건물 소급 적용 여부 및 이행 기한을 관할 소방서에서 확인하십시오.`,
      accident: "제천 스포츠센터 화재(2017.12.21, 29명 사망) 전 단계적 법령 강화",
      amendment: "2017.1.26 시행령 개정 (화재예방소방시설법 시행령 별표 5 제1호 나목)"
    });
  }

  // ② 아파트 전층 소급 (2024.7.17 이전, 6층↑)
  if (type === "apt" && lt(dateStr, "APT_SPK_ALL") && gf >= 6) {
    warns.push({
      level: "info",
      title: "아파트 스프링클러 전층 의무화 확인 (2024.7.17 NFTC 103 개정)",
      content: "2024.7.17 NFTC 103 개정으로 아파트 스프링클러가 전층 의무화되었습니다. 이 건물의 사용승인 당시에는 해당 기준이 없었으므로 소급 적용 여부를 확인하십시오.",
      amendment: "2024.7.17 NFTC 103 개정"
    });
  }

  // ③ 요양병원 스프링클러 소급 (2014.10.8 이전)
  if (type === "medical" && lt(dateStr, "HOSP_SPK")) {
    warns.push({
      level: "danger",
      title: "요양병원 스프링클러 전층 소급 적용 (2014.10.8 시행 — 경과규정 없음)",
      content: `이 건물(사용승인 ${dateStr})은 당시 기준으로 요양병원 전층 스프링클러 의무가 없었습니다. 2014.7.7 개정(2014.10.8 시행, 화재예방소방시설법 시행령 별표 5 제1호 나목 개정)에서 요양병원 전층 스프링클러 의무화. 경과 조항이 없어 기존 건물에도 즉시 소급 적용됩니다. 현재 전층 스프링클러 설치 여부를 반드시 확인하십시오.`,
      accident: "장성 효사랑 요양병원 화재(2014.5.28, 21명 사망) 직후 즉각 법령 강화",
      amendment: "2014.7.7 개정 / 2014.10.8 시행 (화재예방소방시설법 시행령 별표 5)"
    });
  }

  // ④ 물류창고 스프링클러 소급 (2021.8.1 이전, 5,000㎡↑)
  if (type === "warehouse" && lt(dateStr, "RETRO_WAREHOUSE") && area >= 5000) {
    warns.push({
      level: "danger",
      title: "물류창고 스프링클러 소급 의무화 (2021.8.1 시행 — 이행기한 2024.7.31)",
      content: `이 창고시설(사용승인 ${dateStr}, ${area.toLocaleString()}㎡)은 이천 물류창고 화재(2020.4.29, 38명 사망) 이후 2021.3.30 개정(2021.8.1 시행)으로 기존 물류창고(5,000㎡↑)에 스프링클러 소급 설치 의무가 부과되었습니다. 이행 기한: 2021.8.1~2024.7.31(3년). 이행 여부 및 부칙 제○조 세부 조건을 반드시 확인하십시오.`,
      accident: "이천 물류창고(한익스프레스) 화재(2020.4.29, 38명 사망) — 2008년 이천 냉동창고와 동일 지역 반복 사고",
      amendment: "2021.3.30 개정 / 2021.8.1 시행 (화재예방소방시설법 시행령 별표 5 부칙 소급조항)"
    });
  }

  // ⑤ 필로티 주차 소급 (2018.6.28 이전, 해당 용도)
  if (["geunlin", "complex", "office"].includes(type) && lt(dateStr, "RETRO_PILOTI")) {
    warns.push({
      level: "warning",
      title: "필로티 구조 주차 공간 스프링클러 소급 여부 확인",
      content: "제천 스포츠센터 화재(2017.12.21) 이후 2018.3.27 개정(2018.6.28 시행, 화재예방소방시설법 시행령 별표 5)으로 필로티 구조 주차 공간 스프링클러 의무가 강화되었습니다. 필로티 주차장이 있는 경우 소급 적용 여부와 이행 기한을 확인하십시오.",
      accident: "제천 스포츠센터 화재(2017.12.21, 29명 사망)",
      amendment: "2018.3.27 개정 / 2018.6.28 시행 (화재예방소방시설법 시행령 별표 5)"
    });
  }

  // ⑥ 노유자생활시설 간이스프링클러 소급 (2012.2.5 이전 준공)
  if (type === "senior_life" && lt(dateStr, "EASY_SENIOR_LIFE")) {
    warns.push({
      level: "warning",
      title: "노유자생활시설 간이스프링클러 소급 여부 확인 (2012.2.5 신설)",
      content: `이 건물(사용승인 ${dateStr})은 화재예방소방시설법 시행(2012.2.5) 이전 준공으로, 당시 노유자생활시설 전층 간이스프링클러 의무(화재예방소방시설법 시행령 별표 5 제1호 다목)가 없었습니다. 현재 노유자생활시설로 사용 중이라면 소급 적용 여부를 반드시 확인하십시오. ※ 단독주택·공동주택 내 설치 시설은 제외(2013.2.10 개정 단서).`,
      amendment: "2011.8.4 제정 / 2012.2.5 시행 (화재예방소방시설법 시행령 별표 5 제1호 다목)"
    });
  }

  return warns;
}

// ── 현행(era3) 기준 비교용 ────────────────────────────────────
export function getCurrentRequirements(type, area, gf, bf, occ) {
  return getRequirements(type, area, gf, bf, occ, "era3", "2025-01-01");
}

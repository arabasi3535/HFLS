// ============================================================
// src/data.js  —  HFLS 법령 데이터 및 판별 로직 v4.0
//
// 기준 법령:
//   ① 소방시설 설치 및 관리에 관한 법률 시행령 [별표 2] <개정 2025.11.25>
//      특정소방대상물 분류 (제5조 관련) — 전 30개 호 반영
//   ② 소방시설 설치 및 관리에 관한 법률 시행령 [별표 4]
//      특정소방대상물에 설치하는 소방시설 (제11조 관련)
//
// ★ v4.0 주요 변경:
//   - 별표 2 전체 30개 호 기준으로 건물용도 완전 재편
//   - 노유자 시설: 별표 2 제9호 가~바목 (소방시설 기준상 생활/이용 구분 유지)
//   - 신규: 문화집회·종교·운수·수련·운동·숙박·위락·지하상가 등
//   - 다중이용업소: 다중이용업소 안전관리에 관한 특별법 별도 → 제외
// ============================================================

const D = {
  APT_SPK_16F:       "1990-06-29",
  APT_SPK_11F:       "2005-01-01",
  APT_SPK_6F:        "2017-01-26",
  APT_SPK_ALL:       "2024-07-17",
  SENIOR_SPK:        "2001-05-20",
  HOSP_SPK:          "2014-10-08",
  HOSP_EASY_SPK:     "2015-07-01",
  EASY_GEUNLIN:      "2004-05-30",
  EASY_SENIOR_USER:  "2008-08-16",
  EASY_SENIOR_LIFE:  "2012-02-05",
  RETRO_PILOTI:      "2018-06-28",
  RETRO_WAREHOUSE:   "2021-08-01",
};

const gte = (dateStr, key) => new Date(dateStr) >= new Date(D[key]);
const lt  = (dateStr, key) => new Date(dateStr) <  new Date(D[key]);

export const LAW_ERAS = [
  {
    id: "era0", label: "소방법 시대",
    start: "1958-03-11", end: "2004-05-29",
    lawName: "소방법", lawShort: "소방법",
    lawCode: "법률 제485호 (1958.3.11 제정)",
    decree: "소방법 시행령 / 소방법 시행규칙",
    standard: "소방기술기준에관한규칙",
    standardAuth: "내무부령 → 행정자치부령",
    mainArticle: "소방법 제8조, 시행령 별표 1·2",
    selfCheck: "소방법 제8조의2",
    safetyInspection: "소방특별조사 (소방서장)",
    color: "#6b7280",
    note: "단일법 체계. 소방조직·화재예방·소방시설·위험물 통합 규율. 2004.5.29 폐지."
  },
  {
    id: "era1", label: "소방시설설치유지법 시대",
    start: "2004-05-30", end: "2012-02-04",
    lawName: "소방시설설치유지및안전관리에관한법률", lawShort: "소방시설설치유지법",
    lawCode: "법률 제6893호 (2003.5.29 제정, 2004.5.30 시행)",
    decree: "소방시설설치유지법 시행령",
    standard: "화재안전기준 (NFSC)",
    standardAuth: "소방방재청 고시",
    mainArticle: "제9조, 시행령 별표 2·4",
    selfCheck: "제25조",
    safetyInspection: "소방특별조사 (소방본부장·소방서장)",
    color: "#2563eb",
    note: "소방 4분법 시행(2004.5.30). NFSC 고시체계 도입. 대구지하철 화재(2003) 후 제정."
  },
  {
    id: "era2", label: "화재예방소방시설법 시대",
    start: "2012-02-05", end: "2022-11-30",
    lawName: "화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률", lawShort: "화재예방소방시설법",
    lawCode: "법률 제11037호 (2011.8.4 제정, 2012.2.5 시행)",
    decree: "화재예방소방시설법 시행령",
    standard: "화재안전기준 (NFSC)",
    standardAuth: "국민안전처 → 소방청 고시",
    mainArticle: "제9조, 시행령 별표 2·5",
    selfCheck: "제25조",
    safetyInspection: "화재안전조사 (소방관서장)",
    color: "#d97706",
    note: "노유자생활시설 기준 신설(2012.2.5). 장성(2014)·제천(2017)·밀양(2018) 화재 후 연속 법령 강화."
  },
  {
    id: "era3", label: "현행 소방시설법 시대",
    start: "2022-12-01", end: "2099-12-31",
    lawName: "소방시설 설치 및 관리에 관한 법률", lawShort: "소방시설법(현행)",
    lawCode: "법률 제18522호 (2021.11.30 제정, 2022.12.1 시행)",
    decree: "소방시설법 시행령",
    standard: "NFTC(화재안전기술기준) / NFPC(화재안전성능기준)",
    standardAuth: "소방청 고시 (이원화)",
    mainArticle: "제12조, 시행령 별표 2·4 <개정 2025.11.25>",
    selfCheck: "제22조",
    safetyInspection: "화재안전조사 (화재예방법 제7조)",
    color: "#16a34a",
    note: "2분법(소방시설법+화재예방법). NFTC/NFPC 이원화. 창고 NFTC 103A 신설. 2024.7.17 아파트 전층 SPK."
  }
];

// ============================================================
// 건물 용도 — 소방시설법 시행령 [별표 2] <개정 2025.11.25> 전체 반영
// ★ 다중이용업소: 「다중이용업소의 안전관리에 관한 특별법」 별도 적용 → 제외
// ============================================================
export const BUILDING_TYPES = [
  // 제1호: 공동주택
  { id: "apt",        name: "공동주택 — 아파트등",   lawRef: "별표 2 제1호 가목", desc: "주택으로 쓰는 층수 5층 이상인 주택" },
  { id: "villa",      name: "공동주택 — 연립주택",   lawRef: "별표 2 제1호 나목", desc: "1개 동 바닥면적 합계 660㎡ 초과, 4층 이하" },
  { id: "multiplex",  name: "공동주택 — 다세대주택", lawRef: "별표 2 제1호 다목", desc: "1개 동 바닥면적 합계 660㎡ 이하, 4층 이하" },
  { id: "dormitory",  name: "공동주택 — 기숙사",     lawRef: "별표 2 제1호 라목", desc: "학교·공장 등 학생·종업원 공동취사 50% 이상" },
  // 제2호: 근린생활시설
  { id: "geunlin",    name: "근린생활시설 (1종·2종)", lawRef: "별표 2 제2호 가목~카목", desc: "슈퍼마켓·음식점·의원·학원·독서실·고시원 등 용도별 면적기준 이내" },
  // 제3호: 문화 및 집회시설
  { id: "culture",    name: "문화 및 집회시설",       lawRef: "별표 2 제3호 가목~마목", desc: "공연장(근린 외)·집회장(예식장·회의장)·관람장(경마장·체육관 관람석 1,000㎡↑)·전시장(박물관·미술관)·동식물원" },
  // 제4호: 종교시설
  { id: "religion",   name: "종교시설",               lawRef: "별표 2 제4호 가목~나목", desc: "종교집회장(근린 외), 봉안당" },
  // 제5호: 판매시설
  { id: "retail",     name: "판매시설",               lawRef: "별표 2 제5호 가목~라목", desc: "도매시장·소매시장·전통시장·상점(소매점 1,000㎡↑, 게임시설 500㎡↑ 등)" },
  // 제6호: 운수시설
  { id: "transport",  name: "운수시설",               lawRef: "별표 2 제6호 가목~라목", desc: "여객자동차터미널, 철도·도시철도 시설, 공항시설(항공관제탑 포함), 항만시설·종합여객시설" },
  // 제7호: 의료시설
  { id: "medical",    name: "의료시설 (요양병원 포함)", lawRef: "별표 2 제7호 가목~라목", desc: "병원(종합·요양·치과·한방병원), 격리병원, 정신의료기관, 장애인 의료재활시설. ★요양병원 2014.10.8 소급기준 있음" },
  // 제8호: 교육연구시설
  { id: "education",  name: "교육연구시설",           lawRef: "별표 2 제8호 가목~바목", desc: "학교(초·중·고·대학), 교육원·연수원, 직업훈련소, 학원(근린 외), 연구소, 도서관" },
  // 제9호: 노유자 시설 — 소방시설 기준(별표 4)상 생활/이용 구분 유지
  { id: "senior_life", name: "노유자시설 — 생활시설 (24시간 거주)", lawRef: "별표 2 제9호 (거주형 시설)", desc: "노인요양시설·공동생활가정, 아동양육·일시보호·보호치료시설, 장애인 거주시설, 정신요양·정신재활(공동생활), 노숙인 자활·재활·요양시설 → 간이SPK 전층(2012.2.5~)" },
  { id: "senior_user", name: "노유자시설 — 이용시설 (낮 이용)",    lawRef: "별표 2 제9호 (이용형 시설)", desc: "노인여가복지시설(경로당·노인복지관·노인교실), 재가노인복지시설, 어린이집, 유치원, 장애인 지역사회재활·직업재활, 정신재활시설(공동생활 외), 노숙인 일시보호" },
  // 제10호: 수련시설
  { id: "training",   name: "수련시설",               lawRef: "별표 2 제10호 가목~다목", desc: "생활권(청소년수련관·문화의집·특화시설), 자연권(청소년수련원·야영장), 유스호스텔" },
  // 제11호: 운동시설
  { id: "sports",     name: "운동시설",               lawRef: "별표 2 제11호 가목~다목", desc: "체력단련장·볼링장·당구장 등(근린 외), 체육관(관람석 없거나 1,000㎡ 미만), 운동장(수영·스케이트 등 관람석 1,000㎡ 미만)" },
  // 제12호: 업무시설
  { id: "office",     name: "업무시설",               lawRef: "별표 2 제12호 가목~마목", desc: "공공업무시설(국가·지방자치단체 청사), 일반업무시설(금융업소·사무소·오피스텔), 주민자치센터·경찰서·소방서, 마을회관, 변전소·정수장 등" },
  // 제13호: 숙박시설
  { id: "lodging",    name: "숙박시설",               lawRef: "별표 2 제13호 가목~라목", desc: "일반형 숙박시설(호텔·여관), 생활형 숙박시설(레지던스), 고시원(근린 외)" },
  // 제14호: 위락시설
  { id: "entertainment", name: "위락시설",            lawRef: "별표 2 제14호 가목~마목", desc: "단란주점(근린 외), 유흥주점, 테마파크, 무도장·무도학원, 카지노영업소" },
  // 제15호: 공장
  { id: "factory",    name: "공장",                   lawRef: "별표 2 제15호", desc: "물품의 제조·가공(세탁·염색·도장·인쇄 등) 또는 수리에 계속적으로 이용되는 건축물" },
  // 제16호: 창고시설
  { id: "warehouse",  name: "창고시설·물류창고",       lawRef: "별표 2 제16호 가목~라목", desc: "창고(냉장·냉동 포함), 하역장, 물류터미널, 집배송시설 (위험물 저장·처리 부속 제외)" },
  // 제18호: 항공기·자동차 관련 시설
  { id: "parking",    name: "항공기 및 자동차 관련 시설", lawRef: "별표 2 제18호 가목~차목", desc: "항공기 격납고, 차고·주차용 건축물·기계식 주차시설, 자동차 정비공장, 건축물 내부 주차장(필로티·지하 포함, 단독·50세대 미만 제외)" },
  // 제22호: 방송통신시설
  { id: "broadcast",  name: "방송통신시설",           lawRef: "별표 2 제22호 가목~바목", desc: "방송국(제작·송신·중계), 전신전화국, 촬영소, 통신용 시설, 데이터센터" },
  // 제23호: 발전시설
  { id: "power",      name: "발전시설",               lawRef: "별표 2 제23호 가목~바목", desc: "원자력·화력·수력·풍력 발전소, 전기저장시설(20kWh 초과 리튬·나트륨·레독스플로우 2차 전지), 집단에너지 공급시설" },
  // 제27호: 지하상가
  { id: "underground", name: "지하상가",              lawRef: "별표 2 제27호", desc: "지하 인공구조물 내 연속하여 지하도에 면하여 설치된 상점·사무실 등과 그 지하도를 합한 것" },
  // 제30호: 복합건축물
  { id: "complex",    name: "복합건축물",             lawRef: "별표 2 제30호 가목~나목", desc: "하나의 건축물이 제1~27호 중 둘 이상 용도 / 근린·판매·업무·숙박·위락 + 주택 복합 (부수·부대·복리시설 등 예외 있음)" },
];

// ── 주요 화재사고 & 법령 강화 ──────────────────────────────
export const FIRE_ACCIDENTS = [
  {
    year: 1971, name: "서울 대연각호텔 화재",
    location: "서울 중구 충무로", deaths: 163,
    types: ["office", "complex", "lodging"],
    amendment: "1972년 소방법 전면 개정",
    summary: "국내 최대 화재참사. 고층건축물 피난기준 전무. 특수건물 소방시설·피난계단·배연설비 기준 신설 계기.",
    retroactive: false,
    lawDetail: "소방법 시행령 개정 — 특수건물 스프링클러·연결송수관 기준 신설"
  },
  {
    year: 1974, name: "서울 대왕코너 화재",
    location: "서울 중구", deaths: 88,
    types: ["retail", "complex", "entertainment"],
    amendment: "1975년 소방법 시행령 개정",
    summary: "지하 판매·위락시설 화재. 피난구·유도등 기준 강화. 판매·위락시설 소방시설 의무 최초 설정.",
    retroactive: false,
    lawDetail: "소방법 시행령 — 판매·위락시설 피난구조설비 기준 신설"
  },
  {
    year: 1999, name: "씨랜드 청소년수련원 화재",
    location: "경기 화성", deaths: 23,
    types: ["senior_life", "senior_user", "education", "training"],
    amendment: "2001.3.20 개정 (2001.5.20 시행)",
    summary: "유아 19명 포함 23명 사망. 노유자시설·수련시설 스프링클러 600㎡↑ 최초 신설. 자동화재속보설비 500㎡↑ 신설.",
    retroactive: false,
    lawDetail: "소방법 시행령 별표 개정 — 노유자·수련시설 SPK(600㎡↑) 및 자동화재속보설비(500㎡↑) 신설"
  },
  {
    year: 2003, name: "대구지하철 1호선 방화 화재",
    location: "대구 중구 중앙로역", deaths: 192,
    types: ["geunlin", "retail", "underground", "transport"],
    amendment: "2004.5.30 소방 4분법 시행",
    summary: "192명 사망. 단일 소방법 한계 노출. 소방시설설치유지법 등 4분법 시행 직접 계기. 지하층 소방시설 전면 강화.",
    retroactive: false,
    lawDetail: "소방시설설치유지법 등 4법 제정 — NFSC 체계 전환, 지하상가·지하층 소방시설 전면 강화"
  },
  {
    year: 2008, name: "이천 냉동창고(코리아2000) 화재",
    location: "경기 이천 호법면", deaths: 40,
    types: ["warehouse", "factory"],
    amendment: "2008.2.15 개정 (2008.8.16 시행)",
    summary: "우레탄폼 단열재 화재. 냉동창고 건식·준비작동식 SPK 특례 신설. 노유자이용시설 간이SPK 300~600㎡ 추가.",
    retroactive: false,
    lawDetail: "소방시설설치유지법 시행령 별표 4 개정 — 냉동창고 SPK 특례, 간이SPK 확대"
  },
  {
    year: 2014, name: "장성 효사랑 요양병원 화재",
    location: "전남 장성군", deaths: 21,
    types: ["medical", "senior_life"],
    amendment: "2014.7.7 개정 (2014.10.8 시행)",
    summary: "21명 사망. 요양병원 전층 SPK 의무화. ★경과규정 없음 → 기존 건물 즉시 소급. 자체점검 실무 핵심 쟁점.",
    retroactive: true,
    lawDetail: "화재예방소방시설법 시행령 별표 5 제1호 나목 개정 — 요양병원 전층 SPK (경과조항 없음)"
  },
  {
    year: 2017, name: "제천 스포츠센터 화재",
    location: "충북 제천시", deaths: 29,
    types: ["complex", "geunlin", "office", "sports"],
    amendment: "2018.3.27 개정 (2018.6.28 시행)",
    summary: "필로티 주차장 연소 확대 29명 사망. 필로티 SPK 강화. 기존 건물 이행기한 2년.",
    retroactive: true,
    lawDetail: "화재예방소방시설법 시행령 별표 5 개정 — 필로티 주차공간 SPK, 기존건물 이행기한 2년"
  },
  {
    year: 2018, name: "밀양 세종병원 화재",
    location: "경남 밀양시", deaths: 47,
    types: ["medical"],
    amendment: "2018.6.~9. 추가 개정",
    summary: "47명 사망. 요양병원 자동화재탐지 전 구역 강화. SPK 소급 범위 추가 확대.",
    retroactive: true,
    lawDetail: "화재예방소방시설법 시행령 별표 5 개정 — 의료시설 자동화재탐지설비 강화"
  },
  {
    year: 2020, name: "이천 물류창고(한익스프레스) 화재",
    location: "경기 이천시 마장면", deaths: 38,
    types: ["warehouse"],
    amendment: "2021.3.30 개정 (2021.8.1 시행)",
    summary: "38명 사망. 2008년 동일 지역 반복. 기존 물류창고(5,000㎡↑) SPK 소급 이행기한 3년(~2024.7.31).",
    retroactive: true,
    lawDetail: "화재예방소방시설법 시행령 별표 5 개정 — 물류창고 SPK 소급(5,000㎡↑), 이행기한 3년"
  },
];

export function getEraByDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return LAW_ERAS.find(e => d >= new Date(e.start) && d <= new Date(e.end)) || null;
}

function stdCode(n, eraId) {
  if (eraId === "era0") return "소방기술기준에관한규칙";
  if (eraId === "era3") return `NFTC ${n}`;
  return `NFSC ${n}`;
}
function scheduleRef(era, detail) {
  const base = {
    era0: "소방법 시행령 별표",
    era1: "소방시설설치유지법 시행령 별표 4",
    era2: "화재예방소방시설법 시행령 별표 5",
    era3: "소방시설법 시행령 별표 4"
  };
  return `${base[era] || base.era3}${detail ? " " + detail : ""}`;
}

export function getRequirements(type, area, gf, bf, occ, eraId, dateStr) {
  const reqs = [];
  const ds = dateStr || (eraId === "era0" ? "1980-01-01"
    : eraId === "era1" ? "2008-01-01"
    : eraId === "era2" ? "2015-01-01" : "2023-01-01");
  const push = (obj) => reqs.push({ ...obj, std: obj.std || stdCode("101", eraId) });

  // ① 소화기구 (별표 4 제1호 가목)
  if (area >= 33)
    push({ cat: "소화설비", name: "소화기구 (소화기·간이소화용구·자동소화장치)",
      cond: `연면적 33㎡↑ (${area.toLocaleString()}㎡)`,
      art: eraId === "era0" ? "소방기술기준에관한규칙 제4조"
        : `${scheduleRef(eraId, "제1호 가목")} / ${stdCode("101", eraId)}`,
      std: stdCode("101", eraId),
      warn: ["senior_life","senior_user","medical"].includes(type)
        ? "노유자·의료시설: 투척용소화용구 1/2 이상 가능 (NFTC 101 제4조)" : null });

  // ② 옥내소화전 (별표 4 제1호 라목)
  {
    const minA = eraId === "era0" ? 2100
      : ["retail","medical","entertainment","lodging"].includes(type) ? 1500 : 3000;
    if (area >= minA)
      push({ cat: "소화설비", name: "옥내소화전설비",
        cond: `연면적 ${minA.toLocaleString()}㎡↑ (${area.toLocaleString()}㎡)`,
        art: `${scheduleRef(eraId, "제1호 라목")} / ${stdCode("102", eraId)}`,
        std: stdCode("102", eraId) });
  }

  // ③ 스프링클러 (별표 4 제1호 나목)

  // [아파트] 4단계
  if (type === "apt") {
    let need = false, cond = "", note = null;
    if (eraId === "era0") {
      if (gte(ds, "APT_SPK_16F") && gf >= 16) { need = true; cond = `16층↑ (1990.6.29 신설, ${gf}층)`; }
    } else if (eraId === "era1") {
      if (lt(ds, "APT_SPK_11F") && gf >= 16) { need = true; cond = `16층↑ (2005.1.1 이전 구기준)`; }
      else if (gte(ds, "APT_SPK_11F") && gf >= 11) { need = true; cond = `11층↑ (2005.1.1 시행, ${gf}층)`; }
    } else if (eraId === "era2") {
      if (lt(ds, "APT_SPK_6F") && gf >= 11) {
        need = true; cond = `11층↑ (2017.1.26 개정 전, ${gf}층)`;
        note = "2017.1.26 개정으로 6층↑ 강화. 소급 여부 확인 필요.";
      } else if (gte(ds, "APT_SPK_6F") && gf >= 6) {
        need = true; cond = `6층↑ (2017.1.26 개정 적용, ${gf}층)`;
      }
    } else {
      if (lt(ds, "APT_SPK_ALL") && gf >= 6) {
        need = true; cond = `6층↑ (2022.12.1 기준, ${gf}층)`;
        note = "2024.7.17 NFTC 103 개정으로 전층 의무화.";
      } else if (gte(ds, "APT_SPK_ALL")) {
        need = true; cond = `전층 (2024.7.17 NFTC 103 개정, ${gf}층)`;
      }
    }
    if (need) push({ cat: "소화설비", name: "스프링클러설비", cond, warn: note,
      art: `${scheduleRef(eraId, "제1호 나목 7)")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId) });
  }

  // [기숙사]
  if (type === "dormitory" && gf >= 5)
    push({ cat: "소화설비", name: "스프링클러설비",
      cond: `기숙사 5층↑ (${gf}층)`,
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId) });

  // [의료시설]
  if (type === "medical") {
    if (gte(ds, "HOSP_SPK"))
      push({ cat: "소화설비", name: "스프링클러설비",
        cond: "요양병원(정신병원·의료재활 제외) 전층 (2014.10.8~)",
        art: `${scheduleRef(eraId, "제1호 나목 6)")} / ${stdCode("103", eraId)}`,
        std: stdCode("103", eraId),
        warn: "★ 소급(경과규정 없음): 장성 요양병원 화재(2014.5.28, 21명 사망) 직후 강화" });
    else if (gte(ds, "SENIOR_SPK") && area >= 600)
      push({ cat: "소화설비", name: "스프링클러설비",
        cond: `의료시설 600㎡↑ (2001.5.20~, ${area.toLocaleString()}㎡)`,
        art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
        std: stdCode("103", eraId) });
  }

  // [노유자 생활시설]
  if (type === "senior_life" && gte(ds, "SENIOR_SPK") && area >= 600)
    push({ cat: "소화설비", name: "스프링클러설비",
      cond: `노유자생활시설 600㎡↑ (2001.5.20~, ${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId), warn: "간이SPK(전층) 동시 적용 가능." });

  // [노유자 이용시설]
  if (type === "senior_user" && gte(ds, "SENIOR_SPK") && area >= 600)
    push({ cat: "소화설비", name: "스프링클러설비",
      cond: `노유자이용시설 600㎡↑ (2001.5.20~, ${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId) });

  // [수련시설]
  if (type === "training" && gte(ds, "SENIOR_SPK") && area >= 600)
    push({ cat: "소화설비", name: "스프링클러설비",
      cond: `수련시설 600㎡↑ (2001.5.20~, ${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId), warn: "씨랜드 청소년수련원 화재(1999) 이후 노유자·수련시설 동시 강화." });

  // [판매시설]
  if (type === "retail") {
    const thr = eraId === "era0" ? 9000 : eraId === "era1" ? 6000 : 5000;
    if (area >= thr || occ >= 500)
      push({ cat: "소화설비", name: "스프링클러설비",
        cond: `판매시설 ${thr.toLocaleString()}㎡↑ 또는 수용인원 500명↑ (${area.toLocaleString()}㎡, ${occ}명)`,
        art: `${scheduleRef(eraId, "제1호 나목 8)")} / ${stdCode("103", eraId)}`,
        std: stdCode("103", eraId) });
  }

  // [문화집회]
  if (type === "culture" && (area >= 1000 || occ >= 500))
    push({ cat: "소화설비", name: "스프링클러설비",
      cond: `문화집회시설 1,000㎡↑ 또는 500명↑ (${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId),
      warn: "무대부 200㎡↑: 드렌처 또는 개방형 SPK 별도 검토 필요" });

  // [종교시설]
  if (type === "religion" && area >= 1000)
    push({ cat: "소화설비", name: "스프링클러설비",
      cond: `종교시설 1,000㎡↑ (${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId) });

  // [숙박시설]
  if (type === "lodging" && (area >= 600 || gf >= 6))
    push({ cat: "소화설비", name: "스프링클러설비",
      cond: `숙박시설 600㎡↑ 또는 6층↑ (${area.toLocaleString()}㎡, ${gf}층)`,
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId) });

  // [위락시설]
  if (type === "entertainment")
    push({ cat: "소화설비", name: "스프링클러설비",
      cond: "위락시설 전층 (면적 무관)",
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId), warn: "대왕코너 화재(1974) 이후 위락시설 전층 의무." });

  // [지하상가]
  if (type === "underground")
    push({ cat: "소화설비", name: "스프링클러설비",
      cond: "지하상가 전층 (면적 무관)",
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId), warn: "대구지하철 화재(2003) 이후 지하상가 SPK 전면 강화." });

  // [창고시설]
  if (type === "warehouse") {
    if (eraId === "era3" && area >= 1500)
      push({ cat: "소화설비", name: "스프링클러설비 (NFTC 103A — 창고 전용)",
        cond: `창고 1,500㎡↑ (NFTC 103A, 2022.12.1~, ${area.toLocaleString()}㎡)`,
        art: `${scheduleRef("era3", "제1호 나목")} / NFTC 103A`, std: "NFTC 103A",
        warn: "이천 물류창고 화재(2020) 후 강화. 기존 창고(5,000㎡↑) 소급 이행기한(~2024.7.31) 확인." });
    else if (area >= 5000)
      push({ cat: "소화설비", name: "스프링클러설비",
        cond: `창고 5,000㎡↑ (${area.toLocaleString()}㎡)`,
        art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
        std: stdCode("103", eraId) });
  }

  // [11층↑ 전층] — 아파트·기숙사 제외
  if (!["apt","dormitory"].includes(type) && gf >= 11)
    push({ cat: "소화설비", name: "스프링클러설비",
      cond: `11층↑ 전층 (${gf}층)`,
      art: `${scheduleRef(eraId, "제1호 나목 7)")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId) });

  // [복합건축물]
  if (type === "complex" && area >= 5000)
    push({ cat: "소화설비", name: "스프링클러설비",
      cond: `복합건축물 5,000㎡↑ (${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제1호 나목")} / ${stdCode("103", eraId)}`,
      std: stdCode("103", eraId) });

  // ④ 간이스프링클러 (별표 4 제1호 다목)
  if (type === "geunlin" && gte(ds, "EASY_GEUNLIN") && area >= 1000)
    push({ cat: "소화설비", name: "간이스프링클러설비",
      cond: `근린생활시설 1,000㎡↑ (2004.5.30~, ${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제1호 다목")} / ${stdCode("103B", eraId)}`,
      std: stdCode("103B", eraId) });

  if (type === "senior_life" && gte(ds, "EASY_SENIOR_LIFE"))
    push({ cat: "소화설비", name: "간이스프링클러설비",
      cond: "노유자생활시설 전층 (면적 무관, 2012.2.5~)",
      art: eraId === "era3"
        ? `${scheduleRef("era3", "제1호 다목 4)")} / NFTC 103B`
        : `${scheduleRef(eraId, "제1호 다목")} / NFSC 103B`,
      std: stdCode("103B", eraId),
      warn: "단독·공동주택 내 설치 시 제외(2013.2.10 단서). SPK(600㎡↑)와 동시 적용 가능." });

  if (type === "senior_user" && gte(ds, "EASY_SENIOR_USER") && area >= 300 && area < 600)
    push({ cat: "소화설비", name: "간이스프링클러설비",
      cond: `노유자이용시설 300㎡↑~600㎡ 미만 (2008.8.16~, ${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제1호 다목")} / ${stdCode("103B", eraId)}`,
      std: stdCode("103B", eraId) });

  if (type === "medical" && gte(ds, "HOSP_EASY_SPK") && area < 600)
    push({ cat: "소화설비", name: "간이스프링클러설비",
      cond: `요양병원 600㎡ 미만 (2015.7.1~, ${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제1호 다목")} / ${stdCode("103B", eraId)}`,
      std: stdCode("103B", eraId) });

  // ⑤ 자동화재탐지설비 (별표 4 제2호 가목)
  {
    const minArea = {
      apt:0, villa:0, multiplex:0, dormitory:0,
      geunlin:600, office:600, retail:500,
      warehouse:2000, education:400, medical:600,
      senior_life:200, senior_user:400,
      culture:200, religion:200, training:400,
      sports:1000, lodging:300, entertainment:0,
      factory:1000, complex:600, transport:500,
      underground:0, broadcast:500, power:500, parking:500
    };
    const floorReq = { apt:3, villa:3, multiplex:3, dormitory:3 };
    let need = false, cond = "";

    if (["entertainment","underground"].includes(type))
      { need = true; cond = `${type==="underground"?"지하상가":"위락시설"} 전체`; }
    else if (floorReq[type] && gf >= floorReq[type])
      { need = true; cond = `공동주택 ${floorReq[type]}층↑ (${gf}층)`; }
    else if (minArea[type] > 0 && area >= minArea[type])
      { need = true; cond = `연면적 ${minArea[type].toLocaleString()}㎡↑ (${area.toLocaleString()}㎡)`; }

    if (type === "senior_life" && gte(ds, "EASY_SENIOR_LIFE"))
      { need = true; cond = "노유자생활시설 전층 (2012.2.5~)"; }
    if (type === "medical" && gte(ds, "HOSP_SPK"))
      { need = true; cond = "요양병원 전 구역 (2014.10.8~)"; }

    if (need)
      push({ cat: "경보설비", name: "자동화재탐지설비", cond,
        art: eraId === "era0" ? "소방기술기준에관한규칙 제11조"
          : `${scheduleRef(eraId, "제2호 가목")} / ${stdCode("203", eraId)}`,
        std: stdCode("203", eraId) });
  }

  // ⑥ 자동화재속보설비 (별표 4 제2호 나목)
  {
    let need = false, cond = "";
    if (type === "senior_life" && gte(ds, "EASY_SENIOR_LIFE"))
      { need = true; cond = "노유자생활시설 전층 (2012.2.5~)"; }
    else if (type === "senior_user" && eraId !== "era0" && area >= 500)
      { need = true; cond = `노유자이용시설 500㎡↑ (${area.toLocaleString()}㎡)`; }
    if (type === "medical" && gte(ds, "HOSP_SPK") && area >= 500)
      { need = true; cond = `요양병원 500㎡↑ (2014.7.7~, ${area.toLocaleString()}㎡)`; }
    if (gf >= 30)
      { need = true; cond = `30층↑ (${gf}층)`; }
    if (need)
      push({ cat: "경보설비", name: "자동화재속보설비", cond,
        art: `${scheduleRef(eraId, "제2호 나목")} / ${stdCode("204", eraId)}`,
        std: stdCode("204", eraId) });
  }

  // ⑦ 비상경보설비 (별표 4 제2호 다목)
  const hasATD = reqs.some(r => r.name.includes("자동화재탐지"));
  if (!hasATD && area >= 400)
    push({ cat: "경보설비", name: "비상경보설비",
      cond: `연면적 400㎡↑ (자동화재탐지 미설치, ${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제2호 다목")} / ${stdCode("201", eraId)}`,
      std: stdCode("201", eraId) });

  // ⑧ 비상방송설비 (별표 4 제2호 라목)
  if (area >= 3500 || gf >= 11)
    push({ cat: "경보설비", name: "비상방송설비",
      cond: `연면적 3,500㎡↑ 또는 11층↑ (${area.toLocaleString()}㎡, ${gf}층)`,
      art: `${scheduleRef(eraId, "제2호 라목")} / ${stdCode("202", eraId)}`,
      std: stdCode("202", eraId) });

  // ⑨ 피난기구 (별표 4 제3호 가목)
  if (gf >= 2 || area >= 400) {
    push({ cat: "피난구조설비", name: "피난기구 (완강기·구조대·미끄럼대·경사로 등)",
      cond: "피난층·1층·2층·11층↑ 제외 모든 층 (노유자·의료: 4층↓ 전층)",
      art: `${scheduleRef(eraId, "제3호 가목")} / ${stdCode("301", eraId)}`,
      std: stdCode("301", eraId),
      warn: ["senior_life","medical"].includes(type)
        ? "노유자생활시설·의료시설: 경사로·미끄럼대 의무 (NFTC 301 제7조 제2항)" : null });
    push({ cat: "피난구조설비", name: "유도등·유도표지",
      cond: `연면적 400㎡↑ 또는 2층↑ (${area.toLocaleString()}㎡, ${gf}층)`,
      art: `${scheduleRef(eraId, "제3호 다목")} / ${stdCode("303", eraId)}`,
      std: stdCode("303", eraId) });
  }

  // ⑩ 비상조명등 (별표 4 제3호 라목)
  if ((gf >= 5 && area >= 3000) || bf >= 1)
    push({ cat: "피난구조설비", name: "비상조명등",
      cond: "5층↑ 3,000㎡↑ 또는 지하·무창층 450㎡↑",
      art: `${scheduleRef(eraId, "제3호 라목")} / ${stdCode("304", eraId)}`,
      std: stdCode("304", eraId) });

  // ⑪ 연결송수관설비 (별표 4 제4호 나목)
  if (gf >= 7 || (gf >= 5 && area >= 6000))
    push({ cat: "소화활동설비", name: "연결송수관설비",
      cond: `지상 7층↑ 또는 5층↑ 6,000㎡↑ (${gf}층, ${area.toLocaleString()}㎡)`,
      art: `${scheduleRef(eraId, "제4호 나목")} / ${stdCode("502", eraId)}`,
      std: stdCode("502", eraId) });

  // ⑫ 제연설비 (별표 4 제4호 가목)
  if (gf >= 11)
    push({ cat: "소화활동설비", name: "제연설비 (특별피난계단 부속실·비상용 승강기 승강장)",
      cond: `11층↑ 특별피난계단 설치 대상 (${gf}층)`,
      art: `${scheduleRef(eraId, "제4호 가목")} / ${stdCode("501A", eraId)}`,
      std: stdCode("501A", eraId) });

  return reqs;
}

export function getRetroactiveWarnings(type, area, gf, eraId, dateStr) {
  const warns = [];
  if (!dateStr || !eraId) return warns;

  if (type === "apt" && lt(dateStr, "APT_SPK_6F") && gf >= 6 && gf < 11)
    warns.push({ level: "warning",
      title: "아파트 스프링클러 6층↑ 소급 여부 확인",
      content: `이 건물(${dateStr}, ${gf}층)은 당시 11층↑ 기준으로 의무 없었으나 2017.1.26 개정으로 6층↑ 의무화. 소급 여부 확인 요.`,
      accident: "제천 스포츠센터 화재(2017.12.21, 29명 사망)",
      amendment: "2017.1.26 (화재예방소방시설법 시행령 별표 5 제1호 나목)" });

  if (type === "apt" && lt(dateStr, "APT_SPK_ALL") && gf >= 6)
    warns.push({ level: "info",
      title: "아파트 스프링클러 전층 의무화 확인 (2024.7.17 NFTC 103)",
      content: "2024.7.17 NFTC 103 개정으로 전층 의무화. 소급 여부 확인.",
      amendment: "2024.7.17 NFTC 103 개정" });

  if (type === "medical" && lt(dateStr, "HOSP_SPK"))
    warns.push({ level: "danger",
      title: "요양병원 스프링클러 전층 소급 (2014.10.8 — 경과규정 없음)",
      content: `이 건물(${dateStr})은 당시 전층 SPK 의무 없었으나 2014.7.7 개정(2014.10.8 시행)으로 경과규정 없이 즉시 소급. 전층 설치 여부 확인 요.`,
      accident: "장성 효사랑 요양병원 화재(2014.5.28, 21명 사망)",
      amendment: "2014.7.7 개정 / 2014.10.8 시행 (화재예방소방시설법 시행령 별표 5)" });

  if (type === "warehouse" && lt(dateStr, "RETRO_WAREHOUSE") && area >= 5000)
    warns.push({ level: "danger",
      title: "물류창고 스프링클러 소급 의무화 (이행기한 2024.7.31)",
      content: `이 창고(${dateStr}, ${area.toLocaleString()}㎡)는 2021.3.30 개정으로 소급 의무. 이행기한 ~2024.7.31. 이행 여부 확인 요.`,
      accident: "이천 물류창고(한익스프레스) 화재(2020.4.29, 38명 사망)",
      amendment: "2021.3.30 개정 / 2021.8.1 시행 (화재예방소방시설법 시행령 별표 5 부칙)" });

  if (["geunlin","complex","office"].includes(type) && lt(dateStr, "RETRO_PILOTI"))
    warns.push({ level: "warning",
      title: "필로티 주차공간 스프링클러 소급 여부 확인",
      content: "제천 화재(2017) 후 2018.3.27 개정(2018.6.28 시행)으로 필로티 주차공간 SPK 강화. 이행기한 2년. 확인 요.",
      accident: "제천 스포츠센터 화재(2017.12.21, 29명 사망)",
      amendment: "2018.3.27 개정 / 2018.6.28 시행 (화재예방소방시설법 시행령 별표 5)" });

  if (type === "senior_life" && lt(dateStr, "EASY_SENIOR_LIFE"))
    warns.push({ level: "warning",
      title: "노유자생활시설 간이스프링클러 소급 여부 확인 (2012.2.5 신설)",
      content: `이 건물(${dateStr})은 2012.2.5 이전 준공으로 당시 간이SPK 의무 없었음. 현재 해당 용도 사용 시 소급 확인. ※ 단독·공동주택 내 제외(2013.2.10 단서).`,
      amendment: "2011.8.4 제정 / 2012.2.5 시행 (화재예방소방시설법 시행령 별표 5 제1호 다목)" });

  return warns;
}

export function getCurrentRequirements(type, area, gf, bf, occ) {
  return getRequirements(type, area, gf, bf, occ, "era3", "2025-01-01");
}

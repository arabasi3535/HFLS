import { D } from "./sources";

// ============================================================
// 특정소방대상물 용도 분류 (소방시설법 시행령 별표2 기준)
// g: 판정 규칙에서 참조하는 용도 그룹 키
// ※ 별표2 분류는 시기마다 바뀌었음(예: 연립·다세대는 2024.12.1 신청분부터 특정소방대상물).
// ============================================================

export const USE_GROUPS = [
  { no: "-", label: "주택(특정소방대상물 아님)" },
  { no: "1", label: "공동주택" },
  { no: "2", label: "근린생활시설" },
  { no: "3", label: "문화 및 집회시설" },
  { no: "4", label: "종교시설" },
  { no: "5", label: "판매시설" },
  { no: "6", label: "운수시설" },
  { no: "7", label: "의료시설" },
  { no: "8", label: "교육연구시설" },
  { no: "9", label: "노유자 시설" },
  { no: "10", label: "수련시설" },
  { no: "11", label: "운동시설" },
  { no: "12", label: "업무시설" },
  { no: "13", label: "숙박시설" },
  { no: "14", label: "위락시설" },
  { no: "15", label: "공장" },
  { no: "16", label: "창고시설" },
  { no: "17", label: "위험물 저장 및 처리 시설" },
  { no: "18", label: "항공기 및 자동차 관련 시설" },
  { no: "19", label: "동물 및 식물 관련 시설" },
  { no: "20", label: "자원순환 관련 시설" },
  { no: "21", label: "교정 및 군사시설" },
  { no: "22", label: "방송통신시설" },
  { no: "23", label: "발전시설" },
  { no: "24", label: "묘지 관련 시설" },
  { no: "25", label: "관광 휴게시설" },
  { no: "26", label: "장례시설" },
  { no: "27", label: "지하가" },
  { no: "28", label: "지하구" },
  { no: "29", label: "국가유산(문화재)" },
  { no: "30", label: "복합건축물" },
];

export const USES = [
  { id: "house", no: "-", name: "단독주택 (주택용소방시설 대상)", g: ["house"] },

  { id: "apt", no: "1", name: "아파트등 (주택으로 쓰는 층수 5층 이상)", g: ["apt"] },
  { id: "row", no: "1", name: "연립주택", g: ["row"] },
  { id: "multi", no: "1", name: "다세대주택", g: ["multi"] },
  { id: "dorm", no: "1", name: "기숙사", g: ["dorm"] },

  { id: "neigh", no: "2", name: "근린생활시설 (일반: 소매점·휴게음식점·사무소 등)", g: ["neigh"] },
  { id: "bath", no: "2", name: "근린생활시설 — 목욕장", g: ["neigh", "bath"] },
  { id: "clinic", no: "2", name: "근린생활시설 — 의원·치과의원·한의원", g: ["neigh", "clinic"] },
  { id: "midwife", no: "2", name: "근린생활시설 — 조산원·산후조리원", g: ["neigh", "midwife"] },

  { id: "culture", no: "3", name: "문화 및 집회시설 (집회장·관람장·전시장)", g: ["culture"] },
  { id: "perf", no: "3", name: "문화 및 집회시설 — 공연장", g: ["culture", "perf"] },
  { id: "cinema", no: "3", name: "문화 및 집회시설 — 영화상영관", g: ["culture", "cinema"] },
  { id: "zoo", no: "3", name: "문화 및 집회시설 — 동·식물원", g: ["culture", "zoo"] },

  { id: "religion", no: "4", name: "종교시설", g: ["religion"] },

  { id: "retail", no: "5", name: "판매시설 (도매시장·소매시장·상점)", g: ["retail"] },
  { id: "bigstore", no: "5", name: "판매시설 — 대규모점포", g: ["retail", "bigstore"] },
  { id: "market", no: "5", name: "판매시설 — 전통시장", g: ["retail", "market"] },

  { id: "transport", no: "6", name: "운수시설 (일반)", g: ["transport"] },
  { id: "terminal", no: "6", name: "운수시설 — 시외버스정류장·공항·항만 (대합실 포함)", g: ["transport", "terminal"] },
  { id: "station", no: "6", name: "운수시설 — 철도·도시철도 지하역사", g: ["transport", "terminal", "station"] },

  { id: "hosp", no: "7", name: "의료시설 — 종합병원·병원·치과병원·한방병원", g: ["medical", "hosp"] },
  { id: "nursing", no: "7", name: "의료시설 — 요양병원", g: ["medical", "nursing"] },
  { id: "mental", no: "7", name: "의료시설 — 정신의료기관", g: ["medical", "mental"] },
  { id: "rehab", no: "7", name: "의료시설 — 장애인 의료재활시설", g: ["medical", "rehab"] },

  { id: "school", no: "8", name: "교육연구시설 — 학교", g: ["edu", "school"] },
  { id: "edu", no: "8", name: "교육연구시설 — 교육원·직업훈련소·학원·연구소", g: ["edu"] },
  { id: "library", no: "8", name: "교육연구시설 — 도서관", g: ["edu", "library"] },
  { id: "edu_dorm", no: "8", name: "교육연구시설 내 기숙사·합숙소", g: ["edu", "edu_dorm"] },

  // 노유자 생활시설: 2012.2.5. 시행 개정으로 도입된 구분 — 그 전 기준일은 모두 '노유자시설'로 판정
  // 현행 정의: 시행령 제7조제1항제7호 각 목(별표4 제1호마목5)가) — 가목2)·나목~바목 시설 중 단독·공동주택에 설치되는 것 제외
  { id: "noyu_res", no: "9", name: "노유자 생활시설 — 노인주거복지·노인의료복지·재가노인복지시설(주·야간보호·단기보호)", g: ["noyu", "noyu_res", "noyu_elder"] },
  { id: "noyu_res2", no: "9", name: "노유자 생활시설 — 아동복지시설·장애인 거주시설·정신질환자 관련·노숙인 자활/재활/요양·결핵·한센 24시간 생활시설·학대피해노인 전용쉼터", g: ["noyu", "noyu_res"] },
  { id: "noyu", no: "9", name: "노유자 시설 (생활시설 외) — 어린이집·노인여가복지(경로당·노인복지관)·장애인 지역사회재활·직업재활시설·지역아동센터 등", g: ["noyu"] },
  { id: "kinder", no: "9", name: "노유자 시설 — 유치원(병설유치원 포함)", g: ["noyu", "kinder"] },

  { id: "training", no: "10", name: "수련시설 (숙박시설 없음)", g: ["training"] },
  { id: "training_lodge", no: "10", name: "수련시설 — 숙박이 가능한 수련시설(유스호스텔 등)", g: ["training", "training_lodge"] },

  { id: "sports", no: "11", name: "운동시설", g: ["sports"] },

  { id: "office", no: "12", name: "업무시설 (공공업무·일반업무)", g: ["office"] },
  { id: "officetel", no: "12", name: "업무시설 — 오피스텔", g: ["office", "officetel"] },

  { id: "lodging", no: "13", name: "숙박시설 (일반·생활숙박시설·고시원 등)", g: ["lodging"] },
  { id: "hotel", no: "13", name: "숙박시설 — 관광호텔", g: ["lodging", "hotel"] },

  { id: "entertain", no: "14", name: "위락시설", g: ["entertain"] },
  { id: "dance", no: "14", name: "위락시설 — 유흥주점(무대 있는 카바레·나이트클럽 등)", g: ["entertain", "dance"] },

  { id: "factory", no: "15", name: "공장", g: ["factory"] },
  { id: "warehouse", no: "16", name: "창고시설 (창고·하역장·집배송시설)", g: ["warehouse"] },
  { id: "logistics", no: "16", name: "창고시설 — 물류터미널", g: ["warehouse", "logistics"] },

  { id: "hazmat", no: "17", name: "위험물 저장 및 처리 시설 (제조소등)", g: ["hazmat"] },
  { id: "gas", no: "17", name: "위험물 저장 및 처리 시설 — 가스시설", g: ["hazmat", "gas"] },

  { id: "aircar", no: "18", name: "항공기 및 자동차 관련 시설 (정비공장·세차장 등)", g: ["aircar"] },
  { id: "hangar", no: "18", name: "항공기 격납고", g: ["aircar", "hangar"] },
  { id: "parking", no: "18", name: "차고·주차용 건축물·철골 조립식 주차시설", g: ["aircar", "parking"] },

  { id: "animal", no: "19", name: "동물 및 식물 관련 시설", g: ["animal"] },
  { id: "cattle", no: "19", name: "동물 및 식물 관련 시설 — 축사", g: ["animal", "cattle"] },

  { id: "recycle", no: "20", name: "자원순환 관련 시설", g: ["recycle"] },
  { id: "waste", no: "20", name: "자원순환 관련 시설 — 폐기물재활용·처분시설", g: ["recycle", "waste"] },

  { id: "correction", no: "21", name: "교정시설 (교도소·구치소·보호관찰소 등)", g: ["correction"] },
  { id: "military", no: "21", name: "국방·군사시설", g: ["correction", "military"] },

  { id: "broadcast", no: "22", name: "방송통신시설 (일반·데이터센터)", g: ["broadcast"] },
  { id: "bstation", no: "22", name: "방송통신시설 — 방송국", g: ["broadcast", "bstation"] },

  { id: "power", no: "23", name: "발전시설", g: ["power"] },
  { id: "ess", no: "23", name: "발전시설 — 전기저장시설(ESS)", g: ["power", "ess"] },

  { id: "cemetery", no: "24", name: "묘지 관련 시설", g: ["cemetery"] },
  { id: "tourist", no: "25", name: "관광 휴게시설", g: ["tourist"] },
  { id: "funeral", no: "26", name: "장례시설", g: ["funeral"] },

  { id: "ugmall", no: "27", name: "지하가 — 지하상가", g: ["ugmall"] },
  { id: "tunnel", no: "27", name: "지하가 — 터널", g: ["tunnel"] },

  { id: "ugduct", no: "28", name: "지하구 (전력·통신사업용 등)", g: ["ugduct"] },
  { id: "commonduct", no: "28", name: "지하구 — 공동구", g: ["ugduct", "commonduct"] },

  { id: "heritage", no: "29", name: "국가유산 — 보물·국보 지정 목조건축물", g: ["heritage"] },

  { id: "mixed", no: "30", name: "복합건축물 (별표2 제30호가목)", g: ["mixed"] },
  { id: "mixed_res", no: "30", name: "복합건축물 — 근생·판매·업무·숙박·위락 + 주택 겸용(제30호나목)", g: ["mixed", "mixed_res"] },
];

export function getUse(id) {
  return USES.find((u) => u.id === id) || null;
}

/** 용도 그룹 포함 여부 */
export function hasG(use, ...keys) {
  if (!use) return false;
  return keys.some((k) => use.g.includes(k));
}

/**
 * 노유자 생활시설 해당 여부 (기준일 d)
 *  - 2012.2.5. 전: 구분 없음 → 모든 노유자시설은 '노유자시설'(false)
 *  - 2013.2.10.~2015.6.30.: 단독주택·공동주택에 설치되는 노유자 생활시설 제외(운영매뉴얼 — 노인시설 포함 전체)
 *  - 2015.7.1.~: 노인 관련 시설(①)은 제외 대상 아님, ②~⑥(아동·장애인·정신질환자·노숙인·결핵/한센)만 제외(법령집)
 *    2020.9.15.~ 학대피해노인 전용쉼터도 제외 대상 — 본 시스템은 '노유자 생활시설 — 아동복지시설 등' 항목에 포함
 */
export function isNoyuRes(u, f, d) {
  if (!u || !u.g.includes("noyu_res")) return false;
  if (d < D.B12) return false;
  const inHouse = !!(f && f.noyuInHouse);
  if (inHouse && d >= D.B13 && d < D.B15b) return false;
  if (inHouse && d >= D.B15b && !u.g.includes("noyu_elder")) return false;
  return true;
}
/** 노유자시설 중 생활시설 외(면적 기준 적용 대상) */
export function isNoyuGen(u, f, d) {
  return !!u && u.g.includes("noyu") && !isNoyuRes(u, f, d);
}

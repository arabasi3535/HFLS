// ============================================================
// 산정에 쓴 입력값 요약(v2.49.1) — 결과 화면·요약본 인쇄에 「층별 바닥면적·무창층」과 「입력·선택 사항」을 함께 표시
//  라벨은 입력 화면(Wizard.js)의 항목 이름과 같게 둠 — 입력 항목을 새로 만들면 여기에도 추가
// ============================================================

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n.toLocaleString("ko-KR") : String(v);
};

// 숫자 입력 — [라벨, 단위]
const NUMS = {
  tunnelLen: ["터널 길이", "m"],
  stageArea: ["무대부 바닥면적", "㎡"],
  animalOpenArea: ["기둥·지붕만으로 된 개방 부분", "㎡"],
  cinemaArea: ["상영관 바닥면적", "㎡"],
  combustibleTimes: ["특수가연물", "배"],
  rackArea: ["랙식 창고 부분", "㎡"],
  gasTankTon: ["지상 노출 탱크 용량", "톤"],
  households: ["세대수", "세대"],
  lodgingRooms: ["객실 수", "실"],
  beds: ["병상 수", "병상"],
  carStoreArea: ["자동차 상시 보관 장소 바닥면적", "㎡"],
  height: ["건축물 높이", "m"],
  gasTon: ["가연성 가스 저장·취급량", "톤"],
  parkingInside: ["건물 내부 차고·주차장 합계", "㎡"],
  ugParking: ["그중 지하 차고·주차장", "㎡"],
  mechCars: ["기계식 주차", "대"],
  rooftopParking: ["옥상 차고·주차장", "㎡"],
  elecRoom: ["전기실·발전실·변전실·전산실", "㎡"],
};

// 고르는 입력 — [라벨, {값: 표시}]
const PICKS = {
  deptStore: ["백화점 여부", { yes: "백화점", no: "백화점 아님" }],
  aptElevator: ["승강기 설치", { yes: "있음", no: "없음" }],
  aptCentralHeat: ["중앙집중식 난방방식", { yes: "중앙집중식", no: "아님" }],
  eduDormType: ["합숙소·기숙사 구분", { hapsuk: "합숙소", dorm: "기숙사" }],
  clinicType: ["의원 종류", { clinic: "의원", dental: "치과의원", oriental: "한의원" }],
  midwifeType: ["조산원·산후조리원 구분", { midwife: "조산원", postnatal: "산후조리원" }],
  neighFlame: ["방염 대상 근린생활시설", { gym: "체력단련장", perf: "공연장", religion: "종교집회장" }],
  radwaste: ["방사성폐기물 저장시설", { withWater: "소화수 처리설비 있음", noWater: "소화수 처리설비 없음" }],
};

// 체크 항목 — 체크한 것만 표시
const CHECKS = {
  stageUG: "무대부가 지하층·무창층·4층 이상에 있음",
  cinemaUG: "상영관이 지하층·무창층에 있음",
  inpatient: "입원실 있음",
  dialysis: "인공신장실 있음",
  bars: "탈출 방지용 창살 설치",
  noyuInHouse: "단독주택·공동주택 안에 설치된 시설",
  nonFireproof: "지붕 또는 외벽이 불연재료·내화구조 아님",
  workers50: "상시 근로자 50명 이상 옥내 작업장",
  unmannedSub: "무인변전소",
  temple: "사찰·제실·사당",
  woodStructure: "주요구조부가 목조",
  waterPlay: "물놀이형 시설",
  noSeatNonComb: "바닥이 불연재료이고 관람석이 없음",
  immigLeased: "「출입국관리법」 보호시설로 임차건물에 있음",
  ups: "무정전전원공급장치(UPS) 시설",
  aptRemodel: "주택 관련 법령에 따른 리모델링",
  useChangeNoSpk: "스프링클러설비가 없는 기존 건축물의 용도변경",
  nonCombMaterial: "모래·석재 등 불연재료 공장·창고",
  animalNoResid: "사람이 거주하지 않음",
  animalNoWall: "벽이 없음(개방형 축사 등)",
  lithium: "리튬 1차전지 제조 공장",
  gasUse: "가스시설(도시가스·LPG) 사용",
  nationalHousingShelter: "국민주택규모 이하 — 지하층이 대피시설 전용",
  corridorApt: "갓복도형 아파트",
  cooking: "취사 가능(생활숙박시설)",
  unmanned: "야간 무인경비시스템으로 관리",
  bigstoreRestaurant: "입점 일반음식점 있음(후드·덕트 주방)",
  publicOrg: "공공기관",
  fireBrigade: "소방대가 근무하는 공공기관",
  multiUse: "다중이용업소 영업장 있음",
  multiUseHeavy: "다중이용업소 중 종합점검 2,000㎡ 기준 업종",
  waterReelOnly: "물분무등소화설비를 호스릴 방식만 설치",
  outdoorFacility: "건축물 옥내에 있지 않은 시설",
  poolOnly: "수영장",
  studio: "촬영소",
  nonCombustibleStore: "철강 등 불연성 물품 저장·취급 창고",
  cityGas: "도시가스사업 허가 대상 가스 제조시설",
  elevator: "승강기 설치",
  centralHeat: "중앙집중식 난방(지역난방 포함)",
  mmConsent: "입주자등 동의로 의무관리대상 전환",
  laneException: "전용구역 제외(1개 동·편도 2차선 이상 도로에 직접 접함)",
  specialStairs: "특별피난계단·비상용(피난용) 승강기 승강장 있음",
  co2: "이산화탄소소화설비 설치(호스릴 제외)",
  groupCafeteria: "집단급식소 있음",
  lath: "라스(철망) 비내화구조",
  leak100A: "계약전류용량 100A 초과",
  roadDirect: "지하층이 피난층이고 주출입구가 도로에 접함",
  mechOpen: "기계식 주차시설에 지붕 또는 외벽이 없음",
  staffed24: "수신기 설치 장소 24시간 근무자 있음",
};

const filled = (v) => v !== undefined && v !== null && String(v).trim() !== "";

/** 층별 바닥면적·무창층 — [{ name, area, windowless }] (입력한 층이 하나라도 있을 때만) */
export function floorRows(input) {
  const fl = (input && input.floors) || [];
  if (!fl.some((f) => filled(f.area) || f.windowless)) return [];
  return [...fl]
    .sort((a, b) => b.level - a.level)
    .map((f) => ({ name: f.level < 0 ? `지하 ${-f.level}층` : `${f.level}층`, area: filled(f.area) ? `${num(f.area)}㎡` : "—", windowless: f.level > 0 && !!f.windowless }));
}

/** 입력·선택 사항 — ["건물 내부 차고·주차장 합계 300㎡", "특별피난계단… 있음", …] (입력 화면 순서와 비슷하게) */
export function inputItems(input) {
  if (!input) return [];
  const out = [];
  if (filled(input.occ)) out.push(`수용인원 ${num(input.occ)}명`);
  if (filled(input.useArea)) out.push(`이 용도 바닥면적 합계 ${num(input.useArea)}㎡`);
  const f = input.f || {};
  for (const [k, [label, unit]] of Object.entries(NUMS)) if (filled(f[k]) && parseFloat(f[k]) !== 0) out.push(`${label} ${num(f[k])}${unit}`); // 0(없음)은 생략
  for (const [k, [label, map]] of Object.entries(PICKS)) if (filled(f[k]) && map[f[k]]) out.push(`${label}: ${map[f[k]]}`);
  for (const [k, label] of Object.entries(CHECKS)) if (f[k] === true) out.push(label);
  return out;
}

export const _keys = { NUMS, PICKS, CHECKS };

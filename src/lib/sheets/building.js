// ============================================================
// 신축·기존 건축물 입력 ↔ 엑셀 서식
// ============================================================
import { USES, USE_GROUPS, getUse } from "../../law/uses";
import { EMPTY, syncFloors, subName } from "../../components/Wizard";
import { makeBook, readForms, yn, toDate } from "../sheetForm";

const grpLabel = (no) => (USE_GROUPS.find((g) => g.no === no) || {}).label || "";
/** 서식에 쓰는 용도 이름: 「15. 공장 — 공장」 */
export const purposeName = (u) => (u.no === "-" ? "단독주택(특정소방대상물 아님)" : `${u.no}. ${grpLabel(u.no)} — ${subName(u, "")}`);
const USE_NAMES = USES.map(purposeName);
function findUse(v) {
  const s = String(v || "").trim();
  if (!s) return null;
  const norm = (x) => x.replace(/\s+/g, "");
  const n = norm(s);
  return (
    USES.find((u) => norm(purposeName(u)) === n) ||
    USES.find((u) => u.id === s) ||
    USES.find((u) => norm(subName(u, "")) === n || norm(u.name) === n) ||
    USES.find((u) => n.endsWith(norm(subName(u, ""))) && n.startsWith(u.no === "-" ? "단독" : `${u.no}.`)) ||
    null
  );
}

const SEL = {
  eduDormType: [["hapsuk", "합숙소(교육연구시설)"], ["dorm", "기숙사(학교 기숙사 = 공동주택)"]],
  clinicType: [["clinic", "의원"], ["dental", "치과의원"], ["oriental", "한의원"]],
  midwifeType: [["midwife", "조산원"], ["postnatal", "산후조리원"]],
  neighFlame: [["gym", "체력단련장"], ["perf", "공연장"], ["religion", "종교집회장"]],
  radwaste: [["withWater", "소화수 처리설비 있음"], ["noWater", "소화수 처리설비 없음"]],
};

/** [키, 항목, 종류, 설명] — 키가 f.로 시작하면 세부 입력(input.f) */
const FIELDS = [
  { sec: "1. 기본", secHelp: "* 표시는 필수" },
  ["date", "최초 건축허가(설계허가)일", "date", "건축물대장의 허가일 — 그날 시행 법령으로 판정", "existing"],
  ["use", "대상물 용도(별표2)", "use", "목록에서 선택 — 「번호. 대분류 — 세부 용도」"],
  ["gf", "지상 층수", "num", "터널·지하구는 비워 둠"],
  ["bf", "지하 층수", "num", "없으면 0"],
  ["area", "연면적(㎡)", "num", "터널·지하구는 비워 둠"],
  ["f.tunnelLen", "터널 길이(m)", "num", "터널만 — 연결송수관 500m 기준은 설계용역 입찰공고일 기준"],
  ["completed", "사용승인일(완공일)", "date", "건축물대장 기준 — 부칙 소급·자체점검 시기 판정용", "existing"],
  { sec: "2. 세부 사항", secHelp: "해당 용도만 적고 나머지는 비워 둠" },
  ["occ", "수용인원(명)", "num", "문화·집회, 종교, 운동, 판매, 운수, 물류, 숙박 가능 수련시설, 지하상가 — 시행령 별표7 산정(비우면 면적으로 추정)"],
  ["useArea", "이 용도 바닥면적 합계(㎡)", "num", "다른 용도와 함께 있는 건물만"],
  ["f.stageArea", "무대부 바닥면적(㎡)", "num", "문화·집회, 종교, 운동시설 — 없으면 0"],
  ["f.stageUG", "무대부가 지하층·무창층·4층 이상에 있음", "yn", "문화·집회, 종교, 운동시설"],
  ["f.cinemaArea", "상영관 바닥면적(㎡)", "num", "영화상영관"],
  ["f.cinemaUG", "상영관이 지하층·무창층에 있음", "yn", "영화상영관"],
  ["f.inpatient", "입원실 있음", "yn", "의원·치과의원·한의원"],
  ["f.dialysis", "인공신장실 있음", "yn", "의원·치과의원·한의원"],
  ["f.bars", "탈출 방지용 창살 설치(자동 개방 구조 제외)", "yn", "노유자·정신의료기관·장애인 의료재활·요양병원"],
  ["f.noyuInHouse", "단독주택·공동주택 안에 설치된 시설", "yn", "노인 생활시설 외 노유자 생활시설"],
  ["f.combustibleTimes", "특수가연물(지정수량 배수)", "num", "공장·창고 — 없으면 0"],
  ["f.rackArea", "랙식 창고 부분(㎡)", "num", "창고 — 천장 10m 초과 랙식, 없으면 0"],
  ["f.nonFireproof", "지붕·외벽이 불연재료·내화구조가 아님", "yn", "공장·창고"],
  ["f.workers50", "상시 근로자 50명 이상 옥내 작업장", "yn", "공장"],
  ["f.lithium", "리튬 1차전지 제조 공장", "yn", "공장"],
  ["f.gasTankTon", "지상 노출 탱크 용량(톤)", "num", "가스시설"],
  ["f.gasUse", "가스시설(도시가스·LPG) 사용", "yn", "숙박·노유자·판매·수련·의료·문화·운동·종교·운수·물류·장례·공장"],
  ["f.households", "세대수(주택 세대수)", "num", "공동주택·주택 겸용 복합건축물 — 단지 전체 세대수"],
  ["f.nationalHousingShelter", "국민주택규모 이하 — 지하층이 대피시설 전용", "yn", "아파트등"],
  ["f.corridorApt", "갓복도형 아파트", "yn", "아파트등"],
  ["f.cooking", "취사 가능(생활숙박시설)", "yn", "숙박시설(2013~2017 허가분)"],
  ["f.unmanned", "야간 무인경비시스템으로 관리", "yn", "업무·공장·창고·군사·발전시설(2004~2017 허가분)"],
  ["f.bigstoreRestaurant", "입점 일반음식점 있음(후드·덕트 주방)", "yn", "대규모점포"],
  { sec: "3. 안전관리 검토용", secHelp: "소방안전관리대상물·방염·전용구역 판정" },
  ["f.height", "건축물 높이(m)", "num", "지상으로부터 높이 — 특급·1급(120m·200m), 20층 이상이면 입력"],
  ["f.gasTon", "가연성 가스 저장·취급량(톤)", "num", "가스시설·공장·창고 — 1급 1천톤, 2급 100톤"],
  ["f.eduDormType", "합숙소·기숙사 구분", "sel", "교육연구시설 기숙사·합숙소"],
  ["f.clinicType", "의원 종류", "sel", "의원·치과의원·한의원(방염 판정)"],
  ["f.midwifeType", "조산원·산후조리원 구분", "sel", "조산원·산후조리원"],
  ["f.neighFlame", "방염 대상 근린생활시설", "sel", "일반 근린생활시설 — 해당 없으면 비워 둠"],
  ["f.publicOrg", "공공기관(「공공기관의 소방안전관리에 관한 규정」 적용)", "yn"],
  ["f.fireBrigade", "소방대가 근무하는 공공기관(종합점검 제외)", "yn", "공공기관만"],
  ["f.multiUse", "다중이용업소 영업장 있음", "yn"],
  ["f.multiUseHeavy", "단란·유흥주점, 영화상영관·비디오물감상실·복합영상물제공업, 노래연습장, 산후조리업, 고시원, 안마시술소 중 하나", "yn", "다중이용업소가 있는 경우(종합점검 2,000㎡ 기준)"],
  ["f.waterReelOnly", "물분무등소화설비를 호스릴 방식만 설치", "yn"],
  ["f.outdoorFacility", "건축물 옥내에 있지 않은 시설(옥외 관람장 등)", "yn", "문화·집회, 종교, 운동시설"],
  ["f.poolOnly", "수영장", "yn", "운동시설"],
  ["f.studio", "촬영소", "yn", "방송통신시설(방송국 제외)"],
  ["f.nonCombustibleStore", "철강 등 불연성 물품을 저장·취급하는 창고", "yn", "창고"],
  ["f.cityGas", "가스 제조설비를 갖추고 도시가스사업 허가를 받아야 하는 시설", "yn", "가스시설·공장·창고"],
  ["f.elevator", "승강기 설치(의무관리대상 150세대 기준)", "yn", "공동주택"],
  ["f.centralHeat", "중앙집중식 난방(지역난방 포함)", "yn", "공동주택"],
  ["f.mmConsent", "입주자등 동의로 의무관리대상 전환", "yn", "공동주택(공동주택관리법 제2조①2 마목)"],
  ["f.laneException", "하나의 대지에 1개 동 + 정차·주차금지 편도 2차선 이상 도로에 직접 접함(전용구역 제외)", "yn", "아파트·기숙사"],
  { sec: "4. 주차장·전기실 등", secHelp: "해당 시 입력" },
  ["f.parkingInside", "건물 내부 차고·주차장 합계(㎡)", "num", "지상+지하 합계 — 물분무등소화설비(200㎡ 이상)"],
  ["f.ugParking", "그중 지하 차고·주차장(㎡)", "num", "합계에 포함된 면적 — 2026.3.1. 이후 신청분 지하 주차장 기준"],
  ["f.mechCars", "기계식 주차 대수", "num"],
  ["f.rooftopParking", "옥상 차고·주차장(㎡)", "num"],
  ["f.elecRoom", "전기실·발전실·변전실·전산실(㎡)", "num", "하나의 방화구획 안 합산"],
  ["f.specialStairs", "특별피난계단·비상용(피난용) 승강기 승강장 있음", "yn"],
  ["f.co2", "이산화탄소소화설비 설치(호스릴 제외)", "yn"],
  ["f.groupCafeteria", "집단급식소 있음", "yn"],
  ["f.lath", "라스(철망) 비내화구조", "yn"],
  ["f.leak100A", "계약전류용량 100A 초과", "yn"],
  ["f.roadDirect", "지하층이 피난층이고 주출입구가 도로에 접함", "yn"],
  ["f.staffed24", "수신기 설치 장소 24시간 근무자 있음", "yn"],
  ["f.radwaste", "방사성폐기물 저장시설", "sel", "위험물 저장·처리시설, 창고, 공장 — 해당 없으면 비워 둠"],
];

const getV = (input, k) => (k.startsWith("f.") ? (input.f || {})[k.slice(2)] : input[k]);
const lvName = (lv) => (lv < 0 ? `지하 ${-lv}` : `${lv}층`);
export function parseLevel(s) {
  const t = String(s || "").replace(/\s+/g, "").toUpperCase();
  if (!t) return null;
  let m = /^(?:지하|B|-)(\d+)(?:층|F)?$/.exec(t);
  if (m) return -parseInt(m[1], 10);
  m = /^(?:지상)?(\d+)(?:층|F)?$/.exec(t);
  if (m) return parseInt(m[1], 10);
  return null;
}

/** 엑셀 서식 만들기 — input을 주면 채운 서식, EMPTY면 빈 서식 */
export function buildingBook(mode, input = EMPTY) {
  const ex = mode === "existing";
  const fields = [];
  for (const x of FIELDS) {
    if (!Array.isArray(x)) {
      fields.push(x);
      continue;
    }
    const [key, label, type, help, only] = x;
    if (only === "existing" && !ex) continue;
    const raw = getV(input, key);
    let value = raw;
    let list;
    let t = type;
    if (type === "use") {
      const u = getUse(input.use);
      value = u ? purposeName(u) : "";
      list = USE_NAMES;
      t = "list";
    } else if (type === "sel") {
      const opts = SEL[key.slice(2)];
      list = opts.map((o) => o[1]);
      value = (opts.find((o) => o[0] === raw) || [])[1] || "";
      t = "list";
    } else if (type === "yn") value = raw === true ? "예" : "";
    const req = ["date", "use", "gf", "area"].includes(key);
    fields.push({ key, label: req ? `${label} *` : label, type: t, list, value: value == null ? "" : value, help, req });
  }
  const floors = (input.floors || []).length
    ? input.floors.map((fl) => [lvName(fl.level), fl.area || "", fl.windowless ? "예" : ""])
    : [["지하 1", "", ""], ...Array.from({ length: 5 }, (_, i) => [`${i + 1}층`, "", ""])];
  const title = ex ? "기존 건축물" : "신축 건축물";
  return makeBook([
    {
      id: `hfls:building:${mode}`,
      name: "입력",
      title: `소방시설 산정 입력 서식 — ${title}`,
      intro: [
        "노란 칸(입력값)에만 적으십시오. 해당 없는 항목은 비워 두면 됩니다. 예/아니오·용도는 칸을 누르면 나오는 목록에서 고릅니다.",
        "층별 바닥면적은 「층별」 시트에 적습니다(비우면 연면적 범위로 판정). 다 쓴 뒤 앱 「" + title + "」 탭의 「불러오기」로 이 파일을 올리면 입력됩니다.",
      ],
      fields,
    },
    {
      table: true,
      id: `hfls:floors:${mode}`,
      name: "층별",
      title: "층별 바닥면적",
      intro: ["층은 「지하 1」「1층」처럼 적습니다. 무창층(건축법 시행령 기준 개구부 면적 1/30 이하인 지상층)이면 「예」. 줄이 모자라면 아래에 이어 적으십시오."],
      head: ["층", "바닥면적(㎡)", "무창층"],
      widths: [14, 16, 12],
      rows: floors,
      blankRows: 10,
      lists: { 2: ["예", "아니오"] },
    },
  ]);
}

/**
 * 올린 서식 → 입력값. { input, warn:[…] } — 서식이 아니면 throw
 */
export function readBuildingBook(buf, mode) {
  const forms = readForms(buf);
  const main = forms.find((f) => f.id.startsWith("hfls:building:"));
  if (!main) throw new Error("건축물 입력 서식(엑셀)이 아닙니다. 「빈 서식 받기」로 받은 파일을 써 주십시오.");
  const warn = [];
  const v = main.values;
  const inp = { ...EMPTY, action: mode, f: {} };
  for (const x of FIELDS) {
    if (!Array.isArray(x)) continue;
    const [key, label, type] = x;
    if (!(key in v)) continue;
    const s = v[key];
    let val;
    if (type === "use") {
      if (!s) continue;
      const u = findUse(s);
      if (!u) {
        warn.push(`용도 「${s}」를 찾지 못했습니다 — 앱에서 다시 고르십시오.`);
        continue;
      }
      inp.use = u.id;
      inp.grp = u.no;
      continue;
    } else if (type === "yn") {
      const b = yn(s);
      if (b === null) {
        if (s) warn.push(`「${label}」: 「${s}」 → 예/아니오로 적어 주십시오.`);
        continue;
      }
      val = b || undefined;
    } else if (type === "sel") {
      if (!s) continue;
      const o = SEL[key.slice(2)].find((p) => p[1] === s || p[0] === s);
      if (!o) {
        warn.push(`「${label}」: 「${s}」는 목록에 없는 값입니다.`);
        continue;
      }
      val = o[0];
    } else if (type === "date") {
      val = toDate(s);
      if (val && !/^\d{4}-\d{2}-\d{2}$/.test(val)) warn.push(`「${label}」: 「${s}」 → 2026-03-05 형식으로 적어 주십시오.`);
    } else if (type === "num") {
      val = s.replace(/[,\s㎡]/g, "");
      if (val && !Number.isFinite(Number(val))) {
        warn.push(`「${label}」: 「${s}」는 숫자가 아닙니다.`);
        continue;
      }
    } else val = s;
    if (key.startsWith("f.")) {
      if (val !== undefined && val !== "") inp.f[key.slice(2)] = val;
    } else inp[key] = val === undefined ? "" : val;
  }
  if (inp.bf === "") inp.bf = "0";
  // 층별
  const fl = forms.find((f) => f.id.startsWith("hfls:floors:"));
  const rows = [];
  if (fl) {
    for (const r of fl.table) {
      const lv = parseLevel(r[0]);
      if (lv === null || lv === 0) {
        if (r[0]) warn.push(`층별 시트: 층 「${r[0]}」을 읽지 못했습니다(예: 지하 1, 3층).`);
        continue;
      }
      const area = String(r[1] || "").replace(/[,\s㎡]/g, "");
      const w = yn(r[2]) === true;
      if (!area && !w) continue;
      rows.push({ level: lv, area, windowless: lv > 0 && w });
    }
  }
  if (rows.length) {
    const maxG = Math.max(0, ...rows.map((r) => r.level));
    const maxB = Math.max(0, ...rows.map((r) => -r.level));
    if (!inp.gf) inp.gf = String(maxG);
    if (maxB > (parseInt(inp.bf, 10) || 0) && !v.bf) inp.bf = String(maxB);
    if (maxG > (parseInt(inp.gf, 10) || 0)) warn.push(`층별 시트에 지상 ${maxG}층까지 있지만 지상 층수는 ${inp.gf}입니다 — 층수 밖의 층은 버렸습니다.`);
  }
  inp.floors = syncFloors(inp).map((f) => {
    const r = rows.find((x) => x.level === f.level);
    return r ? { ...f, area: r.area, windowless: r.windowless } : f;
  });
  if (main.id !== `hfls:building:${mode}`) warn.push(`${mode === "existing" ? "신축" : "기존"} 건축물 서식입니다 — ${mode === "existing" ? "건축허가일을 확인하십시오." : "건축허가일은 쓰지 않습니다."}`);
  return { input: inp, warn };
}

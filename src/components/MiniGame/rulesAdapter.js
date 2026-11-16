// ============================================================
// 「소방 인허가 시티」 판정 어댑터 — HFLS 판정 엔진(evaluateAt)을 그대로 호출
//  evaluate(building) → { [systemId]: { req, why, chk } }
//   building = { use, GF, BF, A, Ab, date('YYYY.MM.DD') }
//  · req  : HFLS 판정 '설치' (게임 면제 규칙 적용 후)
//  · chk  : HFLS 판정 '확인 필요'·'설치(연혁 확인)' → 채점에서 제외(선택해도, 안 해도 정답)
//  · why  : HFLS 근거 문구(기준 문구 + 산정 근거 + 법령 조항)
// HFLS 기준(criteria.js)을 고치면 게임 판정도 자동으로 바뀐다.
// ============================================================
import { evaluateAt, STATUS } from "../../law/engine";
import { getFacility } from "../../law/facilities";
import { housingFacilityNote } from "../../law/retro";
import { SYSTEMS, totals } from "./legacyRules";

// 게임 용도 → HFLS 용도(uses.js id)
export const USE_MAP = {
  house: "house",
  multi: "multi",
  apt: "apt",
  retail: "neigh",
  lodging: "lodging",
  daycare: "noyu",
  nursing: "noyu_res",
  factory: "factory",
  office: "office",
  hospital: "hosp",
  sales: "retail",
};

// 게임 설비 ID → HFLS 설비 key(facilities.js)
export const SYS_MAP = {
  ext: "ext",
  kitchen: "autoext",
  hyd: "hydrant",
  sp: "spk",
  ssp: "sspk",
  ohyd: "outhyd",
  single: "single",
  alarm: "alarm",
  afd: "afd",
  visual: "visual",
  broadcast: "pa",
  report: "report",
  escape: "escape",
  exitlight: "guide",
  emlight: "elight",
  plight: "plight",
  water: "waterSupply",
  standpipe: "standpipe",
  sprinkle: "conspk",
  outlet: "outlet",
  radio: "radio",
};

// 게임에서 '선택하지 않음'으로 보는 면제(시행령 별표5) — 대체 설비가 '설치'일 때만 적용
//  · 간이SP ← SP(제4호) · 비상경보 ← 자탐·단독경보형 연동(제7·8호) · 연결살수 ← SP·간이SP(제19호)
//  그 밖의 별표5 면제(연결송수관·비상조명등 등)는 '유효범위' 면제라 게임에서는 설치로 본다.
export const GAME_EXEMPT = {
  sspk: { by: ["spk"], no: "별표5 제4호" },
  alarm: { by: ["afd", "single"], no: "별표5 제7·8호" },
  conspk: { by: ["spk", "sspk"], no: "별표5 제19호" },
};

// 게임 데이터에 없는 HFLS 입력 — 기본값(게임 가정)
export const ASSUMPTIONS = [
  "무창층 없음, 지상 1층이 피난층, 지상 각 층 바닥면적 동일",
  "해당 용도 바닥면적 = 연면적(단일 용도)",
  "가스시설·특수가연물·랙식 창고·무대부·전기실 없음",
  "판매시설 수용인원 = 바닥면적 ÷ 3㎡(최대 499명)",
  "숙박시설 수용인원 = 바닥면적 ÷ 3㎡(침대 수 미상)",
  "아파트 지하층은 주차장(지하 주차장 면적 = 지하층 합계)",
];
// 중급·고급 단계에서 추가로 쓰는 가정
export const STAGE_ASSUMPTIONS = [
  "아파트는 1개 동 단지(세대수 = 단지 세대수), 승강기 있음",
  "건축물 높이 = 지상 층수 × 3.3m",
  "물분무등소화설비는 호스릴 방식 아님, 공공기관·다중이용업소 없음",
  "소방차 전용구역 제외 단서(1개 동 + 편도 2차선 도로 직접 접함) 해당 없음",
];

/** 'YYYY.MM.DD' → 'YYYY-MM-DD' */
export const toIso = (d) => String(d || "").replace(/\./g, "-");

/** 게임 건물 → HFLS 입력 */
export function toHflsInput(b) {
  const { T, bTot } = totals(b);
  const floors = [];
  for (let i = 1; i <= b.GF; i++) floors.push({ level: i, area: b.A });
  for (let i = 1; i <= b.BF; i++) floors.push({ level: -i, area: b.Ab });
  const f = { combustibleTimes: 0, rackArea: 0, stageArea: 0, gasTankTon: 0, mechCars: 0 };
  if (b.use === "apt" && b.BF > 0) f.ugParking = bTot;
  // 중급·고급 단계 판정용(세대수·높이·승강기) — 값이 있을 때만
  if (b.hh) f.households = b.hh;
  if (b.use === "apt") f.elevator = true;
  if (b.H) f.height = b.H;
  const input = { use: USE_MAP[b.use], area: T, gf: b.GF, bf: b.BF, floors, f };
  if (b.use === "sales") input.occ = Math.min(499, Math.floor(T / 3));
  if (b.use === "lodging") input.occ = Math.floor(T / 3);
  return input;
}

const short = (s) => String(s || "").replace(/\s+/g, " ").trim();
function whyOf(row, list) {
  const it = list[0];
  if (!it) return "";
  const basis = it.basis ? ` [${short(it.basis)}]` : "";
  return `${short(it.text)}${basis} — ${short(it.ref)}`;
}

/** 게임 판정 */
export function evaluate(b) {
  const date = toIso(b.date);
  const ev = evaluateAt(toHflsInput(b), date);
  const out = {};
  // 주택용소방시설(소화기·단독경보형 감지기) — HFLS 검토 결과의 별도 안내와 같은 근거
  const house = ev && housingFacilityNote(ev.u, date);
  for (const s of SYSTEMS) {
    if (house && (s.id === "ext" || s.id === "single")) {
      out[s.id] = { req: true, chk: false, why: `${house.title} — ${house.basis}` };
      continue;
    }
    const key = SYS_MAP[s.id];
    const row = ev && ev.byKey[key];
    if (!row) {
      out[s.id] = { req: false, chk: false, why: "HFLS 판정 결과 없음" };
      continue;
    }
    const st = row.status;
    if (st === STATUS.REQ) {
      const ex = GAME_EXEMPT[key];
      const by = ex && ex.by.find((k) => ev.byKey[k] && ev.byKey[k].status === STATUS.REQ);
      if (by) {
        out[s.id] = { req: false, chk: false, why: `설치 대상이나 ${getFacility(by).name} 설치로 면제(${ex.no}) — ${whyOf(row, row.hits)}` };
      } else out[s.id] = { req: true, chk: false, why: whyOf(row, row.hits) };
    } else if (st === STATUS.REQ_CHK || st === STATUS.CHK) {
      const list = row.maybes.length ? row.maybes : row.checks;
      out[s.id] = { req: false, chk: true, why: `[${st} — 채점 제외] ${whyOf(row, list)}` };
    } else {
      out[s.id] = { req: false, chk: false, why: noneWhy(ev, row) };
    }
  }
  return out;
}

function noneWhy(ev, row) {
  if (ev.nonSpecific) return ev.u.g.includes("house") ? "단독주택 — 특정소방대상물(시행령 별표2) 아님, 별표4 미적용" : "특정소방대상물(시행령 별표2) 해당 없음";
  return `${ev.table} ${row.fac.cur} 기준 미해당`;
}

/** HFLS가 '설치'로 판정했지만 게임 선택지에 없는 설비(참고 표시용) */
export function extrasOf(b) {
  const ev = evaluateAt(toHflsInput(b), toIso(b.date));
  if (!ev) return [];
  const used = new Set(Object.values(SYS_MAP));
  return ev.rows
    .filter((r) => !used.has(r.fac.key) && r.status !== STATUS.NONE)
    .map((r) => ({ name: r.fac.name, status: r.status, why: whyOf(r, r.hits.length ? r.hits : r.maybes.length ? r.maybes : r.checks) }));
}

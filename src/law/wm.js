// ============================================================
// 위험물 정기점검표 — 위험물안전관리법 제18조, 영 제16조, 시행규칙 제64조~제68조
// 점검표 서식: 위험물안전관리에 관한 세부기준 [별지 제9호~제24호서식] 일반점검표
// 위험물안전카드: 시행규칙 [별지 제48호서식] <개정 2021.7.13.>
// ============================================================
import { WM_ROWS } from "./wmRows";

export const KFSI = "https://safe.kfsi.or.kr/";
export const RESULTS = ["적합", "부적합", "해당없음", "점검곤란"];

const YN = [
  ["y", "여"],
  ["n", "부"],
];
// 제조소·일반취급소(별지 제9호): 설비가 없으면 해당 대분류 전체가 해당없음 — 기본값은 교재 작성예시(설비 없음)
const OPT9 = [
  { k: "spill", label: "누출·비산방지장치", ch: YN, def: "n" },
  { k: "heat", label: "가열·냉각·건조설비", ch: YN, def: "n" },
  { k: "htank", label: "위험물취급탱크", ch: YN, def: "n", hint: "「부」로 둔 설비(누출·비산방지장치, 가열·냉각·건조설비, 위험물취급탱크)는 해당 대분류 전체가 해당없음" },
];
// 소화설비 가압송수장치·예비동력원 — 선택하지 않은 쪽 항목은 해당없음
const PUMP = { k: "pump", label: "가압송수장치 동력", ch: [["motor", "전동기"], ["engine", "내연기관"]], def: "motor", hint: "전동기: 내연기관 항목 해당없음 / 내연기관: 전동기·전동기제어장치 항목 해당없음" };
const POWER = { k: "power", label: "예비동력원", ch: [["gen", "자가발전설비"], ["bat", "축전지설비"]], def: "gen", hint: "선택하지 않은 예비동력원 항목은 해당없음" };

/**
 * 점검표 정의 — form: 별지 번호, kind: facility(제조소등) | fire(소화·경보설비), book: 참고 교재
 * opts: 형태 선택(점검표 머리 표시·항목 기본값 결정), extra: 머리 추가 칸
 */
export const WM_FORMS = [
  {
    id: "gas", form: "16", tab: "주유취급소", title: "주유취급소 일반점검표", kind: "facility", book: "manager",
    opts: [
      { k: "self", label: "주유 방식", ch: [["general", "일반"], ["self", "셀프"]], def: "general", hint: "셀프: 셀프용·감시대 항목 적합, 일반: 해당없음" },
      { k: "indoor", label: "형태", ch: [["out", "옥외"], ["in", "옥내"]], def: "out" },
      { k: "hang", label: "현수식 주유설비", ch: YN, def: "n" },
      { k: "dbl", label: "이중벽 탱크", ch: YN, def: "y" },
    ],
  },
  {
    id: "mobile", form: "13", tab: "이동탱크저장소", title: "이동탱크저장소 일반점검표", kind: "facility", book: "carrier",
    opts: [
      { k: "container", label: "컨테이너식", ch: YN, def: "n" },
      { k: "tow", label: "견인식", ch: YN, def: "n" },
      { k: "park", label: "상치장소", ch: [["out", "옥외"], ["in", "옥내"]], def: "out" },
      { k: "cold", label: "보냉·보온재", ch: YN, def: "n" },
    ],
  },
  { id: "handle", form: "9", tab: "일반취급소", title: "일반취급소 일반점검표", kind: "facility", book: "manager", fixed: "일반취급소", opts: OPT9 },
  {
    id: "ugtank", form: "12", tab: "지하탱크저장소", title: "지하탱크저장소 일반점검표", kind: "facility", book: "manager",
    opts: [
      { k: "dbl", label: "이중벽", ch: YN, def: "y" },
      { k: "room", label: "전용실 설치", ch: YN, def: "n" },
    ],
  },
  { id: "plant", form: "9", tab: "제조소", title: "제조소 일반점검표", kind: "facility", book: "manager", fixed: "제조소", opts: OPT9 },
  {
    id: "instore", form: "10", tab: "옥내저장소", title: "옥내저장소 일반점검표", kind: "facility", book: "manager",
    opts: [{ k: "floor", label: "형태", ch: [["single", "단층"], ["multi", "다층"], ["mixed", "복합"]], def: "single", hint: "복합: 「다른용도 부분과 구획」 항목 적합, 단층·다층: 해당없음" }],
  },
  {
    id: "outtank", form: "11", tab: "옥외탱크저장소", title: "옥외탱크저장소 일반점검표", kind: "facility", book: "manager",
    opts: [
      {
        k: "roof", label: "형태",
        ch: [["fixed", "고정지붕식"], ["float", "부상지붕식"], ["ug", "지중탱크"], ["cover", "부상덮개부착 고정지붕식"], ["sea", "해상탱크"], ["etc", "기타"]],
        def: "fixed", hint: "부상지붕식: 실기구·루프드레인·폰튠 등 적합, 그 밖: 해당없음",
      },
    ],
  },
  { id: "outstore", form: "14", tab: "옥외저장소", title: "옥외저장소 일반점검표", kind: "facility", book: "manager", extra: ["옥외저장소의 면적"], opts: [] },
  { id: "rock", form: "15", tab: "암반탱크저장소", title: "암반탱크저장소 일반점검표", kind: "facility", book: "manager", extra: ["암반탱크의 용적"], opts: [] },
  { id: "pipe", form: "17", tab: "이송취급소", title: "이송취급소 일반점검표", kind: "facility", book: "manager", extra: ["이송취급소의 총연장"], opts: [] },
  // 소방시설(소화·경보설비)
  { id: "hyd", form: "18", tab: "옥내·옥외소화전설비", title: "소화전설비 일반점검표", kind: "fire", opts: [{ k: "place", label: "구분", ch: [["in", "옥내"], ["out", "옥외"]], def: "in" }, PUMP, POWER] },
  { id: "spr", form: "19", tab: "스프링클러·물분무소화설비", title: "스프링클러설비 일반점검표", kind: "fire", opts: [{ k: "kind", label: "구분", ch: [["sp", "스프링클러설비"], ["spray", "물분무소화설비"]], def: "sp" }, PUMP, POWER] },
  { id: "foam", form: "20", tab: "포소화설비", title: "포소화설비 일반점검표", kind: "fire", opts: [PUMP, POWER] },
  { id: "co2", form: "21", tab: "이산화탄소소화설비", title: "이산화탄소소화설비 일반점검표", kind: "fire", opts: [POWER] },
  { id: "halon", form: "22", tab: "할로젠화합물소화설비", title: "할로젠화합물소화설비 일반점검표", kind: "fire", opts: [POWER] },
  { id: "powder", form: "23", tab: "분말소화설비", title: "분말소화설비 일반점검표", kind: "fire", opts: [POWER] },
  { id: "afd", form: "24", tab: "자동화재탐지설비", title: "자동화재탐지설비 일반점검표", kind: "fire", opts: [] },
];
export const wmForm = (id) => WM_FORMS.find((f) => f.id === id);
export const wmRows = (f) => WM_ROWS[f.form] || [];

/** 형태 선택값 */
export function optVals(f, st) {
  const o = {};
  for (const x of f.opts) o[x.k] = (st.opts && st.opts[x.k]) || x.def;
  return o;
}

/** 조건키 → 기본 결과 */
export function defaultResult(f, cond, o) {
  if (!cond) return "적합";
  const on = {
    self: o.self === "self",
    hang: o.hang === "y",
    dbl: o.dbl === "y",
    parkOut: o.park !== "in",
    parkIn: o.park === "in",
    container: o.container === "y",
    cold: o.cold === "y",
    float: o.roof === "float" || o.roof === "cover",
    mixed: o.floor === "mixed",
    spill: o.spill === "y",
    heat: o.heat === "y",
    htank: o.htank === "y",
    motor: o.pump !== "engine",
    engine: o.pump === "engine",
    gen: o.power !== "bat",
    bat: o.power === "bat",
    ex: false, // 교재 작성예시에서 해당없음으로 표시된 항목
  }[cond];
  return on ? "적합" : "해당없음";
}

/** 항목별 결과(직접 고친 값 우선) */
export function results(f, st) {
  const o = optVals(f, st);
  return wmRows(f).map((r, i) => (st.res && st.res[i]) || defaultResult(f, r[4], o));
}

export function emptyWm() {
  return { opts: {}, res: {}, note: {}, hdr: {}, hz: [{ item: "", amount: "" }] };
}

/** 머리 표기용 형태 문자열(서식 그대로) */
export function headLine(f, st) {
  const o = optVals(f, st);
  const C = (b) => (b ? "[√]" : "[  ]");
  switch (f.form) {
    case "16":
      return `${C(o.indoor === "in")}옥내 ${C(o.indoor !== "in")}옥외  고객이 직접주유하는 형태(${o.self === "self" ? "여" : "부"})`;
    case "13":
      return `컨테이너식 (${o.container === "y" ? "여" : "부"})  견인식 (${o.tow === "y" ? "여" : "부"})`;
    case "12":
      return `이중벽 (${o.dbl === "y" ? "여" : "부"})  전용실설치여부 (${o.room === "y" ? "여" : "부"})`;
    case "10":
      return `${C(o.floor === "single")}단층 ${C(o.floor === "multi")}다층 ${C(o.floor === "mixed")}복합`;
    case "11":
      return f.opts[0].ch.map(([k, l]) => `${C(o.roof === k)}${l}`).join(" ");
    case "9":
      return `${C(f.fixed === "제조소")}제조소 ${C(f.fixed === "일반취급소")}일반취급소`;
    case "18":
      return `${C(o.place === "in")} 옥내  ${C(o.place === "out")} 옥외`;
    case "19":
      return `${C(o.kind === "spray")} 물분무소화설비  ${C(o.kind !== "spray")} 스프링클러설비`;
    default:
      return "";
  }
}
/** 표 제목 — 별지 제19호는 선택한 설비 이름으로 */
export const titleOf = (f, st) => (f.form === "19" ? `${optVals(f, st).kind === "spray" ? "물분무소화설비" : "스프링클러설비"} 일반점검표` : f.title);
export const headLabel = (f) =>
  ({ 16: "주유취급소의 형태", 13: "이동탱크저장소의 형태", 12: "지하탱크저장소의 형태", 10: "옥내저장소의 형태", 11: "옥외탱크저장소의 형태", 9: "제조소등의 구분" })[f.form] || (f.extra ? f.extra[0] : "");

/** 위험물안전카드 빈 값 */
export function emptyCard() {
  return {
    name1: "", name2: "", un: "", cas: "", cls: {}, item: "", chem: {}, gun: {}, feat: {}, other: "", state: {},
    aid: ["", "", "", "", ""], city: "", ex: "", owner: { name: "", addr: "", day: "", night: "" }, carrier: { name: "", addr: "", day: "", night: "" },
  };
}


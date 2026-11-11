// ============================================================
// 안전시설등 세부점검표 ↔ 엑셀 서식
// ============================================================
import { MU_TYPES, MU_FLOORS, MU_ITEMS, MU_NUM, MU_RESULTS, MU_QUALS, muType, muOpts, muApplies, muResults, emptyMu } from "../../law/mu";
import { makeBook, readForms, yn, toDate } from "../sheetForm";

const HDR = [
  ["name", "대상명"],
  ["tel", "전화번호"],
  ["addr", "소재지"],
  ["use", "주용도", "비우면 업종 이름"],
  ["structure", "건물구조"],
  ["ceo", "대표자"],
  ["manager", "소방안전관리자"],
];
const OPTS = [
  ["sealed", "밀폐구조 영업장", "개구부 면적 합계가 바닥면적의 1/30 이하 → 간이스프링클러"],
  ["rooms", "구획된 실 있음", "비우면 업종 기본값 — 영업장 내부 피난통로"],
  ["av", "노래반주기 등 영상음향장치 사용", "비우면 업종 기본값 — 영상음향차단장치"],
  ["exitFree", "비상구 설치 제외 영업장", "별표 1의2 제2호 단서"],
  ["mapFree", "피난안내도 비치 제외", "33㎡ 이하, 또는 구획된 실 없이 어디서나 출입구·비상구가 보임"],
  ["filmFac", "피난안내 영상물 상영 시설 있음", "단란·유흥주점, 전화방·수면방·콜라텍·방탈출·키즈·만화카페만"],
];

/** 엑셀 서식(st를 주면 채움) */
export function muBook(st0) {
  const st = st0 || emptyMu();
  const o = muOpts(st);
  const t = muType(st.type);
  const res = muResults(st);
  const fields = [{ sec: "1. 점검대상" }];
  fields.push({ key: "type", label: "다중이용업 업종", type: "list", list: MU_TYPES.map((x) => x.name), value: t ? t.name : "", help: "업종에 따라 해당없음 항목 기본값이 정해짐" });
  for (const [k, l, help] of HDR) fields.push({ key: `hdr.${k}`, label: l, type: "text", value: st.hdr[k] || "", help });
  fields.push({ sec: "영업장 현황", secHelp: "해당없음 항목 판단 — 예/아니오" });
  fields.push({ key: "opt.floor", label: "영업장 위치", type: "list", list: MU_FLOORS.map((x) => x[1]), value: (MU_FLOORS.find((x) => x[0] === o.floor) || [])[1] || "" });
  for (const [k, l, help] of OPTS) fields.push({ key: `opt.${k}`, label: l, type: "yn", value: st0 && (st.opts || {})[k] !== undefined ? (o[k] ? "예" : "아니오") : "", help });
  fields.push({ sec: "2. 점검사항", secHelp: "점검결과: 양호·불량·해당없음(비우면 업종·현황에 따른 기본값) — 불량이면 조치사항" });
  MU_ITEMS.forEach(([title, subs], i) => {
    fields.push({
      key: `res.${i}`,
      label: `${MU_NUM[i]} ${title}${subs.length ? `\n- ${subs.join("\n- ")}` : ""}`,
      type: "list",
      list: MU_RESULTS,
      value: st0 && (st.res || {})[i] ? res[i] : "",
      note: { value: (st.act || {})[i] || "" },
      help: "",
      height: 16 * (1 + subs.length) + 2,
    });
  });
  fields.push({ sec: "점검일자·점검자" });
  fields.push({ key: "hdr.date", label: "점검일자", type: "date", value: st.hdr.date || "" });
  fields.push({ key: "hdr.checker", label: "점검자 성명", type: "text", value: st.hdr.checker || "" });
  fields.push({ key: "hdr.qual", label: "점검자 자격", type: "list", list: MU_QUALS, free: true, value: st.hdr.qual || "", help: "시행규칙 제14조제2호 — 서식에는 출력하지 않음" });
  return makeBook([
    {
      id: "hfls:mu",
      name: "세부점검표",
      title: "안전시설등 세부점검표 — 입력 서식(다중이용업소법 시행규칙 [별지 제10호서식])",
      intro: [
        "노란 칸(입력값·조치사항)에만 적으십시오. 목록이 있는 칸은 눌러서 고릅니다. 다 쓴 뒤 앱 「다중이용업 세부점검」의 「불러오기」로 이 파일을 올리면 점검표가 채워집니다.",
        "점검결과를 비워 두면 업종·영업장 현황에 따라 앱이 「양호」 또는 「해당없음」으로 채웁니다. 불량 항목만 「불량」을 고르고 조치사항을 적으면 됩니다.",
      ],
      noteCol: "조치사항",
      fields,
    },
  ]);
}

/** 올린 엑셀 → { data, warn } */
export function readMuBook(buf) {
  const f = readForms(buf).find((x) => x.id === "hfls:mu");
  if (!f) throw new Error("안전시설등 세부점검표 엑셀 서식이 아닙니다. 「빈 서식 받기(엑셀)」로 받은 파일을 써 주십시오.");
  const v = f.values;
  const warn = [];
  const st = emptyMu();
  if (v.type) {
    const t = MU_TYPES.find((x) => x.name === v.type || x.id === v.type);
    if (t) st.type = t.id;
    else warn.push(`업종 「${v.type}」를 찾지 못했습니다.`);
  }
  for (const [k] of HDR) if (v[`hdr.${k}`]) st.hdr[k] = v[`hdr.${k}`];
  if (v["opt.floor"]) {
    const fl = MU_FLOORS.find((x) => x[1] === v["opt.floor"] || x[0] === v["opt.floor"]);
    if (fl) st.opts.floor = fl[0];
    else warn.push(`영업장 위치 「${v["opt.floor"]}」는 목록에 없는 값입니다.`);
  }
  for (const [k, l] of OPTS) {
    const s = v[`opt.${k}`];
    if (!s) continue;
    const b = yn(s);
    if (b === null) warn.push(`「${l}」: 「${s}」 → 예/아니오`);
    else st.opts[k] = b;
  }
  MU_ITEMS.forEach((_, i) => {
    const s = (v[`res.${i}`] || "").replace(/\s+/g, "");
    const a = (f.notes[`res.${i}`] || "").trim();
    if (a) st.act[i] = a;
    if (!s) return;
    const r = MU_RESULTS.find((x) => x === s) || (s === "적합" ? "양호" : s === "부적합" ? "불량" : null);
    if (!r) {
      warn.push(`${MU_NUM[i]} 점검결과 「${s}」 → 양호·불량·해당없음`);
      return;
    }
    if (r !== (muApplies(i, st).on ? "양호" : "해당없음")) st.res[i] = r;
  });
  if (v["hdr.date"]) {
    st.hdr.date = toDate(v["hdr.date"]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(st.hdr.date)) warn.push(`점검일자 「${v["hdr.date"]}」 → 2026-03-05 형식`);
  }
  if (v["hdr.checker"]) st.hdr.checker = v["hdr.checker"];
  if (v["hdr.qual"]) st.hdr.qual = v["hdr.qual"];
  return { data: st, warn };
}

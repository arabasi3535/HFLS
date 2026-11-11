// ============================================================
// 안전시설등 세부점검표 ↔ 엑셀 서식
// ============================================================
import { MU_TYPES, MU_ITEMS, MU_NUM, MU_RESULTS, MU_QUALS, muType, muResults, emptyMu } from "../../law/mu";
import { makeBook, readForms, toDate } from "../sheetForm";

const HDR = [
  ["name", "대상명"],
  ["tel", "전화번호"],
  ["addr", "소재지"],
  ["use", "주용도", "비우면 업종 이름"],
  ["structure", "건물구조"],
  ["ceo", "대표자"],
  ["manager", "소방안전관리자"],
];
/** 엑셀 서식(st를 주면 채움) */
export function muBook(st0) {
  const st = st0 || emptyMu();
  const t = muType(st.type);
  const res = muResults(st);
  const fields = [{ sec: "1. 점검대상" }];
  fields.push({ key: "type", label: "다중이용업 업종", type: "list", list: MU_TYPES.map((x) => x.name), value: t ? t.name : "", help: "주용도를 비우면 업종 이름" });
  for (const [k, l, help] of HDR) fields.push({ key: `hdr.${k}`, label: l, type: "text", value: st.hdr[k] || "", help });
  fields.push({ sec: "2. 점검사항", secHelp: "점검결과: 항목마다 양호·불량·해당없음 중 선택 — 불량이면 조치사항" });
  MU_ITEMS.forEach(([title, subs], i) => {
    fields.push({
      key: `res.${i}`,
      label: `${MU_NUM[i]} ${title}${subs.length ? `\n- ${subs.join("\n- ")}` : ""}`,
      type: "list",
      list: MU_RESULTS,
      value: res[i],
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
        "점검결과는 항목마다 양호·불량·해당없음 중에서 고르고, 불량이면 조치사항을 적습니다. 비워 둔 항목은 앱에서도 빈칸(미선택)입니다.",
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
    const t = MU_TYPES.find((x) => x.name === v.type);
    if (t) st.type = t.id;
    else warn.push(`업종 「${v.type}」를 찾지 못했습니다.`);
  }
  for (const [k] of HDR) if (v[`hdr.${k}`]) st.hdr[k] = v[`hdr.${k}`];
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
    st.res[i] = r;
  });
  if (v["hdr.date"]) {
    st.hdr.date = toDate(v["hdr.date"]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(st.hdr.date)) warn.push(`점검일자 「${v["hdr.date"]}」 → 2026-03-05 형식`);
  }
  if (v["hdr.checker"]) st.hdr.checker = v["hdr.checker"];
  if (v["hdr.qual"]) st.hdr.qual = v["hdr.qual"];
  return { data: st, warn };
}

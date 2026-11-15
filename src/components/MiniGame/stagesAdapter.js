// ============================================================
// 「소방 인허가 시티」 중급·고급 단계 문항 — HFLS 판정 함수를 그대로 호출해 정답을 만든다
//  · 착공(중급): 착공신고·소방기술자·공사감리·감리원(construction.js), 임시소방시설·건설현장 소방안전관리자(temporary.js),
//               소방자동차 전용구역(safety.js fireLane)
//  · 준공 후(중급)·관리(고급): 소방안전관리대상물 등급·자체점검(safety.js), 고급은 전용구역 포함
//  · 설치 목록은 결과 화면 기본값과 같음(law/installed.js — 부칙 소급 의무 반영, 기본 대체 적용)
//  · HFLS가 '확인 필요'로 판정하거나 '연혁 확인' 설비 때문에 답이 갈리면 그 문항은 채점 제외
// ============================================================
import { review } from "../../law/engine";
import { construction, facsFromKeys, TECH_GRADES, SUPV_GRADES } from "../../law/construction";
import { fireSafetyGrade, fireLane, selfInspection, S as SS, SAFETY_REFS, INSPECT_REF } from "../../law/safety";
import { tempFacilities, siteManager, T as TT, TEMP_REF, SITE_REF } from "../../law/temporary";
import { defaultInstalled } from "../../law/installed";
import { toHflsInput, toIso } from "./rulesAdapter";

const YN = [
  { v: "y", label: "대상" },
  { v: "n", label: "비대상" },
];

/** HFLS 종합 검토(rv) — 신축: 신청일 기준 / 기존: 허가일 기준 + 현행(today) 비교 */
export function reviewOf(b, existing) {
  const date = toIso(b.date);
  const input = { ...toHflsInput(b), action: "new", date };
  if (existing && b.done) input.completed = toIso(b.done);
  return review(input, existing ? toIso(b.today || b.date) : date);
}

function cxOf(rv, keys, hh) {
  return construction({
    apt: rv.use.id === "apt",
    area: rv.input.area,
    gf: rv.input.gf,
    bf: rv.input.bf,
    households: hh || "",
    facs: facsFromKeys(keys),
  });
}

const top = (list) => (list && list.length ? list[0] : null);

/** 착공 단계 문항(중급) */
export function startQuestions(b) {
  const rv = reviewOf(b, false);
  const inst = defaultInstalled(rv, false);
  const cx = cxOf(rv, inst.buildKeys, b.hh);
  // '연혁 확인'(설치 확인 필요) 설비를 빼고도 산정 → 답이 달라지면 채점 제외
  const cx2 = inst.chkKeys.length ? cxOf(rv, inst.buildKeys.filter((k) => !inst.chkKeys.includes(k)), b.hh) : cx;
  const qs = [];
  if (!cx.ok) return { qs, facs: inst.list };
  const rep = (c) => (c.report.status === "대상" ? "y" : "n");
  qs.push({
    id: "report",
    title: "착공신고",
    kind: "one",
    opts: YN,
    ans: rep(cx),
    chk: rep(cx) !== rep(cx2),
    why: `${cx.report.why}${cx.report.items.length ? ` (${cx.report.items.join("·")})` : ""}`,
    ref: "소방시설공사업법 제13조, 시행령 제4조",
  });
  const tr = top(cx.tech.reasons);
  qs.push({
    id: "tech",
    title: "소방기술자 배치 등급",
    kind: "one",
    parent: { id: "report", v: "y" },
    opts: TECH_GRADES.map((g, i) => ({ v: String(i), label: g })),
    ans: String(cx.tech.lv),
    chk: cx.tech.lv !== cx2.tech.lv,
    why: tr ? `별표2 ${tr.ref} ${tr.why}` : "",
    ref: "공사업법 시행령 별표2",
  });
  const sv = (c) => (c.supv.status === "대상" ? "y" : "n");
  qs.push({
    id: "supv",
    title: "공사감리 지정",
    kind: "one",
    opts: YN,
    ans: sv(cx),
    chk: sv(cx) !== sv(cx2),
    why: cx.supv.status === "대상" ? `영 제10조제2항 — ${cx.supv.items.map((it) => it.text).join(", ")}` : cx.supv.why,
    ref: "공사업법 제17조, 시행령 제10조",
  });
  const sr = cx.supv.status === "대상" ? top(cx.supv.reasons) : null;
  qs.push({
    id: "supvLv",
    title: "책임감리원 등급",
    kind: "one",
    parent: { id: "supv", v: "y" },
    opts: SUPV_GRADES.slice(1).map((g, i) => ({ v: String(i + 1), label: g })),
    ans: cx.supv.status === "대상" ? String(cx.supv.lv) : "",
    chk: cx.supv.status === "대상" && cx2.supv.status === "대상" ? cx.supv.lv !== cx2.supv.lv : false,
    why: sr ? `${cx.supv.kind} — 별표4 ${sr.ref} ${sr.why}` : "",
    ref: "공사업법 시행령 별표3·별표4",
  });
  const tf = tempFacilities(rv);
  qs.push({
    id: "temp",
    title: "임시소방시설 (모두 선택)",
    kind: "multi",
    opts: tf.items.map((i) => ({ v: i.key, label: i.name })),
    ans: tf.items.filter((i) => i.status === TT.YES).map((i) => i.key),
    free: tf.items.filter((i) => i.status === TT.CHK).map((i) => i.key),
    whyOf: Object.fromEntries(tf.items.map((i) => [i.key, `${i.status} — ${i.why}`])),
    why: "화재위험작업 현장 기준(시행령 별표8 제2호)",
    ref: TEMP_REF,
  });
  const ln = fireLane(rv, "new");
  qs.push(laneQ(ln));
  const sm = siteManager(rv);
  qs.push({
    id: "site",
    title: "건설현장 소방안전관리자 선임",
    kind: "one",
    opts: YN,
    ans: sm && sm.status === TT.YES ? "y" : "n",
    chk: !!sm && sm.status === TT.CHK,
    why: sm ? sm.why.join(" / ") : "해당 없음",
    ref: SITE_REF,
  });
  return { qs, facs: inst.list };
}

function laneQ(ln) {
  return {
    id: "lane",
    title: "소방자동차 전용구역",
    kind: "one",
    opts: YN,
    ans: ln.status === SS.YES ? "y" : "n",
    chk: ln.status === SS.CHK,
    why: ln.reason,
    ref: SAFETY_REFS.lane,
  };
}

export const GRADE_OPTS = [
  { v: "none", label: "대상 아님" },
  { v: "3급", label: "3급" },
  { v: "2급", label: "2급" },
  { v: "1급", label: "1급" },
  { v: "특급", label: "특급" },
];
export const INSP_OPTS = [
  { v: "none", label: "대상 아님" },
  { v: "op", label: "작동점검" },
  { v: "both", label: "작동 + 종합점검" },
  { v: "top", label: "종합점검(반기, 특급)" },
];

/** 준공 후(중급) · 관리(고급) 단계 문항 */
export function postQuestions(b, existing) {
  const mode = existing ? "existing" : "new";
  const rv = reviewOf(b, existing);
  const inst = defaultInstalled(rv, existing);
  const qs = [];
  if (existing) qs.push(laneQ(fireLane(rv, mode)));
  const gr = fireSafetyGrade(rv, mode, inst.applied);
  const hit = gr.first >= 0 ? top(gr.levels[gr.first].hit) : null;
  qs.push({
    id: "grade",
    title: "소방안전관리대상물 등급",
    kind: "one",
    opts: GRADE_OPTS,
    ans: gr.status === SS.YES && gr.grade ? gr.grade : "none",
    chk: gr.status === SS.CHK,
    why: `${gr.summary}${hit ? ` — ${hit.text}${hit.basis ? ` (${hit.basis})` : ""}` : ""}`,
    ref: gr.ref,
  });
  const ins = selfInspection(rv, mode, gr, inst.installed);
  const iv = ins.status !== SS.YES ? "none" : ins.top ? "top" : ins.comp.length ? "both" : "op";
  qs.push({
    id: "insp",
    title: "자체점검",
    kind: "one",
    opts: INSP_OPTS,
    ans: iv,
    chk: ins.status === SS.CHK,
    why: `${ins.summary}${ins.comp.length ? ` — 종합점검 ${ins.comp.join(" / ")}` : ""}`,
    ref: INSPECT_REF,
  });
  return { qs, facs: inst.list, retro: existing ? rv.retro.map((r) => r.title) : [] };
}

/**
 * 채점 — picks: { [qid]: v | [v] }
 *  → { wrong: [qid], scored: 채점한 문항 수 }
 */
export function gradeAnswers(qs, picks) {
  const byId = Object.fromEntries(qs.map((q) => [q.id, q]));
  const wrong = [];
  let scored = 0;
  for (const q of qs) {
    if (q.kind === "multi") {
      const sel = new Set(picks[q.id] || []);
      const need = q.ans.filter((v) => !sel.has(v));
      const extra = [...sel].filter((v) => !q.ans.includes(v) && !(q.free || []).includes(v));
      scored++;
      if (need.length || extra.length) wrong.push(q.id);
      continue;
    }
    if (q.chk) continue;
    if (q.parent) {
      const p = byId[q.parent.id];
      if (!p || p.chk || p.ans !== q.parent.v) continue; // 상위 문항 정답이 '대상'일 때만 채점
    }
    scored++;
    if (picks[q.id] !== q.ans) wrong.push(q.id);
  }
  return { wrong, scored };
}

/** 정답 표시 문구 */
export function answerLabel(q) {
  if (q.kind === "multi") {
    const names = q.opts.filter((o) => q.ans.includes(o.v)).map((o) => o.label);
    return names.length ? names.join(", ") : "없음";
  }
  if (q.chk) return "확인 필요(채점 제외)";
  const o = q.opts.find((x) => x.v === q.ans);
  return o ? o.label : "해당 없음";
}

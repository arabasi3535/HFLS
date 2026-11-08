// ============================================================
// 학원 다중이용업소 해당 여부 — 다중이용업소법 시행령 제2조제3호 (시행 2026.7.1., 대통령령 제36432호)
//  가. 수용인원(소방시설법 시행령 별표7) 300명 이상
//  나. 수용인원 100명 이상 300명 미만으로서 (1) 같은 건축물에 기숙사 (2) 학원이 둘 이상이고 학원 수용인원 300명 이상
//      (3) 같은 건축물에 다른 다중이용업(제1·2·4~7·7의2~7의5·8호)과 함께 있는 경우.
//      다만, 학원 부분과 다른 용도 부분(운영권자가 다른 학원 포함)이 건축법 시행령 제46조 방화구획으로 나누어진 경우 제외
//  방화구획 적용 방식: 「학원 소방시설 적합여부 관련 업무연찬」(사용자 제공) 예시 1~3
//   · 층별(층간) 방화구획 → 그 층의 업소만 함께 봄  · 영업장별 방화구획 → 그 영업장만 봄
//   · (2)의 수용인원은 함께 보는 학원 바닥면적을 합산해 별표7(÷1.9㎡)로 산정
// ============================================================
import { occupancy } from "./tools";

export const AC_KINDS = [
  { id: "academy", label: "학원" },
  { id: "multi", label: "다중이용업소(학원 외)" },
  { id: "dorm", label: "기숙사" },
  { id: "other", label: "그 밖의 용도" },
];

/** 학원 수용인원 — 별표7 제2호가목(강의실·교무실·상담실·실습실·휴게실) 바닥면적 ÷ 1.9㎡, 복도·계단·화장실 제외 */
export function academyOcc(u) {
  return occupancy({ type: "class", area: u.area, excl: u.excl });
}

const num = (v) => (v === "" || v === null || v === undefined || !Number.isFinite(Number(v)) ? 0 : Number(v));
const fmt = (x) => (Math.round(x * 100) / 100).toLocaleString("ko-KR");

/** 함께 보는 범위(방화구획으로 나누어지지 않은 업소) */
export function zoneOf(floors, fi, ui) {
  const f = floors[fi];
  const t = f.units[ui];
  if (t.sep) return { units: [{ fi, ui }], why: "영업장별 방화구획 — 이 학원만 판단" };
  const fis = f.fireFloor ? [fi] : floors.map((_, i) => i).filter((i) => i === fi || !floors[i].fireFloor);
  const units = [];
  for (const i of fis) floors[i].units.forEach((u, j) => (i === fi && j === ui) || !u.sep ? units.push({ fi: i, ui: j }) : null);
  const why = f.fireFloor
    ? `층간 방화구획 — ${f.name || "이 층"}의 업소만 함께 판단`
    : fis.length < floors.length
      ? "층간 방화구획이 없는 층들의 업소를 함께 판단(방화구획된 층·영업장 제외)"
      : "방화구획 없음 — 건축물 전체 업소를 함께 판단(영업장별 방화구획된 업소 제외)";
  return { units, why };
}

/** 학원 1개 판정 */
export function judgeAcademy(floors, fi, ui) {
  const t = floors[fi].units[ui];
  const occ = academyOcc(t);
  const name = t.name || `학원(${floors[fi].name || ""})`;
  if (!occ.ok) return { ok: false, msg: occ.msg, name };
  const n = occ.result;
  const steps = [`${name} 수용인원: ${occ.steps.join(" → ")} → ${n}명(소수점 이하 반올림)`];
  const notes = [];
  if (n >= 300) return { ok: true, name, n, status: "대상", basis: "제3호가목", text: `수용인원 ${n}명 — 300명 이상`, steps, hits: [], notes };
  if (n < 100) {
    notes.push("수용인원 100명 미만 — 교육지원청이 관할 소방서에 소방안전점검 의뢰 또는 교육지원청 자체점검(업무연찬)");
    return { ok: true, name, n, status: "비대상", basis: "", text: `수용인원 ${n}명 — 100명 미만`, steps, hits: [], notes };
  }
  const z = zoneOf(floors, fi, ui);
  steps.push(`함께 보는 범위: ${z.why}`);
  const others = z.units.filter((x) => !(x.fi === fi && x.ui === ui)).map((x) => ({ ...floors[x.fi].units[x.ui], floor: floors[x.fi].name }));
  const hits = [];
  const dorms = others.filter((u) => u.kind === "dorm");
  if (dorms.length) hits.push({ no: "(1)", text: `같은 범위에 기숙사(${dorms.map((u) => u.name || u.floor).join(", ")})` });
  const acads = others.filter((u) => u.kind === "academy");
  if (acads.length) {
    const all = [t, ...acads];
    const sumA = all.reduce((a, u) => a + num(u.area) - num(u.excl), 0);
    const sumN = Math.round(sumA / 1.9);
    steps.push(`(2) 학원 합산: ${all.map((u) => `${u.name || "학원"} ${fmt(num(u.area) - num(u.excl))}㎡`).join(" + ")} = ${fmt(sumA)}㎡ ÷ 1.9㎡ = ${sumN}명`);
    if (sumN >= 300) hits.push({ no: "(2)", text: `학원 ${all.length}곳 합산 수용인원 ${sumN}명 — 300명 이상` });
    else steps.push(`(2) 합산 수용인원 ${sumN}명 — 300명 미만으로 해당 없음`);
  }
  const multis = others.filter((u) => u.kind === "multi");
  if (multis.length) hits.push({ no: "(3)", text: `같은 범위에 다중이용업소(${multis.map((u) => u.name || u.floor).join(", ")})` });
  if (hits.length) return { ok: true, name, n, status: "대상", basis: `제3호나목${hits.map((h) => h.no).join("")}`, text: `수용인원 ${n}명(100명 이상 300명 미만) + ${hits.map((h) => h.text).join(" / ")}`, steps, hits, notes };
  notes.push("다중이용업소 해당 없음 — 교육지원청이 관할 소방서에 소방안전점검 의뢰 또는 교육지원청 자체점검(업무연찬)");
  return { ok: true, name, n, status: "비대상", basis: "", text: `수용인원 ${n}명(100명 이상 300명 미만)이지만 함께 보는 범위에 기숙사·다른 학원(합산 300명 이상)·다중이용업소가 없음`, steps, hits, notes };
}

/** 건축물 안 모든 학원 판정 */
export function judgeAll(floors) {
  const out = [];
  floors.forEach((f, fi) => f.units.forEach((u, ui) => (u.kind === "academy" ? out.push({ fi, ui, floor: f.name, ...judgeAcademy(floors, fi, ui) }) : null)));
  return out;
}

// ============================================================
// 유도등·유도표지 구분 — 유도등 및 유도표지의 화재안전기술기준(NFTC 303) 표 2.1.1 <개정 2024.1.1.>
//  제1~6호: 유도등(피난구·통로) / 제7호 그 밖의 것: 유도표지(피난구·통로)
//  ※ 유도등의 크기(대형·중형·소형)는 화재안전기술기준 세부 사항이라 표시하지 않음
//  ※ 공동주택(NFTC 608)·창고시설(NFTC 609)처럼 별도 화재안전기술기준으로 유도등을 정한 용도는 유도등(관리자 확인 2026.11.)
// ============================================================

const ROW1 = ["perf", "cinema", "culture", "religion", "sports"]; // 공연장·집회장(종교집회장 포함)·관람장·운동시설
const ROW2 = ["dance"]; // 유흥주점(무대 있는 카바레·나이트클럽 등)
const ROW3 = ["entertain", "retail", "bigstore", "market", "transport", "terminal", "station", "hotel", "hosp", "nursing", "mental", "rehab", "funeral", "broadcast", "bstation", "ugmall"];
const ROW4 = ["lodging", "officetel"];
const ROW6 = ["neigh", "bath", "clinic", "midwife", "noyu_res", "noyu_res2", "noyu", "kinder", "office", "power", "ess", "school", "edu", "library", "edu_dorm", "training", "training_lodge", "factory", "correction", "aircar", "mixed", "mixed_res"];
const SEPARATE = {
  apt: "공동주택의 화재안전기술기준(NFTC 608)",
  row: "공동주택의 화재안전기술기준(NFTC 608)",
  multi: "공동주택의 화재안전기술기준(NFTC 608)",
  dorm: "공동주택의 화재안전기술기준(NFTC 608)",
  warehouse: "창고시설의 화재안전기술기준(NFTC 609)",
  logistics: "창고시설의 화재안전기술기준(NFTC 609)",
};
const REF = "유도등 및 유도표지의 화재안전기술기준(NFTC 303) 표 2.1.1";
const L = ["피난구유도등", "통로유도등"];

/**
 * @param {{use:{id}, input:{gf,bf,floors,f}}} rv
 * @returns {{kind:'light'|'sign', no, items:string[], why, ref, notes:string[]}}
 */
export function guideKind(rv) {
  const id = (rv.use && rv.use.id) || "";
  const inp = rv.input || {};
  const gf = Number(inp.gf) || 0;
  const bf = Number(inp.bf) || 0;
  const wl = (inp.floors || []).some((x) => x && x.windowless);
  const multiUse = !!(inp.f && inp.f.multiUse);
  const notes = [];
  if (SEPARATE[id]) {
    return { kind: "light", no: "별도 기준", items: L, why: `${SEPARATE[id]}에서 유도등 설치를 정함`, ref: SEPARATE[id], notes };
  }
  if (id === "aircar") notes.push("자동차정비공장 외(세차장 등)는 제7호(유도표지) — 지하층·무창층·11층 이상이면 제5호(유도등)");
  if (id === "mixed_res") notes.push("복합건축물의 주택 세대 내에는 유도등을 설치하지 않을 수 있음(표 비고 2)");
  if (ROW1.includes(id)) return { kind: "light", no: "제1호", items: L, why: "공연장·집회장(종교집회장 포함)·관람장·운동시설", ref: REF, notes };
  if (ROW2.includes(id)) return { kind: "light", no: "제2호", items: L, why: "유흥주점영업 중 무대가 설치된 카바레·나이트클럽 등", ref: REF, notes };
  if (ROW3.includes(id)) return { kind: "light", no: "제3호", items: L, why: "위락·판매·운수시설, 관광숙박업, 의료시설, 장례식장, 방송통신시설, 전시장, 지하상가, 지하철역사", ref: REF, notes };
  if (ROW4.includes(id)) return { kind: "light", no: "제4호", items: L, why: "숙박시설(관광숙박업 외)·오피스텔", ref: REF, notes };
  const deep = [bf > 0 && `지하 ${bf}층`, wl && "무창층", gf >= 11 && `지상 ${gf}층(11층 이상)`].filter(Boolean);
  if (deep.length) return { kind: "light", no: "제5호", items: L, why: `제1~3호 외 건축물로서 ${deep.join("·")}`, ref: REF, notes };
  if (ROW6.includes(id)) return { kind: "light", no: "제6호", items: L, why: "근린생활·노유자·업무·발전·종교(집회장 제외)·교육연구·수련시설, 공장, 교정시설, 자동차정비공장, 운전·정비학원, 다중이용업소, 복합건축물", ref: REF, notes };
  if (multiUse) return { kind: "light", no: "제6호", items: L, why: "다중이용업소가 있는 부분", ref: REF, notes: [...notes, "다중이용업소 외 부분은 제7호(유도표지)"] };
  return { kind: "sign", no: "제7호", items: ["피난구유도표지", "통로유도표지"], why: "제1~6호에 해당하지 않는 특정소방대상물(지하층·무창층 없고 10층 이하)", ref: REF, notes };
}

// ============================================================
// 도면 검토 포인트(v2.52.0) — 신축 산정 결과에서 설치 대상 설비별로 도면을 보기 전에 짚을 화재안전기술기준 핵심
//  · 내용은 사용자가 NFTC 원문(hwpx)에 형광펜으로 표시한 부분만 정리(빨강 = 최근 개정 → rev: true)
//  · 이 건물에 해당하지 않는 항목은 숨기고, 앱이 알 수 없는 조건(지하주차장·준비작동식·헤드 높이 등)은 문장 안에 적어 늘 표시
//  · 공동주택(NFTC 608)·창고시설(609)·지하구(605)는 그 용도일 때 일반 기준 대신(또는 함께) 표시
// ============================================================

// 받은 원문의 시행일(파일 이름 기준)
export const DP_VER = {
  103: "2026.7.1.",
  "103A": "2024.12.1.",
  203: "2026.3.1.",
  301: "2026.3.1.",
  302: "2026.3.1.",
  303: "2024.7.1.",
  304: "2022.12.1.",
  605: "2026.7.1.",
  608: "2026.7.1.",
  609: "2024.1.1.",
};

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};
const it = (std, ref, short, text, rev = false) => ({ std: String(std), ref, short, text, rev, src: `NFTC ${std} ${ref}` });

/** 피난기구 적응성(NFTC 301 표 2.1.1) — 구조대·완강기로만 구분, 둘 다 안 되면 다른 기구 표시 */
const ESC = {
  noyu: { 1: ["구조대"], 2: ["구조대"], 3: ["구조대"], 4: { none: "피난교·다수인피난장비·승강식 피난기구(구조대는 장애인 관련 시설로서 스스로 피난이 불가한 사용자가 있어 2.1.2.4에 따라 추가 설치하는 경우만)" } },
  medical: { 3: ["구조대"], 4: ["구조대"] },
};
function escapeLine(row, gf) {
  const bands = [];
  const top = Math.min(gf, 10);
  for (let lv = 1; lv <= top; lv++) {
    const key = lv >= 4 ? 4 : lv;
    const v = key && ESC[row][key];
    if (!v) continue;
    const txt = v.none ? v.none : v.length === 2 ? "구조대·완강기" : `${v[0]}(완강기 불가)`;
    const last = bands[bands.length - 1];
    if (last && last.txt === txt && last.to === lv - 1) last.to = lv;
    else bands.push({ from: lv, to: lv, txt });
  }
  if (!bands.length) return null;
  return bands.map((b) => `${b.from === b.to ? `${b.from}층` : `${b.from}~${b.to}층`} ${b.txt}`).join(" / ");
}

/**
 * ctx: { g(...groups), use, gf, bf, area, occ, f, ugSum, wl(무창층 있음), has(facKey) }
 * → [{ fac, items:[{ std, ref, short, text, rev, src }] }] (설치 대상 설비 순서)
 */
export function drawPoints(ctx) {
  const { g, gf, bf, area, f = {}, has } = ctx;
  const apt = g("apt"); // 아파트등(NFTC 608)
  const housing608 = g("apt", "dorm"); // NFTC 608 적용(아파트등·기숙사)
  const jointHouse = g("apt", "row", "multi", "dorm"); // 공동주택
  const wh = g("warehouse"); // NFTC 609
  const ugduct = g("ugduct"); // NFTC 605
  const inpatient = g("medical", "midwife") || (g("clinic") && !!f.inpatient);
  const out = {};
  const add = (fac, x) => {
    if (!has(fac) || !x) return;
    (out[fac] = out[fac] || []).push(x);
  };

  // ── 소화기구
  if (apt) add("ext", it(608, "2.1.1.2", "세대·공용부마다", "아파트등은 각 세대 및 공용부(승강장·복도 등)마다 설치"));
  if (wh) add("ext", it(609, "2.1.1", "배전반·분전반 자동소화장치", "창고시설 내 배전반·분전반마다 가스·분말·고체에어로졸 자동소화장치 또는 소공간용 소화용구 설치"));
  if (ugduct) add("ext", it(605, "2.1.1.3", "출입구 부근 5개 이상", "소화기는 사람이 출입할 수 있는 출입구(환기구·작업구 포함) 부근에 5개 이상"));

  // ── 옥내소화전
  if (housing608) add("hydrant", it(608, "2.2.1.1", "호스릴 방식", "호스릴(hose reel) 방식으로 설치"));
  if (wh) add("hydrant", it(609, "2.2.3", "비상전원 40분", "비상전원은 옥내소화전설비를 유효하게 40분 이상 작동할 수 있을 것"));

  // ── 스프링클러설비
  if (has("spk")) {
    if (apt) add("spk", it(608, "2.3.1.1", "헤드 기준개수 10개", "아파트등 헤드 기준개수 10개 — 각 동이 주차장으로 서로 연결되면 그 주차장 부분은 30개"));
    else if (wh) add("spk", it(609, "2.3.1.1", "라지드롭형 습식", "라지드롭형 헤드를 습식으로 설치 — 냉동창고·영하 냉장창고 등은 건식 가능"));
    else {
      let n;
      let cond = "";
      if (gf >= 11 || g("ugmall", "station")) {
        n = "30개";
        cond = gf >= 11 ? "지하층 제외 11층 이상" : "지하가·지하역사";
      } else if (g("factory")) {
        n = "20개";
        cond = "공장 — 특수가연물 저장·취급이면 30개";
      } else if (g("retail")) {
        n = "30개";
        cond = "판매시설";
      } else if (g("mixed")) {
        n = "20개";
        cond = "복합건축물 — 판매시설이 설치되면 30개";
      } else if (g("neigh", "transport")) {
        n = "20개";
        cond = "근린생활시설·운수시설";
      } else {
        n = "10개";
        cond = "헤드 부착높이 8m 이상이면 20개";
      }
      add("spk", it(103, "표 2.1.1.1", `헤드 기준개수 ${n}`, `헤드 기준개수 ${n}(${cond})`));
    }
    // 조기반응형 헤드
    // (v2.52.0 수정) 지하주차장 습식·전기차 충전구역 조기반응형은 공동주택만, 송수구 2차측 연결(2.8.1.5)은 표시 안 함
    if (jointHouse) add("spk", it(103, "2.5.15", "지하주차장 습식", "지하주차장은 습식 — 헤드 작동으로도 유수검지장치가 열리는 방식 허용(시험장치 기준 충족 시)", true));
    if (apt) add("spk", it(608, "2.3.1.6", "거실 조기반응형 헤드", "거실에는 조기반응형 스프링클러헤드"));
    else {
      const places = [];
      if (jointHouse || g("noyu")) places.push(`${jointHouse ? "공동주택" : "노유자시설"} 거실`);
      if (g("officetel", "lodging")) places.push(`${g("officetel") ? "오피스텔" : "숙박시설"} 침실`);
      if (inpatient) places.push("병원·의원 입원실");
      if (places.length) add("spk", it(103, "2.7.5", `조기반응형 헤드(${places.join("·")})`, `조기반응형 헤드: ${places.join("·")}`));
    }
    if (jointHouse) add("spk", it(103, "2.7.5(4)", "조기반응형 헤드(전기차 충전구역)", "전기차 충전구역에는 조기반응형 헤드"));
    const ug = num(ctx.ugSum);
    if ((gf >= 7 && area >= 2000) || (ug !== null && ug >= 3000)) add("spk", it(103, "2.10.1", "감시·동력제어반 구분", `감시제어반과 동력제어반 구분 설치(${gf >= 7 && area >= 2000 ? "지하층 제외 7층 이상·연면적 2,000㎡ 이상" : "지하층 바닥면적 합계 3,000㎡ 이상"})`));
  }

  // ── 자동화재탐지설비
  if (has("afd")) {
    if (housing608) {
      add("afd", it(608, "2.7.1.1", "아날로그 감지기", "아날로그방식 감지기·광전식 공기흡입형 감지기 또는 동등 이상"));
      add("afd", it(608, "2.7.1.3", "세대 내 거실 연기감지기", "세대 내 거실(취침용 방 포함)에는 연기감지기"));
    } else {
      const sl = [];
      if (jointHouse || g("officetel", "lodging", "noyu", "training")) sl.push("공동주택·오피스텔·숙박·노유자·수련시설");
      if (g("edu_dorm")) sl.push("교육연구시설 합숙소");
      if (inpatient) sl.push("의료시설·입원실 있는 의원·조산원");
      if (g("correction")) sl.push("교정 및 군사시설");
      if (sl.length) add("afd", it(203, "2.4.2.5", "취침·숙박·입원 거실 연기감지기", `취침·숙박·입원 거실에 연기감지기(${sl.join(", ")})`));
    }
    if (gf >= (jointHouse ? 16 : 11)) add("afd", it(203, "2.5.1.2", "우선경보방식", `우선경보방식(${jointHouse ? "16" : "11"}층 이상) — 2층 이상 발화: 발화층·직상 4개 층 / 1층 발화: 발화층·직상 4개 층·지하층 / 지하층 발화: 발화층·직상층·기타 지하층`));
    if (wh) {
      add("afd", it(609, "2.5.1", "감지기 위치 수신기 표시", "감지기가 작동하면 그 위치가 수신기에 표시될 것"));
      if (has("spk")) add("afd", it(609, "2.5.3.1", "아날로그 감지기", "스프링클러를 설치하는 창고시설 감지기는 아날로그방식·광전식 공기흡입형 또는 동등 이상"));
    }
    if (ugduct) add("afd", it(605, "2.2.1.1", "발화지점·온도 확인 감지기", "먼지·습기 영향이 없고 발화지점(1m 단위)과 온도를 확인할 수 있는 감지기"));
  }
  if (ugduct) add("monitor", it(605, "2.8.1", "통합감시시설 기준", "통합감시시설은 NFTC 605 2.8.1 기준에 따라 설치(소방관서–통제실 정보통신망 등)"));

  // ── 피난기구
  // (v2.52.0 수정) 완강기 적응성이 없는 노유자시설·의료시설만 적응성 표시, 숙박시설은 객실마다 완강기, 나머지는 표시 안 함
  if (has("escape")) {
    const row = g("noyu") ? "noyu" : inpatient ? "medical" : null;
    const line = row && escapeLine(row, gf);
    if (line) add("escape", it(301, "표 2.1.1", line, `적응성 ${line}`));
    if (g("lodging")) add("escape", it(301, "2.1.2.2", "객실마다 완강기·간이완강기", "숙박시설(휴양콘도미니엄 제외)은 객실마다 완강기 1개 또는 객실 수용인원 수 이상 간이완강기 추가"));
  }

  // ── 인명구조기구
  if (has("rescue")) {
    const fl = gf + bf;
    if (g("hotel") && fl >= 7) add("rescue", it(302, "표 2.1.1.1 제1호", "방열복·공기호흡기·인공소생기 각 2개", "지하층 포함 7층 이상 관광호텔: 방열복(방화복)·공기호흡기·인공소생기 각 2개 이상"));
    if (g("medical") && fl >= 5) add("rescue", it(302, "표 2.1.1.1 제1호", "방열복·공기호흡기 각 2개", "지하층 포함 5층 이상 병원: 방열복(방화복)·공기호흡기 각 2개 이상(인공소생기 제외)"));
    const air = [];
    if (g("cinema")) air.push("수용인원 100명 이상 영화상영관");
    if (g("bigstore")) air.push("대규모점포");
    if (g("station")) air.push("지하역사");
    if (g("ugmall")) air.push("지하상가");
    if (air.length) add("rescue", it(302, "표 2.1.1.1 제2~5호", "공기호흡기 층마다 2개", `${air.join("·")}: 공기호흡기 층마다 2개 이상(일부는 인근 사무실 비치 가능)`));
    if (f.co2) add("rescue", it(302, "표 2.1.1.1 제6호", "CO₂ 출입구 공기호흡기", "이산화탄소소화설비 설치 장소 출입구 외부 인근에 공기호흡기 1대 이상"));
  }

  // ── 유도등·유도표지
  if (has("guide")) {
    if (apt) {
      add("guide", it(608, "2.10.1.1", "중형 피난구유도등", "중형 피난구유도등(세대 내 생략 가능)"));
      add("guide", it(608, "2.10.1.3", "옥상 출입문 대형", "비상문자동개폐장치가 설치된 옥상 출입문에는 대형 피난구유도등"));
    } else if (wh) add("guide", it(609, "2.6.1", "피난구·거실통로 대형", "피난구유도등과 거실통로유도등은 대형"));
    else {
      let no;
      let kind;
      if ((g("culture") && !g("zoo")) || g("sports") || g("dance")) [no, kind] = [g("dance") ? 2 : 1, "대형피난구유도등·통로유도등·객석유도등"];
      else if (g("entertain", "retail", "transport", "hotel", "medical", "funeral", "broadcast", "ugmall", "station")) [no, kind] = [3, "대형피난구유도등·통로유도등"];
      else if (g("lodging", "officetel")) [no, kind] = [4, "중형피난구유도등·통로유도등"];
      else if (bf > 0 || ctx.wl || gf >= 11) [no, kind] = [5, `중형피난구유도등·통로유도등(${gf >= 11 ? "11층 이상" : bf > 0 ? "지하층 있음" : "무창층 있음"})`];
      // 소형(제6호)·유도표지(제7호) 대상은 표시 안 함(v2.52.0 수정)
      if (no) add("guide", it(303, `표 2.1.1 제${no}호`, kind.replace(/\(.*\)$/, "").replace("·객석유도등", ""), kind));
    }
  }

  // ── 객석유도등 — 설치 대상(소방시설법 시행령 별표4 제3호다목2), 2026.9.29. 개정본에서 표시) → 「유도등」 줄에 함께(v2.52.2)
  if (has("seatguide")) {
    const t = g("dance") ? "유흥주점영업시설(무대가 있는 카바레·나이트클럽 등)" : g("culture") ? "문화 및 집회시설" : g("religion") ? "종교시설" : g("sports") ? "운동시설" : "";
    if (t) (out.guide = out.guide || []).push({ std: "영4", ref: "제3호다목2)", short: "객석유도등", text: `${t} — 객석유도등 설치 대상(대상: 유흥주점영업시설·문화 및 집회시설·종교시설·운동시설)`, rev: false, src: "소방시설법 시행령 별표4 제3호다목2)" });
  }

  // ── 비상조명등
  if (apt) add("elight", it(608, "2.11.1", "세대 내 통로 1개", "공동주택 세대 내에는 출입구 인근 통로에 1개 이상"));

  // ── 휴대용비상조명등
  if (has("plight")) {
    if (g("lodging") || f.multiUse) add("plight", it(304, "2.1.2.1.1", "객실·영업장 실마다 1개", "숙박시설·다중이용업소: 객실(영업장 구획된 실)마다 1개 이상"));
    if (g("bigstore", "cinema")) add("plight", it(304, "2.1.2.1.2", "50m마다 3개", "대규모점포(지하상가·지하역사 제외)·영화상영관: 보행거리 50m 이내마다 3개 이상"));
    if (g("ugmall", "station")) add("plight", it(304, "2.1.2.1.3", "25m마다 3개", "지하상가·지하역사: 보행거리 25m 이내마다 3개 이상"));
  }

  return Object.entries(out).map(([fac, items]) => ({ fac, items: [...items.filter((x) => x.rev), ...items.filter((x) => !x.rev)] }));
}

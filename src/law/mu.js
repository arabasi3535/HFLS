// ============================================================
// 다중이용업소 안전시설등 세부점검표 — 다중이용업소법 시행규칙 [별지 제10호서식] <개정 2023.8.1.>
//  · 점검: 법 제13조(정기점검·점검결과서 1년 보관), 시행규칙 제13조(별지 제10호서식 사용)
//  · 점검자·주기: 시행규칙 제14조 — 매 분기 1회 이상(자체점검을 한 분기는 생략 가능)
//  · 해당 여부: 시행령 [별표 1의2] 안전시설등, 시행규칙 [별표 2의2] 피난안내도·영상물 <개정 2019.4.22.>
// ============================================================

/**
 * 다중이용업 — 시행령 제2조(제1호~제7호의5), 시행규칙 제2조(제8호 위임 영업)
 *  rooms: 구획된 실 있음(기본값), av: 노래반주기 등 영상음향장치 사용(기본값)
 *  film: 피난안내 영상물 상영 대상 — "all"(업종 전부), "fac"(상영 시설이 있는 경우만), 없으면 비대상
 *  sp: 간이스프링클러 업종 요건 — "lodge"(산후조리업·고시원업: 지상 1층·지상과 직접 맞닿은 층 제외), "all"(권총사격장)
 */
export const MU_TYPES = [
  { id: "light", name: "휴게음식점영업", rooms: false, av: false },
  { id: "bakery", name: "제과점영업", rooms: false, av: false },
  { id: "rest", name: "일반음식점영업", rooms: false, av: false },
  { id: "danran", name: "단란주점영업", rooms: true, av: true, film: "fac" },
  { id: "yuheung", name: "유흥주점영업", rooms: true, av: true, film: "fac" },
  { id: "cinema", name: "영화상영관", rooms: true, av: true, film: "all" },
  { id: "vroom", name: "비디오물감상실업", rooms: true, av: true },
  { id: "vtheater", name: "비디오물소극장업", rooms: true, av: true, film: "all" },
  { id: "mvideo", name: "복합영상물제공업", rooms: true, av: true },
  { id: "academy", name: "학원", rooms: true, av: false },
  { id: "bath", name: "목욕장업", rooms: true, av: false },
  { id: "game", name: "게임제공업", rooms: false, av: false },
  { id: "pc", name: "인터넷컴퓨터게임시설제공업", rooms: false, av: false },
  { id: "mgame", name: "복합유통게임제공업", rooms: true, av: true },
  { id: "karaoke", name: "노래연습장업", rooms: true, av: true, film: "all" },
  { id: "postnatal", name: "산후조리업", rooms: true, av: false, sp: "lodge" },
  { id: "gosiwon", name: "고시원업", rooms: true, av: false, sp: "lodge", window: true },
  { id: "gun", name: "권총사격장", rooms: false, av: false, sp: "all" },
  { id: "golf", name: "가상체험 체육시설업(실내 골프연습장)", rooms: true, av: false },
  { id: "massage", name: "안마시술소", rooms: true, av: false },
  { id: "phone", name: "전화방업·화상대화방업", rooms: true, av: false, film: "fac" },
  { id: "sleep", name: "수면방업", rooms: true, av: false, film: "fac" },
  { id: "colatec", name: "콜라텍업", rooms: false, av: true, film: "fac" },
  { id: "escape", name: "방탈출카페업", rooms: true, av: false, film: "fac" },
  { id: "kids", name: "키즈카페업", rooms: false, av: false, film: "fac" },
  { id: "manga", name: "만화카페업", rooms: false, av: false, film: "fac" },
];
export const muType = (id) => MU_TYPES.find((t) => t.id === id) || null;

/** 영업장 위치 */
export const MU_FLOORS = [
  ["ground", "지상 1층·지상과 직접 맞닿은 층"],
  ["upper", "지상 2층 이상"],
  ["under", "지하층"],
];

/** 점검사항(서식 그대로) — [제목, [세부…]] */
export const MU_ITEMS = [
  ["소화기 또는 자동확산소화기의 외관점검", ["구획된 실마다 설치되어 있는지 확인", "약제 응고상태 및 압력게이지 지시침 확인"]],
  ["간이스프링클러설비 작동기능점검", ["시험밸브 개방 시 펌프기동, 음향경보 확인", "헤드의 누수ㆍ변형ㆍ손상ㆍ장애 등 확인"]],
  ["경보설비 작동기능점검", ["비상벨설비의 누름스위치, 표시등, 수신기 확인", "자동화재탐지설비의 감지기, 발신기, 수신기 확인", "가스누설경보기 정상작동여부 확인"]],
  ["피난설비 작동기능점검 및 외관점검", ["유도등ㆍ유도표지 등 부착상태 및 점등상태 확인", "구획된 실마다 휴대용비상조명등 비치 여부", "화재신호 시 피난유도선 점등상태 확인", "피난기구(완강기, 피난사다리 등) 설치상태 확인"]],
  ["비상구 관리상태 확인", ["비상구 폐쇄ㆍ훼손, 주변 물건 적치 등 관리상태", "구조변형, 금속표면 부식ㆍ균열, 용접부ㆍ접합부 손상 등 확인(건축물 외벽에 발코니 형태의 비상구를 설치한 경우만 해당)"]],
  ["영업장 내부 피난통로 관리상태 확인", ["영업장 내부 피난통로 상 물건 적치 등 관리상태"]],
  ["창문(고시원) 관리상태 확인", []],
  ["영상음향차단장치 작동기능점검", ["경보설비와 연동 및 수동작동 여부 점검(화재신호 시 영상음향이 차단되는 지 확인)"]],
  ["누전차단기 작동 여부 확인", []],
  ["피난안내도 설치 위치 확인", []],
  ["피난안내영상물 상영 여부 확인", []],
  ["실내장식물ㆍ내부구획 재료 교체 여부 확인", ["커튼, 카페트 등 방염선처리제품 사용 여부", "합판ㆍ목재 방염성능 확보 여부", "내부구획재료 불연재료 사용 여부"]],
  ["방염 소파ㆍ의자 사용 여부 확인", []],
  ["안전시설등 세부점검표 분기별 작성 및 1년간 보관 여부", []],
  ["화재배상책임보험 가입여부 및 계약기간 확인", []],
];
export const MU_NUM = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮"];
export const MU_RESULTS = ["양호", "불량", "해당없음"];

/** 형태 선택 기본값(업종에서) */
export function muOpts(st) {
  const t = muType(st.type) || {};
  const o = st.opts || {};
  const pick = (k, d) => (o[k] === undefined ? d : o[k]);
  return {
    floor: pick("floor", "upper"),
    sealed: pick("sealed", false),
    rooms: pick("rooms", !!t.rooms),
    av: pick("av", !!t.av),
    exitFree: pick("exitFree", false),
    mapFree: pick("mapFree", false),
    filmFac: pick("filmFac", false),
  };
}

/**
 * 항목별 해당 여부 → { on, why }
 *  on=false면 기본 결과 「해당없음」
 */
export function muApplies(i, st) {
  const t = muType(st.type) || {};
  const o = muOpts(st);
  switch (i) {
    case 1: {
      // 간이스프링클러설비 — 별표 1의2 제1호가목2)
      if (o.floor === "under") return { on: true, why: "지하층 영업장" };
      if (o.sealed) return { on: true, why: "밀폐구조 영업장" };
      if (t.sp === "all") return { on: true, why: "권총사격장" };
      if (t.sp === "lodge" && o.floor !== "ground") return { on: true, why: `${t.name}(지상 1층·지상과 맞닿은 층 외)` };
      return { on: false, why: "지하층·밀폐구조·산후조리업·고시원업(지상 1층 등 제외)·권총사격장이 아님" };
    }
    case 4:
      return o.exitFree ? { on: false, why: "비상구 설치 제외 영업장(별표 1의2 제2호 단서)" } : { on: true, why: "" };
    case 5:
      return o.rooms ? { on: true, why: "구획된 실이 있는 영업장" } : { on: false, why: "구획된 실이 없는 영업장(별표 1의2 제3호)" };
    case 6:
      return t.window ? { on: true, why: "고시원업" } : { on: false, why: "고시원업이 아님(별표 1의2 제4호다목)" };
    case 7:
      return o.av ? { on: true, why: "영상음향장치 사용 영업장" } : { on: false, why: "노래반주기 등 영상음향장치를 사용하지 않음(별표 1의2 제4호가목)" };
    case 9:
      return o.mapFree ? { on: false, why: "피난안내도 비치 제외(33㎡ 이하 또는 구획된 실 없이 출입구·비상구가 보임 — 별표 2의2 제1호)" } : { on: true, why: "" };
    case 10: {
      if (t.film === "all") return { on: true, why: `${t.name} — 상영 대상(별표 2의2 제2호)` };
      if (t.film === "fac" && o.filmFac) return { on: true, why: "영상물 상영 시설이 있는 영업장(별표 2의2 제2호)" };
      return { on: false, why: t.film === "fac" ? "영상물 상영 시설이 없음(별표 2의2 제2호)" : "피난안내 영상물 상영 대상 업종이 아님(별표 2의2 제2호)" };
    }
    default:
      return { on: true, why: "" };
  }
}

/** 결과(직접 고친 값 우선) */
export function muResults(st) {
  return MU_ITEMS.map((_, i) => (st.res && st.res[i]) || (muApplies(i, st).on ? "양호" : "해당없음"));
}

/** 점검 분기 */
export const quarterOf = (d) => {
  const m = /^(\d{4})-(\d{2})/.exec(d || "");
  return m ? `${m[1]}년 ${Math.floor((Number(m[2]) - 1) / 3) + 1}분기` : "";
};

export function emptyMu() {
  return { v: 1, type: "", opts: {}, hdr: { name: "", tel: "", addr: "", use: "", structure: "", ceo: "", manager: "", date: "", checker: "", qual: "" }, res: {}, act: {} };
}

/** 점검자 자격 — 시행규칙 제14조제2호 */
export const MU_QUALS = ["다중이용업주", "소방안전관리자", "종업원(소방안전관리자 자격 취득)", "종업원(소방시설관리사)", "종업원(소방기술사·소방설비(산업)기사)", "소방시설관리업자"];

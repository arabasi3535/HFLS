// ============================================================
// 소급·특례 규정
//  1) 부칙 경과조치에 따른 기존 대상물 의무 설치(기한부, 의무)
//  2) 법 제13조제1항 단서 — 강화된 기준 적용(소방본부장·소방서장 재량)
//  3) 법 제10조 — 주택용소방시설
//  4) 시행령 제15조 — 증축·용도변경 특례
// ============================================================
import { D } from "./sources";
import { isNoyuRes } from "./uses";

/**
 * 1) 부칙 소급(기존 대상물 의무)
 *  대상: 각 부칙 시행 당시 이미 건축이 완료(설치)된 대상물 — 사용승인일(설치완료일) 입력 시 그 날짜로 판정,
 *  미입력 시 건축허가등 신청일이 시행일 전인 경우를 후보로 표시하고 '완공일 확인 필요' 안내
 */
export const RETRO_RULES = [
  {
    id: "retro-noyu2012",
    title: "2012.2.5. 당시 기존 노유자 생활시설 — 간이스프링클러·자동화재탐지설비·자동화재속보설비 설치 의무",
    when: "2012.2.5. 시행 당시 사용 중인(건축 완료된) 시설",
    // 현행 정의상 노유자 생활시설(2012.2.5. 전 신청분은 당시 '노유자시설'이었으나 부칙으로 소급)
    applies: (u, input) => isNoyuRes(u, (input && input.f) || {}, "9999-12-31"),
    before: D.B12,
    facs: ["sspk", "afd", "report"],
    deadline: "2014-02-04",
    deadlineNote: "시행 후 2년 이내 (기한 일자는 부칙 원문 대조 필요)",
    basis: "시행령(대통령령 제23272호, 2012.2.5. 시행) 부칙 제5조",
    cert: "V",
    src: "incheon2012,reasons",
  },
  {
    id: "retro-nursing2015",
    title: "2015.7.1. 당시 건축 완료된 요양병원 — 스프링클러설비·간이스프링클러설비·자동화재탐지설비·자동화재속보설비",
    when: "2015.7.1. 시행 당시 이미 건축이 완료된 요양병원(정신병원·의료재활시설 제외)",
    applies: (u) => u.g.includes("nursing"),
    before: D.B15b,
    facs: ["spk", "sspk", "afd", "report"],
    deadline: "2018-06-30",
    deadlineNote: "개정규정(별표5 제1호 라목·마목, 제2호 라목·마목)에 따라 설치 — 바닥면적 600㎡ 이상 스프링클러, 미만 간이스프링클러",
    basis: "시행령(대통령령 제26370호, 2015.6.30. 개정·2015.7.1. 시행) 부칙 제3조",
    cert: "M",
    src: "hist24",
  },
  {
    id: "retro-hosp2019",
    title: "2019.8.6. 당시 건축 완료된 종합병원·병원·치과병원·한방병원 — 스프링클러설비·간이스프링클러설비·자동화재속보설비",
    when: "2019.8.6. 당시 건축 완료된 시설",
    applies: (u) => u.g.includes("hosp"),
    before: D.B19,
    facs: ["spk", "sspk", "report"],
    deadline: "2026-12-31",
    deadlineNote: "스프링클러설비 대신 간이스프링클러설비 설치 가능(부칙 제8조②). 당초 2022.8.31.에서 연장(대통령령 제32893호)",
    basis: "소방시설법 시행령(대통령령 제33004호) 부칙 제8조제1항·제2항",
    cert: "V",
    src: "curDecree,reasons",
  },
  {
    id: "retro-duct2020",
    title: "2020.12.10. 전 설치된 공동구 — 소화기구·유도등",
    when: "2020.12.10. 전에 설치된 공동구",
    applies: (u) => u.g.includes("commonduct"),
    before: D.S2,
    facs: ["ext", "guide"],
    deadline: "2022-12-09",
    deadlineNote: "",
    basis: "소방시설법 시행령(대통령령 제33004호) 부칙 제8조제3항",
    cert: "V",
    src: "curDecree",
  },
];

/**
 * 2) 법 제13조제1항 단서 — 강화된 기준을 기존 대상물에 '적용할 수 있는' 시설
 * (현행 법률 제18522호 및 시행령 제13조. 재량 규정임)
 */
export const STRENGTHENED = {
  common: ["ext", "alarm", "afd", "report", "escape", "rescue", "guide", "seatguide", "elight", "plight"],
  noyu: ["sspk", "afd", "single"],
  medical: ["spk", "sspk", "afd", "report"],
  duct: ["ext", "autoext", "afd", "monitor", "guide", "spread"],
  basis:
    "소방시설법 제13조제1항 단서(소화기구·비상경보설비·자동화재탐지설비·자동화재속보설비·피난구조설비 / 공동구·전력통신 지하구·노유자시설·의료시설 중 시행령 제13조로 정하는 것) — '적용할 수 있다'(재량)",
};

export function strengthenedFacs(u) {
  const s = new Set(STRENGTHENED.common);
  if (u.g.includes("noyu")) STRENGTHENED.noyu.forEach((k) => s.add(k));
  if (u.g.includes("medical")) STRENGTHENED.medical.forEach((k) => s.add(k));
  if (u.g.includes("ugduct")) STRENGTHENED.duct.forEach((k) => s.add(k));
  return s;
}

/** 3) 주택용소방시설 */
export function housingFacilityNote(u, date) {
  const isHouse = u.g.includes("house");
  const isRowMultiPre = (u.g.includes("row") || u.g.includes("multi")) && date < D.C24;
  if (!isHouse && !isRowMultiPre) return null;
  return {
    title: "주택용소방시설 (소화기 및 단독경보형 감지기)",
    basis:
      "소방시설법 제10조·시행령 제10조 (구 화재예방소방시설법 제8조, 2012.2.5. 시행). 단독주택과 공동주택(아파트 및 기숙사 제외)의 소유자 설치 의무. 설치기준은 시·도 조례.",
    retro:
      date < D.B12
        ? "기존 주택: 법 시행(2012.2.5.) 후 5년 유예 → 2017.2.4.까지 설치 의무 (유예기한 일자는 법률 부칙 원문 대조 필요)"
        : "신축 시점부터 설치 의무",
    note: isRowMultiPre
      ? "연립·다세대주택은 2024.12.1. 이후 신청분부터 별표2 공동주택(특정소방대상물)에 편입되어 별표4 기준이 적용됨(대통령령 제33004호 부칙). 그 전 신청분은 특정소방대상물이 아니므로 주택용소방시설 대상으로 검토(내부 차고·주차장의 물분무등은 별도 확인)."
      : "",
    cert: "V",
  };
}

/** 4) 증축·용도변경 특례 (시행령 제15조) */
export function extensionRule(input) {
  const { action } = input;
  if (action === "extension") {
    const ex = input.extExceptions || {};
    const separated = ex.fireproof || ex.shutter || ex.door60plus || ex.door60 || ex.restroom33 || ex.canopy;
    const notes = [];
    if (ex.door60 || ex.door60plus) {
      if (input.date2 >= D.C) {
        notes.push(
          "방화문 구획: 현행 시행령 제15조제1항제2호나목 「60분+ 방화문 또는 60분 방화문」(2025.11.25. 개정·2025.12.1. 시행). " +
            (ex.door60 && !ex.door60plus
              ? "60분 방화문은 2022.12.1.~2025.11.30. 조문에는 없었으나, 부칙(대통령령 제35860호) 제3조에 따라 2022.12.1. 이후 증축 허가등 신청분에도 소급 적용됨."
              : "")
        );
      } else {
        notes.push(
          "방화문 구획: 2022.12.1. 전 증축 신청분은 구 화재예방소방시설법 시행령 제17조제1항 단서(갑종방화문, 자동방화셔터 포함) 기준. " +
            "60분+·60분 방화문은 건축법 시행령 개정(2021.8.7. 시행)으로 종전 갑종방화문을 대체한 등급이므로 구획 인정으로 판정하되, 당시 조문 문구·건축법 시행령 부칙은 [확인 필요]."
        );
      }
    }
    return {
      title: "증축 — 시행령 제15조제1항",
      principle: "기존 부분을 포함한 특정소방대상물 전체에 증축 당시의 대통령령·화재안전기준 적용",
      result: separated
        ? "예외 해당 → 기존 부분은 종전 기준 유지, 증축 부분만 증축 당시 기준 적용"
        : "예외 미해당 → 전체(기존 부분 포함)에 증축 당시 기준 적용",
      wholeDate: separated ? null : input.date2,
      partDates: separated ? { existing: input.date, added: input.date2 } : null,
      basis:
        "시행령 제15조제1항 단서 각 호: 1. 내화구조 바닥·벽 구획 2. 자동방화셔터 또는 60분+ 방화문·60분 방화문 구획(2025.12.1. 시행, 부칙 제3조로 2022.12.1. 이후 신청분 소급) 3. 화재위험 낮은 대상물 내 33㎡ 이하 직원휴게실 4. 캐노피(3면 이상 벽 없음)",
      notes,
    };
  }
  if (action === "usechange") {
    const reduce = !!input.useChangeReduce;
    return {
      title: "용도변경 — 시행령 제15조제2항",
      principle: "용도변경되는 부분에 대해서만 용도변경 당시의 대통령령·화재안전기준 적용",
      result: reduce
        ? "예외 해당(화재연소 확대요인 감소·피난/진압 용이, 또는 고정 가연물 감소) → 대상물 전체에 용도변경 전 적용 기준 적용"
        : "용도변경 부분: 변경 당시 기준 / 나머지 부분: 종전 기준",
      wholeDate: reduce ? input.date : null,
      partDates: reduce ? null : { existing: input.date, added: input.date2 },
      basis:
        "시행령 제15조제2항. 기존 부분은 '변경 전 용도'로, 변경 부분은 '변경 후 용도·변경 면적'으로 각각 판정. ※ 6층 이상 스프링클러는 별표4 제1호라목1) 단서(스프링클러 없는 기존 대상물 용도변경 시 일부 용도 제외)를 함께 검토",
      notes: [],
    };
  }
  return null;
}

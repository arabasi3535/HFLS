// ============================================================
// 소방시설 목록 (현행 시행령 별표4 순서) + 화재안전기준 번호
// cur: 현행 별표4 호·목
// ============================================================

export const CATS = ["소화설비", "경보설비", "피난구조설비", "소화용수설비", "소화활동설비"];

export const FACILITIES = [
  { key: "ext", name: "소화기구", cat: "소화설비", cur: "제1호가목", std: "101" },
  { key: "autoext", name: "자동소화장치", cat: "소화설비", cur: "제1호나목", std: "101" },
  { key: "hydrant", name: "옥내소화전설비", cat: "소화설비", cur: "제1호다목", std: "102" },
  { key: "spk", name: "스프링클러설비", cat: "소화설비", cur: "제1호라목", std: "103" },
  { key: "sspk", name: "간이스프링클러설비", cat: "소화설비", cur: "제1호마목", std: "103A" },
  { key: "water", name: "물분무등소화설비", cat: "소화설비", cur: "제1호바목", std: "104 등" },
  { key: "outhyd", name: "옥외소화전설비", cat: "소화설비", cur: "제1호사목", std: "109" },

  { key: "single", name: "단독경보형 감지기", cat: "경보설비", cur: "제2호가목", std: "201" },
  { key: "alarm", name: "비상경보설비", cat: "경보설비", cur: "제2호나목", std: "201" },
  { key: "afd", name: "자동화재탐지설비", cat: "경보설비", cur: "제2호다목", std: "203" },
  { key: "visual", name: "시각경보기", cat: "경보설비", cur: "제2호라목", std: "203" },
  { key: "notify", name: "화재알림설비", cat: "경보설비", cur: "제2호마목", std: "207" },
  { key: "pa", name: "비상방송설비", cat: "경보설비", cur: "제2호바목", std: "202" },
  { key: "report", name: "자동화재속보설비", cat: "경보설비", cur: "제2호사목", std: "204" },
  { key: "monitor", name: "통합감시시설", cat: "경보설비", cur: "제2호아목", std: "605" },
  { key: "leak", name: "누전경보기", cat: "경보설비", cur: "제2호자목", std: "205" },
  { key: "gasleak", name: "가스누설경보기", cat: "경보설비", cur: "제2호차목", std: "206" },

  { key: "escape", name: "피난기구", cat: "피난구조설비", cur: "제3호가목", std: "301" },
  { key: "rescue", name: "인명구조기구", cat: "피난구조설비", cur: "제3호나목", std: "302" },
  { key: "guide", name: "유도등(피난구·통로) 및 유도표지", cat: "피난구조설비", cur: "제3호다목1)", std: "303" },
  { key: "seatguide", name: "객석유도등", cat: "피난구조설비", cur: "제3호다목2)", std: "303" },
  { key: "elight", name: "비상조명등", cat: "피난구조설비", cur: "제3호라목", std: "304" },
  { key: "plight", name: "휴대용비상조명등", cat: "피난구조설비", cur: "제3호마목", std: "304" },

  { key: "waterSupply", name: "상수도소화용수설비", cat: "소화용수설비", cur: "제4호", std: "401" },

  { key: "smoke", name: "제연설비", cat: "소화활동설비", cur: "제5호가목", std: "501" },
  { key: "standpipe", name: "연결송수관설비", cat: "소화활동설비", cur: "제5호나목", std: "502" },
  { key: "conspk", name: "연결살수설비", cat: "소화활동설비", cur: "제5호다목", std: "503" },
  { key: "outlet", name: "비상콘센트설비", cat: "소화활동설비", cur: "제5호라목", std: "504" },
  { key: "radio", name: "무선통신보조설비", cat: "소화활동설비", cur: "제5호마목", std: "505" },
  { key: "spread", name: "연소방지설비", cat: "소화활동설비", cur: "제5호바목", std: "605" },
];

export function getFacility(key) {
  return FACILITIES.find((f) => f.key === key);
}

/** 판정일 기준 화재안전기준 명칭 */
export function stdLabel(fac, date) {
  if (date >= "2022-12-01") return `NFPC·NFTC ${fac.std}`;
  if (date >= "2004-05-30") return `NFSC ${fac.std}`;
  return "소방기술기준에 관한 규칙";
}

/**
 * 별표4 「설치 면제」(별표5) 검토 안내 — 자동 제외하지 않고 비고에만 표시
 * ※ 세부 요건은 현행 시행령 별표5 원문으로 확인 필요
 */
export const EXEMPTION_HINTS = {
  sspk: { by: ["spk", "water"], text: "스프링클러설비 또는 물분무소화설비·미분무소화설비 설치 시 그 유효범위 면제 검토(별표5)" },
  water: { by: ["spk"], text: "스프링클러설비 설치 시 그 유효범위 면제 검토(별표5, 차고·주차장 조건 확인)" },
  alarm: { by: ["afd", "notify", "single"], text: "자동화재탐지설비·화재알림설비 또는 단독경보형감지기 설치 시 면제 검토(별표5)" },
  single: { by: ["afd", "notify"], text: "자동화재탐지설비·화재알림설비 설치 시 그 유효범위 면제 검토(별표5)" },
  pa: { by: ["afd", "alarm"], text: "자동화재탐지설비 또는 비상경보설비와 같은 수준 이상의 음향장치 설치 시 면제 검토(별표5)" },
  report: { by: ["notify"], text: "화재알림설비 설치 시 면제 검토(별표5)" },
  afd: { by: ["notify"], text: "화재알림설비 설치 시 면제 검토(별표5) — 감지기 기능 있는 스프링클러·물분무 설치 시 유효범위 면제 여부도 확인" },
  standpipe: { by: ["hydrant", "spk", "sspk", "conspk"], text: "옥외에 연결송수구, 옥내에 방수구가 부설된 옥내소화전·스프링클러·간이스프링클러·연결살수설비 설치 시 면제 검토(별표5)" },
  conspk: { by: ["spk", "sspk", "water"], text: "송수구를 부설한 스프링클러·간이스프링클러·물분무등 설치 시 면제 검토(별표5)" },
  elight: { by: ["guide"], text: "피난구유도등 또는 통로유도등을 화재안전기준에 적합하게 설치 시 그 유효범위 면제 검토(별표5)" },
  hydrant: { by: [], text: "호스릴 방식 허용 대상·면제 기준 확인(별표5·NFTC 102)" },
  outhyd: { by: ["waterSupply"], text: "보물·국보 목조건축물에 상수도소화용수설비 설치 시 면제 검토(별표5)" },
};

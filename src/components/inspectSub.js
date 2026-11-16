// 점검 탭 하위 탭 목록·기억값 — App(첫 화면)과 InspectTab(지연 로딩)이 함께 쓰는 작은 모듈
export const INSP_SUBS = [
  ["self", "자체점검 보고서"],
  ["wm", "위험물 정기점검"],
  ["mu", "다중이용업 세부점검"],
];
export const INSP_KEY = "hfls_insp_sub";
export function loadInspSub() {
  try {
    const v = localStorage.getItem(INSP_KEY);
    return INSP_SUBS.some((s) => s[0] === v) ? v : INSP_SUBS[0][0];
  } catch (e) {
    return INSP_SUBS[0][0];
  }
}

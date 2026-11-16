// 해설서·매뉴얼, 관련 사이트 링크 목록 — 사용자가 준 주소와 같은지, 빠짐·중복 없는지
import { GUIDE_GROUPS, SITE_GROUPS } from "./refLinks";

const N = "https://www.nfa.go.kr/nfa/publicrelations/legalinformation/archives/?boardId=bbs_0000000000000018&mode=view";
const GIVEN = {
  "2026년 소방시설법령 해설서": `${N}&cntId=64&category=&pageIdx=&searchCondition=&searchKeyword=`,
  "2026년 소방시설법령 질의회신집": `${N}&cntId=63&category=&pageIdx=&searchCondition=&searchKeyword=`,
  "2025년 소방시설법령 질의회신집": `${N}&cntId=62&category=&pageIdx=&searchCondition=&searchKeyword=`,
  "2024년 소방시설법령 질의회신집": `${N}&cntId=61&category=&pageIdx=&searchCondition=&searchKeyword=`,
  "2021년 소방시설법령 질의회신집": `${N}&cntId=43&category=&pageIdx=2&searchCondition=all&searchKeyword=`,
  "2025년 성능위주설계 평가 운영 표준 가이드라인": `${N}&cntId=58&category=&pageIdx=&searchCondition=&searchKeyword=`,
  "소방시설등 점검관리 매뉴얼": `${N}&cntId=57&category=&pageIdx=&searchCondition=&searchKeyword=`,
  "2024년 화재안전기술기준 해설서": `${N}&cntId=56&category=&pageIdx=&searchCondition=&searchKeyword=`,
  "건축위원회(심의) 표준 가이드라인": `${N}&cntId=49&category=&pageIdx=2&searchCondition=all&searchKeyword=`,
  "건축허가 등의 동의 업무처리 표준 매뉴얼": `${N}&cntId=48&category=&pageIdx=2&searchCondition=all&searchKeyword=`,
  "소방시설의 내진설계 기준 해설서": `${N}&cntId=42&category=&pageIdx=2&searchCondition=all&searchKeyword=`,
  "위험물실무해설서 제20판 (1~4권)": "https://www.bigdata-119.kr/safetyinfo/policyView?safety_info_id=198",
};

test("해설서·매뉴얼 12건 — 사용자가 준 주소 그대로", () => {
  const all = GUIDE_GROUPS.flatMap((g) => g.items);
  expect(all).toHaveLength(12);
  expect(Object.fromEntries(all.map((x) => [x.t, x.url]))).toEqual(GIVEN);
});

test("관련 사이트 8곳 — 주소·운영기관·설명, 중복 없음", () => {
  const all = SITE_GROUPS.flatMap((g) => g.items);
  expect(all.map((x) => x.url).sort()).toEqual(
    [
      "http://fesa.ekffa.or.kr/fe/login/NR_index.do",
      "http://fdept.ekffa.or.kr/login.do",
      "https://hazmat.nfa.go.kr/",
      "https://kasem.safekorea.go.kr/",
      "https://nftc.nfire.go.kr/kor/",
      "https://bigdata-119.kr/",
      "https://www.nfds.go.kr/",
      "https://safeland.go.kr/",
    ].sort()
  );
  for (const x of all) expect(x.org && x.d && x.t).toBeTruthy();
});

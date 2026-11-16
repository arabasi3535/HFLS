// 화재안전기준 연혁(api/lawat.js ?std=…, api/_fsc.js) — 법제처 행정규칙 응답을 흉내 낸 가짜 서버
let api;
// [행정규칙명, 일련번호, 행정규칙ID, 시행일자, 발령일자, 발령번호, 종류, 소관부처]
const A = [
  ["스프링클러설비의화재안전기준(NFSC 103)", "11", "35312", "20040604", "20040604", "2004-8", "고시", "소방방재청"],
  ["스프링클러설비의 화재안전기준(NFSC 103)", "12", "35312", "20091022", "20091022", "2009-39", "고시", "소방방재청"],
  ["스프링클러설비의 화재안전성능기준(NFPC 103)", "13", "35312", "20221201", "20221125", "2022-50", "고시", "소방청"],
  ["스프링클러설비의 화재안전기술기준(NFTC 103)", "21", "83616", "20221201", "20221201", "2022-210", "공고", "국립소방연구원"],
  ["스프링클러설비의 화재안전기술기준(NFTC 103)", "22", "83616", "20260701", "20260629", "2026-35", "공고", "국립소방연구원"],
  ["간이스프링클러설비의 화재안전기준(NFSC 103A)", "31", "31177", "20040604", "20040604", "2004-9", "고시", "소방방재청"],
  ["연소방지설비의화재안전기준(NFSC 506)", "41", "33682", "20040604", "20040604", "2004-30", "고시", "소방방재청"],
  ["지하구의 화재안전기준(NFSC 605)", "42", "33682", "20210115", "20210115", "2021-1", "고시", "소방청"],
  ["화재알림설비의 화재안전성능기준(NFPC 207)", "51", "87245", "20231207", "20231207", "2023-48", "고시", "소방청"],
  ["소방시설 자체점검사항 등에 관한 고시", "61", "999", "20221201", "20221201", "2022-1", "고시", "소방청"],
];
const NFTC =
  '1. 일반사항1.1 적용범위1.1.1 이 기준은 영 별표 4 제1호라목에 따른 스프링클러설비에 적용한다.1.2 기준의 효력1.2.1 이 기준은 효력을 가진다.1.2.2 이 기준에 적합한 경우에는 충족하는 것으로 본다.1.3 기준의 시행1.3.1 이 기준은 2026년 7월 1일부터 시행한다.2. 기술기준2.1 수원2.1.1 수원은 다음과 같다.(1) 폐쇄형(2) 개방형2.1.2 2.1.1에 따른 수원 외에 2.1 및 2.2 기준을 따른다.2.2 가압송수장치2.2.1 펌프는 전용으로 한다.';
const BODY = {
  12: {
    조문내용: [
      "제1조(목적) 이 기준은 스프링클러설비에 필요한 사항을 규정함을 목적으로 한다.",
      '제3조(정의) 이 기준에서 사용하는 용어의 정의는 다음과 같다.1. "고가수조"라 함은 자연낙차 압력으로 급수하는 수조를 말한다.2. "압력수조"라 함은 가압하는 수조를 말한다.',
      "제10조의2(헤드) ① 첫째로 한다.② 둘째로 한다.",
    ],
    별표: { 별표단위: { 별표번호: "0001", 별표가지번호: "00", 별표구분: "별표", 별표제목: "스프링클러헤드 수별 급수관의 구경", 별표내용: [["[별표 1]", "급수관의 구경 25 32 40"]], 별표서식파일링크: "/LSW/flDownload.do?flSeq=5227500&OC=secret" } },
    첨부파일: { 첨부파일링크: "http://law.go.kr/flDownload.do?flSeq=1809584&OC=secret", 첨부파일명: "개정고시.hwp" },
    부칙: { 부칙내용: "부칙 <제2009-39호,2009. 10. 22.>(시행일) 이 기준은 고시한 날부터 시행한다." },
  },
  13: { 조문내용: "제1조(목적) 이 기준은 성능기준을 정한다.제2조(적용범위) 이 기준은 스프링클러설비에 적용한다.제3조(정의) 용어의 뜻은 다음과 같다." },
  21: { 조문내용: NFTC.replace("2026년 7월 1일", "2022년 12월 1일") },
  22: { 조문내용: NFTC, 첨부파일: { 첨부파일링크: ["http://law.go.kr/flDownload.do?flSeq=1&OC=secret", "http://law.go.kr/flDownload.do?flSeq=2"], 첨부파일명: ["NFTC 103.hwpx", "NFTC 103.pdf"] } },
};
const norm = (s) => s.replace(/\s/g, "");
function lawFetch(url) {
  const u = new URL(url);
  const p = Object.fromEntries(u.searchParams);
  expect(p.OC).toBe("secret");
  expect(p.target).toBe("admrul");
  let body;
  if (u.pathname.endsWith("lawSearch.do")) {
    expect([p.nw, p.sort]).toEqual(["2", "efasc"]);
    const list = A.filter((a) => norm(a[0]).includes(norm(p.query))).map((a) => ({ 행정규칙명: a[0], 행정규칙일련번호: a[1], 행정규칙ID: a[2], 시행일자: a[3], 발령일자: a[4], 발령번호: a[5], 행정규칙종류: a[6], 소관부처명: a[7], 제개정구분명: a[3] === "20040604" ? "제정" : "일부개정" }));
    body = { AdmRulSearch: { totalCnt: String(list.length), admrul: list.length === 1 ? list[0] : list } };
  } else {
    const a = A.find((x) => x[1] === p.ID);
    body = { AdmRulService: { 행정규칙기본정보: { 행정규칙명: a[0], 시행일자: a[3], 발령일자: a[4], 발령번호: a[5], 행정규칙종류: a[6], 소관부처명: a[7] }, ...(BODY[p.ID] || { 조문내용: ["제1조(목적) 목적.", "제2조(적용범위) 범위."] }) } };
  }
  return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(body)) });
}

beforeEach(() => {
  process.env.LAW_OC = "secret";
  delete process.env.KV_REST_API_URL;
  delete process.env.UPSTASH_REDIS_REST_URL;
  global.fetch = jest.fn(lawFetch);
  jest.resetModules();
  api = require("../../api/lawat.js");
});
const call = async (query) => {
  const res = { code: 200, body: "", headers: {}, status(c) { this.code = c; return this; }, send(b) { this.body = b; return this; }, setHeader(k, v) { this.headers[k] = v; } };
  await api({ method: "GET", query, headers: { "x-forwarded-for": "1.1.1.1" } }, res);
  return res;
};
const J = async (q) => JSON.parse((await call({ ...q, format: "json" })).body);

test("설비 번호 읽기 — 띄어쓰기·대소문자·NFSC/NFPC/NFTC", () => {
  const { codeOf, normCode, STDS } = api._t.fsc;
  expect(codeOf("고층건축물의 화재안전성능기준 (NFPC 604)")).toEqual({ std: "NFPC", code: "604" });
  expect(codeOf("비상방송설비의 화재안전성능기준(NFPC202)")).toEqual({ std: "NFPC", code: "202" });
  expect(codeOf("간이스프링클러설비의 화재안전기준(NFSC 103A)")).toEqual({ std: "NFSC", code: "103A" });
  expect(codeOf("소방시설 자체점검사항 등에 관한 고시")).toBe(null);
  expect(normCode("nfsc 103a")).toBe("103A");
  // 번호 순서
  const ks = STDS.map((s) => s[0]);
  expect(ks.slice(0, 5)).toEqual(["101", "102", "103", "103A", "103B"]);
  expect(ks[ks.length - 1]).toBe("609");
});

test("기준일의 판 — 옛 화재안전기준(NFSC) 조문·별표·첨부파일·부칙, 다음 판", async () => {
  const r = await J({ std: "103", date: "2010-01-01" });
  expect([r.ver.seq, r.ty, r.next.seq]).toEqual(["12", "p", "13"]);
  expect(r.toc.arts.map((a) => a.k)).toEqual(["1", "3", "10-2", "부칙"]);
  expect(r.toc.arts[2].label).toBe("제10조의2(헤드)");
  expect(r.toc.byls).toEqual([{ k: "1", title: "스프링클러헤드 수별 급수관의 구경", hasText: true }]);
  expect(r.toc.files).toEqual([{ name: "개정고시.hwp", url: "https://law.go.kr/flDownload.do?flSeq=1809584" }]);
  expect(r.link).toBe("https://www.law.go.kr/admRulLsInfoP.do?admRulSeq=12");
  const a = await J({ std: "103", date: "2010-01-01", jo: "제3조" });
  expect(a.art.text).toContain('다음과 같다.\n1. "고가수조"');
  expect(a.art.text).toContain('말한다.\n2. "압력수조"');
  expect((await J({ std: "103", date: "2010-01-01", jo: "10-2" })).art.text).toBe("제10조의2(헤드)\n① 첫째로 한다.\n② 둘째로 한다.");
  const b = await call({ std: "103", date: "2010-01-01", byl: "1" });
  expect(b.body).toContain("[별표 1]\n급수관의 구경 25 32 40");
  expect(b.body).toContain("HWP: https://www.law.go.kr/LSW/flDownload.do?flSeq=5227500");
  expect(b.body).toContain("스프링클러설비의 화재안전기준(NFSC 103) [소방방재청고시 제2009-39호, 2009-10-22 발령, 2009-10-22 시행");
  expect(b.body).toContain("2009-10-22 ~ 2022-12-01 전날");
  for (const x of [r, a, b.body]) expect(JSON.stringify(x)).not.toContain("secret");
  // 하나의 긴 글로 온 조문형(NFPC)도 조문별로
  const p = await J({ std: "103", date: "2023-01-01", ty: "p" });
  expect([p.ver.seq, p.toc.arts.map((x) => x.k)]).toEqual(["13", ["1", "2", "3"]]);
  expect(p.notes.join(" ")).toContain("기술기준(NFTC, ty=t)");
});

test("2022.12.1. 이후 자동 = 기술기준(NFTC), 절 단위 목차·원문", async () => {
  const r = await J({ std: "103", date: "2023-01-01" });
  expect([r.ver.seq, r.ty, r.next.seq]).toEqual(["21", "t", "22"]);
  const n = await J({ std: "103", date: "2026-08-01" });
  expect([n.ver.seq, n.next]).toEqual(["22", null]);
  expect(n.toc.arts.map((a) => (a.head ? `#${a.label}` : a.k))).toEqual(["#1. 일반사항", "1.1", "1.2", "1.3", "#2. 기술기준", "2.1", "2.2"]);
  expect(n.toc.arts[5].label).toBe("2.1 수원");
  expect(n.toc.files.map((f) => f.name)).toEqual(["NFTC 103.hwpx", "NFTC 103.pdf"]);
  const s = await J({ std: "103", date: "2026-08-01", jo: "2.1" });
  expect(s.art.text).toBe("2.1 수원\n2.1.1 수원은 다음과 같다.\n(1) 폐쇄형\n(2) 개방형\n2.1.2 2.1.1에 따른 수원 외에 2.1 및 2.2 기준을 따른다.");
  expect((await J({ std: "103", date: "2026-08-01", jo: "1.3" })).art.text).not.toContain("2. 기술기준");
  const t = await call({ std: "103", date: "2026-08-01" });
  expect(t.body).toContain("jo=2.1  2.1 수원");
  expect(t.body).toContain("국립소방연구원공고 제2026-35호");
  expect(t.body).toContain("NFTC 103.pdf: https://law.go.kr/flDownload.do?flSeq=2");
  const q = await J({ std: "103", date: "2026-08-01", q: "펌프" });
  expect(q.hits[0].where).toBe("jo=2.2 2.2 가압송수장치");
});

test("NFTC를 골라도 2022.12.1. 전이면 NFSC로 안내 · 기준이 없던 시점 · 2004.6.4. 전", async () => {
  const r = await J({ std: "103", date: "2010-01-01", ty: "t" });
  expect([r.ver.seq, r.ty]).toEqual(["12", "p"]);
  expect(r.notes[0]).toContain("이 날짜에 아직 없음");
  const e = await call({ std: "207", date: "2020-01-01", format: "json" });
  expect(e.code).toBe(404);
  expect(JSON.parse(e.body).first).toBe("20231207");
  const old = await call({ std: "103", date: "2003-05-01", format: "json" });
  expect(old.code).toBe(404);
  expect(JSON.parse(old.body).before).toEqual({ fam: "tech", kind: "law" });
  expect((await call({ std: "999", date: "2020-01-01" })).code).toBe(400);
});

test("연소방지설비(506) → 지하구(605) 같은 계열 · 개정 연혁 · 간이스프링클러와 섞이지 않음", async () => {
  expect((await J({ std: "605", date: "2010-01-01" })).ver.seq).toBe("41");
  const u = await J({ std: "506", date: "2022-01-01" });
  expect(u.ver.seq).toBe("42");
  expect(u.notes.join(" ")).toContain("지하구");
  const l = await J({ std: "103", list: "1" });
  expect(l.versions.map((v) => v.seq)).toEqual(["11", "12", "13", "21", "22"]);
  const lt = await call({ std: "103", list: "1" });
  expect(lt.body).toContain("[t] 스프링클러설비의 화재안전기술기준(NFTC 103)");
  expect((await J({ std: "103A", date: "2010-01-01" })).ver.seq).toBe("31");
  const usage = await call({});
  expect(usage.body).toContain("std=103&date=2012-03-01");
  expect(usage.body).toContain("fam=tech&kind=law");
});

test("화면의 설비 목록 = 서버 목록(번호 순)", () => {
  const { STDS } = require("../components/lawHistStds");
  expect(STDS).toEqual(api._t.fsc.STDS);
});

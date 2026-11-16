// 연혁법 찾기 API(api/lawat.js) — 법제처 응답을 흉내 낸 가짜 서버로 판 찾기·조문·별표·연혁·OC 제거 확인
let api;
const V = [
  // [법령명, 법령일련번호, 시행일자, 공포일자, 공포번호, 법령구분명]
  ["소방법시행령", "1001", "19920728", "19920728", "13700", "대통령령"],
  ["소방법시행령", "1002", "20030701", "20030630", "18000", "대통령령"],
  ["소방법", "1101", "20030701", "20030530", "6893", "법률"],
  ["소방시설설치유지및안전관리에관한법률 시행령", "2001", "20040530", "20040529", "18404", "대통령령"],
  ["소방시설설치유지및안전관리에관한법률 시행령", "2002", "20120205", "20120131", "23540", "대통령령"],
  ["소방시설공사업법 시행령", "9001", "20040530", "20040529", "18405", "대통령령"],
  ["화재예방, 소방시설 설치ㆍ유지 및 안전관리에 관한 법률 시행령", "3001", "20160127", "20160119", "26916", "대통령령"],
  ["소방시설 설치 및 관리에 관한 법률 시행령", "4001", "20221201", "20221129", "33004", "대통령령"],
  ["소방시설 설치 및 관리에 관한 법률 시행규칙", "4101", "20221201", "20221201", "1", "행정안전부령"],
];
const DOC = (mst) => {
  const v = V.find((x) => x[1] === mst);
  return {
    법령: {
      기본정보: { 법령명_한글: v[0], 공포번호: v[4], 공포일자: v[3], 시행일자: v[2], 법종구분: { content: v[5] }, 제개정구분: "일부개정" },
      조문: {
        조문단위: [
          { 조문번호: "1", 조문여부: "전문", 조문내용: "제1장 총칙" },
          { 조문번호: "1", 조문여부: "조문", 조문제목: "목적", 조문내용: `제1조(목적) 이 영은 ${v[0]}에 관한 사항을 규정한다.` },
          {
            조문번호: "10", 조문가지번호: "2", 조문여부: "조문", 조문제목: "설치기준", 조문내용: "제10조의2(설치기준)",
            항: [{ 항번호: "①", 항내용: "① 다음 각 호의 시설을 설치한다.", 호: [{ 호번호: "1.", 호내용: "1. 스프링클러설비", 목: { 목번호: "가.", 목내용: ["가. 지하층 &amp; 무창층"] } }] }],
          },
        ],
      },
      별표: {
        별표단위: [
          { 별표번호: "0001", 별표가지번호: "00", 별표구분: "별표", 별표제목: "특정소방대상물", 별표내용: [["1. 공동주택"], ["가. 아파트 <b>등</b>"]], 별표서식PDF파일링크: "/LSW/flDownload.do?flSeq=111&OC=secret", 별표서식파일링크: "http://www.law.go.kr/LSW/flDownload.do?OC=secret&flSeq=112" },
          { 별표번호: "0002", 별표가지번호: "00", 별표구분: "별표", 별표제목: "옛 별표", 별표내용: "", 별표서식PDF파일링크: "/LSW/flDownload.do?flSeq=113" },
          { 별표번호: "0001", 별표가지번호: "00", 별표구분: "서식", 별표제목: "신청서" },
        ],
      },
    },
  };
};
function lawFetch(url) {
  const u = new URL(url);
  const p = Object.fromEntries(u.searchParams);
  expect(p.OC).toBe("secret");
  let body;
  if (u.pathname.endsWith("lawSearch.do")) {
    const [a, b] = (p.efYd || "00000000~99999999").split("~");
    let list = V.filter((v) => v[0].includes(p.query) && v[2] >= a && v[2] <= b);
    list.sort((x, y) => (p.sort === "efdes" ? (x[2] < y[2] ? 1 : -1) : x[2] < y[2] ? -1 : 1));
    const n = +p.display, pg = +p.page || 1;
    const page = list.slice((pg - 1) * n, pg * n).map((v) => ({ 법령명한글: v[0], 법령일련번호: v[1], 시행일자: v[2], 공포일자: v[3], 공포번호: v[4], 법령구분명: v[5], 제개정구분명: "일부개정", 법령상세링크: `/DRF/lawService.do?OC=secret&MST=${v[1]}` }));
    body = { LawSearch: { totalCnt: String(list.length), law: page.length === 1 ? page[0] : page } };
  } else {
    body = DOC(p.MST);
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

test("법령명 계열 판별 — 명칭 변경·띄어쓰기·가운뎃점 무관, 종류 구분", () => {
  const { matches } = api._t;
  expect(matches("fire", "dec", "소방법시행령")).toBe(true);
  expect(matches("fire", "dec", "화재예방, 소방시설 설치ㆍ유지 및 안전관리에 관한 법률 시행령")).toBe(true);
  expect(matches("fire", "dec", "소방시설 설치 및 관리에 관한 법률 시행령")).toBe(true);
  expect(matches("fire", "dec", "소방시설공사업법 시행령")).toBe(false);
  expect(matches("fire", "dec", "소방시설 설치 및 관리에 관한 법률 시행규칙")).toBe(false);
  expect(matches("fire", "law", "소방법")).toBe(true);
  expect(matches("fire", "law", "소방법시행령")).toBe(false);
  expect(matches("prevent", "law", "화재의 예방 및 안전관리에 관한 법률")).toBe(true);
});

test("번호·날짜 정규화", () => {
  const { normNo, toYmd } = api._t;
  expect(normNo("제10조의2")).toBe("10-2");
  expect(normNo("10-2")).toBe("10-2");
  expect(normNo("별표 4")).toBe("4");
  expect(normNo("1의2")).toBe("1-2");
  expect(toYmd("2003-05-01")).toBe("20030501");
  expect(toYmd("2003.5.1.")).toBe("20030501");
  expect(toYmd("2003-13-01")).toBe("");
});

test("기준일에 시행 중이던 판과 다음 판 — 법령명이 바뀐 계열도 이어서 찾음", async () => {
  let r = await J({ fam: "fire", kind: "dec", date: "2003-05-01" });
  expect([r.ver.mst, r.next.mst]).toEqual(["1001", "1002"]);
  r = await J({ fam: "fire", kind: "dec", date: "2004-05-29" });
  expect([r.ver.mst, r.next.mst]).toEqual(["1002", "2001"]); // 소방법 시행령 → 소방시설설치유지법 시행령
  r = await J({ fam: "fire", kind: "dec", date: "2004-05-30" });
  expect(r.ver.mst).toBe("2001");
  r = await J({ fam: "fire", kind: "dec", date: "2016-02-01" });
  expect(r.ver.name).toContain("화재예방");
  r = await J({ fam: "fire", kind: "dec", date: "2026-01-01" });
  expect([r.ver.mst, r.next]).toEqual(["4001", null]);
  expect(r.toc.arts.map((a) => a.k)).toEqual(["1", "1", "10-2"]);
  expect(r.toc.byls).toEqual([{ k: "1", title: "특정소방대상물", hasText: true }, { k: "2", title: "옛 별표", hasText: false }]);
  expect(r.link).toBe("https://www.law.go.kr/lsInfoP.do?lsiSeq=4001&efYd=20221201");
});

test("조문 원문(항·호·목 포함)과 별표 원문 — 링크에서 OC 제거", async () => {
  const a = await J({ fam: "fire", kind: "dec", date: "2010-01-01", jo: "제10조의2" });
  expect(a.art.text).toBe("제10조의2(설치기준)\n① 다음 각 호의 시설을 설치한다.\n1. 스프링클러설비\n가. 지하층 & 무창층");
  const b = await call({ fam: "fire", kind: "dec", date: "2010-01-01", byl: "1" });
  expect(b.headers["Content-Type"]).toContain("text/plain");
  expect(b.body).toContain("[기준일] 2010-01-01에 시행 중이던 판");
  expect(b.body).toContain("소방시설설치유지및안전관리에관한법률 시행령 [대통령령 제18404호, 2004-05-29 공포, 2004-05-30 시행");
  expect(b.body).toContain("2004-05-30 ~ 2012-02-05 전날");
  expect(b.body).toContain("1. 공동주택\n가. 아파트 등");
  expect(b.body).toContain("PDF: https://www.law.go.kr/LSW/flDownload.do?flSeq=111");
  expect(b.body).not.toContain("secret");
  const c = await call({ fam: "fire", kind: "dec", date: "2010-01-01", byl: "2" });
  expect(c.body).toContain("텍스트가 법제처 API에 없음");
  expect((await call({ fam: "fire", kind: "dec", date: "2010-01-01", jo: "99" })).code).toBe(404);
});

test("판 안에서 낱말 검색 · 개정 연혁 목록 · 사용법", async () => {
  const s = await J({ fam: "fire", kind: "dec", date: "2010-01-01", q: "스프링클러" });
  expect(s.hits[0].where).toBe("jo=10-2 제10조의2(설치기준)");
  const l = await J({ fam: "fire", kind: "dec", list: "1" });
  expect(l.versions.map((v) => v.mst)).toEqual(["1001", "1002", "2001", "2002", "3001", "4001"]);
  const u = await call({});
  expect(u.body).toContain("fam=fire&kind=dec&date=2003-05-01");
  for (const r of [s, l]) expect(JSON.stringify(r)).not.toContain("secret");
});

test("오류 — 날짜 형식, 찾을 수 없는 시점", async () => {
  expect((await call({ fam: "fire", date: "어제" })).code).toBe(400);
  expect((await call({ fam: "fire", kind: "dec", date: "1980-01-01" })).code).toBe(404);
});

test("실제 응답 반영 — 장 제목 앞 공백 제거, 별표번호 없는 옛 판 별표, 별표 없는 판 안내, 구조 확인", () => {
  const { parseLaw, render, shapeOf } = api._t;
  const d = parseLaw({
    법령: {
      기본정보: { 법령명_한글: "소방법시행령" },
      조문: { 조문단위: [{ 조문번호: "1", 조문여부: "전문", 조문내용: "        제1장 총칙" }, { 조문번호: "1", 조문여부: "조문", 조문제목: "목적", 조문내용: "제1조(목적) …" }] },
      별표: { 별표단위: { 별표제목: "[별표 2] 방화관리자를 두어야 할 특수장소", 별표내용: "[별표 2]\n1급 …" } },
    },
  });
  expect(d.arts[0].label).toBe("제1장 총칙");
  expect(d.byls.map((b) => b.k)).toEqual(["2"]);
  const ver = { name: "소방법시행령", mst: "18484", eff: "19941228", pub: "19940720", no: "14334", kind: "대통령령", why: "일부개정" };
  const t = render({ fam: "fire", kind: "dec", date: "19950301", ver, next: null, toc: { arts: [], byls: [] } }, "text");
  expect(t).toContain("이 판의 별표는 법제처 OPEN API에 없음");
  expect(shapeOf({ OC: "secret", 법령: { 별표: { 별표단위: [{ 별표내용: "x" }, {}] } } }, 5)).toEqual({ 법령: { 별표: { 별표단위: ["배열 2개", { 별표내용: "string" }] } } });
});

test("구조 확인(shape=1) — 값·인증값 없이 키 구조만", async () => {
  const r = await call({ fam: "fire", kind: "dec", date: "2010-01-01", shape: "1" });
  expect(r.code).toBe(200);
  const j = JSON.parse(r.body);
  expect(j.shape.법령.별표.별표단위[0]).toBe("배열 3개");
  expect(r.body).not.toContain("secret");
  expect(r.body).not.toContain("특정소방대상물");
});

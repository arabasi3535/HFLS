// 랭킹 API(api/rank.js) 검증 — 메모리 Redis 사용
import { makeFakeRedis } from "./fakeRedis.testutil";
import { RANKS, RANK_XP, STAGES } from "./progress";

let api, fake, now = 1_800_000_000_000;
beforeEach(() => {
  process.env.KV_REST_API_URL = "http://fake";
  process.env.KV_REST_API_TOKEN = "t";
  process.env.ADMIN_PW = "pw";
  fake = makeFakeRedis();
  global.fetch = fake.fetch;
  jest.resetModules();
  api = require("../../../api/rank.js");
  jest.spyOn(Date, "now").mockImplementation(() => now);
});
afterEach(() => jest.restoreAllMocks());

const call = async (method, { query = {}, body = {}, headers = {} } = {}) => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; }, end() { return this; }, setHeader() {} };
  await api({ method, query, body, headers: { "x-forwarded-for": "1.1.1.1", ...headers } }, res);
  return res;
};
const ID = (n) => String(n).padStart(16, "a");
const KEY = (n) => String(n).padStart(32, "b");
const post = (n, s, nick) => call("POST", { body: { id: ID(n), key: KEY(n), nick, ...s } });

test("계급·도시 기준이 게임과 같음", () => {
  expect(api.RANKS).toEqual(RANKS);
  expect(api.RANK_XP).toEqual(RANK_XP);
  expect(api.STAGES).toEqual(STAGES);
});

test("순위: ① XP ② 1회 적합 횟수", async () => {
  expect((await post(1, { xp: 300, first: 3, done: 5, pop: 100 }, "가나다")).code).toBe(200);
  expect((await post(2, { xp: 300, first: 5, done: 5, pop: 90 }, "라마바")).code).toBe(200);
  expect((await post(3, { xp: 500, first: 1, done: 6, pop: 50 }, "사아자")).code).toBe(200);
  const r = await call("GET", { query: { me: ID(1) } });
  expect(r.body.top.map((x) => x.nick)).toEqual(["사아자", "라마바", "가나다"]);
  expect(r.body.me.pos).toBe(3);
  expect(r.body.top[0].rankName).toBe("소방위"); // 500 XP(380 이상 620 미만)
  expect(r.body.top[1].stage).toBe("농촌 마을"); // 인구 90
  expect(r.body.total).toBe(3);
});

test("다른 기기(비밀키 불일치)는 덮어쓸 수 없음", async () => {
  await post(1, { xp: 100, first: 1, done: 2, pop: 10 }, "주인");
  const r = await call("POST", { body: { id: ID(1), key: KEY(9), xp: 200, first: 2, done: 3, pop: 20 } });
  expect(r.code).toBe(403);
});

test("닉네임 중복·형식·금칙어", async () => {
  await post(1, { xp: 0, first: 0, done: 0, pop: 0 }, "소방왕");
  expect((await post(2, { xp: 0, first: 0, done: 0, pop: 0 }, "소방왕")).code).toBe(409);
  expect((await post(3, { xp: 0, first: 0, done: 0, pop: 0 }, "a")).code).toBe(400);
  expect((await post(4, { xp: 0, first: 0, done: 0, pop: 0 }, "<script>")).code).toBe(400);
  expect((await post(5, { xp: 0, first: 0, done: 0, pop: 0 }, "관리자1")).code).toBe(400);
});

test("조작 방지 — 규칙상 불가능한 값 거부", async () => {
  expect((await post(1, { xp: 1000, first: 1, done: 2, pop: 10 }, "과다XP")).code).toBe(400); // 2건 × 240 초과
  expect((await post(2, { xp: 100, first: 5, done: 3, pop: 10 }, "적합초과")).code).toBe(400);
  expect((await post(3, { xp: 50, first: 3, done: 3, pop: 10 }, "적합XP부족")).code).toBe(400); // 3 × 30 미만
  expect((await post(4, { xp: 100, first: 1, done: 1, pop: 9000 }, "인구과다")).code).toBe(400);
});

test("짧은 시간에 급증하면 거부, 시간이 지나면 허용", async () => {
  await post(1, { xp: 100, first: 2, done: 2, pop: 10 }, "속도");
  expect((await post(1, { xp: 2000, first: 2, done: 20, pop: 100 })).code).toBe(400);
  now += 120 * 1000;
  expect((await post(1, { xp: 2000, first: 2, done: 20, pop: 100 })).code).toBe(200);
});

test("새 게임으로 점수가 내려가도 최고 기록 유지", async () => {
  await post(1, { xp: 300, first: 3, done: 5, pop: 100 }, "최고");
  const r = await post(1, { xp: 40, first: 1, done: 1, pop: 4 });
  expect(r.body.updated).toBe(false);
  expect(r.body.me.xp).toBe(300);
});

test("관리자만 삭제 가능, 삭제 후 닉네임 재사용 가능", async () => {
  await post(1, { xp: 100, first: 1, done: 2, pop: 10 }, "삭제대상");
  expect((await call("DELETE", { query: { id: ID(1) } })).code).toBe(403);
  expect((await call("DELETE", { query: { id: ID(1) }, headers: { "x-admin-pw": "pw" } })).code).toBe(200);
  const g = await call("GET");
  expect(g.body.top).toEqual([]);
  expect((await post(2, { xp: 0, first: 0, done: 0, pop: 0 }, "삭제대상")).code).toBe(200);
});

test("응답에 비밀키 해시가 노출되지 않음", async () => {
  await post(1, { xp: 100, first: 1, done: 2, pop: 10 }, "보안");
  const g = await call("GET", { query: { me: ID(1) } });
  expect(JSON.stringify(g.body)).not.toMatch(/kh|nickLow|bbbb/);
});

// ---------- 난이도별 랭킹(v2.32.0) ----------
const postLv = (n, lv, s, nick) => call("POST", { body: { id: ID(n), key: KEY(n), nick, level: lv, ...s } });

test("난이도별로 순위가 따로 — 초급은 기존 키 그대로", async () => {
  await post(1, { xp: 300, first: 3, done: 5, pop: 100 }, "초급왕");
  await postLv(2, "mid", { xp: 700, first: 2, done: 3, pop: 50 }, "중급왕");
  await postLv(1, "adv", { xp: 100, first: 1, done: 1, pop: 10 });
  expect((await call("GET")).body.top.map((x) => x.nick)).toEqual(["초급왕"]);
  expect((await call("GET", { query: { level: "mid" } })).body.top.map((x) => x.nick)).toEqual(["중급왕"]);
  const adv = await call("GET", { query: { level: "adv", me: ID(1) } });
  expect(adv.body.top.map((x) => x.nick)).toEqual(["초급왕"]); // 닉네임 공유
  expect(adv.body.me.pos).toBe(1);
  expect(fake.hs.get("hfls:fc:data").has(ID(1))).toBe(true);
  expect(fake.hs.get("hfls:fc:mid:data").has(ID(2))).toBe(true);
});

test("닉네임은 난이도 공통 — 다른 사람은 다른 난이도에서도 같은 닉네임 불가, 변경은 모든 난이도에 반영", async () => {
  await post(1, { xp: 100, first: 1, done: 2, pop: 10 }, "공유닉");
  expect((await postLv(2, "mid", { xp: 0, first: 0, done: 0, pop: 0 }, "공유닉")).code).toBe(409);
  await postLv(1, "mid", { xp: 100, first: 1, done: 1, pop: 10 });
  expect((await postLv(1, "mid", { xp: 100, first: 1, done: 1, pop: 10 }, "새닉네임")).code).toBe(200);
  expect((await call("GET")).body.top[0].nick).toBe("새닉네임");
  expect((await post(3, { xp: 0, first: 0, done: 0, pop: 0 }, "공유닉")).code).toBe(200); // 옛 닉네임 해제
});

test("다른 기기 비밀키는 다른 난이도에서도 거부", async () => {
  await post(1, { xp: 100, first: 1, done: 2, pop: 10 }, "주인2");
  const r = await call("POST", { body: { id: ID(1), key: KEY(9), level: "adv", xp: 0, first: 0, done: 0, pop: 0 } });
  expect(r.code).toBe(403);
});

test("중급·고급 조작 방지 한도 — 진행 중 단계 XP 여유 포함", async () => {
  // 중급: (준공 + 5) × 380
  expect((await postLv(1, "mid", { xp: 2280, first: 0, done: 1, pop: 10 }, "중급한도")).code).toBe(200);
  expect((await postLv(2, "mid", { xp: 2281, first: 0, done: 1, pop: 10 }, "중급초과")).code).toBe(400);
  expect((await postLv(3, "mid", { xp: 100, first: 2, done: 2, pop: 10 }, "중급부족")).code).toBe(400); // 2 × 60 미만
  // 고급: (준공 + 5) × 305
  expect((await postLv(4, "adv", { xp: 1830, first: 0, done: 1, pop: 10 }, "고급한도")).code).toBe(200);
  expect((await postLv(5, "adv", { xp: 1831, first: 0, done: 1, pop: 10 }, "고급초과")).code).toBe(400);
});

test("관리자 삭제는 해당 난이도만 — 다른 난이도 기록이 있으면 닉네임 유지", async () => {
  await post(1, { xp: 100, first: 1, done: 2, pop: 10 }, "둘다");
  await postLv(1, "mid", { xp: 100, first: 1, done: 1, pop: 10 });
  expect((await call("DELETE", { query: { id: ID(1), level: "mid" }, headers: { "x-admin-pw": "pw" } })).code).toBe(200);
  expect((await call("GET", { query: { level: "mid" } })).body.top).toEqual([]);
  expect((await call("GET")).body.top[0].nick).toBe("둘다");
  expect((await post(2, { xp: 0, first: 0, done: 0, pop: 0 }, "둘다")).code).toBe(409);
});

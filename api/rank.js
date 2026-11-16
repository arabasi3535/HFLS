// 미니게임 「소방 인허가 시티」 랭킹 — 난이도별(level: basic 초급 · mid 중급 · adv 고급)
//  GET  ?level=&me=<id>        : 상위 50명 + 내 순위 (누구나)
//  POST {id,key,nick,level,xp,first,done,pop} : 등록·갱신 (닉네임 + 기기별 비밀키, 로그인 없음)
//  DELETE ?level=&id=<id>      : 기록 삭제 (관리자, 헤더 x-admin-pw)
// 순위: ① XP ② 1회 적합 횟수 (ZSET 점수 = xp × 1,000,000 + first)
// 닉네임·비밀키는 난이도 공통(닉네임 변경 시 모든 난이도 기록에 반영). 초급은 기존 키(hfls:fc:*) 그대로 사용
// 계급·도시 단계는 서버가 XP·인구로 다시 계산(클라이언트 값 불신)
const crypto = require("crypto");
const { configured, pipeline, clientIp, adminOk, adminSet } = require("./_redis");

const NICKS = "hfls:fc:nicks";
const TOP_N = 50;

// src/components/MiniGame/progress.js 와 같은 값(테스트로 대조)
const RANKS = ["소방사", "소방교", "소방장", "소방위", "소방경", "소방령", "소방정", "소방준감", "소방감", "소방정감", "소방총감"];
const RANK_XP = [0, 80, 200, 380, 620, 920, 1300, 1760, 2300, 2950, 3700];
const STAGES = [[0, "시골마을"], [40, "농촌 마을"], [150, "읍내"], [500, "소도시"], [1500, "중소도시"], [4000, "중견도시"], [10000, "대도시"], [25000, "광역도시"]];

// 조작 방지 한도 — 게임 규칙에서 나올 수 있는 최댓값 기준(난이도별)
//  허가 동의 1건 최대 XP: 20 + 설비 21종×8 + 30층×2 = 248 / 최소(설치 0종·1층) 22, 현행 기준은 소화기구가 항상 대상이라 30
//  착공 단계 최대 20 + 8문항×10 = 100 · 준공 후 최대 20 + 2문항×15 = 50 · 고급 관리 최대 20 + 3문항×15 = 65 / 단계 최소 20
//  slack: 진행 중(아직 준공 전) 건물의 단계 XP 여유 — 동시 접수 최대 5건
const LEVELS = {
  basic: { p: "hfls:fc", maxGain: 248, minFirst: 30, slack: 0 },
  mid: { p: "hfls:fc:mid", maxGain: 398, minFirst: 60, slack: 5 },
  adv: { p: "hfls:fc:adv", maxGain: 313, minFirst: 40, slack: 5 },
};
const LV_IDS = Object.keys(LEVELS);
const keysOf = (lv) => ({ rank: `${LEVELS[lv].p}:rank`, data: `${LEVELS[lv].p}:data`, top: `${LEVELS[lv].p}:top` });
const lvOf = (v) => (LEVELS[v] ? v : "basic");
const MAX_POP = 2500; // 준공 1건 최대 인구(오피스 타워 상한 약 2,000명)
const SEC_PER_DONE = 4; // 준공 1건에 최소 4초(검토·선택·제출·준공 처리)

const BANNED = ["시발", "씨발", "병신", "개새", "좆", "섹스", "fuck", "shit", "admin", "관리자", "운영자", "소방청"];

const rankOf = (xp) => RANK_XP.reduce((r, t, i) => (xp >= t ? i : r), 0);
const stageOf = (pop) => STAGES.reduce((s, [t, n]) => (pop >= t ? n : s), STAGES[0][1]);
const score = (xp, first) => xp * 1e6 + first;
const hash = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
const int = (v) => (Number.isInteger(v) && v >= 0 && v <= 1e7 ? v : null);
const kst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " ");

function checkNick(raw) {
  const nick = String(raw || "").trim().replace(/\s+/g, " ");
  if (nick.length < 2 || nick.length > 10) return { error: "닉네임은 2~10자로 입력하십시오." };
  if (!/^[가-힣a-zA-Z0-9_ ]+$/.test(nick)) return { error: "닉네임은 한글·영문·숫자·밑줄(_)만 쓸 수 있습니다." };
  const low = nick.toLowerCase().replace(/\s/g, "");
  if (BANNED.some((w) => low.includes(w))) return { error: "사용할 수 없는 닉네임입니다." };
  return { nick, low };
}

/** 정적 검증: 제출 값 자체가 게임 규칙상 가능한지 */
function plausible({ xp, first, done, pop }, lv = "basic") {
  const L = LEVELS[lv];
  if ([xp, first, done, pop].some((v) => v === null)) return "값 형식 오류";
  if (first > done) return "1회 적합 수가 준공 수보다 많음";
  if (xp > (done + L.slack) * L.maxGain) return "준공 수에 비해 XP가 너무 많음";
  if (xp < first * L.minFirst) return "1회 적합 수에 비해 XP가 너무 적음";
  if (pop > done * MAX_POP) return "준공 수에 비해 인구가 너무 많음";
  return "";
}

/** 이전 기록 대비 증가량 검증 */
function growthOk(old, cur, now, lv = "basic") {
  const L = LEVELS[lv];
  const dDone = cur.done - old.done;
  if (dDone < 0) return true; // 새 게임(점수 하락) — 갱신하지 않으므로 통과
  if (cur.xp - old.xp > (Math.max(0, dDone) + L.slack) * L.maxGain) return false;
  const sec = Math.max(0, (now - (old.t || 0)) / 1000);
  return dDone <= 3 + sec / SEC_PER_DONE;
}

const pub = (id, d) => ({
  id,
  nick: d.nick,
  xp: d.xp,
  first: d.first,
  done: d.done,
  pop: d.pop,
  rankName: RANKS[rankOf(d.xp)],
  stage: stageOf(d.pop),
  at: d.at,
});

async function rebuildTop(lv) {
  const K = keysOf(lv);
  const [ids] = await pipeline([["ZREVRANGE", K.rank, 0, TOP_N - 1]]);
  if (!ids || !ids.length) {
    await pipeline([["SET", K.top, "[]"]]);
    return [];
  }
  const [vals] = await pipeline([["HMGET", K.data, ...ids]]);
  const top = ids.map((id, i) => (vals[i] ? pub(id, JSON.parse(vals[i])) : null)).filter(Boolean);
  await pipeline([["SET", K.top, JSON.stringify(top)]]);
  return top;
}

const body = (req) => (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {});

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!configured()) return res.status(503).json({ configured: false });
  try {
    const lv = lvOf(req.method === "POST" ? body(req).level : req.query.level);
    const K = keysOf(lv);
    if (req.method === "GET") {
      const me = String(req.query.me || "").slice(0, 40);
      const cmds = [["GET", K.top], ["ZCARD", K.rank]];
      if (me) cmds.push(["ZREVRANK", K.rank, me], ["HGET", K.data, me]);
      const [topRaw, total, myRank, myData] = await pipeline(cmds);
      const top = topRaw ? JSON.parse(topRaw) : await rebuildTop(lv);
      const out = { configured: true, total: Number(total || 0), top };
      if (me && myData) out.me = { ...pub(me, JSON.parse(myData)), pos: myRank === null ? null : myRank + 1 };
      return res.status(200).json(out);
    }

    if (req.method === "POST") {
      const b = body(req);
      const id = String(b.id || "");
      const key = String(b.key || "");
      if (!/^[a-f0-9]{16}$/.test(id) || !/^[a-f0-9]{32}$/.test(key)) return res.status(400).json({ error: "식별값 형식 오류" });
      // 남용 방지: IP당 1시간 300회
      const rl = `hfls:rl:fc:${clientIp(req)}:${new Date().toISOString().slice(0, 13)}`;
      const [n] = await pipeline([["INCR", rl], ["EXPIRE", rl, 3600]]);
      if (n > 300) return res.status(429).json({ error: "잠시 후 다시 시도하십시오." });

      const cur = { xp: int(b.xp), first: int(b.first), done: int(b.done), pop: int(b.pop) };
      const bad = plausible(cur, lv);
      if (bad) return res.status(400).json({ error: `기록 검증 실패: ${bad}` });

      // 같은 id의 모든 난이도 기록 — 비밀키 확인·닉네임 공유
      const raws = await pipeline(LV_IDS.map((l) => ["HGET", keysOf(l).data, id]));
      const recs = Object.fromEntries(LV_IDS.map((l, i) => [l, raws[i] ? JSON.parse(raws[i]) : null]));
      const old = recs[lv];
      const anyRec = LV_IDS.map((l) => recs[l]).find(Boolean);
      if (anyRec && anyRec.kh !== hash(key)) return res.status(403).json({ error: "다른 기기의 기록입니다." });

      // 닉네임: 신규 등록 또는 변경 요청 시
      let nick = old ? old.nick : anyRec ? anyRec.nick : null;
      let nickLow = old ? old.nickLow : anyRec ? anyRec.nickLow : null;
      const prevLow = nickLow;
      if (!nick || (b.nick && String(b.nick).trim() !== nick)) {
        const c = checkNick(b.nick);
        if (c.error) return res.status(400).json({ error: c.error });
        const [owner] = await pipeline([["HGET", NICKS, c.low]]);
        if (owner && owner !== id) return res.status(409).json({ error: "이미 사용 중인 닉네임입니다." });
        const [ok] = await pipeline([["HSETNX", NICKS, c.low, id]]);
        if (!ok) {
          const [o2] = await pipeline([["HGET", NICKS, c.low]]);
          if (o2 !== id) return res.status(409).json({ error: "이미 사용 중인 닉네임입니다." });
        }
        if (prevLow && prevLow !== c.low) await pipeline([["HDEL", NICKS, prevLow]]);
        nick = c.nick;
        nickLow = c.low;
        // 다른 난이도 기록의 닉네임도 함께 변경
        for (const l of LV_IDS) {
          const r = recs[l];
          if (l === lv || !r || r.nick === nick) continue;
          await pipeline([["HSET", keysOf(l).data, id, JSON.stringify({ ...r, nick, nickLow })]]);
          await rebuildTop(l);
        }
      }

      const now = Date.now();
      const better = !old || score(cur.xp, cur.first) > score(old.xp, old.first);
      if (old && better && !growthOk(old, cur, now, lv)) return res.status(400).json({ error: "기록 검증 실패: 짧은 시간에 너무 많이 증가" });

      // 최고 기록 유지(새 게임으로 점수가 내려가면 갱신하지 않음) — 닉네임 변경은 반영
      const rec = better
        ? { ...cur, nick, nickLow, kh: hash(key), t: now, at: kst() }
        : { ...old, nick, nickLow };
      await pipeline([
        ["HSET", K.data, id, JSON.stringify(rec)],
        ["ZADD", K.rank, score(rec.xp, rec.first), id],
      ]);
      await rebuildTop(lv);
      const [pos] = await pipeline([["ZREVRANK", K.rank, id]]);
      return res.status(200).json({ ok: true, updated: better, me: { ...pub(id, rec), pos: pos === null ? null : pos + 1 } });
    }

    if (req.method === "DELETE") {
      if (!adminSet() || !adminOk(req)) return res.status(403).json({ error: "관리자만 삭제할 수 있습니다." });
      const id = String(req.query.id || "");
      const [raw] = await pipeline([["HGET", K.data, id]]);
      const d = raw ? JSON.parse(raw) : null;
      await pipeline([["ZREM", K.rank, id], ["HDEL", K.data, id]]);
      // 다른 난이도에 기록이 없을 때만 닉네임 해제
      const rest = await pipeline(LV_IDS.filter((l) => l !== lv).map((l) => ["HGET", keysOf(l).data, id]));
      if (d && d.nickLow && rest.every((x) => !x)) await pipeline([["HDEL", NICKS, d.nickLow]]);
      await rebuildTop(lv);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: "rank" });
  }
};

module.exports.RANKS = RANKS;
module.exports.RANK_XP = RANK_XP;
module.exports.STAGES = STAGES;
module.exports.LEVELS = LEVELS;
module.exports._t = { plausible, growthOk, checkNick, rankOf, stageOf };

// 랭킹 클라이언트 — 닉네임 + 기기별 비밀키(로그인 없음). 서버: api/rank.js
const LS = "firecity_rank_v1";

const hex = (n) => {
  const a = new Uint8Array(n);
  (window.crypto || window.msCrypto).getRandomValues(a);
  return Array.from(a, (x) => x.toString(16).padStart(2, "0")).join("");
};

export function getMe() {
  try {
    const v = JSON.parse(localStorage.getItem(LS) || "null");
    return v && v.id && v.key ? v : null;
  } catch (e) {
    return null;
  }
}
function setMe(v) {
  try {
    localStorage.setItem(LS, JSON.stringify(v));
  } catch (e) {
    /* 저장 불가 환경 */
  }
}

async function call(url, opt) {
  let r;
  try {
    r = await fetch(url, opt);
  } catch (e) {
    return { error: "랭킹 서버에 연결할 수 없습니다." };
  }
  let j = {};
  try {
    j = await r.json();
  } catch (e) {
    /* 본문 없음 */
  }
  if (r.status === 503 || j.configured === false) return { error: "랭킹 서버가 아직 설정되지 않았습니다." };
  if (!r.ok) return { error: j.error || `오류(${r.status})` };
  return j;
}

const stats = (S) => ({ xp: S.xp, first: S.first, done: S.done, pop: S.pop });
// 난이도: basic(초급) · mid(중급) · adv(고급) — 랭킹은 난이도별, 닉네임·비밀키는 공유
const lv = (level) => (level === "mid" || level === "adv" ? level : "basic");

/** 닉네임 등록(처음) 또는 변경 */
export async function register(nick, S, level) {
  const prev = getMe();
  const me = prev || { id: hex(8), key: hex(16) };
  const j = await call("/api/rank", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: me.id, key: me.key, nick, level: lv(level), ...stats(S) }),
  });
  if (!j.error) setMe({ ...me, nick: j.me.nick });
  return j;
}

/** 진행 상황 전송(등록한 사람만) */
export async function submit(S, level) {
  const me = getMe();
  if (!me) return null;
  return call("/api/rank", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: me.id, key: me.key, nick: me.nick, level: lv(level), ...stats(S) }),
  });
}

export function board(level) {
  const me = getMe();
  return call(`/api/rank?level=${lv(level)}${me ? `&me=${me.id}` : ""}`);
}

export function remove(id, pw, level) {
  return call(`/api/rank?level=${lv(level)}&id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { "x-admin-pw": pw } });
}

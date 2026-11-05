// Upstash Redis REST 호출 (Vercel Marketplace 「Upstash for Redis」 연결 시 환경변수 자동 설정)
//  - KV_REST_API_URL / KV_REST_API_TOKEN (또는 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

const configured = () => !!(URL_ && TOKEN);

/** 여러 명령을 한 번에 실행: [["INCR","k"], ...] → [결과, ...] */
async function pipeline(cmds) {
  const r = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  const out = await r.json();
  return out.map((x) => {
    if (x.error) throw new Error(x.error);
    return x.result;
  });
}

/** 한국 시간 기준 날짜 YYYY-MM-DD */
function todayKST() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function clientIp(req) {
  const xf = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return xf || req.headers["x-real-ip"] || "unknown";
}

/** 관리자 비밀번호(서버 전용) — Vercel 환경변수 ADMIN_PW. 미설정이면 신고함 열람 불가 */
const adminSet = () => !!process.env.ADMIN_PW;
function adminOk(req) {
  return adminSet() && (req.headers["x-admin-pw"] || "") === process.env.ADMIN_PW;
}

module.exports = { configured, pipeline, todayKST, clientIp, adminOk, adminSet };

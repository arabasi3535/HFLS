// 관리자 로그인 확인 — 비밀번호는 서버 환경변수 ADMIN_PW에만 있고 화면 코드에는 들어가지 않음
const { configured, pipeline, clientIp, adminSet } = require("./_redis");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).end();
  if (!adminSet()) return res.status(200).json({ ok: false, unset: true });
  // 무작위 대입 방지: IP당 1시간 10회 실패 시 차단 (저장소 연결 시)
  const key = `hfls:rl:auth:${clientIp(req)}:${new Date().toISOString().slice(0, 13)}`;
  if (configured()) {
    try {
      const [n] = await pipeline([["GET", key]]);
      if (Number(n || 0) >= 10) return res.status(429).json({ ok: false, error: "시도 횟수 초과 — 1시간 뒤 다시 시도하십시오." });
    } catch (e) {
      /* 저장소 오류 시 제한 없이 진행 */
    }
  }
  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const ok = String(b.pw || "") === process.env.ADMIN_PW;
  if (!ok && configured()) {
    try {
      await pipeline([["INCR", key], ["EXPIRE", key, 3600]]);
    } catch (e) {
      /* 무시 */
    }
  }
  return res.status(200).json({ ok });
};

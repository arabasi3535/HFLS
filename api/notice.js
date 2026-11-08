// 업데이트 메모(머리말 버전 옆 한 줄): GET 조회(누구나) / POST 저장(관리자, 헤더 x-admin-pw)
const { configured, pipeline, adminOk, adminSet } = require("./_redis");

const KEY = "hfls:notice";
const clip = (s, n) => String(s == null ? "" : s).replace(/[\r\n]+/g, " ").trim().slice(0, n);

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!configured()) return res.status(503).json({ configured: false });
  try {
    if (req.method === "GET") {
      const [raw] = await pipeline([["GET", KEY]]);
      return res.status(200).json({ configured: true, notice: raw ? JSON.parse(raw) : null });
    }
    if (req.method === "POST") {
      if (!adminSet()) return res.status(403).json({ error: "Vercel 환경변수 ADMIN_PW가 설정되지 않아 저장할 수 없습니다." });
      if (!adminOk(req)) return res.status(401).json({ error: "관리자 비밀번호가 올바르지 않습니다." });
      const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const notice = {
        version: clip(b.version, 30),
        text: clip(b.text, 120),
        at: new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " "),
      };
      if (!notice.text) await pipeline([["DEL", KEY]]);
      else await pipeline([["SET", KEY, JSON.stringify(notice)]]);
      return res.status(200).json({ ok: true, notice: notice.text ? notice : null });
    }
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: "notice" });
  }
};

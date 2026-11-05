// 오류 신고: POST 접수(누구나) / GET 목록·DELETE 삭제(관리자, 헤더 x-admin-pw)
const { configured, pipeline, todayKST, clientIp, adminOk, adminSet } = require("./_redis");

const KEY = "hfls:reports";
const MAX_KEEP = 2000;
const TYPES = ["판정 오류", "화면 오류", "개선 제안", "기타"];
const clip = (s, n) => String(s == null ? "" : s).slice(0, n);

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!configured()) return res.status(503).json({ configured: false });
  try {
    if (req.method === "POST") {
      const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const message = clip(b.message, 3000).trim();
      if (message.length < 5) return res.status(400).json({ error: "내용을 5자 이상 입력하십시오." });
      // 남용 방지: IP당 1시간 10건
      const rl = `hfls:rl:report:${clientIp(req)}:${new Date().toISOString().slice(0, 13)}`;
      const [n] = await pipeline([["INCR", rl], ["EXPIRE", rl, 3600]]);
      if (n > 10) return res.status(429).json({ error: "잠시 후 다시 시도하십시오." });
      let snapshot = null;
      if (b.snapshot) {
        const s = JSON.stringify(b.snapshot);
        snapshot = s.length <= 12000 ? b.snapshot : { truncated: true };
      }
      const item = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
        at: new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " "),
        day: todayKST(),
        type: TYPES.includes(b.type) ? b.type : "기타",
        message,
        contact: clip(b.contact, 100).trim(),
        version: clip(b.version, 30),
        page: clip(b.page, 30),
        snapshot,
      };
      await pipeline([["LPUSH", KEY, JSON.stringify(item)], ["LTRIM", KEY, 0, MAX_KEEP - 1]]);
      return res.status(200).json({ ok: true, id: item.id });
    }
    if (!adminSet()) return res.status(403).json({ error: "Vercel 환경변수 ADMIN_PW가 설정되지 않아 신고함을 열 수 없습니다." });
    if (!adminOk(req)) return res.status(401).json({ error: "관리자 비밀번호가 올바르지 않습니다." });
    if (req.method === "GET") {
      const [list, len] = await pipeline([["LRANGE", KEY, 0, 299], ["LLEN", KEY]]);
      return res.status(200).json({ items: (list || []).map((s) => JSON.parse(s)), total: len });
    }
    if (req.method === "DELETE") {
      const id = String((req.query && req.query.id) || "");
      const [list] = await pipeline([["LRANGE", KEY, 0, MAX_KEEP - 1]]);
      const raw = (list || []).find((s) => JSON.parse(s).id === id);
      if (!raw) return res.status(404).json({ error: "없음" });
      await pipeline([["LREM", KEY, 1, raw]]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: "report" });
  }
};

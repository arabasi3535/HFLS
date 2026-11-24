// 사용 횟수: GET 조회 / POST 방문 1회 기록 (같은 탭 세션당 1회 — 클라이언트에서 제어)
const { configured, pipeline, todayKST, clientIp } = require("./_redis");

const DAY_TTL = 400 * 24 * 3600; // 일별 키 400일 보관

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!configured()) return res.status(503).json({ configured: false });
  const day = todayKST();
  const q = req.query || {};
  // (v2.49.0) 실무 자료 내려받기 횟수 — GET ?dl=all 전체 / POST ?dl=파일키 1회(같은 IP·파일은 하루 1회)
  if (q.dl) {
    try {
      if (req.method === "POST") {
        const key = String(q.dl);
        if (!/^[\w.\-가-힣]{1,80}$/.test(key)) return res.status(400).json({ error: "dl" });
        const once = `hfls:rl:dl:${clientIp(req)}:${key}:${day}`;
        const [n] = await pipeline([["INCR", once], ["EXPIRE", once, 86400]]);
        if (n === 1) await pipeline([["HINCRBY", "hfls:dl", key, 1]]);
        return res.status(204).end();
      }
      const [flat] = await pipeline([["HGETALL", "hfls:dl"]]);
      const counts = {};
      if (Array.isArray(flat)) for (let i = 0; i + 1 < flat.length; i += 2) counts[flat[i]] = Number(flat[i + 1]) || 0;
      else if (flat && typeof flat === "object") for (const [k, v] of Object.entries(flat)) counts[k] = Number(v) || 0;
      return res.status(200).json({ configured: true, counts });
    } catch (e) {
      return res.status(500).json({ error: "dl" });
    }
  }
  try {
    if (req.method === "POST") {
      // 남용 방지: IP당 하루 200회 초과분은 집계하지 않음
      const rl = `hfls:rl:visit:${clientIp(req)}:${day}`;
      const [n] = await pipeline([["INCR", rl], ["EXPIRE", rl, 86400]]);
      if (n <= 200) {
        const [total, today] = await pipeline([["INCR", "hfls:total"], ["INCR", `hfls:day:${day}`], ["EXPIRE", `hfls:day:${day}`, DAY_TTL]]);
        return res.status(200).json({ configured: true, total, today, date: day });
      }
    }
    if (req.method !== "GET" && req.method !== "POST") return res.status(405).end();
    const [total, today] = await pipeline([["GET", "hfls:total"], ["GET", `hfls:day:${day}`]]);
    return res.status(200).json({ configured: true, total: Number(total || 0), today: Number(today || 0), date: day });
  } catch (e) {
    return res.status(500).json({ error: "stats" });
  }
};

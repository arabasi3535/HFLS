// 사용 횟수: GET 조회 / POST 방문 1회 기록 (같은 탭 세션당 1회 — 클라이언트에서 제어)
const { configured, pipeline, todayKST, clientIp } = require("./_redis");

const DAY_TTL = 400 * 24 * 3600; // 일별 키 400일 보관

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!configured()) return res.status(503).json({ configured: false });
  const day = todayKST();
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

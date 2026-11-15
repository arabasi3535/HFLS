// 「한국소방안전원 영상」 — 최신 업로드 + 업무 분류별 재생목록(api/_kfsi.js)
//  · YouTube Data API(Vercel 환경변수 YT_API_KEY) playlistItems — 재생목록당 1~2단위
//  · Upstash Redis가 있으면 결과를 저장해 STALE_MIN 동안 재사용, 받지 못한 재생목록은 직전 목록 유지
//  · 응답은 CDN에도 1시간 캐시
const { configured, pipeline } = require("./_redis");
const KFSI = require("./_kfsi");

const KEY = "hfls:kfsi";
const STALE_MIN = 360; // 6시간 — 재생목록은 자주 바뀌지 않음
const LATEST = 12;
const MAX_PER_LIST = 100;
const TIMEOUT = 8000;

async function getJson(url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ac.signal });
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

/** 재생목록 영상(재생목록 순서 유지, 비공개·삭제 영상 제외) */
async function playlist(id, key, limit) {
  const out = [];
  let token = "";
  do {
    const n = Math.min(50, limit - out.length);
    const j = await getJson(
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails" +
        `&maxResults=${n}&playlistId=${encodeURIComponent(id)}&key=${encodeURIComponent(key)}` +
        (token ? `&pageToken=${token}` : "")
    );
    for (const it of j.items || []) {
      if (it.contentDetails && it.contentDetails.videoPublishedAt) out.push({ id: it.contentDetails.videoId, t: it.snippet.title, at: it.contentDetails.videoPublishedAt });
    }
    token = j.nextPageToken || "";
  } while (token && out.length < limit);
  return out;
}

async function collect(prev) {
  const key = process.env.YT_API_KEY || "";
  if (!key) throw new Error("YT_API_KEY 없음");
  const failed = [];
  const prevList = {};
  for (const r of (prev && prev.rows) || []) for (const l of r.lists) prevList[l.id] = r.videos.filter((v) => v.pl === l.id);
  const uploads = "UULF" + KFSI.id.slice(2);
  let latest;
  try {
    latest = (await playlist(uploads, key, LATEST)).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  } catch (e) {
    failed.push("latest");
    latest = (prev && prev.latest) || [];
  }
  const rows = [];
  for (const row of KFSI.rows) {
    const got = await Promise.all(
      row.lists.map(async ([id]) => {
        try {
          return (await playlist(id, key, MAX_PER_LIST)).map((v) => ({ ...v, pl: id }));
        } catch (e) {
          failed.push(id);
          return prevList[id] || [];
        }
      })
    );
    const seen = new Set();
    const videos = got.flat().filter((v) => !seen.has(v.id) && seen.add(v.id));
    rows.push({
      k: row.k,
      title: row.title,
      lists: row.lists.map(([id, title], i) => ({ id, title, n: got[i].length })),
      videos,
    });
  }
  return { at: new Date().toISOString(), channel: { id: KFSI.id, name: KFSI.name }, failed, latest, rows };
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();
  let prev = null;
  try {
    if (configured()) {
      const [raw] = await pipeline([["GET", KEY]]);
      prev = raw ? JSON.parse(raw) : null;
      if (prev && Date.now() - Date.parse(prev.at) < STALE_MIN * 60 * 1000) {
        res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
        return res.status(200).json({ ...prev, cached: true });
      }
    }
  } catch (e) {
    prev = null;
  }
  try {
    const data = await collect(prev);
    const total = 1 + KFSI.rows.reduce((s, r) => s + r.lists.length, 0);
    const allFailed = data.failed.length >= total;
    if (allFailed && prev) {
      res.setHeader("Cache-Control", "public, s-maxage=300");
      return res.status(200).json({ ...prev, stale: true });
    }
    if (!allFailed && configured()) {
      try {
        await pipeline([["SET", KEY, JSON.stringify(data)]]);
      } catch (e) {
        /* 저장 실패는 무시 */
      }
    }
    res.setHeader("Cache-Control", allFailed ? "public, s-maxage=300" : "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(allFailed ? 502 : 200).json(data);
  } catch (e) {
    if (prev) return res.status(200).json({ ...prev, stale: true });
    return res.status(500).json({ error: "kfsi", message: e.message, latest: [], rows: [] });
  }
};

// 「최신 소방 영상」 — 소방 기관 YouTube 채널의 최신 동영상(쇼츠 제외)을 모아 최신순으로 돌려줌
//  · 가져오는 곳: 각 채널의 「동영상」 재생목록(UULF…) — 쇼츠·실시간은 들어 있지 않음
//      1) Vercel 환경변수 YT_API_KEY가 있으면 YouTube Data API(playlistItems, 채널당 1단위)
//      2) 없으면 YouTube 공개 피드(feeds/videos.xml) — 키가 필요 없지만 가끔 404가 남
//  · 저장: Upstash Redis가 연결돼 있으면 결과를 저장해 두고 STALE_MIN 동안 재사용,
//          새로 받지 못한 채널은 직전에 받아 둔 목록을 그대로 씀(피드 장애 대비)
//  · 응답은 CDN에도 30분 캐시
const { configured, pipeline } = require("./_redis");
const { CHANNELS } = require("./_channels");

const KEY = "hfls:yt";
const STALE_MIN = 60; // 분
const PER_CH = 6; // 채널당 최신 6편
const TIMEOUT = 7000;

const uulf = (id) => "UULF" + id.slice(2);

async function get(url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { "User-Agent": "Mozilla/5.0 (hfls.vercel.app)" } });
    if (!r.ok) throw new Error(String(r.status));
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

const unxml = (s) =>
  String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, "&");

async function viaApi(ch, key) {
  const u =
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails" +
    `&maxResults=${PER_CH}&playlistId=${uulf(ch.id)}&key=${encodeURIComponent(key)}`;
  const j = JSON.parse(await get(u));
  return (j.items || [])
    .filter((it) => it.contentDetails && it.contentDetails.videoPublishedAt) // 비공개·삭제 영상 제외
    .map((it) => ({ id: it.contentDetails.videoId, t: it.snippet.title, at: it.contentDetails.videoPublishedAt }));
}

async function viaFeed(ch) {
  const x = await get(`https://www.youtube.com/feeds/videos.xml?playlist_id=${uulf(ch.id)}`);
  return x
    .split("<entry>")
    .slice(1)
    .map((e) => ({
      id: (e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1],
      t: unxml((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1]),
      at: (e.match(/<published>([^<]+)<\/published>/) || [])[1],
    }))
    .filter((v) => v.id && v.at)
    .slice(0, PER_CH);
}

async function collect(prev) {
  const key = process.env.YT_API_KEY || "";
  const prevBy = {};
  for (const v of (prev && prev.videos) || []) (prevBy[v.ch] = prevBy[v.ch] || []).push(v);
  const failed = [];
  const lists = await Promise.all(
    CHANNELS.map(async (ch) => {
      try {
        const vs = key ? await viaApi(ch, key) : await viaFeed(ch);
        return vs.map((v) => ({ ...v, ch: ch.id }));
      } catch (e) {
        failed.push(ch.id);
        return prevBy[ch.id] || [];
      }
    })
  );
  const seen = new Set();
  const videos = lists
    .flat()
    .filter((v) => !seen.has(v.id) && seen.add(v.id))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return { at: new Date().toISOString(), source: key ? "api" : "feed", failed, videos };
}

const publicChannels = () => CHANNELS.map(({ id, name, org, g, pin }) => ({ id, name, org, g, pin: !!pin }));

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();
  let prev = null;
  try {
    if (configured()) {
      const [raw] = await pipeline([["GET", KEY]]);
      prev = raw ? JSON.parse(raw) : null;
      if (prev && Date.now() - Date.parse(prev.at) < STALE_MIN * 60 * 1000) {
        res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
        return res.status(200).json({ ...prev, channels: publicChannels(), cached: true });
      }
    }
  } catch (e) {
    prev = null;
  }
  try {
    const data = await collect(prev);
    const allFailed = data.failed.length === CHANNELS.length;
    if (allFailed && prev) {
      res.setHeader("Cache-Control", "public, s-maxage=300");
      return res.status(200).json({ ...prev, channels: publicChannels(), stale: true });
    }
    if (!allFailed && configured()) {
      try {
        await pipeline([["SET", KEY, JSON.stringify(data)]]);
      } catch (e) {
        /* 저장 실패는 무시 */
      }
    }
    res.setHeader("Cache-Control", allFailed ? "public, s-maxage=300" : "public, s-maxage=1800, stale-while-revalidate=86400");
    return res.status(allFailed ? 502 : 200).json({ ...data, channels: publicChannels() });
  } catch (e) {
    return res.status(500).json({ error: "videos", channels: publicChannels(), videos: [] });
  }
};

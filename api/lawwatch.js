// 법령 개정 감시 — 소방 관계 법령(법률·시행령·시행규칙)과 NFPC·NFTC의 현행 시행일을 모아 돌려줌
//  · 화면(src/components/LawWatch.js)이 앱에 반영된 기준일(src/law/lawBase.js)과 비교해
//    더 늦은 시행일(=앱 반영 확인 전 개정)이 있으면 맨 위에 알림 띠를 띄움
//  · 시행예정(공포 후 아직 시행 전) 법령도 가능하면 함께 받음(target=eflaw, nw=2 — 받지 못하면 생략)
//  · 저장: Upstash Redis에 12시간 보관 후 새로 받음(하루 2번 이하 호출) · CDN 1시간 캐시
const { configured, pipeline } = require("./_redis");
const { oc, lawJson, arr } = require("./_law");

const KEY = "hfls:lawwatch";
const STALE_MIN = 720;
const V = 2; // 응답 형식 버전 — 바뀌면 저장해 둔 목록을 버리고 새로 받음(2: 법령일련번호 mst 추가)
const LAWS = [
  "소방시설 설치 및 관리에 관한 법률",
  "화재의 예방 및 안전관리에 관한 법률",
  "소방시설공사업법",
  "소방기본법",
  "다중이용업소의 안전관리에 관한 특별법",
  "위험물안전관리법",
];
const STDS = ["화재안전성능기준", "화재안전기술기준"];
const ymd = (s) => {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(String(s || "").replace(/\D/g, ""));
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
};
const isStd = (n) => /\((NFPC|NFTC)\s*\d/.test(n);

async function collect() {
  const items = [];
  const upcoming = [];
  const failed = [];
  await Promise.all(
    LAWS.map(async (q) => {
      try {
        const j = await lawJson("lawSearch.do", { target: "law", query: q, display: "20" });
        for (const x of arr(j.LawSearch && j.LawSearch.law)) {
          const n = String(x["법령명한글"] || "");
          if (!n.startsWith(q)) continue;
          items.push({ n, k: x["법령구분명"], eff: ymd(x["시행일자"]), pub: ymd(x["공포일자"]), no: x["공포번호"], why: x["제개정구분명"], t: "law", mst: x["법령일련번호"] });
        }
      } catch (e) {
        failed.push(q);
      }
      try {
        const j = await lawJson("lawSearch.do", { target: "eflaw", query: q, nw: "2", display: "20" });
        for (const x of arr(j.LawSearch && j.LawSearch.law)) {
          const n = String(x["법령명한글"] || "");
          if (!n.startsWith(q)) continue;
          upcoming.push({ n, k: x["법령구분명"], eff: ymd(x["시행일자"]), pub: ymd(x["공포일자"]), no: x["공포번호"], why: x["제개정구분명"], t: "law", mst: x["법령일련번호"] });
        }
      } catch (e) {
        /* 시행예정 목록은 받지 못하면 생략 */
      }
    })
  );
  await Promise.all(
    STDS.map(async (q) => {
      try {
        const j = await lawJson("lawSearch.do", { target: "admrul", query: q, display: "100" });
        for (const x of arr(j.AdmRulSearch && j.AdmRulSearch.admrul)) {
          const n = String(x["행정규칙명"] || "");
          if (!isStd(n)) continue;
          items.push({ n, k: x["행정규칙종류"], eff: ymd(x["시행일자"]), pub: ymd(x["발령일자"]), no: x["발령번호"], why: x["제개정구분명"], t: "admrul", seq: x["행정규칙일련번호"] });
        }
      } catch (e) {
        failed.push(q);
      }
    })
  );
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const seen = new Set();
  return {
    v: V,
    at: new Date().toISOString(),
    failed,
    items,
    upcoming: upcoming.filter((u) => u.eff > today && !seen.has(u.n + u.eff) && seen.add(u.n + u.eff)),
  };
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (!oc()) return res.status(503).json({ ok: false, error: "LAW_OC 없음" });
  let prev = null;
  try {
    if (configured()) {
      const [raw] = await pipeline([["GET", KEY]]);
      prev = raw ? JSON.parse(raw) : null;
      if (prev && prev.v === V && Date.now() - Date.parse(prev.at) < STALE_MIN * 60 * 1000) {
        res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
        return res.status(200).json({ ok: true, ...prev, cached: true });
      }
    }
  } catch (e) {
    prev = null;
  }
  try {
    const data = await collect();
    const bad = !data.items.length;
    if (bad && prev) {
      res.setHeader("Cache-Control", "public, s-maxage=300");
      return res.status(200).json({ ok: true, ...prev, stale: true });
    }
    if (!bad && configured()) {
      try {
        await pipeline([["SET", KEY, JSON.stringify(data)]]);
      } catch (e) {
        /* 저장 실패는 무시 */
      }
    }
    res.setHeader("Cache-Control", bad ? "no-store" : "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(bad ? 502 : 200).json({ ok: !bad, ...data });
  } catch (e) {
    if (prev) return res.status(200).json({ ok: true, ...prev, stale: true });
    return res.status(500).json({ ok: false, error: "lawwatch" });
  }
};

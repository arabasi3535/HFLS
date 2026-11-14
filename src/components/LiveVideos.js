import { useEffect, useMemo, useState } from "react";

// ============================================================
// 기타 자료 › 영상 자료 › 최신 소방 영상
//  소방청·시도 소방본부·소방서 YouTube 채널의 최신 동영상(쇼츠 제외)을 /api/videos에서 받아 최신순 표시
//  채널 목록: api/_channels.js — pin 채널(119안방)은 맨 위 별도 줄
// ============================================================

const STEP = 12;
const GROUPS = ["소방청", "본부", "소방서"];
const GROUP_NAME = { 소방청: "소방청·소속기관", 본부: "시·도 소방본부", 소방서: "소방서" };

/** ISO 시각 → 「3시간 전」 */
export function ago(at, now = Date.now()) {
  const s = Math.max(0, (now - Date.parse(at)) / 1000);
  if (!isFinite(s)) return "";
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}일 전`;
  if (s < 86400 * 30) return `${Math.floor(s / (86400 * 7))}주 전`;
  if (s < 86400 * 365) return `${Math.floor(s / (86400 * 30))}개월 전`;
  return `${Math.floor(s / (86400 * 365))}년 전`;
}

const hhmm = (at) => {
  const d = new Date(at);
  return isNaN(d) ? "" : `${d.getMonth() + 1}.${d.getDate()}. ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

function Card({ v, ch, on, onPlay }) {
  return (
    <button type="button" className={`vd-card ${on ? "on" : ""}`} onClick={() => onPlay(v, ch)}>
      <span className="vd-thumb">
        <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" loading="lazy" />
      </span>
      <span className="vd-t">{v.t}</span>
      <span className="lv-m">
        {ch ? ch.name : ""} · {ago(v.at)}
      </span>
    </button>
  );
}

export default function LiveVideos({ playing, onPlay }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [ch, setCh] = useState("all");
  const [n, setN] = useState(STEP);

  useEffect(() => {
    let alive = true;
    fetch("/api/videos")
      .then((r) => r.json().catch(() => ({})))
      .then((j) => {
        if (!alive) return;
        if (j && Array.isArray(j.videos) && j.videos.length) setData(j);
        else {
          setData(j && j.channels ? j : null);
          setErr("지금은 최신 영상 목록을 받지 못했습니다. 잠시 뒤 다시 열어 주세요.");
        }
      })
      .catch(() => alive && setErr("최신 영상 목록을 불러오지 못했습니다(인터넷 연결 확인)."));
    return () => {
      alive = false;
    };
  }, []);

  const chBy = useMemo(() => Object.fromEntries(((data && data.channels) || []).map((c) => [c.id, c])), [data]);
  const pins = ((data && data.channels) || []).filter((c) => c.pin);
  const vids = (data && data.videos) || [];
  const list = ch === "all" ? vids.filter((v) => !(chBy[v.ch] && chBy[v.ch].pin)) : vids.filter((v) => v.ch === ch);

  return (
    <div className="lv">
      <div className="lv-head">
        <div>
          <b>최신 소방 영상</b>
          <p>
            소방청·시도 소방본부·소방서 공식 YouTube 채널의 새 영상을 모아 최신순으로 보여 줍니다(쇼츠 제외). 누르면 YouTube
            공식 플레이어로 이 화면에서 재생됩니다.
          </p>
        </div>
        {data && data.channels && (
          <select
            value={ch}
            onChange={(e) => {
              setCh(e.target.value);
              setN(STEP);
            }}
            aria-label="채널 선택"
          >
            <option value="all">전체 채널</option>
            {GROUPS.map((g) => (
              <optgroup key={g} label={GROUP_NAME[g]}>
                {data.channels
                  .filter((c) => c.g === g)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.pin ? "📌 " : ""}
                      {c.name}
                      {c.name !== c.org ? ` (${c.org})` : ""}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        )}
      </div>

      {!data && !err && <div className="lv-msg">최신 영상을 불러오는 중…</div>}
      {err && <div className="lv-msg">{err}</div>}

      {ch === "all" &&
        pins.map((p) => {
          const pv = vids.filter((v) => v.ch === p.id).slice(0, 4);
          if (!pv.length) return null;
          return (
            <div key={p.id} className="lv-pin">
              <div className="lv-pin-h">
                <em className="lv-badge">📌 상단 고정</em>
                <b>{p.name}</b> <span>{p.org} · 다른 채널 새 영상과 관계없이 항상 맨 위에 표시</span>
                <a href={`https://www.youtube.com/channel/${p.id}`} target="_blank" rel="noopener noreferrer">
                  채널 열기
                </a>
              </div>
              <div className="vd-grid">
                {pv.map((v) => (
                  <Card key={v.id} v={v} ch={p} on={playing === v.id} onPlay={onPlay} />
                ))}
              </div>
            </div>
          );
        })}

      {list.length > 0 && (
        <>
          {ch !== "all" && chBy[ch] && (
            <div className="lv-pin-h">
              <b>{chBy[ch].name}</b> <span>{chBy[ch].org}</span>
              <a href={`https://www.youtube.com/channel/${ch}`} target="_blank" rel="noopener noreferrer">
                채널 열기
              </a>
            </div>
          )}
          <div className="vd-grid">
            {list.slice(0, n).map((v) => (
              <Card key={v.id} v={v} ch={chBy[v.ch]} on={playing === v.id} onPlay={onPlay} />
            ))}
          </div>
          {list.length > n && (
            <button type="button" className="w-reset lv-more" onClick={() => setN(n + STEP)}>
              더 보기 ({list.length - n}편 더)
            </button>
          )}
        </>
      )}
      {data && ch !== "all" && list.length === 0 && <div className="lv-msg">이 채널의 최근 동영상을 받지 못했습니다.</div>}

      {data && data.at && (
        <div className="w-hint">
          목록 갱신 {hhmm(data.at)}
          {data.stale ? " (새 목록을 받지 못해 이전 목록 표시)" : ""} · 약 1시간 간격으로 새로 받음 · 외부 기관 영상으로 내용은 각
          기관이 책임지며 이 앱이 검증하지 않음
        </div>
      )}
    </div>
  );
}

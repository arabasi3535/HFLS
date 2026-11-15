import { useEffect, useRef, useState } from "react";
import { ago } from "./LiveVideos";

// ============================================================
// 기타 자료 › 영상 자료 › 한국소방안전원 영상
//  첫 줄: 최신 업로드(쇼츠 제외) · 다음 줄부터: 업무 분류별 재생목록 (서버 /api/kfsi, 분류는 api/_kfsi.js)
//  각 줄은 가로로 넘겨 보기, 재생목록이 여럿인 줄은 재생목록 버튼으로 골라 보기
// ============================================================
const CH = { id: "UCxxWnGhFgJOzsNOwYSHN5cQ", name: "한국소방안전원", org: "한국소방안전원" };

function Strip({ videos, playing, onPlay, meta }) {
  const ref = useRef(null);
  const by = (d) => ref.current && ref.current.scrollBy({ left: d * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <div className="kf-wrap">
      <button type="button" className="kf-nav l" aria-label="이전 영상" onClick={() => by(-1)}>
        ‹
      </button>
      <div className="kf-strip" ref={ref}>
        {videos.map((v) => (
          <button key={v.id} type="button" className={`vd-card kf-card ${playing === v.id ? "on" : ""}`} onClick={() => onPlay(v, CH)}>
            <span className="vd-thumb">
              <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" loading="lazy" />
            </span>
            <span className="vd-t">{v.t}</span>
            <span className="lv-m">{meta(v)}</span>
          </button>
        ))}
      </div>
      <button type="button" className="kf-nav r" aria-label="다음 영상" onClick={() => by(1)}>
        ›
      </button>
    </div>
  );
}

function Row({ row, playing, onPlay }) {
  const [pl, setPl] = useState("all");
  const name = Object.fromEntries(row.lists.map((l) => [l.id, l.title]));
  const vids = pl === "all" ? row.videos : row.videos.filter((v) => v.pl === pl);
  if (!row.videos.length) return null;
  return (
    <div className="kf-row">
      <div className="kf-h">
        <b>{row.title}</b> <span>{row.videos.length}편</span>
      </div>
      {row.lists.filter((l) => l.n).length > 1 && (
        <div className="kf-pls">
          <button type="button" className={`qa-chip ${pl === "all" ? "on" : ""}`} onClick={() => setPl("all")}>
            전체
          </button>
          {row.lists
            .filter((l) => l.n)
            .map((l) => (
              <button key={l.id} type="button" className={`qa-chip ${pl === l.id ? "on" : ""}`} onClick={() => setPl(l.id)}>
                {l.title} {l.n}
              </button>
            ))}
        </div>
      )}
      <Strip videos={vids} playing={playing} onPlay={onPlay} meta={(v) => name[v.pl] || ""} />
    </div>
  );
}

export default function KfsiVideos({ playing, onPlay }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let alive = true;
    fetch("/api/kfsi")
      .then((r) => r.json().catch(() => ({})))
      .then((j) => {
        if (!alive) return;
        if (j && ((j.latest && j.latest.length) || (j.rows && j.rows.some((r) => r.videos.length)))) setData(j);
        else setErr("지금은 한국소방안전원 영상 목록을 받지 못했습니다. 잠시 뒤 다시 열어 주세요.");
      })
      .catch(() => alive && setErr("한국소방안전원 영상 목록을 불러오지 못했습니다(인터넷 연결 확인)."));
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div className="lv kf">
      <div className="lv-head">
        <div>
          <b>한국소방안전원 영상</b>
          <p>첫 줄은 최근 올라온 영상, 그 아래는 소방시설 점검·위험물 점검 등 업무별로 묶은 재생목록입니다. 줄마다 옆으로 넘겨 보세요.</p>
        </div>
        <a className="w-run vd-ch" href={`https://www.youtube.com/channel/${CH.id}`} target="_blank" rel="noopener noreferrer">
          ▶ 채널 열기
        </a>
      </div>
      {!data && !err && <div className="lv-msg">영상 목록을 불러오는 중…</div>}
      {err && <div className="lv-msg">{err}</div>}
      {data && data.latest && data.latest.length > 0 && (
        <div className="kf-row">
          <div className="kf-h">
            <b>최신 업로드</b> <span>최근 {data.latest.length}편</span>
          </div>
          <Strip videos={data.latest} playing={playing} onPlay={onPlay} meta={(v) => ago(v.at)} />
        </div>
      )}
      {data && (data.rows || []).map((r) => <Row key={r.k} row={r} playing={playing} onPlay={onPlay} />)}
    </div>
  );
}

import { useState } from "react";
import { CHANNEL, VIDEOS, VIDEO_CATS } from "../law/videos";

// ============================================================
// 영상 자료 탭 — 채널 영상 목록, 누르면 이 화면에서 재생(youtube-nocookie)
// ============================================================
export default function VideoTab({ onGo }) {
  const [cat, setCat] = useState("");
  const [play, setPlay] = useState(null);
  const list = VIDEOS.filter((v) => !cat || v.cat === cat);
  const cur = VIDEOS.find((v) => v.id === play);
  return (
    <div className="vd">
      <div className="vd-head">
        <div>
          <b>영상 자료</b>
          <p>소방시설 법령 적용·기준을 짧게 정리한 영상입니다. 영상을 누르면 이 화면에서 바로 볼 수 있습니다.</p>
        </div>
        <a className="w-run vd-ch" href={CHANNEL.url} target="_blank" rel="noopener noreferrer">
          ▶ {CHANNEL.name} 채널 열기
        </a>
      </div>
      {cur && (
        <div className="vd-player">
          <div className="vd-frame">
            <iframe
              key={cur.id}
              src={`https://www.youtube-nocookie.com/embed/${cur.id}?autoplay=1&rel=0`}
              title={cur.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="vd-now">
            <b>{cur.title}</b>
            <span>
              {cur.go && onGo && (
                <button type="button" className="w-reset" onClick={() => onGo(cur.go[0], cur.go[1])}>
                  앱에서 해 보기: {cur.go[2]} →
                </button>
              )}
              <a className="w-link" href={`https://www.youtube.com/watch?v=${cur.id}`} target="_blank" rel="noopener noreferrer">
                YouTube에서 보기
              </a>
              <button type="button" className="w-link" onClick={() => setPlay(null)}>
                닫기
              </button>
            </span>
          </div>
        </div>
      )}
      <nav className="tl-tabs vd-cats">
        {["", ...VIDEO_CATS].map((c) => (
          <button key={c || "all"} type="button" className={cat === c ? "on" : ""} onClick={() => setCat(c)}>
            {c || `전체 ${VIDEOS.length}`}
          </button>
        ))}
      </nav>
      <div className="vd-grid">
        {list.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`vd-card ${play === v.id ? "on" : ""}`}
            onClick={() => {
              setPlay(v.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span className="vd-thumb">
              <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" loading="lazy" />
              <i>{v.dur}</i>
            </span>
            <span className="vd-cat">{v.cat}</span>
            <span className="vd-t">{v.title}</span>
          </button>
        ))}
      </div>
      <div className="w-hint">영상은 YouTube에서 재생되며, 이 앱은 시청 정보를 저장하지 않습니다.</div>
    </div>
  );
}

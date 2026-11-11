import { useState } from "react";
import { CHANNEL, VIDEOS, THUMB_REV } from "../law/videos";
import { VIDEO_DESC } from "../law/videoDesc";

// ============================================================
// 기타 자료 › 영상 자료 — 채널 영상 목록, 누르면 이 화면에서 재생(youtube-nocookie)
//  영상 아래에 YouTube 설명란(「…더보기」) 전문을 그대로 표시
// ============================================================

/** **굵게** 표시만 살리고 나머지는 글자 그대로 */
function Bold({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p));
}
function Desc({ text }) {
  if (!text) return <div className="vd-desc-t vd-desc-none">설명이 아직 등록되지 않았습니다.</div>;
  return (
    <div className="vd-desc-t">
      {text.split("\n").map((l, i) =>
        /^-{10,}$/.test(l.trim()) ? (
          <hr key={i} />
        ) : /^#\S/.test(l.trim()) ? (
          <div key={i} className="vd-tags">
            {l}
          </div>
        ) : (
          <div key={i} className={l.trim() ? "" : "vd-gap"}>
            <Bold text={l} />
          </div>
        )
      )}
    </div>
  );
}
export default function VideoTab({ onGo }) {
  const [play, setPlay] = useState(null);
  const cur = VIDEOS.find((v) => v.id === play);
  return (
    <div className="vd">
      <div className="vd-head">
        <div>
          <b>영상 자료</b>
          <p>소방시설 법령 적용·기준을 짧게 정리한 영상입니다. 영상을 누르면 이 화면에서 재생되고, 아래에 근거 법령과 자세한 설명이 함께 나옵니다.</p>
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
              <button type="button" className="w-link" onClick={() => setPlay(null)}>
                닫기
              </button>
            </span>
          </div>
          <div className="vd-desc">
            <div className="vd-desc-h">영상 설명</div>
            <Desc text={VIDEO_DESC[cur.id]} />
          </div>
        </div>
      )}
      <div className="vd-grid">
        {VIDEOS.map((v) => (
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
              <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg?v=${THUMB_REV}`} alt="" loading="lazy" />
              <i>{v.dur}</i>
            </span>
            <span className="vd-t">{v.title}</span>
          </button>
        ))}
      </div>
      <div className="w-hint">영상은 YouTube에서 재생되며, 이 앱은 시청 정보를 저장하지 않습니다.</div>
    </div>
  );
}

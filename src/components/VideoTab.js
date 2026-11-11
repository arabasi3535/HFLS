import { useState } from "react";
import { CHANNEL, VIDEOS, THUMB_REV } from "../law/videos";

// ============================================================
// 기타 자료 › 영상 자료 — 채널 영상 목록, 누르면 이 화면에서 재생(youtube-nocookie)
// ============================================================
export default function VideoTab({ onGo }) {
  const [play, setPlay] = useState(null);
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
      <div className="vd-more">
        <b>📌 자세한 설명은 YouTube 설명란의 「…더보기」에 있습니다.</b>
        <span>근거 법령·조항, 적용 기준일, 세부 내용은 영상마다 설명란에 정리해 두었습니다. 「YouTube에서 설명란 보기」를 눌러 「…더보기」를 펼쳐 확인하십시오.</span>
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
              <a className="w-run vd-desc" href={`https://www.youtube.com/watch?v=${cur.id}`} target="_blank" rel="noopener noreferrer">
                YouTube에서 설명란 보기(더보기) →
              </a>
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

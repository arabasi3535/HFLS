import { useState } from "react";
import { CHANNEL, VIDEOS, THUMB_REV } from "../law/videos";
import { VIDEO_DESC } from "../law/videoDesc";
import LiveVideos from "./LiveVideos";

// ============================================================
// 기타 자료 › 영상 자료 — 채널 영상 목록, 누르면 이 화면에서 재생(youtube-nocookie)
//  영상 아래에 YouTube 설명란(「…더보기」) 전문을 그대로 표시
//  위쪽 「최신 소방 영상」(LiveVideos)은 소방 기관 채널 영상 — 설명란은 싣지 않고 원 영상 링크만
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
  // play: { id, title, own(재후준 영상), go, ch(외부 채널) }
  const [play, setPlay] = useState(null);
  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const playOwn = (v) => {
    setPlay({ id: v.id, title: v.title, own: true, go: v.go });
    top();
  };
  const playExt = (v, ch) => {
    setPlay({ id: v.id, title: v.t, own: false, ch });
    top();
  };
  return (
    <div className="vd">
      {play && (
        <div className="vd-player">
          <div className="vd-frame">
            <iframe
              key={play.id}
              src={`https://www.youtube-nocookie.com/embed/${play.id}?autoplay=1&rel=0`}
              title={play.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="vd-now">
            <b>{play.title}</b>
            <span>
              {play.go && onGo && (
                <button type="button" className="w-reset" onClick={() => onGo(play.go[0], play.go[1])}>
                  앱에서 해 보기: {play.go[2]} →
                </button>
              )}
              {!play.own && (
                <a
                  className="w-link"
                  href={`https://www.youtube.com/watch?v=${play.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setPlay(null)}
                >
                  YouTube에서 보기
                </a>
              )}
              <button type="button" className="w-link" onClick={() => setPlay(null)}>
                닫기
              </button>
            </span>
          </div>
          {play.own ? (
            <div className="vd-desc">
              <div className="vd-desc-h">영상 설명</div>
              <Desc text={VIDEO_DESC[play.id]} />
            </div>
          ) : (
            <div className="vd-desc lv-ext">
              {play.ch ? `${play.ch.org}${play.ch.name !== play.ch.org ? ` 「${play.ch.name}」` : ""} 채널 영상입니다. ` : ""}
              영상 설명과 댓글은 「YouTube에서 보기」로 확인하세요(누르면 이 화면의 재생은 멈춥니다). 재생이 안 되는 영상은 채널이
              외부 재생을 막아 둔 경우입니다.
            </div>
          )}
        </div>
      )}

      <LiveVideos playing={play && play.id} onPlay={playExt} />

      <div className="vd-head">
        <div>
          <b>재후준 영상</b>
          <p>소방시설 법령 적용·기준을 짧게 정리한 영상입니다. 영상을 누르면 이 화면에서 재생되고, 아래에 근거 법령과 자세한 설명이 함께 나옵니다.</p>
        </div>
        <a className="w-run vd-ch" href={CHANNEL.url} target="_blank" rel="noopener noreferrer">
          ▶ {CHANNEL.name} 채널 열기
        </a>
      </div>
      <div className="vd-grid">
        {VIDEOS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`vd-card ${play && play.id === v.id ? "on" : ""}`}
            onClick={() => playOwn(v)}
          >
            <span className="vd-thumb">
              <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg?v=${THUMB_REV}`} alt="" loading="lazy" />
              <i>{v.dur}</i>
            </span>
            <span className="vd-t">{v.title}</span>
          </button>
        ))}
      </div>
      <div className="w-hint">영상은 YouTube 공식 플레이어(youtube-nocookie.com)로 재생되며, 이 앱은 시청 정보를 저장하지 않습니다.</div>
    </div>
  );
}

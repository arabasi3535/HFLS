import { useEffect } from "react";
import { PROFILE } from "../law/profile";

// ============================================================
// 제작자 정보 창 — 머리말·바닥글의 제작자 이름을 누르면 열림
// ============================================================
export default function ProfileModal({ onClose }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const P = PROFILE;
  return (
    <div className="modal-bg no-print" onClick={onClose}>
      <div className="modal pf" role="dialog" aria-modal="true" aria-label="제작자 정보" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <b>제작자 정보</b>
          <button type="button" className="modal-x" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <div className="pf-who">
          <div className="pf-name">{P.name}</div>
          <div className="pf-org">{P.org}</div>
          <a className="pf-mail" href={`mailto:${P.email}`}>
            ✉ {P.email}
          </a>
        </div>
        <p className="pf-intro">{P.intro}</p>
        {P.sections.map((s) => (
          <section key={s.k} className="pf-sec">
            <h4>{s.title}</h4>
            {s.items.length === 0 ? (
              <div className="pf-empty">{s.empty || "준비 중입니다."}</div>
            ) : (
              <ul>
                {s.items.map((it) => (
                  <li key={it.t}>
                    {it.dl ? (
                      <a href={it.dl} download={it.file || true} className="pf-dl">
                        {it.t} <span>⬇ 내려받기</span>
                      </a>
                    ) : it.url ? (
                      <a href={it.url} target="_blank" rel="noopener noreferrer">
                        {it.t}
                      </a>
                    ) : (
                      <b>{it.t}</b>
                    )}
                    {it.state && <em className="pf-state">{it.state}</em>}
                    {(it.note || it.j) && <span className="pf-note"> — {[it.j, it.y, it.note].filter(Boolean).join(" · ")}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

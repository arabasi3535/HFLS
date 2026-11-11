import { useEffect, useState } from "react";
import VideoTab from "./VideoTab";
import PaperTab from "./PaperTab";

// ============================================================
// 기타 자료 탭 — 하위 탭으로 자료 종류를 늘려 감(현재: 영상 자료·논문 자료)
//  새 자료: SUBS에 [id, 이름] 추가하고 아래에 화면 연결
// ============================================================
const KEY = "hfls_etc_sub";
const SUBS = [
  ["video", "영상 자료"],
  ["paper", "논문 자료"],
];

export default function EtcTab({ onGo }) {
  const [sub, setSub] = useState(() => {
    try {
      const v = localStorage.getItem(KEY);
      return SUBS.some((s) => s[0] === v) ? v : SUBS[0][0];
    } catch (e) {
      return SUBS[0][0];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(KEY, sub);
    } catch (e) {
      /* 저장 불가 환경 */
    }
  }, [sub]);
  return (
    <div className="etc">
      <nav className="tl-tabs">
        {SUBS.map(([k, l]) => (
          <button key={k} type="button" className={sub === k ? "on" : ""} onClick={() => setSub(k)}>
            {l}
          </button>
        ))}
      </nav>
      {sub === "video" && <VideoTab onGo={onGo} />}
      {sub === "paper" && <PaperTab />}
    </div>
  );
}

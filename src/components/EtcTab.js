import { useEffect, useState } from "react";
import VideoTab from "./VideoTab";
import PaperTab from "./PaperTab";
import LawTab from "./LawTab";
import QaTab from "./QaTab";
import LawHistTab from "./LawHistTab";
import LawTimelineTab from "./LawTimelineTab";
import { GuideTab, SiteTab, PracticeTab } from "./RefLinksTab";

// ============================================================
// 기타 자료 탭 — 하위 탭으로 자료 종류를 늘려 감(현재: 영상 자료·법령 자료·법령 연혁(연혁법 찾기 + 법령 체계·개정 연혁)·질의회신·해설서·매뉴얼·논문 자료·관련 사이트·실무 자료)
//  새 자료: SUBS에 [id, 이름] 추가하고 아래에 화면 연결
// ============================================================
const KEY = "hfls_etc_sub";
const SUBS = [
  ["video", "영상 자료"],
  ["law", "법령 자료"],
  ["lawhist", "법령 연혁"],
  ["qa", "질의회신"],
  ["guide", "해설서·매뉴얼"],
  ["paper", "논문 자료"],
  ["site", "관련 사이트"],
  ["practice", "실무 자료"],
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
      <nav className="grp-tabs" role="tablist">
        {SUBS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={sub === k} className={sub === k ? "on" : ""} onClick={() => setSub(k)}>
            {l}
          </button>
        ))}
      </nav>
      {sub === "video" && <VideoTab onGo={onGo} />}
      {sub === "law" && <LawTab onHist={() => setSub("lawhist")} />}
      {sub === "lawhist" && (
        <div className="lt-merge">
          <LawHistTab />
          <LawTimelineTab />
        </div>
      )}
      {sub === "qa" && <QaTab />}
      {sub === "guide" && <GuideTab />}
      {sub === "paper" && <PaperTab />}
      {sub === "site" && <SiteTab />}
      {sub === "practice" && <PracticeTab />}
    </div>
  );
}

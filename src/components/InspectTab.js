import { lazy, Suspense, useEffect } from "react";
import { INSP_SUBS, INSP_KEY } from "./inspectSub";

// 점검 탭 — 자체점검 보고서 · 위험물 정기점검 · 다중이용업 세부점검을 하위 탭으로 묶음(v2.33.5)
//  · 하위 탭은 열 때만 불러옴(첫 접속 속도)
//  · 고른 하위 탭은 브라우저에 기억(hfls_insp_sub)
const SelfInspection = lazy(() => import("./SelfInspection"));
const WmInspection = lazy(() => import("./WmInspection"));
const MuInspection = lazy(() => import("./MuInspection"));

export default function InspectTab({ sub, onSub, seed, onGoExisting }) {
  useEffect(() => {
    try {
      localStorage.setItem(INSP_KEY, sub);
    } catch (e) {
      /* 저장 불가 환경 */
    }
  }, [sub]);
  return (
    <div className="etc">
      <nav className="grp-tabs" role="tablist">
        {INSP_SUBS.map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={sub === k}
            className={sub === k ? "on" : ""}
            onClick={() => onSub(k)}
          >
            {l}
          </button>
        ))}
      </nav>
      <Suspense fallback={<div className="empty">불러오는 중…</div>}>
        {sub === "self" && (
          <SelfInspection seed={seed} onGoExisting={onGoExisting} />
        )}
        {sub === "wm" && <WmInspection />}
        {sub === "mu" && <MuInspection />}
      </Suspense>
    </div>
  );
}

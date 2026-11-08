import { useEffect, useState } from "react";
import InspectionReport, { loadReport } from "./InspectionReport";
import { VARIANTS } from "../law/report";

// ============================================================
// 자체점검 보고서 탭 — 작동점검(관계인) · 작동점검(관리업) · 종합점검(최초점검) · 종합점검(그 밖의 종합점검)
// 보고서마다 입력값을 따로 저장하고, 다른 보고서의 대상물 정보를 가져올 수 있음
// ============================================================

const KEY = "hfls_selfinsp_sub";
const SUBS = Object.values(VARIANTS);

export default function SelfInspection({ seed, onGoExisting }) {
  const [sub, setSub] = useState(() => {
    try {
      return (seed && (seed.variant || "owner")) || localStorage.getItem(KEY) || "owner";
    } catch (e) {
      return "owner";
    }
  });
  useEffect(() => {
    if (seed && seed.at) setSub(VARIANTS[seed.variant] ? seed.variant : "owner");
  }, [seed]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, sub);
    } catch (e) {
      /* 저장 불가 */
    }
  }, [sub]);
  return (
    <div className="si">
      <nav className="tl-tabs no-print">
        {SUBS.map((v) => (
          <button key={v.id} type="button" className={sub === v.id ? "on" : ""} onClick={() => setSub(v.id)}>
            {v.tab}
          </button>
        ))}
      </nav>
      <InspectionReport key={sub} variant={sub} seed={seed && (seed.variant || "owner") === sub ? seed : null} onGoExisting={onGoExisting} onCopyFrom={(id) => loadReport(id)} />
    </div>
  );
}

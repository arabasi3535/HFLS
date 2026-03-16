import { useState } from "react";
import { LAW_ERAS, BUILDING_TYPES, getEraByDate, getRequirements } from "./data";

const CATS = ["소화설비", "경보설비", "피난구조설비", "소화용수설비", "소화활동설비"];
const CAT_COLORS = {
  "소화설비": "#ef4444", "경보설비": "#f59e0b",
  "피난구조설비": "#3b82f6", "소화용수설비": "#06b6d4", "소화활동설비": "#8b5cf6"
};
const CAT_ICONS = {
  "소화설비": "🧯", "경보설비": "🔔",
  "피난구조설비": "🚪", "소화용수설비": "💧", "소화활동설비": "🚒"
};

const Badge = ({ label, color }) => (
  <span style={{ fontSize: 10, background: color, color: "#fff", borderRadius: 3, padding: "1px 6px", fontWeight: 700, marginLeft: 4 }}>{label}</span>
);

function Field({ label, req, opt, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "flex", alignItems: "center" }}>
        {label}
        {req && <Badge label="필수" color="#dc2626" />}
        {opt && <Badge label="선택" color="#64748b" />}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8,
  padding: "9px 11px", fontSize: 13, boxSizing: "border-box",
  outline: "none", fontFamily: "inherit"
};

function ReqCard({ r, catColor }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 13px", marginBottom: 6, borderLeft: "3px solid " + catColor }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>✅ {r.name}</span>
        <span style={{ fontSize: 10, background: "#16a34a", color: "#fff", borderRadius: 4, padding: "2px 7px", whiteSpace: "nowrap", flexShrink: 0 }}>{r.std}</span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>적용조건: {r.cond}</div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>근거: {r.art}</div>
      {r.note && <div style={{ fontSize: 11, color: "#1d4ed8", background: "#eff6ff", borderRadius: 4, padding: "3px 8px", marginTop: 4 }}>📌 {r.note}</div>}
      {r.warn && <div style={{ fontSize: 11, color: "#b91c1c", background: "#fef2f2", borderRadius: 4, padding: "4px 8px", marginTop: 4 }}>⚠️ {r.warn}</div>}
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState({
    approvalDate: "", buildingType: "", totalArea: "", groundFloors: "",
    basementFloors: "", occupants: "", hasExt: false,
    extDate: "", extArea: "", extFloors: "", extFirewall: false
  });
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState(0);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.approvalDate) e.approvalDate = "필수 입력";
    if (!form.buildingType) e.buildingType = "필수 선택";
    if (!form.totalArea || parseFloat(form.totalArea) <= 0) e.totalArea = "필수 입력";
    if (!form.groundFloors || parseInt(form.groundFloors) <= 0) e.groundFloors = "필수 입력";
    if (form.hasExt && !form.extDate) e.extDate = "필수 입력";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const analyze = () => {
    if (!validate()) return;
    const era = getEraByDate(form.approvalDate);
    if (!era) { setErrors({ approvalDate: "1958년 3월 11일 이후 날짜를 입력하세요" }); return; }
    const area = parseFloat(form.totalArea) || 0;
    const gf = parseInt(form.groundFloors) || 0;
    const bf = parseInt(form.basementFloors) || 0;
    const occ = parseInt(form.occupants) || 0;
    const reqs = getRequirements(form.buildingType, area, gf, bf, occ, era.id);
    const curReqs = getRequirements(form.buildingType, area, gf, bf, occ, "era3d");
    let ext = null;
    if (form.hasExt && form.extDate) {
      const extEra = getEraByDate(form.extDate);
      if (extEra) {
        const ea = parseFloat(form.extArea) || 0;
        const ef = parseInt(form.extFloors) || 0;
        ext = {
          era: extEra,
          reqs: getRequirements(form.buildingType, ea, ef, bf, occ, extEra.id),
          area: ea, floors: ef, firewall: form.extFirewall
        };
      }
    }
    setResult({ era, reqs, curReqs, ext, area, gf, bf, form: { ...form } });
    setTab(0);
    setTimeout(() => {
      const el = document.getElementById("result-panel");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const tabs = ["의무 소방시설", "현행 기준 비교", ...(result?.ext ? ["증축 특례"] : []), "법령 변천 이력"];

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", background: "#f0f4f8", minHeight: "100vh" }}>

      {/* 헤더 */}
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)", color: "#fff", padding: "18px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 11, opacity: .7, marginBottom: 3 }}>🔥 HFLS v3.0 — Historical Fire Law Support System</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px" }}>소방시설 연혁 법령 적용 지원 시스템</div>
          <div style={{ fontSize: 12, opacity: .8, marginTop: 4 }}>
            건축허가일 기준 소방법령 자동 판별 · 별표4·5 원문 기반 의무 소방시설 조회 · 증축 특례 이중기준 처리
          </div>
          <div style={{ fontSize: 11, opacity: .65, marginTop: 3 }}>
            데이터 출처: 소방시설법 시행령 별표4(제11조, 2022.12~2025.11) · 화재예방소방시설법 별표5(제15조) · 소방시설설치유지법 별표4(제15조)
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,360px) 1fr", gap: 16, alignItems: "start" }}>

          {/* 입력 패널 */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.08)", position: "sticky", top: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              📋 건축물 정보 입력
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
              <Badge label="필수" color="#dc2626" /> 항목을 모두 입력 후 분석하세요
            </div>

            <Field label="건축허가일 (건축허가서 기준)" req>
              <input type="date" value={form.approvalDate} onChange={e => set("approvalDate", e.target.value)}
                style={{ ...inputStyle, borderColor: errors.approvalDate ? "#ef4444" : "#e2e8f0" }} />
              {errors.approvalDate && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{errors.approvalDate}</div>}
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>※ 1958.3.11 이후 건축허가 건물 대상</div>
            </Field>

            <Field label="특정소방대상물 용도 [별표2]" req>
              <select value={form.buildingType} onChange={e => set("buildingType", e.target.value)}
                style={{ ...inputStyle, borderColor: errors.buildingType ? "#ef4444" : "#e2e8f0" }}>
                <option value="">-- 별표2 용도 선택 --</option>
                {BUILDING_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errors.buildingType && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{errors.buildingType}</div>}
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["연면적(㎡)", "totalArea", "예: 1500", true],
                ["지상 층수", "groundFloors", "예: 5", true],
                ["지하 층수", "basementFloors", "없으면 0", false],
                ["수용인원(명)", "occupants", "예: 100", false]
              ].map(([lb, k, ph, req]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "flex", alignItems: "center" }}>
                    {lb}<Badge label={req ? "필수" : "선택"} color={req ? "#dc2626" : "#64748b"} />
                  </div>
                  <input type="number" value={form[k]} placeholder={ph}
                    onChange={e => set(k, e.target.value)}
                    style={{ ...inputStyle, borderColor: errors[k] ? "#ef4444" : "#e2e8f0" }} />
                  {errors[k] && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors[k]}</div>}
                </div>
              ))}
            </div>

            {/* 증축 */}
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0", margin: "14px 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#374151" }}>
                <input type="checkbox" checked={form.hasExt} onChange={e => set("hasExt", e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: "#2563eb" }} />
                증축 이력 있음
                <Badge label="선택" color="#64748b" />
              </label>
              {form.hasExt && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "#7c3aed", lineHeight: 1.8, background: "#f5f3ff", borderRadius: 6, padding: "8px 10px", border: "1px solid #c4b5fd", marginBottom: 10 }}>
                    <b>📌 시행령 제15조(증축 특례) 원칙 및 단서</b><br />
                    <span style={{ color: "#1d4ed8" }}>원칙:</span> 기존 부분 + 증축 부분 모두 <b>증축 허가일 기준</b><br />
                    <span style={{ color: "#16a34a" }}>단서(예외):</span> 기존 부분에 건축허가일 기준 적용 가능 조건<br />
                    <span style={{ paddingLeft: 12, display: "block", color: "#b45309" }}>
                      ① 내화구조 바닥·벽 + 방화문(자동방화셔터 포함)으로 구획된 경우<br />
                      ② 자동차 생산공장 등 화재위험 낮은 대상 (화재안전기준 지정)<br />
                      ③ 국가유산청장 지정 국가유산 건축물
                    </span>
                    <span style={{ color: "#dc2626", fontWeight: 700 }}>⚠️ 방화구획 미형성 시 → 기존 부분도 증축 허가일 기준 전면 적용</span>
                  </div>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, cursor: "pointer", background: "#fffbeb", borderRadius: 6, padding: "8px 10px", border: "1px solid #fde68a", marginBottom: 10 }}>
                    <input type="checkbox" checked={form.extFirewall} onChange={e => set("extFirewall", e.target.checked)}
                      style={{ width: 14, height: 14, marginTop: 1, flexShrink: 0, accentColor: "#d97706" }} />
                    <span><b>내화구조 바닥·벽 + 방화문으로 구획 확인됨</b><br />
                      <span style={{ color: "#92400e" }}>(체크: 기존→건축허가일 기준 / 증축→증축허가일 기준 이중 적용)</span></span>
                  </label>

                  {[
                    ["증축 허가일", "extDate", "date", null, true],
                    ["증축 연면적(㎡)", "extArea", "number", "예: 300", false],
                    ["증축 층수", "extFloors", "number", "예: 2", false]
                  ].map(([lb, k, t, ph, req]) => (
                    <div key={k} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 3, display: "flex", alignItems: "center" }}>
                        {lb}<Badge label={req ? "필수" : "선택"} color={req ? "#dc2626" : "#64748b"} />
                      </div>
                      <input type={t} value={form[k]} placeholder={ph || ""} onChange={e => set(k, e.target.value)}
                        style={{ ...inputStyle, borderColor: errors[k] ? "#ef4444" : "#e2e8f0" }} />
                      {errors[k] && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors[k]}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={analyze}
              style={{ width: "100%", background: "linear-gradient(135deg,#1e3a5f,#2563eb)", color: "#fff", border: "none",
                borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37,99,235,.3)" }}>
              🔍 법령 및 소방시설 분석
            </button>
          </div>

          {/* 결과 패널 */}
          <div id="result-panel">
            {!result ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: 60, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🏢</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#475569", marginBottom: 8 }}>건축물 정보를 입력하고 분석을 실행하세요</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28 }}>건축허가일 기준 적용 법령 및 의무 소방시설이 별표4·5 원문 기반으로 조회됩니다</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  {LAW_ERAS.map(e => (
                    <div key={e.id} style={{ background: e.color + "18", border: "1px solid " + e.color + "44", borderRadius: 8, padding: "6px 14px", fontSize: 11, color: e.color, fontWeight: 700 }}>
                      {e.label}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* 법령 시대 카드 */}
                <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,.08)", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                    <span style={{ background: result.era.color, color: "#fff", borderRadius: 7, padding: "5px 14px", fontSize: 13, fontWeight: 700 }}>
                      {result.era.label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{result.era.lawName}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{result.era.lawCode}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8, marginBottom: 10 }}>
                    {[
                      ["설치기준 근거표", result.era.tableRef || result.era.mainArticle],
                      ["화재안전기준", result.era.standard + " (" + result.era.standardAuth + ")"],
                      ["자체점검 근거", result.era.selfCheck],
                      ["화재안전조사", result.era.safetyInspection]
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: "#f8fafc", borderRadius: 8, padding: "9px 11px" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", borderRadius: 7, padding: "7px 11px" }}>
                    ℹ️ {result.era.note}
                  </div>
                  {result.era.amendments && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
                      <b>주요 개정 이력:</b>
                      {result.era.amendments.map((a, i) => (
                        <div key={i} style={{ marginTop: 2 }}>· {a.date}: {a.summary}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 탭 */}
                <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
                  <div style={{ display: "flex", borderBottom: "2px solid #f1f5f9", overflowX: "auto" }}>
                    {tabs.map((t, i) => (
                      <button key={i} onClick={() => setTab(i)}
                        style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                          whiteSpace: "nowrap", fontFamily: "inherit",
                          background: tab === i ? "#2563eb" : "transparent",
                          color: tab === i ? "#fff" : "#64748b",
                          borderRadius: tab === i ? "8px 8px 0 0" : "0" }}>
                        {t}
                      </button>
                    ))}
                  </div>

                  <div style={{ padding: 18 }}>

                    {/* 탭0: 의무 소방시설 */}
                    {tab === 0 && (
                      <div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                          📅 건축허가일: <b>{result.form.approvalDate}</b> &nbsp;|&nbsp;
                          🏢 {BUILDING_TYPES.find(t => t.id === result.form.buildingType)?.name} &nbsp;|&nbsp;
                          📐 {result.area.toLocaleString()}㎡ &nbsp;|&nbsp;
                          🏗 지상{result.gf}층{result.bf > 0 ? " 지하" + result.bf + "층" : ""}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                          {CATS.map(cat => (
                            <div key={cat} style={{ fontSize: 10, background: CAT_COLORS[cat] + "18", border: "1px solid " + CAT_COLORS[cat] + "44", borderRadius: 5, padding: "3px 8px", color: CAT_COLORS[cat], fontWeight: 700 }}>
                              {CAT_ICONS[cat]} {cat}
                            </div>
                          ))}
                        </div>
                        {result.reqs.length === 0
                          ? <div style={{ textAlign: "center", color: "#94a3b8", padding: 30 }}>해당 조건에서 조회된 의무 소방시설이 없습니다.</div>
                          : CATS.map(cat => {
                              const items = result.reqs.filter(r => r.cat === cat);
                              if (!items.length) return null;
                              return (
                                <div key={cat} style={{ marginBottom: 16 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: CAT_COLORS[cat], marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                                    {CAT_ICONS[cat]} {cat}
                                    <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>({items.length}종)</span>
                                  </div>
                                  {items.map((r, i) => <ReqCard key={i} r={r} catColor={CAT_COLORS[cat]} />)}
                                </div>
                              );
                            })
                        }
                        <div style={{ fontSize: 11, color: "#94a3b8", background: "#fafafa", borderRadius: 8, padding: "8px 12px", marginTop: 8, lineHeight: 1.6 }}>
                          ※ 본 결과는 별표4·5 원문 기반 참고용입니다. 정확한 적용 여부는 건축허가 당시 시행령 원문 및 부칙 경과규정을 반드시 확인하십시오.
                        </div>
                      </div>
                    )}

                    {/* 탭1: 현행 기준 비교 */}
                    {tab === 1 && (() => {
                      const oldN = result.reqs.map(r => r.name);
                      const curN = result.curReqs.map(r => r.name);
                      const added = result.curReqs.filter(r => !oldN.includes(r.name));
                      const same = result.reqs.filter(r => curN.includes(r.name));
                      const gone = result.reqs.filter(r => !curN.includes(r.name));
                      return (
                        <div>
                          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                            <b>{result.era.label}</b> 기준 대비 <b>현행(2025.11.25 개정)</b> 기준의 추가·변경 사항
                          </div>
                          {added.length > 0 && <>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>
                              🔴 현행 기준에서 추가된 시설 ({added.length}건) — 소급 적용 여부 부칙 확인 필요
                            </div>
                            {added.map((r, i) => (
                              <div key={i} style={{ background: "#fef2f2", borderLeft: "3px solid #ef4444", borderRadius: 8, padding: "10px 13px", marginBottom: 6 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>+ {r.name}</div>
                                <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 2 }}>{r.cond} · {r.std}</div>
                              </div>
                            ))}
                          </>}
                          {same.length > 0 && <>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", marginBottom: 8, marginTop: 14 }}>
                              🟢 당시 기준과 동일한 시설 ({same.length}건)
                            </div>
                            {same.map((r, i) => (
                              <div key={i} style={{ background: "#f0fdf4", borderLeft: "3px solid #16a34a", borderRadius: 8, padding: "10px 13px", marginBottom: 6 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>= {r.name}</div>
                                <div style={{ fontSize: 11, color: "#15803d", marginTop: 2 }}>{r.cond}</div>
                              </div>
                            ))}
                          </>}
                          {gone.length > 0 && <>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 8, marginTop: 14 }}>⚫ 기준 변경 항목</div>
                            {gone.map((r, i) => (
                              <div key={i} style={{ background: "#f9fafb", borderLeft: "3px solid #9ca3af", borderRadius: 8, padding: "10px 13px", marginBottom: 6 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>~ {r.name}</div>
                              </div>
                            ))}
                          </>}
                        </div>
                      );
                    })()}

                    {/* 탭2: 증축 특례 */}
                    {tab === 2 && result.ext && (
                      <div>
                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", marginBottom: 14, fontSize: 12, lineHeight: 1.9 }}>
                          <b>📌 소방시설법 시행령 제15조(증축 시 소방시설 기준)</b><br />
                          원칙: 기존·증축 모두 <b>증축 허가일 기준</b><br />
                          단서: 내화구조 바닥·벽+방화문으로 구획 시 → 기존 부분 <b>건축허가일({result.form.approvalDate}) 기준</b> 적용 가능
                          {result.ext.firewall
                            ? <div style={{ marginTop: 6, padding: "5px 10px", background: "#f0fdf4", borderRadius: 6, color: "#166534", fontWeight: 700, border: "1px solid #bbf7d0" }}>
                                ✅ 방화구획 확인 → 이중기준 적용
                              </div>
                            : <div style={{ marginTop: 6, padding: "5px 10px", background: "#fef2f2", borderRadius: 6, color: "#b91c1c", fontWeight: 700, border: "1px solid #fecaca" }}>
                                ⚠️ 방화구획 미확인 → 기존 부분도 증축 허가일({result.form.extDate}) 기준 원칙
                              </div>
                          }
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                          {[
                            {
                              label: "기존 부분 (" + result.area.toLocaleString() + "㎡)",
                              sublabel: result.ext.firewall
                                ? "기준: 건축허가일(" + result.form.approvalDate + ")"
                                : "⚠️ 방화구획 미확인 — 증축허가일 기준 적용",
                              era: result.era,
                              reqs: result.ext.firewall ? result.reqs : result.ext.reqs,
                              col: "#2563eb", bg: "#eff6ff"
                            },
                            {
                              label: "증축 부분 (" + result.ext.area.toLocaleString() + "㎡·" + result.ext.floors + "층)",
                              sublabel: "기준: 증축 허가일(" + result.form.extDate + ")",
                              era: result.ext.era,
                              reqs: result.ext.reqs,
                              col: "#d97706", bg: "#fffbeb"
                            }
                          ].map(({ label, sublabel, era, reqs, col, bg }) => (
                            <div key={label}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: col, padding: "8px 11px", background: bg, borderRadius: 8, marginBottom: 8 }}>
                                🏗 {label}<br />
                                <span style={{ fontWeight: 600, fontSize: 11 }}>{sublabel}</span><br />
                                <span style={{ fontWeight: 400, fontSize: 11, opacity: .8 }}>법령: {era.lawShort || era.lawName}</span>
                              </div>
                              {reqs.length === 0
                                ? <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: 12 }}>해당 없음</div>
                                : CATS.map(cat => {
                                    const items = reqs.filter(r => r.cat === cat);
                                    if (!items.length) return null;
                                    return (
                                      <div key={cat} style={{ marginBottom: 8 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: CAT_COLORS[cat], marginBottom: 4 }}>{CAT_ICONS[cat]} {cat}</div>
                                        {items.map((r, i) => (
                                          <div key={i} style={{ fontSize: 11, background: bg, borderRadius: 7, padding: "6px 10px", marginBottom: 3 }}>
                                            <b style={{ color: "#1e293b" }}>{r.name}</b>
                                            {r.warn && <div style={{ color: "#b91c1c", marginTop: 2 }}>⚠️ {r.warn}</div>}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 탭 마지막: 법령 변천 이력 */}
                    {tab === tabs.length - 1 && (
                      <div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>소방 법령 체계 변천 이력 (1958 ~ 현재) — 별표4·5 개정 기준</div>
                        {LAW_ERAS.map(era => (
                          <div key={era.id} style={{
                            padding: "12px 15px", marginBottom: 10, borderRadius: "0 10px 10px 0",
                            background: era.id === result.era.id ? "#f0f7ff" : "#f8fafc",
                            border: era.id === result.era.id ? "1.5px solid " + era.color : "1px solid #e2e8f0",
                            borderLeft: "5px solid " + era.color
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: era.color }}>{era.label}</span>
                              {era.id === result.era.id && (
                                <span style={{ fontSize: 11, background: era.color, color: "#fff", borderRadius: 5, padding: "3px 10px" }}>📍 해당 건물 적용</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                              {era.start} ~ {era.end === "2099-12-31" ? "현재" : era.end}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 5 }}>{era.lawName}</div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{era.tableRef || era.mainArticle}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>기준: {era.standard} ({era.standardAuth})</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{era.note}</div>
                            {era.amendments && (
                              <div style={{ marginTop: 6, fontSize: 11, color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: 6 }}>
                                {era.amendments.map((a, i) => (
                                  <div key={i} style={{ marginTop: 2 }}>· {a.date}: {a.summary}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 10, padding: "12px 15px", fontSize: 12, color: "#854d0e", lineHeight: 1.8 }}>
                          <b>⚠️ 소급 적용 판단 원칙</b><br />
                          기존 건축물은 원칙적으로 건축허가 당시 기준 적용. 개정 법령 부칙에서 소급 명시 시 현행 기준 적용 의무 발생.
                          자체점검·화재안전조사 시 각 개정의 부칙 경과규정을 반드시 확인하십시오.
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: "#1e293b", color: "#94a3b8", textAlign: "center", padding: "16px 20px", fontSize: 11, lineHeight: 1.8 }}>
        HFLS v3.0 — 소방시설 연혁 법령 적용 지원 시스템 &nbsp;|&nbsp; 참고용 시스템 (법적 효력 없음)<br />
        데이터: 별표4(제11조, 소방시설법) · 별표5(제15조, 화재예방소방시설법) · 별표4(제15조, 소방시설설치유지법) 원문 기반<br />
        정확한 기준은 국가법령정보센터(law.go.kr) 원문 및 관할 소방서 확인 필수
      </div>
    </div>
  );
}

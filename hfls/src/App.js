import { useState } from "react";
import {
  LAW_ERAS, BUILDING_TYPES, FIRE_ACCIDENTS,
  getEraByDate, getRequirements, getRetroactiveWarnings, getCurrentRequirements
} from "./data";

const CATS = ["소화설비", "경보설비", "피난구조설비", "소화활동설비"];
const CAT_COLORS = {
  "소화설비": "#ef4444", "경보설비": "#f59e0b",
  "피난구조설비": "#3b82f6", "소화활동설비": "#8b5cf6"
};
const CAT_ICONS = {
  "소화설비": "🧯", "경보설비": "🔔",
  "피난구조설비": "🚪", "소화활동설비": "🚒"
};

// 노유자시설 그룹핑 (select 옵션 그룹 표시용)
const TYPE_GROUPS = [
  { label: "공동주택", ids: ["apt", "villa"] },
  { label: "근린·업무·판매", ids: ["geunlin", "office", "retail"] },
  { label: "창고·공장", ids: ["warehouse", "factory"] },
  { label: "의료시설", ids: ["medical"] },
  {
    label: "노유자시설 (시행령 별표 2 제11호)",
    ids: ["senior_life", "senior_user"],
    notice: "★ 시행령 별표 2 제11호 가·나목 기준 분리 (소방시설 기준 상이)"
  },
  { label: "교육·복합", ids: ["education", "complex"] },
];

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8,
  padding: "9px 11px", fontSize: 13, boxSizing: "border-box",
  outline: "none", transition: "border-color .15s", fontFamily: "inherit"
};

function ReqCard({ r, catColor }) {
  return (
    <div style={{
      background: "#f8fafc", borderRadius: 8, padding: "10px 13px",
      marginBottom: 6, borderLeft: `3px solid ${catColor}`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>✅ {r.name}</span>
        <span style={{
          fontSize: 10, background: "#16a34a", color: "#fff",
          borderRadius: 4, padding: "2px 7px", whiteSpace: "nowrap", flexShrink: 0
        }}>{r.std}</span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>적용조건: {r.cond}</div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, lineHeight: 1.5 }}>근거: {r.art}</div>
      {r.warn && (
        <div style={{
          fontSize: 11, color: "#b91c1c", background: "#fef2f2",
          borderRadius: 4, padding: "4px 8px", marginTop: 5
        }}>
          ⚠️ {r.warn}
        </div>
      )}
    </div>
  );
}

function RetroCard({ w }) {
  const styles = {
    danger:  { bg: "#fef2f2", border: "#fca5a5", icon: "🚨", titleColor: "#991b1b" },
    warning: { bg: "#fffbeb", border: "#fcd34d", icon: "⚠️", titleColor: "#92400e" },
    info:    { bg: "#eff6ff", border: "#93c5fd", icon: "ℹ️", titleColor: "#1e40af" },
  };
  const s = styles[w.level] || styles.info;
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 10, padding: "13px 16px", marginBottom: 12
    }}>
      <div style={{ fontWeight: 700, color: s.titleColor, fontSize: 14, marginBottom: 7 }}>
        {s.icon} {w.title}
      </div>
      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{w.content}</div>
      {w.accident && (
        <div style={{
          fontSize: 11, color: "#6b7280", marginTop: 7,
          paddingTop: 7, borderTop: `1px solid ${s.border}`
        }}>
          🔥 배경 사고: {w.accident}
        </div>
      )}
      {w.amendment && (
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
          📅 법령 개정: {w.amendment}
        </div>
      )}
    </div>
  );
}

// 건물유형 select — 그룹 구분 + 노유자시설 강조
function BuildingTypeSelect({ value, onChange, error }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, borderColor: error ? "#ef4444" : "#e2e8f0" }}
    >
      <option value="">-- 선택하세요 --</option>
      {TYPE_GROUPS.map(g => (
        <optgroup key={g.label} label={g.label + (g.notice ? " ⚠" : "")}>
          {g.ids.map(id => {
            const t = BUILDING_TYPES.find(b => b.id === id);
            return t ? <option key={id} value={id}>{t.name}</option> : null;
          })}
        </optgroup>
      ))}
    </select>
  );
}

export default function App() {
  const [form, setForm] = useState({
    approvalDate: "", buildingType: "", totalArea: "", groundFloors: "",
    basementFloors: "", occupants: "", hasExt: false,
    extDate: "", extArea: "", extFloors: ""
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
    const gf   = parseInt(form.groundFloors) || 0;
    const bf   = parseInt(form.basementFloors) || 0;
    const occ  = parseInt(form.occupants) || 0;

    const reqs    = getRequirements(form.buildingType, area, gf, bf, occ, era.id, form.approvalDate);
    const curReqs = getCurrentRequirements(form.buildingType, area, gf, bf, occ);
    const retro   = getRetroactiveWarnings(form.buildingType, area, gf, era.id, form.approvalDate);

    let ext = null;
    if (form.hasExt && form.extDate) {
      const extEra = getEraByDate(form.extDate);
      if (extEra) {
        const ea = parseFloat(form.extArea) || 0;
        const ef = parseInt(form.extFloors) || 0;
        ext = {
          era: extEra,
          reqs: getRequirements(form.buildingType, ea, ef, bf, occ, extEra.id, form.extDate),
          area: ea, floors: ef
        };
      }
    }

    setResult({ era, reqs, curReqs, retro, ext, area, gf, bf, form: { ...form } });
    setTab(0);
    setTimeout(() => {
      const el = document.getElementById("result-panel");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const buildTabs = (r) => {
    const t = ["의무 소방시설", "소급 적용 주의", "현행 기준 비교"];
    if (r?.ext) t.push("증축 특례");
    t.push("법령 변천 이력");
    return t;
  };
  const tabs = result ? buildTabs(result) : [];

  // 현재 선택된 건물유형 정보
  const selectedType = BUILDING_TYPES.find(t => t.id === result?.form?.buildingType);

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", background: "#f0f4f8", minHeight: "100vh" }}>

      {/* 헤더 */}
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)", color: "#fff", padding: "18px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 11, opacity: .7, marginBottom: 3 }}>
            🔥 HFLS v3.0 — Historical Fire Law Support System
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px" }}>
            소방시설 연혁 법령 적용 지원 시스템
          </div>
          <div style={{ fontSize: 12, opacity: .8, marginTop: 4 }}>
            사용승인 시점별 소방법령 자동 판별 · 의무 소방시설 조회 · 소급 적용 경고 · 증축 특례 이중기준 처리
          </div>
          <div style={{ fontSize: 11, opacity: .65, marginTop: 3 }}>
            기준 법령: 소방시설 설치 및 관리에 관한 법률 시행령 별표 2 (특정소방대상물 분류) / 별표 4 (소방시설 설치기준)
          </div>
        </div>
      </div>

      {/* 노유자시설 분류 안내 배너 */}
      <div style={{ background: "#fef3c7", borderBottom: "1px solid #fde68a" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 16px", fontSize: 11, color: "#92400e", lineHeight: 1.6 }}>
          <b>★ 노유자시설 분류 안내 (소방시설법 시행령 별표 2 제11호)</b> &nbsp;|&nbsp;
          <b>가. 노유자생활시설</b>: 노인요양시설·아동양육시설·장애인 거주시설 등 (24시간 거주) — 간이스프링클러 전층 의무(2012.2.5~) &nbsp;|&nbsp;
          <b>나. 노유자이용시설</b>: 경로당·어린이집·장애인 주간보호 등 (낮 이용) — 일반 노유자 기준 적용 &nbsp;|&nbsp;
          <span style={{ color: "#b45309" }}>※ 다중이용업소는 「다중이용업소의 안전관리에 관한 특별법」 별도 적용으로 본 시스템에서 제외</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,340px) 1fr", gap: 16, alignItems: "start" }}>

          {/* ─── 입력 패널 ─── */}
          <div style={{
            background: "#fff", borderRadius: 14, padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,.08)", position: "sticky", top: 16
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              📋 건축물 정보 입력
            </div>

            <Field label="사용승인일 (건축물대장 기준) *">
              <input type="date" value={form.approvalDate}
                onChange={e => set("approvalDate", e.target.value)}
                style={{ ...inputStyle, borderColor: errors.approvalDate ? "#ef4444" : "#e2e8f0" }} />
              {errors.approvalDate && (
                <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{errors.approvalDate}</div>
              )}
              {form.approvalDate && (() => {
                const era = getEraByDate(form.approvalDate);
                return era ? (
                  <div style={{ fontSize: 11, color: era.color, fontWeight: 700, marginTop: 3 }}>
                    → {era.label} ({era.lawShort})
                  </div>
                ) : null;
              })()}
            </Field>

            <Field label="건물 용도 (시행령 별표 2 기준) *">
              <BuildingTypeSelect
                value={form.buildingType}
                onChange={v => set("buildingType", v)}
                error={errors.buildingType}
              />
              {errors.buildingType && (
                <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{errors.buildingType}</div>
              )}
              {/* 선택된 용도의 법적 근거 표시 */}
              {form.buildingType && (() => {
                const t = BUILDING_TYPES.find(b => b.id === form.buildingType);
                return t ? (
                  <div style={{
                    fontSize: 10, color: "#64748b", marginTop: 4,
                    background: "#f8fafc", borderRadius: 6, padding: "4px 7px", lineHeight: 1.5
                  }}>
                    <b>법적 근거:</b> {t.lawRef}<br />
                    {t.desc}
                  </div>
                ) : null;
              })()}
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["연면적(㎡) *", "totalArea", "예: 1500"],
                ["지상 층수 *", "groundFloors", "예: 10"],
                ["지하 층수", "basementFloors", "없으면 0"],
                ["수용인원(명)", "occupants", "예: 100"]].map(([lb, k, ph]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{lb}</div>
                  <input type="number" value={form[k]} placeholder={ph}
                    onChange={e => set(k, e.target.value)}
                    style={{ ...inputStyle, borderColor: errors[k] ? "#ef4444" : "#e2e8f0" }} />
                  {errors[k] && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors[k]}</div>}
                </div>
              ))}
            </div>

            {/* 증축 */}
            <div style={{
              background: "#f8fafc", borderRadius: 10, padding: 12,
              border: "1px solid #e2e8f0", margin: "14px 0"
            }}>
              <label style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#374151"
              }}>
                <input type="checkbox" checked={form.hasExt}
                  onChange={e => set("hasExt", e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: "#2563eb" }} />
                증축 이력 있음 (증축 특례 적용)
              </label>
              {form.hasExt && (
                <div style={{ marginTop: 10 }}>
                  <div style={{
                    fontSize: 11, color: "#ef4444", lineHeight: 1.6,
                    marginBottom: 8, background: "#fef2f2", borderRadius: 6, padding: "5px 8px"
                  }}>
                    ※ 소방시설법 시행령 제15조의2 (증축 특례)<br />
                    기존부분 → 사용승인일 당시 기준 적용<br />
                    증축부분 → 증축 허가일 당시 기준 적용
                  </div>
                  {[["증축 허가(승인)일 *", "extDate", "date", null],
                    ["증축 면적(㎡)", "extArea", "number", "예: 300"],
                    ["증축 층수", "extFloors", "number", "예: 2"]].map(([lb, k, t, ph]) => (
                    <div key={k} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 3 }}>{lb}</div>
                      <input type={t} value={form[k]} placeholder={ph || ""}
                        onChange={e => set(k, e.target.value)}
                        style={{ ...inputStyle, borderColor: errors[k] ? "#ef4444" : "#e2e8f0" }} />
                      {errors[k] && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{errors[k]}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={analyze}
              style={{
                width: "100%", background: "linear-gradient(135deg,#1e3a5f,#2563eb)",
                color: "#fff", border: "none", borderRadius: 10, padding: "13px",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37,99,235,.3)", transition: "opacity .15s"
              }}
              onMouseOver={e => e.target.style.opacity = ".88"}
              onMouseOut={e => e.target.style.opacity = "1"}>
              🔍 법령 및 소방시설 분석
            </button>
          </div>

          {/* ─── 결과 패널 ─── */}
          <div id="result-panel">
            {!result ? (
              <div style={{
                background: "#fff", borderRadius: 14, padding: 60,
                textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,.08)"
              }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🏢</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                  건축물 정보를 입력하고 분석을 실행하세요
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28 }}>
                  사용승인일 기준 적용 법령 · 의무 소방시설 · 소급 적용 경고가 자동 조회됩니다
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  {LAW_ERAS.map(e => (
                    <div key={e.id} style={{
                      background: e.color + "18", border: `1px solid ${e.color}44`,
                      borderRadius: 8, padding: "6px 14px", fontSize: 11, color: e.color, fontWeight: 700
                    }}>
                      {e.label}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* 법령 시대 카드 */}
                <div style={{
                  background: "#fff", borderRadius: 14, padding: 18,
                  boxShadow: "0 2px 8px rgba(0,0,0,.08)", marginBottom: 12
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                    <span style={{
                      background: result.era.color, color: "#fff",
                      borderRadius: 7, padding: "5px 14px", fontSize: 13, fontWeight: 700
                    }}>
                      {result.era.label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                      {result.era.lawName}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{result.era.lawCode}</span>
                    {result.retro.length > 0 && (
                      <span
                        style={{
                          background: "#dc2626", color: "#fff", borderRadius: 7,
                          padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer"
                        }}
                        onClick={() => setTab(1)}>
                        🚨 소급 적용 주의 {result.retro.length}건 →
                      </span>
                    )}
                  </div>

                  {/* 건물유형 법적근거 표시 */}
                  {selectedType && (
                    <div style={{
                      background: "#f0f9ff", borderRadius: 8, padding: "8px 12px",
                      marginBottom: 10, fontSize: 11, color: "#0369a1", lineHeight: 1.6
                    }}>
                      <b>📋 적용 대상 분류:</b> {selectedType.name}<br />
                      <b>법적 근거:</b> {selectedType.lawRef}<br />
                      <span style={{ color: "#64748b" }}>{selectedType.desc}</span>
                    </div>
                  )}

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8
                  }}>
                    {[
                      ["화재안전기준", result.era.standard + " (" + result.era.standardAuth + ")"],
                      ["소방시설 설치 근거", result.era.mainArticle],
                      ["자체점검 근거", result.era.selfCheck],
                      ["화재안전조사 근거", result.era.safetyInspection]
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: "#f8fafc", borderRadius: 8, padding: "9px 11px" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    marginTop: 10, fontSize: 12, color: "#64748b",
                    background: "#f1f5f9", borderRadius: 7, padding: "7px 11px"
                  }}>
                    ℹ️ {result.era.note}
                  </div>
                </div>

                {/* 탭 */}
                <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
                  <div style={{ display: "flex", borderBottom: "2px solid #f1f5f9", overflowX: "auto" }}>
                    {tabs.map((t, i) => {
                      const isBadge = i === 1 && result.retro.length > 0;
                      return (
                        <button key={i} onClick={() => setTab(i)}
                          style={{
                            padding: "12px 14px", fontSize: 12, fontWeight: 600,
                            border: "none", cursor: "pointer", whiteSpace: "nowrap",
                            fontFamily: "inherit",
                            background: tab === i ? "#2563eb" : "transparent",
                            color: tab === i ? "#fff" : "#64748b",
                            borderRadius: tab === i ? "8px 8px 0 0" : "0",
                            transition: "all .15s",
                            display: "flex", alignItems: "center", gap: 4
                          }}>
                          {t}
                          {isBadge && (
                            <span style={{
                              background: tab === i ? "#fff" : "#dc2626",
                              color: tab === i ? "#dc2626" : "#fff",
                              borderRadius: 10, fontSize: 10, padding: "1px 5px", fontWeight: 700
                            }}>
                              {result.retro.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ padding: 18 }}>

                    {/* ── 탭 0: 의무 소방시설 ── */}
                    {tab === 0 && (
                      <div>
                        <div style={{
                          fontSize: 12, color: "#94a3b8", marginBottom: 14,
                          padding: "8px 12px", background: "#f8fafc", borderRadius: 8
                        }}>
                          📅 기준일: <b>{result.form.approvalDate}</b> &nbsp;|&nbsp;
                          🏢 {BUILDING_TYPES.find(t => t.id === result.form.buildingType)?.name} &nbsp;|&nbsp;
                          📐 {result.area.toLocaleString()}㎡ &nbsp;|&nbsp;
                          🏗 지상{result.gf}층{result.bf > 0 ? ` 지하${result.bf}층` : ""}
                        </div>
                        {result.reqs.length === 0
                          ? (
                            <div style={{ textAlign: "center", color: "#94a3b8", padding: 30 }}>
                              해당 조건에서 조회된 의무 소방시설이 없습니다.
                            </div>
                          )
                          : CATS.map(cat => {
                              const items = result.reqs.filter(r => r.cat === cat);
                              if (!items.length) return null;
                              return (
                                <div key={cat} style={{ marginBottom: 16 }}>
                                  <div style={{
                                    fontSize: 13, fontWeight: 700, color: CAT_COLORS[cat],
                                    marginBottom: 8, display: "flex", alignItems: "center", gap: 6
                                  }}>
                                    <span>{CAT_ICONS[cat]}</span> {cat}
                                    <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>
                                      ({items.length}종)
                                    </span>
                                  </div>
                                  {items.map((r, i) => <ReqCard key={i} r={r} catColor={CAT_COLORS[cat]} />)}
                                </div>
                              );
                            })
                        }
                        <div style={{
                          fontSize: 11, color: "#94a3b8", background: "#fafafa",
                          borderRadius: 8, padding: "8px 12px", marginTop: 8, lineHeight: 1.6
                        }}>
                          ※ 참고용입니다. 정확한 적용 여부는 사용승인 당시 시행령·NFSC/NFTC 원문 및 <b>부칙 경과규정</b>을 반드시 확인하십시오.
                        </div>
                      </div>
                    )}

                    {/* ── 탭 1: 소급 적용 주의 ── */}
                    {tab === 1 && (
                      <div>
                        <div style={{
                          fontSize: 12, color: "#374151", marginBottom: 16,
                          padding: "10px 14px", background: "#fef9c3",
                          border: "1px solid #fde047", borderRadius: 8, lineHeight: 1.7
                        }}>
                          <b>📌 소급 적용이란?</b> 법령 개정 후 이미 사용승인된 기존 건축물에도 새 기준을 적용하는 것입니다.<br />
                          부칙 경과 조항이 없으면 <b>즉시 소급 적용</b>되며, 기한이 명시된 경우 이행 기한 내 설치 의무가 발생합니다.<br />
                          <span style={{ color: "#92400e" }}>
                            이행 기한 및 세부 적용 범위는 반드시 관할 소방서 또는 국가법령정보센터(law.go.kr)에서 확인하십시오.
                          </span>
                        </div>
                        {result.retro.length === 0
                          ? (
                            <div style={{ textAlign: "center", padding: 30 }}>
                              <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
                              <div style={{ color: "#16a34a", fontWeight: 700 }}>
                                이 건물에 해당하는 주요 소급 적용 사항이 확인되지 않았습니다.
                              </div>
                              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                                단, 이 시스템에서 확인되지 않은 소급 사항이 있을 수 있습니다.
                              </div>
                            </div>
                          )
                          : result.retro.map((w, i) => <RetroCard key={i} w={w} />)
                        }
                      </div>
                    )}

                    {/* ── 탭 2: 현행 기준 비교 ── */}
                    {tab === 2 && (() => {
                      const oldN = result.reqs.map(r => r.name);
                      const curN = result.curReqs.map(r => r.name);
                      const added = result.curReqs.filter(r => !oldN.includes(r.name));
                      const same  = result.reqs.filter(r => curN.includes(r.name));
                      const gone  = result.reqs.filter(r => !curN.includes(r.name));
                      return (
                        <div>
                          <div style={{
                            fontSize: 12, color: "#64748b", marginBottom: 14,
                            padding: "8px 12px", background: "#f8fafc", borderRadius: 8
                          }}>
                            <b>{result.era.label}</b> 기준 대비 <b>현행(2022.12.1~, NFTC/NFPC)</b> 기준의 추가·변경 사항
                          </div>
                          {added.length > 0 && (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>
                                🔴 현행 기준에서 추가된 시설 ({added.length}건) — 소급 적용 여부 [소급 적용 주의] 탭에서 확인
                              </div>
                              {added.map((r, i) => (
                                <div key={i} style={{
                                  background: "#fef2f2", borderLeft: "3px solid #ef4444",
                                  borderRadius: 8, padding: "10px 13px", marginBottom: 6
                                }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>+ {r.name}</div>
                                  <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 2 }}>{r.cond} · {r.std}</div>
                                </div>
                              ))}
                            </>
                          )}
                          {same.length > 0 && (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", marginBottom: 8, marginTop: 14 }}>
                                🟢 당시 기준과 동일하게 적용되는 시설 ({same.length}건)
                              </div>
                              {same.map((r, i) => (
                                <div key={i} style={{
                                  background: "#f0fdf4", borderLeft: "3px solid #16a34a",
                                  borderRadius: 8, padding: "10px 13px", marginBottom: 6
                                }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>= {r.name}</div>
                                  <div style={{ fontSize: 11, color: "#15803d", marginTop: 2 }}>{r.cond}</div>
                                </div>
                              ))}
                            </>
                          )}
                          {gone.length > 0 && (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 8, marginTop: 14 }}>
                                ⚫ 기준 변경 항목
                              </div>
                              {gone.map((r, i) => (
                                <div key={i} style={{
                                  background: "#f9fafb", borderLeft: "3px solid #9ca3af",
                                  borderRadius: 8, padding: "10px 13px", marginBottom: 6
                                }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>~ {r.name}</div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {/* ── 탭 3: 증축 특례 ── */}
                    {result.ext && tab === 3 && (
                      <div>
                        <div style={{
                          background: "#fffbeb", border: "1px solid #fde68a",
                          borderRadius: 8, padding: "10px 14px", marginBottom: 14,
                          fontSize: 12, lineHeight: 1.8
                        }}>
                          <b>📌 증축 특례 근거:</b> 소방시설 설치 및 관리에 관한 법률 시행령 제15조의2<br />
                          <span style={{ color: "#2563eb" }}>기존부분 → 사용승인일({result.form.approvalDate}) 당시 기준 적용</span><br />
                          <span style={{ color: "#d97706" }}>증축부분 → 증축 허가일({result.form.extDate}) 당시 기준 적용</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                          {[
                            {
                              label: `기존 부분 (${result.area.toLocaleString()}㎡)`,
                              era: result.era, reqs: result.reqs, col: "#2563eb", bg: "#eff6ff"
                            },
                            {
                              label: `증축 부분 (${result.ext.area.toLocaleString()}㎡·${result.ext.floors}층)`,
                              era: result.ext.era, reqs: result.ext.reqs, col: "#d97706", bg: "#fffbeb"
                            }
                          ].map(({ label, era, reqs, col, bg }) => (
                            <div key={label}>
                              <div style={{
                                fontSize: 12, fontWeight: 700, color: col,
                                padding: "8px 11px", background: bg,
                                borderRadius: 8, marginBottom: 8
                              }}>
                                🏗 {label}<br />
                                <span style={{ fontWeight: 400, fontSize: 11, opacity: .8 }}>
                                  적용 법령: {era.lawShort || era.lawName}
                                </span>
                              </div>
                              {reqs.length === 0
                                ? <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: 12 }}>해당 없음</div>
                                : reqs.map((r, i) => (
                                  <div key={i} style={{
                                    fontSize: 11, background: bg,
                                    borderRadius: 7, padding: "7px 10px", marginBottom: 4
                                  }}>
                                    <b style={{ color: "#1e293b" }}>{r.name}</b><br />
                                    <span style={{ color: "#64748b" }}>{r.std}</span>
                                  </div>
                                ))
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── 마지막 탭: 법령 변천 이력 ── */}
                    {tab === tabs.length - 1 && (
                      <div>
                        {/* 해당 용도 관련 화재사고 & 법령 강화 */}
                        {(() => {
                          const related = FIRE_ACCIDENTS.filter(
                            a => a.types.includes(result.form.buildingType)
                          );
                          return related.length > 0 ? (
                            <div style={{ marginBottom: 24 }}>
                              <div style={{
                                fontSize: 13, fontWeight: 700, color: "#dc2626",
                                marginBottom: 12, display: "flex", alignItems: "center", gap: 6
                              }}>
                                🔥 이 용도 관련 주요 화재사고 및 법령 강화 이력
                              </div>
                              {related.map((a, i) => (
                                <div key={i} style={{
                                  display: "flex", gap: 12,
                                  padding: "12px 14px", marginBottom: 10, borderRadius: 10,
                                  background: a.retroactive ? "#fef2f2" : "#f8fafc",
                                  border: `1px solid ${a.retroactive ? "#fca5a5" : "#e2e8f0"}`,
                                  borderLeft: `4px solid ${a.retroactive ? "#dc2626" : "#94a3b8"}`
                                }}>
                                  <div style={{ minWidth: 52, textAlign: "center" }}>
                                    <div style={{ fontSize: 20 }}>🔥</div>
                                    <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>{a.year}</div>
                                    <div style={{ fontSize: 10, color: "#6b7280" }}>{a.deaths}명</div>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                                      {a.name}
                                      {a.retroactive && (
                                        <span style={{
                                          marginLeft: 8, fontSize: 10,
                                          background: "#dc2626", color: "#fff",
                                          borderRadius: 4, padding: "2px 6px"
                                        }}>소급 적용</span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#6b7280", margin: "2px 0" }}>
                                      📍 {a.location} &nbsp;|&nbsp; 📅 개정: {a.amendment}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#374151", marginTop: 4, lineHeight: 1.6 }}>
                                      {a.summary}
                                    </div>
                                    {a.lawDetail && (
                                      <div style={{
                                        fontSize: 11, color: "#2563eb", marginTop: 4,
                                        background: "#eff6ff", borderRadius: 4, padding: "3px 7px"
                                      }}>
                                        📜 {a.lawDetail}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}

                        {/* 법령 4대 시대 */}
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                          📜 소방 법령 체계 변천 전체 이력 (1958 ~ 현재)
                        </div>
                        {LAW_ERAS.map(era => (
                          <div key={era.id} style={{
                            padding: "12px 15px", marginBottom: 10,
                            borderRadius: "0 10px 10px 0",
                            background: era.id === result.era.id ? "#f0f7ff" : "#f8fafc",
                            border: era.id === result.era.id
                              ? `1.5px solid ${era.color}`
                              : "1px solid #e2e8f0",
                            borderLeft: `5px solid ${era.color}`
                          }}>
                            <div style={{
                              display: "flex", justifyContent: "space-between",
                              alignItems: "center", flexWrap: "wrap", gap: 6
                            }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: era.color }}>
                                {era.label}
                              </span>
                              {era.id === result.era.id && (
                                <span style={{
                                  fontSize: 11, background: era.color, color: "#fff",
                                  borderRadius: 5, padding: "3px 10px"
                                }}>📍 해당 건물 적용 시대</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                              {era.start} ~ {era.end === "2099-12-31" ? "현재" : era.end}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 5 }}>
                              {era.lawName}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                              소방시설 설치 근거: {era.mainArticle}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
                              화재안전기준: {era.standard} ({era.standardAuth})
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{era.note}</div>
                          </div>
                        ))}

                        {/* 소급 판단 원칙 */}
                        <div style={{
                          background: "#fef9c3", border: "1px solid #fde047",
                          borderRadius: 10, padding: "12px 15px",
                          fontSize: 12, color: "#854d0e", lineHeight: 1.8
                        }}>
                          <b>⚠️ 소급 적용 판단 원칙</b><br />
                          기존 건축물은 원칙적으로 사용승인 당시 기준 적용. 단, 개정 법령 부칙에 소급 적용이 명시되거나
                          경과 조항이 없는 경우 현행 기준 적용 의무 발생.<br />
                          자체점검 및 화재안전조사 시 각 개정의 <b>부칙 경과규정</b>을 반드시 확인하십시오.<br />
                          <span style={{ fontSize: 11, color: "#a16207" }}>
                            ※ 국가법령정보센터(law.go.kr) → 연혁 법령 → 부칙 검색
                          </span>
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

      {/* 푸터 */}
      <div style={{
        background: "#1e293b", color: "#94a3b8",
        textAlign: "center", padding: "16px 20px",
        fontSize: 11, lineHeight: 1.8
      }}>
        HFLS v3.0 — 소방시설 연혁 법령 적용 지원 시스템 &nbsp;|&nbsp;
        기준: 소방시설법 시행령 별표 2·4 (2022.12.1~) / 연혁 법령 부칙 포함<br />
        ⚠️ 참고용 시스템으로 법적 효력이 없습니다 &nbsp;|&nbsp;
        정확한 적용 기준은 관할 소방서 또는 국가법령정보센터(law.go.kr)를 통해 확인하십시오
      </div>
    </div>
  );
}

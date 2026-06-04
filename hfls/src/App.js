import { useState, useEffect } from "react";
import { LAW_ERAS, BUILDING_TYPES, getEraByDate, getRequirements } from "./data";

// ─── 관리자 비밀번호 (변경 가능) ─────────────────────────
const ADMIN_PW = "3535";

// ─── 카테고리 설정 ───────────────────────────────────────
const CATS = ["소화설비", "경보설비", "피난구조설비", "소화용수설비", "소화활동설비"];
const CAT_COLOR = {
  소화설비: "#ef4444", 경보설비: "#f59e0b",
  피난구조설비: "#3b82f6", 소화용수설비: "#06b6d4", 소화활동설비: "#8b5cf6"
};
const CAT_ICON = {
  소화설비: "🧯", 경보설비: "🔔",
  피난구조설비: "🚪", 소화용수설비: "💧", 소화활동설비: "🚒"
};

// ─── localStorage 헬퍼 (Vercel 배포용) ──────────────────
const STORAGE_KEY = "sfhc_admin_overrides";
function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function saveOverrides(ov) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ov)); } catch {}
}

// ─── 변경 배지 ───────────────────────────────────────────
const CHANGE_CONFIG = {
  same:    { label: "동일",    bg: "#f0fdf4", color: "#166534" },
  new:     { label: "신규추가", bg: "#fee2e2", color: "#991b1b" },
  strong:  { label: "강화",    bg: "#ffedd5", color: "#9a3412" },
  weak:    { label: "완화",    bg: "#fef9c3", color: "#854d0e" },
  removed: { label: "폐지",    bg: "#f3f4f6", color: "#374151" },
};

const HL_STYLE = {
  none:   {},
  yellow: { background: "#fffbeb", borderLeft: "3px solid #f59e0b" },
  red:    { background: "#fef2f2", borderLeft: "3px solid #ef4444" },
  blue:   { background: "#eff6ff", borderLeft: "3px solid #3b82f6" },
};

// ─── diff 계산 ───────────────────────────────────────────
function diffReqs(hist, curr) {
  const cNames = new Set(curr.map(r => r.name));
  const hNames = new Set(hist.map(r => r.name));
  return {
    added:   curr.filter(r => !hNames.has(r.name)),
    removed: hist.filter(r => !cNames.has(r.name)),
    same:    hist.filter(r => cNames.has(r.name)),
  };
}

// ─── 인라인 스타일 상수 ──────────────────────────────────
const S = {
  card: {
    background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0",
    padding: "10px 13px", marginBottom: 7,
  },
  input: {
    width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8,
    padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none",
    background: "#fff", color: "#1e293b", boxSizing: "border-box",
  },
  btn: {
    border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 16px",
    fontSize: 13, cursor: "pointer", fontFamily: "inherit",
    background: "#fff", color: "#1e293b",
  },
  btnPrimary: {
    background: "linear-gradient(135deg,#1e3a5f,#2563eb)", color: "#fff",
    border: "none", borderRadius: 8, padding: "11px 20px",
    fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  btnAdmin: {
    background: "#d97706", color: "#fff", border: "none",
    borderRadius: 8, padding: "7px 14px", fontSize: 12,
    cursor: "pointer", fontFamily: "inherit",
  },
  badge: (bg, color) => ({
    fontSize: 10, fontWeight: 700, background: bg, color,
    borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap",
  }),
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 999, padding: "1rem",
  },
  modal: {
    background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
    width: "100%", maxWidth: 540, maxHeight: "85vh",
    overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)",
  },
};

// ═══════════════════════════════════════════════════════════
// 서브 컴포넌트
// ═══════════════════════════════════════════════════════════

// ─── 편집 모달 ───────────────────────────────────────────
function EditModal({ item, ov, onSave, onClose }) {
  const base = ov[item.id] || {};
  const [cond, setCond]         = useState(base.cond ?? item.cond);
  const [art, setArt]           = useState(base.art ?? item.art);
  const [std, setStd]           = useState(base.std ?? item.std);
  const [note, setNote]         = useState(base.note ?? (item.note || ""));
  const [change, setChange]     = useState(base.change ?? "same");
  const [hl, setHl]             = useState(base.hl ?? "none");
  const [retro, setRetro]       = useState(base.retro ?? !!(item.retroactive));
  const [retroNote, setRetroNote] = useState(base.retroNote ?? (item.retroactive || ""));
  const [adminNote, setAdminNote] = useState(base.adminNote ?? "");

  const fld = (label, el) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{label}</div>
      {el}
    </div>
  );

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{item.name}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{item.cat} — 항목 편집</div>
          </div>
          <button style={{ ...S.btn, padding: "4px 10px", fontSize: 13 }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "16px 18px" }}>
          {fld("적용조건 (원문 기준으로 수정)",
            <textarea value={cond} onChange={e => setCond(e.target.value)}
              style={{ ...S.input, resize: "vertical", minHeight: 72 }} />)}
          {fld("근거조항",
            <input value={art} onChange={e => setArt(e.target.value)} style={S.input} />)}
          {fld("화재안전기준 (NFTC/NFSC 번호)",
            <input value={std} onChange={e => setStd(e.target.value)} style={S.input} />)}
          {fld("비고·주석",
            <input value={note} onChange={e => setNote(e.target.value)} style={S.input} placeholder="추가 주의사항" />)}
          {fld("변경 구분",
            <select value={change} onChange={e => setChange(e.target.value)} style={S.input}>
              <option value="same">동일</option>
              <option value="new">신규추가</option>
              <option value="strong">강화</option>
              <option value="weak">완화</option>
              <option value="removed">폐지</option>
            </select>)}
          {fld("강조 색상",
            <select value={hl} onChange={e => setHl(e.target.value)} style={S.input}>
              <option value="none">없음</option>
              <option value="yellow">노란색 (중요 강조)</option>
              <option value="red">빨간색 (강화·소급)</option>
              <option value="blue">파란색 (참고·완화)</option>
            </select>)}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={retro} onChange={e => setRetro(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#7c3aed" }} />
              <span style={{ fontWeight: 600 }}>소급적용 해당</span>
            </label>
            {retro && (
              <textarea value={retroNote} onChange={e => setRetroNote(e.target.value)}
                placeholder="소급적용 근거 및 내용 (예: 2014 부칙 제2조 — 기존 노유자시설 2년 이내 설치의무)"
                style={{ ...S.input, marginTop: 6, resize: "vertical", minHeight: 60 }} />
            )}
          </div>
          {fld("관리자 메모 (내부용, 출력 안 됨)",
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
              style={{ ...S.input, resize: "vertical", minHeight: 48 }} placeholder="검토 의견·출처 등" />)}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button style={S.btn} onClick={onClose}>취소</button>
            <button style={S.btnPrimary}
              onClick={() => onSave(item.id, { cond, art, std, note, change, hl, retro, retroNote, adminNote })}>
              ✅ 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 소방시설 카드 ───────────────────────────────────────
function ReqCard({ item, ov, adminMode, onEdit }) {
  const o = ov[item.id] || {};
  const cond      = o.cond      ?? item.cond;
  const art       = o.art       ?? item.art;
  const std       = o.std       ?? item.std;
  const note      = o.note      ?? (item.note || "");
  const change    = o.change    ?? "same";
  const hl        = o.hl        ?? "none";
  const retro     = o.retro     ?? !!(item.retroactive);
  const retroNote = o.retroNote ?? (item.retroactive || "");
  const cc        = CHANGE_CONFIG[change] || CHANGE_CONFIG.same;
  const hlStyle   = HL_STYLE[hl] || {};

  return (
    <div style={{ ...S.card, ...hlStyle }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>✅ {item.name}</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span style={S.badge("#f1f5f9", "#475569")}>{std}</span>
          <span style={S.badge(cc.bg, cc.color)}>{cc.label}</span>
          {retro && <span style={S.badge("#f3e8ff", "#6b21a8")}>소급</span>}
          {adminMode && (
            <button onClick={() => onEdit(item)}
              style={{ ...S.btnAdmin, padding: "3px 9px", fontSize: 11 }}>✏️ 편집</button>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>적용조건: {cond}</div>
      <div style={{ fontSize: 11, color: "#94a3b8" }}>근거: {art}</div>
      {note && (
        <div style={{ fontSize: 11, color: "#1d4ed8", background: "#eff6ff", borderRadius: 5, padding: "3px 8px", marginTop: 5 }}>
          📌 {note}
        </div>
      )}
      {retro && retroNote && (
        <div style={{ fontSize: 11, color: "#6b21a8", background: "#f3e8ff", borderRadius: 5, padding: "4px 8px", marginTop: 5 }}>
          ⚠️ 소급적용: {retroNote}
        </div>
      )}
    </div>
  );
}

// ─── 단일 컬럼 뷰 ────────────────────────────────────────
function ColView({ reqs, era, ov, adminMode, onEdit, title, colStyle }) {
  if (!reqs || reqs.length === 0) {
    return <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem", fontSize: 13 }}>해당 없음</div>;
  }
  return (
    <div>
      <div style={{
        fontSize: 12, fontWeight: 700, padding: "7px 12px", borderRadius: 8,
        marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
        ...colStyle,
      }}>
        {title}
      </div>
      {CATS.map(cat => {
        const items = reqs.filter(r => r.cat === cat);
        if (!items.length) return null;
        return (
          <div key={cat} style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: CAT_COLOR[cat],
              marginBottom: 5, display: "flex", alignItems: "center", gap: 5,
            }}>
              {CAT_ICON[cat]} {cat}
              <span style={{ fontWeight: 400, color: "#94a3b8" }}>({items.length}종)</span>
            </div>
            {items.map((item, i) => (
              <ReqCard key={i} item={item} ov={ov} adminMode={adminMode} onEdit={onEdit} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── 로그인 모달 ─────────────────────────────────────────
function LoginModal({ onLogin, onClose }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const tryLogin = () => {
    if (pw === ADMIN_PW) { onLogin(); }
    else setErr("비밀번호가 올바르지 않습니다.");
  };
  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modal, maxWidth: 340 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>🔐 관리자 로그인</div>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>비밀번호</div>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && tryLogin()}
              style={S.input} autoFocus />
          </div>
          {err && <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 10 }}>{err}</div>}
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>기본 비밀번호: sfhc2025 (App.js 상단에서 변경 가능)</div>
          <button style={{ ...S.btnPrimary, width: "100%", textAlign: "center" }} onClick={tryLogin}>로그인</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 메인 앱
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab]           = useState("compare"); // compare | nftc | eras | admin
  const [adminMode, setAdminMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [ov, setOv]             = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [result, setResult]     = useState(null);
  const [form, setForm]         = useState({
    date: "", btId: "", area: "", gf: "", bf: "", occ: ""
  });
  const [formErr, setFormErr]   = useState({});

  useEffect(() => { setOv(loadOverrides()); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSearch = () => {
    const e = {};
    if (!form.date) e.date = "필수 입력";
    if (!form.btId) e.btId = "필수 선택";
    if (!form.area || parseFloat(form.area) <= 0) e.area = "필수 입력";
    if (!form.gf || parseInt(form.gf) <= 0) e.gf = "필수 입력";
    setFormErr(e);
    if (Object.keys(e).length) return;

    const era = getEraByDate(form.date);
    if (!era) { setFormErr({ date: "1958년 3월 11일 이후 날짜를 입력하세요" }); return; }

    const curEra = LAW_ERAS[LAW_ERAS.length - 1];
    const bt     = BUILDING_TYPES.find(b => b.id === form.btId);
    const area   = parseFloat(form.area) || 0;
    const gf     = parseInt(form.gf) || 0;
    const bf     = parseInt(form.bf) || 0;
    const occ    = parseInt(form.occ) || 0;

    const histReqs = getRequirements(form.btId, area, gf, bf, occ, era.id);
    const currReqs = getRequirements(form.btId, area, gf, bf, occ, curEra.id);
    const diff     = diffReqs(histReqs, currReqs);

    setResult({ era, curEra, bt, area, gf, bf, occ, histReqs, currReqs, diff, date: form.date });
    setTab("compare");
    setTimeout(() => {
      document.getElementById("result-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSaveOv = (id, data) => {
    const next = { ...ov, [id]: data };
    setOv(next);
    saveOverrides(next);
    setEditingItem(null);
  };

  const handleResetOv = () => {
    if (window.confirm("모든 편집 내용을 초기화하시겠습니까?")) {
      setOv({});
      saveOverrides({});
    }
  };

  const retroCount = result
    ? result.histReqs.filter(r => {
        const o = ov[r.id] || {};
        return (o.retro ?? !!(r.retroactive));
      }).length
    : 0;

  const tabs = [
    { id: "compare", label: "📋 법령 연혁비교" },
    { id: "nftc",    label: "📑 NFTC 기준" },
    { id: "eras",    label: "📅 법령 시대" },
    ...(adminMode ? [{ id: "admin", label: "⚙️ 관리" }] : []),
  ];

  return (
    <div style={{ fontFamily: "'Noto Sans KR',sans-serif", background: "#f0f4f8", minHeight: "100vh" }}>

      {showLogin && <LoginModal onLogin={() => { setAdminMode(true); setShowLogin(false); }} onClose={() => setShowLogin(false)} />}
      {editingItem && <EditModal item={editingItem} ov={ov} onSave={handleSaveOv} onClose={() => setEditingItem(null)} />}

      {/* ─── 헤더 ─── */}
      <div style={{ background: "linear-gradient(135deg,#0f1e30 0%,#1e3a5f 100%)", color: "#fff", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, opacity: 0.55, letterSpacing: "1.5px", marginBottom: 3 }}>
              SFHC — FIRE LAW HISTORICAL COMPARISON SYSTEM
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>소방시설 법령 연혁비교 시스템</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>
              건축허가일 기준 법령 자동 판별 · 현행 기준 비교 · 소급적용 확인 · 관리자 직접 편집
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {adminMode ? (
              <>
                <span style={{ fontSize: 11, background: "rgba(217,119,6,0.25)", color: "#fcd34d", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(252,211,77,0.3)" }}>
                  ✏️ 관리자 모드 활성화
                </span>
                <button style={{ ...S.btn, color: "rgba(255,255,255,0.8)", borderColor: "rgba(255,255,255,0.2)", background: "transparent", fontSize: 12 }}
                  onClick={() => setAdminMode(false)}>로그아웃</button>
              </>
            ) : (
              <button style={S.btnAdmin} onClick={() => setShowLogin(true)}>🔐 관리자</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 16px 48px" }}>

        {adminMode && (
          <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "8px 16px", marginBottom: 14, fontSize: 12, color: "#92400e", display: "flex", gap: 10, alignItems: "center" }}>
            ✏️ <strong>관리자 모드:</strong> 모든 항목에 편집 버튼이 표시됩니다. 편집 내용은 브라우저에 저장됩니다.
            <button style={{ ...S.btn, fontSize: 11, padding: "3px 10px", marginLeft: "auto", color: "#b91c1c", borderColor: "#fca5a5" }} onClick={handleResetOv}>
              🗑 전체 초기화
            </button>
          </div>
        )}

        {/* ─── 검색 패널 ─── */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,.07)", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e3a5f", marginBottom: 12 }}>📋 건축물 정보 입력</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 12 }}>
            {/* 건축허가일 */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>건축허가일 <span style={{ color: "#ef4444" }}>*</span></div>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                style={{ ...S.input, borderColor: formErr.date ? "#ef4444" : "#e2e8f0" }} />
              {formErr.date && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{formErr.date}</div>}
            </div>
            {/* 연면적 */}
            {[
              ["연면적(㎡)", "area", "예: 1500", true],
              ["지상 층수",  "gf",   "예: 5",    true],
              ["지하 층수",  "bf",   "없으면 0", false],
              ["수용인원(명)", "occ", "예: 100",  false],
            ].map(([lb, k, ph, req]) => (
              <div key={k}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
                  {lb}{req && <span style={{ color: "#ef4444" }}> *</span>}
                </div>
                <input type="number" value={form[k]} placeholder={ph}
                  onChange={e => set(k, e.target.value)}
                  style={{ ...S.input, borderColor: formErr[k] ? "#ef4444" : "#e2e8f0" }} />
                {formErr[k] && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{formErr[k]}</div>}
              </div>
            ))}
          </div>
          {/* 용도 선택 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              특정소방대상물 용도 [별표2] <span style={{ color: "#ef4444" }}>*</span>
            </div>
            <select value={form.btId} onChange={e => set("btId", e.target.value)}
              style={{ ...S.input, borderColor: formErr.btId ? "#ef4444" : "#e2e8f0" }}>
              <option value="">-- 별표2 용도 선택 --</option>
              {BUILDING_TYPES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {formErr.btId && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{formErr.btId}</div>}
          </div>
          <button style={{ ...S.btnPrimary, width: "100%" }} onClick={handleSearch}>
            🔍 법령 연혁 비교 분석
          </button>
        </div>

        {/* ─── 탭 ─── */}
        <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: 16, overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: "10px 18px", fontSize: 13, fontWeight: 600,
                border: "none", cursor: "pointer", whiteSpace: "nowrap",
                fontFamily: "inherit",
                background: tab === t.id ? "#2563eb" : "transparent",
                color:      tab === t.id ? "#fff"    : "#64748b",
                borderRadius: tab === t.id ? "8px 8px 0 0" : "0",
                transition: "all .15s",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ 탭 0: 법령 연혁비교 ═══ */}
        {tab === "compare" && (
          <div id="result-area">
            {result ? (
              <>
                {/* 기본 정보 바 */}
                <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,.06)", fontSize: 12, color: "#64748b", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <span>📅 <strong style={{ color: "#1e293b" }}>{result.date}</strong></span>
                  <span>🏢 <strong style={{ color: "#1e293b" }}>{result.bt.name}</strong></span>
                  <span>📐 <strong style={{ color: "#1e293b" }}>{result.area.toLocaleString()}㎡</strong></span>
                  <span>🏗 지상 <strong style={{ color: "#1e293b" }}>{result.gf}층</strong>{result.bf > 0 && <> / 지하 <strong style={{ color: "#1e293b" }}>{result.bf}층</strong></>}</span>
                  {result.occ > 0 && <span>👥 <strong style={{ color: "#1e293b" }}>{result.occ}명</strong></span>}
                </div>

                {/* 적용 법령 시대 카드 */}
                <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,.06)", borderLeft: `5px solid ${result.era.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span style={{ background: result.era.color, color: "#fff", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>{result.era.label}</span>
                      <span style={{ fontSize: 12, color: "#64748b", marginLeft: 10 }}>{result.era.tableRef} / {result.era.std}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{result.era.start} ~ {result.era.end === "2099-12-31" ? "현재" : result.era.end}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 8, background: "#f8fafc", borderRadius: 7, padding: "6px 10px" }}>{result.era.note}</div>
                </div>

                {/* 소급적용·신규추가 배너 */}
                {(result.diff.added.length > 0 || retroCount > 0) && (
                  <div style={{ background: "#fdf4ff", border: "1px solid #d8b4fe", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#6b21a8" }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ 주의 사항</div>
                    {result.diff.added.length > 0 && (
                      <div>현행 기준에서 <strong>{result.diff.added.length}개 소방시설이 추가</strong>되었습니다. 소급적용 여부 부칙 경과규정 확인 필요.</div>
                    )}
                    {retroCount > 0 && (
                      <div style={{ marginTop: 3 }}>소급적용 해당 항목 <strong>{retroCount}건</strong>이 있습니다 (
                        <span style={{ background: "#f3e8ff", padding: "1px 6px", borderRadius: 10, fontSize: 10 }}>소급</span> 표시 확인).
                      </div>
                    )}
                  </div>
                )}

                {/* 변경 구분 범례 */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, fontSize: 11 }}>
                  {Object.entries(CHANGE_CONFIG).map(([k, v]) => (
                    <span key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={S.badge(v.bg, v.color)}>{v.label}</span>
                    </span>
                  ))}
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={S.badge("#f3e8ff", "#6b21a8")}>소급</span> 소급적용
                  </span>
                </div>

                {/* 2컬럼 비교 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* 왼쪽: 허가일 당시 */}
                  <div>
                    <ColView
                      reqs={result.histReqs}
                      era={result.era}
                      ov={ov}
                      adminMode={adminMode}
                      onEdit={setEditingItem}
                      title={`📅 허가일 당시 기준 — ${result.era.short}`}
                      colStyle={{ background: "#eff6ff", color: "#1e40af" }}
                    />
                  </div>
                  {/* 오른쪽: 현행 */}
                  <div>
                    <ColView
                      reqs={result.currReqs}
                      era={result.curEra}
                      ov={ov}
                      adminMode={adminMode}
                      onEdit={setEditingItem}
                      title={`📋 현행 기준 — ${result.curEra.short}`}
                      colStyle={{ background: "#f0fdf4", color: "#15803d" }}
                    />
                    {/* 신규추가 시설 */}
                    {result.diff.added.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, padding: "7px 12px", borderRadius: 8, background: "#fef2f2", color: "#991b1b", marginBottom: 8 }}>
                          🆕 현행에서 추가된 시설 ({result.diff.added.length}건)
                        </div>
                        {result.diff.added.map((item, i) => (
                          <div key={i} style={{ ...S.card, borderLeft: "3px solid #ef4444", background: "#fef2f2" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>{item.name}</span>
                              <span style={S.badge("#fee2e2", "#991b1b")}>신규추가</span>
                            </div>
                            <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 4 }}>{item.cond}</div>
                            <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 3 }}>⚠️ 소급적용 여부 부칙 확인 필요</div>
                            {adminMode && (
                              <button style={{ ...S.btnAdmin, marginTop: 6, fontSize: 11, padding: "3px 9px" }}
                                onClick={() => setEditingItem(item)}>✏️ 편집</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: 11, color: "#94a3b8", background: "#f8fafc", borderRadius: 8, padding: "8px 12px", marginTop: 16, lineHeight: 1.7 }}>
                  ※ 본 결과는 참고용입니다. 정확한 적용 여부는 건축허가 당시 시행령 원문 및 부칙 경과규정을 반드시 확인하십시오.
                  관리자 모드에서 법령 원문 기준으로 모든 항목을 직접 수정할 수 있습니다.
                </div>
              </>
            ) : (
              <div style={{ background: "#fff", borderRadius: 14, padding: "60px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,.07)" }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🏢</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#475569", marginBottom: 8 }}>건축물 정보를 입력하고 분석을 실행하세요</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28 }}>
                  건축허가일 기준 적용 법령과 현행 법령을 나란히 비교합니다
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  {LAW_ERAS.map(e => (
                    <div key={e.id} style={{ background: e.color + "15", border: `1px solid ${e.color}44`, borderRadius: 8, padding: "5px 12px", fontSize: 11, color: e.color, fontWeight: 700 }}>
                      {e.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ 탭 1: NFTC 기준 ═══ */}
        {tab === "nftc" && (
          <div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              화재안전기준(NFTC/NFSC)은 각 소방시설별 세부 설치기준입니다. 법령 시대에 따라 NFSC(2022이전) → NFTC(2022이후)로 명칭이 변경되었습니다.
            </div>
            {[
              ["NFTC 101", "소화기구", "소화설비", "연면적 33㎡이상 특정소방대상물 전체"],
              ["NFTC 102", "옥내소화전설비", "소화설비", "연면적 3천㎡이상, 또는 지하·무창·4층이상 중 600㎡이상 층"],
              ["NFTC 103A", "스프링클러설비", "소화설비", "6층이상(전면), 의료·노유자 600㎡이상, 문화집회 5천㎡이상 등"],
              ["NFTC 103B", "간이스프링클러설비", "소화설비", "노유자 생활시설(면적무관), 노유자 이용시설 600㎡미만, 요양병원 600㎡미만"],
              ["NFTC 104", "물분무등소화설비", "소화설비", "항공기격납고, 주차전용 800㎡이상, 통신기기실 500㎡이상"],
              ["NFTC 201", "비상경보설비·단독경보형감지기", "경보설비", "연면적 400㎡이상, 수용인원 50명이상 등 소규모 대상"],
              ["NFTC 203", "자동화재탐지설비·시각경보기", "경보설비", "용도별 면적 기준 (600㎡, 1천㎡이상 등)"],
              ["NFTC 204", "자동화재속보설비", "경보설비", "노유자 생활시설(면적무관), 요양병원, 업무·공장 1,500㎡이상"],
              ["NFTC 301", "피난기구", "피난구조설비", "특정소방대상물 3~10층 (피난층·1·2층·11층이상 제외)"],
              ["NFTC 303", "유도등 및 유도표지", "피난구조설비", "특정소방대상물 전체 — 면적·층수 기준 없음 (축사·터널 제외)"],
              ["NFTC 304", "비상조명등·휴대용비상조명등", "피난구조설비", "5층이상+3천㎡이상(동시충족), 지하층 450㎡이상"],
              ["NFTC 401", "상수도소화용수설비", "소화용수설비", "연면적 5천㎡이상"],
              ["NFTC 501", "제연설비", "소화활동설비", "지하상가 1천㎡이상, 영화상영관 100명이상, 무창층 1천㎡이상"],
              ["NFTC 502", "연결송수관설비", "소화활동설비", "5층이상+6천㎡이상(동시충족) 또는 7층이상 단독"],
              ["NFTC 504", "비상콘센트설비", "소화활동설비", "11층이상, 지하3층이상+1천㎡이상"],
              ["NFTC 505", "무선통신보조설비", "소화활동설비", "지하상가 1천㎡이상, 지하층 3천㎡이상"],
            ].map(([code, name, cat, summary]) => (
              <div key={code} style={{ ...S.card, borderLeft: `3px solid ${CAT_COLOR[cat]}`, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>적용기준: {summary}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <span style={S.badge(CAT_COLOR[cat] + "15", CAT_COLOR[cat])}>{cat}</span>
                    <span style={S.badge("#f1f5f9", "#475569")}>{code}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ 탭 2: 법령 시대 ═══ */}
        {tab === "eras" && (
          <div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>소방 법령 체계 변천 이력 (1958 ~ 현재) — 7개 시대</div>
            {LAW_ERAS.map((era, i) => (
              <div key={era.id} style={{ ...S.card, borderLeft: `5px solid ${era.color}`, marginBottom: 10, padding: "13px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: era.color, marginBottom: 2 }}>{era.label}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{era.start} ~ {era.end === "2099-12-31" ? "현재" : era.end}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <span style={S.badge(era.color + "15", era.color)}>{era.std}</span>
                    <span style={S.badge("#f1f5f9", "#64748b")}>시대 {i + 1}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#1e293b", margin: "6px 0 3px" }}>{era.tableRef}</div>
                <div style={{ fontSize: 12, color: "#475569", background: "#f8fafc", borderRadius: 7, padding: "6px 10px", lineHeight: 1.6 }}>
                  {era.note}
                </div>
              </div>
            ))}
            <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#92400e", lineHeight: 1.8 }}>
              <strong>⚠️ 소급적용 원칙:</strong> 기존 건축물은 건축허가 당시 기준 적용이 원칙.
              단, 개정 법령 부칙에서 소급을 명시한 경우 현행 기준 적용 의무 발생.
              자체점검·화재안전조사 시 각 개정의 부칙 경과규정을 반드시 확인하십시오.
            </div>
          </div>
        )}

        {/* ═══ 탭 3: 관리자 ═══ */}
        {tab === "admin" && adminMode && (
          <div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              현재 저장된 편집 항목: <strong style={{ color: "#1e293b" }}>{Object.keys(ov).length}건</strong>
            </div>
            {Object.keys(ov).length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "3rem", fontSize: 13 }}>
                아직 편집된 항목이 없습니다. 연혁비교 탭에서 분석 후 각 항목의 편집 버튼을 클릭하세요.
              </div>
            ) : (
              Object.entries(ov).map(([id, data]) => (
                <div key={id} style={{ ...S.card, marginBottom: 8, borderLeft: "3px solid #d97706" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>ID: {id}</div>
                  {data.cond && <div style={{ fontSize: 11, color: "#64748b" }}>조건: {data.cond}</div>}
                  {data.change && <div style={{ fontSize: 11, color: "#64748b" }}>변경구분: {CHANGE_CONFIG[data.change]?.label}</div>}
                  {data.retro && <div style={{ fontSize: 11, color: "#6b21a8" }}>소급: {data.retroNote}</div>}
                  {data.adminNote && <div style={{ fontSize: 11, color: "#94a3b8" }}>메모: {data.adminNote}</div>}
                  <button style={{ ...S.btn, fontSize: 11, padding: "3px 10px", marginTop: 6, color: "#b91c1c", borderColor: "#fca5a5" }}
                    onClick={() => {
                      const next = { ...ov };
                      delete next[id];
                      setOv(next);
                      saveOverrides(next);
                    }}>🗑 삭제</button>
                </div>
              ))
            )}
            {Object.keys(ov).length > 0 && (
              <button style={{ ...S.btn, color: "#b91c1c", borderColor: "#fca5a5", marginTop: 8 }} onClick={handleResetOv}>
                🗑 전체 초기화
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── 푸터 ─── */}
      <div style={{ background: "#1e293b", color: "#94a3b8", textAlign: "center", padding: "14px 20px", fontSize: 11, lineHeight: 1.8 }}>
        SFHC v1.0 — 소방시설 법령 연혁비교 시스템 | 참고용 시스템 (법적 효력 없음)<br />
        데이터 출처: 소방시설법 시행령 별표4(2025.11.25 기준) / 관리자 직접 수정 가능<br />
        정확한 기준은 국가법령정보센터(law.go.kr) 원문 및 관할 소방서 확인 필수
      </div>
    </div>
  );
}

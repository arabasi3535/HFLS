import { useEffect, useMemo, useState } from "react";
import Wizard, { EMPTY } from "./components/Wizard";
import Report from "./components/Report";
import { HistoryTab, RulesTab, GuideTab } from "./components/InfoTabs";
import { review } from "./law/engine";
import { getUse } from "./law/uses";
import { RULES_REV } from "./law/sources";
import BUILD from "./buildInfo.json";

// 관리자 비밀번호: Vercel 환경변수 REACT_APP_ADMIN_PW 로 변경 가능 (클라이언트 측 잠금 — 보안 수단 아님)
const ADMIN_PW = process.env.REACT_APP_ADMIN_PW || "3535";
// 제작자 표시 (머리말 오른쪽·바닥글·인쇄물)
const AUTHOR = { org: "안동소방서 예방안전과", name: "이제현" };
const K = { new: "hfls_new_v3", existing: "hfls_exist_v3", ov: "hfls_overrides_v2" };

const load = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch (e) {
    return d;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    /* 저장 불가 환경 무시 */
  }
};
const restore = (k) => {
  const v = load(k, null);
  return v ? { ...EMPTY, ...v, f: v.f || {}, floors: v.floors || [] } : EMPTY;
};

/** 한국 시간 기준 오늘 'YYYY-MM-DD' */
function todayKST() {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

function validate(input, mode) {
  const e = {};
  if (mode === "existing") {
    if (!input.date) e.date = "건축허가일을 입력하십시오.";
    else if (input.date > todayKST()) e.date = "오늘 이후 날짜입니다.";
  }
  const u = getUse(input.use);
  if (!u) e.use = "대상물 분류를 선택하십시오.";
  else if (u.g.includes("tunnel")) {
    if (!(parseFloat(input.f.tunnelLen) > 0)) e.area = "터널 길이를 입력하십시오.";
  } else if (!u.g.includes("ugduct")) {
    if (input.gf === "" || !(parseInt(input.gf, 10) >= 0)) e.gf = "지상 층수를 입력하십시오.";
    if (!(parseFloat(input.area) > 0)) e.area = "연면적을 입력하십시오.";
  }
  return e;
}

export default function App() {
  const [inputs, setInputs] = useState(() => ({ new: restore(K.new), existing: restore(K.existing) }));
  const [overrides, setOverrides] = useState(() => load(K.ov, {}));
  const [submitted, setSubmitted] = useState({ new: null, existing: null });
  const [errors, setErrors] = useState({ new: {}, existing: {} });
  const [tab, setTab] = useState("new");
  const [adminMode, setAdminMode] = useState(false);
  const today = useMemo(todayKST, []);

  useEffect(() => save(K.new, inputs.new), [inputs.new]);
  useEffect(() => save(K.existing, inputs.existing), [inputs.existing]);
  useEffect(() => save(K.ov, overrides), [overrides]);

  const mode = tab === "existing" ? "existing" : "new";
  const isInput = tab === "new" || tab === "existing";
  const setInput = (upd) => setInputs((p) => ({ ...p, [mode]: typeof upd === "function" ? upd(p[mode]) : upd }));

  const rv = useMemo(() => {
    const s = submitted[mode];
    if (!s) return null;
    const inp = { ...s, action: "new", date: mode === "new" ? today : s.date };
    return review(inp, today, overrides);
  }, [submitted, mode, today, overrides]);

  const run = () => {
    const input = inputs[mode];
    const e = validate(input, mode);
    setErrors((p) => ({ ...p, [mode]: e }));
    if (Object.keys(e).length) return;
    setSubmitted((p) => ({ ...p, [mode]: { ...JSON.parse(JSON.stringify(input)), _run: Date.now() } }));
    setTimeout(() => {
      const el = document.getElementById("result-top");
      if (el && window.innerWidth < 960) el.scrollIntoView({ behavior: "smooth" });
    }, 60);
  };
  const reset = () => {
    setInputs((p) => ({ ...p, [mode]: EMPTY }));
    setSubmitted((p) => ({ ...p, [mode]: null }));
    setErrors((p) => ({ ...p, [mode]: {} }));
  };

  const login = () => {
    if (adminMode) {
      setAdminMode(false);
      if (tab === "history" || tab === "rules") setTab("new");
      return;
    }
    const pw = window.prompt("관리자 비밀번호");
    if (pw === null) return;
    if (pw === ADMIN_PW) setAdminMode(true);
    else alert("비밀번호가 올바르지 않습니다.");
  };

  const tabs = [
    ["new", "신축 건축물"],
    ["existing", "기존 건축물"],
    ["guide", "사용 안내"],
    ...(adminMode
      ? [
          ["history", "법령 연혁"],
          ["rules", "규칙·검증"],
        ]
      : []),
  ];

  return (
    <div className="app">
      <header className="top no-print">
        <div className="top-in">
          <div className="brand-col">
            <div className="brand-row">
              <span className="brand">HFLS</span>
              <span className="ver-badge" title={`빌드 ${BUILD.builtAt} KST · 커밋 ${BUILD.commit} · ${BUILD.env}\n판정규칙 ${RULES_REV.date}: ${RULES_REV.note}`}>
                v{BUILD.version}
              </span>
            </div>
            <h1>소방시설 적용 검토</h1>
          </div>
          <div className="top-right">
            <div className="author" title="제작">
              <span className="author-org">{AUTHOR.org}</span>
              <span className="author-name">{AUTHOR.name}</span>
            </div>
            <button className={`admin-btn ${adminMode ? "on" : ""}`} onClick={login} title={adminMode ? "관리자 모드 해제" : "관리자"}>
              {adminMode ? "관리자 ON" : "관리자"}
            </button>
          </div>
        </div>
        <nav className="tabs">
          {tabs.map(([k, l]) => (
            <button key={k} className={`${tab === k ? "on" : ""} ${k === "history" || k === "rules" ? "adm" : ""}`} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {isInput && (
          <div className="layout">
            <aside className="no-print">
              <Wizard key={mode} mode={mode} input={inputs[mode]} setInput={setInput} onRun={run} onReset={reset} errors={errors[mode]} />
            </aside>
            <section id="result-top" className="results">
              {rv ? (
                <Report key={`${mode}-${submitted[mode]._run}`} rv={rv} mode={mode} adminMode={adminMode} author={AUTHOR} />
              ) : (
                <div className="empty">
                  <div className="empty-t">{mode === "new" ? "오늘 허가 신청하는 건축물" : "이미 허가받은 건축물"}</div>
                  <div className="empty-d">
                    {mode === "new"
                      ? "대상물 분류부터 차례로 입력하면 현행 시행령 별표4에 따라 설치할 소방시설을 산정합니다."
                      : "건축물대장의 건축허가일을 입력하면 당시 시행령 별표4로 산정하고, 부칙 소급 시설을 구분해 표시합니다."}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
        {tab === "guide" && <GuideTab adminMode={adminMode} />}
        {adminMode && tab === "history" && <HistoryTab />}
        {adminMode && tab === "rules" && <RulesTab adminMode={adminMode} overrides={overrides} setOverrides={setOverrides} />}
      </main>

      <footer className="foot no-print">
        <span className="foot-author">
          제작 · {AUTHOR.org} {AUTHOR.name}
        </span>
        <span className="ver-line">
          v{BUILD.version} · 빌드 {BUILD.builtAt} KST{adminMode ? ` · ${BUILD.commit} · 판정규칙 ${RULES_REV.date}` : ""}
        </span>
        <span>현행 기준: 소방시설 설치 및 관리에 관한 법률 시행령 별표4(2025.11.25. 개정) · 판정일 {today}</span>
        <span>업무 참고용(법적 효력 없음)</span>
      </footer>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import InputPanel, { EMPTY_INPUT, syncFloors } from "./components/InputPanel";
import ResultView from "./components/ResultView";
import { HistoryTab, RulesTab, GuideTab } from "./components/InfoTabs";
import { review } from "./law/engine";
import { RULES_REV } from "./law/sources";
import BUILD from "./buildInfo.json";

// 관리자 비밀번호: Vercel 환경변수 REACT_APP_ADMIN_PW 로 변경 가능 (클라이언트 측 잠금 — 보안 수단 아님)
const ADMIN_PW = process.env.REACT_APP_ADMIN_PW || "3535";
const K_INPUT = "hfls_input_v2";
const K_OV = "hfls_overrides_v2";

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

/** 한국 시간 기준 오늘 'YYYY-MM-DD' */
function todayKST() {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

const EXAMPLE = (() => {
  const base = {
    ...EMPTY_INPUT,
    action: "new",
    date: "2015-05-20",
    use: "hosp",
    area: "1450",
    gf: "4",
    bf: "1",
    occ: "",
    useArea: "",
    f: { parkingInside: "", elecRoom: "" },
  };
  const floors = syncFloors(base).map((fl) => ({ ...fl, area: "290" }));
  return { ...base, floors };
})();

export default function App() {
  const [input, setInput] = useState(() => {
    const v = load(K_INPUT, null);
    return v ? { ...EMPTY_INPUT, ...v, f: v.f || {}, extExceptions: v.extExceptions || {} } : EMPTY_INPUT;
  });
  const [overrides, setOverrides] = useState(() => load(K_OV, {}));
  const [submitted, setSubmitted] = useState(null);
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState("review");
  const [adminMode, setAdminMode] = useState(false);
  const today = useMemo(todayKST, []);

  useEffect(() => save(K_INPUT, input), [input]);
  useEffect(() => save(K_OV, overrides), [overrides]);

  const rv = useMemo(() => (submitted ? review(submitted, today, overrides) : null), [submitted, today, overrides]);

  const run = () => {
    const e = {};
    if (!input.date) e.date = "기준일을 입력하십시오.";
    if (input.action !== "new") {
      if (!input.date2) e.date2 = "증축·용도변경 신청일을 입력하십시오.";
      else if (input.date && input.date2 < input.date) e.date2 = "최초 신청일보다 이후여야 합니다.";
    }
    if (!input.use) e.use = "용도를 선택하십시오.";
    if (!(parseFloat(input.area) > 0)) e.area = "연면적을 입력하십시오.";
    if (input.gf === "" || parseInt(input.gf, 10) < 0) e.gf = "지상 층수를 입력하십시오.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitted(JSON.parse(JSON.stringify(input)));
    setTab("review");
    setTimeout(() => {
      const el = document.getElementById("result-top");
      if (el && window.innerWidth < 960) el.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const login = () => {
    if (adminMode) {
      setAdminMode(false);
      if (tab === "history" || tab === "rules") setTab("review"); // 관리자 전용 탭에서 해제 시 적용 검토로
      return;
    }
    const pw = window.prompt("관리자 비밀번호");
    if (pw === null) return;
    if (pw === ADMIN_PW) setAdminMode(true);
    else alert("비밀번호가 올바르지 않습니다.");
  };

  // 일반 사용자: 적용 검토·사용 안내 / 관리자 모드: 법령 연혁·규칙·검증현황 추가
  const tabs = adminMode
    ? [
        ["review", "적용 검토"],
        ["guide", "사용 안내"],
        ["history", "법령 연혁 (관리자)"],
        ["rules", "규칙·검증현황 (관리자)"],
      ]
    : [
        ["review", "적용 검토"],
        ["guide", "사용 안내"],
      ];

  return (
    <div className="app">
      <header className="top no-print">
        <div className="top-in">
          <div>
            <div className="brand-row">
              <span className="brand">HFLS</span>
              <span className="ver-badge" title={`빌드 ${BUILD.builtAt} KST · 커밋 ${BUILD.commit} · ${BUILD.env}\n판정규칙 ${RULES_REV.date}: ${RULES_REV.note}`}>
                v{BUILD.version} · {BUILD.builtAt.slice(0, 10)}
              </span>
            </div>
            <h1>소방시설 연혁 법령 적용 지원 시스템</h1>
            <div className="sub">건축허가등 신청일 기준 별표 판정 · 부칙 소급 · 강화기준 특례 · 증축·용도변경 특례 · 현행 비교</div>
          </div>
          <button className={`btn small ${adminMode ? "on" : ""}`} onClick={login}>
            {adminMode ? "관리자 모드 해제" : "관리자"}
          </button>
        </div>
        <nav className="tabs">
          {tabs.map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {tab === "review" && (
          <div className="layout">
            <aside className="no-print">
              <InputPanel
                input={input}
                setInput={setInput}
                errors={errors}
                onRun={run}
                onReset={() => {
                  setInput(EMPTY_INPUT);
                  setSubmitted(null);
                  setErrors({});
                }}
                onExample={() => {
                  setInput(EXAMPLE);
                  setErrors({});
                }}
              />
            </aside>
            <section id="result-top" className="results">
              {rv ? (
                <ResultView rv={rv} />
              ) : (
                <div className="empty">
                  <div className="empty-t">건축물 정보를 입력하고 「판정 실행」을 누르십시오.</div>
                  <ol>
                    <li>기준일은 <b>건축허가등 신청(신고)일</b>입니다.</li>
                    <li>층별 바닥면적·무창층을 입력할수록 '층' 단위 기준(옥내소화전·스프링클러·비상조명등 등)이 정확해집니다.</li>
                    <li>결과의 각 행을 누르면 조항·대상물 수치·원문 링크·검증등급이 표시됩니다.</li>
                  </ol>
                </div>
              )}
            </section>
          </div>
        )}
        {adminMode && tab === "history" && <HistoryTab />}
        {adminMode && tab === "rules" && <RulesTab adminMode={adminMode} overrides={overrides} setOverrides={setOverrides} />}
        {tab === "guide" && <GuideTab />}
      </main>

      <footer className="foot">
        <span className="ver-line">
          HFLS v{BUILD.version} · 빌드 {BUILD.builtAt} KST · {BUILD.commit} · 판정규칙 {RULES_REV.date}
        </span>
        <br />
        현행 기준: 소방시설 설치 및 관리에 관한 법률 시행령(대통령령 제36728호, 2026.10.2. 시행) 별표4(2025.11.25. 개정) · 판정일 {today}
        <br />
        업무 참고용(법적 효력 없음). 최종 판단은 국가법령정보센터 연혁본·부칙 및 소방청 질의회신으로 확인하십시오.
      </footer>
    </div>
  );
}

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import Wizard, { EMPTY } from "./components/Wizard";
import Report from "./components/Report";
import { HistoryTab, RulesTab, GuideTab } from "./components/InfoTabs";
import { BugReportModal, ReportsTab } from "./components/Feedback";
import Tools from "./components/Tools";
import { loadStats, adminAuth, loadNotice, saveNotice } from "./lib/remote";
import { review } from "./law/engine";
import { safetyReview } from "./law/safety";
import { getUse } from "./law/uses";
import { RULES_REV } from "./law/sources";
import BUILD from "./buildInfo.json";

const InspectionReport = lazy(() => import("./components/InspectionReport"));

// 관리자 비밀번호
//  - 배포 사이트: 서버 환경변수 ADMIN_PW로 확인(화면 코드에 비밀번호가 들어가지 않음)
//  - ADMIN_PW 미설정·로컬 실행: 아래 값으로 확인(법령 연혁·규칙 화면만 — 오류 신고함은 열리지 않음)
const LOCAL_ADMIN_PW = process.env.REACT_APP_ADMIN_PW || "3535";
// 제작자 표시 (머리말 오른쪽·바닥글·인쇄물)
const AUTHOR = { org: "안동소방서 예방안전과", name: "이제현" };
const K = { new: "hfls_new_v3", existing: "hfls_exist_v3", ov: "hfls_overrides_v2", sel: "hfls_sel_v3" };

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
    if (!input.date) e.date = "건축허가일";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || input.date < "1958-01-01") e.date = "건축허가일(날짜 확인)";
    else if (input.date > todayKST()) e.date = "건축허가일(오늘 이후 날짜)";
  }
  const u = getUse(input.use);
  if (!u) e.use = "대상물 분류";
  else if (u.g.includes("tunnel")) {
    if (!(parseFloat(input.f.tunnelLen) > 0)) e.area = "터널 길이";
  } else if (!u.g.includes("ugduct")) {
    if (input.gf === "" || !(parseInt(input.gf, 10) >= 0)) e.gf = "지상 층수";
    if (!(parseFloat(input.area) > 0)) e.area = "연면적";
  }
  return e;
}

/** 입력 도중 값(2→24→240…)으로 판정이 흔들리지 않도록 잠시 멈췄을 때 반영 */
function useDebounced(v, ms) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

/** 결과가 잠정인 이유 */
function provisionalReasons(rv, input) {
  const out = [];
  const u = rv.use;
  const hasFloors = !u.g.includes("tunnel") && !u.g.includes("ugduct") && !u.g.includes("house") && (input.floors || []).length > 0;
  if (hasFloors && !(input.floors || []).every((f) => parseFloat(f.area) > 0)) out.push("층별 바닥면적 미입력(연면적 범위로 판정)");
  const nChk = rv.hist.rows.filter((r) => r.status === "확인 필요").length;
  if (nChk) out.push(`확인 필요 ${nChk}건`);
  return out;
}

export default function App() {
  const [inputs, setInputs] = useState(() => ({ new: restore(K.new), existing: restore(K.existing) }));
  const [overrides, setOverrides] = useState(() => load(K.ov, {}));
  const [sels, setSels] = useState(() => load(K.sel, { new: {}, existing: {} }));
  const [tab, setTab] = useState("new");
  const [adminMode, setAdminMode] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [stats, setStats] = useState(null);
  const [bug, setBug] = useState(false);
  const [notice, setNotice] = useState(null);
  const [reportSeed, setReportSeed] = useState(null);
  const [noteEdit, setNoteEdit] = useState(null); // 편집 중인 메모 문자열(null = 편집 안 함)
  const today = useMemo(todayKST, []);

  // 업데이트 메모: 서버 저장값(현재 버전용)이 있으면 그것, 없으면 기본 메모
  useEffect(() => {
    let alive = true;
    loadNotice().then((n) => alive && setNotice(n));
    return () => {
      alive = false;
    };
  }, []);
  const defaultNote = RULES_REV.version === BUILD.version ? RULES_REV.note : "";
  const relNote = notice && notice.version === BUILD.version ? notice.text : defaultNote;
  const saveNote = async () => {
    if (!adminPw) {
      alert("메모 저장은 서버 관리자 비밀번호(Vercel 환경변수 ADMIN_PW)로 로그인한 경우에만 가능합니다.");
      return;
    }
    const r = await saveNotice(adminPw, BUILD.version, noteEdit || "");
    if (r.error) return alert(r.error);
    setNotice(r.notice || null);
    setNoteEdit(null);
  };

  // 사용 횟수(접속 기준, 같은 탭은 1회) — 저장소 미설정이면 표시하지 않음
  useEffect(() => {
    let alive = true;
    loadStats().then((s) => alive && setStats(s));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => save(K.new, inputs.new), [inputs.new]);
  useEffect(() => save(K.existing, inputs.existing), [inputs.existing]);
  useEffect(() => save(K.ov, overrides), [overrides]);
  useEffect(() => save(K.sel, sels), [sels]);

  const mode = tab === "existing" ? "existing" : "new";
  const isInput = tab === "new" || tab === "existing";
  const setInput = (upd) => setInputs((p) => ({ ...p, [mode]: typeof upd === "function" ? upd(p[mode]) : upd }));

  const deb = useDebounced(inputs, 350);
  const live = deb[mode];
  const missing = useMemo(() => Object.values(validate(live, mode)), [live, mode]);
  const rv = useMemo(() => {
    if (missing.length) return null;
    const inp = { ...live, action: "new", date: mode === "new" ? today : live.date };
    try {
      return review(inp, today, overrides);
    } catch (e) {
      return null;
    }
  }, [live, missing, mode, today, overrides]);
  const sv = useMemo(() => {
    if (!rv) return null;
    try {
      return safetyReview(rv, mode);
    } catch (e) {
      return null;
    }
  }, [rv, mode]);
  const provisional = useMemo(() => (rv ? provisionalReasons(rv, live) : []), [rv, live]);
  const setSel = (upd) => setSels((p) => ({ ...p, [mode]: typeof upd === "function" ? upd(p[mode]) : upd }));
  // 날짜 형식 오류만 입력란에 표시(미입력은 결과 영역에서 안내)
  const dateErr = mode === "existing" && inputs.existing.date && missing.find((m) => m.startsWith("건축허가일("));

  const reset = () => {
    setInputs((p) => ({ ...p, [mode]: EMPTY }));
    setSels((p) => ({ ...p, [mode]: {} }));
  };

  const login = async () => {
    if (adminMode) {
      setAdminMode(false);
      setAdminPw("");
      if (tab === "history" || tab === "rules" || tab === "reports") setTab("new");
      return;
    }
    const pw = window.prompt("관리자 비밀번호");
    if (pw === null) return;
    const r = await adminAuth(pw);
    if (r.error) return alert(r.error);
    if (r.ok) {
      setAdminMode(true);
      setAdminPw(pw);
      return;
    }
    // 서버에 ADMIN_PW가 없거나 연결되지 않을 때만 로컬 비밀번호 사용(신고함 제외)
    if ((r.unset || r.unreachable) && pw === LOCAL_ADMIN_PW) {
      setAdminMode(true);
      setAdminPw("");
      return;
    }
    alert("비밀번호가 올바르지 않습니다.");
  };

  const tabs = [
    ["new", "신축 건축물"],
    ["existing", "기존 건축물"],
    ["tools", "보조 계산기"],
    ["report", "작동점검 보고서"],
    ["guide", "사용 안내"],
    ...(adminMode
      ? [
          ["history", "법령 연혁"],
          ["rules", "규칙·검증"],
          ["reports", "오류 신고함"],
        ]
      : []),
  ];

  return (
    <div className="app">
      <header className="top no-print">
        <div className="top-in">
          <div className="brand-col">
            <div className="brand-row">
              <span className="ver-badge" title={`빌드 ${BUILD.builtAt} KST · 커밋 ${BUILD.commit} · ${BUILD.env}\n판정규칙 ${RULES_REV.date}`}>
                v{BUILD.version}
              </span>
              {noteEdit !== null ? (
                <span className="rel-form">
                  <input
                    value={noteEdit}
                    maxLength={120}
                    placeholder="이번 버전에서 추가·변경된 내용 (한 줄, 120자)"
                    onChange={(e) => setNoteEdit(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveNote();
                      if (e.key === "Escape") setNoteEdit(null);
                    }}
                    autoFocus
                  />
                  <button type="button" className="ok" onClick={saveNote}>
                    저장
                  </button>
                  <button type="button" className="cancel" onClick={() => setNoteEdit(null)}>
                    취소
                  </button>
                </span>
              ) : (
                <>
                  {relNote && (
                    <span className="rel-note" title={notice && notice.version === BUILD.version ? `${relNote}\n(${notice.at} 작성)` : relNote}>
                      {relNote}
                    </span>
                  )}
                  {adminMode && (
                    <button type="button" className="rel-edit" onClick={() => setNoteEdit(relNote || "")} title="버전 옆 업데이트 메모 수정(관리자)">
                      메모 수정
                    </button>
                  )}
                </>
              )}
              {stats && (
                <span className="usage" title={`접속 기준(같은 탭 새로고침은 1회) · ${stats.date} 한국시간`}>
                  오늘 {stats.today.toLocaleString("ko-KR")} · 누적 {stats.total.toLocaleString("ko-KR")}
                </span>
              )}
            </div>
            <h1>소방시설 적용·안전관리 검토 시스템</h1>
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
            <button key={k} className={`${tab === k ? "on" : ""} ${k === "history" || k === "rules" || k === "reports" ? "adm" : ""}`} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {isInput && (
          <div className="layout">
            <aside className="no-print">
              <Wizard key={mode} mode={mode} input={inputs[mode]} setInput={setInput} onReset={reset} errors={dateErr ? { date: dateErr.replace(/^건축허가일\(|\)$/g, "") } : {}} />
            </aside>
            <section id="result-top" className="results">
              {rv ? (
                <Report
                  key={mode}
                  rv={rv}
                  sv={sv}
                  onMakeReport={(s) => {
                    setReportSeed(s);
                    setTab("report");
                    window.scrollTo(0, 0);
                  }}
                  mode={mode} adminMode={adminMode} author={AUTHOR} sel={sels[mode]} setSel={setSel} provisional={provisional} onReport={() => setBug(true)} />
              ) : (
                <div className="empty">
                  <div className="empty-t">{mode === "new" ? "오늘 허가 신청하는 건축물" : "이미 허가받은 건축물"}</div>
                  <div className="empty-d">
                    {mode === "new"
                      ? "대상물 분류부터 차례로 입력하면 현행 시행령 별표4에 따라 설치할 소방시설이 바로 표시됩니다."
                      : "건축물대장의 건축허가일을 입력하면 당시 시행령 별표4로 산정하고, 부칙 소급 시설을 구분해 표시합니다."}
                  </div>
                  {missing.length > 0 && (
                    <div className="empty-need">
                      남은 필수 입력: <b>{missing.join(" · ")}</b>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
        {tab === "tools" && <Tools />}
        {tab === "report" && (
          <Suspense fallback={<div className="empty">불러오는 중…</div>}>
            <InspectionReport
              seed={reportSeed}
              onGoExisting={() => {
                setTab("existing");
                window.scrollTo(0, 0);
              }}
            />
          </Suspense>
        )}
        {tab === "guide" && <GuideTab adminMode={adminMode} />}
        {adminMode && tab === "history" && <HistoryTab />}
        {adminMode && tab === "rules" && <RulesTab adminMode={adminMode} overrides={overrides} setOverrides={setOverrides} />}
        {adminMode && tab === "reports" && (
          <ReportsTab
            adminPw={adminPw}
            onLoadInput={(m, input) => {
              const md = m === "existing" ? "existing" : "new";
              setInputs((p) => ({ ...p, [md]: { ...EMPTY, ...input, f: input.f || {}, floors: input.floors || [] } }));
              setTab(md);
            }}
          />
        )}
      </main>

      <footer className="foot no-print">
        <span className="foot-author">
          제작 · {AUTHOR.org} {AUTHOR.name}
        </span>
        <span className="ver-line">
          v{BUILD.version} · 빌드 {BUILD.builtAt} KST{adminMode ? ` · ${BUILD.commit} · 판정규칙 ${RULES_REV.date}` : ""}
        </span>
        <span>현행 기준: 소방시설법 시행령 별표4(2025.11.25. 개정)·제30조, 화재예방법 시행령 별표4, 소방기본법 시행령 제7조의12 · 판정일 {today}</span>
        <span>업무 참고용(법적 효력 없음)</span>
        <button type="button" className="fb-btn" onClick={() => setBug(true)}>
          오류 신고 · 의견 보내기
        </button>
      </footer>
      {bug && (
        <BugReportModal
          version={BUILD.version}
          onClose={() => setBug(false)}
          context={
            isInput && rv
              ? {
                  mode,
                  input: live,
                  result: [
                    ...rv.hist.rows.filter((r) => r.status !== "해당없음").map((r) => `${r.fac.name}:${r.status}`),
                    ...(sv ? [`소방안전관리:${sv.grade.grade || sv.grade.status}`, `방염:${sv.flame.status}`, `전용구역:${sv.lane.status}`] : []),
                  ],
                }
              : isInput
              ? { mode, input: live }
              : null
          }
        />
      )}
    </div>
  );
}

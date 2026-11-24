import { useMemo, useState } from "react";
import { PAPERS, PAPER_GROUPS, PAPER_CHECKED, JOURNALS } from "../law/papers";

// ============================================================
// 기타 자료 › 논문 자료 — 무료 열람 학술지 2곳(한국화재소방학회·한국방재학회)의 소방공무원·소방시설 논문
//  · 맨 위: 두 학술지 바로가기와 「두 학술지에서 검색」(각 학술지 검색 결과 페이지를 새 창으로)
//  · 아래: 이 앱이 골라 둔 논문 목록 — 분야·학술지·검색어로 거르기
// ============================================================

const short = (s) => (s === "k" ? "화재소방학회" : "방재학회");

function JournalBox() {
  const [w, setW] = useState("");
  const go = (k) => window.open(JOURNALS[k].search(w.trim()), "_blank", "noopener");
  return (
    <section className="pj">
      <div className="pj-cards">
        {Object.entries(JOURNALS).map(([k, j]) => (
          <div key={k} className="pj-card">
            <b>{j.name}</b>
            <span>
              {j.en} · {j.org} · 무료 열람
            </span>
            <div className="pj-links">
              <a href={j.home} target="_blank" rel="noopener noreferrer">
                학술지 홈
              </a>
              <a href={j.adv} target="_blank" rel="noopener noreferrer">
                논문 검색
              </a>
              <a href={j.archive} target="_blank" rel="noopener noreferrer">
                권호별 보기
              </a>
            </div>
          </div>
        ))}
      </div>
      <form
        className="pp-bar"
        onSubmit={(e) => {
          e.preventDefault();
          if (w.trim()) {
            go("k");
            go("j");
          }
        }}
      >
        <input type="search" value={w} onChange={(e) => setW(e.target.value)} placeholder="두 학술지 누리집에서 바로 검색 (예: 스프링클러, firefighter, 비화재보)" aria-label="학술지 검색어" />
        <button type="submit" className="btn small" disabled={!w.trim()}>
          두 곳 모두 검색
        </button>
        <button type="button" className="btn small pp-reset" disabled={!w.trim()} onClick={() => go("k")}>
          화재소방학회만
        </button>
        <button type="button" className="btn small pp-reset" disabled={!w.trim()} onClick={() => go("j")}>
          방재학회만
        </button>
      </form>
      <div className="lw-note">검색 결과는 각 학술지 누리집 새 창(탭)으로 열립니다. 「두 곳 모두」가 하나만 열리면 브라우저의 팝업 허용을 켜 주세요.</div>
    </section>
  );
}

export default function PaperTab() {
  const [q, setQ] = useState("");
  const [g, setG] = useState("all");
  const [s, setS] = useState("all");
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return PAPERS.filter(
      (p) =>
        (g === "all" || p.g === g) &&
        (s === "all" || p.s === s) &&
        (!k || [p.t, p.e, p.a, JOURNALS[p.s].name, p.n, String(p.y || "")].join(" ").toLowerCase().includes(k))
    );
  }, [q, g, s]);
  const groups = PAPER_GROUPS.filter(([key]) => g === "all" || key === g)
    .map(([key, name]) => [key, name, list.filter((p) => p.g === key).sort((a, b) => (b.y || 0) - (a.y || 0))])
    .filter((x) => x[2].length);

  return (
    <div className="pp">

      <JournalBox />

      <div className="pp-bar">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="목록에서 찾기 — 제목·저자·연도" aria-label="논문 검색" />
        <select value={g} onChange={(e) => setG(e.target.value)} aria-label="분야">
          <option value="all">전체 분야</option>
          {PAPER_GROUPS.map(([k, n]) => (
            <option key={k} value={k}>
              {n} ({PAPERS.filter((p) => p.g === k).length})
            </option>
          ))}
        </select>
        <select value={s} onChange={(e) => setS(e.target.value)} aria-label="학술지">
          <option value="all">두 학술지 모두</option>
          {Object.entries(JOURNALS).map(([k, j]) => (
            <option key={k} value={k}>
              {j.name} ({PAPERS.filter((p) => p.s === k).length})
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn small pp-reset"
          disabled={!q && g === "all" && s === "all"}
          onClick={() => {
            setQ("");
            setG("all");
            setS("all");
          }}
        >
          초기화
        </button>
        <span className="pp-count">{list.length}편</span>
      </div>

      {groups.length === 0 && <div className="pp-empty">검색 결과가 없습니다.</div>}

      {groups.map(([key, name, items]) => (
        <section key={key} className="pp-sec">
          <h4>
            {name} <span>{items.length}</span>
          </h4>
          <ol>
            {items.map((p) => (
              <li key={p.url}>
                <a className="pp-t" href={p.url} target="_blank" rel="noopener noreferrer">
                  {p.t}
                </a>
                {p.e && <div className="pp-e">{p.e}</div>}
                <div className="pp-m">
                  <em className={`pp-j ${p.s}`}>{short(p.s)}</em> {p.a || <em className="pp-need">저자 확인 필요</em>}
                  {p.ac && <em className="pp-need"> 외(공저자 확인 필요)</em>} · 『{JOURNALS[p.s].name}』 {p.v}
                  {p.p ? `, pp.${p.p}` : ""}, {p.y}
                  {p.doi && (
                    <>
                      {" · "}
                      <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer">
                        DOI {p.doi}
                      </a>
                    </>
                  )}
                </div>
                {p.n && <div className="pp-n">{p.n}</div>}
              </li>
            ))}
          </ol>
        </section>
      ))}

      <div className="pp-foot">
        서지 확인일 {PAPER_CHECKED} — 각 학술지 누리집 검색 결과의 제목·저자·권호·쪽·DOI. 2019년 이후 논문 중심이며, 그 전 논문 일부는 이전 목록에서
        두 학술지 논문만 남겼습니다. 한 줄 메모는 이 앱에서 쓴 활용 안내입니다.
      </div>
    </div>
  );
}

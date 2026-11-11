import { useMemo, useState } from "react";
import { PAPERS, PAPER_GROUPS, PAPER_CHECKED } from "../law/papers";

// ============================================================
// 기타 자료 › 논문 자료 — 서지정보 + 공식 열람 페이지 링크(원문은 각 학술DB에서 열람)
// ============================================================

const NEED = "확인 필요";

function Cite({ p }) {
  const vol = p.v ? ` ${p.v}` : "";
  const pg = p.p ? `, pp.${p.p}` : "";
  const yr = p.y ? `, ${p.y}` : "";
  return (
    <span className="pp-cite">
      {p.j === NEED ? <em className="pp-need">게재지 {NEED}</em> : `『${p.j}』${vol}${pg}`}
      {yr}
    </span>
  );
}

function Authors({ p }) {
  if (!p.a) return <em className="pp-need">저자 {NEED}</em>;
  return (
    <>
      {p.a}
      {p.ac && <em className="pp-need"> 외(공저자 {NEED})</em>}
    </>
  );
}

export default function PaperTab() {
  const [q, setQ] = useState("");
  const [g, setG] = useState("all");
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return PAPERS.filter(
      (p) =>
        (g === "all" || p.g === g) &&
        (!k || [p.t, p.a, p.j, p.n, String(p.y || "")].join(" ").toLowerCase().includes(k))
    );
  }, [q, g]);
  const groups = PAPER_GROUPS.filter(([key]) => g === "all" || key === g)
    .map(([key, name]) => [key, name, list.filter((p) => p.g === key).sort((a, b) => (b.y || 0) - (a.y || 0))])
    .filter((x) => x[2].length);

  return (
    <div className="pp">
      <div className="vd-head pp-head">
        <div>
          <b>논문 자료 {PAPERS.length}편</b>
          <p>
            소방시설 적용·인허가·안전관리 관련 국내 논문의 서지정보와 공식 열람 페이지 링크입니다. 원문은 링크된
            학술DB(KoreaScience·교보문고 스콜라·earticle·학회 누리집)에서 각 DB의 이용 조건에 따라 열람하세요.
          </p>
        </div>
      </div>

      <div className="pp-bar">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목·저자·학술지·연도 검색"
          aria-label="논문 검색"
        />
        <select value={g} onChange={(e) => setG(e.target.value)} aria-label="분야">
          <option value="all">전체 분야</option>
          {PAPER_GROUPS.map(([k, n]) => (
            <option key={k} value={k}>
              {n} ({PAPERS.filter((p) => p.g === k).length})
            </option>
          ))}
        </select>
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
              <li key={p.t}>
                <a className="pp-t" href={p.url} target="_blank" rel="noopener noreferrer">
                  {p.t}
                </a>
                <div className="pp-m">
                  <Authors p={p} /> · <Cite p={p} />
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
        서지 확인일 {PAPER_CHECKED}. 초록·본문은 싣지 않았고, 한 줄 메모는 이 앱에서 쓴 활용 안내입니다. 「{NEED}」는 출처
        페이지에서 확인하지 못한 항목이니 인용 전 원문 서지면으로 확인하세요.
      </div>
    </div>
  );
}

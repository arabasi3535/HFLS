import { useEffect, useRef, useState } from "react";

// ============================================================
// 기타 자료 › 질의회신 — 소방청 법령해석(국가법령정보센터 OPEN API, 서버 중계 /api/expc)
//  · 검색어 → 목록(20건씩, 더 보기) → 항목을 누르면 질의요지·회답·이유·관련법령
//  · 검토 결과의 「관련 질의회신 찾기」(#qa=검색어)로 들어오면 그 검색어로 바로 검색
// ============================================================
export const QA_KEY = "hfls_qa_q";
const N = 20;
const HOT = ["스프링클러", "자동화재탐지설비", "옥내소화전", "비상방송설비", "피난기구", "유도등", "제연설비", "방염", "소방안전관리자", "자체점검", "임시소방시설", "증축", "용도변경", "다중이용업소", "완비증명"];

async function api(params) {
  const r = await fetch("/api/expc?" + new URLSearchParams(params).toString());
  let j = null;
  try {
    j = await r.json();
  } catch (e) {
    j = null;
  }
  if (!j || !j.ok) throw new Error((j && (j.error || (j.httpStatus ? `법제처 응답 오류(${j.httpStatus})` : ""))) || `서버 오류(${r.status})`);
  return j;
}

function Detail({ id }) {
  const [st, setSt] = useState({ load: true });
  useEffect(() => {
    let alive = true;
    api({ id })
      .then((j) => alive && setSt({ item: j.item }))
      .catch((e) => alive && setSt({ err: e.message }));
    return () => {
      alive = false;
    };
  }, [id]);
  if (st.load) return <div className="qa-det qa-muted">불러오는 중…</div>;
  if (st.err) return <div className="qa-det qa-err">본문을 불러오지 못했습니다 — {st.err}</div>;
  const it = st.item;
  const Row = ({ h, v }) =>
    v ? (
      <div className="qa-row">
        <div className="qa-h">{h}</div>
        <div className="qa-v">{v}</div>
      </div>
    ) : null;
  return (
    <div className="qa-det">
      {it.ask && it.ask !== it.title && <Row h="질의요지" v={it.ask} />}
      <Row h="회답" v={it.answer || "회답 내용 없음"} />
      <Row h="이유" v={it.reason} />
      <Row h="관련법령" v={it.laws} />
      <div className="qa-meta">
        {[it.by || "소방청", it.date && `해석 ${it.date}`, !it.date && it.reg && `등록 ${it.reg}`, it.org && `질의 ${it.org}`, it.no].filter(Boolean).join(" · ")} · 법령해석일련번호 {it.id}
      </div>
    </div>
  );
}

export default function QaTab() {
  const [q, setQ] = useState(() => {
    try {
      return localStorage.getItem(QA_KEY) || "";
    } catch (e) {
      return "";
    }
  });
  const [sec, setSec] = useState("2");
  const [res, setRes] = useState(null); // { query, sec, total, items, page }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null);
  const started = useRef(false);

  const run = async (word, s = sec, page = 1) => {
    const k = String(word || "").trim();
    if (!k) return;
    setBusy(true);
    setErr("");
    try {
      localStorage.setItem(QA_KEY, k);
    } catch (e) {
      /* 저장 불가 환경 */
    }
    try {
      const j = await api({ q: k, s, page, n: N });
      setRes((prev) => (page > 1 && prev ? { ...prev, page, items: [...prev.items, ...j.items] } : { query: k, sec: s, total: j.total, page, items: j.items }));
      if (page === 1) setOpen(null);
    } catch (e) {
      setErr(e.message);
      if (page === 1) setRes(null);
    } finally {
      setBusy(false);
    }
  };

  // 처음 열 때 저장된(또는 검토 결과에서 넘겨받은) 검색어로 바로 검색
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (q) run(q, "2");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const more = res && res.items.length < res.total;
  return (
    <div className="pp qa">
      <div className="vd-head pp-head">
        <div>
          <b>소방청 질의회신</b> <span className="pp-count">(소방청 법령해석 · 국가법령정보센터)</span>
          <p>
            소방청이 회신한 법령해석을 검색합니다. 법제처 국가법령정보 OPEN API로 그때그때 받아 오므로 새 해석이 등록되면 바로 반영됩니다.
            해석은 <b>회신 당시 법령</b> 기준이라 현행 조문 번호·내용과 다를 수 있으니 관련법령을 현행 원문과 대조하세요.
          </p>
        </div>
      </div>

      <form
        className="pp-bar"
        onSubmit={(e) => {
          e.preventDefault();
          run(q, sec);
        }}
      >
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색어 (예: 스프링클러 면제, 완비증명, 증축)" aria-label="질의회신 검색어" />
        <select value={sec} onChange={(e) => setSec(e.target.value)} aria-label="검색 범위">
          <option value="2">질의·회답 본문</option>
          <option value="1">안건명만</option>
        </select>
        <button type="submit" className="btn small" disabled={busy || !q.trim()}>
          검색
        </button>
      </form>

      <div className="qa-hot">
        {HOT.map((w) => (
          <button
            key={w}
            type="button"
            className="qa-chip"
            onClick={() => {
              setQ(w);
              run(w, sec);
            }}
          >
            {w}
          </button>
        ))}
      </div>

      {err && <div className="qa-err">검색하지 못했습니다 — {err}</div>}
      {busy && !res && <div className="pp-empty">검색 중…</div>}
      {!res && !busy && !err && <div className="pp-empty">검색어를 입력하거나 위의 자주 찾는 검색어를 누르세요.</div>}

      {res && (
        <section className="pp-sec">
          <h4>
            「{res.query}」 {res.sec === "1" ? "안건명" : "본문"} 검색 <span>{res.total.toLocaleString("ko-KR")}건</span>
          </h4>
          {res.items.length === 0 ? (
            <div className="pp-empty">검색 결과가 없습니다. 검색어를 줄이거나 「질의·회답 본문」으로 찾아보세요.</div>
          ) : (
            <ol className="qa-list">
              {res.items.map((it) => (
                <li key={it.id} className={open === it.id ? "on" : ""}>
                  <button type="button" className="qa-t" onClick={() => setOpen(open === it.id ? null : it.id)} aria-expanded={open === it.id}>
                    <span className="qa-caret">{open === it.id ? "▾" : "▸"}</span>
                    {it.title || "(안건명 없음)"}
                  </button>
                  {(it.date || it.org) && <div className="pp-n">{[it.date && `해석 ${it.date}`, it.org && `질의 ${it.org}`].filter(Boolean).join(" · ")}</div>}
                  {open === it.id && <Detail id={it.id} />}
                </li>
              ))}
            </ol>
          )}
          {more && (
            <button type="button" className="btn small qa-more" disabled={busy} onClick={() => run(res.query, res.sec, res.page + 1)}>
              {busy ? "불러오는 중…" : `더 보기 (${res.items.length}/${res.total})`}
            </button>
          )}
        </section>
      )}

      <div className="pp-foot">
        출처: 법제처 국가법령정보센터 OPEN API 「소방청 법령해석」(nfaCgmExpc). 해석일자가 비어 있는 건이 많아 날짜순 정렬은 하지 않습니다. 법령해석은 행정기관의
        의견으로 법원 판단과 다를 수 있습니다.
      </div>
    </div>
  );
}

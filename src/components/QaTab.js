import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ============================================================
// 기타 자료 › 질의회신 — 국가법령정보센터 OPEN API(서버 중계 /api/expc)
//  · 「소방청 질의회신」(소방청 법령해석) / 「법제처 법령해석」(법령해석례) 탭
//  · 검색어 → 목록(20건씩, 더 보기) → 항목을 누르면 질의요지·회답·이유·관련법령
//  · 항목 앞 체크로 골라 두었다가 「PDF로 저장」(인쇄 창에서 PDF로 저장) — 고른 목록은 이 브라우저에 보관
//  · 검토 결과의 「관련 질의회신 찾기」(#qa=검색어)로 들어오면 그 검색어로 바로 검색
// ============================================================
export const QA_KEY = "hfls_qa_q";
const SRC_KEY = "hfls_qa_src";
const PICK_KEY = "hfls_qa_pick";
const N = 20;
const MAX_PICK = 30;
const SRC = {
  nfa: { label: "소방청 질의회신", by: "소방청", t: "" },
  expc: { label: "법제처 법령해석", by: "법제처", t: "expc" },
};
const HOT = ["스프링클러", "자동화재탐지설비", "옥내소화전", "비상방송설비", "피난기구", "유도등", "제연설비", "방염", "소방안전관리자", "자체점검", "임시소방시설", "증축", "용도변경", "다중이용업소", "완비증명"];

const load = (k, d) => {
  try {
    const raw = localStorage.getItem(k);
    if (raw == null) return d;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  } catch (e) {
    return d;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
  } catch (e) {
    /* 저장 불가 환경 */
  }
};

async function api(params) {
  const p = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));
  const r = await fetch("/api/expc?" + new URLSearchParams(p).toString());
  let j = null;
  try {
    j = await r.json();
  } catch (e) {
    j = null;
  }
  if (!j || !j.ok) throw new Error((j && (j.error || (j.httpStatus ? `법제처 응답 오류(${j.httpStatus})` : ""))) || `서버 오류(${r.status})`);
  return j;
}

const detailCache = new Map();
async function getDetail(src, id) {
  const k = src + ":" + id;
  if (detailCache.has(k)) return detailCache.get(k);
  const j = await api({ id, t: SRC[src].t });
  detailCache.set(k, j.item);
  return j.item;
}

const metaLine = (it, src) =>
  [it.by || SRC[src].by, it.no && `안건번호 ${it.no}`, it.date ? `${src === "expc" ? "회신" : "해석"} ${it.date}` : it.reg && `등록 ${it.reg}`, it.org && `질의 ${it.org}`]
    .filter(Boolean)
    .join(" · ");

function Row({ h, v }) {
  if (!v) return null;
  return (
    <div className="qa-row">
      <div className="qa-h">{h}</div>
      <div className="qa-v">{v}</div>
    </div>
  );
}

function Body({ it, src }) {
  return (
    <>
      {it.ask && it.ask !== it.title && <Row h="질의요지" v={it.ask} />}
      <Row h="회답" v={it.answer || "회답 내용 없음"} />
      <Row h="이유" v={it.reason} />
      <Row h="관련법령" v={it.laws} />
      <div className="qa-meta">
        {metaLine(it, src)} · 일련번호 {it.id}
      </div>
    </>
  );
}

function Detail({ src, id }) {
  const [st, setSt] = useState({ load: true });
  useEffect(() => {
    let alive = true;
    getDetail(src, id)
      .then((item) => alive && setSt({ item }))
      .catch((e) => alive && setSt({ err: e.message }));
    return () => {
      alive = false;
    };
  }, [src, id]);
  if (st.load) return <div className="qa-det qa-muted">불러오는 중…</div>;
  if (st.err) return <div className="qa-det qa-err">본문을 불러오지 못했습니다 — {st.err}</div>;
  return (
    <div className="qa-det">
      <Body it={st.item} src={src} />
    </div>
  );
}

/** 인쇄(PDF 저장)용 문서 — body 바로 아래에 붙여 인쇄 때만 보이게 */
function PrintDoc({ list }) {
  const today = new Date().toLocaleDateString("ko-KR");
  return createPortal(
    <div className="qa-print">
      <h1>소방 관계 법령해석 참고자료</h1>
      <div className="qa-p-sub">
        출력일 {today} · {list.length}건 · 출처: 국가법령정보센터 OPEN API(소방청 법령해석·법제처 법령해석례)
      </div>
      {list.map(({ src, it }, i) => (
        <section key={src + it.id} className="qa-p-item">
          <h2>
            {i + 1}. [{SRC[src].label}] {it.title || "(안건명 없음)"}
          </h2>
          <Body it={it} src={src} />
        </section>
      ))}
      <div className="qa-p-foot">
        법령해석은 회신 당시 법령을 기준으로 한 행정기관의 의견으로, 현행 법령·조문 번호와 다를 수 있고 법원의 판단과 다를 수 있습니다. 업무 참고용(법적 효력 없음) · 소방시설 적용·안전관리
        검토 시스템
      </div>
    </div>,
    document.body
  );
}

export default function QaTab() {
  const [src, setSrc] = useState(() => (load(SRC_KEY, "nfa") === "expc" ? "expc" : "nfa"));
  const [q, setQ] = useState(() => {
    try {
      return localStorage.getItem(QA_KEY) || "";
    } catch (e) {
      return "";
    }
  });
  const [sec, setSec] = useState("2");
  const [res, setRes] = useState(null); // { src, query, sec, total, items, page }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null);
  const [picked, setPicked] = useState(() => {
    const v = load(PICK_KEY, []);
    return Array.isArray(v) ? v.filter((x) => x && x.id && SRC[x.src]) : [];
  });
  const [printList, setPrintList] = useState(null);
  const [printBusy, setPrintBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => save(PICK_KEY, picked), [picked]);

  const run = async (word, s = sec, page = 1, from = src) => {
    const k = String(word || "").trim();
    if (!k) return;
    setBusy(true);
    setErr("");
    save(QA_KEY, k);
    try {
      const j = await api({ q: k, s, page, n: N, t: SRC[from].t });
      setRes((prev) =>
        page > 1 && prev ? { ...prev, page, items: [...prev.items, ...j.items] } : { src: from, query: k, sec: s, total: j.total, page, items: j.items }
      );
      if (page === 1) setOpen(null);
    } catch (e) {
      setErr(e.message);
      if (page === 1) setRes(null);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setQ("");
    setSec("2");
    setRes(null);
    setErr("");
    setOpen(null);
    try {
      localStorage.removeItem(QA_KEY);
    } catch (e) {
      /* 저장 불가 환경 */
    }
  };

  const switchSrc = (s) => {
    if (s === src) return;
    setSrc(s);
    save(SRC_KEY, s);
    setOpen(null);
    if (q.trim()) run(q, sec, 1, s);
    else setRes(null);
  };

  const isPicked = (s, id) => picked.some((p) => p.src === s && p.id === id);
  const togglePick = (s, it) => {
    if (isPicked(s, it.id)) setPicked(picked.filter((p) => !(p.src === s && p.id === it.id)));
    else if (picked.length >= MAX_PICK) alert(`한 번에 ${MAX_PICK}건까지 고를 수 있습니다.`);
    else setPicked([...picked, { src: s, id: it.id, title: it.title, date: it.date, no: it.no }]);
  };

  const doPrint = async () => {
    if (!picked.length) return;
    setPrintBusy(true);
    try {
      const list = [];
      for (const p of picked) list.push({ src: p.src, it: await getDetail(p.src, p.id) });
      setPrintList(list);
    } catch (e) {
      alert("본문을 불러오지 못해 PDF를 만들 수 없습니다 — " + e.message);
    } finally {
      setPrintBusy(false);
    }
  };
  useEffect(() => {
    if (!printList) return undefined;
    document.body.classList.add("qa-printing");
    const done = () => {
      document.body.classList.remove("qa-printing");
      setPrintList(null);
    };
    window.addEventListener("afterprint", done, { once: true });
    const t = setTimeout(() => window.print(), 150);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", done);
      document.body.classList.remove("qa-printing");
    };
  }, [printList]);

  // 처음 열 때 저장된(또는 검토 결과에서 넘겨받은) 검색어로 바로 검색
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (q) run(q, "2", 1, src);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const more = res && res.items.length < res.total;
  return (
    <div className="pp qa">

      <div className="w-subs qa-src" role="tablist">
        {Object.entries(SRC).map(([k, v]) => (
          <button key={k} type="button" role="tab" aria-selected={src === k} className={src === k ? "on" : ""} onClick={() => switchSrc(k)}>
            {v.label}
          </button>
        ))}
      </div>

      <form
        className="pp-bar"
        onSubmit={(e) => {
          e.preventDefault();
          run(q, sec);
        }}
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={src === "expc" ? "검색어 (예: 소방시설 부칙, 스프링클러, 다중이용업소)" : "검색어 (예: 스프링클러 면제, 완비증명, 증축)"}
          aria-label="검색어"
        />
        <select value={sec} onChange={(e) => setSec(e.target.value)} aria-label="검색 범위">
          <option value="2">질의·회답 본문</option>
          <option value="1">안건명만</option>
        </select>
        <button type="submit" className="btn small" disabled={busy || !q.trim()}>
          검색
        </button>
        <button type="button" className="btn small pp-reset" disabled={busy || (!q && !res && !err && sec === "2")} onClick={reset}>
          초기화
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
      {src === "expc" && <div className="lw-note">법제처 법령해석은 모든 부처의 해석을 대상으로 검색합니다. 소방 관련만 보려면 범위를 「안건명만」으로 하고 「소방」을 넣어 보세요.</div>}

      {picked.length > 0 && (
        <section className="qa-pick">
          <div className="qa-pick-h">
            <b>PDF로 저장할 해석 {picked.length}건</b>
            <span>
              <button type="button" className="btn small" onClick={doPrint} disabled={printBusy}>
                {printBusy ? "본문 불러오는 중…" : "PDF로 저장"}
              </button>
              <button type="button" className="btn small pp-reset" onClick={() => setPicked([])}>
                선택 비우기
              </button>
            </span>
          </div>
          <ol>
            {picked.map((p) => (
              <li key={p.src + p.id}>
                <span className="qa-src-t">{SRC[p.src].by}</span> {p.title}
                <button type="button" className="qa-x" aria-label="선택 빼기" onClick={() => setPicked(picked.filter((x) => !(x.src === p.src && x.id === p.id)))}>
                  ✕
                </button>
              </li>
            ))}
          </ol>
          <div className="lw-note">「PDF로 저장」을 누르면 인쇄 창이 열립니다 — 대상(프린터)을 「PDF로 저장」으로 바꿔 저장하세요.</div>
        </section>
      )}

      {err && <div className="qa-err">검색하지 못했습니다 — {err}</div>}
      {busy && !res && <div className="pp-empty">검색 중…</div>}
      {!res && !busy && !err && <div className="pp-empty">검색어를 입력하거나 위의 자주 찾는 검색어를 누르세요.</div>}

      {res && (
        <section className="pp-sec">
          <h4>
            {SRC[res.src].label} — 「{res.query}」 {res.sec === "1" ? "안건명" : "본문"} 검색 <span>{res.total.toLocaleString("ko-KR")}건</span>
          </h4>
          {res.items.length === 0 ? (
            <div className="pp-empty">검색 결과가 없습니다. 검색어를 줄이거나 「질의·회답 본문」으로 찾아보세요.</div>
          ) : (
            <ol className="qa-list">
              {res.items.map((it) => (
                <li key={it.id} className={open === it.id ? "on" : ""}>
                  <div className="qa-line">
                    <input type="checkbox" className="qa-ck" checked={isPicked(res.src, it.id)} onChange={() => togglePick(res.src, it)} aria-label="PDF로 저장할 해석으로 고르기" />
                    <button type="button" className="qa-t" onClick={() => setOpen(open === it.id ? null : it.id)} aria-expanded={open === it.id}>
                      <span className="qa-caret">{open === it.id ? "▾" : "▸"}</span>
                      {it.title || "(안건명 없음)"}
                    </button>
                  </div>
                  {(it.date || it.org || it.no) && (
                    <div className="pp-n">
                      {[it.no && `안건번호 ${it.no}`, it.date && `${res.src === "expc" ? "회신" : "해석"} ${it.date}`, it.org && `질의 ${it.org}`].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {open === it.id && <Detail src={res.src} id={it.id} />}
                </li>
              ))}
            </ol>
          )}
          {more && (
            <button type="button" className="btn small qa-more" disabled={busy} onClick={() => run(res.query, res.sec, res.page + 1, res.src)}>
              {busy ? "불러오는 중…" : `더 보기 (${res.items.length}/${res.total})`}
            </button>
          )}
        </section>
      )}

      <div className="pp-foot">
        출처: 법제처 국가법령정보센터 OPEN API 「소방청 법령해석」·「법령해석례」. 소방청 해석은 해석일자가 비어 있는 건이 많아 날짜순 정렬을 하지 않고, 법제처 해석은 회신일자 최신순입니다.
        법령해석은 행정기관의 의견으로 법원 판단과 다를 수 있습니다.
      </div>
      {printList && <PrintDoc list={printList} />}
    </div>
  );
}

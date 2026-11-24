import { useState } from "react";
import { copyText } from "../lib/share";
import { STDS } from "./lawHistStds";

// ============================================================
// 연혁법 찾기 — 기준일(허가일 등)에 시행 중이던 소방 관계 법령의 조문·별표 원문 (api/lawat.js → 법제처 OPEN API)
//  · 사람: 법령·종류·기준일 → 그 판의 목차·조문·별표·개정 연혁
//  · (v2.45.0) AI 프롬프트 예시 삭제, 「기타 자료 › 법령 연혁」 맨 위로(아래에 법령 체계·개정 연혁)
//  · 화재안전기준(v2.34.0): 설비(번호 순)·기준일 → NFSC 또는 NFPC·NFTC 판의 조문(절)·별표·첨부파일·부칙
// ============================================================

const FAMS = [
  ["fire", "소방시설 설치·관리 (소방법 → 소방시설법 계열)"],
  ["prevent", "화재의 예방 및 안전관리에 관한 법률 (2022.12.1.~)"],
  ["work", "소방시설공사업법"],
  ["basic", "소방기본법"],
  ["multi", "다중이용업소의 안전관리에 관한 특별법"],
  ["haz", "위험물안전관리법"],
  ["build", "건축법"],
  ["tech", "소방기술기준에관한규칙 (~2004.6.3., 화재안전기준 전)"],
];
const TYS = [
  ["", "자동"],
  ["p", "성능기준(NFSC·NFPC)"],
  ["t", "기술기준(NFTC)"],
];
const KINDS = [
  ["law", "법률"],
  ["dec", "시행령"],
  ["rule", "시행규칙"],
];
const dash = (s) => (/^\d{8}$/.test(String(s)) ? `${String(s).slice(0, 4)}. ${+String(s).slice(4, 6)}. ${+String(s).slice(6)}.` : String(s || ""));
const prevDay = (s) => {
  const d = new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6) - 1));
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
};
const lab = (k) => (k.includes("-") ? k.replace("-", "의") : k);
const noText = (v) => `${v.seq ? v.org || "" : ""}${v.kind} 제${String(v.no).replace(/^제|호$/g, "")}호`;
const pubWord = (v) => (v.seq ? "발령" : "공포"); // 행정규칙(화재안전기준)은 발령
const verText = (v) => `${v.name} [${noText(v)}, ${dash(v.pub)} ${pubWord(v)}, ${dash(v.eff)} 시행${v.why ? `, ${v.why}` : ""}]`;

async function api(params) {
  const p = new URLSearchParams({ ...params, format: "json" });
  const r = await fetch(`/api/lawat?${p.toString()}`);
  let j = null;
  try {
    j = await r.json();
  } catch (e) {
    throw new Error(r.status === 404 ? "서버 기능을 찾지 못했습니다(배포 확인 필요)." : `응답 오류(${r.status})`);
  }
  if (!r.ok || !j.ok) {
    const e = new Error(j.error || `응답 오류(${r.status})`);
    e.data = j;
    throw e;
  }
  return j;
}

export default function LawHistTab() {
  const [mode, setMode] = useState("law"); // law=법령, std=화재안전기준
  const [std, setStd] = useState("103");
  const [ty, setTy] = useState("");
  const [hint, setHint] = useState(null); // 2004.6.4. 전 → 소방기술기준에관한규칙 안내
  const [fam, setFam] = useState("fire");
  const [kind, setKind] = useState("dec");
  const [date, setDate] = useState("");
  const [res, setRes] = useState(null); // 판 정보 + 목차
  const [view, setView] = useState(null); // 선택한 조문·별표·검색 결과
  const [vers, setVers] = useState(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");

  const isStd = mode === "std";
  const sel = () => (isStd ? { std, ...(ty ? { ty } : {}) } : { fam, kind });
  const run = async (what, fn) => {
    setBusy(what);
    setErr("");
    setHint(null);
    try {
      await fn();
    } catch (e) {
      setErr(e.message);
      if (e.data && e.data.before) setHint(e.data.before);
    } finally {
      setBusy("");
    }
  };
  const lookup = () =>
    run("lookup", async () => {
      if (!date) throw new Error("기준일(허가일·신청일 등)을 넣으십시오.");
      setView(null);
      setRes(await api({ ...sel(), date }));
    });
  const open = (p, label) =>
    run(label, async () => {
      const j = await api({ ...sel(), ...(isStd && res && res.ty ? { ty: res.ty } : {}), date, ...p });
      setView(j.art ? { type: "art", title: j.art.label, text: j.art.text } : j.byl ? { type: "byl", title: `별표 ${lab(j.byl.k)} ${j.byl.title}`, text: j.byl.text, links: j.byl.links, k: j.byl.k } : { type: "q", title: `"${j.q}" 검색 결과 ${j.hits.length}건`, hits: j.hits });
    });
  const history = () => run("list", async () => setVers((await api({ ...sel(), list: 1 })).versions));
  const clearOut = () => {
    setRes(null);
    setVers(null);
    setView(null);
    setErr("");
    setHint(null);
  };
  // 2004.6.4. 전 화재안전기준 → 같은 기준일의 소방기술기준에관한규칙
  const goTech = () => {
    setMode("law");
    setFam("tech");
    setKind("law");
    setVers(null);
    run("lookup", async () => {
      setView(null);
      setRes(await api({ fam: "tech", kind: "law", date }));
    });
  };
  // 초기화: 고른 법령·종류·기준일과 조회 결과를 처음 상태로
  const reset = () => {
    setMode("law");
    setStd("103");
    setTy("");
    setHint(null);
    setFam("fire");
    setKind("dec");
    setDate("");
    setRes(null);
    setView(null);
    setVers(null);
    setQ("");
    setErr("");
  };
  const dirty = isStd || fam !== "fire" || kind !== "dec" || !!date || !!res || !!vers || !!q || !!err;
  const copy = async (key, text) => {
    if (await copyText(text)) {
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    }
  };

  const ver = res && res.ver;
  const viewCopy = () => {
    if (!view || !ver) return "";
    const body = view.type === "q" ? view.hits.map((h) => `- ${h.where}: …${h.snip}…`).join("\n") : view.text || Object.entries(view.links || {}).map(([k, u]) => `${k.toUpperCase()}: ${u}`).join("\n");
    return `[기준일 ${date}에 시행 중이던 판] ${verText(ver)}\n[원문] ${res.link}\n\n■ ${view.title}\n${body}`;
  };

  return (
    <div className="card pp lh">
      <div className="card-t">연혁법 찾기</div>

      <div className="lh-form">
        <div className="lh-seg lh-mode" role="radiogroup" aria-label="찾을 자료">
          {[["law", "법령"], ["std", "화재안전기준"]].map(([k, n]) => (
            <button key={k} type="button" className={mode === k ? "on" : ""} aria-pressed={mode === k} onClick={() => { if (mode !== k) { setMode(k); clearOut(); } }}>
              {n}
            </button>
          ))}
        </div>
        {isStd ? (
          <>
            <select value={std} onChange={(e) => { setStd(e.target.value); clearOut(); }} aria-label="설비(화재안전기준)">
              {STDS.map(([k, n]) => (
                <option key={k} value={k}>{k} {n}</option>
              ))}
            </select>
            <div className="lh-seg" role="radiogroup" aria-label="기준 종류">
              {TYS.map(([k, n]) => (
                <button key={k || "auto"} type="button" className={ty === k ? "on" : ""} aria-pressed={ty === k} title={k ? "" : "2022.12.1. 이후는 기술기준(NFTC), 그 전은 화재안전기준(NFSC)"} onClick={() => { setTy(k); setRes(null); setView(null); }}>
                  {n}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <select value={fam} onChange={(e) => { setFam(e.target.value); if (e.target.value === "tech") setKind("law"); setRes(null); setVers(null); }} aria-label="법령">
              {FAMS.map(([k, n]) => (
                <option key={k} value={k}>{n}</option>
              ))}
            </select>
            <div className="lh-seg" role="radiogroup" aria-label="종류">
              {KINDS.map(([k, n]) => (
                <button key={k} type="button" className={kind === k ? "on" : ""} aria-pressed={kind === k} disabled={fam === "tech" && k !== "law"} onClick={() => { setKind(k); setRes(null); setVers(null); }}>
                  {n}
                </button>
              ))}
            </div>
          </>
        )}
        <label className="lh-date">
          기준일
          <input type="date" value={date} min="1958-01-01" max="2099-12-31" onChange={(e) => setDate(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup()} />
        </label>
        <button type="button" className="btn pri" disabled={!!busy} onClick={lookup}>
          {busy === "lookup" ? "찾는 중…" : "조회"}
        </button>
        <button type="button" className="btn" disabled={!!busy} onClick={history}>
          {busy === "list" ? "불러오는 중…" : "개정 연혁"}
        </button>
        <button type="button" className="btn" disabled={!!busy || !dirty} onClick={reset} title="법령·화재안전기준·기준일과 조회 결과를 처음 상태로">
          초기화
        </button>
      </div>
      {err && (
        <div className="lh-err">
          ⚠ {err.replace(/ — https?:\/\/\S+$/, ".")}
          {hint && date && (
            <button type="button" className="btn small lh-hint" onClick={goTech}>
              {date} 기준 소방기술기준에관한규칙 보기
            </button>
          )}
        </div>
      )}

      {vers && (
        <details className="pp-sec lw-sec" open>
          <summary>
            <h4>
              개정 연혁 <span>{vers.length}</span>
            </h4>
          </summary>
          <div className="lh-vers">
            <table>
              <thead>
                <tr><th>시행일</th><th>{isStd ? "기준명" : "법령명"}</th><th>{isStd ? "발령" : "공포"}</th><th>구분</th><th /></tr>
              </thead>
              <tbody>
                {[...vers].reverse().map((v) => (
                  <tr key={(v.seq || v.mst) + v.eff}>
                    <td>{dash(v.eff)}</td>
                    <td>{v.name}</td>
                    <td>{noText(v)} ({dash(v.pub)})</td>
                    <td>{v.why}</td>
                    <td>
                      <button type="button" className="btn small" onClick={() => { const d = `${v.eff.slice(0, 4)}-${v.eff.slice(4, 6)}-${v.eff.slice(6)}`; setDate(d); if (isStd) setTy(v.track); run("lookup", async () => { setView(null); setRes(await api(isStd ? { std, ty: v.track, date: d } : { fam, kind, date: d })); }); }}>
                        이 판 보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {ver && (
        <div className="lh-ver">
          <div className="lh-ver-h">
            <span className="lh-badge">{date} 기준</span> <b>{ver.name}</b>
          </div>
          <div className="lh-ver-m">
            {noText(ver)} · {dash(ver.pub)} {pubWord(ver)} · <b>{dash(ver.eff)} 시행</b>
            {ver.why ? ` · ${ver.why}` : ""}
          </div>
          <div className="lh-ver-m">
            적용 기간: <b>{dash(ver.eff)} ~ {res.next ? dash(prevDay(res.next.eff)) : "현재"}</b>
            {res.next && <span className="lh-sub"> (다음 판 {dash(res.next.eff)} 시행{res.next.name !== ver.name ? ` — 「${res.next.name}」` : ""})</span>}
          </div>
          {(res.notes || []).map((n, i) => (
            <div key={i} className="lh-ver-m lh-note">ⓘ {n}</div>
          ))}
          <a href={res.link} target="_blank" rel="noreferrer" className="lh-link">
            법제처 원문(이 판) 열기 ↗
          </a>
        </div>
      )}

      {res && res.toc && (
        <div className="lh-body">
          <div className="lh-toc">
            <div className="lh-find">
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && q.trim() && open({ q: q.trim() }, "q")} placeholder={isStd ? "이 판에서 낱말 찾기 (예: 수평거리)" : "이 판에서 낱말 찾기 (예: 스프링클러)"} aria-label="이 판에서 찾기" />
              <button type="button" className="btn small" disabled={!q.trim() || !!busy} onClick={() => open({ q: q.trim() }, "q")}>찾기</button>
            </div>
            {res.toc.files && res.toc.files.length > 0 && (
              <>
                <h5>첨부파일 {res.toc.files.length} <small>(고시·공고 원본 — 그림·표 포함)</small></h5>
                <ul className="lh-filelist">
                  {res.toc.files.map((f, i) => (
                    <li key={"f" + i}>
                      <a href={f.url} target="_blank" rel="noreferrer">{f.name} ↗</a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {(!isStd || res.toc.byls.length > 0) && <h5>별표 {res.toc.byls.length}</h5>}
            {!isStd && res.toc.byls.length === 0 && (
              <p className="lh-sub lh-nobyl">
                이 판의 별표는 법제처 OPEN API에 없습니다 — 위 「법제처 원문(이 판) 열기」의 별표·서식에서 확인하십시오.
              </p>
            )}
            <ul>
              {res.toc.byls.map((b) => (
                <li key={"b" + b.k}>
                  <button type="button" onClick={() => open({ byl: b.k }, "byl" + b.k)}>
                    별표 {lab(b.k)} {b.title}
                    {!b.hasText && <small> (파일)</small>}
                  </button>
                </li>
              ))}
            </ul>
            <h5>{res.ty === "t" ? "절" : "조문"} {res.toc.arts.filter((a) => !a.head).length}</h5>
            <ul>
              {res.toc.arts.map((a, i) =>
                a.head ? (
                  <li key={"h" + i} className="lh-head">{a.label}</li>
                ) : (
                  <li key={"a" + a.k + i}>
                    <button type="button" onClick={() => open({ jo: a.k }, "jo" + a.k)}>{a.label}</button>
                  </li>
                )
              )}
            </ul>
          </div>
          <div className="lh-view">
            {busy && busy !== "lookup" && busy !== "list" && <div className="lh-empty">불러오는 중…</div>}
            {!busy && !view && <div className="lh-empty">왼쪽 목차에서 별표나 조문을 고르십시오.</div>}
            {!busy && view && (
              <>
                <div className="lh-view-h">
                  <b>{view.title}</b>
                  <button type="button" className="btn small" onClick={() => copy("view", viewCopy())}>
                    {copied === "view" ? "복사됨 ✓" : "출처와 함께 복사"}
                  </button>
                </div>
                {view.type === "q" ? (
                  <ul className="lh-hits">
                    {view.hits.length === 0 && <li>찾는 낱말이 이 판에 없습니다.</li>}
                    {view.hits.map((h, i) => (
                      <li key={i}>
                        <button type="button" onClick={() => { const m = /^(jo|byl)=(\S+)/.exec(h.where); if (m) open({ [m[1]]: m[2] }, h.where); }}>
                          {h.where.replace(/^(jo|byl)=\S+\s/, "")}
                        </button>
                        <span>…{h.snip}…</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    {view.text ? <pre className="lh-pre">{view.text}</pre> : <div className="lh-empty">이 판의 별표 텍스트가 법제처 API에 없습니다 — 아래 파일로 확인하십시오.</div>}
                    {view.links && Object.keys(view.links).length > 0 && (
                      <div className="lh-files">
                        {Object.entries(view.links).map(([k, u]) => (
                          <a key={k} href={u} target="_blank" rel="noreferrer" className="btn small">
                            {k.toUpperCase()} 원본 ↗
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

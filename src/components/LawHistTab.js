import { useState } from "react";
import { copyText } from "../lib/share";

// ============================================================
// 연혁법 찾기 — 기준일(허가일 등)에 시행 중이던 소방 관계 법령의 조문·별표 원문 (api/lawat.js → 법제처 OPEN API)
//  · 사람: 법령·종류·기준일 → 그 판의 목차·조문·별표·개정 연혁
//  · AI: 사용자가 쓰는 AI에 붙여 넣을 프롬프트 예시(이 사이트 주소를 열어 원문을 읽게 함)
// ============================================================

const FAMS = [
  ["fire", "소방시설 설치·관리 (소방법 → 소방시설법 계열)"],
  ["prevent", "화재의 예방 및 안전관리에 관한 법률 (2022.12.1.~)"],
  ["work", "소방시설공사업법"],
  ["basic", "소방기본법"],
  ["multi", "다중이용업소의 안전관리에 관한 특별법"],
  ["haz", "위험물안전관리법"],
  ["build", "건축법"],
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
const verText = (v) => `${v.name} [${v.kind} 제${String(v.no).replace(/^제|호$/g, "")}호, ${dash(v.pub)} 공포, ${dash(v.eff)} 시행${v.why ? `, ${v.why}` : ""}]`;

async function api(params) {
  const p = new URLSearchParams({ ...params, format: "json" });
  const r = await fetch(`/api/lawat?${p.toString()}`);
  let j = null;
  try {
    j = await r.json();
  } catch (e) {
    throw new Error(r.status === 404 ? "서버 기능을 찾지 못했습니다(배포 확인 필요)." : `응답 오류(${r.status})`);
  }
  if (!r.ok || !j.ok) throw new Error(j.error || `응답 오류(${r.status})`);
  return j;
}

export default function LawHistTab() {
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

  const base = typeof window !== "undefined" && window.location && /^https?:/.test(window.location.origin) ? `${window.location.origin}/api/lawat` : "https://hfls.vercel.app/api/lawat";
  const run = async (what, fn) => {
    setBusy(what);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  };
  const lookup = () =>
    run("lookup", async () => {
      if (!date) throw new Error("기준일(허가일·신청일 등)을 넣으십시오.");
      setView(null);
      setRes(await api({ fam, kind, date }));
    });
  const open = (p, label) =>
    run(label, async () => {
      const j = await api({ fam, kind, date, ...p });
      setView(j.art ? { type: "art", title: j.art.label, text: j.art.text } : j.byl ? { type: "byl", title: `별표 ${lab(j.byl.k)} ${j.byl.title}`, text: j.byl.text, links: j.byl.links, k: j.byl.k } : { type: "q", title: `"${j.q}" 검색 결과 ${j.hits.length}건`, hits: j.hits });
    });
  const history = () => run("list", async () => setVers((await api({ fam, kind, list: 1 })).versions));
  const copy = async (key, text) => {
    if (await copyText(text)) {
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    }
  };

  const ver = res && res.ver;
  const dq = date || "YYYY-MM-DD";
  const famName = (FAMS.find((f) => f[0] === fam) || FAMS[0])[1].replace(/ \(.*\)$/, "");
  const kindName = (KINDS.find((k) => k[0] === kind) || KINDS[1])[1];
  const lead = `너는 소방시설 인허가 검토를 돕는 조사원이야. 아래 HFLS 주소를 직접 열어 법제처 원문을 읽고, 그 원문에 있는 내용만으로 답해 줘. 원문에서 확인되지 않는 것은 추측하지 말고 「확인 필요」라고 적어.\n\n[사용법] ${base}\n`;
  const form = "\n\n답변 형식: ① 결론 ② 근거(법령명·공포번호·시행일·조문/별표 번호와 원문 짧은 인용) ③ 원문 링크 ④ 확인 필요 사항";
  const prompts = [
    {
      id: "p1",
      title: "허가 시점 설치기준 확인",
      text: `${lead}[그 시점 목차] ${base}?fam=${fam}&kind=${kind}&date=${dq}\n(조문은 &jo=번호, 별표는 &byl=번호, 낱말 검색은 &q=낱말 을 붙여 열어)\n\n질문: ${dq}에 건축허가를 신청한 [용도·층수·연면적] 건축물에 [소방시설 이름]을 설치해야 했는지 알려 줘. 그때 시행 중이던 ${famName} ${kindName}의 해당 별표·조문을 직접 열어 확인해.${form}`,
    },
    {
      id: "p2",
      title: "개정 연혁 추적",
      text: `${lead}[개정 연혁 목록] ${base}?fam=${fam}&kind=${kind}&list=1\n(각 판은 &date=시행일 로 열고, &q=낱말 로 위치를 찾아)\n\n질문: [소방시설 이름] 설치 기준이 언제 어떻게 바뀌었는지 시행일 순으로 정리해 줘. 바뀐 판마다 별표·조문을 직접 열어 전/후 문구를 비교해.${form}`,
    },
    {
      id: "p3",
      title: "두 시점 비교",
      text: `${lead}[시점 A] ${base}?fam=${fam}&kind=${kind}&date=[A 날짜]&byl=[별표 번호]\n[시점 B] ${base}?fam=${fam}&kind=${kind}&date=[B 날짜]&byl=[별표 번호]\n(별표 번호가 판마다 다를 수 있으니 먼저 &date=날짜 만 열어 목차를 확인해)\n\n질문: 두 시점의 [소방시설 이름] 설치 대상 기준을 표로 비교하고, 달라진 부분만 전/후로 보여 줘.${form}`,
    },
  ];
  const viewCopy = () => {
    if (!view || !ver) return "";
    const body = view.type === "q" ? view.hits.map((h) => `- ${h.where}: …${h.snip}…`).join("\n") : view.text || Object.entries(view.links || {}).map(([k, u]) => `${k.toUpperCase()}: ${u}`).join("\n");
    return `[기준일 ${date}에 시행 중이던 판] ${verText(ver)}\n[원문] ${res.link}\n\n■ ${view.title}\n${body}`;
  };

  return (
    <div className="pp lh">
      <div className="vd-head pp-head">
        <div>
          <b>연혁법 찾기</b>
          <p>
            허가일 같은 <b>기준일에 시행 중이던 법령</b>의 조문·별표 원문을 법제처에서 바로 불러옵니다. 법령 이름이 바뀐 시기(소방법 → 소방시설법 등)도 하나로 이어서 찾습니다.
          </p>
        </div>
      </div>

      <div className="lh-form">
        <select value={fam} onChange={(e) => { setFam(e.target.value); setRes(null); setVers(null); }} aria-label="법령">
          {FAMS.map(([k, n]) => (
            <option key={k} value={k}>{n}</option>
          ))}
        </select>
        <div className="lh-seg" role="radiogroup" aria-label="종류">
          {KINDS.map(([k, n]) => (
            <button key={k} type="button" className={kind === k ? "on" : ""} aria-pressed={kind === k} onClick={() => { setKind(k); setRes(null); setVers(null); }}>
              {n}
            </button>
          ))}
        </div>
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
      </div>
      {err && <div className="lh-err">⚠ {err}</div>}

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
                <tr><th>시행일</th><th>법령명</th><th>공포</th><th>구분</th><th /></tr>
              </thead>
              <tbody>
                {[...vers].reverse().map((v) => (
                  <tr key={v.mst + v.eff}>
                    <td>{dash(v.eff)}</td>
                    <td>{v.name}</td>
                    <td>{v.kind} 제{String(v.no).replace(/^제|호$/g, "")}호 ({dash(v.pub)})</td>
                    <td>{v.why}</td>
                    <td>
                      <button type="button" className="btn small" onClick={() => { const d = `${v.eff.slice(0, 4)}-${v.eff.slice(4, 6)}-${v.eff.slice(6)}`; setDate(d); run("lookup", async () => { setView(null); setRes(await api({ fam, kind, date: d })); }); }}>
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
            {ver.kind} 제{String(ver.no).replace(/^제|호$/g, "")}호 · {dash(ver.pub)} 공포 · <b>{dash(ver.eff)} 시행</b>
            {ver.why ? ` · ${ver.why}` : ""}
          </div>
          <div className="lh-ver-m">
            적용 기간: <b>{dash(ver.eff)} ~ {res.next ? dash(prevDay(res.next.eff)) : "현재"}</b>
            {res.next && <span className="lh-sub"> (다음 판 {dash(res.next.eff)} 시행{res.next.name !== ver.name ? ` — 「${res.next.name}」` : ""})</span>}
          </div>
          <a href={res.link} target="_blank" rel="noreferrer" className="lh-link">
            법제처 원문(이 판) 열기 ↗
          </a>
        </div>
      )}

      {res && res.toc && (
        <div className="lh-body">
          <div className="lh-toc">
            <div className="lh-find">
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && q.trim() && open({ q: q.trim() }, "q")} placeholder="이 판에서 낱말 찾기 (예: 스프링클러)" aria-label="이 판에서 찾기" />
              <button type="button" className="btn small" disabled={!q.trim() || !!busy} onClick={() => open({ q: q.trim() }, "q")}>찾기</button>
            </div>
            <h5>별표 {res.toc.byls.length}</h5>
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
            <h5>조문 {res.toc.arts.filter((a) => !a.head).length}</h5>
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

      <details className="pp-sec lw-sec lh-ai" open>
        <summary>
          <h4>🤖 내 AI에게 물어보기 — 프롬프트 예시</h4>
        </summary>
        <p className="lh-ai-p">
          아래 글을 복사해 <b>웹 페이지를 직접 열 수 있는 AI</b>(웹 검색·브라우징 기능이 켜진 ChatGPT·Claude·Gemini·Perplexity 등)에 붙여 넣고 [대괄호]만 바꾸십시오. AI가 이 사이트를 통해 법제처 원문을 읽고 답합니다. 위에서 고른 법령·종류·기준일이 주소에 자동으로 들어갑니다.
        </p>
        <p className="lh-ai-p lh-sub">
          주소를 열지 못하는 AI라면 위 원문 화면의 「출처와 함께 복사」로 원문을 붙여 넣으십시오. AI 답변은 참고용이며, 최종 판단은 법제처 원문으로 확인하십시오.
        </p>
        {prompts.map((p) => (
          <div key={p.id} className="lh-prompt">
            <div className="lh-view-h">
              <b>{p.title}</b>
              <button type="button" className="btn small" onClick={() => copy(p.id, p.text)}>
                {copied === p.id ? "복사됨 ✓" : "복사"}
              </button>
            </div>
            <pre className="lh-pre sm">{p.text}</pre>
          </div>
        ))}
      </details>
    </div>
  );
}

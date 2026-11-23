import { useEffect, useMemo, useState } from "react";
import { DEF_FAMS, KIND_NAME, defsFromFam, defsFromStd, searchDefs } from "../law/defs";
import { DEF_EXTRA } from "../law/defsExtra";

// ============================================================
// 기타 자료 › 용어 정의 — 소방 관계 법령(법률·시행령·시행규칙)과 화재안전성능기준(NFPC)의 「정의」 조문 검색
//  원문: /api/lawat?defs=…(법제처 국가법령정보 OPEN API 현행 조문, 서버 7일 캐시) → 브라우저에 7일 보관
//  별표 등에 있는 정의는 src/law/defsExtra.js에 추가(사용자 정리분)
// ============================================================

const CACHE = "hfls_defs_v1";
const WEEK = 7 * 24 * 3600 * 1000;
const STD_PAGES = 7; // 화재안전성능기준 42종 ÷ 6
const STD_GROUP = "화재안전성능기준";
const SHOW = 60;

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE) || "null");
    return c && Date.now() - c.at < WEEK && Array.isArray(c.list) ? c : null;
  } catch (e) {
    return null;
  }
}

async function getJson(q) {
  const r = await fetch(`/api/lawat?${q}&format=json`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(j.error || (r.status === 429 ? "요청이 많습니다. 10분 뒤 다시 시도하십시오." : `응답 오류(${r.status})`));
  return j;
}

/** 모든 출처를 받아 정의 목록으로 — 3개씩 동시에 */
async function loadAll(onStep) {
  const jobs = [...DEF_FAMS.map(([k, l]) => ({ q: `defs=${k}`, fam: l })), ...Array.from({ length: STD_PAGES }, (_, i) => ({ q: `defs=std&page=${i + 1}` }))];
  const list = [];
  const fails = [];
  const misses = [];
  let done = 0;
  let date = "";
  const run = async (job) => {
    try {
      const j = await getJson(job.q);
      date = j.date || date;
      for (const it of j.items || []) if (it.error) misses.push(`${it.name || job.fam} ${it.kind ? KIND_NAME[it.kind] : ""}: ${it.error}`.trim());
      list.push(...(job.fam ? defsFromFam(j, job.fam) : defsFromStd(j)));
    } catch (e) {
      fails.push(`${job.fam || `화재안전성능기준 ${job.q.split("page=")[1]}쪽`}: ${e.message}`);
    }
    done += 1;
    onStep(done, jobs.length);
  };
  for (let i = 0; i < jobs.length; i += 3) await Promise.all(jobs.slice(i, i + 3).map(run));
  return { list, fails, misses, date };
}

const GROUPS = [...DEF_FAMS.map((f) => f[1]), STD_GROUP];
const dot = (d) => (/^\d{8}$/.test(d || "") ? `${d.slice(0, 4)}.${+d.slice(4, 6)}.${+d.slice(6)}.` : "");

function Mark({ text, q }) {
  const k = String(q || "").trim();
  if (!k) return text;
  const i = text.indexOf(k);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + k.length)}</mark>
      {text.slice(i + k.length)}
    </>
  );
}

export default function DefsTab() {
  const [st, setSt] = useState(() => {
    const c = readCache();
    return c ? { list: c.list, date: c.date, at: c.at, fails: [], misses: c.misses || [], busy: false, step: "" } : { list: null, busy: false, step: "", fails: [], misses: [] };
  });
  const [q, setQ] = useState("");
  const [body, setBody] = useState(false);
  const [group, setGroup] = useState("");
  const [more, setMore] = useState(SHOW);

  const load = async () => {
    setSt((p) => ({ ...p, busy: true, step: "0", fails: [] }));
    const r = await loadAll((d, n) => setSt((p) => ({ ...p, step: `${d}/${n}` })));
    const at = Date.now();
    if (r.list.length && !r.fails.length) {
      try {
        localStorage.setItem(CACHE, JSON.stringify({ at, date: r.date, list: r.list, misses: r.misses }));
      } catch (e) {
        /* 저장 공간 부족 등 — 이번 화면에서만 사용 */
      }
    }
    setSt({ list: r.list, date: r.date, at, fails: r.fails, misses: r.misses, busy: false, step: "" });
  };
  useEffect(() => {
    if (!st.list && !st.busy) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => setMore(SHOW), [q, body, group]);

  const all = useMemo(() => [...(st.list || []), ...DEF_EXTRA], [st.list]);
  const hits = useMemo(() => searchDefs(all, q, { body, group }), [all, q, body, group]);
  const counts = useMemo(() => Object.fromEntries([...GROUPS, "별표"].map((g) => [g, all.filter((d) => d.group === g).length])), [all]);

  return (
    <div className="card df">
      <div className="card-t">용어 정의</div>
      <p className="df-lead">
        소방 관계 법령(법률·시행령·시행규칙)과 화재안전성능기준의 「정의」 조문을 용어별로 찾습니다. 정의 문장은 법제처 현행 원문 그대로이며, 출처는 조·항·호·목까지 표시합니다.
      </p>
      <div className="df-search">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="용어 검색 (예: 무창층, 피난층, 특정소방대상물)" aria-label="용어 검색" autoFocus />
        <label className="df-chk">
          <input type="checkbox" checked={body} onChange={(e) => setBody(e.target.checked)} /> 정의 내용까지 검색
        </label>
      </div>
      <div className="df-groups">
        <button type="button" className={group === "" ? "on" : ""} onClick={() => setGroup("")}>
          전체 <small>{all.length}</small>
        </button>
        {[...GROUPS, ...(counts["별표"] ? ["별표"] : [])].map((g) => (
          <button key={g} type="button" className={group === g ? "on" : ""} onClick={() => setGroup(group === g ? "" : g)} disabled={!counts[g]}>
            {g} <small>{counts[g]}</small>
          </button>
        ))}
      </div>
      <div className="df-meta">
        {st.busy ? (
          `법제처 현행 조문을 받는 중… (${st.step})`
        ) : st.list ? (
          <>
            {q ? `「${q}」 ${hits.length}건` : `${hits.length}건`} · 기준일 {dot(st.date) || "-"}
            <button type="button" className="w-link" onClick={load} title="법제처에서 현행 조문을 다시 받습니다(브라우저에 7일 보관)">
              새로 받기
            </button>
          </>
        ) : (
          ""
        )}
      </div>
      {st.fails.length > 0 && (
        <div className="note warn">
          일부를 받지 못했습니다 — {st.fails.join(" / ")}.{" "}
          <button type="button" className="w-link" onClick={load}>
            다시 받기
          </button>
        </div>
      )}
      <ol className="df-list">
        {hits.slice(0, more).map((d, i) => (
          <li key={`${d.src}:${d.term}:${i}`} className="df-it">
            <div className="df-h">
              <b className="df-term">
                <Mark text={d.term} q={q} />
              </b>
              {d.alias && <span className="df-alias">({d.alias})</span>}
              {d.parent && <span className="df-parent">「{d.parent}」의 한 종류</span>}
              <span className={`df-grp${d.group === STD_GROUP ? " std" : d.group === "별표" ? " byl" : ""}`}>{d.group === STD_GROUP ? `NFPC ${d.std}` : d.group}</span>
            </div>
            <div className="df-text">
              <Mark text={d.text} q={body ? q : ""} />
            </div>
            <div className="df-src">
              출처: {d.src}
              {d.eff ? ` (시행 ${dot(d.eff)})` : ""}
              {d.link && (
                <a href={d.link} target="_blank" rel="noopener noreferrer">
                  원문
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
      {hits.length > more && (
        <button type="button" className="btn df-more" onClick={() => setMore((m) => m + SHOW)}>
          더 보기 ({hits.length - more}건 남음)
        </button>
      )}
      {st.list && !hits.length && <div className="df-empty">찾는 용어가 없습니다. 「정의 내용까지 검색」을 켜 보십시오.</div>}
      <div className="lt-src">
        출처: 법제처 국가법령정보 OPEN API 현행 조문 — {DEF_FAMS.map((f) => f[1]).join("·")}의 법률·시행령·시행규칙과 화재안전성능기준(NFPC) 42종에서 제목이 「(정의)」인 조문. 별표·부록 등에 있는 정의는 따로 추가합니다.
        {st.misses.length > 0 && <span className="df-miss"> 정의 조문이 없는 법령: {st.misses.length}개</span>}
      </div>
    </div>
  );
}

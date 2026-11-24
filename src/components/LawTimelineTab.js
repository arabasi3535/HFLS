import { Fragment, useEffect, useMemo, useState } from "react";
import { ERAS, eraOf, dot, mergeDecree, mergeNotes, stdNotes, filterRows, isFuture, lawLink, noText } from "../law/lawTimeline";
import { LAW_NOTES, RULE_NOTES } from "../law/lawNotes";
import { STD_NOTES } from "../law/stdNotes";
import { STDS } from "./lawHistStds";

// ============================================================
// 기타 자료 › 법령 연혁 — 맨 위 연혁법 찾기(LawHistTab) 아래: 법령 체계(시기별), 개정 연혁(법률·시행령·시행규칙·화재안전기준)
//  (v2.45.0 관리자 「법령 연혁」 탭을 옮겨 정리 — 관리자 탭은 삭제)
//  개정 목록은 법제처 OPEN API 연혁 목록(/api/lawat?list=1) — 브라우저에 하루 보관
//  시행령은 설치기준 관련 개정에 요약(sources.js AMENDMENTS)을 붙여 「설치기준」으로 표시
// ============================================================

const KINDS = [
  ["law", "법률"],
  ["dec", "시행령"],
  ["rule", "시행규칙"],
  ["std", "화재안전기준"],
];
const CACHE = "hfls_lawtl_v1";
const DAY = 24 * 3600 * 1000;
const today = () => {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
};

function readCache(key) {
  try {
    const all = JSON.parse(localStorage.getItem(CACHE) || "{}");
    const c = all[key];
    return c && Date.now() - c.at < DAY ? c.v : null;
  } catch (e) {
    return null;
  }
}
function writeCache(key, v) {
  try {
    const all = JSON.parse(localStorage.getItem(CACHE) || "{}");
    all[key] = { at: Date.now(), v };
    localStorage.setItem(CACHE, JSON.stringify(all));
  } catch (e) {
    /* 저장 불가 환경 */
  }
}

async function loadList(kind, std) {
  const key = kind === "std" ? `std:${std}` : `fire:${kind}`;
  const c = readCache(key);
  if (c) return c;
  const q = kind === "std" ? `std=${encodeURIComponent(std)}&list=1` : `fam=fire&kind=${kind}&list=1`;
  const r = await fetch(`/api/lawat?${q}&format=json`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok || !Array.isArray(j.versions)) throw new Error(j.error || (r.status === 429 ? "요청이 많습니다. 10분 뒤 다시 시도하십시오." : `응답 오류(${r.status})`));
  writeCache(key, j.versions);
  return j.versions;
}

/** 법령 체계 — 시기 막대 + 시기별 카드 */
function Systems() {
  return (
    <div className="card lt-sys">
      <div className="card-t">법령 체계</div>
      <div className="lt-bar" aria-hidden="true">
        {ERAS.map((e, i) => (
          <span key={e.id} className={`lt-seg s${i}`} title={`${e.short} ${dot(e.from)}~${dot(e.to)}`}>
            <b>{e.short}</b>
            <small>
              {e.from.slice(0, 4)}~{e.to === "9999-12-31" ? "현재" : e.to.slice(0, 4)}
            </small>
          </span>
        ))}
      </div>
      <div className="lt-eras">
        {ERAS.map((e, i) => (
          <div key={e.id} className={`lt-era s${i}`}>
            <div className="lt-era-h">
              <b>{e.short}</b>
              <span>
                {dot(e.from)} ~ {dot(e.to)}
              </span>
            </div>
            <dl>
              <dt>설치기준</dt>
              <dd>{e.table}</dd>
              <dt>기술기준</dt>
              <dd>
                {e.std.map(([p, n]) => (
                  <div key={n}>
                    {p && <small>{p} </small>}
                    {n}
                  </div>
                ))}
              </dd>
            </dl>
          </div>
        ))}
      </div>
      <div className="lt-src">근거: 법제처 국가법령정보 OPEN API 연혁 목록·연혁본 목차(별표 번호), 2025년도 소방시설법령 해설서 「법령 연혁」(소방법 시기 기술기준)</div>
    </div>
  );
}

const WHY_CLS = (w) => (/제정/.test(w) ? "w-new" : /전부/.test(w) ? "w-all" : /부칙/.test(w) ? "w-add" : /타법/.test(w) ? "w-oth" : "w-part");

function Row({ r, now, std, tag }) {
  const link = lawLink(r);
  const future = isFuture(r, now);
  return (
    <li className={`lt-row${r.notes && r.notes.length ? " has-note" : ""}${future ? " future" : ""}`}>
      <div className="lt-row-h">
        <b className="lt-eff">{dot(r.eff)}</b>
        <span className={`lt-why ${WHY_CLS(r.why || "")}`}>{r.why}</span>
        {std && r.std && <span className={`lt-trk ${r.track === "t" ? "t" : "p"}`}>{r.std}</span>}
        {future && <span className="lt-fut">시행 예정</span>}
        <span className="lt-no">
          {noText(r)}
          {r.pub && r.pub !== r.eff ? ` · ${dot(r.pub)} ${r.seq ? "발령" : "공포"}` : ""}
        </span>
        {link && (
          <a className="lt-link" href={link} target="_blank" rel="noopener noreferrer">
            원문
          </a>
        )}
      </div>
      {r.notes &&
        r.notes.map((a, i) => (
          <div key={i} className="lt-note">
            <span className="lt-tag">{tag}</span> {a.text}
          </div>
        ))}
    </li>
  );
}

function History() {
  const [kind, setKind] = useState("law"); // (v2.49.0) 기본 법률
  const [std, setStd] = useState("103");
  const [major, setMajor] = useState(true);
  const [era, setEra] = useState("");
  const [track, setTrack] = useState("");
  const [asc, setAsc] = useState(false);
  const [st, setSt] = useState({ busy: false, err: "", list: null, key: "" });
  const key = kind === "std" ? `std:${std}` : kind;
  useEffect(() => {
    let live = true;
    setSt((p) => ({ ...p, busy: true, err: "" }));
    loadList(kind, std)
      .then((v) => live && setSt({ busy: false, err: "", list: v, key }))
      .catch((e) => live && setSt({ busy: false, err: e.message || "불러오지 못했습니다.", list: null, key }));
    return () => {
      live = false;
    };
  }, [kind, std, key]);
  const now = today();
  const ready = st.key === key ? st.list : null;
  const all = useMemo(() => {
    if (!ready) return kind === "dec" && st.err ? mergeDecree([]) : [];
    if (kind === "dec") return mergeDecree(ready);
    if (kind === "std") {
      const own = STD_NOTES[std] || [];
      return ready.map((v) => {
        const mine = own.filter((a) => a.eff.replace(/-/g, "") === v.eff && a.no === v.no);
        return { ...v, notes: mine.length ? mine : stdNotes(std).filter((a) => a.eff.replace(/-/g, "") === v.eff) };
      });
    }
    return mergeNotes(ready, kind === "law" ? LAW_NOTES : RULE_NOTES);
  }, [ready, kind, std, st.err]);
  const rows = useMemo(() => filterRows(all, { major, era: kind === "std" ? "" : era, track: kind === "std" ? track : "", asc }), [all, major, era, track, kind, asc]);
  const nNote = all.filter((r) => r.notes && r.notes.length).length;
  // 시기가 바뀌는 곳에 머리줄
  let lastEra = "";
  return (
    <div className="card lt-hist">
      <div className="card-t">개정 연혁</div>
      <nav className="tl-tabs lt-kinds">
        {KINDS.map(([k, l]) => (
          <button key={k} type="button" className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
            {l}
          </button>
        ))}
      </nav>
      <div className="lt-filters">
        {kind === "std" ? (
          <>
            <select value={std} onChange={(e) => setStd(e.target.value)} aria-label="화재안전기준 설비">
              {STDS.map(([k, n]) => (
                <option key={k} value={k}>
                  {k} {n}
                </option>
              ))}
            </select>
            <select value={track} onChange={(e) => setTrack(e.target.value)} aria-label="기준 종류">
              <option value="">NFSC·NFPC·NFTC 모두</option>
              <option value="p">NFSC·NFPC(고시)</option>
              <option value="t">NFTC(공고)</option>
            </select>
          </>
        ) : (
          <select value={era} onChange={(e) => setEra(e.target.value)} aria-label="시기">
            <option value="">모든 시기</option>
            {[...ERAS].reverse().map((e) => (
              <option key={e.id} value={e.id}>
                {e.short} ({dot(e.from)}~{e.to === "9999-12-31" ? "" : dot(e.to)})
              </option>
            ))}
          </select>
        )}
        <label className="lt-chk">
          <input type="checkbox" checked={!major} onChange={(e) => setMajor(!e.target.checked)} /> 타법개정 포함
        </label>
        <button type="button" className="btn small" onClick={() => setAsc((x) => !x)}>
          {asc ? "오래된 순" : "최신 순"} ⇅
        </button>
      </div>
      <div className="lt-meta">
        {st.busy && !ready ? (
          "법제처 연혁 목록을 불러오는 중…"
        ) : st.err ? (
          <span className="w-err">
            법제처 목록을 불러오지 못했습니다({st.err}).{kind === "dec" ? " 설치기준 요약만 표시합니다." : ""}
          </span>
        ) : (
          <>
            {all.length}건 중 {rows.length}건{nNote ? (kind === "dec" ? ` · 설치기준 관련 ${nNote}건 요약` : ` · 주요 개정 ${nNote}건 요약`) : ""}
            {major ? " · 타법개정 숨김" : ""}
          </>
        )}
      </div>
      <ol className="lt-list">
        {rows.map((r, i) => {
          const e = kind === "std" ? "" : eraOf(r);
          const head = e && e !== lastEra;
          lastEra = e || lastEra;
          const E = ERAS.find((x) => x.id === e);
          return (
            <Fragment key={`${r.eff}:${r.no}:${r.seq || r.mst || i}`}>
              {head && !era && (
                <li className={`lt-era-row s${ERAS.indexOf(E)}`}>
                  {E.short} <span>{E.law}{kind === "dec" ? " 시행령" : kind === "rule" ? " 시행규칙" : ""}</span>
                </li>
              )}
              <Row r={r} now={now} std={kind === "std"} tag={kind === "dec" ? "설치기준" : "주요 내용"} />
            </Fragment>
          );
        })}
      </ol>
      <div className="lt-src">
        출처: 법제처 국가법령정보 OPEN API 연혁 목록(시행일 기준, 같은 개정의 부칙 시행일이 따로 있으면 줄이 나뉨). {kind === "dec" ? "「설치기준」 요약은 법제처 제·개정이유·연혁본 원문과 운영매뉴얼·법령집을 대조해 정리한 것입니다." : kind === "std" ? (STD_NOTES[std] ? " 「주요 내용」은 행정규칙 제·개정문의 개정이유·부칙에서 민원 업무에 필요한 내용만 줄인 것입니다(개정이유가 없는 옛 판은 요약 없음)." : " 이 설비는 아직 「주요 내용」 요약이 없습니다(소화기구·스프링클러·간이·화재조기진압용·자동화재탐지·피난기구·유도등 정리됨).") : "「주요 내용」은 법제처 제·개정이유에서 민원 업무에 필요한 내용만 줄인 것입니다(기한·기간 숫자는 원문 문장과 대조)."}
        {kind === "std" ? " 2022.12.1.부터 성능기준(NFPC, 고시)과 기술기준(NFTC, 공고)이 나뉨." : ""}
      </div>
    </div>
  );
}

export default function LawTimelineTab() {
  return (
    <div className="lt">
      <Systems />
      <History />
    </div>
  );
}

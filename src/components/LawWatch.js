import { useEffect, useState } from "react";
import { LAW_BASE_AT, lawChanges } from "../law/lawBase";
import { lawUrl } from "../law/lawlinks";

// ============================================================
// 법령 개정 알림 — /api/lawwatch(법제처 OPEN API, 12시간마다 갱신)의 현행 시행일을
//  이 앱의 반영 기준선(src/law/lawBase.js)과 비교해 늦은 개정이 있으면 맨 위 띠로 알림
//  · 띠는 「닫기」하면 같은 내용이 바뀔 때까지 다시 뜨지 않음(이 브라우저 기준)
//  · 기타 자료 › 법령 자료 위쪽에 전체 현황(LawWatchPanel)
// ============================================================
const DISMISS = "hfls_lw_dismiss";
let cache = null; // 한 번 받은 결과를 탭 전환 사이에 재사용

export function useLawWatch() {
  const [data, setData] = useState(cache);
  useEffect(() => {
    if (cache) return undefined;
    let alive = true;
    fetch("/api/lawwatch")
      .then((r) => r.json().catch(() => null))
      .then((j) => {
        const v = j && j.ok && Array.isArray(j.items) ? j : { ok: false, items: [], upcoming: [] };
        cache = v;
        if (alive) setData(v);
      })
      .catch(() => {
        cache = { ok: false, items: [], upcoming: [] };
        if (alive) setData(cache);
      });
    return () => {
      alive = false;
    };
  }, []);
  return data;
}

export const fmtD = (d) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || "");
  return m ? `${m[1]}. ${+m[2]}. ${+m[3]}.` : "";
};
const kindOf = (it) => (it.t === "admrul" ? "행정규칙" : "법령");

function Item({ it, tag }) {
  return (
    <li>
      <a href={lawUrl(it.n, kindOf(it))} target="_blank" rel="noopener noreferrer">
        {it.n}
      </a>{" "}
      <span className="lwt-m">
        {tag && <em className={`lwt-tag ${tag.c}`}>{tag.t}</em>}
        {it.k} · 시행 {fmtD(it.eff)}
        {it.pub ? ` · ${it.t === "admrul" ? "발령" : "공포"} ${fmtD(it.pub)}` : ""}
        {it.why ? ` · ${it.why}` : ""}
        {it.base ? ` (앱 반영 기준 시행 ${fmtD(it.base)})` : ""}
      </span>
    </li>
  );
}

/** 화면 맨 위 알림 띠 */
export default function LawWatchBar() {
  const data = useLawWatch();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(DISMISS) || "";
    } catch (e) {
      return "";
    }
  });
  if (!data || !data.ok) return null;
  const ch = lawChanges(data.items);
  const up = data.upcoming || [];
  if (!ch.length && !up.length) return null;
  const sig = [...ch, ...up].map((x) => x.n + x.eff).sort().join("|");
  if (hidden === sig) return null;
  const first = ch[0] || up[0];
  return (
    <div className="lwt-bar no-print" role="status">
      <div className="lwt-row">
        <span className="lwt-ico">{ch.length ? "⚠" : "📅"}</span>
        <span className="lwt-txt">
          {ch.length ? (
            <>
              <b>법령 개정 알림</b> — 「{first.n}」 개정(시행 {fmtD(first.eff)})
              {ch.length > 1 ? ` 외 ${ch.length - 1}건` : ""}. 이 앱 판정 기준에 아직 반영되지 않았을 수 있습니다.
            </>
          ) : (
            <>
              <b>시행 예정 법령</b> — 「{first.n}」 시행 {fmtD(first.eff)}
              {up.length > 1 ? ` 외 ${up.length - 1}건` : ""}
            </>
          )}
          {ch.length > 0 && up.length > 0 && <> · 시행 예정 {up.length}건</>}
        </span>
        <button type="button" className="lwt-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "접기" : "자세히"}
        </button>
        <button
          type="button"
          className="lwt-btn"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS, sig);
            } catch (e) {
              /* 저장 불가 환경 */
            }
            setHidden(sig);
          }}
        >
          닫기
        </button>
      </div>
      {open && (
        <div className="lwt-det">
          {ch.length > 0 && (
            <>
              <div className="lwt-h">앱 반영 확인 전 개정 {ch.length}건 (기준선 {fmtD(LAW_BASE_AT)})</div>
              <ul>
                {ch.map((it) => (
                  <Item key={it.n} it={it} tag={it.kind === "new" ? { t: "새 기준", c: "new" } : { t: "개정", c: "amend" }} />
                ))}
              </ul>
            </>
          )}
          {up.length > 0 && (
            <>
              <div className="lwt-h">공포 후 시행 예정 {up.length}건</div>
              <ul>
                {up.map((it) => (
                  <Item key={it.n + it.eff} it={it} tag={{ t: "시행 예정", c: "up" }} />
                ))}
              </ul>
            </>
          )}
          <div className="lwt-note">
            국가법령정보센터 OPEN API로 하루 2번 확인합니다(마지막 확인 {data.at ? new Date(data.at).toLocaleString("ko-KR") : "—"}). 판정 결과를
            쓰기 전에 개정 내용(부칙 적용례 포함)을 원문으로 확인하세요.
          </div>
        </div>
      )}
    </div>
  );
}

/** 기타 자료 › 법령 자료 위쪽 — 최근 시행 순 현황 */
export function LawWatchPanel() {
  const data = useLawWatch();
  if (!data) return <div className="lw-note">법령 개정 현황을 확인하는 중…</div>;
  if (!data.ok) return null;
  const ch = lawChanges(data.items);
  const chSet = new Set(ch.map((x) => x.n));
  const recent = [...data.items].sort((a, b) => (b.eff || "").localeCompare(a.eff || "")).slice(0, 12);
  const up = data.upcoming || [];
  return (
    <details className="lw-hist lwt-panel">
      <summary className="lw-hist-h">
        법령 개정 현황 — 앱 반영 확인 전 {ch.length}건 · 시행 예정 {up.length}건
      </summary>
      <ul className="lwt-list">
        {up.map((it) => (
          <Item key={"u" + it.n + it.eff} it={it} tag={{ t: "시행 예정", c: "up" }} />
        ))}
        {recent.map((it) => (
          <Item key={it.n} it={it} tag={chSet.has(it.n) ? { t: "반영 확인 전", c: "amend" } : null} />
        ))}
      </ul>
      <div className="lw-note">
        최근 시행일 순 12건 · 감시 대상: 소방시설법·화재예방법·공사업법·소방기본법·다중이용업소법·위험물안전관리법(법률·시행령·시행규칙)과 NFPC·NFTC 전체 · 마지막 확인{" "}
        {data.at ? new Date(data.at).toLocaleString("ko-KR") : "—"}
      </div>
    </details>
  );
}

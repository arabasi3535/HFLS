import { Fragment, useState } from "react";
import { CATS } from "../law/facilities";
import { STATUS, toCSV } from "../law/engine";
import { SOURCES, D, HIST24_PAGES } from "../law/sources";

const ST_CLASS = {
  [STATUS.REQ]: "st-req",
  [STATUS.REQ_CHK]: "st-reqchk",
  [STATUS.CHK]: "st-chk",
  [STATUS.NONE]: "st-none",
};
const CERT = {
  V: { t: "원문확인", c: "cert-v", d: "원문·부칙·법제처 제·개정이유로 확인" },
  M: { t: "연혁자료확인", c: "cert-m", d: "소방특별조사 운영매뉴얼 「연도별 적용기준」·한국소방시설관리협회 「소방시설 설치기준 개정연혁」(2024)으로 확인" },
  I: { t: "시점추정", c: "cert-i", d: "개정이유 대조로 도입·폐지 시점 추정 — 연혁본 대조 권장" },
  U: { t: "미검증", c: "cert-u", d: "연혁본 확인 필요" },
};

export function StatusBadge({ s }) {
  return <span className={`st ${ST_CLASS[s] || ""}`}>{s}</span>;
}
function CertBadge({ c }) {
  const v = CERT[c] || CERT.U;
  return (
    <span className={`cert ${v.c}`} title={v.d}>
      {v.t}
    </span>
  );
}
const SRC_SHORT = { manual: "운영매뉴얼", hist24: "법령집", use24: "2024용도별" };
function SrcLinks({ src, fac }) {
  if (!src) return null;
  return (
    <span className="srcs">
      {src.split(",").map((k) =>
        SOURCES[k] && !SOURCES[k].url ? (
          <span key={k} className="src-nolink" title={SOURCES[k].title}>
            [{SRC_SHORT[k] || k}
            {k === "hist24" && fac && HIST24_PAGES[fac] ? ` p.${HIST24_PAGES[fac]}~` : ""}]
          </span>
        ) : SOURCES[k] ? (
          <a key={k} href={SOURCES[k].url} target="_blank" rel="noreferrer" title={SOURCES[k].title}>
            [{k}]
          </a>
        ) : null
      )}
    </span>
  );
}
const fmtDate = (d) => (d ? d.replace(/-/g, ".") + "." : "");

function CritList({ row }) {
  const groups = [
    ["해당 기준", row.hits, ""],
    ["해당 — 시점·문구 확인 필요", row.maybes, "maybe"],
    ["입력 부족으로 판정 불가", row.checks, "check"],
  ];
  return (
    <div className="crit-list">
      {groups.map(([t, list, cls]) =>
        list.length ? (
          <div key={t} className={`crit-group ${cls}`}>
            <div className="cg-title">{t}</div>
            {list.map((i) => (
              <div className="crit" key={i.id}>
                <div className="crit-text">
                  {i.text} <CertBadge c={i.cert} />
                  {i.effect === "maybe" && <span className="cert cert-u">효력시점 불명확</span>}
                </div>
                <div className="crit-meta">
                  <span>대상물: {i.basis || "—"}</span>
                  <span>범위: {i.scope}</span>
                </div>
                <div className="crit-ref">
                  {i.ref} <SrcLinks src={i.src} fac={row.fac.key} /> <code className="cid">{i.id}</code>
                </div>
                {i.note && <div className="crit-note">관리자 메모: {i.note}</div>}
              </div>
            ))}
          </div>
        ) : null
      )}
      {row.exHint && <div className="exhint">면제 검토: {row.exHint}</div>}
    </div>
  );
}

export default function ResultView({ rv }) {
  const [open, setOpen] = useState({});
  const [showNone, setShowNone] = useState(false);
  if (!rv) return null;
  const { hist, curr, second } = rv;
  const reqList = hist.rows.filter((r) => r.status === STATUS.REQ || r.status === STATUS.REQ_CHK);
  const chkList = hist.rows.filter((r) => r.status === STATUS.CHK || r.status === STATUS.REQ_CHK);
  const added = rv.compare.filter((c) => c.kind === "added");

  const downloadCSV = () => {
    const blob = new Blob([toCSV(rv)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `소방시설_검토표_${rv.primaryDate}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="result">
      {rv.issues.length > 0 && (
        <div className="alert warn">
          <b>입력 자료 불일치 — 판정 전 확인</b>
          <ul>
            {rv.issues.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {hist.unsupported && (
        <div className="alert danger">
          <b>1992.7.28. 이전 기준일</b> — 본 시스템은 이 시기 기준을 수록하지 않았습니다. 아래 결과는 1992.7.28. 소방법 기준을 준용한 <b>참고값</b>이며 모두 [설치(연혁 확인)]으로 하향 표시됩니다.
        </div>
      )}
      {rv.use && rv.use.g.includes("house") && (
        <div className="alert warn">
          <b>단독주택은 별표2 특정소방대상물이 아닙니다</b> — 시행령 별표4 소방시설(옥내소화전·자탐 등) 적용 대상이 아니며,
          소방시설법 제10조에 따른 <b>주택용소방시설(소화기·단독경보형 감지기)</b>만 설치 대상입니다(설치기준은 시·도 조례).
          다가구·다중주택도 건축법상 단독주택입니다.
        </div>
      )}
      {!hist.unsupported && hist.date < D.A && (
        <div className="alert warn">
          <b>소방법 시대(1992.7.28.~2004.5.29.) 기준일</b> — 소방특별조사 운영매뉴얼 「소방시설의 연도별 적용기준」으로 판정합니다(검증등급 <b>연혁자료확인</b>). 당시 용도분류(구 건축법)는 현행 별표2와 달라 근사 대응하였으므로, 결과는 당시 소방법 시행령 연혁본으로 대조하십시오.
        </div>
      )}
      {hist.rowGap && (
        <div className="alert warn">
          <b>2024.12.1. 전 신청 연립·다세대주택은 특정소방대상물이 아닙니다</b> — 당시 별표2 공동주택은 아파트등(5층 이상 주택)·기숙사뿐이며, 연립·다세대는 2024.12.1. 신청분부터 편입되었습니다(대통령령 제33004호 부칙). 별표4 기준은 적용하지 않고 주택용소방시설(소화기·단독경보형 감지기) 대상으로 검토합니다. 다만 건축물 내부 차고·주차장(물분무등소화설비, 2018~2022 '50세대 미만 연립·다세대 제외' 규정 관련)은 [설치(연혁 확인)]으로 별도 표시합니다.
        </div>
      )}
      {hist.rowOld && (
        <div className="alert warn">
          <b>소방법 시대 연립·다세대주택</b> — 당시 소방대상물(특수장소) 해당 여부를 연혁본으로 확인해야 하므로 모든 결과를 [설치(연혁 확인)]으로 낮춰 표시합니다.
        </div>
      )}

      {/* 적용 법령 */}
      <div className="card law-card">
        <div className="lc-row">
          <div>
            <div className="lc-k">적용 기준일{rv.primaryLabel ? ` — ${rv.primaryLabel}` : ""}</div>
            <div className="lc-v">{fmtDate(rv.primaryDate)}</div>
          </div>
          <div>
            <div className="lc-k">법령 체계</div>
            <div className="lc-v">{hist.system ? hist.system.label : "—"}</div>
          </div>
          <div>
            <div className="lc-k">설치기준표</div>
            <div className="lc-v">{hist.table}</div>
          </div>
        </div>
        {hist.system && (
          <div className="lc-detail">
            {hist.system.decree} · {hist.system.std}
          </div>
        )}
        {rv.ext && (
          <div className="ext-box">
            <b>{rv.ext.title}</b> — {rv.ext.principle}
            <div className="ext-result">▶ {rv.ext.result}</div>
            <div className="muted small">{rv.ext.basis}</div>
            {rv.ext.notes.map((n, i) => (
              <div key={i} className="muted small">
                ※ {n}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 결론 */}
      <div className="card">
        <div className="card-t">
          결론 — {rv.primaryLabel ? `${rv.primaryLabel} ` : ""}당시 기준 설치 대상 ({reqList.length}종)
        </div>
        <div className="chips">
          {reqList.length === 0 && <span className="muted">설치 대상 없음</span>}
          {reqList.map((r) => (
            <span key={r.fac.key} className={`chip ${r.status === STATUS.REQ ? "" : "chip-chk"}`}>
              {r.fac.name}
              {r.status !== STATUS.REQ && " (확인)"}
            </span>
          ))}
        </div>
        {second && (
          <div className="second">
            <div className="card-t small">
              {rv.secondary.label} — {fmtDate(rv.secondary.date)} 기준 설치 대상
            </div>
            <div className="chips">
              {second.rows
                .filter((r) => r.status === STATUS.REQ || r.status === STATUS.REQ_CHK)
                .map((r) => (
                  <span key={r.fac.key} className="chip chip-alt">
                    {r.fac.name}
                  </span>
                ))}
            </div>
          </div>
        )}
        <div className="exports no-print">
          <button className="btn small" onClick={downloadCSV}>
            검토표 CSV
          </button>
          <button className="btn small" onClick={() => window.print()}>
            인쇄 / PDF
          </button>
        </div>
      </div>

      {/* 부칙 소급 */}
      {(rv.retro.length > 0 || rv.housing || (rv.retroExcluded && rv.retroExcluded.length > 0)) && (
        <div className="card retro-card">
          <div className="card-t">부칙 소급 — 기존 대상물 설치 의무</div>
          {rv.retroExcluded &&
            rv.retroExcluded.map((t) => (
              <div key={t} className="small muted">
                ※ 소급 제외: {t} — 입력한 사용승인일이 부칙 시행일 이후이므로 '시행 당시 기존 대상물'에 해당하지 않음
              </div>
            ))}
          {rv.retro.map((r) => (
            <div key={r.id} className={`retro ${r.expired ? "expired" : ""}`}>
              <div className="retro-t">
                {r.title} <CertBadge c={r.cert} />
              </div>
              <div>
                설치 기한: <b>{fmtDate(r.deadline)}</b> {r.expired ? <span className="tag-red">기한 경과 — 미설치 시 위반</span> : <span className="tag-amber">기한 도래 전</span>}
                {r.deadlineNote && <span className="muted"> · {r.deadlineNote}</span>}
              </div>
              <div className="muted small">
                근거: {r.basis} <SrcLinks src={r.src} />
              </div>
              {r.needsCompletion && (
                <div className="small warn-text">
                  ※ 적용 대상은 {r.when}입니다. 사용승인일(설치완료일)을 입력하지 않아 신청일 기준으로 후보 표시했습니다 — 입력 시 자동 판정.
                </div>
              )}
              <div className="small">
                당시 판정:{" "}
                {r.histStatus.map((h) => (
                  <span key={h.k} className="inline-st">
                    {h.name} <StatusBadge s={h.st} />
                  </span>
                ))}
              </div>
            </div>
          ))}
          {rv.housing && (
            <div className="retro">
              <div className="retro-t">
                {rv.housing.title} <CertBadge c={rv.housing.cert} />
              </div>
              <div className="small">{rv.housing.basis}</div>
              <div>{rv.housing.retro}</div>
              {rv.housing.note && <div className="muted small">{rv.housing.note}</div>}
            </div>
          )}
        </div>
      )}

      {/* 검토표 */}
      <div className="card">
        <div className="card-head">
          <div className="card-t">검토표 — 당시 기준 vs 현행({fmtDate(rv.today)})</div>
          <label className="check small no-print">
            <input type="checkbox" checked={showNone} onChange={(e) => setShowNone(e.target.checked)} />
            <span>해당없음 포함</span>
          </label>
        </div>
        <div className="table-wrap">
          <table className="review">
            <thead>
              <tr>
                <th>구분</th>
                <th>소방시설</th>
                <th>당시</th>
                <th>현행</th>
                <th>현행 대비 / 소급</th>
                <th>기준</th>
              </tr>
            </thead>
            <tbody>
              {CATS.map((cat) => {
                const rows = hist.rows.filter(
                  (r) => r.fac.cat === cat && (showNone || r.status !== STATUS.NONE || curr.byKey[r.fac.key].status !== STATUS.NONE)
                );
                if (!rows.length) return null;
                return (
                  <Fragment key={cat}>
                    {rows.map((r, i) => {
                      const cmp = rv.compare.find((c) => c.fac.key === r.fac.key);
                      const isOpen = !!open[r.fac.key];
                      const hasDetail = r.hits.length + r.maybes.length + r.checks.length > 0;
                      return (
                        <Fragment key={r.fac.key}>
                          <tr
                            className={`${hasDetail ? "clickable" : ""} ${isOpen ? "open" : ""}`}
                            onClick={() => hasDetail && setOpen((o) => ({ ...o, [r.fac.key]: !o[r.fac.key] }))}
                          >
                            <td className="cat">{i === 0 ? cat : ""}</td>
                            <td className="fname">
                              {hasDetail && <span className="caret">{isOpen ? "▾" : "▸"}</span>}
                              {r.fac.name}
                            </td>
                            <td>
                              <StatusBadge s={r.status} />
                            </td>
                            <td>
                              <StatusBadge s={cmp.c} />
                            </td>
                            <td className="small">
                              {cmp.kind === "added" && <span className={cmp.retroKind.startsWith("부칙") ? "tag-red" : cmp.retroKind.startsWith("강화") ? "tag-amber" : "tag-gray"}>{cmp.retroKind}</span>}
                              {cmp.kind === "removed" && <span className="tag-gray">현행 미대상(완화·변경)</span>}
                              {cmp.kind === "unknown" && <span className="tag-gray">비교 판정 불가(확인 필요 항목)</span>}
                            </td>
                            <td className="small muted">{r.std}</td>
                          </tr>
                          {isOpen && (
                            <tr className="detail-row">
                              <td colSpan={6}>
                                <CritList row={r} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="legend small">
          <StatusBadge s={STATUS.REQ} /> 기준 충족 · <StatusBadge s={STATUS.REQ_CHK} /> 기준 충족이나 효력시점·문구 확인 필요 · <StatusBadge s={STATUS.CHK} /> 입력 부족 · 행을 누르면 판정 근거·조항·원문 링크 표시
        </div>
      </div>

      {/* 강화기준 / 현행 추가 */}
      {added.length > 0 && (
        <div className="card">
          <div className="card-t">현행 기준에서 추가되는 시설 ({added.length}종) — 기존 대상물 적용 여부</div>
          <ul className="plain">
            {added.map((c) => (
              <li key={c.fac.key}>
                <b>{c.fac.name}</b> — {c.retroKind}
              </li>
            ))}
          </ul>
          <div className="muted small">
            원칙: 대통령령·화재안전기준이 강화되어도 기존 특정소방대상물에는 변경 전 기준 적용(법 제13조제1항 본문). 예외: {rv.strengthenedBasis}
          </div>
        </div>
      )}

      {/* 확인 필요 */}
      {(chkList.length > 0 || rv.checklist.length > 0) && (
        <div className="card">
          <div className="card-t">확인 필요 사항</div>
          <ul className="plain">
            {chkList.map((r) => (
              <li key={r.fac.key}>
                <b>{r.fac.name}</b>:{" "}
                {[...r.maybes, ...r.checks].map((i) => i.text).join(" / ")}
              </li>
            ))}
            {rv.checklist.map((s, i) => (
              <li key={"c" + i} className="muted">
                {s}
              </li>
            ))}
            <li className="muted">해석이 갈리는 사항은 소방청 질의회신·법제처 법령해석을 확인하십시오. 별표6(설치 제외) 해당 여부는 본 시스템에서 판정하지 않습니다.</li>
          </ul>
        </div>
      )}
    </div>
  );
}

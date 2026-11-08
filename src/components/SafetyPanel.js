import { useState } from "react";
import { S, SAFETY_REFS } from "../law/safety";

// ============================================================
// 안전관리 검토 결과 — 소방안전관리대상물 등급 · 방염 · 소방자동차 전용구역
// ============================================================

const cls = (st) => (st === S.YES ? "sf-yes" : st === S.CHK ? "sf-chk" : st === S.NA ? "sf-na" : "sf-no");

function Card({ title, badge, status, lead, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`sf-card ${cls(status)} ${open ? "open" : ""}`}>
      <button type="button" className="sf-head" onClick={() => setOpen((v) => !v)}>
        <span className="sf-title">{title}</span>
        <span className={`sf-badge ${cls(status)}`}>{badge}</span>
        <span className="it-caret">{open ? "▾" : "▸"}</span>
      </button>
      {lead && <div className="sf-lead">{lead}</div>}
      <div className={`sf-det ${open ? "open" : ""}`}>{children}</div>
    </div>
  );
}

export default function SafetyPanel({ sv }) {
  const { grade, flame, lane, insp } = sv;
  const gl = grade.label || grade.grade;
  const gBadge = grade.status === S.NA ? "해당없음" : grade.status === S.CHK ? (gl ? `${gl} 이상` : "확인 필요") : gl || "해당없음";
  const iBadge = !insp ? "" : insp.status === S.NA ? "제외" : insp.status === S.NO ? "비대상" : insp.status === S.CHK ? "확인 필요" : insp.top ? "종합(반기)" : insp.comp.length ? "종합+작동" : "작동";
  return (
    <div className="safety">
      <div className="facs-h">
        <span>안전관리 검토</span>
        <span className="facs-legend">현행 기준(전용구역은 신청일 기준)</span>
      </div>

      <Card title="소방안전관리대상물" badge={gBadge} status={grade.status === S.NO ? S.NA : grade.status} lead={grade.summary}>
        {grade.levels && grade.levels.length > 0 && (
          <ul className="sf-list">
            {grade.levels.map((l, i) => (
              <li key={l.grade} className={i === grade.first ? "hit" : ""}>
                <b>{l.grade}</b>
                {l.hit.length > 0 ? (
                  l.hit.map((c, j) => (
                    <div key={j} className="sf-crit ok">
                      해당 — {c.text}
                      {c.basis ? <small> ({c.basis})</small> : null}
                    </div>
                  ))
                ) : l.unk.length > 0 ? (
                  l.unk.map((c, j) => (
                    <div key={j} className="sf-crit unk">
                      확인 필요 — {c.text}
                      {c.basis ? <small> ({c.basis})</small> : null}
                    </div>
                  ))
                ) : (
                  <div className="sf-crit no">해당 기준 없음</div>
                )}
              </li>
            ))}
          </ul>
        )}
        {grade.notes.map((n, i) => (
          <div key={i} className="det-line">
            {n}
          </div>
        ))}
        <div className="det-ref">{grade.ref}</div>
      </Card>

      {insp && (
        <Card title="자체점검" badge={iBadge} status={insp.status === S.NO ? S.NA : insp.status} lead={insp.summary}>
          {insp.comp.length > 0 && (
            <div className="det-crit">
              <div>종합점검 대상 — 별표3 제3호가목</div>
              {insp.comp.map((c, i) => (
                <div key={i} className="det-meta">
                  {c}
                </div>
              ))}
            </div>
          )}
          {insp.op !== undefined && (
            <div className="det-crit">
              <div>작동점검 {insp.top ? "제외(특급)" : insp.op === true ? "대상" : insp.op === null ? "확인 필요" : "비대상"} — 별표3 제2호가목</div>
              <div className="det-meta">소방안전관리자 선임 대상{grade.label ? `(${grade.label})` : ""} · 위험물 제조소등·특급 소방안전관리대상물 제외</div>
            </div>
          )}
          {insp.who.length > 0 && (
            <div className="det-crit">
              <div>점검자</div>
              {insp.who.map((w, i) => (
                <div key={i} className="det-meta">
                  {w}
                </div>
              ))}
            </div>
          )}
          {insp.when.length > 0 && (
            <div className="det-crit">
              <div>횟수·시기</div>
              {insp.when.map((w, i) => (
                <div key={i} className="det-meta">
                  {w}
                </div>
              ))}
            </div>
          )}
          {insp.notes.map((n, i) => (
            <div key={i} className="det-line">
              {n}
            </div>
          ))}
          <div className="det-ref">{insp.ref}</div>
        </Card>
      )}

      <Card
        title="방염 대상"
        badge={flame.status === S.YES ? "대상" : flame.status}
        status={flame.status}
        lead={flame.status === S.YES ? flame.hits.map((h) => `${h.no} ${h.text}${h.noRetro ? " (소급 없음)" : ""}`).join(" · ") : flame.status === S.CHK ? flame.checks.map((c) => c.text).join(" · ") : "시행령 제30조 각 호에 해당하지 않음"}
      >
        {flame.hits.map((h, i) => (
          <div key={i} className="det-crit">
            <div>
              {h.no} {h.text} {h.noRetro && <span className="tag t-noretro">소급 없음</span>}
            </div>
            <div className="det-meta">범위: {h.scope}</div>
            {h.noRetro && <div className="det-warn">{h.noRetro}</div>}
          </div>
        ))}
        {flame.checks.map((c, i) => (
          <div key={i} className="det-warn">
            {c.no} {c.text}
          </div>
        ))}
        {flame.notes.map((n, i) => (
          <div key={i} className="det-line">
            {n}
          </div>
        ))}
        <div className="det-ref">
          {flame.ref} · {SAFETY_REFS.flameItems}
        </div>
      </Card>

      <Card title="소방자동차 전용구역" badge={lane.status} status={lane.status} lead={lane.reason}>
        {lane.how && <div className="det-line">{lane.how}</div>}
        {lane.notes.map((n, i) => (
          <div key={i} className="det-line">
            {n}
          </div>
        ))}
        <div className="det-ref">
          {lane.ref} · 적용례 {SAFETY_REFS.laneBuchik}
          {lane.exc ? ` · 단서 적용례 ${SAFETY_REFS.laneExc}` : ""}
        </div>
      </Card>
    </div>
  );
}

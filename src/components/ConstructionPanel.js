import { useState } from "react";
import { construction, facsFromKeys } from "../law/construction";

// ============================================================
// 신축 건축물 결과 — 소방시설공사 착공 검토(착공신고·소방기술자·공사감리·감리원)
// 설치 목록으로 바로 산정하고, 세부 조정은 보조 계산기 「착공 계산기」로 넘김
// ============================================================

const cls = (st) => (st === "대상" ? "sf-yes" : st === "확인 필요" ? "sf-chk" : "sf-no");
const T_SHORT = ["자격수첩", "초급 이상", "중급 이상", "고급 이상", "특급"];
const S_SHORT = ["", "초급 이상", "중급 이상", "고급 이상", "특급 이상", "특급(소방기술사)"];

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

/** seed: Report에서 만든 착공 계산기 입력값 */
export function constructionFromSeed(seed) {
  return construction({
    apt: !!seed.apt,
    ugduct: !!seed.ugduct,
    hazmat: !!seed.hazmat,
    mixedRes: !!seed.mixedRes,
    area: seed.area,
    gf: seed.gf,
    bf: seed.bf,
    households: seed.households,
    facs: facsFromKeys(seed.facs),
  });
}

export default function ConstructionPanel({ seed, onOpen }) {
  const r = constructionFromSeed(seed);
  return (
    <div className="safety cx-panel">
      <div className="facs-h">
        <span>착공 검토 (소방시설공사)</span>
        <span className="facs-legend">신설 공사 기준 · 공사업법 시행령</span>
      </div>

      {!r.ok ? (
        <div className="sf-lead">{r.msg} — 입력을 마치면 표시됩니다.</div>
      ) : (
        <>
          <Card title="착공신고" badge={r.report.status} status={r.report.status} lead={r.report.why}>
            {r.report.items.length > 0 && <div className="cx-tags">{r.report.items.map((x) => <span key={x}>{x}</span>)}</div>}
            <div className="cx-ref">소방시설공사업법 제13조, 시행령 제4조</div>
          </Card>

          <Card
            title="소방기술자 배치"
            badge={r.tech.none ? "분야 설비 없음" : r.tech.grade}
            status={r.tech.none ? "비대상" : "대상"}
            lead={r.tech.none ? "별표2 비고 가·나의 기계·전기분야 공사에 해당하는 설비가 없습니다." : `${r.tech.grade} — ${r.tech.fields.join(" 및 ")} · ${r.tech.exclusive ? "1개 현장 전담" : "2개 현장까지 배치 가능"}`}
          >
            <ul className="cx-why">
              {r.tech.reasons.map((x, i) => (
                <li key={i} className={x.lv === r.tech.lv ? "cx-hit" : ""}>
                  <em>별표2 {x.ref}</em> {x.why} → {T_SHORT[x.lv]}
                </li>
              ))}
            </ul>
            <div>현장 배치: {r.tech.site}</div>
            <div className="cx-ref">시행령 제3조 [별표2] &lt;개정 2025.1.21.&gt;</div>
          </Card>

          <Card
            title="공사감리"
            badge={r.supv.status === "대상" ? r.supv.kind : "비대상"}
            status={r.supv.status}
            lead={r.supv.status === "대상" ? `감리 대상 — ${r.supv.kindWhy}` : `${r.supv.why} — 공사감리자 지정 대상 아님`}
          >
            {r.supv.status === "대상" && (
              <>
                <div>지정 대상 시공: {r.supv.items.map((it) => `${it.text}(${it.no})`).join(", ")}</div>
                <div className="cx-muted">감리 방법: {r.supv.method}</div>
              </>
            )}
            <div className="cx-ref">소방시설공사업법 제17조, 시행령 제10조·[별표3] &lt;개정 2026.3.17.&gt;</div>
          </Card>

          {r.supv.status === "대상" && (
            <Card
              title="감리원 배치"
              badge={`책임 ${S_SHORT[r.supv.lv]}`}
              status="대상"
              lead={`책임감리원 ${r.supv.chief} · 보조감리원 ${r.supv.assist.need}`}
            >
              <div>보조감리원: {r.supv.assist.text}</div>
              <ul className="cx-why">
                {r.supv.reasons.map((x, i) => (
                  <li key={i} className={x.lv === r.supv.lv ? "cx-hit" : ""}>
                    <em>별표4 {x.ref}</em> {x.why} → {S_SHORT[x.lv]}
                    {x.assist ? " + 보조" : ""}
                  </li>
                ))}
              </ul>
              <div className="cx-ref">시행령 제11조 [별표4] &lt;개정 2019.12.10.&gt;</div>
            </Card>
          )}

          <div className="cx-pnote">
            설치 목록 그대로 산정했습니다(물분무등 호스릴 방식·캐비닛형 간이스프링클러·소화수조 여부, 여러 동 현장 합계는 착공 계산기에서 조정).
            {seed.chk && seed.chk.length > 0 && <em> 확인 필요 설비 포함: {seed.chk.join(", ")}</em>}
          </div>
        </>
      )}

      {onOpen && (
        <button type="button" className="w-run sf-go no-print" onClick={onOpen}>
          착공 계산기에서 자세히 보기·조정 →
        </button>
      )}
    </div>
  );
}

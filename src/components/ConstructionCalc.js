import { construction, CX_FACS } from "../law/construction";

// ============================================================
// 보조 계산기 — 소방공사 착공·감리 판정
// 착공신고 대상 · 소방기술자 배치등급 · 공사감리 대상·종류 · 감리원 배치등급
// ============================================================

const GROUPS = [
  ["mech", "기계분야 (별표2 비고 가)"],
  ["elec", "전기분야 (별표2 비고 나)"],
  ["", "기타"],
];
const KINDS = [
  ["gen", "일반 특정소방대상물"],
  ["apt", "아파트"],
  ["ug", "지하구"],
];
const cls = (st) => (st === "대상" ? "sf-yes" : st === "확인 필요" ? "sf-chk" : "sf-no");

function Box({ title, badge, status, children }) {
  return (
    <div className={`cx-box ${cls(status)}`}>
      <div className="cx-box-h">
        <span className="sf-title">{title}</span>
        <span className={`sf-badge ${cls(status)}`}>{badge}</span>
      </div>
      <div className="cx-box-b">{children}</div>
    </div>
  );
}

export default function ConstructionCalc({ st, setSt, onGoNew }) {
  const v = { kind: "gen", hazmat: false, area: "", gf: "", bf: "", households: "", facs: {}, hoseReelOnly: false, cabinetOnly: false, ...st };
  const set = (patch) => setSt({ ...v, ...patch });
  const setFac = (k, on) => set({ facs: { ...v.facs, [k]: on } });
  const r = construction({ ...v, apt: v.kind === "apt", ugduct: v.kind === "ug" });
  const seed = v.seed;
  const F = ({ label, k, hint }) => (
    <label className="w-field">
      <span className="w-label">{label}</span>
      <input type="number" inputMode="decimal" value={v[k]} onChange={(e) => set({ [k]: e.target.value })} />
      {hint && <span className="w-hint">{hint}</span>}
    </label>
  );
  return (
    <div className="tl-body">
      <div className="tl-intro">
        공사 현장 규모와 신설하는 소방시설을 입력하면 소방시설공사업법 시행령에 따라 <b>착공신고 대상</b>, <b>소방기술자 배치 등급·분야</b>, <b>공사감리 대상과 종류(상주·일반)</b>, <b>책임·보조감리원 등급</b>을 산정합니다.
      </div>

      {seed ? (
        <div className="ir-link cx-seed">
          <span>
            <b>신축 건축물 산정 결과를 불러왔습니다</b> — {seed.useLabel}
            {seed.chk && seed.chk.length > 0 && <em> · 확인 필요 설비 포함: {seed.chk.join(", ")}</em>}
          </span>
          {onGoNew && (
            <button type="button" className="w-link" onClick={onGoNew}>
              신축 건축물로 돌아가기 →
            </button>
          )}
        </div>
      ) : (
        <div className="ir-link cx-seed">
          <span>신축 건축물 결과의 「소방공사 착공·감리 판정」에서 「자세히 보기·조정 →」을 누르면 용도·연면적·층수·설치 소방시설이 자동으로 채워집니다.</span>
          {onGoNew && (
            <button type="button" className="w-link" onClick={onGoNew}>
              신축 건축물 산정으로 이동 →
            </button>
          )}
        </div>
      )}

      <div className="cx-kind">
        {KINDS.map(([k, l]) => (
          <button key={k} type="button" className={v.kind === k ? "on" : ""} onClick={() => set({ kind: k })}>
            {l}
          </button>
        ))}
        <label className="cx-chk">
          <input type="checkbox" checked={!!v.hazmat} onChange={(e) => set({ hazmat: e.target.checked })} /> 위험물 제조소등
        </label>
      </div>

      <div className="w-grid2">
        {F({ label: v.kind === "ug" ? "연면적(㎡, 선택)" : "공사 현장 연면적 합계(㎡)", k: "area", hint: "여러 동이면 현장 전체 합계" })}
        {v.kind !== "ug" && F({ label: "지상 층수", k: "gf", hint: "여러 동이면 가장 높은 동" })}
        {v.kind !== "ug" && F({ label: "지하 층수", k: "bf" })}
        {v.kind === "apt" && F({ label: "세대수", k: "households", hint: "상주감리·전담배치 판단(500세대)" })}
      </div>

      <div className="cx-facs">
        {GROUPS.map(([g, gl]) => (
          <div key={g || "etc"} className="cx-grp">
            <div className="cx-grp-h">{gl}</div>
            <div className="cx-grp-b">
              {CX_FACS.filter((f) => f.field === g).map((f) => (
                <label key={f.key} className={`cx-chk ${v.facs[f.key] ? "on" : ""}`}>
                  <input type="checkbox" checked={!!v.facs[f.key]} onChange={(e) => setFac(f.key, e.target.checked)} /> {f.name}
                </label>
              ))}
            </div>
          </div>
        ))}
        {(v.facs.water || v.facs.sspk) && (
          <div className="cx-opt">
            {v.facs.water && (
              <label className="cx-chk">
                <input type="checkbox" checked={!!v.hoseReelOnly} onChange={(e) => set({ hoseReelOnly: e.target.checked })} /> 물분무등소화설비가 호스릴 방식뿐임
              </label>
            )}
            {v.facs.sspk && (
              <label className="cx-chk">
                <input type="checkbox" checked={!!v.cabinetOnly} onChange={(e) => set({ cabinetOnly: e.target.checked })} /> 간이스프링클러설비가 캐비닛형뿐임
              </label>
            )}
          </div>
        )}
      </div>

      {!r.ok ? (
        <div className="tl-result">
          <div className="w-err">{r.msg}</div>
        </div>
      ) : (
        <div className="cx-res">
          <div className="cx-sum">
            <div>
              <span>착공신고</span>
              <b>{r.report.status}</b>
            </div>
            <div>
              <span>소방기술자</span>
              <b>{r.tech.none ? "—" : r.tech.grade}</b>
              {!r.tech.none && <small>{r.tech.fields.join("·")}</small>}
            </div>
            <div>
              <span>공사감리</span>
              <b>{r.supv.status === "대상" ? r.supv.kind : "비대상"}</b>
            </div>
            <div>
              <span>책임감리원</span>
              <b>{r.supv.status === "대상" ? r.supv.chief.replace("(기계분야 및 전기분야)", "") : "—"}</b>
              {r.supv.status === "대상" && <small>보조감리원 {r.supv.assist.need}</small>}
            </div>
          </div>

          <Box title="착공신고" badge={r.report.status} status={r.report.status}>
            <div>{r.report.why}</div>
            {r.report.items.length > 0 && <div className="cx-tags">{r.report.items.map((x) => <span key={x}>{x}</span>)}</div>}
            <div className="cx-ref">소방시설공사업법 제13조, 시행령 제4조</div>
          </Box>

          <Box title="소방기술자 배치" badge={r.tech.none ? "분야 설비 없음" : `${r.tech.grade}`} status={r.tech.none ? "비대상" : "대상"}>
            {r.tech.none ? (
              <div>선택한 설비 중 별표2 비고 가(기계분야)·나(전기분야)에 해당하는 공사가 없습니다.</div>
            ) : (
              <>
                <div className="cx-line">
                  <b>{r.tech.grade}</b>의 소방기술자 — <b>{r.tech.fields.join(" 및 ")}</b>
                </div>
                <ul className="cx-why">
                  {r.tech.reasons.map((x, i) => (
                    <li key={i} className={x.lv === r.tech.lv ? "cx-hit" : ""}>
                      <em>별표2 {x.ref}</em> {x.why} → {["자격수첩", "초급 이상", "중급 이상", "고급 이상", "특급"][x.lv]}
                    </li>
                  ))}
                </ul>
                <div className="cx-line">현장 배치: {r.tech.site}</div>
              </>
            )}
            <div className="cx-ref">소방시설공사업법 시행령 제3조 [별표2] &lt;개정 2025.1.21.&gt;</div>
          </Box>

          <Box title="공사감리" badge={r.supv.status === "대상" ? r.supv.kind : "비대상"} status={r.supv.status}>
            {r.supv.status !== "대상" ? (
              <div>{r.supv.why} — 공사감리자 지정 대상 아님(영 제10조제2항).</div>
            ) : (
              <>
                <div className="cx-line">
                  지정 대상 시공: {r.supv.items.map((it) => `${it.text}(${it.no})`).join(", ")}
                </div>
                <div className="cx-line">
                  감리 종류: <b>{r.supv.kind}</b> — {r.supv.kindWhy}
                </div>
                <div className="cx-line cx-muted">감리 방법: {r.supv.method}</div>
                <table className="cx-tbl">
                  <tbody>
                    <tr>
                      <th>책임감리원</th>
                      <td>{r.supv.chief}</td>
                    </tr>
                    <tr>
                      <th>보조감리원</th>
                      <td>
                        <b>{r.supv.assist.need}</b> — {r.supv.assist.text}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <ul className="cx-why">
                  {r.supv.reasons.map((x, i) => (
                    <li key={i} className={x.lv === r.supv.lv ? "cx-hit" : ""}>
                      <em>별표4 {x.ref}</em> {x.why} → {["", "초급 이상", "중급 이상", "고급 이상", "특급 이상", "특급(소방기술사)"][x.lv]}
                      {x.assist ? " + 보조" : ""}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="cx-ref">소방시설공사업법 제17조, 시행령 제9조 [별표3] &lt;개정 2026.3.17.&gt;·제10조·제11조 [별표4] &lt;개정 2019.12.10.&gt;</div>
          </Box>

          <ul className="cx-notes">
            {r.notes.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="tl-actions">
        <button type="button" className="w-reset" onClick={() => setSt({})}>
          초기화
        </button>
      </div>

      <details className="tl-ref">
        <summary>산정 기준 요약</summary>
        <ul>
          <li>소방기술자(별표2): 특급 — 20만㎡ 이상 또는 지하 포함 40층 이상 / 고급 이상 — 3만~20만㎡(아파트 제외) 또는 16~40층 미만 / 중급 이상 — 물분무등(호스릴 제외)·제연설비, 5천~3만㎡(아파트 제외), 아파트 1만~20만㎡ / 초급 이상 — 1천~5천㎡(아파트 제외), 아파트 1천~1만㎡, 지하구 / 자격수첩 — 1천㎡ 미만</li>
          <li>감리 종류(별표3): 상주 — 연면적 3만㎡ 이상(아파트 제외) 또는 지하 포함 16층 이상으로서 500세대 이상 아파트 / 일반 — 그 밖의 공사(주 1회 이상 현장 배치)</li>
          <li>감리원(별표4): 특급 중 소방기술사+보조 — 20만㎡ 이상 또는 40층 이상 / 특급 이상+보조 — 3만~20만㎡(아파트 제외) 또는 16~40층 미만 / 고급 이상+보조 — 물분무등(호스릴 제외)·제연설비, 아파트 3만~20만㎡ / 중급 이상 — 5천~3만㎡ / 초급 이상 — 5천㎡ 미만, 지하구</li>
          <li>보조감리원: 20만㎡ 초과분 10만㎡마다 1명 이상 추가(비고 다), 일반 공사감리는 배치하지 않을 수 있음(비고 라)</li>
          <li>공사감리자 지정(영 제10조②): 옥내소화전·스프링클러설비등(캐비닛형 간이SP 제외)·물분무등(호스릴 제외)·옥외소화전·자동화재탐지·화재알림·비상방송·통합감시·소화용수·제연·연결송수관·연결살수·비상콘센트·무선통신보조·연소방지설비 신설 — 비상경보설비만 신설하는 공사는 해당 없음</li>
          <li>착공신고(영 제4조제1호): 기계 — 옥내소화전(호스릴 포함)·스프링클러설비등·물분무등·옥외소화전·소화용수·제연·연결송수관·연결살수·연소방지 / 전기 — 비상경보·자동화재탐지·화재알림·비상방송·비상콘센트·무선통신보조. 위험물 제조소등·다중이용업소 공사 제외</li>
          <li>증설·개설·이전·정비 공사는 조문별 범위(구역 증설, 수신반·소화펌프·동력제어반 등)가 달라 이 계산기(신설 기준)로 판정하지 않습니다.</li>
        </ul>
      </details>
    </div>
  );
}

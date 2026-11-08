import { staffing, unitRule, scaleOf, SCALE_RULES, checkAssist, ST_CLASSES, guessClass } from "../law/staffing";
import { daysInclusive } from "../law/report";

// ============================================================
// 자체점검 보고서 — 점검인력 배치·점검일수 산정(시행규칙 별표4)
// 보고서 입력값(연면적·세대수·설치 시설·점검인력)을 기본값으로 쓰고, 바꾼 값만 rep.staff에 저장
// ============================================================

const W_ROWS = ["w_spray", "w_mist", "w_foam", "w_co2", "w_halon", "w_clean", "w_powder", "w_liquid", "w_aerosol"];

export default function StaffingCalc({ rep, setRep, comp }) {
  const on = (id) => !!(rep.rows[id] && rep.rows[id].on);
  const s = rep.staff || {};
  const hhBld = Number(rep.bld.households) || 0;
  const def = {
    mode: hhBld > 0 && /아파트|공동주택/.test(rep.useLabel) ? "apt" : "bldg",
    cls: guessClass(rep.useLabel),
    area: rep.bld.area,
    hh: rep.bld.households,
    len: "",
    lanes: "3",
    oneSide: false,
    noSpk: !(on("spk") || on("esfr")),
    noWater: !W_ROWS.some(on),
    noSmoke: !(on("smoke") || on("smoke2")),
    big: false,
    extra: String(Math.max(0, rep.inspectors.length - 3)),
  };
  const v = { ...def, ...s };
  const set = (k, x) => setRep((r) => ({ ...r, staff: { ...(r.staff || {}), [k]: x } }));
  const rule = unitRule(rep.checker, true);
  const res = staffing({ ...v, comp, checker: rep.checker });
  const period = Number(daysInclusive(rep.from, rep.to)) || 0;
  const scale = rep.checker === "mgmt" ? scaleOf(rep.grade, v.big) : "";
  const sr = scale ? SCALE_RULES[scale] : null;
  const assist = scale ? checkAssist(scale, rep.inspectors.slice(1).map((p) => p.qual)) : null;
  const main = rep.inspectors[0] ? rep.inspectors[0].qual : "";
  const N = ({ label, k, hint }) => (
    <label className="w-field">
      <span className="w-label">{label}</span>
      <input type="number" inputMode="decimal" value={v[k]} onChange={(e) => set(k, e.target.value)} />
      {hint && <span className="w-hint">{hint}</span>}
    </label>
  );
  return (
    <div className="sf-calc">
      <div className="sf-rule">
        <b>점검인력 1단위</b> {rule.base} — {rule.extraNote} ({rule.ref})
      </div>
      {rep.checker === "mgmt" && (
        <div className="sf-rule">
          <label className="cx-chk">
            <input type="checkbox" checked={!!v.big} onChange={(e) => set("big", e.target.checked)} /> 50층 이상 또는 성능위주설계를 한 특정소방대상물
          </label>
          {sr ? (
            <>
              <div>
                <b>{sr.label}</b> ({sr.ref}) — 주된: {sr.main}
                {sr.mainAlt ? ` 또는 ${sr.mainAlt}` : ""} / 보조: {sr.assist}
              </div>
              {main && !["소방시설관리사", "특급점검자"].includes(main) && <div className="hz-need">주된 점검인력은 소방시설관리사 또는 특급점검자여야 합니다.</div>}
              {assist && <div className={assist.ok ? "sf-ok" : "hz-need"}>{assist.text}</div>}
              {scale !== "d" && <div className="w-hint">소방시설관리사의 경력 연수는 직접 확인하십시오.</div>}
            </>
          ) : (
            <div className="w-hint">「3. 소방안전관리」에서 소방안전관리등급을 고르면 규모별 배치기준(제2호)을 표시합니다.</div>
          )}
        </div>
      )}

      <div className="cx-kind">
        {[
          ["bldg", "건축물"],
          ["apt", "아파트등"],
          ["mixed", "아파트등 + 그 외 용도"],
          ["ug", "지하구"],
          ["tunnel", "터널"],
        ].map(([k, l]) => (
          <button key={k} type="button" className={v.mode === k ? "on" : ""} onClick={() => set("mode", k)}>
            {l}
          </button>
        ))}
      </div>
      <div className="w-grid3">
        {(v.mode === "bldg" || v.mode === "mixed") && N({ label: v.mode === "mixed" ? "아파트등 외 부분 연면적(㎡)" : "실제 점검면적(연면적, ㎡)", k: "area" })}
        {(v.mode === "ug" || v.mode === "tunnel") && N({ label: `${v.mode === "ug" ? "지하구" : "터널"} 길이(m)`, k: "len" })}
        {v.mode === "tunnel" && (
          <label className="w-field">
            <span className="w-label">차로 수</span>
            <select value={v.lanes} onChange={(e) => set("lanes", e.target.value)}>
              <option value="3">3차로 이하(폭 3.5m)</option>
              <option value="4">4차로 이상(폭 7m)</option>
            </select>
          </label>
        )}
        {(v.mode === "apt" || v.mode === "mixed") && N({ label: "실제 점검 세대수", k: "hh", hint: "공용·부대·복리시설 포함" })}
        {v.mode !== "apt" && (
          <label className="w-field">
            <span className="w-label">가감계수(제6호가목)</span>
            <select value={v.cls} onChange={(e) => set("cls", e.target.value)}>
              {Object.entries(ST_CLASSES).map(([k, c]) => (
                <option key={k} value={k}>
                  {k}류 × {c.coef.toFixed(1)} — {c.uses.slice(0, 28)}…
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="w-field">
          <span className="w-label">추가 보조 점검인력(명)</span>
          <select value={Math.min(Number(v.extra) || 0, rule.maxExtra)} onChange={(e) => set("extra", e.target.value)}>
            {Array.from({ length: rule.maxExtra + 1 }, (_, i) => (
              <option key={i} value={i}>
                {i}명{i === Math.max(0, rep.inspectors.length - 3) ? " (점검인력 입력 기준)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      {v.mode === "tunnel" && Number(v.lanes) >= 4 && (
        <label className="cx-chk">
          <input type="checkbox" checked={!!v.oneSide} onChange={(e) => set("oneSide", e.target.checked)} /> 한쪽 측벽에만 소방시설 설치(폭 3.5m)
        </label>
      )}
      <div className="cx-opt">
        <span className="w-label">미설치 감산(제6호나목·제7호다목)</span>
        <label className="cx-chk">
          <input type="checkbox" checked={!!v.noSpk} onChange={(e) => set("noSpk", e.target.checked)} /> 스프링클러설비 미설치
        </label>
        <label className="cx-chk">
          <input type="checkbox" checked={!!v.noWater} onChange={(e) => set("noWater", e.target.checked)} /> 물분무등소화설비(호스릴 제외) 미설치
        </label>
        <label className="cx-chk">
          <input type="checkbox" checked={!!v.noSmoke} onChange={(e) => set("noSmoke", e.target.checked)} /> 제연설비 미설치
        </label>
      </div>

      <div className={`tl-result ${res.ok && period && period < res.days ? "hz-total over" : ""}`}>
        {res.ok ? (
          <>
            <div className="tl-big">
              필요 점검일수 <b>{res.days}</b>일 <span className="tl-ratio">(점검인력 1단위 {res.staff}명 · {res.basis} = {res.ratio})</span>
            </div>
            <ol className="tl-steps">
              {res.steps.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
            <div className="hz-lv">
              {period
                ? period >= res.days
                  ? `보고서 점검기간 ${period}일 — 배치기준 충족`
                  : `보고서 점검기간 ${period}일 — 점검인력 1단위로는 ${res.days}일 이상 필요합니다(점검면적은 점검한도를 초과할 수 없음, 제6호·제7호다목).`
                : ""}
            </div>
          </>
        ) : (
          <div className="w-err">{res.msg}</div>
        )}
        {Object.keys(s).length > 0 && (
          <button type="button" className="w-link" onClick={() => setRep((r) => ({ ...r, staff: {} }))}>
            보고서 입력값으로 되돌리기
          </button>
        )}
      </div>
      <div className="w-hint">
        하루에 2개 이상 대상물을 점검하는 경우(점검한도 평균·거리 감산 — 제4호 단서·제6호다목·제7호다목2))와 종합·작동점검을 같은 날 하는 경우(제9호)는 반영하지 않습니다. 근거: 소방시설법 시행규칙 [별표4] &lt;개정 2024.11.29.&gt;
      </div>
    </div>
  );
}

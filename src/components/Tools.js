import { useEffect, useState } from "react";
import PumpCalc from "./PumpCalc";
import { windowlessFloor, occupancy, OCC_TYPES } from "../law/tools";

// ============================================================
// 보조 계산기 탭 — 무창층 판정 · 수용인원 산정 · 소화펌프 용량 산정
// ============================================================

const KEY = "hfls_tools_v1";
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null") || {};
  } catch (e) {
    return {};
  }
};
const save = (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch (e) {
    /* 저장 불가 환경 */
  }
};
const fmt = (x, d = 2) => (x === null || x === undefined ? "—" : Number(x).toLocaleString("ko-KR", { maximumFractionDigits: d }));
const row0 = () => ({ w: "", h: "", cnt: "1", excluded: false });
const floor0 = (level) => ({ level, area: "", doors: level === 1 ? [row0()] : [], windows: [row0()] });

function OpeningTable({ title, rows, onChange }) {
  const set = (i, k, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div className="tl-op">
      <div className="tl-op-h">
        <span>{title}</span>
        <button type="button" className="w-link" onClick={() => onChange([...rows, row0()])}>
          + 줄 추가
        </button>
      </div>
      <div className="tl-op-row tl-op-head">
        <span>가로(m)</span>
        <span>세로(m)</span>
        <span>개수</span>
        <span>면적(㎡)</span>
        <span title="창살·높이 1.2m 초과·도로/빈터 미접면·파괴 곤란 유리 등">제외</span>
        <span />
      </div>
      {rows.map((r, i) => (
        <div key={i} className={`tl-op-row ${r.counted === false && !r.empty ? "off" : ""}`}>
          <input type="number" inputMode="decimal" value={r.w} onChange={(e) => set(i, "w", e.target.value)} />
          <input type="number" inputMode="decimal" value={r.h} onChange={(e) => set(i, "h", e.target.value)} />
          <input type="number" inputMode="numeric" value={r.cnt} onChange={(e) => set(i, "cnt", e.target.value)} />
          <span className="tl-num" title={r.reason || ""}>
            {r.empty ? "—" : fmt(r.area)}
            {r.reason && !r.empty && r.reason !== "미입력" && <em>{r.reason}</em>}
          </span>
          <input type="checkbox" checked={!!r.excluded} onChange={(e) => set(i, "excluded", e.target.checked)} />
          <button type="button" className="tl-x" onClick={() => onChange(rows.filter((_, j) => j !== i))} title="삭제">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function Windowless({ st, setSt }) {
  const floors = st.floors && st.floors.length ? st.floors : [floor0(1)];
  const setFloors = (f) => setSt({ ...st, floors: f });
  const upd = (i, patch) => setFloors(floors.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const addFloor = () => setFloors([...floors, floor0((floors[floors.length - 1]?.level || 0) + 1)]);
  return (
    <div className="tl-body">
      <div className="tl-intro">
        지상층별로 바닥면적과 개구부(가로×세로×개수)를 입력하면 <b>개구부 면적 합계가 바닥면적의 1/30 이하</b>인지로 무창층 여부를 판정합니다. 문은 1층만, 2층부터는 창문만 입력합니다.
      </div>
      {floors.map((fl, i) => {
        const r = windowlessFloor(fl);
        return (
          <div key={i} className={`tl-floor ${r.status === "무창층" ? "wl" : r.status === "유창층" ? "ok" : ""}`}>
            <div className="tl-floor-h">
              <b>지상 {fl.level}층</b>
              <label className="tl-area">
                바닥면적(㎡)
                <input type="number" inputMode="decimal" value={fl.area} onChange={(e) => upd(i, { area: e.target.value })} />
              </label>
              <span className={`tl-badge ${r.status === "무창층" ? "wl" : r.status === "유창층" ? "ok" : ""}`}>{r.status}</span>
              {floors.length > 1 && (
                <button type="button" className="tl-x" title="층 삭제" onClick={() => setFloors(floors.filter((_, j) => j !== i))}>
                  ×
                </button>
              )}
            </div>
            {fl.level === 1 && <OpeningTable title="문(출입구)" rows={r.doors} onChange={(rows) => upd(i, { doors: rows.map(({ w, h, cnt, excluded }) => ({ w, h, cnt, excluded })) })} />}
            <OpeningTable title="창문" rows={r.windows} onChange={(rows) => upd(i, { windows: rows.map(({ w, h, cnt, excluded }) => ({ w, h, cnt, excluded })) })} />
            {r.limit !== null && (
              <div className="tl-calc">
                유효 개구부 합계 <b>{fmt(r.sum)}㎡</b> {r.status === "무창층" ? "≤" : ">"} 바닥면적 {fmt(r.area)}㎡ × 1/30 = <b>{fmt(r.limit)}㎡</b>
                <span className="tl-ratio">(개구부 비율 {fmt(r.ratio * 100, 2)}% · 기준 3.33%)</span>
                {r.status === "무창층" && <div className="tl-need">유창층이 되려면 개구부가 {fmt(r.need)}㎡를 넘게 더 필요합니다.</div>}
              </div>
            )}
          </div>
        );
      })}
      <div className="tl-actions">
        <button type="button" className="w-reset" onClick={addFloor}>
          + 층 추가
        </button>
        <button type="button" className="w-reset" onClick={() => setSt({ floors: [floor0(1)] })}>
          초기화
        </button>
      </div>
      <details className="tl-ref">
        <summary>개구부 인정 요건 · 업무처리 지침</summary>
        <ul>
          <li>
            <b>정의</b>: 지상층 중 아래 요건을 모두 갖춘 개구부 면적 합계가 해당 층 바닥면적(건축법 시행령 제119조제1항제3호)의 <b>1/30 이하</b>인 층 — 소방시설법 시행령 제2조제1호
          </li>
          <li>가. 지름 50cm 이상의 원이 내접할 수 있을 것 — 가로·세로 중 하나라도 0.5m 미만이면 자동 제외. 창틀은 빼고 문이 열리는 부분 또는 파괴 가능한 유리 부분 치수로 입력</li>
          <li>나. 바닥면에서 개구부 밑부분까지 1.2m 이내 — 지름 50cm 원이 내접하는 부분의 하단 기준</li>
          <li>다. 도로(일반도로 4m, 막다른 도로 2m — 건축법 제2조제11호·제44조제1항 준용) 또는 차량이 진입할 수 있는 빈터를 향할 것</li>
          <li>라. 창살 그 밖의 장애물이 없을 것</li>
          <li>
            마. 내부 또는 외부에서 쉽게 파괴·개방할 수 있을 것 — 일반유리 6mm 이하, 강화유리 5mm 이하, 복층유리(일반 6mm 이하+공기층+일반 6mm 이하 / 강화 5mm 이하+공기층+강화 5mm 이하), 그 밖에 소방서장이 인정하는 것
          </li>
          <li>프로젝트창: 하부창이 요건을 갖추고 상부창이 쉽게 파괴 가능한 유리로서 지름 50cm 원이 내접하면 상·하부 모두 인정</li>
          <li>요건(나~마)을 갖추지 못한 개구부는 「제외」에 체크하십시오.</li>
        </ul>
        <div className="det-ref">출처: 「무창층 기준해석에 대한 업무처리 지침」(사용자 제공 자료)</div>
      </details>
    </div>
  );
}

function Occupancy({ st, setSt }) {
  const v = { type: "etc", area: "", excl: "", staff: "", beds1: "", beds2: "", seatArea: "", fixedSeats: "", benchWidth: "", ...st };
  const set = (k, x) => setSt({ ...v, [k]: x });
  const r = occupancy(v);
  const t = OCC_TYPES.find((x) => x.id === v.type);
  const F = ({ label, k, hint }) => (
    <label className="w-field">
      <span className="w-label">{label}</span>
      <input type="number" inputMode="decimal" value={v[k]} onChange={(e) => set(k, e.target.value)} />
      {hint && <span className="w-hint">{hint}</span>}
    </label>
  );
  return (
    <div className="tl-body">
      <div className="tl-intro">용도에 맞는 산정 구분을 고르고 면적을 입력하면 소방시설법 시행령 [별표7]에 따라 수용인원을 계산합니다.</div>
      <label className="w-field">
        <span className="w-label">산정 구분(용도)</span>
        <select value={v.type} onChange={(e) => set("type", e.target.value)}>
          {OCC_TYPES.map((o) => (
            <option key={o.id} value={o.id}>
              {o.no} {o.label} — 예: {o.ex}
            </option>
          ))}
        </select>
      </label>
      <div className="w-grid2">
        {(t.id === "bed" || t.id === "nobed") && F({ label: "종사자 수(명)", k: "staff" })}
        {t.id === "bed" && F({ label: "1인용 침대(개)", k: "beds1" })}
        {t.id === "bed" && F({ label: "2인용 침대(개)", k: "beds2", hint: "2개로 산정" })}
        {t.id !== "bed" && F({ label: "해당 용도 바닥면적 합계(㎡)", k: "area" })}
        {t.id !== "bed" && F({ label: "제외 면적(㎡)", k: "excl", hint: "복도(준불연재료 이상, 바닥~천장 벽 구획)·계단·화장실" })}
        {t.id === "hall" && F({ label: "관람석(의자 설치) 부분 면적(㎡)", k: "seatArea", hint: "의자 수로 산정하는 부분 — 면적 산정에서 제외" })}
        {t.id === "hall" && F({ label: "고정식 의자(석)", k: "fixedSeats" })}
        {t.id === "hall" && F({ label: "긴 의자 정면너비 합계(m)", k: "benchWidth", hint: "÷ 0.45m" })}
      </div>
      <div className="tl-result">
        {r.ok ? (
          <>
            <div className="tl-big">
              수용인원 <b>{r.result.toLocaleString("ko-KR")}</b>명
            </div>
            <ol className="tl-steps">
              {r.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
              <li>소수점 이하 반올림 → {r.result.toLocaleString("ko-KR")}명</li>
            </ol>
          </>
        ) : (
          <div className="w-err">{r.msg}</div>
        )}
      </div>
      <div className="tl-actions">
        <button type="button" className="w-reset" onClick={() => setSt({ type: v.type })}>
          초기화
        </button>
      </div>
      <details className="tl-ref">
        <summary>산정 기준 — 소방시설법 시행령 제17조 [별표7]</summary>
        <ul>
          <li>제1호가목 침대가 있는 숙박시설: 종사자 수 + 침대 수(2인용 침대는 2개)</li>
          <li>제1호나목 침대가 없는 숙박시설: 종사자 수 + 숙박시설 바닥면적 합계 ÷ 3㎡</li>
          <li>제2호가목 강의실·교무실·상담실·실습실·휴게실: 바닥면적 합계 ÷ 1.9㎡</li>
          <li>제2호나목 강당, 문화 및 집회시설, 운동시설, 종교시설: 바닥면적 합계 ÷ 4.6㎡ (관람석의 고정식 의자 부분은 의자 수, 긴 의자는 정면너비 ÷ 0.45m)</li>
          <li>제2호다목 그 밖의 특정소방대상물: 바닥면적 합계 ÷ 3㎡</li>
          <li>비고1: 복도(「건축법 시행령」 제2조제11호 준불연재료 이상으로 바닥에서 천장까지 벽으로 구획한 것)·계단·화장실 바닥면적 제외 / 비고2: 소수점 이하 반올림</li>
          <li>고정식 의자 관람석이 있으면 (바닥면적 − 의자 설치 부분) ÷ 4.6㎡ + 고정식 의자 수로 합산 — 법제처 법령해석(별표7 제2호나목, 운동시설 관람석)</li>
        </ul>
      </details>
    </div>
  );
}

function Pump() {
  const [k, setK] = useState(0); // 초기화: 계산기를 새로 그려 모든 입력값을 처음 상태로
  return (
    <div className="tl-body tl-pump">
      <div className="tl-intro tl-intro-row">
        <span>스프링클러설비 펌프 양정(H = H₁ + H₂ + 10m)·토출량·전동기 출력·수원 용량 계산 — NFPC·NFTC 103 기준(제작: 안동소방서 이제현).</span>
        <button type="button" className="w-reset" onClick={() => setK((x) => x + 1)}>
          초기화
        </button>
      </div>
      <PumpCalc key={k} />
    </div>
  );
}

const SUBS = [
  ["windowless", "무창층 판정"],
  ["occ", "수용인원 산정"],
  ["pump", "소화펌프 용량 산정"],
];

export default function Tools() {
  const [all, setAll] = useState(load);
  const [sub, setSub] = useState(all.sub || "windowless");
  useEffect(() => save({ ...all, sub }), [all, sub]);
  const part = (k) => [all[k] || {}, (v) => setAll((p) => ({ ...p, [k]: v }))];
  const [pumpSeen, setPumpSeen] = useState(sub === "pump");
  useEffect(() => {
    if (sub === "pump") setPumpSeen(true);
  }, [sub]);
  const [wl, setWl] = part("windowless");
  const [oc, setOc] = part("occ");
  return (
    <div className="tools">
      <nav className="tl-tabs">
        {SUBS.map(([k, l]) => (
          <button key={k} type="button" className={sub === k ? "on" : ""} onClick={() => setSub(k)}>
            {l}
          </button>
        ))}
      </nav>
      {sub === "windowless" && <Windowless st={wl} setSt={setWl} />}
      {sub === "occ" && <Occupancy st={oc} setSt={setOc} />}
      {/* 펌프 계산기는 한 번 연 뒤에는 다른 계산기로 바꿔도 입력값 유지 */}
      {pumpSeen && (
        <div style={{ display: sub === "pump" ? "block" : "none" }}>
          <Pump />
        </div>
      )}
    </div>
  );
}

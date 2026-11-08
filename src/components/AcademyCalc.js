import { useState } from "react";
import { AC_KINDS, academyOcc, judgeAll } from "../law/academy";

// ============================================================
// 보조 계산기 — 학원 다중이용업소 판단
// 층별로 업소(학원·다중이용업소·기숙사·기타)와 면적, 층간·영업장별 방화구획을 입력 → 학원마다 판정
// ============================================================

let seq = 0;
const uid = () => `${Date.now().toString(36)}${seq++}`;
export const newUnit = (patch = {}) => ({ id: uid(), kind: "academy", name: "", area: "", excl: "", sep: false, ...patch });
export const newFloor = (name = "") => ({ id: uid(), name, fireFloor: false, units: [newUnit()] });
const DEF = () => ({ floors: [{ id: "f0", name: "1층", fireFloor: false, units: [{ id: "u0", kind: "academy", name: "", area: "", excl: "", sep: false }] }] });

export default function AcademyCalc({ st, setSt }) {
  const v = st && st.floors && st.floors.length ? st : DEF();
  const floors = v.floors;
  const setFloors = (fs) => setSt({ ...v, floors: fs });
  const updF = (fi, p) => setFloors(floors.map((f, i) => (i === fi ? { ...f, ...p } : f)));
  const updU = (fi, ui, p) => updF(fi, { units: floors[fi].units.map((u, j) => (j === ui ? { ...u, ...p } : u)) });
  const res = judgeAll(floors);
  const [open, setOpen] = useState({});
  const allFire = floors.every((f) => f.fireFloor);
  return (
    <div className="tl-body">
      <div className="tl-intro">
        건축물의 층별 업소와 면적, <b>층간 방화구획</b>·<b>영업장별 방화구획</b> 여부를 입력하면 학원마다 다중이용업소 해당 여부를 판단합니다(다중이용업소법 시행령 제2조제3호). 학원 수용인원은 소방시설법 시행령 별표7(바닥면적 ÷ 1.9㎡, 복도·계단·화장실 제외)로 산정합니다.
      </div>

      <div className="ac-bar">
        <label className="cx-chk">
          <input type="checkbox" checked={allFire} onChange={(e) => setFloors(floors.map((f) => ({ ...f, fireFloor: e.target.checked })))} /> 모든 층 층간 방화구획
        </label>
        <button type="button" className="w-reset" onClick={() => setFloors([newFloor(`${floors.length + 1}층`), ...floors])}>
          + 층 추가(위)
        </button>
        <button type="button" className="w-reset" onClick={() => setSt(DEF())}>
          초기화
        </button>
      </div>

      {floors.map((f, fi) => (
        <div key={f.id} className={`ac-floor ${f.fireFloor ? "fire" : ""}`}>
          <div className="ac-floor-h">
            <input className="ac-fname" value={f.name} placeholder="층(예: 3층)" onChange={(e) => updF(fi, { name: e.target.value })} />
            <label className="cx-chk">
              <input type="checkbox" checked={!!f.fireFloor} onChange={(e) => updF(fi, { fireFloor: e.target.checked })} /> 층간 방화구획
            </label>
            <button type="button" className="w-link" onClick={() => updF(fi, { units: [...f.units, newUnit()] })}>
              + 업소 추가
            </button>
            {floors.length > 1 && (
              <button type="button" className="tl-x" title="층 삭제" onClick={() => setFloors(floors.filter((_, i) => i !== fi))}>
                ×
              </button>
            )}
          </div>
          <div className="ac-units">
            {f.units.map((u, ui) => {
              const o = u.kind === "academy" ? academyOcc(u) : null;
              return (
                <div key={u.id} className={`ac-unit k-${u.kind}`}>
                  <select value={u.kind} onChange={(e) => updU(fi, ui, { kind: e.target.value })}>
                    {AC_KINDS.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                  <input value={u.name} placeholder="명칭(예: A학원)" onChange={(e) => updU(fi, ui, { name: e.target.value })} />
                  <input type="number" inputMode="decimal" value={u.area} placeholder={u.kind === "academy" ? "학원 바닥면적㎡" : "면적㎡(선택)"} onChange={(e) => updU(fi, ui, { area: e.target.value })} />
                  {u.kind === "academy" ? (
                    <input type="number" inputMode="decimal" value={u.excl} placeholder="제외㎡(복도·계단·화장실)" onChange={(e) => updU(fi, ui, { excl: e.target.value })} />
                  ) : (
                    <span />
                  )}
                  <label className="cx-chk" title="이 업소의 경계가 방화구획(방화문·방화셔터 포함)으로 나뉘어 있음">
                    <input type="checkbox" checked={!!u.sep} onChange={(e) => updU(fi, ui, { sep: e.target.checked })} /> 영업장 방화구획
                  </label>
                  <span className="ac-occ">{o ? (o.ok && u.area !== "" ? `${o.result}명` : "—") : ""}</span>
                  <button type="button" className="tl-x" title="삭제" onClick={() => updF(fi, { units: f.units.filter((_, j) => j !== ui) })}>
                    ×
                  </button>
                </div>
              );
            })}
            {f.units.length === 0 && <div className="w-hint">업소가 없습니다.</div>}
          </div>
        </div>
      ))}

      <div className="tl-result">
        {res.length === 0 ? (
          <div className="w-err">학원을 1곳 이상 입력하세요.</div>
        ) : (
          <table className="ac-res">
            <thead>
              <tr>
                <th>학원</th>
                <th>층</th>
                <th>수용인원</th>
                <th>판정</th>
                <th>근거</th>
              </tr>
            </thead>
            <tbody>
              {res.map((r) => {
                const k = `${r.fi}-${r.ui}`;
                return [
                  <tr key={k} className={r.status === "대상" ? "on" : ""} onClick={() => setOpen((o) => ({ ...o, [k]: !o[k] }))}>
                    <td>{r.name}</td>
                    <td>{r.floor}</td>
                    <td>{r.ok ? `${r.n}명` : "—"}</td>
                    <td>
                      <b>{r.ok ? (r.status === "대상" ? "다중이용업소" : "해당 없음") : r.msg}</b>
                    </td>
                    <td>
                      {r.basis || ""} {open[k] ? "▾" : "▸"}
                    </td>
                  </tr>,
                  open[k] && r.ok ? (
                    <tr key={`${k}d`} className="ac-det">
                      <td colSpan={5}>
                        <div>{r.text}</div>
                        <ol className="tl-steps">
                          {r.steps.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ol>
                        {r.notes.map((n) => (
                          <div key={n} className="w-hint">
                            {n}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        )}
      </div>

      <details className="tl-ref">
        <summary>판단 기준 — 다중이용업소법 시행령 제2조제3호</summary>
        <ul>
          <li>가. 수용인원 300명 이상(학원 바닥면적 약 570㎡ 이상) — 방화구획과 관계없이 해당</li>
          <li>
            나. 수용인원 100명 이상 300명 미만(약 190㎡ 이상 570㎡ 미만)으로서 (1) 하나의 건축물에 학원과 기숙사가 함께 있는 학원 (2) 하나의 건축물에 학원이 둘 이상 있는 경우로서 학원의 수용인원이 300명 이상인 학원 (3) 하나의 건축물에 다른 다중이용업(제1·2호, 제4~7호, 제7호의2~7의5, 제8호)과 학원이 함께 있는 경우
          </li>
          <li>나목 단서: 학원으로 사용하는 부분과 다른 용도로 사용하는 부분(운영권자가 다른 학원 포함)이 「건축법 시행령」 제46조 방화구획으로 나누어진 경우 제외</li>
          <li>방화구획 적용(업무연찬 예시): 층별 방화구획이면 그 층의 업소만, 영업장별 방화구획이면 그 영업장만 함께 봄. (2)는 함께 보는 학원 면적을 합산해 ÷ 1.9㎡로 산정</li>
          <li>「다중이용업소(학원 외)」는 휴게·일반음식점(100㎡, 지하 66㎡ 이상 등), 단란·유흥주점, 영화상영관, 목욕장업, 게임제공업, 노래연습장, 산후조리업, 고시원업 등 그 자체로 다중이용업소에 해당하는 영업만 고르십시오.</li>
          <li>수용인원 100명 미만 또는 해당 없는 학원: 교육지원청이 관할 소방서에 소방안전점검 의뢰 또는 교육지원청 자체점검(업무연찬)</li>
        </ul>
        <div className="det-ref">근거: 다중이용업소의 안전관리에 관한 특별법 시행령 제2조제3호(대통령령 제36432호, 2026.7.1. 시행), 소방시설법 시행령 별표7, 「학원 소방시설 적합여부 관련 업무연찬」(사용자 제공)</div>
      </details>
    </div>
  );
}

import { useLayoutEffect, useRef, useState } from "react";
import { headLabel, headLine, titleOf } from "../law/wm";

// ============================================================
// 위험물 일반점검표 A4 출력 — 세부기준 [별지 제9호~제24호서식] 형식
// 행 높이를 실제로 재서 쪽을 나눔(점검항목이 쪽 경계에서 잘리지 않게)
// ============================================================

const MM = 3.7795;
const PAGE_H = (297 - 12 - 10) * MM; // 여백 제외 본문 높이(px)
const v = (x) => x || "";

function Head({ f, st, hz }) {
  const h = st.hdr || {};
  const period = h.from ? (h.to && h.to !== h.from ? `${h.from} ~ ${h.to}` : h.from) : "";
  const permit = [h.permitDate, h.permitNo].filter(Boolean).join(" / ");
  return (
    <>
      <table className="rp-t wm-head">
        <colgroup>
          <col style={{ width: "48%" }} />
          <col />
        </colgroup>
        <tbody>
          <tr>
            <td className="wm-title" rowSpan={3}>
              {titleOf(f, st)}
            </td>
            <td>점검기간 : {period}</td>
          </tr>
          <tr>
            <td>
              점검자 : {v(h.checker)} <span className="wm-sign">(서명 또는 인)</span>
            </td>
          </tr>
          <tr>
            <td>
              설치자 : {v(h.owner)} <span className="wm-sign">(서명 또는 인)</span>
            </td>
          </tr>
        </tbody>
      </table>
      {f.kind === "facility" ? (
        <table className="rp-t wm-info">
          <colgroup>
            <col style={{ width: "17%" }} />
            <col style={{ width: "33%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "33%" }} />
          </colgroup>
          <tbody>
            <tr>
              <th>{headLabel(f)}</th>
              <td>{f.extra ? v(h.extra) : headLine(f, st)}</td>
              <th>설치허가 연월일 및 완공검사번호</th>
              <td>{permit}</td>
            </tr>
            <tr>
              <th>설치자</th>
              <td>{v(h.owner)}</td>
              <th>{f.form === "13" ? "위험물운송자" : "안전관리자"}</th>
              <td>{v(h.manager)}</td>
            </tr>
            <tr>
              <th>사업소명</th>
              <td>{v(h.biz)}</td>
              <th>{f.form === "13" ? "상치장소" : "설치위치"}</th>
              <td>{v(h.loc)}</td>
            </tr>
            <tr>
              <th>위험물 현황</th>
              <td colSpan={3} className="wm-hz">
                <span>
                  <b>품명</b> {hz.names || ""}
                </span>
                <span>
                  <b>허가량</b> {hz.amounts || ""}
                </span>
                <span>
                  <b>지정수량의 배수</b> {hz.ratio || ""}
                </span>
              </td>
            </tr>
            <tr>
              <th>위험물 저장·취급 개요</th>
              <td colSpan={3}>{v(h.summary)}</td>
            </tr>
            <tr>
              <th>시설명/호칭번호</th>
              <td colSpan={3}>{v(h.facName)}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <table className="rp-t wm-info">
          <colgroup>
            <col style={{ width: "17%" }} />
            <col style={{ width: "33%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "33%" }} />
          </colgroup>
          <tbody>
            {(f.form === "18" || f.form === "19") && (
              <tr>
                <th>구분</th>
                <td colSpan={3}>{headLine(f, st)}</td>
              </tr>
            )}
            <tr>
              <th>제조소등의 구분</th>
              <td>{v(h.facKind)}</td>
              <th>제조소등의 설치허가 연월일 및 완공검사번호</th>
              <td>{permit}</td>
            </tr>
            <tr>
              <th>{f.form === "24" ? "탐지설비의 호칭번호" : "소화설비의 호칭번호"}</th>
              <td colSpan={3}>{v(h.facName)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </>
  );
}

const COLS = (
  <colgroup>
    <col style={{ width: "8%" }} />
    <col style={{ width: "14%" }} />
    <col style={{ width: "28%" }} />
    <col style={{ width: "11%" }} />
    <col style={{ width: "25%" }} />
    <col />
  </colgroup>
);
const THEAD = (
  <thead>
    <tr>
      <th colSpan={2}>점검항목</th>
      <th>점검내용</th>
      <th>점검방법</th>
      <th>점검결과</th>
      <th>비고</th>
    </tr>
  </thead>
);
const Res = ({ r }) => {
  const C = (k) => (r === k ? "[√]" : "[  ]");
  return (
    <span className="wm-r">
      {C("적합")}적합 {C("부적합")}부적합 {C("해당없음")}해당없음
    </span>
  );
};

/** rows: [{i,g,s,c,m}] 한 쪽 분량 */
function Body({ rows, res, note }) {
  const out = [];
  for (let k = 0; k < rows.length; k++) {
    const r = rows[k];
    const prev = rows[k - 1];
    const startG = !prev || prev.g !== r.g || !prev.s !== !r.s;
    let spanG = 1;
    if (startG) while (k + spanG < rows.length && rows[k + spanG].g === r.g && !rows[k + spanG].s === !r.s) spanG++;
    const startS = r.s && (!prev || prev.g !== r.g || prev.s !== r.s);
    let spanS = 1;
    if (startS) while (k + spanS < rows.length && rows[k + spanS].g === r.g && rows[k + spanS].s === r.s) spanS++;
    const rr = res[r.i];
    const nt = note[r.i] || "";
    out.push(
      <tr key={r.i}>
        {startG && (
          <td className="wm-g" rowSpan={spanG} colSpan={r.s ? 1 : 2}>
            {r.g}
          </td>
        )}
        {r.s && startS && (
          <td className="wm-s" rowSpan={spanS}>
            {r.s.split(" > ").join(" · ")}
          </td>
        )}
        <td>{r.c}</td>
        <td className="wm-m">{r.m}</td>
        <td className="wm-rc">
          <Res r={rr} />
        </td>
        <td className="wm-n">{rr === "점검곤란" ? `점검곤란${nt ? `: ${nt}` : ""}` : nt}</td>
      </tr>,
    );
  }
  return <tbody>{out}</tbody>;
}

export default function WmDoc({ f, st, rows, res, hz }) {
  const note = st.note || {};
  const all = rows.map((r, i) => ({ i, g: r[0], s: r[1], c: r[2], m: r[3] }));
  const headRef = useRef(null);
  const theadRef = useRef(null);
  const rowRef = useRef({});
  const [pages, setPages] = useState([all.map((x) => x.i)]);
  const sig = JSON.stringify([f.id, st.hdr, st.opts, res, note, st.etc, hz]);
  useLayoutEffect(() => {
    const hh = headRef.current ? headRef.current.offsetHeight : 0;
    const th = theadRef.current ? theadRef.current.offsetHeight : 20;
    const top = 18; // 쪽 표시 줄
    const ps = [];
    let cur = [];
    let left = PAGE_H - top - hh - th - 6;
    for (const r of all) {
      const el = rowRef.current[r.i];
      const h = el ? el.offsetHeight : 18;
      if (cur.length && h > left) {
        ps.push(cur);
        cur = [];
        left = PAGE_H - top - th - 6;
      }
      cur.push(r.i);
      left -= h;
    }
    if (cur.length) ps.push(cur);
    if (left < 46) ps.push([]); // 기타사항 칸 자리
    setPages(ps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  const n = pages.length;
  return (
    <>
      {/* 측정용(화면 밖) */}
      <div className="wm-measure rp-doc" aria-hidden="true">
        <div className="rp-page">
          <div ref={headRef}>
            <Head f={f} st={st} hz={hz} />
          </div>
          <table className="rp-t wm-t">
            {COLS}
            <thead ref={theadRef}>
              <tr>
                <th colSpan={2}>점검항목</th>
                <th>점검내용</th>
                <th>점검방법</th>
                <th>점검결과</th>
                <th>비고</th>
              </tr>
            </thead>
            {/* 측정은 행마다 독립(병합 없이) */}
            <tbody>
              {all.map((r) => (
                <tr key={r.i} ref={(el) => (rowRef.current[r.i] = el)}>
                  <td className="wm-g"></td>
                  <td className="wm-s">{(r.s || "").split(" > ").join(" · ")}</td>
                  <td>{r.c}</td>
                  <td className="wm-m">{r.m}</td>
                  <td className="wm-rc">
                    <Res r={res[r.i]} />
                  </td>
                  <td className="wm-n">{note[r.i] || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rp-doc" id="rp-doc">
        {pages.map((ids, pi) => (
          <div className="rp-page wm-page" key={pi}>
            <div className="rp-top">
              <span>■ 위험물안전관리에 관한 세부기준 [별지 제{f.form}호서식]</span>
              <span>
                ({n}쪽 중 {pi + 1}쪽)
              </span>
            </div>
            {pi === 0 && <Head f={f} st={st} hz={hz} />}
            {ids.length > 0 && (
              <table className="rp-t wm-t">
                {COLS}
                {THEAD}
                <Body rows={ids.filter((i) => all[i]).map((i) => all[i])} res={res} note={note} />
              </table>
            )}
            {pi === n - 1 && (
              <table className="rp-t wm-t">
                <tbody>
                  <tr>
                    <th style={{ width: "22%" }}>기타사항</th>
                    <td className="wm-etc">{v(st.etc)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

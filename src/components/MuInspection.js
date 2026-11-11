import { useEffect, useRef, useState } from "react";
import { MU_TYPES, MU_ITEMS, MU_NUM, MU_RESULTS, MU_QUALS, muType, muResults, emptyMu, quarterOf } from "../law/mu";
import FileBar from "./FileBar";

// ============================================================
// 다중이용업 세부점검 탭 — 다중이용업소법 시행규칙 [별지 제10호서식] 안전시설등 세부점검표
// 입력값은 이 브라우저에만 저장
// ============================================================

const KEY = "hfls_mu_v1";
const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    return v && v.v === 1 ? { ...emptyMu(), ...v, hdr: { ...emptyMu().hdr, ...(v.hdr || {}) } } : emptyMu();
  } catch (e) {
    return emptyMu();
  }
};
const today = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const dot = (d) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || "");
  return m ? `${m[1]}.  ${Number(m[2])}.  ${Number(m[3])}.` : "     .     .     .";
};

/** A4 서식 */
export function MuDoc({ st }) {
  const h = st.hdr || {};
  const res = muResults(st);
  const t = muType(st.type);
  return (
    <div className="rp-doc" id="rp-doc">
      <div className="rp-page mu-page">
        <div className="rp-top">
          <span>■ 다중이용업소의 안전관리에 관한 특별법 시행규칙 [별지 제10호서식] &lt;개정 2023. 8. 1.&gt;</span>
        </div>
        <div className="mu-title">안전시설등 세부점검표</div>
        <div className="mu-h">1. 점검대상</div>
        <table className="rp-t mu-head">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "27%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "24%" }} />
          </colgroup>
          <tbody>
            <tr>
              <th>대 상 명</th>
              <td colSpan={3}>{h.name}</td>
              <th>전화번호</th>
              <td>{h.tel}</td>
            </tr>
            <tr>
              <th>소 재 지</th>
              <td colSpan={3}>{h.addr}</td>
              <th>주 용 도</th>
              <td>{h.use || (t ? t.name : "")}</td>
            </tr>
            <tr>
              <th>건물구조</th>
              <td>{h.structure}</td>
              <th>대표자</th>
              <td>{h.ceo}</td>
              <th>소방안전관리자</th>
              <td>{h.manager}</td>
            </tr>
          </tbody>
        </table>
        <div className="mu-h">2. 점검사항</div>
        <table className="rp-t mu-t">
          <colgroup>
            <col style={{ width: "50%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "32%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>점검사항</th>
              <th>점검결과</th>
              <th>조치사항</th>
            </tr>
          </thead>
          <tbody>
            {MU_ITEMS.map(([title, subs], i) => (
              <tr key={i}>
                <td className="mu-item">
                  <b>
                    {MU_NUM[i]} {title}
                  </b>
                  {subs.map((s, j) => (
                    <div key={j} className="mu-sub">
                      - {s}
                    </div>
                  ))}
                </td>
                <td className="mu-res">{res[i]}</td>
                <td className="mu-act">{(st.act || {})[i] || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mu-foot">
          <span>점검일자 : {dot(h.date)}</span>
          <span>
            점검자 : <span className="mu-checker">{h.checker}</span> <span className="mu-sign">(서명 또는 인)</span>
          </span>
        </div>
        <div className="rp-paper">210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]</div>
      </div>
    </div>
  );
}

async function exportPdf(fname) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const src = document.getElementById("rp-doc");
  const host = document.createElement("div");
  host.className = "rp-export";
  host.appendChild(src.cloneNode(true));
  document.body.appendChild(host);
  try {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const p = host.querySelector(".rp-page");
    const canvas = await html2canvas(p, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
    const h = Math.min(297, (canvas.height * 210) / canvas.width);
    doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, h);
    doc.save(fname.replace(/[\\/:*?"<>|\s]+/g, "_"));
  } finally {
    document.body.removeChild(host);
  }
}

function Preview({ children }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const fit = () => {
      const w = wrapRef.current ? wrapRef.current.clientWidth - 16 : 600;
      setScale(Math.min(1, Math.max(0.35, w / 794)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div className="ir-preview" ref={wrapRef}>
      <div className="ir-pv-h no-print">미리보기</div>
      <div className="ir-pv-scale" style={{ "--s": scale }}>
        {children}
      </div>
    </div>
  );
}

export default function MuInspection() {
  const [st, setSt] = useState(load);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch (e) {
      /* 저장 불가 환경 무시 */
    }
  }, [st]);
  const h = st.hdr;
  const setH = (k, v) => setSt((s) => ({ ...s, hdr: { ...s.hdr, [k]: v } }));
  const res = muResults(st);
  const t = muType(st.type);
  const counts = MU_RESULTS.map((r) => res.filter((x) => x === r).length);
  const left = res.filter((x) => !x).length;
  // 같은 버튼을 다시 누르면 선택 취소
  const setRes = (i, v) =>
    setSt((s) => {
      const r = { ...(s.res || {}) };
      if (r[i] === v) delete r[i];
      else r[i] = v;
      return { ...s, res: r };
    });
  const setAct = (i, v) => setSt((s) => ({ ...s, act: { ...(s.act || {}), [i]: v } }));

  const I = (label, k, type = "text", ph, wide) => (
    <label className={`w-field ${wide ? "wide" : ""}`}>
      <span className="w-label">{label}</span>
      <input type={type} value={h[k] || ""} placeholder={ph || ""} onChange={(e) => setH(k, e.target.value)} />
    </label>
  );

  const pdf = async () => {
    setBusy(true);
    try {
      await exportPdf(`안전시설등세부점검표_${(h.name || "").trim() || "업소"}_${h.date || ""}.pdf`);
    } catch (e) {
      alert("PDF를 만들지 못했습니다. 「인쇄」에서 PDF로 저장을 이용하십시오.");
    }
    setBusy(false);
  };
  const print = () => {
    document.body.classList.add("printing-report");
    const done = () => {
      document.body.classList.remove("printing-report");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(done, 1500);
  };
  const saveFile = () => {
    const blob = new Blob([JSON.stringify({ type: "hfls-mu", v: 1, savedAt: today(), data: st }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `안전시설등세부점검표_입력내용_${(h.name || "업소").replace(/[\\/:*?"<>|\s]+/g, "_")}_${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return "입력 내용을 파일로 저장했습니다. 다음 분기에 불러오면 점검일자·결과만 고치면 됩니다.";
  };
  const blankBook = async () => {
    const [{ muBook }, { downloadBytes }] = await Promise.all([import("../lib/sheets/mu"), import("../lib/xlsx")]);
    downloadBytes(muBook(), "안전시설등세부점검표_입력서식.xlsx");
    return "빈 서식(엑셀)을 받았습니다. 노란 칸을 채운 뒤 「불러오기」로 올리십시오.";
  };
  const loadFile = async (file) => {
    if (/\.xlsx$/i.test(file.name)) {
      const [{ readMuBook }, { fileBuffer }] = await Promise.all([import("../lib/sheets/mu"), import("../lib/sheetForm")]);
      const { data, warn } = readMuBook(await fileBuffer(file));
      if (h.name && !window.confirm("지금 입력한 내용을 올린 엑셀 서식 내용으로 바꿀까요?")) return "";
      setSt(data);
      return `엑셀 서식 「${file.name}」을 불러왔습니다.` + (warn.length ? ` 확인할 점: ${warn.join(" / ")}` : "");
    }
    const text = await new Promise((ok, no) => {
      const fr = new FileReader();
      fr.onload = () => ok(fr.result);
      fr.onerror = () => no(fr.error);
      fr.readAsText(file, "utf-8");
    });
    let j;
    try {
      j = JSON.parse(text);
      if (!j || j.type !== "hfls-mu" || !j.data) throw new Error("x");
    } catch (e) {
      throw new Error("안전시설등 세부점검표 입력 내용 파일(.json) 또는 엑셀 서식(.xlsx)이 아닙니다.");
    }
    const same = j.savedAt === today();
    const d = { ...emptyMu(), ...j.data, hdr: { ...emptyMu().hdr, ...(j.data.hdr || {}) } };
    setSt(same ? d : { ...d, res: {}, act: {}, hdr: { ...d.hdr, date: today() } });
    return `${j.savedAt || ""} 저장한 입력 내용을 불러왔습니다.` + (same ? "" : " 점검일자는 오늘로, 점검결과는 기본값(양호·해당없음)으로, 조치사항은 비웠습니다.");
  };
  const reset = () => {
    if (!window.confirm("입력한 내용을 모두 지울까요?")) return;
    setSt(emptyMu());
    setMsg("");
  };

  return (
    <div className="ir mu">
      <div className="ir-form no-print">
        <div className="ir-intro">
          <b>안전시설등 세부점검표</b> — 다중이용업소법 시행규칙 [별지 제10호서식]. 다중이용업주는 안전시설등을 <b>매 분기 1회 이상</b> 점검하고(소방시설 자체점검을 한 분기는 생략 가능) 점검결과서를 <b>1년간 보관</b>합니다(법 제13조제1항, 시행규칙 제13조·제14조). 소방시설관리업자에게 위탁할 수 있습니다(법 제13조제2항).
        </div>
        <FileBar
          saveLabel="입력 내용 파일로 저장"
          onSave={saveFile}
          onBlank={blankBook}
          onLoad={loadFile}
          accept=".json,.xlsx,application/json"
          msg={msg}
          setMsg={setMsg}
          hint="저장한 파일(.json)을 다음 분기에 불러오면 점검일자·결과만 고치면 됩니다. 컴퓨터에서 엑셀 빈 서식에 작성해 올려도 됩니다."
        />

        <section className="ir-sec">
          <div className="ir-sec-h">
            <span>1. 점검대상</span>
          </div>
          <div className="ir-sec-b">
            <label className="w-field">
              <span className="w-label">다중이용업 업종(시행령 제2조·시행규칙 제2조)</span>
              <select
                value={st.type}
                onChange={(e) => {
                  const nt = muType(e.target.value);
                  setSt((s) => ({ ...s, type: e.target.value, hdr: { ...s.hdr, use: !s.hdr.use || (muType(s.type) || {}).name === s.hdr.use ? (nt ? nt.name : "") : s.hdr.use } }));
                }}
              >
                <option value="">— 업종 선택 —</option>
                {MU_TYPES.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <span className="w-hint">고르면 주용도에 업종 이름이 들어갑니다.</span>
            </label>
            <div className="w-grid2">
              {I("대상명", "name")}
              {I("전화번호", "tel")}
              {I("소재지", "addr", "text", "", true)}
              {I("주용도", "use", "text", t ? t.name : "업종 선택 시 자동")}
              {I("건물구조", "structure", "text", "예: 철근콘크리트조")}
              {I("대표자", "ceo")}
              {I("소방안전관리자", "manager")}
            </div>
          </div>
        </section>

        <section className="ir-sec">
          <div className="ir-sec-h">
            <span>2. 점검사항</span>
            <small>
              양호 {counts[0]} · 불량 {counts[1]} · 해당없음 {counts[2]}
              {left ? ` · 미선택 ${left}` : ""}
            </small>
          </div>
          <div className="ir-sec-b">
            <div className="w-hint">항목마다 점검한 결과를 직접 고르십시오(같은 버튼을 다시 누르면 취소). 불량이면 조치사항(조치 내용·예정일)을 적습니다.</div>
            <div className="mu-items">
              {MU_ITEMS.map(([title, subs], i) => {
                return (
                  <div key={i} className={`mu-ed ${res[i] ? `r-${res[i]}` : "r-none"}`}>
                    <div className="mu-ed-t">
                      <b>
                        {MU_NUM[i]} {title}
                      </b>
                      {subs.length > 0 && <span className="mu-ed-s">{subs.join(" · ")}</span>}
                    </div>
                    <div className="wm-item-r">
                      {MU_RESULTS.map((k) => (
                        <button key={k} type="button" className={res[i] === k ? `on k-${k === "양호" ? "적합" : k === "불량" ? "부적합" : "해당없음"}` : ""} onClick={() => setRes(i, k)}>
                          {k}
                        </button>
                      ))}
                    </div>
                    {(res[i] === "불량" || (st.act || {})[i]) && (
                      <input className="mu-act-in" value={(st.act || {})[i] || ""} placeholder="조치사항(예: 2026.11.20. 교체 예정)" onChange={(e) => setAct(i, e.target.value)} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="ir-sec">
          <div className="ir-sec-h">
            <span>점검일자·점검자</span>
            <small>{quarterOf(h.date)}</small>
          </div>
          <div className="ir-sec-b">
            <div className="w-grid2">
              {I("점검일자", "date", "date")}
              {I("점검자 성명", "checker")}
              <label className="w-field">
                <span className="w-label">점검자 자격(시행규칙 제14조제2호)</span>
                <select value={h.qual || ""} onChange={(e) => setH("qual", e.target.value)}>
                  <option value="">— 선택(서식에는 출력하지 않음) —</option>
                  {MU_QUALS.map((q) => (
                    <option key={q}>{q}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="w-hint">점검자: 다중이용업주, 소방안전관리자(선임된 경우), 소방안전관리자·소방시설관리사·소방기술사·소방설비(산업)기사 자격이 있는 종업원, 소방시설관리업자.</div>
          </div>
        </section>

        <div className="ir-actions">
          <div className="ir-btns">
            <button type="button" className="w-run" disabled={busy} onClick={pdf}>
              {busy ? "PDF 만드는 중…" : "PDF 다운로드"}
            </button>
            <button type="button" className="w-reset" onClick={print}>
              인쇄
            </button>
            <button type="button" className="w-reset" onClick={reset}>
              초기화
            </button>
          </div>
          <div className="w-hint">입력 내용은 이 기기의 브라우저에만 저장되며 서버로 전송되지 않습니다. 출력 후 서명 또는 날인하고 1년간 보관하십시오.</div>
        </div>
      </div>
      <Preview>
        <div className="rp-print-root">
          <MuDoc st={st} />
        </div>
      </Preview>
    </div>
  );
}

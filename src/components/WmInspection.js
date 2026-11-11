import { useEffect, useMemo, useRef, useState } from "react";
import { WM_FORMS, wmForm, wmRows, optVals, results, emptyWm, emptyCard, KFSI, RESULTS, submitDue } from "../law/wm";
import { HZ_ITEMS, HZ_CLASSES, hzItem, hzTotal, hzFmt } from "../law/hazmat";
import WmDoc from "./WmDoc";
import { CardEditor, CardDoc } from "./WmCard";

// ============================================================
// 위험물 정기점검 탭 — 제조소등 일반점검표 · 소방시설 일반점검표 · 위험물안전카드
// 입력값은 이 브라우저에만 저장(점검표마다 따로)
// ============================================================

const KEY = "hfls_wm_v1";
const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    return v && v.v === 1 ? v : { v: 1, sub: "gas", forms: {}, card: emptyCard() };
  } catch (e) {
    return { v: 1, sub: "gas", forms: {}, card: emptyCard() };
  }
};
const today = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const FAC = WM_FORMS.filter((f) => f.kind === "facility");
const FIRE = WM_FORMS.filter((f) => f.kind === "fire");
const COMMON = ["checker", "owner", "manager", "biz", "loc", "permitDate", "permitNo"];

function Due({ done }) {
  const d = submitDue(done);
  return (
    <div className="wm-due">
      <b>점검결과 제출</b> 점검을 한 날부터 <b>30일 이내</b> 관할 소방서(시·도지사)에 제출해야 합니다(위험물안전관리법 제18조제2항, 기간 내 미제출 시 500만원 이하 과태료 — 같은 법 제39조제1항제7호의2).
      {d && (
        <div className="wm-due-d">
          제출기한: <b>{d.due}({d.dow})까지</b>
          {d.next && ` — 토·일요일이므로 ${d.next}(${d.nextDow})까지(행정기본법 제6조①, 민법 제161조)`}
          <small> · 점검 종료일의 다음 날부터 30일째 되는 날(위험물안전관리법 시행령 별표9 과태료 개별기준). 공휴일이면 다음 날로 연장되니 달력을 확인하십시오.</small>
        </div>
      )}
    </div>
  );
}

function Seg({ value, options, onChange }) {
  return (
    <span className="ir-seg">
      {options.map(([k, l]) => (
        <button key={k} type="button" className={value === k ? "on" : ""} onClick={() => onChange(k)}>
          {l}
        </button>
      ))}
    </span>
  );
}

/** 위험물 현황 — 품명·허가량으로 지정수량 배수 자동 계산 */
function hzSummary(rowsIn) {
  const rows = (rowsIn || []).filter((r) => r.item);
  if (!rows.length) return { names: "", amounts: "", ratio: "" };
  const t = hzTotal(rows.map((r) => ({ item: r.item, amount: r.amount, q: r.q })));
  return {
    names: rows.map((r) => hzItem(r.item).name).join(", "),
    amounts: rows.map((r) => `${r.amount || "—"}${hzItem(r.item).u}`).join(", "),
    ratio: t.rows.some((x) => x.ok) ? `${hzFmt(t.sum)}배` : "",
  };
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
    const pages = host.querySelectorAll(".rp-page");
    let first = true;
    for (const p of pages) {
      const canvas = await html2canvas(p, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      const pageHpx = Math.round((canvas.width * 297) / 210);
      for (let y = 0; y < canvas.height; y += pageHpx) {
        const h = Math.min(pageHpx, canvas.height - y);
        if (h < 20) continue;
        const c = document.createElement("canvas");
        c.width = canvas.width;
        c.height = h;
        c.getContext("2d").drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (!first) doc.addPage();
        first = false;
        doc.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, (h * 210) / canvas.width);
      }
    }
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

function BookLink({ f }) {
  if (f && f.kind === "fire") return null;
  const carrier = !f || f.book === "carrier";
  return (
    <div className="ir-link">
      <div>
        <b>작성 방법·용어 설명</b>
        <p>
          한국소방안전원 홈페이지에서 <b>「{carrier ? "위험물운송자" : "위험물안전관리자"}」 실무교재</b>의 {f ? "일반점검표" : "위험물안전카드"} 작성 방법과 설비·용어 설명을 참고하십시오. 판단 근거는 위험물안전관리법령과 「위험물안전관리에 관한 세부기준」입니다.
        </p>
      </div>
      <a className="w-run" href={KFSI} target="_blank" rel="noopener noreferrer">
        한국소방안전원 열기 →
      </a>
    </div>
  );
}

function FormEditor({ f, st, setSt, all }) {
  const rows = wmRows(f);
  const res = results(f, st);
  const o = optVals(f, st);
  const h = st.hdr || {};
  const setH = (k, x) => setSt({ ...st, hdr: { ...h, [k]: x } });
  const setRes = (i, x) => setSt({ ...st, res: { ...st.res, [i]: x } });
  const setNote = (i, x) => setSt({ ...st, note: { ...st.note, [i]: x } });
  const [openNote, setOpenNote] = useState({});
  const hz = hzSummary(st.hz);
  const groups = useMemo(() => {
    const g = [];
    rows.forEach((r, i) => {
      const last = g[g.length - 1];
      if (last && last.name === r[0]) last.idx.push(i);
      else g.push({ name: r[0], idx: [i] });
    });
    return g;
  }, [rows]);
  const setGroup = (idx, x) => {
    const nr = { ...st.res };
    for (const i of idx) nr[i] = x;
    setSt({ ...st, res: nr });
  };
  const counts = RESULTS.map((k) => res.filter((x) => x === k).length);
  const src = Object.entries(all).filter(([id, s]) => id !== f.id && s && s.hdr && (s.hdr.biz || s.hdr.owner));
  const I = (label, k, type = "text", ph) => (
    <label className="w-field">
      <span className="w-label">{label}</span>
      <input type={type} value={h[k] || ""} placeholder={ph || ""} onChange={(e) => setH(k, e.target.value)} />
    </label>
  );
  return (
    <>
      {src.length > 0 && (
        <div className="ir-copy">
          <span>다른 점검표에서 기본 정보 가져오기:</span>
          {src.map(([id, s]) => (
            <button
              key={id}
              type="button"
              className="w-link"
              onClick={() => {
                const pick = Object.fromEntries(COMMON.map((k) => [k, s.hdr[k] || ""]));
                setSt({ ...st, hdr: { ...h, ...pick, ...(f.kind === "fire" && wmForm(id).kind === "facility" ? { facKind: wmForm(id).tab } : {}) }, hz: f.kind === "facility" && s.hz ? s.hz : st.hz });
              }}
            >
              {wmForm(id).tab}
              {s.hdr.biz ? `(${s.hdr.biz})` : ""}
            </button>
          ))}
        </div>
      )}
      <div className="ir-sec">
        <div className="ir-sec-h">
          <span>1. 기본 정보</span>
          <small>[별지 제{f.form}호서식] 머리 부분</small>
        </div>
        <div className="ir-sec-b">
        <div className="w-grid3">
          {I("점검 시작일", "from", "date")}
          {I("점검 종료일", "to", "date")}
          {I(f.form === "13" ? "점검자(위험물운송자 등)" : "점검자(안전관리자 등)", "checker")}
        </div>
        <Due done={h.to || h.from} />
        {f.opts.length > 0 && (
          <div className="ir-optgrid">
            {f.opts.map((x) => (
              <div key={x.k} className="ir-optrow">
                <span className="ir-optlabel">{x.label}</span>
                <Seg value={o[x.k]} options={x.ch} onChange={(val) => setSt({ ...st, opts: { ...st.opts, [x.k]: val } })} />
              </div>
            ))}
          </div>
        )}
        {f.opts
          .filter((x) => x.hint)
          .map((x) => (
            <div key={x.k} className="w-hint">
              {x.label}: {x.hint}
            </div>
          ))}
        <div className="w-grid2">
          {f.extra && I(f.extra[0], "extra")}
          {I(f.kind === "fire" ? "제조소등의 설치허가 연월일" : "설치허가 연월일", "permitDate", "date")}
          {I("완공검사번호", "permitNo")}
          {I("설치자", "owner")}
          {f.kind === "facility" && I(f.form === "13" ? "위험물운송자" : "안전관리자", "manager", "text", f.form === "13" ? "" : "중복 선임이면 「중복 선임」 표기")}
          {f.kind === "facility" && I("사업소명", "biz")}
          {f.kind === "facility" && I(f.form === "13" ? "상치장소" : "설치위치", "loc", "text", "주소와 설치위치를 특정할 수 있는 내용")}
          {f.kind === "fire" && I("제조소등의 구분", "facKind", "text", "예: 주유취급소")}
          {I(f.kind === "fire" ? (f.form === "24" ? "탐지설비의 호칭번호" : "소화설비의 호칭번호") : "시설명/호칭번호", "facName", "text", f.form === "13" ? "자동차 등록번호 등" : "")}
        </div>
        {f.kind === "facility" && (
          <>
            {I("위험물 저장·취급 개요", "summary", "text", "용도, 저장·취급기간, 저장·취급방법 등")}
            <div className="wm-hzbox">
              <span className="w-label">위험물 현황 — 품명·허가량(지정수량 배수 자동 계산)</span>
              {(st.hz || []).map((r, i) => {
                const it = r.item ? hzItem(r.item) : null;
                const upd = (p) => setSt({ ...st, hz: st.hz.map((x, j) => (j === i ? { ...x, ...p } : x)) });
                return (
                  <div key={i} className="wm-hzrow">
                    <select value={r.item} onChange={(e) => upd({ item: e.target.value, q: "" })}>
                      <option value="">품명 선택</option>
                      {[1, 2, 3, 4, 5, 6].map((c) => (
                        <optgroup key={c} label={HZ_CLASSES[c]}>
                          {HZ_ITEMS.filter((x) => x.cls === c).map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {it && it.opts && (
                      <select value={r.q || ""} onChange={(e) => upd({ q: e.target.value })}>
                        <option value="">지정수량</option>
                        {it.opts.map((q) => (
                          <option key={q} value={q}>
                            {q}
                            {it.u}
                          </option>
                        ))}
                      </select>
                    )}
                    <input type="number" inputMode="decimal" value={r.amount} placeholder={`허가량(${it ? it.u : "L·kg"})`} onChange={(e) => upd({ amount: e.target.value })} />
                    <button type="button" className="tl-x" onClick={() => setSt({ ...st, hz: st.hz.length > 1 ? st.hz.filter((_, j) => j !== i) : [{ item: "", amount: "" }] })}>
                      ×
                    </button>
                  </div>
                );
              })}
              <div className="wm-hzsum">
                <button type="button" className="w-link" onClick={() => setSt({ ...st, hz: [...(st.hz || []), { item: "", amount: "" }] })}>
                  + 품명 추가
                </button>
                {hz.ratio && (
                  <span>
                    지정수량의 배수 <b>{hz.ratio}</b>
                  </span>
                )}
              </div>
            </div>
          </>
        )}
        </div>
      </div>

      <div className="ir-sec">
        <div className="ir-sec-h">
          <span>2. 점검 결과</span>
          <small>
            적합 {counts[0]} · 부적합 {counts[1]} · 해당없음 {counts[2]}
            {counts[3] ? ` · 점검곤란 ${counts[3]}` : ""}
          </small>
        </div>
        <div className="ir-sec-b">
        <div className="w-hint">기본은 「적합」이고, 위에서 고른 형태에 없는 설비 항목과 한국소방안전원 실무교재 작성예시에서 해당없음으로 표시된 항목(「예시 기준」 표시)은 「해당없음」으로 시작합니다. 시설에 맞게 고치고, 점검이 현저히 곤란하면 「점검곤란」(결과란 공란, 비고에 사유)을 고르십시오. 부적합은 비고에 수리·개조 연월일과 내용을 적습니다.</div>
        {groups.map((g) => (
          <div key={g.name + g.idx[0]} className="wm-grp">
            <div className="wm-grp-h">
              <b>{g.name}</b>
              <span>
                <button type="button" className="w-link" onClick={() => setGroup(g.idx, "적합")}>
                  모두 적합
                </button>
                <button type="button" className="w-link" onClick={() => setGroup(g.idx, "해당없음")}>
                  모두 해당없음
                </button>
              </span>
            </div>
            {g.idx.map((i) => {
              const r = rows[i];
              const showNote = openNote[i] || res[i] === "부적합" || res[i] === "점검곤란" || (st.note && st.note[i]);
              return (
                <div key={i} className={`wm-item r-${res[i]}`}>
                  <div className="wm-item-t">
                    {r[1] && <span className="wm-item-s">{r[1].split(" > ").join(" · ")}</span>}
                    <span>{r[2]}</span>
                    <em>{r[3]}</em>
                    {r[4] === "ex" && <i className="wm-ex" title="한국소방안전원 실무교재 작성예시에서 해당없음으로 표시된 항목 — 기본값 해당없음">예시 기준</i>}
                  </div>
                  <div className="wm-item-r">
                    {RESULTS.map((k) => (
                      <button key={k} type="button" className={res[i] === k ? `on k-${k}` : ""} onClick={() => setRes(i, k)}>
                        {k}
                      </button>
                    ))}
                    {!showNote && (
                      <button type="button" className="wm-nb" onClick={() => setOpenNote({ ...openNote, [i]: true })}>
                        비고
                      </button>
                    )}
                  </div>
                  {showNote && <input className="wm-note" value={(st.note && st.note[i]) || ""} placeholder={res[i] === "점검곤란" ? "점검곤란 사유" : "비고(수리·개조 연월일과 내용 등)"} onChange={(e) => setNote(i, e.target.value)} />}
                </div>
              );
            })}
          </div>
        ))}
        <label className="w-field">
          <span className="w-label">기타사항</span>
          <textarea rows={3} value={st.etc || ""} placeholder="실제 점검한 사람이 실시자와 다르면 그 성명·상호 등" onChange={(e) => setSt({ ...st, etc: e.target.value })} />
        </label>
        </div>
      </div>
    </>
  );
}

export default function WmInspection() {
  const [all, setAll] = useState(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) {
      /* 저장 불가 */
    }
  }, [all]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);
  const sub = all.sub;
  const f = sub === "card" ? null : wmForm(sub) || WM_FORMS[0];
  const st = f ? { ...emptyWm(), ...(all.forms[f.id] || {}) } : null;
  if (st && !st.hdr.from) st.hdr = { ...st.hdr, from: today(), to: today() };
  const setSt = (v) => setAll((a) => ({ ...a, forms: { ...a.forms, [f.id]: v } }));
  const card = { ...emptyCard(), ...(all.card || {}) };
  const setCard = (c) => setAll((a) => ({ ...a, card: c }));
  const go = (id) => {
    setMsg("");
    setAll((a) => ({ ...a, sub: id }));
  };

  const pdf = async () => {
    setBusy(true);
    try {
      const name = f ? `${f.tab}_일반점검표_${(st.hdr.biz || st.hdr.facName || "").trim() || "점검"}_${st.hdr.to || ""}.pdf` : `위험물안전카드_${card.name1 || "물질"}.pdf`;
      await exportPdf(name);
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
  const saveFile = (every) => {
    const body = every
      ? { type: "hfls-wm", v: 2, scope: "all", savedAt: today(), sub, forms: f ? { ...all.forms, [f.id]: st } : all.forms, card }
      : { type: "hfls-wm", v: 2, scope: "one", savedAt: today(), sub, data: f ? st : card };
    const name = every
      ? `위험물정기점검_전체_${(st && st.hdr.biz) || ""}_${today()}.json`.replace("__", "_")
      : `${f ? f.tab : "위험물안전카드"}_입력내용_${(st && st.hdr.biz) || card.name1 || ""}_${today()}.json`.replace("__", "_");
    const blob = new Blob([JSON.stringify(body, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMsg(every ? "모든 점검표(위험물안전카드 포함)를 한 파일로 저장했습니다." : "이 점검표 입력 내용을 파일로 저장했습니다.");
  };
  // 다른 날 저장한 파일 → 점검기간은 오늘로, 점검결과·비고는 기본값으로(작년 내용 재사용). 같은 날 저장한 파일 → 그대로 복원.
  const loadFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      let j;
      try {
        j = JSON.parse(rd.result);
        if (j.type !== "hfls-wm") throw new Error("x");
      } catch (err) {
        alert("위험물 정기점검 입력 내용 파일(.json)이 아닙니다.");
        return;
      }
      const same = j.savedAt === today();
      const renew = (d) => (same || !d ? d : { ...d, res: {}, note: {}, hdr: { ...(d.hdr || {}), from: today(), to: today() } });
      if (j.scope === "all") {
        const forms = Object.fromEntries(Object.entries(j.forms || {}).map(([id, d]) => [id, renew(d)]));
        setAll((a) => ({ ...a, sub: j.sub || a.sub, forms: { ...a.forms, ...forms }, card: j.card || a.card }));
        const n = Object.keys(forms).length;
        setMsg(`${j.savedAt || ""} 저장한 점검표 ${n}종${j.card ? "과 위험물안전카드" : ""}를 불러왔습니다.` + (same ? "" : " 점검기간은 오늘로, 점검결과는 기본값(적합·해당없음)으로 바꿨습니다 — 날짜와 불량 사항만 확인하십시오."));
        return;
      }
      if (!j.data) {
        alert("위험물 정기점검 입력 내용 파일(.json)이 아닙니다.");
        return;
      }
      if (j.sub === "card") setAll((a) => ({ ...a, sub: "card", card: j.data }));
      else setAll((a) => ({ ...a, sub: j.sub, forms: { ...a.forms, [j.sub]: renew(j.data) } }));
      const nm = j.sub === "card" ? "위험물안전카드" : (wmForm(j.sub) || {}).tab;
      setMsg(`${j.savedAt || ""} 저장한 「${nm}」 입력 내용을 불러왔습니다.` + (same || j.sub === "card" ? "" : " 점검기간은 오늘로, 점검결과는 기본값(적합·해당없음)으로 바꿨습니다 — 날짜와 불량 사항만 확인하십시오."));
    };
    rd.readAsText(file);
  };
  const reset = () => {
    if (!window.confirm("이 점검표의 입력 내용을 모두 지울까요?")) return;
    if (f) setSt(emptyWm());
    else setCard(emptyCard());
  };

  const Tabs = ({ list, label }) => (
    <div className="wm-tabrow">
      <span>{label}</span>
      <nav className="tl-tabs">
        {list.map((x) => (
          <button key={x.id} type="button" className={sub === x.id ? "on" : ""} onClick={() => go(x.id)}>
            {x.tab}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="wm">
      <div className="no-print">
        <Tabs list={FAC} label="제조소등" />
        <Tabs list={FIRE} label="소방시설" />
        <Tabs list={[{ id: "card", tab: "위험물안전카드" }]} label="운송" />
      </div>
      <div className="ir">
        <div className="ir-form no-print">
          <div className="ir-intro">
            {f ? (
              <>
                <b>{f.form === "19" ? "물분무소화설비·스프링클러설비 일반점검표" : f.title}</b> — 「위험물안전관리에 관한 세부기준」 [별지 제{f.form}호서식]. 정기점검 대상 제조소등(영 제16조)의 관계인은 연 1회 이상 점검하고(시행규칙 제64조), 점검한 날부터 30일 이내 결과를 시·도지사(소방서)에 제출하며(법 제18조제2항), 점검기록은 3년간 보존합니다(시행규칙 제68조).
                {f.kind === "fire" && " 소화·경보설비 점검표는 해당 제조소등의 일반점검표와 함께 작성합니다."}
              </>
            ) : (
              <>
                <b>위험물안전카드</b> — 위험물안전관리법 시행규칙 [별지 제48호서식]. 위험물(특수인화물·제1석유류 등)을 운송할 때 운송자가 휴대하는 카드입니다.
              </>
            )}
          </div>
          <div className="ir-file">
            <button type="button" className="w-reset" onClick={() => saveFile(false)}>
              입력 내용 파일로 저장
            </button>
            <button type="button" className="w-reset" onClick={() => saveFile(true)}>
              모든 점검표 한 파일로 저장
            </button>
            <button type="button" className="w-reset" onClick={() => fileRef.current && fileRef.current.click()}>
              저장한 파일 불러오기
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={loadFile} />
            <span className="w-hint">연 1회 이상 점검 — 올해 입력한 내용을 파일로 받아 두었다가 내년에 불러오면 날짜와 불량 사항만 고치면 됩니다.</span>
          </div>
          {msg && <div className="note">{msg}</div>}
          <BookLink f={f} />
          {f ? <FormEditor key={f.id} f={f} st={st} setSt={setSt} all={all.forms} /> : <div className="ir-sec"><div className="ir-sec-b wm-pt"><CardEditor c={card} set={setCard} /></div></div>}
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
            <div className="w-hint">입력 내용은 이 기기의 브라우저에만 저장되며 서버로 전송되지 않습니다(점검표마다 따로 저장). 출력 후 서명 또는 날인하십시오.</div>
          </div>
        </div>
        <Preview>{f ? <WmDoc key={f.id} f={f} st={st} rows={wmRows(f)} res={results(f, st)} hz={hzSummary(st.hz)} /> : <CardDoc c={card} />}</Preview>
      </div>
    </div>
  );
}

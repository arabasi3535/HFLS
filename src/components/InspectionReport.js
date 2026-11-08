import { useEffect, useMemo, useRef, useState } from "react";
import ReportForm from "./ReportForm";
import { ROWS_L, ROWS_R, ROWS_M_L, ROWS_M_R, rowItems, defectText, emptyReport, applySeed, missingFields, stationFor, defects, daysInclusive } from "../law/report";

// ============================================================
// 관계인 작동점검 보고서 작성기
//  · 3급 소방안전관리대상물(간이스프링클러설비·자동화재탐지설비) 관계인 점검 전용
//  · 기본값: 모두 양호, 3급, 소방계획서 작성·보관, 전년도 작동점검·교육·훈련 실시
//  · 입력값은 이 브라우저에만 저장(서버 전송 없음)
// ============================================================

const KEY = "hfls_report_v1";
const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!v || v.v !== 1) return emptyReport();
    const e = emptyReport();
    return { ...e, ...v, owner: { ...e.owner, ...v.owner }, email: { ...e.email, ...v.email }, manager: { ...e.manager, ...v.manager }, bld: { ...e.bld, ...v.bld }, detail: { ...e.detail, ...v.detail }, insurance: { ...e.insurance, ...v.insurance }, plan10: { ...e.plan10, ...v.plan10 } };
  } catch (e) {
    return emptyReport();
  }
};
const save = (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch (e) {
    /* 저장 불가 */
  }
};

const MULTI = [
  "휴게음식점영업", "제과점영업", "일반음식점영업", "단란주점영업", "유흥주점영업", "영화상영관", "비디오물감상실업", "비디오물소극장업", "복합영상물제공업", "학원", "독서실", "목욕장업",
  "찜질방업", "게임제공업", "인터넷컴퓨터게임시설제공업", "복합유통게임제공업", "노래연습장업", "산후조리업", "고시원업", "권총사격장", "가상체험 체육시설업", "안마시술소", "전화방업",
  "화상대화방업", "수면방업", "콜라텍업",
];
const QUALS = ["관계인", "소방안전관리자", "소방안전관리보조자", "직원"];

function F({ label, children, hint, req, wide }) {
  return (
    <label className={`w-field ${wide ? "wide" : ""}`}>
      <span className="w-label">
        {label}
        {req && <em className="req">*</em>}
      </span>
      {children}
      {hint && <span className="w-hint">{hint}</span>}
    </label>
  );
}
function Seg({ value, options, onChange }) {
  return (
    <span className="ir-seg">
      {options.map((o) => (
        <button key={o} type="button" className={value === o ? "on" : ""} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </span>
  );
}
function Sec({ title, sub, children, open: open0 = true }) {
  const [open, setOpen] = useState(open0);
  return (
    <section className="ir-sec">
      <button type="button" className="ir-sec-h" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        {sub && <small>{sub}</small>}
        <span className="it-caret">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="ir-sec-b">{children}</div>}
    </section>
  );
}

/** 설비 한 줄: 설치 여부 · 양호/불량 · 불량 항목 선택 */
function FacRow({ row, st, onChange }) {
  const items = useMemo(() => rowItems(row), [row]);
  const bad = (st && st.bad) || {};
  const isBad = st && st.badMode;
  const setBad = (code, val) => {
    const nb = { ...bad };
    if (val) nb[code] = val;
    else delete nb[code];
    onChange({ ...st, bad: nb });
  };
  return (
    <div className={`ir-fac ${Object.keys(bad).length ? "bad" : ""}`}>
      <div className="ir-fac-h">
        <span className="ir-fac-n">{row.label}</span>
        <Seg value={isBad || Object.keys(bad).length ? "불량" : "양호"} options={["양호", "불량"]} onChange={(o) => onChange({ ...st, badMode: o === "불량", bad: o === "양호" ? {} : bad })} />
        <button type="button" className="tl-x" title="미설치로 변경" onClick={() => onChange({ on: false, bad: {} })}>
          ×
        </button>
      </div>
      {(isBad || Object.keys(bad).length > 0) && (
        <div className="ir-items">
          {items.length === 0 && <div className="w-hint">점검표에 작동점검 항목이 없는 설비입니다 — 비고란에 내용을 적어 주십시오.</div>}
          {items.map((it) => {
            const b = bad[it.code];
            return (
              <div key={it.code} className={`ir-item ${b ? "on" : ""}`}>
                <label>
                  <input type="checkbox" checked={!!b} onChange={(e) => setBad(it.code, e.target.checked ? { text: defectText(it.text), qty: "" } : null)} />
                  <span className="ir-code">{it.code}</span>
                  <span>
                    {it.head ? `[${it.head}] ` : ""}
                    {it.text}
                  </span>
                </label>
                {b && (
                  <div className="ir-item-in">
                    <input value={b.text} onChange={(e) => setBad(it.code, { ...b, text: e.target.value })} />
                    <input value={b.qty} placeholder="수량·위치(예: 2층 3개)" onChange={(e) => setBad(it.code, { ...b, qty: e.target.value })} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function InspectionReport({ seed }) {
  const [rep, setRep] = useState(load);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const lastSeed = useRef(null);
  useEffect(() => save(rep), [rep]);
  useEffect(() => {
    if (seed && seed.at && seed.at !== lastSeed.current && seed.at !== rep.seededAt) {
      lastSeed.current = seed.at;
      setRep((r) => applySeed(r, seed));
      setMsg("검토 결과(용도·면적·층수·설치 소방시설)를 불러왔습니다. 빈칸만 채우면 됩니다.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const set = (k, v) => setRep((r) => ({ ...r, [k]: v }));
  const setIn = (k, sub, v) => setRep((r) => ({ ...r, [k]: { ...r[k], [sub]: v } }));
  const setDet = (k, sub, v) => setRep((r) => ({ ...r, detail: { ...r.detail, [k]: { ...r.detail[k], [sub]: v } } }));
  const setRow = (id, st) => setRep((r) => ({ ...r, rows: { ...r.rows, [id]: st } }));
  const setMRow = (id, st) => setRep((r) => ({ ...r, mRows: { ...r.mRows, [id]: st } }));
  const setInsp = (i, k, v) => setRep((r) => ({ ...r, inspectors: r.inspectors.map((p, j) => (j === i ? { ...p, [k]: v } : p)) }));

  const missing = missingFields(rep);
  const station = stationFor(rep.addr, rep.station);
  const defs = defects(rep);
  const allRows = [...ROWS_L, ...ROWS_R].filter((r) => !r.group);
  const onRows = allRows.filter((r) => rep.rows[r.id] && rep.rows[r.id].on);
  const offRows = allRows.filter((r) => !(rep.rows[r.id] && rep.rows[r.id].on));
  const hasMulti = Object.values(rep.multi || {}).some((x) => Number(x) > 0);
  const on = (id) => rep.rows[id] && rep.rows[id].on;

  // 미리보기 축소
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const fit = () => setScale(Math.min(1, el.clientWidth / 800));
    fit();
    let ro;
    try {
      ro = new ResizeObserver(fit);
      ro.observe(el);
    } catch (e) {
      window.addEventListener("resize", fit);
    }
    return () => (ro ? ro.disconnect() : window.removeEventListener("resize", fit));
  }, []);

  const pdf = async () => {
    if (missing.length) return;
    setBusy(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const src = document.getElementById("rp-doc");
      const host = document.createElement("div");
      host.className = "rp-export";
      const clone = src.cloneNode(true);
      host.appendChild(clone);
      document.body.appendChild(host);
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pages = clone.querySelectorAll(".rp-page");
      let first = true;
      for (const p of pages) {
        const canvas = await html2canvas(p, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
        const pageHpx = Math.round((canvas.width * 297) / 210);
        for (let y = 0; y < canvas.height; y += pageHpx) {
          const h = Math.min(pageHpx, canvas.height - y);
          const c = document.createElement("canvas");
          c.width = canvas.width;
          c.height = h;
          c.getContext("2d").drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
          if (!first) doc.addPage();
          first = false;
          doc.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, (h * 210) / canvas.width);
        }
      }
      document.body.removeChild(host);
      const fname = `작동점검보고서_${(rep.name || "대상물").replace(/[\\/:*?"<>|\s]+/g, "_")}_${rep.to || ""}.pdf`;
      doc.save(fname);
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
  const reset = () => {
    if (!window.confirm("입력한 내용을 모두 지우고 새로 작성할까요?")) return;
    setRep(emptyReport());
    setMsg("");
  };

  return (
    <div className="ir">
      <div className="ir-form no-print">
        <div className="ir-intro">
          <b>관계인 작동점검 보고서</b> — 3급 소방안전관리대상물(간이스프링클러설비·자동화재탐지설비)을 관계인이 직접 점검한 결과를 「소방시설등 자체점검 실시결과 보고서」(시행규칙 별지 제9호서식)로 만듭니다. 기본값은 모두 <b>양호</b>이고, 불량인 설비만 고르면 점검번호와 불량내용이 자동으로 들어갑니다.
        </div>
        {msg && <div className="note">{msg}</div>}

        <Sec title="1. 대상물·점검기간" sub="필수">
          <div className="w-grid2">
            <F label="명칭(상호)" req>
              <input value={rep.name} onChange={(e) => set("name", e.target.value)} />
            </F>
            <F label="대상물 구분(용도)" req hint="검토 결과에서 자동 입력">
              <input value={rep.useLabel} onChange={(e) => set("useLabel", e.target.value)} />
            </F>
            <F label="소재지(도로명주소)" req wide>
              <input value={rep.addr} onChange={(e) => set("addr", e.target.value)} placeholder="예: 경상북도 안동시 ○○로 00" />
            </F>
            {!/안동/.test(rep.addr) && (
              <F label="제출할 소방서" req hint="예: ○○소방서장">
                <input value={rep.station} onChange={(e) => set("station", e.target.value)} />
              </F>
            )}
            <F label="점검 시작일" req>
              <input type="date" value={rep.from} onChange={(e) => set("from", e.target.value)} />
            </F>
            <F label="점검 종료일" req hint={`총 점검일수 ${daysInclusive(rep.from, rep.to) || "—"}일`}>
              <input type="date" value={rep.to} onChange={(e) => set("to", e.target.value)} />
            </F>
            <F label="보고서 작성일">
              <input type="date" value={rep.reportDate} onChange={(e) => set("reportDate", e.target.value)} />
            </F>
          </div>
          <div className="w-hint">제출처: {station ? `${station} 귀하` : "소재지를 입력하십시오"}</div>
        </Sec>

        <Sec title="2. 관계인·점검자" sub="점검자 3명 필수">
          <div className="w-grid2">
            <F label="관계인 구분">
              <Seg value={rep.owner.kind} options={["소유자", "관리자", "점유자"]} onChange={(v) => setIn("owner", "kind", v)} />
            </F>
            <span />
            <F label="관계인 성명" req>
              <input value={rep.owner.name} onChange={(e) => setIn("owner", "name", e.target.value)} />
            </F>
            <F label="관계인 전화번호" req>
              <input value={rep.owner.tel} inputMode="tel" onChange={(e) => setIn("owner", "tel", e.target.value)} />
            </F>
          </div>
          <div className="ir-insp">
            {rep.inspectors.map((p, i) => (
              <div key={i} className="ir-insp-row">
                <b>{i === 0 ? "주된" : "보조"}</b>
                <input placeholder={`점검자 ${i + 1} 성명 *`} value={p.name} onChange={(e) => setInsp(i, "name", e.target.value)} />
                <select value={QUALS.includes(p.qual) ? p.qual : "직접입력"} onChange={(e) => setInsp(i, "qual", e.target.value === "직접입력" ? "" : e.target.value)}>
                  {QUALS.map((q) => (
                    <option key={q}>{q}</option>
                  ))}
                  <option>직접입력</option>
                </select>
                {!QUALS.includes(p.qual) && <input placeholder="자격구분" value={p.qual} onChange={(e) => setInsp(i, "qual", e.target.value)} />}
                <input placeholder="자격번호(있으면)" value={p.no} onChange={(e) => setInsp(i, "no", e.target.value)} />
              </div>
            ))}
            {rep.owner.name && !rep.inspectors[0].name && (
              <button type="button" className="w-link" onClick={() => setInsp(0, "name", rep.owner.name)}>
                관계인({rep.owner.name})을 주된 점검인력으로
              </button>
            )}
          </div>
          <div className="w-checks">
            <label className="w-check">
              <input type="checkbox" checked={rep.email.agree} onChange={(e) => setIn("email", "agree", e.target.checked)} />
              <span>전자우편 송달 동의(조치명령서 등을 전자우편으로 받음)</span>
            </label>
            {rep.email.agree && <input placeholder="전자우편 주소" value={rep.email.addr} onChange={(e) => setIn("email", "addr", e.target.value)} />}
          </div>
        </Sec>

        <Sec title="3. 소방안전관리" sub="기본값: 3급 · 소방계획서 작성·보관 · 전년도 작동점검·교육·훈련 실시">
          <div className="w-grid2">
            <F label="소방안전관리자 성명" req>
              <input value={rep.manager.name} onChange={(e) => setIn("manager", "name", e.target.value)} />
            </F>
            <F label="소방안전관리자 전화번호">
              <input value={rep.manager.tel} inputMode="tel" onChange={(e) => setIn("manager", "tel", e.target.value)} />
            </F>
            <F label="선임 자격">
              <select value={rep.manager.type} onChange={(e) => setIn("manager", "type", e.target.value)}>
                {["소방안전관리자수첩", "소방기술자격", "업무대행감독", "겸직", "기타"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </F>
            <F label="최근 교육이수일">
              <input type="date" value={rep.manager.edu} onChange={(e) => setIn("manager", "edu", e.target.value)} />
            </F>
          </div>
          <div className="ir-opts">
            <span>
              소방안전관리등급 <Seg value={rep.grade} options={["3급", "2급", "1급", "특급"]} onChange={(v) => set("grade", v)} />
            </span>
            <span>
              소방계획서 <Seg value={rep.plan} options={["작성보관", "작성미보관", "미작성"]} onChange={(v) => set("plan", v)} />
            </span>
            <span>
              전년도 작동점검 <Seg value={rep.prevOp} options={["실시", "미실시"]} onChange={(v) => set("prevOp", v)} />
            </span>
            <span>
              전년도 종합점검 <Seg value={rep.prevComp} options={["실시", "미실시"]} onChange={(v) => set("prevComp", v)} />
            </span>
            <span>
              소방안전교육 <Seg value={rep.edu} options={["실시", "미실시"]} onChange={(v) => set("edu", v)} />
            </span>
            <span>
              소방훈련 <Seg value={rep.drill} options={["실시", "미실시"]} onChange={(v) => set("drill", v)} />
            </span>
          </div>
          {rep.grade !== "3급" && <div className="note warn">관계인 점검은 3급 소방안전관리대상물(간이스프링클러설비·자동화재탐지설비 설치)만 할 수 있습니다(시행규칙 별표3 제2호나목).</div>}
          <label className="w-check">
            <input type="checkbox" checked={rep.insurance.on} onChange={(e) => setIn("insurance", "on", e.target.checked)} />
            <span>화재보험 가입</span>
          </label>
          {rep.insurance.on && (
            <div className="w-grid2">
              <F label="보험사">
                <input value={rep.insurance.company} onChange={(e) => setIn("insurance", "company", e.target.value)} />
              </F>
              <span />
              <F label="가입 시작일">
                <input type="date" value={rep.insurance.from} onChange={(e) => setIn("insurance", "from", e.target.value)} />
              </F>
              <F label="가입 종료일">
                <input type="date" value={rep.insurance.to} onChange={(e) => setIn("insurance", "to", e.target.value)} />
              </F>
              <F label="대인(천만원)">
                <input value={rep.insurance.person} onChange={(e) => setIn("insurance", "person", e.target.value)} />
              </F>
              <F label="대물(천만원)">
                <input value={rep.insurance.property} onChange={(e) => setIn("insurance", "property", e.target.value)} />
              </F>
            </div>
          )}
        </Sec>

        <Sec title="4. 건축물 정보" sub="검토 결과에서 자동 입력 — 확인만" open={false}>
          <div className="w-grid3">
            <F label="건축허가일">
              <input type="date" value={rep.bld.permit} onChange={(e) => setIn("bld", "permit", e.target.value)} />
            </F>
            <F label="사용승인일">
              <input type="date" value={rep.bld.approval} onChange={(e) => setIn("bld", "approval", e.target.value)} />
            </F>
            <F label="연면적(㎡)">
              <input type="number" value={rep.bld.area} onChange={(e) => setIn("bld", "area", e.target.value)} />
            </F>
            <F label="건축면적(㎡)">
              <input type="number" value={rep.bld.bArea} onChange={(e) => setIn("bld", "bArea", e.target.value)} />
            </F>
            <F label="지상 층수">
              <input type="number" value={rep.bld.gf} onChange={(e) => setIn("bld", "gf", e.target.value)} />
            </F>
            <F label="지하 층수">
              <input type="number" value={rep.bld.bf} onChange={(e) => setIn("bld", "bf", e.target.value)} />
            </F>
            <F label="높이(m)">
              <input type="number" value={rep.bld.height} onChange={(e) => setIn("bld", "height", e.target.value)} />
            </F>
            <F label="건물동수">
              <input type="number" value={rep.bld.dong} onChange={(e) => setIn("bld", "dong", e.target.value)} />
            </F>
            <F label="세대수(공동주택)">
              <input type="number" value={rep.bld.households} onChange={(e) => setIn("bld", "households", e.target.value)} />
            </F>
            <F label="직통계단(개소)">
              <input type="number" value={rep.bld.stair} onChange={(e) => setIn("bld", "stair", e.target.value)} />
            </F>
            <F label="특별피난계단(개소)">
              <input type="number" value={rep.bld.stairSp} onChange={(e) => setIn("bld", "stairSp", e.target.value)} />
            </F>
            <F label="승용 승강기(대)">
              <input type="number" value={rep.bld.elev} onChange={(e) => setIn("bld", "elev", e.target.value)} />
            </F>
          </div>
          <div className="ir-opts">
            <span>
              구조 <Seg value={rep.bld.structure} options={["콘크리트구조", "철골구조", "조적조", "목구조", "기타"]} onChange={(v) => setIn("bld", "structure", v)} />
            </span>
            <span>
              지붕 <Seg value={rep.bld.roof} options={["슬래브", "기와", "슬레이트", "기타"]} onChange={(v) => setIn("bld", "roof", v)} />
            </span>
            <span>
              주차장{" "}
              {["지하", "지상", "필로티", "기계식", "옥상", "옥외"].map((p) => (
                <label key={p} className="ir-chip">
                  <input
                    type="checkbox"
                    checked={rep.bld.parking.includes(p)}
                    onChange={(e) => setIn("bld", "parking", e.target.checked ? [...rep.bld.parking, p] : rep.bld.parking.filter((x) => x !== p))}
                  />
                  {p}
                </label>
              ))}
            </span>
          </div>
        </Sec>

        <Sec title="5. 소방시설 점검 결과" sub={`설치 ${onRows.length}종 · 불량 ${defs.length}건`}>
          <div className="w-hint">설치된 시설은 모두 「양호」가 기본입니다. 문제가 있는 시설만 「불량」을 누르고 해당 점검항목을 고르십시오.</div>
          {onRows.length === 0 && <div className="note warn">설치된 소방시설이 없습니다. 아래 「시설 추가」에서 고르거나, 신축·기존 건축물 탭의 검토 결과에서 「작동점검 보고서 작성」을 누르십시오.</div>}
          {onRows.map((row) => (
            <FacRow key={row.id} row={row} st={rep.rows[row.id]} onChange={(st) => setRow(row.id, st)} />
          ))}
          <details className="ir-add">
            <summary>시설 추가 (검토 결과에 없는 설비)</summary>
            <div className="ir-add-l">
              {offRows.map((row) => (
                <button key={row.id} type="button" onClick={() => setRow(row.id, { on: true, bad: {} })}>
                  + {row.label}
                </button>
              ))}
            </div>
          </details>
          <F label="비고(점검표에 없는 사항)" wide>
            <input value={rep.note} onChange={(e) => set("note", e.target.value)} />
          </F>
        </Sec>

        <Sec title="6. 세부 현황" sub="수량·위치만 입력" open={onRows.length > 0}>
          <div className="w-grid3">
            <F label="동명" hint="비우면 명칭">
              <input value={rep.detail.dong} onChange={(e) => setRep((r) => ({ ...r, detail: { ...r.detail, dong: e.target.value } }))} />
            </F>
          </div>
          {(on("ext") || on("auto_res") || on("auto_com") || on("auto_cab") || on("auto_gas")) && (
            <>
              <div className="w-sub-h">소화기구·자동소화장치 수량(개)</div>
              <div className="w-grid3">
                {[
                  ["powder", "분말소화기"],
                  ["other", "기타 소화기"],
                  ["throw", "투척용 소화용구"],
                  ["simple", "기타 간이소화용구"],
                  ["spread", "자동확산소화기"],
                  ["auto", "자동소화장치"],
                ].map(([k, l]) => (
                  <F key={k} label={l}>
                    <input type="number" value={rep.detail.ext[k]} onChange={(e) => setDet("ext", k, e.target.value)} />
                  </F>
                ))}
              </div>
            </>
          )}
          {on("afd") && (
            <>
              <div className="w-sub-h">자동화재탐지설비</div>
              <div className="w-grid3">
                <F label="수신기 층(지상)">
                  <input value={rep.detail.afd.floor} onChange={(e) => setDet("afd", "floor", e.target.value)} />
                </F>
                <F label="수신기 실명" hint="예: 관리실">
                  <input value={rep.detail.afd.room} onChange={(e) => setDet("afd", "room", e.target.value)} />
                </F>
              </div>
              <div className="ir-opts">
                <span>
                  경보방식 <Seg value={rep.detail.afd.alarm} options={["전층경보", "우선경보"]} onChange={(v) => setDet("afd", "alarm", v)} />
                </span>
                <label className="ir-chip">
                  <input type="checkbox" checked={rep.detail.afd.heat} onChange={(e) => setDet("afd", "heat", e.target.checked)} />열감지기
                </label>
                <label className="ir-chip">
                  <input type="checkbox" checked={rep.detail.afd.smoke} onChange={(e) => setDet("afd", "smoke", e.target.checked)} />연기감지기
                </label>
                <label className="ir-chip">
                  <input type="checkbox" checked={rep.detail.afd.visual} onChange={(e) => setDet("afd", "visual", e.target.checked)} />시각경보기 있음
                </label>
              </div>
            </>
          )}
          {on("sspk") && (
            <div className="ir-opts">
              <span>
                간이스프링클러 종류 <Seg value={rep.detail.sspk.kind} options={["상수도", "캐비닛", "펌프"]} onChange={(v) => setDet("sspk", "kind", v)} />
              </span>
            </div>
          )}
          {on("alarm") && (
            <div className="ir-opts">
              <span>
                비상경보설비 <Seg value={rep.detail.alarm.kind} options={["비상벨설비", "자동식사이렌설비"]} onChange={(v) => setDet("alarm", "kind", v)} />
              </span>
              <span>
                조작장치 층 <input className="ir-mini" value={rep.detail.alarm.floor} onChange={(e) => setDet("alarm", "floor", e.target.value)} /> 실명{" "}
                <input className="ir-mini2" value={rep.detail.alarm.room} onChange={(e) => setDet("alarm", "room", e.target.value)} />
              </span>
            </div>
          )}
          {on("single") && (
            <div className="ir-opts">
              <span>
                단독경보형감지기 전원 <Seg value={rep.detail.single.power} options={["건전지", "상용전원"]} onChange={(v) => setDet("single", "power", v)} />
              </span>
            </div>
          )}
          {on("report") && (
            <div className="ir-opts">
              <span>
                속보기 층 <input className="ir-mini" value={rep.detail.report.floor} onChange={(e) => setDet("report", "floor", e.target.value)} /> 실명{" "}
                <input className="ir-mini2" value={rep.detail.report.room} onChange={(e) => setDet("report", "room", e.target.value)} />
              </span>
            </div>
          )}
          {(on("esc_a") || on("esc_b") || on("esc_c")) && (
            <div className="ir-opts">
              <span>
                피난기구 종류{" "}
                <Seg value={rep.detail.escape.kind} options={["완강기", "간이완강기", "피난사다리", "구조대", "미끄럼대", "공기안전매트", "다수인피난장비", "승강식피난기"]} onChange={(v) => setDet("escape", "kind", v)} />
              </span>
            </div>
          )}
          {on("guide") && (
            <div className="ir-opts">
              <span>유도등 종류</span>
              <label className="ir-chip">
                <input type="checkbox" checked={rep.detail.guide.exit} onChange={(e) => setDet("guide", "exit", e.target.checked)} />
                피난구
              </label>
              <label className="ir-chip">
                <input type="checkbox" checked={rep.detail.guide.path} onChange={(e) => setDet("guide", "path", e.target.checked)} />
                통로
              </label>
              <label className="ir-chip">
                <input type="checkbox" checked={rep.detail.guide.seat} onChange={(e) => setDet("guide", "seat", e.target.checked)} />
                객석
              </label>
            </div>
          )}
          {on("elight") && (
            <div className="ir-opts">
              <span>
                비상조명등 비상전원 <Seg value={rep.detail.elight.power} options={["내장형", "축전지설비", "자가발전설비"]} onChange={(v) => setDet("elight", "power", v)} />
              </span>
            </div>
          )}
          {on("plight") && (
            <div className="ir-opts">
              <span>
                휴대용비상조명등 전원 <Seg value={rep.detail.plight.power} options={["건전지식", "충전식 배터리식"]} onChange={(v) => setDet("plight", "power", v)} />
              </span>
            </div>
          )}
        </Sec>

        <Sec title="7. 다중이용업소" sub={hasMulti ? "입점 있음" : "기본: 해당없음"} open={false}>
          <div className="w-hint">입점한 업소가 있으면 개소 수를 적습니다. 비워 두면 「해당없음」으로 출력합니다.</div>
          <div className="ir-multi">
            {MULTI.map((m) => (
              <label key={m}>
                <span>{m}</span>
                <input type="number" min="0" value={rep.multi[m] || ""} onChange={(e) => setRep((r) => ({ ...r, multi: { ...r.multi, [m]: e.target.value } }))} />
              </label>
            ))}
          </div>
          {hasMulti && (
            <>
              <div className="w-sub-h">다중이용업소 안전시설등 점검 결과</div>
              {[...ROWS_M_L, ...ROWS_M_R].map((row) =>
                rep.mRows[row.id] && rep.mRows[row.id].on ? (
                  <FacRow key={row.id} row={row} st={rep.mRows[row.id]} onChange={(st) => setMRow(row.id, st)} />
                ) : (
                  <button key={row.id} type="button" className="ir-addbtn" onClick={() => setMRow(row.id, { on: true, bad: {} })}>
                    + {row.label}
                  </button>
                )
              )}
            </>
          )}
        </Sec>

        {defs.length > 0 && (
          <Sec title="8. 이행계획서(별지 제10호서식)" sub={`불량 ${defs.length}건 — 함께 출력`}>
            <div className="w-grid2">
              <F label="이행조치 필요기간 시작">
                <input type="date" value={rep.plan10.from} onChange={(e) => setIn("plan10", "from", e.target.value)} />
              </F>
              <F label="이행조치 필요기간 종료">
                <input type="date" value={rep.plan10.to} onChange={(e) => setIn("plan10", "to", e.target.value)} />
              </F>
            </div>
            {defs.map((d) => {
              const p = (rep.plan10.items || {})[d.code] || {};
              const upd = (k, val) => setRep((r) => ({ ...r, plan10: { ...r.plan10, items: { ...(r.plan10.items || {}), [d.code]: { ...p, [k]: val } } } }));
              return (
                <div key={d.code} className="ir-plan">
                  <span>
                    {d.code} {d.row} — {d.text}
                  </span>
                  <input type="date" value={p.from || ""} onChange={(e) => upd("from", e.target.value)} />
                  <span>~</span>
                  <input type="date" value={p.to || ""} onChange={(e) => upd("to", e.target.value)} />
                </div>
              );
            })}
          </Sec>
        )}

        <div className="ir-actions">
          {missing.length > 0 && (
            <div className="empty-need">
              남은 필수 입력: <b>{missing.join(" · ")}</b>
            </div>
          )}
          <div className="ir-btns">
            <button type="button" className="w-run" disabled={missing.length > 0 || busy} onClick={pdf}>
              {busy ? "PDF 만드는 중…" : "PDF 다운로드"}
            </button>
            <button type="button" className="w-reset" disabled={missing.length > 0} onClick={print}>
              인쇄
            </button>
            <button type="button" className="w-reset" onClick={reset}>
              초기화
            </button>
          </div>
          <div className="w-hint">입력 내용은 이 기기의 브라우저에만 저장되며 서버로 전송되지 않습니다. 출력 후 서명 또는 날인하십시오.</div>
        </div>
      </div>

      <div className="ir-preview" ref={wrapRef}>
        <div className="ir-pv-h no-print">미리보기</div>
        <div className="ir-pv-scale" style={{ "--s": scale }}>
          <div className="rp-print-root">
            <ReportForm rep={rep} />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { CATS, SUBSTITUTIONS, getFacility } from "../law/facilities";
import { STATUS } from "../law/engine";
import ResultView from "./ResultView";
import SafetyPanel from "./SafetyPanel";
import ConstructionPanel from "./ConstructionPanel";
import { safetyReview } from "../law/safety";
import { subName, groupLabel } from "./Wizard";
import { USE_GROUPS } from "../law/uses";

// ============================================================
// 간결한 결과 화면 — 설치 대상(소급·강화·대체 표시) / 확인 필요 / 출력
// ============================================================

const fmtDate = (d) => (d ? d.replace(/-/g, ".") + "." : "");
const isReq = (s) => s === STATUS.REQ || s === STATUS.REQ_CHK;
const PARKING_WATER = ["wat-parkbldg", "wat-inpark", "wat-mech"];
// 실무상 거의 항상 적용하는 대체 — 기본 선택
const SUB_DEFAULT_ON = new Set(["s4", "s5", "s8", "s8b", "s19", "s21"]);

function scale(input, u) {
  if (u.g.includes("tunnel")) return input.f && input.f.tunnelLen ? `길이 ${Number(input.f.tunnelLen).toLocaleString("ko-KR")}m` : "길이 미입력";
  if (u.g.includes("ugduct")) return "지하구";
  const gf = parseInt(input.gf, 10) || 0;
  const bf = parseInt(input.bf, 10) || 0;
  const a = parseFloat(input.area);
  return `지상 ${gf}층${bf ? ` · 지하 ${bf}층` : ""} · 연면적 ${a ? a.toLocaleString("ko-KR") : "—"}㎡`;
}

/** 대체 후보: 대상 시설이 설치 대상이고, 대체 시설이 설치 대상(또는 무관)인 경우 */
function substitutionsFor(rows, u) {
  const by = Object.fromEntries(rows.map((r) => [r.fac.key, r]));
  const out = [];
  for (const s of SUBSTITUTIONS) {
    const t = by[s.target];
    if (!t || !isReq(t.status)) continue;
    if (s.heritageOnly && !u.g.includes("heritage")) continue;
    if (s.parkingOnly) {
      const ids = [...t.hits, ...t.maybes].map((i) => i.id);
      const park = ids.filter((id) => PARKING_WATER.includes(id));
      if (!park.length) continue;
      const partial = ids.some((id) => !PARKING_WATER.includes(id));
      out.push({ ...s, partial, viaKeys: ["spk"] });
      continue;
    }
    if (s.any) continue; // 설비 외 조건(공공소화전·지락차단장치 등) — 관리자 상세에서만 안내
    const via = s.by.filter((k) => by[k] && by[k].status === STATUS.REQ);
    if (!via.length) continue;
    out.push({ ...s, viaKeys: via, replaceWith: via.map((k) => getFacility(k).name).join(" / ") });
  }
  return out;
}

function Item({ it, open, onToggle, flash }) {
  const r = it.row;
  const items = r ? [...r.hits, ...r.maybes] : [];
  const lead = items[0];
  return (
    <li className={`it ${it.kind} ${it.sub ? "subbed" : ""} ${flash ? "flash" : ""}`}>
      <button type="button" className="it-main" onClick={onToggle}>
        <span className="it-name">{it.name}</span>
        <span className="it-tags">
          {it.kind === "retro" && <span className="tag t-retro">소급</span>}
          {it.kind === "strong" && <span className="tag t-strong">강화기준</span>}
          {it.check && <span className="tag t-hist">연혁 확인</span>}
          {it.sub && <span className="tag t-sub">대체</span>}
        </span>
        <span className="it-scope">{it.sub ? `→ ${it.sub.replaceWith || "대체 설비"}` : lead ? lead.scope : it.scope || ""}</span>
        <span className="it-caret">{open ? "▾" : "▸"}</span>
      </button>
      <div className={`it-det ${open ? "open" : ""}`}>
        {it.sub && (
          <div className="det-line sub-line">
            별표5 {it.sub.no}: {it.sub.text}
            {it.sub.partial && " — 주차장 외 부분(전기실 등)은 물분무등소화설비 유지"}
          </div>
        )}
        {it.kind === "retro" && (
          <div className="det-line retro-line">
            {it.retro.basis} — {it.retro.when}, 설치 기한 {fmtDate(it.retro.deadline)}
            {it.retro.deadlineNote ? ` (${it.retro.deadlineNote})` : ""}
          </div>
        )}
        {it.kind === "strong" && <div className="det-line strong-line">소방시설법 제13조제1항 단서 — 강화된 기준을 기존 대상물에 적용할 수 있음(소방본부장·소방서장 재량)</div>}
        {items.map((i) => (
          <div className="det-crit" key={i.id}>
            <div>{i.text}</div>
            <div className="det-meta">
              대상물: {i.basis || "—"} · 범위: {i.scope}
            </div>
            <div className="det-ref">{i.ref}</div>
            {r && r.maybes.includes(i) && <div className="det-warn">적용 시점·문구를 연혁본으로 확인하십시오.</div>}
          </div>
        ))}
        {r && r.exHint && <div className="det-line">면제 검토: {r.exHint}</div>}
        {r && <div className="det-std">설치기준: {r.std}</div>}
      </div>
    </li>
  );
}

const EMPTY_SEL = { retro: {}, strong: {}, sub: {} };

export default function Report({ rv, sv, onMakeReport, onMakeConstruction, mode, adminMode, author, sel: selIn, setSel, provisional, onReport }) {
  const existing = mode === "existing";
  const [open, setOpen] = useState({});
  const [showAdmin, setShowAdmin] = useState(false);
  const sel = { ...EMPTY_SEL, ...(selIn || {}) };
  const retroOn = sel.retro;
  const strongOn = sel.strong;
  const subOn = sel.sub;
  const upd = (k) => (fn) => setSel((p) => {
    const cur = { ...EMPTY_SEL, ...(p || {}) };
    return { ...cur, [k]: fn(cur[k]) };
  });
  const setRetroOn = upd("retro");
  const setStrongOn = upd("strong");
  const setSubOn = upd("sub");

  const { hist } = rv;
  const u = rv.use;
  const rOn = (id) => retroOn[id] !== false; // 의무 소급: 기본 반영
  const sOn = (k) => !!strongOn[k]; // 강화기준: 기본 미반영
  const subs = useMemo(() => substitutionsFor(hist.rows, u), [hist, u]);
  const subIsOn = (s) => (subOn[s.id] === undefined ? SUB_DEFAULT_ON.has(s.id) : subOn[s.id]);

  // 설치 목록 구성
  const list = useMemo(() => {
    const m = new Map();
    for (const r of hist.rows) if (isReq(r.status)) m.set(r.fac.key, { key: r.fac.key, name: r.fac.name, cat: r.fac.cat, row: r, kind: "base", check: r.status === STATUS.REQ_CHK });
    if (existing) {
      for (const rr of rv.retro) {
        if (!rOn(rr.id)) continue;
        for (const a of rr.atStatus) {
          if (!isReq(a.st) || m.has(a.k)) continue;
          const fac = getFacility(a.k);
          m.set(a.k, { key: a.k, name: fac.name, cat: fac.cat, row: a.row, kind: "retro", retro: rr, check: a.st === STATUS.REQ_CHK });
        }
      }
      for (const c of rv.compare) {
        if (c.kind !== "added" || !c.retroKind.startsWith("강화") || !sOn(c.fac.key) || m.has(c.fac.key)) continue;
        m.set(c.fac.key, { key: c.fac.key, name: c.fac.name, cat: c.fac.cat, row: rv.curr.byKey[c.fac.key], kind: "strong", check: c.c === STATUS.REQ_CHK });
      }
    }
    for (const s of subs) if (subIsOn(s) && m.has(s.target) && m.get(s.target).kind === "base") m.set(s.target, { ...m.get(s.target), sub: s });
    return [...m.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hist, rv, existing, retroOn, strongOn, subOn, subs]);

  // 안전관리 검토 — 소방안전관리대상물 2·3급은 최종 설치 목록(부칙 소급·강화기준 선택 반영)으로 판정
  const safety = useMemo(() => {
    const applied = new Map(list.filter((i) => i.kind !== "base").map((i) => [i.key, i.check ? null : true]));
    // 자체점검용 '설치된 법정 설비': 설치 목록(대체된 설비는 빼고 대체 설비를 넣음, 주차장만 대체면 둘 다)
    const installed = new Map();
    for (const i of list) {
      if (!i.sub || i.sub.partial) installed.set(i.key, i.check ? null : true);
      if (i.sub) for (const k of i.sub.viaKeys || []) if (!installed.has(k) || installed.get(k) !== true) installed.set(k, true);
    }
    try {
      return safetyReview(rv, mode, applied, installed);
    } catch (e) {
      return sv || null;
    }
  }, [rv, mode, list, sv]);

  // 착공 검토(신축) — 최종 설치 목록(대체 설비 포함)으로 산정
  const buildSeed = useMemo(() => {
    if (existing) return null;
    const inst = list.filter((i) => !i.sub || i.sub.partial).map((i) => i.key);
    for (const i of list) if (i.sub) inst.push(...(i.sub.viaKeys || []));
    const f = rv.input.f || {};
    const grp0 = USE_GROUPS.find((x) => x.no === u.no);
    const sn0 = subName(u, "");
    const gl0 = grp0 && grp0.no !== "-" ? groupLabel(grp0.no, grp0.label, "") : "";
    return {
      at: 0,
      useLabel: gl0 && gl0 !== sn0 ? `${gl0} — ${sn0}` : sn0,
      apt: u.id === "apt",
      mixedRes: u.g.includes("mixed_res"),
      ugduct: u.g.includes("ugduct"),
      hazmat: u.id === "hazmat",
      area: rv.input.area,
      gf: rv.input.gf,
      bf: rv.input.bf,
      households: f.households || "",
      facs: [...new Set(inst)],
      chk: list.filter((i) => i.check).map((i) => i.name),
    };
  }, [existing, list, rv, u]);

  // 조건 변경 시 추가·제외된 시설 잠시 강조
  const prevRef = useRef(null);
  const [flash, setFlash] = useState({ added: [], removed: [] });
  const sig = list.map((i) => `${i.key}:${i.kind}:${i.sub ? 1 : 0}`).join("|");
  useEffect(() => {
    const now = new Map(list.filter((i) => !i.sub).map((i) => [i.key, i.name]));
    const prev = prevRef.current;
    prevRef.current = now;
    if (!prev) return undefined;
    const added = [...now.keys()].filter((k) => !prev.has(k));
    const removed = [...prev.entries()].filter(([k]) => !now.has(k)).map(([, n]) => n);
    if (!added.length && !removed.length) return undefined;
    setFlash({ added, removed });
    const t = setTimeout(() => setFlash({ added: [], removed: [] }), 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const checks = hist.rows.filter((r) => r.status === STATUS.CHK);
  const strongCands = existing ? rv.compare.filter((c) => c.kind === "added" && c.retroKind.startsWith("강화")) : [];
  const noRetroAdds = existing ? rv.compare.filter((c) => c.kind === "added" && c.retroKind.startsWith("소급 없음")) : [];
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const sys = hist.system;
  const grp = USE_GROUPS.find((x) => x.no === u.no);
  const sn = subName(u, existing ? rv.input.date : "");
  const gl = grp && grp.no !== "-" ? groupLabel(grp.no, grp.label, existing ? rv.input.date : "") : "";
  const useTitle = gl && gl !== sn ? `${gl} — ${sn}` : sn;
  const nRetro = list.filter((i) => i.kind === "retro").length;

  return (
    <div className="report">
      <div className="print-head print-only">
        <div className="ph-t">소방시설 적용·안전관리 검토서</div>
        <div className="ph-m">
          작성일 {fmtDate(rv.today)} · {author.org} {author.name}
        </div>
      </div>

      {provisional.length > 0 && (
        <div className="note prov">
          <b>잠정 결과</b> — {provisional.join(" · ")}
        </div>
      )}
      {provisional.length > 0 && <div className="print-only watermark">잠정</div>}

      {/* 요약 */}
      <div className="sum">
        <div className="sum-use">
          {existing ? "기존 건축물" : "신축 건축물"} · <b>{useTitle}</b>
        </div>
        <div className="sum-scale">{scale(rv.input, u)}</div>
        <div className="sum-law">
          <span>{existing ? "건축허가일" : "기준일(오늘)"} {fmtDate(rv.primaryDate)}</span>
          <span>{sys ? sys.label.replace(" (현행)", "") : ""}</span>
          <span>{hist.table}</span>
        </div>
      </div>

      {/* 꼭 알아야 할 안내만 */}
      {rv.issues.length > 0 && (
        <div className="note warn">
          {rv.issues.map((s, i) => (
            <div key={i}>{s}</div>
          ))}
        </div>
      )}
      {hist.unsupported && <div className="note danger">1992.7.28. 이전 허가 — 수록 범위 밖이므로 1992년 기준을 준용한 참고값입니다.</div>}
      {u.g.includes("house") && <div className="note">단독주택은 특정소방대상물이 아닙니다 — 주택용소방시설(소화기·단독경보형 감지기)만 설치합니다.</div>}
      {hist.rowGap && <div className="note">2024.12.1. 전 허가 연립·다세대주택은 특정소방대상물이 아닙니다 — 주택용소방시설 대상이며, 내부 주차장 물분무등만 별도 확인합니다.</div>}
      {hist.rowOld && <div className="note">소방법 시기 연립·다세대주택 — 당시 소방대상물 해당 여부를 연혁본으로 확인하십시오.</div>}
      {rv.housing && !u.g.includes("house") && !hist.rowGap && <div className="note">{rv.housing.title}: {rv.housing.retro}</div>}
      {u.g.includes("house") && rv.housing && <div className="note muted-note">{rv.housing.retro}</div>}

      {/* 소급·강화 선택 (기존 건축물) */}
      {existing && (rv.retro.length > 0 || strongCands.length > 0 || (rv.retroExcluded || []).length > 0) && (
        <div className="opts">
          {rv.retro.map((r) => (
            <label key={r.id} className={`opt opt-retro ${rOn(r.id) ? "on" : ""}`}>
              <input type="checkbox" checked={rOn(r.id)} onChange={(e) => setRetroOn((o) => ({ ...o, [r.id]: e.target.checked }))} />
              <span>
                <b>부칙 소급(의무)</b> {r.title.replace(/ — .*/, "")} — {r.atStatus.filter((a) => isReq(a.st)).map((a) => a.name).join("·") || r.facNames.join("·")}
                <small>
                  기한 {fmtDate(r.deadline)}
                  {r.expired ? " (경과)" : ""} · {r.basis}
                  {r.needsCompletion ? ` · ${r.when}만 해당 — 사용승인일이 시행일 이후면 해제하십시오.` : ""}
                </small>
              </span>
            </label>
          ))}
          {(rv.retroExcluded || []).map((t) => (
            <div key={t} className="opt-ex">
              소급 제외: {t.replace(/ — .*/, "")} (사용승인일이 부칙 시행일 이후)
            </div>
          ))}
          {strongCands.length > 0 && (
            <div className={`opt-strong ${strongCands.some((c) => sOn(c.fac.key)) ? "" : "none-on"}`}>
              <div className="opt-h">
                강화기준 적용(재량) <small>소방시설법 제13조제1항 단서 — 현행 기준이면 추가되는 시설 중 적용 가능한 것</small>
              </div>
              <div className="opt-chips">
                {strongCands.map((c) => (
                  <label key={c.fac.key} className={`chip-t ${sOn(c.fac.key) ? "on" : ""}`}>
                    <input type="checkbox" checked={sOn(c.fac.key)} onChange={(e) => setStrongOn((o) => ({ ...o, [c.fac.key]: e.target.checked }))} />
                    {c.fac.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 설치 대상 */}
      <div className="facs">
        <div className="facs-h">
          <span>
            설치 대상 <b>{list.filter((i) => !i.sub).length}</b>종
            {nRetro > 0 && <span className="legend-retro"> · 소급 {nRetro}종</span>}
          </span>
          <span className="facs-legend">
            <i className="lg lg-base" />
            {existing ? "당시 기준" : "현행 기준"}
            {existing && (
              <>
                <i className="lg lg-retro" />
                소급
                <i className="lg lg-strong" />
                강화
              </>
            )}
            <i className="lg lg-hist" />
            연혁 확인
          </span>
        </div>
        {flash.removed.length > 0 && <div className="removed-note">제외됨: {flash.removed.join(", ")}</div>}
        {list.length === 0 && <div className="empty-list">설치 대상 소방시설이 없습니다.</div>}
        {CATS.map((cat) => {
          const items = list.filter((i) => i.cat === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="cat">
              <div className="cat-h">{cat}</div>
              <ul>
                {items.map((it) => (
                  <Item key={it.key} it={it} flash={flash.added.includes(it.key)} open={!!open[it.key]} onToggle={() => toggle(it.key)} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* 별표5 대체 */}
      {subs.length > 0 && (
        <div className="subs">
          <div className="subs-h">
            설치 면제(대체) 검토 <small>현행 시행령 별표5 — 실제 설치하는 설비 기준으로 선택</small>
          </div>
          {subs.map((s) => (
            <label key={s.id} className={`sub-opt ${subIsOn(s) ? "on" : ""}`}>
              <input type="checkbox" checked={subIsOn(s)} onChange={(e) => setSubOn((o) => ({ ...o, [s.id]: e.target.checked }))} />
              <span>
                <b>{getFacility(s.target).name}</b> ← {s.replaceWith}
                <small>
                  {s.no}: {s.text}
                  {s.partial ? " (주차장 부분만)" : ""}
                </small>
              </span>
            </label>
          ))}
        </div>
      )}

      {/* 확인 필요 */}
      {checks.length > 0 && (
        <div className="chks">
          <div className="chks-h">확인 필요 — 입력 정보가 부족해 판정하지 못한 시설</div>
          <ul>
            {checks.map((r) => (
              <li key={r.fac.key}>
                <b>{r.fac.name}</b>
                <span>{r.checks.map((c) => c.text).join(" / ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {existing && noRetroAdds.length > 0 && (
        <div className="note muted-note">
          현행 기준이면 추가되지만 소급 의무가 없는 시설: {noRetroAdds.map((c) => c.fac.name).join(", ")} — 종전 기준 유지(소방시설법 제13조제1항 본문).
        </div>
      )}

      {/* 안전관리 검토: 소방안전관리대상물 등급 · 방염 · 소방자동차 전용구역 */}
      {safety && (
        <SafetyPanel
          sv={safety}
          onMakeReport={
            onMakeReport
              ? () => {
                  const inst = list.filter((i) => !i.sub || i.sub.partial).map((i) => i.key);
                  for (const i of list) if (i.sub) inst.push(...(i.sub.viaKeys || []));
                  const f = rv.input.f || {};
                  const parking = [];
                  if (Number(f.ugParking) > 0) parking.push("지하");
                  if (Number(f.parkingInside) > 0 && !(Number(f.ugParking) > 0)) parking.push("지상");
                  if (Number(f.mechCars) > 0) parking.push("기계식");
                  if (Number(f.rooftopParking) > 0) parking.push("옥상");
                  onMakeReport({
                    at: Date.now(),
                    useLabel: useTitle,
                    area: rv.input.area,
                    gf: rv.input.gf,
                    bf: rv.input.bf,
                    households: f.households || "",
                    height: f.height || "",
                    permit: existing ? rv.input.date : "",
                    approval: rv.input.completed || "",
                    parking,
                    facs: [...new Set(inst)],
                    residential: ["apt", "row", "multi", "dorm", "officetel", "mixed_res"].some((k) => u.g.includes(k)),
                    flame: safety.flame.status === "대상",
                  });
                }
              : null
          }
        />
      )}

      {buildSeed && (
        <ConstructionPanel
          seed={buildSeed}
          onOpen={onMakeConstruction ? () => onMakeConstruction({ ...buildSeed, at: Date.now() }) : null}
        />
      )}

      <div className="rep-actions no-print">
        <button type="button" className="w-run" onClick={() => window.print()}>
          {provisional.length > 0 ? "PDF 저장 (잠정)" : "PDF 저장 / 인쇄"}
        </button>
        <button
          type="button"
          className="w-reset"
          onClick={() => setOpen(Object.fromEntries(list.map((i) => [i.key, !list.every((x) => open[x.key])])))}
        >
          {list.length && list.every((x) => open[x.key]) ? "설명 접기" : "설명 모두 펼치기"}
        </button>
      </div>
      <div className="rep-report no-print">
        결과가 법령과 다르다면{" "}
        <button type="button" className="w-link" onClick={onReport}>
          이 결과 오류 신고
        </button>
      </div>
      <div className="rep-foot">업무 참고용(법적 효력 없음) — 최종 판단은 국가법령정보센터 연혁본·부칙과 소방청 질의회신으로 확인하십시오.</div>

      {adminMode && (
        <div className="admin-detail no-print">
          <button type="button" className="w-link" onClick={() => setShowAdmin((v) => !v)}>
            {showAdmin ? "▾" : "▸"} 관리자 상세 (규칙 ID·검증등급·현행 비교·입력 체크리스트)
          </button>
          {showAdmin && (
            <>
              {rv.checklist.length > 0 && (
                <ul className="admin-check">
                  {rv.checklist.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              )}
              <ResultView rv={rv} />
            </>
          )}
        </div>
      )}
      <div className="mobile-bar no-print">
        <span>
          설치 <b>{list.filter((x) => !x.sub).length}</b>종{nRetro > 0 ? ` · 소급 ${nRetro}` : ""}
          {checks.length > 0 ? ` · 확인 필요 ${checks.length}` : ""}
          {provisional.length > 0 ? " · 잠정" : ""}
        </span>
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("result-top");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        >
          결과 보기
        </button>
      </div>
    </div>
  );
}

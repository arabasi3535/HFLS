import { useEffect, useMemo, useRef, useState } from "react";
import { CATS, FACILITIES, SUBSTITUTIONS, getFacility } from "../law/facilities";
import { isReq, PARKING_WATER, subDefaultOn, substitutionsFor, resolveSubs, inspInstalled } from "../law/installed";
import { STATUS } from "../law/engine";
import ResultView from "./ResultView";
import SafetyPanel from "./SafetyPanel";
import ConstructionPanel from "./ConstructionPanel";
import { safetyReview } from "../law/safety";
import { guideKind } from "../law/guide";
import { subName, groupLabel } from "./Wizard";
import { USE_GROUPS } from "../law/uses";
import QaLink from "./QaLink";

// ============================================================
// 간결한 결과 화면 — 설치 대상(소급·강화·대체 표시) / 확인 필요 / 출력
// ============================================================

const fmtDate = (d) => (d ? d.replace(/-/g, ".") + "." : "");
function scale(input, u) {
  if (u.g.includes("tunnel")) return input.f && input.f.tunnelLen ? `길이 ${Number(input.f.tunnelLen).toLocaleString("ko-KR")}m` : "길이 미입력";
  if (u.g.includes("ugduct")) return "지하구";
  const gf = parseInt(input.gf, 10) || 0;
  const bf = parseInt(input.bf, 10) || 0;
  const a = parseFloat(input.area);
  return `지상 ${gf}층${bf ? ` · 지하 ${bf}층` : ""} · 연면적 ${a ? a.toLocaleString("ko-KR") : "—"}㎡`;
}

function Item({ it, open, onToggle, flash, guide }) {
  const r = it.row;
  const items = r ? [...r.hits, ...r.maybes, ...(r.decided ? r.checks : [])] : [];
  // 주차장 물분무등만 대체되고 전기실 등 다른 부분이 남으면 물분무등 그대로 표시(대체는 주차장 부분만)
  const partial = !!(it.sub && it.sub.partial);
  const lead = partial ? items.find((i) => !PARKING_WATER.includes(i.id)) || items[0] : items[0];
  const fullSub = it.sub && !partial;
  return (
    <li className={`it ${it.kind} ${fullSub ? "subbed" : ""} ${flash ? "flash" : ""}`}>
      <button type="button" className="it-main" onClick={onToggle}>
        <span className="it-name">{guide ? (guide.kind === "light" ? "유도등" : "유도표지") : it.name}</span>
        <span className="it-tags">
          {it.kind === "retro" && <span className="tag t-retro">소급</span>}
          {it.kind === "strong" && <span className="tag t-strong">강화기준</span>}
          {it.check && <span className="tag t-hist">연혁 확인</span>}
          {r && r.decided === true && <span className="tag t-dec">확인 후 적용</span>}
          {fullSub && <span className="tag t-sub">대체</span>}
          {partial && <span className="tag t-sub">주차장 부분 대체</span>}
        </span>
        <span className="it-scope">{guide ? guide.items.join("·") : fullSub ? `→ ${it.sub.replaceWith || "대체 설비"}` : lead ? lead.scope : it.scope || ""}</span>
        <span className="it-caret">{open ? "▾" : "▸"}</span>
      </button>
      <div className={`it-det ${open ? "open" : ""}`}>
        {guide && (
          <div className="det-line guide-line">
            <b>{guide.kind === "light" ? "유도등" : "유도표지"}</b> — {guide.no === "별도 기준" ? guide.why : `${guide.ref} ${guide.no}: ${guide.why} → ${guide.items.join("·")}`}
            {guide.notes.map((n) => (
              <div key={n} className="det-meta">
                {n}
              </div>
            ))}
          </div>
        )}
        {it.sub && (
          <div className="det-line sub-line">
            {partial ? (
              <>
                주차장 부분만 별표5 {it.sub.no}에 따라 스프링클러설비로 대체({it.sub.text}). 전기실·발전실·변전실 등 주차장 외 부분은 스프링클러설비로 대체할 수 없어 <b>물분무등소화설비</b>를 설치합니다.
              </>
            ) : (
              <>
                별표5 {it.sub.no}: {it.sub.text}
              </>
            )}
          </div>
        )}
        {it.kind === "retro" && (
          <div className="det-line retro-line">
            {it.retro.basis} — {it.retro.when}, 설치 기한 {fmtDate(it.retro.deadline)}
            {it.retro.deadlineNote ? ` (${it.retro.deadlineNote})` : ""}
          </div>
        )}
        {r && r.decided === true && <div className="det-line dec-line">입력 정보가 부족해 「확인 필요」였던 시설 — 검토자가 「적용」으로 정해 설치 대상에 넣었습니다.</div>}
        {it.kind === "vol" && <div className="det-line vol-line">법정 설치 의무가 없는 자진 설치 설비 — 착공신고·소방기술자 배치에는 포함, 공사감리는 면제(비대상)로 산정, 자체점검(종합점검 대상 판단)·소방안전관리대상물 등급에는 반영하지 않음</div>}
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
        {SUBSTITUTIONS.filter((s) => s.any && !s.parkingOnly && s.target === it.key).map((s) => (
          <div key={s.id} className="det-line">
            면제 검토(별표5 {s.no}): {s.text}
          </div>
        ))}
        {r && <div className="det-std">설치기준: {r.std}</div>}
        <QaLink word={guide ? (guide.kind === "light" ? "유도등" : "유도표지") : it.name} />
      </div>
    </li>
  );
}

const EMPTY_SEL = { retro: {}, strong: {}, sub: {}, vol: {} };

/** 인쇄: summary=true면 요약본(화면에 보이는 결과만, 설명 없이) */
function printReport(summary) {
  const cls = "print-summary";
  const body = document.body;
  const done = () => {
    body.classList.remove(cls);
    window.removeEventListener("afterprint", done);
  };
  if (summary) {
    body.classList.add(cls);
    window.addEventListener("afterprint", done);
  }
  window.print();
}

export default function Report({ rv, sv, onMakeReport, onMakeConstruction, mode, adminMode, author, sel: selIn, setSel, provisional, onReport, onDecide }) {
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
  const setVolOn = upd("vol");
  const volOn = sel.vol;

  const { hist } = rv;
  const u = rv.use;
  const rOn = (id) => retroOn[id] !== false; // 의무 소급: 기본 반영
  const sOn = (k) => !!strongOn[k]; // 강화기준: 기본 미반영
  const subs = useMemo(() => substitutionsFor(hist.rows, u), [hist, u]);
  const gk = useMemo(() => guideKind(rv), [rv]);
  const subIsOn = (s) => (subOn[s.id] === undefined ? subDefaultOn(s) : subOn[s.id]);

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
    const rs = resolveSubs(subs, subIsOn, m);
    for (const s of rs.applied) m.set(s.target, { ...m.get(s.target), sub: s });
    // 자진 설치 설비(법정 의무 없음) — 설치 목록 맨 뒤 같은 분류에 「(자진)」으로 표시
    for (const fac of FACILITIES) {
      if (!volOn[fac.key] || m.has(fac.key)) continue;
      m.set(fac.key, { key: fac.key, name: `${fac.name}(자진)`, cat: fac.cat, row: hist.byKey[fac.key], kind: "vol", check: false, scope: "자진 설치" });
    }
    const out = [...m.values()];
    out.blocked = rs.blocked;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hist, rv, existing, retroOn, strongOn, subOn, subs, volOn]);

  // 안전관리 검토 — 소방안전관리대상물 2·3급은 최종 설치 목록(부칙 소급·강화기준 선택 반영)으로 판정
  const safety = useMemo(() => {
    const applied = new Map(list.filter((i) => i.kind !== "base" && i.kind !== "vol").map((i) => [i.key, i.check ? null : true])); // 등급: 자진 설치 미반영
    const installed = inspInstalled(list);
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
    const vol = list.filter((i) => i.kind === "vol").map((i) => i.key);
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
      multiUse: !!f.multiUse,
      area: rv.input.area,
      gf: rv.input.gf,
      bf: rv.input.bf,
      households: f.households || "",
      facs: [...new Set(inst)],
      vol,
      chk: list.filter((i) => i.check).map((i) => i.name),
    };
  }, [existing, list, rv, u]);

  // 조건 변경 시 추가·제외된 시설 잠시 강조
  const prevRef = useRef(null);
  const [flash, setFlash] = useState({ added: [], removed: [] });
  const sig = list.map((i) => `${i.key}:${i.kind}:${i.sub && !i.sub.partial ? 1 : 0}`).join("|");
  useEffect(() => {
    const now = new Map(list.filter((i) => !i.sub || i.sub.partial).map((i) => [i.key, i.name]));
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

  // 실제 설치하는 법정 설비 수 — 대체된 설비는 빼고 대체 설비(제5호 차고·주차장 대체 설치 스프링클러 포함)를 셈, 자진 제외
  const nInstall = (() => {
    const keys = new Set();
    for (const i of list) {
      if (i.kind === "vol") continue;
      if (!i.sub || i.sub.partial) keys.add(i.key);
      if (i.sub) for (const k of i.sub.viaKeys || []) keys.add(k);
    }
    return keys.size;
  })();
  const checks = hist.rows.filter((r) => r.status === STATUS.CHK || typeof r.decided === "boolean");
  const nOpen = checks.filter((r) => typeof r.decided !== "boolean").length;
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
        <div className="ph-t">
          소방시설 적용·안전관리 검토서<span className="ps-only"> (요약)</span>
        </div>
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
            설치 대상 <b>{nInstall}</b>종
            {list.some((i) => i.kind === "vol") && <span className="legend-vol"> · 자진 {list.filter((i) => i.kind === "vol").length}종</span>}
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
                  <Item key={it.key} it={it} guide={it.key === "guide" ? gk : null} flash={flash.added.includes(it.key)} open={!!open[it.key]} onToggle={() => toggle(it.key)} />
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
          {subs.map((s) => {
            const why = subIsOn(s) && list.blocked ? list.blocked.get(s.id) : null;
            return (
              <label key={s.id} className={`sub-opt ${subIsOn(s) && !why ? "on" : ""} ${why ? "blocked" : ""}`}>
                <input type="checkbox" checked={subIsOn(s)} onChange={(e) => setSubOn((o) => ({ ...o, [s.id]: e.target.checked }))} />
                <span>
                  <b>{getFacility(s.target).name}</b> ← {s.replaceWith}
                  <small>
                    {s.no}: {s.text}
                    {s.partial ? " — 주차장 부분만 대체, 전기실 등 그 밖의 부분은 물분무등소화설비 유지" : ""}
                    {s.weakOnly ? " — 물분무등 중 물분무·미분무소화설비로 설치하는 경우만(포·이산화탄소·할론 등은 해당 없음), 설치 범위가 대상 전체를 덮는지 확인" : ""}
                  </small>
                  {why && <em className="sub-blocked">적용 안 됨 — {why}</em>}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {/* 확인 필요 */}
      {checks.length > 0 && (
        <div className="chks">
          <div className="chks-h">
            확인 필요 — 입력 정보가 부족해 판정하지 못한 시설
            {onDecide && <small className="no-print"> 실제 해당 여부를 확인했으면 「적용」·「미적용」을 눌러 결과에 반영하십시오(다시 누르면 취소).</small>}
          </div>
          <ul>
            {checks.map((r) => {
              const d = typeof r.decided === "boolean" ? r.decided : null;
              return (
                <li key={r.fac.key} className={d === true ? "dec-on" : d === false ? "dec-off" : ""}>
                  <div className="chk-row">
                    <b>{r.fac.name}</b>
                    {onDecide ? (
                      <span className="chk-btns no-print">
                        <button type="button" className={d === true ? "on yes" : ""} onClick={() => onDecide(r.fac.key, d === true ? null : true)}>
                          적용
                        </button>
                        <button type="button" className={d === false ? "on no" : ""} onClick={() => onDecide(r.fac.key, d === false ? null : false)}>
                          미적용
                        </button>
                      </span>
                    ) : null}
                    <span className="chk-state print-only">{d === true ? "적용(검토자 확인)" : d === false ? "미적용(검토자 확인)" : "미정"}</span>
                  </div>
                  <span className="chk-crit">{r.checks.map((c) => c.text).join(" / ")}</span>
                </li>
              );
            })}
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
          mode={mode}
          onMakeReport={
            onMakeReport
              ? (variant = "owner") => {
                  const inst = list.filter((i) => !i.sub || i.sub.partial).map((i) => i.key);
                  for (const i of list) if (i.sub) inst.push(...(i.sub.viaKeys || []));
                  const f = rv.input.f || {};
                  const parking = [];
                  if (Number(f.ugParking) > 0) parking.push("지하");
                  if (Number(f.parkingInside) > 0 && !(Number(f.ugParking) > 0)) parking.push("지상");
                  if (Number(f.mechCars) > 0) parking.push("기계식");
                  if (Number(f.rooftopParking) > 0) parking.push("옥상");
                  const gg = safety.grade;
                  onMakeReport({
                    at: Date.now(),
                    variant,
                    guideKind: gk.kind,
                    grade: gg && gg.status === "대상" && ["특급", "1급", "2급", "3급"].includes(gg.grade) ? gg.grade : "",
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

      {/* 자진 설치 설비 — 법정 설치 대상이 아닌 설비를 자진 설치하는 경우 */}
      <div className="vols no-print">
        <div className="subs-h">
          자진 설치 설비 추가 <small>법정 설치 대상이 아니지만 설치하는 설비 — 설치 목록·출력에 「(자진)」 표시, 착공신고·기술자에 포함, 공사감리는 면제(비대상), 종합점검 대상 판단·소방안전관리 등급에는 반영하지 않음(별표5 대체로 설치하는 설비는 반영)</small>
        </div>
        {CATS.map((cat) => {
          // 설치 목록에 있거나 「확인 필요」(적용·미적용으로 정함)인 설비는 제외
          const cands = FACILITIES.filter((fac) => fac.cat === cat && (volOn[fac.key] || (!list.some((i) => i.key === fac.key) && hist.byKey[fac.key].status !== STATUS.CHK)));
          if (!cands.length) return null;
          return (
            <div key={cat} className="vol-cat">
              <span className="vol-cat-h">{cat}</span>
              <div className="opt-chips">
                {cands.map((fac) => (
                  <label key={fac.key} className={`chip-t ${volOn[fac.key] ? "on" : ""}`}>
                    <input type="checkbox" checked={!!volOn[fac.key]} onChange={(e) => setVolOn((o) => ({ ...o, [fac.key]: e.target.checked }))} />
                    {fac.name}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rep-actions no-print">
        <button type="button" className="w-run" onClick={() => printReport(true)} title="화면에 보이는 결과만 설명 없이 출력">
          {provisional.length > 0 ? "요약본 PDF·인쇄 (잠정)" : "요약본 PDF·인쇄"}
        </button>
        <button type="button" className="w-reset" onClick={() => printReport(false)} title="설치 근거·범위·설치기준 설명까지 모두 출력">
          상세본 PDF·인쇄
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
          설치 <b>{nInstall}</b>종{nRetro > 0 ? ` · 소급 ${nRetro}` : ""}
          {nOpen > 0 ? ` · 확인 필요 ${nOpen}` : ""}
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

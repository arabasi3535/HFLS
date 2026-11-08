import { HZ_ITEMS, HZ_CLASSES, HZ_QUICK, hzItem, hzSub, hzSearch, hzTotal, hzFmt, class4ByFlash, casValid, isCasLike, palletQty } from "../law/hazmat";

// ============================================================
// 보조 계산기 — 위험물 지정수량 배수 판정
// CAS·물질명 검색 / 품명 직접 선택 / 제4류 인화점 판정 → 배수 합계
// ============================================================

let seq = 0;
const newRow = (patch = {}, key) => ({ key: key || `${Date.now()}-${seq++}`, sub: "", item: "", q: "", amount: "", unit: "", sg: "", off: false, query: "", flashMode: false, flash: "", ignite: "", boil: "", water: false, ...patch });
const itemLabel = (it) => `${HZ_CLASSES[it.cls].split(" ")[0]} ${it.name}`;
const qLabel = (it, q) => (it.optLabel ? it.optLabel[q] : `${Number(q).toLocaleString("ko-KR")}${it.u === "L" ? "리터" : "킬로그램"}`);

function Row({ i, row, res, set, remove }) {
  const it = row.item ? hzItem(row.item) : null;
  const sub = row.sub ? hzSub(row.sub) : null;
  const found = hzSearch(row.query);
  const casTyped = isCasLike(row.query);
  const pick = (s) => set({ sub: s.id, item: s.item, q: "", query: "", unit: hzItem(s.item).u, off: false, flashMode: false });
  const fl = row.flashMode ? class4ByFlash(row) : null;
  const pal = { on: false, cap: "18", per: "", layers: "", pals: "", extra: "", ...(row.pallet || {}) };
  const setPal = (p) => set({ pallet: { ...pal, ...p } });
  const unit = row.unit || (it ? it.u : "L");
  const pq = palletQty(pal, unit);
  return (
    <div className={`hz-row ${res.ok && res.excluded ? "off" : ""}`}>
      <div className="hz-row-h">
        <b>#{i + 1}</b>
        <span className="hz-row-t">{sub ? sub.name : it ? itemLabel(it) : "물질 선택"}</span>
        <button type="button" className="tl-x" onClick={remove} title="삭제">
          ×
        </button>
      </div>

      <div className="hz-find">
        <input
          type="text"
          placeholder="CAS 번호(예: 67-64-1) 또는 물질명(예: 경유) 검색"
          value={row.query}
          onChange={(e) => set({ query: e.target.value })}
        />
        {row.query && (
          <div className="hz-hits">
            {found.map((f) =>
              f.type === "sub" ? (
                <button key={f.s.id} type="button" onClick={() => pick(f.s)}>
                  <b>{f.s.name}</b>
                  <span>{f.s.cas || "CAS 제품별 상이"}</span>
                  <em>{itemLabel(hzItem(f.s.item))}</em>
                </button>
              ) : (
                <div key={f.s.cas} className="hz-not">
                  <b>{f.s.name}</b> <span>{f.s.cas}</span> <em>{f.s.why}</em>
                </div>
              ),
            )}
            {!found.length && (
              <div className="hz-miss">
                {casTyped && !casValid(row.query.trim()) ? "CAS 번호 형식(검사숫자)이 맞지 않습니다. " : ""}
                목록에 없는 물질입니다 — MSDS 15번 항목(법적 규제현황)의 위험물안전관리법 분류를 확인해 아래에서 품명을 직접 선택하거나, 제4류는 인화점으로 판정하세요.
              </div>
            )}
          </div>
        )}
      </div>

      {sub && (
        <div className="hz-sub">
          <b>{sub.name}</b> {sub.cas && <span>CAS {sub.cas}</span>} → {itemLabel(hzItem(sub.item))}
          {sub.note && <em> · {sub.note}</em>}
        </div>
      )}

      <div className="hz-pick">
        <select
          value={row.item}
          onChange={(e) => set({ item: e.target.value, sub: "", q: "", unit: e.target.value ? hzItem(e.target.value).u : "", flashMode: false, off: false })}
        >
          <option value="">품명 직접 선택</option>
          {[1, 2, 3, 4, 5, 6].map((c) => (
            <optgroup key={c} label={HZ_CLASSES[c]}>
              {HZ_ITEMS.filter((x) => x.cls === c).map((x) => (
                <option key={x.id} value={x.id}>
                  {x.no}. {x.name} — {x.opts ? x.opts.map((q) => qLabel(x, q)).join("·") : qLabel(x, x.q)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <label className="cx-chk">
          <input type="checkbox" checked={!!row.flashMode} onChange={(e) => set({ flashMode: e.target.checked })} /> 제4류 인화점으로 판정
        </label>
      </div>

      {row.flashMode && (
        <div className="hz-flash">
          <label className="w-field">
            <span className="w-label">인화점(℃)</span>
            <input type="number" inputMode="decimal" value={row.flash} onChange={(e) => set({ flash: e.target.value })} />
          </label>
          <label className="w-field">
            <span className="w-label">발화점(℃, 선택)</span>
            <input type="number" inputMode="decimal" value={row.ignite} onChange={(e) => set({ ignite: e.target.value })} />
          </label>
          <label className="w-field">
            <span className="w-label">비점(℃, 선택)</span>
            <input type="number" inputMode="decimal" value={row.boil} onChange={(e) => set({ boil: e.target.value })} />
          </label>
          <label className="cx-chk">
            <input type="checkbox" checked={!!row.water} onChange={(e) => set({ water: e.target.checked })} /> 수용성 액체
          </label>
          <div className="hz-flash-r">
            {fl ? (
              <>
                {fl.why} → <b>{fl.item ? itemLabel(hzItem(fl.item)) : "제4류 석유류 아님"}</b>
                {fl.item && fl.item !== row.item && (
                  <button type="button" className="w-link" onClick={() => set({ item: fl.item, sub: "", q: "", unit: "L", off: false })}>
                    이 품명 적용
                  </button>
                )}
              </>
            ) : (
              "인화점을 입력하세요(알코올류·동식물유류는 인화점이 아닌 정의로 판정)."
            )}
          </div>
        </div>
      )}

      {it && (
        <>
          {it.opts && (
            <label className="w-field hz-q">
              <span className="w-label">지정수량 {it.cls === 5 ? "(시험 결과 종)" : "(위험성이 가장 유사한 품명 기준 — 비고 25)"}</span>
              <select value={row.q} onChange={(e) => set({ q: e.target.value })}>
                <option value="">선택</option>
                {it.opts.map((q) => (
                  <option key={q} value={q}>
                    {qLabel(it, q)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {it.cond && (
            <label className="cx-chk hz-cond">
              <input type="checkbox" checked={!row.off} onChange={(e) => set({ off: !e.target.checked })} /> 위험물 해당 조건 충족 — {it.cond}
            </label>
          )}
          <div className="hz-amt">
            <label className="w-field">
              <span className="w-label hz-amt-l">
                저장·취급량
                <button type="button" className={`hz-pal-btn ${pal.on ? "on" : ""}`} onClick={() => setPal({ on: !pal.on })}>
                  {pal.on ? "직접 입력" : "팔레트 계산"}
                </button>
              </span>
              {pal.on ? (
                <input type="text" readOnly value={pq.ok ? hzFmt(pq.total) : ""} placeholder="아래 팔레트 입력" />
              ) : (
                <input type="number" inputMode="decimal" value={row.amount} onChange={(e) => set({ amount: e.target.value })} />
              )}
            </label>
            <label className="w-field">
              <span className="w-label">단위</span>
              <select value={row.unit || it.u} onChange={(e) => set({ unit: e.target.value })}>
                <option value="L">L(리터)</option>
                <option value="kg">kg</option>
              </select>
            </label>
            {(row.unit || it.u) !== it.u && (
              <label className="w-field">
                <span className="w-label">비중</span>
                <input type="number" inputMode="decimal" value={row.sg} onChange={(e) => set({ sg: e.target.value })} placeholder="MSDS 9번 항목" />
              </label>
            )}
            <div className="hz-out">
              {res.ok ? (
                res.excluded ? (
                  <span className="hz-ex">조건 미충족 — 위험물 아님(배수 제외)</span>
                ) : (
                  <>
                    <span>지정수량 {Number(res.q).toLocaleString("ko-KR")}{it.u}</span>
                    {res.conv && <small>{res.conv}</small>}
                    <b>{hzFmt(res.ratio)}배</b>
                  </>
                )
              ) : (
                <span className="hz-need">{res.msg}</span>
              )}
            </div>
          </div>
          {pal.on && (
            <div className="hz-pal">
              <div className="hz-pal-g">
                <label className="w-field">
                  <span className="w-label">용기 1개 용량({unit})</span>
                  <input type="number" inputMode="decimal" value={pal.cap} onChange={(e) => setPal({ cap: e.target.value })} />
                </label>
                <label className="w-field">
                  <span className="w-label">한 층 용기 수(개)</span>
                  <input type="number" inputMode="numeric" value={pal.per} onChange={(e) => setPal({ per: e.target.value })} />
                </label>
                <label className="w-field">
                  <span className="w-label">적재 층수(단)</span>
                  <input type="number" inputMode="numeric" value={pal.layers} onChange={(e) => setPal({ layers: e.target.value })} />
                </label>
                <label className="w-field">
                  <span className="w-label">팔레트 수(개)</span>
                  <input type="number" inputMode="numeric" value={pal.pals} onChange={(e) => setPal({ pals: e.target.value })} />
                </label>
                <label className="w-field">
                  <span className="w-label">낱개 용기(선택)</span>
                  <input type="number" inputMode="numeric" value={pal.extra} onChange={(e) => setPal({ extra: e.target.value })} placeholder="팔레트 밖" />
                </label>
              </div>
              <div className="hz-pal-r">
                {pq.ok ? (
                  <>
                    <span>
                      팔레트 1개 <b>{hzFmt(pq.perPallet)}{unit}</b>
                      {res.ok && !res.excluded && pq.total > 0 && <> (= {hzFmt((pq.perPallet * (res.qty / pq.total)) / res.q)}배)</>}
                    </span>
                    <span>
                      용기 {hzFmt(pq.cans)}개 · 합계 <b>{hzFmt(pq.total)}{unit}</b>
                    </span>
                    <small>{pq.text}</small>
                  </>
                ) : (
                  <span className="hz-need">{pq.msg}</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function HazmatCalc({ st, setSt }) {
  const rows = st.rows && st.rows.length ? st.rows : [newRow({}, "r0")];
  const setRows = (r) => setSt({ ...st, rows: r });
  const t = hzTotal(rows.map((r) => ({ ...r, item: r.item })));
  const addQuick = (s) => {
    const r = newRow({ sub: s.id, item: s.item, unit: hzItem(s.item).u });
    const last = rows[rows.length - 1];
    if (last && !last.item && !last.sub && !last.amount) setRows([...rows.slice(0, -1), r]);
    else setRows([...rows, r]);
  };
  const LV = {
    none: ["", "물질과 수량을 입력하세요."],
    over: ["over", "지정수량 이상 — 제조소등(제조소·저장소·취급소)이 아닌 장소에서 저장·취급할 수 없으며, 제조소등 설치허가 대상입니다(위험물안전관리법 제5조제1항·제6조)."],
    small: ["small", "지정수량 미만 — 시·도 조례의 소량위험물 기준(통상 지정수량 1/5 이상 지정수량 미만) 적용 대상입니다(법 제4조). 관할 조례로 확인하세요."],
    under: ["under", "지정수량 1/5 미만 — 소량위험물 기준 적용 범위는 관할 시·도 조례로 확인하세요(법 제4조)."],
  };
  const [lc, lt] = LV[t.level];
  return (
    <div className="tl-body">
      <div className="tl-intro">
        CAS 번호나 물질명으로 위험물 품명을 찾고 저장·취급량을 입력하면, 위험물안전관리법 시행령 [별표1]의 지정수량으로 <b>품명별 배수와 합계</b>를 산정합니다. 둘 이상의 위험물은 배수를 합산합니다(법 제5조제5항).
      </div>

      <div className="hz-quick">
        <span>자주 쓰는 제4류</span>
        {HZ_QUICK.map((s) => (
          <button key={s.id} type="button" onClick={() => addQuick(s)}>
            {s.name.replace(/\(.*\)$/, "")}
          </button>
        ))}
      </div>

      {rows.map((r, i) => (
        <Row
          key={r.key}
          i={i}
          row={r}
          res={t.rows[i]}
          set={(p) => setRows(rows.map((x, j) => (j === i ? { ...x, ...p } : x)))}
          remove={() => setRows(rows.length > 1 ? rows.filter((_, j) => j !== i) : [newRow()])}
        />
      ))}

      <div className="tl-actions">
        <button type="button" className="w-reset" onClick={() => setRows([...rows, newRow()])}>
          + 위험물 추가
        </button>
        <button type="button" className="w-reset" onClick={() => setSt({ rows: [newRow()] })}>
          초기화
        </button>
      </div>

      <div className={`tl-result hz-total ${lc}`}>
        <div className="tl-big">
          지정수량 배수 합계 <b>{hzFmt(t.sum)}</b>배
        </div>
        {t.rows.some((r) => r.ok && !r.excluded) && (
          <ol className="tl-steps">
            {t.rows.map((r, i) =>
              r.ok && !r.excluded ? (
                <li key={i}>
                  {rows[i].sub ? hzSub(rows[i].sub).name : itemLabel(r.it)}: {r.pal ? `[팔레트] ${r.pal.text}${r.conv ? ` → ${r.conv}` : ""} → ` : ""}
                  {hzFmt(r.qty)}
                  {r.it.u} ÷ {Number(r.q).toLocaleString("ko-KR")}
                  {r.it.u} = {hzFmt(r.ratio)}
                </li>
              ) : null,
            )}
          </ol>
        )}
        <div className="hz-lv">{lt}</div>
        {t.pending > 0 && <div className="tl-need">입력이 덜 된 항목 {t.pending}개는 합계에서 빠졌습니다.</div>}
      </div>

      <details className="tl-ref">
        <summary>판정 기준·유의사항</summary>
        <ul>
          <li>지정수량: 위험물안전관리법 시행령 제3조 [별표1] &lt;개정 2024.4.30.&gt; — 제4류는 리터, 그 밖의 유별은 킬로그램</li>
          <li>배수 합산: 둘 이상의 위험물을 같은 장소에서 저장·취급하면 각 수량 ÷ 지정수량의 합계가 1 이상일 때 지정수량 이상으로 봄(법 제5조제5항)</li>
          <li>제4류 품명: 특수인화물(발화점 100℃ 이하 또는 인화점 −20℃ 이하·비점 40℃ 이하), 제1석유류(인화점 21℃ 미만), 제2석유류(21~70℃ 미만), 제3석유류(70~200℃ 미만), 제4석유류(200~250℃ 미만), 알코올류(탄소수 1~3 포화1가, 60wt% 이상), 동식물유류(인화점 250℃ 미만) — 비고 12~18</li>
          <li>도료류 등은 가연성 액체량 40wt% 이하 등 제외 단서가 있음(비고 15~17), 화장품·의약품 등 운반용기 저장 제외(비고 11 단서)</li>
          <li>물질 목록의 분류는 별표1 비고의 예시·정의에 따른 일반적 분류입니다. 혼합물·제품은 MSDS의 인화점·시험결과로 확인하고, 판정이 어려우면 시험기관 시험 결과(비고 26)를 따릅니다.</li>
          <li>CAS 번호는 대표값이며 석유제품(휘발유·경유 등)은 제품마다 다를 수 있습니다. 기체(LPG·도시가스 등)는 위험물이 아닙니다.</li>
        </ul>
      </details>
    </div>
  );
}

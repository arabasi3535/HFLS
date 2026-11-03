import { useMemo } from "react";
import { USES, USE_GROUPS, getUse } from "../law/uses";

export const EMPTY_INPUT = {
  action: "new",
  date: "",
  date2: "",
  extExceptions: {},
  useChangeReduce: false,
  use: "",
  area: "",
  gf: "",
  bf: "0",
  occ: "",
  useArea: "",
  floors: [],
  f: {},
};

/** 지상·지하 층수에 맞춰 층별 행을 생성(기존 값 보존) */
export function syncFloors(input) {
  const gf = Math.max(0, Math.min(200, parseInt(input.gf, 10) || 0));
  const bf = Math.max(0, Math.min(20, parseInt(input.bf, 10) || 0));
  const prev = new Map((input.floors || []).map((f) => [f.level, f]));
  const list = [];
  for (let i = bf; i >= 1; i--) list.push(prev.get(-i) || { level: -i, area: "", windowless: false });
  for (let i = 1; i <= gf; i++) list.push(prev.get(i) || { level: i, area: "", windowless: false });
  return list;
}

const floorLabel = (lv) => (lv < 0 ? `지하 ${-lv}층` : `지상 ${lv}층`);

function Field({ label, hint, children, req }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {req && <em className="req">*</em>}
      </span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label className="check">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export default function InputPanel({ input, setInput, onRun, onReset, onExample, errors }) {
  const set = (k, v) => setInput((p) => ({ ...p, [k]: v }));
  const setF = (k, v) => setInput((p) => ({ ...p, f: { ...p.f, [k]: v } }));
  const setEx = (k, v) => setInput((p) => ({ ...p, extExceptions: { ...p.extExceptions, [k]: v } }));
  const u = getUse(input.use);
  const g = (...k) => !!u && k.some((kk) => u.g.includes(kk));

  const grouped = useMemo(
    () => USE_GROUPS.map((gr) => ({ ...gr, items: USES.filter((x) => x.no === gr.no) })).filter((gr) => gr.items.length),
    []
  );

  const setLevels = (k, v) =>
    setInput((p) => {
      const next = { ...p, [k]: v };
      return { ...next, floors: syncFloors(next) };
    });
  const setFloor = (i, k, v) =>
    setInput((p) => {
      const floors = p.floors.map((f, j) => (j === i ? { ...f, [k]: v } : f));
      return { ...p, floors };
    });
  const fillAll = () => {
    const v = window.prompt("모든 층에 동일하게 입력할 바닥면적(㎡)");
    if (v === null) return;
    setInput((p) => ({ ...p, floors: p.floors.map((f) => ({ ...f, area: v })) }));
  };
  const fillFromArea = () => {
    setInput((p) => {
      const n = p.floors.length || 1;
      const a = parseFloat(p.area);
      if (!a) return p;
      const each = Math.round((a / n) * 100) / 100;
      return { ...p, floors: p.floors.map((f) => ({ ...f, area: String(each) })) };
    });
  };

  const dateLabel =
    input.action === "new" ? "건축허가등 신청(신고)일" : "최초 건축허가등 신청일(기존 부분)";

  return (
    <div className="panel input-panel">
      <section>
        <h3>1. 적용 기준 시점</h3>
        <div className="seg">
          {[
            ["new", "신축"],
            ["extension", "증축"],
            ["usechange", "용도변경"],
          ].map(([k, l]) => (
            <button key={k} type="button" className={input.action === k ? "on" : ""} onClick={() => set("action", k)}>
              {l}
            </button>
          ))}
        </div>
        <Field label={dateLabel} req hint="부칙은 대부분 '허가·협의를 신청하거나 신고하는 경우부터 적용'으로 규정 — 사용승인일이 아닌 신청일 기준">
          <input type="date" value={input.date} onChange={(e) => set("date", e.target.value)} className={errors.date ? "err" : ""} />
        </Field>
        {errors.date && <div className="errmsg">{errors.date}</div>}
        {input.action !== "new" && (
          <>
            <Field label={input.action === "extension" ? "증축 허가등 신청일" : "용도변경 허가·신고일"} req>
              <input type="date" value={input.date2} onChange={(e) => set("date2", e.target.value)} className={errors.date2 ? "err" : ""} />
            </Field>
            {errors.date2 && <div className="errmsg">{errors.date2}</div>}
            {input.action === "extension" ? (
              <div className="subbox">
                <div className="subbox-t">기존 부분과 증축 부분의 구획 (시행령 제15조제1항 단서)</div>
                <Check checked={input.extExceptions.fireproof} onChange={(v) => setEx("fireproof", v)}>내화구조 바닥·벽으로 구획</Check>
                <Check checked={input.extExceptions.shutter} onChange={(v) => setEx("shutter", v)}>자동방화셔터로 구획</Check>
                <Check checked={input.extExceptions.door60plus} onChange={(v) => setEx("door60plus", v)}>60분+ 방화문으로 구획</Check>
                <Check checked={input.extExceptions.door60} onChange={(v) => setEx("door60", v)}>60분 방화문으로 구획 (2022.12.1. 이후 증축 신청분)</Check>
                <Check checked={input.extExceptions.restroom33} onChange={(v) => setEx("restroom33", v)}>화재위험 낮은 대상물 내 33㎡ 이하 직원휴게실 증축</Check>
                <Check checked={input.extExceptions.canopy} onChange={(v) => setEx("canopy", v)}>캐노피(3면 이상 벽 없음) 설치</Check>
              </div>
            ) : (
              <div className="subbox">
                <Check checked={input.useChangeReduce} onChange={(v) => set("useChangeReduce", v)}>
                  구조·설비가 화재연소 확대요인 감소·피난/진압 용이하게 변경, 또는 고정 가연물 감소 (제15조제2항 단서)
                </Check>
              </div>
            )}
            <div className="field-hint">※ 아래 용도·규모는 증축·용도변경 후 기준으로 입력</div>
          </>
        )}
      </section>

      <section>
        <h3>2. 용도 (별표2)</h3>
        <Field label="특정소방대상물 용도" req>
          <select value={input.use} onChange={(e) => set("use", e.target.value)} className={errors.use ? "err" : ""}>
            <option value="">— 선택 —</option>
            {grouped.map((gr) => (
              <optgroup key={gr.no} label={`${gr.no === "-" ? "" : gr.no + ". "}${gr.label}`}>
                {gr.items.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        {errors.use && <div className="errmsg">{errors.use}</div>}
      </section>

      <section>
        <h3>3. 규모</h3>
        <div className="grid2">
          <Field label="연면적(㎡)" req>
            <input type="number" inputMode="decimal" value={input.area} onChange={(e) => set("area", e.target.value)} className={errors.area ? "err" : ""} />
          </Field>
          <Field label="해당 용도 바닥면적 합계(㎡)" hint="미입력 시 연면적으로 간주">
            <input type="number" inputMode="decimal" value={input.useArea} onChange={(e) => set("useArea", e.target.value)} />
          </Field>
          <Field label="지상 층수" req hint="건축법 시행령 제119조 층수">
            <input type="number" inputMode="numeric" value={input.gf} onChange={(e) => setLevels("gf", e.target.value)} className={errors.gf ? "err" : ""} />
          </Field>
          <Field label="지하 층수">
            <input type="number" inputMode="numeric" value={input.bf} onChange={(e) => setLevels("bf", e.target.value)} />
          </Field>
          <Field label="수용인원(명)" hint="시행령 별표7 산정">
            <input type="number" inputMode="numeric" value={input.occ} onChange={(e) => set("occ", e.target.value)} />
          </Field>
        </div>
        {(errors.area || errors.gf) && <div className="errmsg">{errors.area || errors.gf}</div>}
      </section>

      <section>
        <div className="sec-head">
          <h3>4. 층별 바닥면적</h3>
          <div className="mini-btns">
            <button type="button" onClick={fillFromArea} disabled={!input.floors.length}>
              연면적 균등분할
            </button>
            <button type="button" onClick={fillAll} disabled={!input.floors.length}>
              일괄 입력
            </button>
          </div>
        </div>
        {input.floors.length === 0 ? (
          <div className="field-hint">지상·지하 층수를 입력하면 층별 입력란이 생성됩니다.</div>
        ) : (
          <div className="floor-table">
            <div className="ft-head">
              <span>층</span>
              <span>바닥면적(㎡)</span>
              <span>무창층</span>
            </div>
            {input.floors.map((fl, i) => (
              <div className="ft-row" key={fl.level}>
                <span>{floorLabel(fl.level)}</span>
                <input type="number" inputMode="decimal" value={fl.area} onChange={(e) => setFloor(i, "area", e.target.value)} />
                {fl.level > 0 ? (
                  <input type="checkbox" checked={!!fl.windowless} onChange={(e) => setFloor(i, "windowless", e.target.checked)} aria-label="무창층" />
                ) : (
                  <span className="muted">—</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <details className="details" open={!!u}>
          <summary>
            <h3>5. 세부 조건</h3>
            <span className="muted">해당하는 것만 입력</span>
          </summary>
          <div className="cond-group">
            <div className="cg-t">공통</div>
            <div className="grid2">
              <Field label="건축물 내부 차고·주차장(㎡)">
                <input type="number" value={input.f.parkingInside ?? ""} onChange={(e) => setF("parkingInside", e.target.value)} />
              </Field>
              <Field label="지하 차고·주차장 바닥면적(㎡)" hint="2026.3.1. 이후 신청분 기준">
                <input type="number" value={input.f.ugParking ?? ""} onChange={(e) => setF("ugParking", e.target.value)} />
              </Field>
              <Field label="기계식 주차 대수">
                <input type="number" value={input.f.mechCars ?? ""} onChange={(e) => setF("mechCars", e.target.value)} />
              </Field>
              <Field label="옥상 차고·주차장(㎡)">
                <input type="number" value={input.f.rooftopParking ?? ""} onChange={(e) => setF("rooftopParking", e.target.value)} />
              </Field>
              <Field label="전기실·발전실·변전실·통신기기실·전산실(㎡)" hint="하나의 방화구획 내 실은 합산">
                <input type="number" value={input.f.elecRoom ?? ""} onChange={(e) => setF("elecRoom", e.target.value)} />
              </Field>
            </div>
            <Check checked={input.f.specialStairs} onChange={(v) => setF("specialStairs", v)}>특별피난계단·비상용(피난용) 승강기 승강장 있음</Check>
            <Check checked={input.f.corridorApt} onChange={(v) => setF("corridorApt", v)}>갓복도형 아파트등</Check>
            <Check checked={input.f.co2} onChange={(v) => setF("co2", v)}>이산화탄소소화설비(호스릴 제외) 설치</Check>
            <Check checked={input.f.gasUse} onChange={(v) => setF("gasUse", v)}>가스시설(도시가스·LPG 등) 설치</Check>
            <Check checked={input.f.leak100A} onChange={(v) => setF("leak100A", v)}>계약전류 100A 초과 + 라스(철망) 비내화구조</Check>
            <Check checked={input.f.workers50} onChange={(v) => setF("workers50", v)}>근로자 50명 이상 옥내 작업장</Check>
            <Check checked={input.f.staffed24} onChange={(v) => setF("staffed24", v)}>방재실 등 수신기 설치장소 24시간 상주</Check>
            <Check checked={input.f.roadDirect} onChange={(v) => setF("roadDirect", v)}>지하층이 피난층이고 주출입구가 도로와 접함(연결살수 제외)</Check>
          </div>

          {g("culture", "religion", "sports", "entertain") && (
            <div className="cond-group">
              <div className="cg-t">문화·집회·종교·운동</div>
              <div className="grid2">
                <Field label="무대부 바닥면적(㎡)">
                  <input type="number" value={input.f.stageArea ?? ""} onChange={(e) => setF("stageArea", e.target.value)} />
                </Field>
                {g("cinema") && (
                  <Field label="영화상영관 바닥면적(㎡)">
                    <input type="number" value={input.f.cinemaArea ?? ""} onChange={(e) => setF("cinemaArea", e.target.value)} />
                  </Field>
                )}
              </div>
              <Check checked={input.f.stageUG} onChange={(v) => setF("stageUG", v)}>무대부가 지하층·무창층·4층 이상에 있음</Check>
              {g("cinema") && <Check checked={input.f.cinemaUG} onChange={(v) => setF("cinemaUG", v)}>영화상영관이 지하층·무창층에 있음</Check>}
            </div>
          )}

          {g("clinic", "medical", "noyu") && (
            <div className="cond-group">
              <div className="cg-t">의료·노유자</div>
              {g("clinic") && <Check checked={input.f.inpatient} onChange={(v) => setF("inpatient", v)}>입원실 있음</Check>}
              {g("clinic") && <Check checked={input.f.dialysis} onChange={(v) => setF("dialysis", v)}>인공신장실 있음</Check>}
              <Check checked={input.f.bars} onChange={(v) => setF("bars", v)}>창살 설치(화재 시 자동 개방 구조 제외)</Check>
            </div>
          )}

          {g("lodging") && (
            <div className="cond-group">
              <div className="cg-t">숙박</div>
              <Check checked={input.f.cooking} onChange={(v) => setF("cooking", v)}>취사 가능(생활숙박시설) — 2013~2022 간이스프링클러 기준</Check>
            </div>
          )}

          <div className="cond-group">
            <div className="cg-t">주방 (상업용 주방자동소화장치)</div>
            <Check checked={input.f.bigstoreRestaurant} onChange={(v) => setF("bigstoreRestaurant", v)}>대규모점포에 입점한 일반음식점</Check>
            <Check checked={input.f.groupCafeteria} onChange={(v) => setF("groupCafeteria", v)}>집단급식소(식품위생법)</Check>
          </div>

          {g("factory", "warehouse") && (
            <div className="cond-group">
              <div className="cg-t">공장·창고</div>
              <div className="grid2">
                <Field label="특수가연물(지정수량 배수)">
                  <input type="number" value={input.f.combustibleTimes ?? ""} onChange={(e) => setF("combustibleTimes", e.target.value)} />
                </Field>
                <Field label="랙식 창고 부분(천장 10m 초과)(㎡)">
                  <input type="number" value={input.f.rackArea ?? ""} onChange={(e) => setF("rackArea", e.target.value)} />
                </Field>
                <Field label="방사성폐기물 저장시설">
                  <select value={input.f.radwaste ?? ""} onChange={(e) => setF("radwaste", e.target.value)}>
                    <option value="">해당 없음</option>
                    <option value="withWater">소화수 수집·처리설비 있음</option>
                    <option value="noWater">소화수 수집·처리설비 없음</option>
                  </select>
                </Field>
              </div>
              <Check checked={input.f.nonFireproof} onChange={(v) => setF("nonFireproof", v)}>지붕 또는 외벽이 불연재료가 아니거나 내화구조가 아님</Check>
              {g("factory") && <Check checked={input.f.lithium} onChange={(v) => setF("lithium", v)}>리튬 1차전지 제조 공장</Check>}
            </div>
          )}

          {g("row", "multi", "apt", "school") && (
            <div className="cond-group">
              <div className="cg-t">공동주택·학교</div>
              {g("row", "multi") && (
                <Field label="세대수" hint="50세대 미만 연립·다세대는 내부주차장 물분무등 제외(2017.1.28.~)">
                  <input type="number" value={input.f.households ?? ""} onChange={(e) => setF("households", e.target.value)} />
                </Field>
              )}
              {g("apt") && (
                <Check checked={input.f.nationalHousingShelter} onChange={(v) => setF("nationalHousingShelter", v)}>
                  국민주택규모 이하 아파트등 — 지하층이 대피시설 전용(연결살수 700㎡)
                </Check>
              )}
            </div>
          )}

          {g("tunnel", "gas") && (
            <div className="cond-group">
              <div className="cg-t">터널·가스시설</div>
              <div className="grid2">
                {g("tunnel") && (
                  <Field label="터널 길이(m)" hint="연결송수관 500m 기준은 설계용역 입찰공고일을 기준일로 입력">
                    <input type="number" value={input.f.tunnelLen ?? ""} onChange={(e) => setF("tunnelLen", e.target.value)} />
                  </Field>
                )}
                {g("gas") && (
                  <Field label="지상 노출 탱크 저장용량 합계(톤)">
                    <input type="number" value={input.f.gasTankTon ?? ""} onChange={(e) => setF("gasTankTon", e.target.value)} />
                  </Field>
                )}
              </div>
            </div>
          )}
        </details>
      </section>

      <div className="actions">
        <button type="button" className="btn-primary" onClick={onRun}>
          판정 실행
        </button>
        <button type="button" className="btn" onClick={onExample}>
          예시
        </button>
        <button type="button" className="btn" onClick={onReset}>
          초기화
        </button>
      </div>
    </div>
  );
}

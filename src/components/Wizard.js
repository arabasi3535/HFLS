import { useMemo, useState } from "react";
import { USES, USE_GROUPS, getUse } from "../law/uses";
import { D, getLawSystem } from "../law/sources";
import { tableRef } from "../law/engine";

// ============================================================
// 입력 마법사 — ① (기존) 건축허가일 → ② 대상물 분류(별표2 대분류) → ③ 규모 → ④ 세부 사항
// ============================================================

export const EMPTY = {
  action: "new",
  date: "",
  grp: "",
  use: "",
  area: "",
  gf: "",
  bf: "0",
  occ: "",
  useArea: "",
  floors: [],
  f: {},
  completed: "",
  extExceptions: {},
};

export function syncFloors(input) {
  const gf = Math.max(0, Math.min(200, parseInt(input.gf, 10) || 0));
  const bf = Math.max(0, Math.min(20, parseInt(input.bf, 10) || 0));
  const prev = new Map((input.floors || []).map((f) => [f.level, f]));
  const list = [];
  for (let i = bf; i >= 1; i--) list.push(prev.get(-i) || { level: -i, area: "", windowless: false });
  for (let i = 1; i <= gf; i++) list.push(prev.get(i) || { level: i, area: "", windowless: false });
  return list;
}

/** 기준일에 따른 대분류 명칭(연혁) */
export function groupLabel(no, label, date) {
  if (!date) return label;
  if (no === "29" && date < "2024-05-17") return "문화재";
  return label;
}

/** 대분류 안의 세부 용도 (짧은 이름) */
const SHORT = {
  apt: "아파트등(5층 이상)", row: "연립주택", multi: "다세대주택", dorm: "기숙사",
  neigh: "일반 근린생활", bath: "목욕장", clinic: "의원·치과의원·한의원", midwife: "조산원·산후조리원",
  culture: "집회장·관람장·전시장", perf: "공연장", cinema: "영화상영관", zoo: "동·식물원",
  religion: "종교시설",
  retail: "도매·소매시장·상점", bigstore: "대규모점포", market: "전통시장",
  transport: "일반 운수시설", terminal: "버스정류장·공항·항만", station: "철도 지하역사",
  hosp: "종합병원·병원·치과·한방병원", nursing: "요양병원", mental: "정신의료기관", rehab: "장애인 의료재활시설",
  school: "학교", edu: "학원·교육원·연구소", library: "도서관", edu_dorm: "기숙사·합숙소",
  noyu_res: "노인 생활시설 (요양원·주야간보호·단기보호 등)", noyu_res2: "그 밖의 생활시설 (아동·장애인 거주시설 등)",
  noyu: "이용시설 (어린이집·경로당·복지관 등)", kinder: "유치원",
  training: "숙박 없는 수련시설", training_lodge: "숙박 가능 수련시설 (유스호스텔 등)",
  sports: "운동시설", office: "일반 업무시설", officetel: "오피스텔",
  lodging: "일반·생활숙박·고시원", hotel: "관광호텔", entertain: "일반 위락시설", dance: "무대 있는 유흥주점",
  factory: "공장", warehouse: "창고·하역장·집배송시설", logistics: "물류터미널",
  hazmat: "제조소등", gas: "가스시설", aircar: "정비공장·세차장 등", hangar: "항공기 격납고", parking: "주차용 건축물",
  animal: "동·식물 관련 시설", cattle: "축사", recycle: "자원순환 관련 시설", waste: "폐기물 재활용·처분시설",
  correction: "교정시설", military: "국방·군사시설", broadcast: "방송통신시설 (데이터센터 포함)", bstation: "방송국",
  power: "발전시설", ess: "전기저장시설(ESS)", cemetery: "묘지 관련 시설", tourist: "관광 휴게시설", funeral: "장례시설",
  ugmall: "지하상가", tunnel: "터널", ugduct: "전력·통신 지하구", commonduct: "공동구",
  heritage: "목조 국가유산(보물·국보)", mixed: "복합건축물", mixed_res: "주택 겸용 복합건축물",
  house: "단독주택",
};
/** 2012.2.5. 전(노유자 생활시설 구분 도입 전) 명칭 — 당시는 모두 '노유자시설'이지만 2012 부칙 소급 판정을 위해 구분 */
const SHORT_PRE12 = {
  noyu_res: "노인요양·주야간보호 등 (당시 노유자시설)",
  noyu_res2: "아동·장애인 거주시설 등 (당시 노유자시설)",
  noyu: "어린이집·경로당·복지관 등",
};
export const subName = (u, date) => (date && date < D.B12 && SHORT_PRE12[u.id]) || SHORT[u.id] || u.name;
const subUses = (no) => USES.filter((u) => u.no === no);

function Field({ label, hint, children, req }) {
  return (
    <label className="w-field">
      <span className="w-label">
        {label}
        {req && <em className="req">*</em>}
      </span>
      {children}
      {hint && <span className="w-hint">{hint}</span>}
    </label>
  );
}
function Check({ checked, onChange, children }) {
  return (
    <label className="w-check">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}
const Num = ({ value, onChange, placeholder }) => (
  <input type="number" inputMode="decimal" value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
);

export default function Wizard({ mode, input, setInput, onReset, errors }) {
  const [showMore, setShowMore] = useState(false);
  const set = (k, v) => setInput((p) => ({ ...p, [k]: v }));
  const setF = (k, v) => setInput((p) => ({ ...p, f: { ...p.f, [k]: v } }));
  const setLevels = (k, v) =>
    setInput((p) => {
      const next = { ...p, [k]: v };
      return { ...next, floors: syncFloors(next) };
    });
  const setFloor = (i, k, v) => setInput((p) => ({ ...p, floors: p.floors.map((f, j) => (j === i ? { ...f, [k]: v } : f)) }));
  const fillEven = () =>
    setInput((p) => {
      const n = p.floors.length || 1;
      const a = parseFloat(p.area);
      if (!a) return p;
      const each = Math.round((a / n) * 100) / 100;
      return { ...p, floors: p.floors.map((f) => ({ ...f, area: String(each) })) };
    });

  const isExisting = mode === "existing";
  const date = input.date;
  const dateReady = !isExisting || !!date;
  const u = getUse(input.use);
  const g = (...k) => !!u && k.some((kk) => u.g.includes(kk));
  const subs = useMemo(() => (input.grp ? subUses(input.grp) : []), [input.grp]);
  const sys = isExisting && date ? getLawSystem(date) : null;
  const noFloors = g("tunnel", "ugduct", "commonduct");
  const between = (a, b) => isExisting && date >= a && date < b;

  const chooseGroup = (no) => {
    const list = subUses(no);
    setInput((p) => ({ ...p, grp: no, use: list.length ? list[0].id : "", f: {}, occ: "", useArea: "" }));
  };

  // 해당 대상물에서 의미 있는 세부 입력만 표시
  const need = {
    occ:
      (g("culture", "religion", "sports", "retail", "transport", "logistics", "training_lodge", "ugmall") && !g("zoo")) ||
      (g("noyu") && between(D.P01, D.A)),
    stage: g("culture", "religion", "sports") && !g("zoo"),
    cinema: g("cinema"),
    clinic: g("clinic"),
    bars: g("noyu", "mental", "rehab", "nursing"),
    noyuHouse: g("noyu_res") && !g("noyu_elder") && !(isExisting && date && date < D.B12),
    factoryWare: g("factory", "warehouse"),
    rack: g("warehouse"),
    gasTank: g("gas"),
    gasUse: g("lodging", "noyu", "retail", "training", "medical", "culture", "sports", "religion", "transport", "logistics", "funeral", "factory"),
    tunnel: g("tunnel"),
    apt: g("apt"),
    households: g("apt", "row", "multi", "mixed_res"),
    cooking: g("lodging") && between(D.B13, D.C),
    unmanned: g("office", "factory", "warehouse", "military", "power") && between(D.A, D.C),
    bigstore: g("bigstore"),
    lithium: g("factory"),
    radwaste: g("hazmat", "warehouse", "factory"),
    useArea: !!u && !g("house", "apt", "row", "multi", "tunnel", "ugduct", "heritage"),
    completed: isExisting && g("noyu_res", "hosp", "nursing", "commonduct"),
  };

  return (
    <div className="wizard">
      {isExisting && (
        <section className="w-step">
          <div className="w-step-h">
            <span className="w-no">1</span>건축허가일
          </div>
          <Field label="최초 건축허가(설계허가)일" req hint="건축물대장의 허가일 — 건축허가등 신청일 기준으로 당시 법령을 적용합니다.">
            <input type="date" value={date} onChange={(e) => set("date", e.target.value)} className={errors.date ? "err" : ""} />
          </Field>
          {errors.date && <div className="w-err">{errors.date}</div>}
          {date && (
            <div className="w-era">
              {date < D.P92 ? (
                <span>1992.7.28. 이전은 지원하지 않습니다(참고값만 표시).</span>
              ) : (
                <>
                  <b>{sys ? sys.label.replace(" (현행)", "") : ""}</b>
                  <span>{tableRef(date)}</span>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {dateReady && (
        <section className="w-step">
          <div className="w-step-h">
            <span className="w-no">{isExisting ? 2 : 1}</span>대상물 분류
          </div>
          <select className={`w-big ${errors.use ? "err" : ""}`} value={input.grp} onChange={(e) => chooseGroup(e.target.value)}>
            <option value="">— 별표2 용도 선택 —</option>
            {USE_GROUPS.filter((x) => x.no !== "-").map((x) => (
              <option key={x.no} value={x.no}>
                {x.no}. {groupLabel(x.no, x.label, isExisting ? date : "")}
              </option>
            ))}
            <option value="-">단독주택 (특정소방대상물 아님)</option>
          </select>
          {errors.use && <div className="w-err">{errors.use}</div>}
        </section>
      )}

      {dateReady && input.grp && (
        <section className="w-step">
          <div className="w-step-h">
            <span className="w-no">{isExisting ? 3 : 2}</span>규모
          </div>
          {g("tunnel") ? (
            <Field label="터널 길이(m)" req hint="연결송수관 500m 기준은 설계용역 입찰공고일을 기준일로 봅니다.">
              <Num value={input.f.tunnelLen} onChange={(v) => setF("tunnelLen", v)} />
            </Field>
          ) : noFloors ? (
            <div className="w-hint">지하구는 규모 입력 없이 판정합니다.</div>
          ) : (
            <>
              <div className="w-grid3">
                <Field label="지상 층수" req>
                  <input type="number" value={input.gf} onChange={(e) => setLevels("gf", e.target.value)} className={errors.gf ? "err" : ""} />
                </Field>
                <Field label="지하 층수">
                  <input type="number" value={input.bf} onChange={(e) => setLevels("bf", e.target.value)} />
                </Field>
                <Field label="연면적(㎡)" req>
                  <input type="number" value={input.area} onChange={(e) => set("area", e.target.value)} className={errors.area ? "err" : ""} />
                </Field>
              </div>
              {(errors.gf || errors.area) && <div className="w-err">{errors.gf || errors.area}</div>}
              {input.floors.length > 0 && (
                <div className="w-floors">
                  <div className="w-floors-h">
                    <span>층별 바닥면적</span>
                    <button type="button" className="w-link" onClick={fillEven}>
                      연면적 균등 분할
                    </button>
                  </div>
                  <div className="w-ft">
                    <div className="w-ft-row w-ft-head">
                      <span>층</span>
                      <span>바닥면적(㎡)</span>
                      <span>무창층</span>
                    </div>
                    {input.floors.map((fl, i) => (
                      <div className="w-ft-row" key={fl.level}>
                        <span>{fl.level < 0 ? `지하 ${-fl.level}` : `${fl.level}층`}</span>
                        <input type="number" value={fl.area} onChange={(e) => setFloor(i, "area", e.target.value)} />
                        <input type="checkbox" checked={!!fl.windowless} disabled={fl.level < 0} onChange={(e) => setFloor(i, "windowless", e.target.checked)} />
                      </div>
                    ))}
                  </div>
                  <div className="w-hint">비워 둔 층은 연면적 범위 안에서 판정합니다. 무창층: 건축법 시행령 기준 개구부 면적 1/30 이하인 지상층.</div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {dateReady && input.grp && (
        <section className="w-step">
          <div className="w-step-h">
            <span className="w-no">{isExisting ? 4 : 3}</span>세부 사항
          </div>

          {subs.length > 1 && (
            <div className="w-subs">
              {subs.map((s) => (
                <button key={s.id} type="button" className={input.use === s.id ? "on" : ""} onClick={() => setInput((p) => ({ ...p, use: s.id }))}>
                  {subName(s, isExisting ? date : "")}
                </button>
              ))}
            </div>
          )}
          {input.grp === "9" && isExisting && date && date < D.B12 && (
            <div className="w-note">2012.2.5. 전에는 생활시설·이용시설 구분 없이 모두 「노유자시설」입니다. 실제 시설 종류를 고르면 당시 기준과 2012년 부칙 소급을 함께 판정합니다.</div>
          )}
          {g("row", "multi") && isExisting && date < D.C24 &&<div className="w-note">2024.12.1. 전 허가 연립·다세대주택은 특정소방대상물이 아닙니다(주택용소방시설 대상).</div>}
          {g("house") && <div className="w-note">단독주택은 특정소방대상물이 아니며 주택용소방시설(소화기·단독경보형 감지기) 대상입니다.</div>}

          <div className="w-grid2">
            {need.occ && (
              <Field label="수용인원(명)" hint="시행령 별표7 산정 — 비우면 면적으로 상한 추정">
                <Num value={input.occ} onChange={(v) => set("occ", v)} />
              </Field>
            )}
            {need.useArea && (
              <Field label="이 용도 바닥면적 합계(㎡)" hint="다른 용도와 함께 있는 건물만 입력">
                <Num value={input.useArea} onChange={(v) => set("useArea", v)} />
              </Field>
            )}
            {need.stage && (
              <Field label="무대부 바닥면적(㎡)" hint="없으면 0">
                <Num value={input.f.stageArea} onChange={(v) => setF("stageArea", v)} />
              </Field>
            )}
            {need.cinema && (
              <Field label="상영관 바닥면적(㎡)">
                <Num value={input.f.cinemaArea} onChange={(v) => setF("cinemaArea", v)} />
              </Field>
            )}
            {need.factoryWare && (
              <Field label="특수가연물(지정수량 배수)" hint="없으면 0">
                <Num value={input.f.combustibleTimes} onChange={(v) => setF("combustibleTimes", v)} />
              </Field>
            )}
            {need.rack && (
              <Field label="랙식 창고 부분(㎡)" hint="천장 10m 초과 랙식, 없으면 0">
                <Num value={input.f.rackArea} onChange={(v) => setF("rackArea", v)} />
              </Field>
            )}
            {need.gasTank && (
              <Field label="지상 노출 탱크 용량(톤)">
                <Num value={input.f.gasTankTon} onChange={(v) => setF("gasTankTon", v)} />
              </Field>
            )}
            {need.households && (
              <Field label={g("mixed_res") ? "주택 세대수" : "세대수"} hint={g("apt") ? "전용구역 100세대 · 의무관리대상 150/300세대(단지 전체)" : "의무관리대상 공동주택 판정(단지 전체 세대수)"}>
                <Num value={input.f.households} onChange={(v) => setF("households", v)} />
              </Field>
            )}
            {need.completed && (
              <Field label="사용승인일(완공일)" hint="부칙 소급 대상 판정용">
                <input type="date" value={input.completed || ""} onChange={(e) => set("completed", e.target.value)} />
              </Field>
            )}
          </div>

          <div className="w-checks">
            {need.stage && <Check checked={input.f.stageUG} onChange={(v) => setF("stageUG", v)}>무대부가 지하층·무창층·4층 이상에 있음</Check>}
            {need.cinema && <Check checked={input.f.cinemaUG} onChange={(v) => setF("cinemaUG", v)}>상영관이 지하층·무창층에 있음</Check>}
            {need.clinic && <Check checked={input.f.inpatient} onChange={(v) => setF("inpatient", v)}>입원실 있음</Check>}
            {need.clinic && <Check checked={input.f.dialysis} onChange={(v) => setF("dialysis", v)}>인공신장실 있음</Check>}
            {need.bars && <Check checked={input.f.bars} onChange={(v) => setF("bars", v)}>탈출 방지용 창살 설치(자동 개방 구조 제외)</Check>}
            {need.noyuHouse && <Check checked={input.f.noyuInHouse} onChange={(v) => setF("noyuInHouse", v)}>단독주택·공동주택 안에 설치된 시설</Check>}
            {need.factoryWare && <Check checked={input.f.nonFireproof} onChange={(v) => setF("nonFireproof", v)}>지붕·외벽이 불연재료·내화구조가 아님</Check>}
            {g("factory") && <Check checked={input.f.workers50} onChange={(v) => setF("workers50", v)}>상시 근로자 50명 이상 옥내 작업장</Check>}
            {need.lithium && <Check checked={input.f.lithium} onChange={(v) => setF("lithium", v)}>리튬 1차전지 제조 공장</Check>}
            {need.gasUse && <Check checked={input.f.gasUse} onChange={(v) => setF("gasUse", v)}>가스시설(도시가스·LPG) 사용</Check>}
            {need.apt && <Check checked={input.f.nationalHousingShelter} onChange={(v) => setF("nationalHousingShelter", v)}>국민주택규모 이하 — 지하층이 대피시설 전용</Check>}
            {need.apt && <Check checked={input.f.corridorApt} onChange={(v) => setF("corridorApt", v)}>갓복도형 아파트</Check>}
            {need.cooking && <Check checked={input.f.cooking} onChange={(v) => setF("cooking", v)}>취사 가능(생활숙박시설)</Check>}
            {need.unmanned && <Check checked={input.f.unmanned} onChange={(v) => setF("unmanned", v)}>야간 무인경비시스템으로 관리</Check>}
            {need.bigstore && <Check checked={input.f.bigstoreRestaurant} onChange={(v) => setF("bigstoreRestaurant", v)}>입점 일반음식점 있음(후드·덕트 주방)</Check>}
          </div>

          {!g("house") && (
            <>
              <div className="w-sub-h">안전관리 검토용 (소방안전관리대상물·방염·전용구역)</div>
              <div className="w-grid2">
                {!noFloors && (
                  <Field label="건축물 높이(m)" hint="지상으로부터 높이 — 특급·1급(120m·200m) 판정, 20층 이상이면 입력">
                    <Num value={input.f.height} onChange={(v) => setF("height", v)} />
                  </Field>
                )}
                {g("gas", "factory", "warehouse") && (
                  <Field label="가연성 가스 저장·취급량(톤)" hint="1급 1천톤 이상 / 2급 100톤 이상 — 없으면 0">
                    <Num value={input.f.gasTon} onChange={(v) => setF("gasTon", v)} />
                  </Field>
                )}
                {g("edu_dorm") && (
                  <Field label="합숙소·기숙사 구분" hint="학교 기숙사는 공동주택 기숙사(별표2 교육연구시설에는 합숙소만 있음)">
                    <select value={input.f.eduDormType || ""} onChange={(e) => setF("eduDormType", e.target.value || undefined)}>
                      <option value="">— 선택 —</option>
                      <option value="hapsuk">합숙소(교육연구시설)</option>
                      <option value="dorm">기숙사(학교 기숙사 = 공동주택)</option>
                    </select>
                  </Field>
                )}
                {g("clinic") && (
                  <Field label="의원 종류" hint="방염: 치과의원·한의원은 2024.12.31. 이후 설치·교체분부터">
                    <select value={input.f.clinicType || ""} onChange={(e) => setF("clinicType", e.target.value || undefined)}>
                      <option value="">— 선택 —</option>
                      <option value="clinic">의원</option>
                      <option value="dental">치과의원</option>
                      <option value="oriental">한의원</option>
                    </select>
                  </Field>
                )}
                {g("midwife") && (
                  <Field label="조산원·산후조리원 구분">
                    <select value={input.f.midwifeType || ""} onChange={(e) => setF("midwifeType", e.target.value || undefined)}>
                      <option value="">— 선택 —</option>
                      <option value="midwife">조산원</option>
                      <option value="postnatal">산후조리원</option>
                    </select>
                  </Field>
                )}
                {g("neigh") && !g("clinic", "midwife", "bath") && (
                  <Field label="방염 대상 근린생활시설" hint="해당 없으면 비워 둠">
                    <select value={input.f.neighFlame || ""} onChange={(e) => setF("neighFlame", e.target.value || undefined)}>
                      <option value="">해당 없음</option>
                      <option value="gym">체력단련장</option>
                      <option value="perf">공연장</option>
                      <option value="religion">종교집회장</option>
                    </select>
                  </Field>
                )}
              </div>
              <div className="w-checks">
                <Check checked={input.f.publicOrg} onChange={(v) => setF("publicOrg", v)}>「공공기관의 소방안전관리에 관한 규정」 적용 대상(국가·지자체·공공기관 등)</Check>
                <Check checked={input.f.multiUse} onChange={(v) => setF("multiUse", v)}>다중이용업소 영업장 있음</Check>
                {g("culture", "religion", "sports") && (
                  <Check checked={input.f.outdoorFacility} onChange={(v) => setF("outdoorFacility", v)}>건축물 옥내에 있지 않은 시설(옥외 관람장 등)</Check>
                )}
                {g("sports") && <Check checked={input.f.poolOnly} onChange={(v) => setF("poolOnly", v)}>수영장</Check>}
                {g("broadcast") && !g("bstation") && <Check checked={input.f.studio} onChange={(v) => setF("studio", v)}>촬영소</Check>}
                {g("warehouse") && (
                  <Check checked={input.f.nonCombustibleStore} onChange={(v) => setF("nonCombustibleStore", v)}>철강 등 불연성 물품을 저장·취급하는 창고</Check>
                )}
                {g("gas", "factory", "warehouse") && (
                  <Check checked={input.f.cityGas} onChange={(v) => setF("cityGas", v)}>가스 제조설비를 갖추고 도시가스사업 허가를 받아야 하는 시설</Check>
                )}
                {g("apt", "row", "multi", "mixed_res") && (
                  <>
                    <Check checked={input.f.elevator} onChange={(v) => setF("elevator", v)}>승강기 설치(의무관리대상 150세대 기준)</Check>
                    <Check checked={input.f.centralHeat} onChange={(v) => setF("centralHeat", v)}>중앙집중식 난방(지역난방 포함)</Check>
                    <Check checked={input.f.mmConsent} onChange={(v) => setF("mmConsent", v)}>입주자등 동의로 의무관리대상 전환(공동주택관리법 제2조①2 마목)</Check>
                  </>
                )}
                {(g("apt", "dorm") || (g("edu_dorm") && input.f.eduDormType === "dorm")) && (
                  <Check checked={input.f.laneException} onChange={(v) => setF("laneException", v)}>
                    하나의 대지에 1개 동 + 정차·주차금지 편도 2차선 이상 도로에 직접 접해 도로에서 직접 소방활동 가능(전용구역 제외)
                  </Check>
                )}
              </div>
            </>
          )}

          {!g("house", "tunnel", "ugduct") && (
            <div className="w-more">
              <button type="button" className="w-link" onClick={() => setShowMore((v) => !v)}>
                {showMore ? "▾" : "▸"} 주차장·전기실 등 해당 시 입력
              </button>
              {showMore && (
                <div className="w-more-body">
                  <div className="w-grid2">
                    <Field label="건물 내부 차고·주차장(㎡)">
                      <Num value={input.f.parkingInside} onChange={(v) => setF("parkingInside", v)} />
                    </Field>
                    <Field label="지하 차고·주차장(㎡)">
                      <Num value={input.f.ugParking} onChange={(v) => setF("ugParking", v)} />
                    </Field>
                    <Field label="기계식 주차 대수">
                      <Num value={input.f.mechCars} onChange={(v) => setF("mechCars", v)} />
                    </Field>
                    <Field label="옥상 차고·주차장(㎡)">
                      <Num value={input.f.rooftopParking} onChange={(v) => setF("rooftopParking", v)} />
                    </Field>
                    <Field label="전기실·발전실·변전실·전산실(㎡)" hint="하나의 방화구획 안 합산">
                      <Num value={input.f.elecRoom} onChange={(v) => setF("elecRoom", v)} />
                    </Field>
                  </div>
                  <div className="w-checks">
                    <Check checked={input.f.specialStairs} onChange={(v) => setF("specialStairs", v)}>특별피난계단·비상용(피난용) 승강기 승강장 있음</Check>
                    <Check checked={input.f.co2} onChange={(v) => setF("co2", v)}>이산화탄소소화설비 설치(호스릴 제외)</Check>
                    <Check checked={input.f.groupCafeteria} onChange={(v) => setF("groupCafeteria", v)}>집단급식소 있음</Check>
                    <Check checked={input.f.lath} onChange={(v) => setF("lath", v)}>라스(철망) 비내화구조</Check>
                    <Check checked={input.f.leak100A} onChange={(v) => setF("leak100A", v)}>계약전류용량 100A 초과</Check>
                    <Check checked={input.f.roadDirect} onChange={(v) => setF("roadDirect", v)}>지하층이 피난층이고 주출입구가 도로에 접함</Check>
                    <Check checked={input.f.staffed24} onChange={(v) => setF("staffed24", v)}>수신기 설치 장소 24시간 근무자 있음</Check>
                    {need.radwaste && (
                      <label className="w-check">
                        <span>방사성폐기물 저장시설</span>
                        <select value={input.f.radwaste ?? ""} onChange={(e) => setF("radwaste", e.target.value || undefined)}>
                          <option value="">해당 없음</option>
                          <option value="withWater">소화수 처리설비 있음</option>
                          <option value="noWater">소화수 처리설비 없음</option>
                        </select>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="w-actions">
            <span className="w-live">입력하는 즉시 결과에 반영됩니다</span>
            <button type="button" className="w-reset" onClick={onReset}>
              초기화
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================
// 소방시설 설치기준 판정 규칙 (시기별 효력 구간 포함)  — v2.2
//
// 각 규칙(criterion)
//   id      : 고유 ID (관리자 검증메모 키)
//   fac     : 소방시설 키(facilities.js)
//   from/to : 효력 구간 [from, to) — 기준일(건축허가등 신청일)과 비교
//   fromU   : [a, b] 도입시점 불명확(a~b 사이) → 그 구간 판정은 [확인 필요]
//   toU     : [a, b] 폐지·변경시점 불명확
//   cert    : 'V' 법령 원문·부칙·법제처 제·개정이유 확인
//             'M' 소방특별조사 운영매뉴얼 「소방시설의 연도별 적용기준」 확인
//             'I' 시점 추정(대조 권장) / 'U' 미검증
//   src     : 근거 자료 키(sources.js)
//   cur     : 현행 별표4 세부번호(기준일 2022.12.1. 이후 표시)
//   when    : (ctx) => true | false | null(입력 부족)
//
// 대조 자료: S1(2004 초기 별표4), S2(2020.12.10. 별표5), S3(2025.11.25. 별표4),
//           법제처 제·개정이유, 현행 부칙, 운영매뉴얼(1968~2015 연도별 적용기준),
//           한국소방시설관리협회 법령집(2024.11.) 개정연혁, 2024 용도별 적용기준
//   cert 'M' = 연혁자료(운영매뉴얼·법령집) 확인
// ============================================================
import { D } from "./sources";
import { isNoyuRes, isNoyuGen } from "./uses";
import { ge, lt, between, or, and, num, fmt, T, F, U } from "./logic";

const INF = "9999-12-31";
// 자료 간 시행일 차이가 남는 구간(그 사이 기준일은 '설치(연혁 확인)'으로 하향)
const SPK6 = [D.B18a, D.B18b]; // 6층 이상 스프링클러: 부칙 계산 2018.1.27. / 2024 용도별 자료 2018.1.28.
const P99U = [D.P99, D.P99b]; // 1999 개정: 매뉴얼 1999.2.5. / 법령집 1999.7.29.(8.6. 시행)

const n0 = (v) => num(v) ?? 0; // 부가조건 수치: 미입력은 0(해당없음)으로 보고 체크리스트로 안내
const tunnelLen = (c) => (c.g("tunnel") ? num(c.f.tunnelLen) : 0);
// 해당 용도에서 판정에 필요한 선택 입력값: 미입력은 0이 아니라 '미확인(null)' → [확인 필요]. 해당 없으면 0 입력
const comb = (c) => num(c.f.combustibleTimes); // 공장·창고에서만 사용
const gasTon = (c) => num(c.f.gasTankTon); // 가스시설에서만 사용
const stageVal = (c) => (c.g("culture", "religion", "sports") && !c.g("zoo") ? num(c.f.stageArea) : 0);
const rackVal = (c) => (c.g("warehouse") ? num(c.f.rackArea) : n0(c.f.rackArea));
const ugpk = (c) => n0(c.f.ugParking);

const A = (s) => `연면적 ${fmt(s.x.area)}㎡`;
const UA = (s) => `해당 용도 바닥면적 합계 ${fmt(s.x.useArea)}㎡${s.x.useAreaAssumed ? "(미입력→연면적 적용)" : ""}`;
const GF = (s) => `지상 ${s.x.gf}층`;
const TF = (s) => `지하층 포함 ${s.x.totalFloors}층`;
const TL = (c) => `터널 길이 ${fmt(tunnelLen(c))}m`;

export const CRITERIA = [
  // ───────────────────────── 소화기구 ─────────────────────────
  {
    id: "ext-33", fac: "ext", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "1)",
    text: "연면적 33㎡ 이상", scope: "해당 대상물",
    when: (c) => ge(c.x.area, 33), basis: A,
  },
  {
    id: "ext-heritage-gas", fac: "ext", from: D.P92, to: INF, cert: "M", src: "manual,cur4", cur: "2)",
    text: "지정문화재(국가유산)·가스시설 (면적 무관)", scope: "해당 대상물",
    when: (c) => c.g("gas", "heritage"), basis: (c) => c.u.name,
  },
  {
    id: "ext-tunnel", fac: "ext", from: D.A, to: INF, cert: "M", src: "manual,cur4", cur: "3)",
    text: "터널 (2004.5.30.)", scope: "터널",
    when: (c) => c.g("tunnel"), basis: (c) => c.u.name,
  },
  {
    id: "ext-ess", fac: "ext", from: D.C22a, to: INF, cert: "M", src: "hist24,cur4", cur: "2)",
    text: "발전시설 중 전기저장시설 (2021.8.24. 개정, 2022.2.25. 시행)", scope: "해당 대상물",
    when: (c) => c.g("ess"), basis: (c) => c.u.name,
  },
  {
    id: "ext-duct", fac: "ext", from: D.S2, to: INF, cert: "V", src: "reasons,cur4", cur: "4)",
    text: "지하구 (2020.12.10. 시행, 기존 공동구는 부칙으로 2022.12.9.까지)", scope: "지하구",
    when: (c) => c.g("ugduct"), basis: (c) => c.u.name,
  },

  // ───────────────────────── 자동소화장치(자동식소화기) ─────────────────────────
  {
    id: "auto-apt94", fac: "autoext", from: D.P94b, to: D.P97, cert: "M", src: "manual,hist24", cur: "",
    text: "(소방법) 아파트로서 11층 이상인 것 — 11층 이상의 층 자동식소화기 (1994.12.28. 시행)", scope: "11층 이상의 층(각 세대 주방)",
    when: (c) => and(c.g("apt"), ge(c.x.gf, 11)), basis: GF,
  },
  {
    id: "auto-apt97", fac: "autoext", from: D.P97, to: D.APT05, cert: "M", src: "manual", cur: "",
    text: "(소방법) 아파트로서 11층 이상인 것 — 6층 이상의 층 자동식소화기 (1997.9.27.)", scope: "6층 이상의 층(각 세대 주방)",
    when: (c) => and(c.g("apt"), ge(c.x.gf, 11)), basis: GF,
  },
  {
    id: "auto-apt05", fac: "autoext", from: D.APT05, to: D.C, cert: "V", src: "manual,curDecree", cur: "",
    text: "아파트 각 세대 주방 자동식소화기(주방자동소화장치) — 2005.1.1. 시행(그 당시 완공·허가신청분은 종전 기준, 현행 부칙 제9조)", scope: "각 세대 주방",
    when: (c) => c.g("apt"), basis: (c) => c.u.name,
  },
  {
    id: "auto-ot30", fac: "autoext", from: D.B12, to: D.C, cert: "V", src: "manual,reasons", cur: "",
    text: "층수 30층 이상 오피스텔 모든 층 (2012.2.5.)", scope: "모든 층",
    when: (c) => and(c.g("officetel"), ge(c.x.gf, 30)), basis: GF,
  },
  {
    id: "auto-res", fac: "autoext", from: D.C, to: INF, cert: "V", src: "cur4", cur: "1)",
    text: "주거용 주방자동소화장치: 아파트등 및 오피스텔 모든 층", scope: "모든 층(후드·덕트 주방)",
    when: (c) => c.g("apt", "officetel"), basis: (c) => c.u.name,
  },
  {
    id: "auto-com", fac: "autoext", from: D.C23, to: INF, cert: "V", src: "cur4,curDecree", cur: "2)",
    text: "상업용 주방자동소화장치: 대규모점포 입점 일반음식점, 집단급식소 (2023.12.1. 이후 신청분)", scope: "해당 주방",
    when: (c) => !!(c.f.bigstoreRestaurant || c.f.groupCafeteria),
    basis: (c) => [c.f.bigstoreRestaurant && "대규모점포 입점 일반음식점", c.f.groupCafeteria && "집단급식소"].filter(Boolean).join(", "),
  },

  // ───────────────────────── 옥내소화전설비 ─────────────────────────
  {
    id: "hyd-1", fac: "hydrant", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "1)",
    text: "연면적 3천㎡ 이상(터널 제외) 또는 지하층·무창층(축사 제외, 2010.2.4.~)·4층 이상 층 중 바닥면적 600㎡ 이상인 층이 있는 것", scope: "모든 층",
    when: (c) =>
      c.g("gas", "ugduct") ? F
        : or(and(ge(c.x.area, 3000), !c.g("tunnel")), c.g("cattle") && c.d >= D.B10 ? F : c.x.ugOrWlGE(600), c.x.upper4GE(600)),
    basis: (c) => `${A(c)}, 지하·무창층 최대 ${fmt(c.x.ugOrWlMax)}㎡`,
  },
  {
    id: "hyd-2", fac: "hydrant", from: D.P92, to: INF, cert: "V", src: "manual,hist24,s2,cur4", cur: "2)",
    text: "근생·판매(영업)·운수·의료·노유자·업무·숙박·위락·공장·창고·항공기및자동차·방송통신(통신촬영)·복합 + (2011.7.7.~) 국방·군사시설·발전시설·장례시설: 연면적 1,500㎡ 이상 또는 지하층·무창층·4층 이상 층 중 바닥면적 300㎡ 이상인 층 (교정시설 미포함)", scope: "모든 층",
    when: (c) => {
      const cond = or(ge(c.x.area, 1500), c.x.ugOrWlGE(300), c.x.upper4GE(300));
      if (c.g("neigh", "retail", "transport", "medical", "noyu", "office", "lodging", "entertain", "factory", "warehouse", "aircar", "broadcast", "mixed")) return cond;
      if (c.g("military", "power", "funeral")) return c.d >= D.B11 ? cond : and(U, cond); // 2011.7.7. 전 당시 용도분류 확인 필요
      return F;
    },
    basis: (c) => `${A(c)}${c.g("military", "power", "funeral") && c.d < D.B11 ? " — 2011.7.7. 전에는 목록에 없음(당시 용도분류 확인)" : ""}`,
  },
  {
    id: "hyd-roof", fac: "hydrant", from: D.P97, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "3)",
    text: "건축물 옥상 차고·주차장 200㎡ 이상 (1997.9.27.)", scope: "해당 부분",
    when: (c) => ge(n0(c.f.rooftopParking), 200), basis: (c) => `옥상 주차장 ${fmt(n0(c.f.rooftopParking))}㎡`,
  },
  {
    id: "hyd-tunnel", fac: "hydrant", from: D.P97, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "4)",
    text: "터널 길이 1천m 이상 (1997.9.27.) — 2018.1.27.부터 행정안전부령 지정 터널 추가(2017.1.26. 개정 부칙: 공포 후 1년)", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 1000) : F), basis: TL,
  },
  {
    id: "hyd-comb", fac: "hydrant", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "5)",
    text: "공장·창고: 특수가연물 지정수량 750배 이상 저장·취급", scope: "해당 대상물",
    when: (c) => (c.g("factory", "warehouse") ? ge(comb(c), 750) : F), basis: (c) => `특수가연물 ${fmt(comb(c))}배`,
  },

  // ───────────────────────── 스프링클러설비 ─────────────────────────
  // (1) 1992.7.28.~2004.5.29. 소방법 시행령 (매뉴얼)
  {
    id: "spk-old-stage", fac: "spk", from: D.P92, to: D.A, cert: "M", src: "manual", cur: "",
    text: "(소방법) 관람집회 및 운동시설 무대부: 500㎡ 이상(지하층·무창층·4층 이상은 300㎡ 이상)", scope: "무대부",
    when: (c) => (c.g("culture", "sports") && !c.g("zoo") ? ge(stageVal(c), c.f.stageUG ? 300 : 500) : F),
    basis: (c) => `무대부 ${fmt(stageVal(c))}㎡`,
  },
  {
    id: "spk-old-retail92", fac: "spk", from: D.P92, to: D.P95, cert: "M", src: "manual", cur: "",
    text: "(소방법) 판매시설: 4층 이하 건축물 바닥면적 합계 9천㎡ 이상, 5층 이상 6천㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("retail") ? (c.x.gf <= 4 ? ge(c.x.useArea, 9000) : ge(c.x.useArea, 6000)) : F), basis: (c) => `${GF(c)}, ${UA(c)}`,
  },
  {
    id: "spk-old-retail95", fac: "spk", from: D.P95, to: D.A, cert: "M", src: "manual", cur: "",
    text: "(소방법) 판매시설: 3층 이하 건축물 바닥면적 합계 6천㎡ 이상, 4층 이상 5천㎡ 이상 (1995.8.10.)", scope: "모든 층",
    when: (c) => (c.g("retail") ? (c.x.gf <= 3 ? ge(c.x.useArea, 6000) : ge(c.x.useArea, 5000)) : F), basis: (c) => `${GF(c)}, ${UA(c)}`,
  },
  {
    id: "spk-old-hotel11", fac: "spk", from: D.P92, to: D.A, cert: "M", src: "manual", cur: "",
    text: "(소방법) 지하층 제외 층수 11층 이상인 여관·호텔 용도 층이 있는 경우 전 층", scope: "모든 층",
    when: (c) => (c.g("lodging") ? ge(c.x.gf, 11) : F), basis: GF,
  },
  {
    id: "spk-apt16", fac: "spk", from: D.P92, to: D.APT05, cert: "M", src: "manual", cur: "",
    text: "(종전) 아파트로서 지하층 제외 16층 이상의 층 — 2005.1.1.부터 11층 이상 전 층", scope: "16층 이상의 층",
    when: (c) => (c.g("apt") ? ge(c.x.gf, 16) : F), basis: GF,
  },
  {
    id: "spk-old-11f", fac: "spk", from: D.P92, to: D.A, cert: "M", src: "manual,hist24", cur: "",
    text: "(소방법) 층수 11층 이상인 것은 11층 이상의 층 (학교 제외, 1994.7.20.부터 아파트도 제외)", scope: "11층 이상의 층",
    when: (c) => (c.g("school", "lodging") || (c.g("apt") && c.d >= D.P94) ? F : ge(c.x.gf, 11)), basis: GF,
  },
  // (2) 2004.5.30. 이후
  {
    id: "spk-11f", fac: "spk", from: D.A, toU: SPK6, cert: "V", src: "manual,s1,reasons", cur: "",
    text: "층수 11층 이상 — 모든 층 (아파트는 2005.1.1.부터, 2005.11.11.부터 연면적·층높이 불변 아파트 리모델링 예외)", scope: "모든 층",
    when: (c) => (c.g("apt") && c.d < D.APT05 ? F : ge(c.x.gf, 11)), basis: GF,
  },
  {
    id: "spk-6f", fac: "spk", fromU: SPK6, to: INF, cert: "V", src: "hist24,use24,s2,cur4,reasons", cur: "1)",
    text: "층수 6층 이상 (모든 층) — 2017.1.26. 개정, 부칙상 공포 후 1년 경과한 날(2018.1.27.) 시행 — 단, 연면적·층높이 불변 아파트 리모델링, 스프링클러 없는 기존 대상물의 용도변경(일부 용도 제외)은 예외", scope: "모든 층",
    when: (c) => ge(c.x.gf, 6), basis: GF,
  },
  {
    id: "spk-dorm", fac: "spk", from: D.P95, to: INF, cert: "M", src: "manual,s1,s2,cur4", cur: "2)",
    text: "복합건축물 연면적 5천㎡ 이상(1995.8.10.), 교육연구·수련시설 내 학생 수용 기숙사 연면적 5천㎡ 이상(2004.5.30.)", scope: "모든 층",
    when: (c) => (c.g("mixed") || (c.g("dorm", "edu_dorm") && c.d >= D.A) ? ge(c.x.area, 5000) : F), basis: A,
  },
  {
    id: "spk-assembly", fac: "spk", from: D.A, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "3)",
    text: "문화집회(동·식물원 제외)·종교(목조 제외)·운동(물놀이형 등 제외): 수용인원 100명 이상, 영화상영관 지하·무창층 500㎡/그 밖 1천㎡ 이상, 무대부 지하·무창·4층 이상 300㎡/그 밖 500㎡ 이상", scope: "모든 층",
    when: (c) => {
      if (!(c.g("culture", "religion", "sports") && !c.g("zoo"))) return F;
      const cin = c.g("cinema") ? ge(num(c.f.cinemaArea) ?? c.x.useArea, c.f.cinemaUG ? 500 : 1000) : F;
      const stage = ge(stageVal(c), c.f.stageUG ? 300 : 500);
      return or(ge(c.x.occ, 100), cin, stage);
    },
    basis: (c) => `수용인원 ${fmt(c.x.occ)}명${c.g("cinema") ? `, 상영관 ${fmt(num(c.f.cinemaArea) ?? c.x.useArea)}㎡` : ""}${num(c.f.stageArea) ? `, 무대부 ${fmt(num(c.f.stageArea))}㎡` : ""}`,
  },
  {
    id: "spk-retail-s1", fac: "spk", from: D.A, to: D.U14b, cert: "V", src: "manual,s1", cur: "",
    text: "판매시설 및 영업시설: 3층 이하 바닥면적 합계 6천㎡ 이상, 4층 이상 5천㎡ 이상, 또는 수용인원 500명 이상 (2004.5.30.~2014)", scope: "모든 층",
    when: (c) =>
      c.g("retail")
        ? or(and(lt(c.x.gf, 4), ge(c.x.useArea, 6000)), and(ge(c.x.gf, 4), ge(c.x.useArea, 5000)), ge(c.x.occ, 500))
        : F,
    basis: (c) => `${GF(c)}, ${UA(c)}, 수용인원 ${fmt(c.x.occ)}명`,
  },
  {
    id: "spk-retail", fac: "spk", from: D.U14b, to: INF, cert: "V", src: "manual,s2,cur4", cur: "4)",
    text: "판매시설·운수시설·창고시설(물류터미널): 바닥면적 합계 5천㎡ 이상 또는 수용인원 500명 이상 (2014.7.7. 개정, 2014.10.8. 시행)", scope: "모든 층",
    when: (c) => (c.g("retail", "transport", "logistics") ? or(ge(c.x.useArea, 5000), ge(c.x.occ, 500)) : F),
    basis: (c) => `${UA(c)}, 수용인원 ${fmt(c.x.occ)}명`,
  },
  {
    id: "spk-care", fac: "spk", from: D.P01, to: INF, cert: "M", src: "manual,hist24,s1,s2,cur4", cur: "5)",
    text: "노유자시설·숙박이 가능한 수련(청소년)시설 600㎡ 이상(2001.5.21.), 정신보건시설·정신의료기관 600㎡ 이상(2004.5.30.) — 2014.10.8. 전은 연면적, 이후는 해당 용도 바닥면적 합계", scope: "모든 층",
    when: (c) => {
      const noyuGap = c.g("noyu") && c.d >= D.A && c.d < D.B08; // 자료 간 불일치 구간은 별도 규칙(spk-care-noyu04)
      if (noyuGap || !(c.g("noyu", "training_lodge") || (c.g("mental") && c.d >= D.A))) return F;
      return ge(c.d < D.U14b ? c.x.area : c.x.useArea, 600);
    },
    basis: (c) => (c.d < D.U14b ? A(c) : UA(c)),
  },
  {
    id: "spk-care-noyu04", fac: "spk", from: D.A, to: D.B08, cert: "U", src: "manual,hist24", cur: "",
    text: "노유자시설 연면적 600㎡ 이상 (2004.5.30.~2008.8.15.) — 운영매뉴얼은 포함, 법령집 본문은 '정신보건시설 및 숙박 수련시설'만 기재 → 자료 불일치, 당시 별표4 원문 확인 필요", scope: "모든 층",
    when: (c) => (c.g("noyu") ? ge(c.x.area, 600) : F),
    basis: A,
  },
  {
    id: "spk-nursing", fac: "spk", from: D.U14b, to: INF, cert: "V", src: "manual,reasons,s2,cur4", cur: "5)",
    text: "요양병원(2015.7.1.부터 정신병원 제외): 바닥면적 합계 600㎡ 이상 (2014.10.8.)", scope: "모든 층",
    when: (c) => (c.g("nursing") ? ge(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "spk-hosp", fac: "spk", from: D.B19, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "5)",
    text: "종합병원·병원·치과병원·한방병원: 바닥면적 합계 600㎡ 이상 (2019.8.6.)", scope: "모든 층",
    when: (c) => (c.g("hosp") ? ge(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "spk-midwife", fac: "spk", from: D.C22a, to: INF, cert: "M", src: "hist24,cur4", cur: "5)",
    text: "근린생활시설 중 조산원·산후조리원: 바닥면적 합계 600㎡ 이상 (2021.8.24. 개정, 2022.2.25. 시행)", scope: "모든 층",
    when: (c) => (c.g("midwife") ? ge(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "spk-lodging600", fac: "spk", from: D.C, to: INF, cert: "M", src: "hist24,cur4", cur: "5)",
    text: "숙박시설: 바닥면적 합계 600㎡ 이상 (2022.12.1.)", scope: "모든 층",
    when: (c) => (c.g("lodging") ? ge(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "spk-ware", fac: "spk", from: D.U14b, to: INF, cert: "V", src: "manual,reasons,s2,cur4", cur: "6)",
    text: "창고시설(물류터미널 제외): 바닥면적 합계 5천㎡ 이상 (2014.10.8.)", scope: "모든 층",
    when: (c) => (c.g("warehouse") && !c.g("logistics") ? ge(c.x.useArea, 5000) : F), basis: UA,
  },
  {
    id: "spk-floor1000", fac: "spk", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "7)",
    text: "지하층·무창층(축사 제외) 또는 4층 이상인 층으로서 바닥면적 1천㎡ 이상인 층 (1992.7.28.~ 학교 제외, 1994.7.20.~ 아파트 제외, 1995.8.10.~ 냉동창고 제외 — 2004.5.30. 학교·아파트 제외 삭제)", scope: "해당 층",
    when: (c) => {
      if (c.d < D.A && (c.g("school") || (c.g("apt") && c.d >= D.P94))) return F;
      return c.g("cattle") && c.d >= D.B10 ? c.x.upper4GE(1000) : c.x.ugWlOrUpper4GE(1000);
    },
    basis: () => "층별 바닥면적 기준",
  },
  {
    id: "spk-rack-92", fac: "spk", from: D.P92, to: D.P95, cert: "M", src: "manual", cur: "",
    text: "(소방법) 반자 높이 10m를 넘는 랙식 창고 연면적 2,100㎡ 이상", scope: "모든 층",
    when: (c) => ge(rackVal(c), 2100), basis: (c) => `랙 부분 ${fmt(rackVal(c))}㎡`,
  },
  {
    id: "spk-rack", fac: "spk", from: D.P95, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "8)",
    text: "랙식 창고(천장·반자 높이 10m 초과): 바닥면적 합계 1,500㎡ 이상 (1995.8.10.)", scope: "모든 층",
    when: (c) => ge(rackVal(c), 1500), basis: (c) => `랙 부분 ${fmt(rackVal(c))}㎡`,
  },
  {
    id: "spk-comb", fac: "spk", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "9)",
    text: "공장·창고: 특수가연물 1천배 이상 저장·취급", scope: "해당 대상물",
    when: (c) => (c.g("factory", "warehouse") ? ge(comb(c), 1000) : F), basis: (c) => `특수가연물 ${fmt(comb(c))}배`,
  },
  {
    id: "spk-radwaste", fac: "spk", from: D.B08, to: INF, cert: "V", src: "manual,reasons,s2,cur4", cur: "9)나)",
    text: "중·저준위방사성폐기물 저장시설 중 소화수 수집·처리설비가 있는 저장시설 (2008.8.16.)", scope: "해당 시설",
    when: (c) => c.f.radwaste === "withWater", basis: () => "소화수 수집·처리설비 있음",
  },
  {
    id: "spk-nonfire", fac: "spk", from: D.U14b, to: INF, cert: "V", src: "manual,reasons,s2,cur4", cur: "10)",
    text: "지붕·외벽이 불연재료가 아니거나 내화구조가 아닌 공장·창고: 물류터미널 2,500㎡·250명, 창고 2,500㎡, 랙식 750㎡, 지하·무창·4층 이상 층 500㎡, 특수가연물 500배 이상 (2014.10.8.)", scope: "모든 층",
    when: (c) => {
      if (!(c.g("factory", "warehouse") && c.f.nonFireproof)) return F;
      return or(
        c.g("logistics") ? or(ge(c.x.useArea, 2500), ge(c.x.occ, 250)) : F,
        c.g("warehouse") && !c.g("logistics") ? ge(c.x.useArea, 2500) : F,
        c.x.ugWlOrUpper4GE(500),
        ge(rackVal(c), 750),
        ge(comb(c), 500)
      );
    },
    basis: (c) => `${UA(c)}, 불연·내화 아님`,
  },
  {
    id: "spk-corr", fac: "spk", from: D.B08, to: INF, cert: "V", src: "manual,reasons,s2,cur4", cur: "11)",
    text: "교정시설(교도소·구치소 등 수용거실, 출입국 보호장소, 경찰서 유치장) (2008.8.16.)", scope: "해당 장소",
    when: (c) => c.g("correction") && !c.g("military"), basis: (c) => c.u.name,
  },
  {
    id: "spk-ugmall", fac: "spk", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "12)",
    text: "지하가(터널 제외) 연면적 1천㎡ 이상", scope: "해당 대상물",
    when: (c) => (c.g("ugmall") ? ge(c.x.area, 1000) : F), basis: A,
  },
  {
    id: "spk-ess", fac: "spk", from: D.C22a, to: INF, cert: "M", src: "hist24,cur4", cur: "13)",
    text: "발전시설 중 전기저장시설 (2022.2.25.)", scope: "해당 시설",
    when: (c) => c.g("ess"), basis: (c) => c.u.name,
  },

  // ───────────────────────── 간이스프링클러설비 ─────────────────────────
  {
    id: "sspk-row", fac: "sspk", from: D.C24, to: INF, cert: "V", src: "cur4,curDecree", cur: "1)",
    text: "연립주택·다세대주택 — 주택전용 간이스프링클러설비 (2024.12.1. 이후 신청분)", scope: "주택 부분",
    when: (c) => c.g("row", "multi"), basis: (c) => c.u.name,
  },
  {
    id: "sspk-neigh", fac: "sspk", from: D.A, to: INF, cert: "V", src: "manual,hist24,s1,s2,cur4", cur: "2)가)",
    text: "근린생활시설: 2004.5.30.~ '주용도가 근린생활시설로서 연면적 1,000㎡ 이상', 2006.12.7.~ '근린생활시설로 사용하는 부분의 바닥면적 합계 1,000㎡ 이상' (2002.1.1.~2006.12.6. 다중이용업소 지하 150㎡ 항목은 다중이용업소법 별도 검토)", scope: "모든 층",
    when: (c) => (c.g("neigh") ? ge(c.d < D.B06 ? c.x.area : c.x.useArea, 1000) : F),
    basis: (c) => (c.d < D.B06 ? `${A(c)}(주용도 근생)` : UA(c)),
  },
  {
    id: "sspk-clinic", fac: "sspk", from: D.B19, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "2)나)",
    text: "의원·치과의원·한의원으로서 입원실이 있는 시설 (2019.8.6.)", scope: "해당 시설",
    when: (c) => c.g("clinic") && !!c.f.inpatient, basis: () => "입원실 있음",
  },
  {
    id: "sspk-dialysis", fac: "sspk", from: D.C24b, to: INF, cert: "V", src: "curDecree", cur: "2)나)",
    text: "의원·치과의원·한의원으로서 인공신장실이 있는 시설 (2024.12.31. 이후 신청·개설신고분)", scope: "해당 시설",
    when: (c) => c.g("clinic") && !!c.f.dialysis, basis: () => "인공신장실 있음",
  },
  {
    id: "sspk-midwife", fac: "sspk", from: D.C22a, to: INF, cert: "M", src: "hist24,cur4", cur: "2)다)",
    text: "조산원·산후조리원 연면적 600㎡ 미만 (2022.2.25.)", scope: "해당 시설",
    when: (c) => (c.g("midwife") ? lt(c.x.area, 600) : F), basis: A,
  },
  {
    id: "sspk-nursing", fac: "sspk", from: D.B15b, to: INF, cert: "M", src: "manual,hist24,s2,cur4", cur: "3)가)",
    text: "요양병원(정신병원·의료재활시설 제외) 바닥면적 합계 600㎡ 미만 (2015.6.30. 개정, 2015.7.1. 시행 — 매뉴얼·법령집 일치)", scope: "해당 시설",
    when: (c) => (c.g("nursing") ? lt(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "sspk-hosp", fac: "sspk", from: D.B19, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "3)가)",
    text: "종합병원·병원·치과병원·한방병원 바닥면적 합계 600㎡ 미만 (2019.8.6.)", scope: "해당 시설",
    when: (c) => (c.g("hosp") ? lt(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "sspk-mental", fac: "sspk", from: D.B08, to: INF, cert: "M", src: "manual,s2,cur4", cur: "3)나)·다)",
    text: "정신보건시설(입원실 있는 것)·정신의료기관·의료재활시설: 바닥면적 합계 300㎡ 이상 600㎡ 미만, 또는 300㎡ 미만으로 창살(자동개방 제외) 설치 (2008.8.16.; 의료재활시설은 2015.7.1.~)", scope: "해당 시설",
    when: (c) => (c.g("mental") || (c.g("rehab") && c.d >= D.B15b) ? or(between(c.x.useArea, 300, 600), and(lt(c.x.useArea, 300), !!c.f.bars)) : F),
    basis: (c) => `${UA(c)}${c.f.bars ? ", 창살 있음" : ""}`,
  },
  {
    id: "sspk-edudorm", fac: "sspk", from: D.A, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "4)",
    text: "교육연구시설 내 합숙소 연면적 100㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("edu_dorm") ? ge(c.x.area, 100) : F), basis: A,
  },
  {
    id: "sspk-noyures", fac: "sspk", from: D.B12, to: INF, cert: "V", src: "manual,reasons,incheon2012,s2,cur4", cur: "5)가)",
    text: "노유자 생활시설 (면적 무관, 2012.2.5. 구분 도입 — 그 전은 모두 노유자시설; 2013.2.10.부터 노인시설 외 생활시설이 단독·공동주택에 설치된 경우 제외)", scope: "해당 시설",
    when: (c) => isNoyuRes(c.u, c.f, c.d), basis: (c) => c.u.name,
  },
  {
    id: "sspk-noyu", fac: "sspk", from: D.B08, to: INF, cert: "M", src: "manual,s2,cur4", cur: "5)나)·다)",
    text: "노유자시설(생활시설 외): 바닥면적 합계 300㎡ 이상 600㎡ 미만, 또는 300㎡ 미만으로 창살 설치 (2008.8.16.)", scope: "해당 시설",
    when: (c) =>
      and(isNoyuGen(c.u, c.f, c.d), or(between(c.x.useArea, 300, 600), and(lt(c.x.useArea, 300), !!c.f.bars))),
    basis: (c) => `${UA(c)}${c.f.bars ? ", 창살 있음" : ""}`,
  },
  {
    id: "sspk-lodging-s2", fac: "sspk", from: D.B13, to: D.C, cert: "V", src: "manual,reasons,s2", cur: "",
    text: "숙박시설 중 생활형 숙박시설 바닥면적 합계 600㎡ 이상 (2013.2.10.~2022.11.30.)", scope: "모든 층",
    when: (c) => (c.g("lodging") && c.f.cooking ? ge(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "sspk-lodging", fac: "sspk", from: D.C, to: INF, cert: "M", src: "hist24,cur4", cur: "6)",
    text: "숙박시설 바닥면적 합계 300㎡ 이상 600㎡ 미만", scope: "해당 시설",
    when: (c) => (c.g("lodging") ? between(c.x.useArea, 300, 600) : F), basis: UA,
  },
  {
    id: "sspk-mixedres", fac: "sspk", from: D.B13, to: INF, cert: "V", src: "manual,reasons,s2,cur4", cur: "8)",
    text: "복합건축물(별표2 제30호나목: 근생·판매·업무·숙박·위락 + 주택) 연면적 1천㎡ 이상 (2013.2.10.)", scope: "모든 층",
    when: (c) => (c.g("mixed_res") ? ge(c.x.area, 1000) : F), basis: A,
  },

  // ───────────────────────── 물분무등소화설비 ─────────────────────────
  {
    id: "wat-hangar", fac: "water", from: D.P94, to: INF, cert: "V", src: "hist24,s1,s2,cur4", cur: "1)",
    text: "항공기(비행기) 격납고 (1994.7.20. — 1992.7.28. 개정 목록에는 없음)", scope: "해당 시설",
    when: (c) => c.g("hangar"), basis: (c) => c.u.name,
  },
  {
    id: "wat-parkbldg", fac: "water", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "2)",
    text: "차고·주차용 건축물·철골 조립식 주차시설 연면적 800㎡ 이상", scope: "해당 시설",
    when: (c) => (c.g("parking") ? ge(c.x.area, 800) : F), basis: A,
  },
  {
    id: "wat-inpark", fac: "water", from: D.P92, to: INF, cert: "V", src: "manual,hist24,use24,s1,s2,cur4", cur: "3)",
    text: "건축물 내부 차고·주차장 바닥면적 합계 200㎡ 이상 — 1997.9.27.~2001.5.20. 아파트 부설 차고는 의무관리대상 공동주택(300세대 이상 등)만, 50세대 미만 연립·다세대 제외(법령집 2022.12.1. / 2024 용도별 자료 2018.1.26. — 그 사이 확인 필요)", scope: "해당 부분",
    when: (c) => {
      if (c.g("gas", "ugduct")) return F;
      const base = ge(n0(c.f.parkingInside), 200);
      if (base !== T) return base;
      if (c.g("apt") && c.d >= D.P97 && c.d < D.P01) {
        const hh = num(c.f.households);
        return hh !== null && hh >= 300 ? T : U; // 의무관리대상(300세대↑·승강기·중앙집중난방) 여부
      }
      if (c.g("row", "multi")) {
        const hh = num(c.f.households);
        const small = hh === null ? U : hh < 50;
        if (c.d >= D.C) return small === T ? F : small === F ? T : U;
        if (c.d >= "2018-01-26") return small === F ? T : U;
      }
      return T;
    },
    basis: (c) => `내부 차고·주차장 ${fmt(n0(c.f.parkingInside))}㎡${c.f.households ? `, ${c.f.households}세대` : ""}`,
  },
  {
    id: "wat-mech", fac: "water", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "4)",
    text: "기계장치에 의한 주차시설로 20대 이상 주차", scope: "해당 시설",
    when: (c) => ge(n0(c.f.mechCars), 20), basis: (c) => `기계식 ${fmt(n0(c.f.mechCars))}대`,
  },
  {
    id: "wat-elec", fac: "water", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "5)",
    text: "전기실·발전실·변전실·축전지실·통신기기실·전산실 바닥면적 300㎡ 이상(1995.8.10.~ 양압·저전압·24시간 상주 제어실 제외)", scope: "해당 실",
    when: (c) => ge(n0(c.f.elecRoom), 300), basis: (c) => `전기실 등 ${fmt(n0(c.f.elecRoom))}㎡`,
  },
  {
    id: "wat-comb-old", fac: "water", from: D.P92, to: D.A, cert: "M", src: "manual", cur: "",
    text: "(소방법) 공장·창고로서 특수가연물 지정수량 1천배 이상 저장·취급", scope: "해당 장소",
    when: (c) => (c.g("factory", "warehouse") ? ge(comb(c), 1000) : F), basis: (c) => `특수가연물 ${fmt(comb(c))}배`,
  },
  {
    id: "wat-radwaste", fac: "water", from: D.B08, to: INF, cert: "M", src: "manual,s2,cur4", cur: "6)",
    text: "소화수 수집·처리설비가 없는 중·저준위방사성폐기물 저장시설 (가스계 소화설비, 2008.8.16.)", scope: "해당 시설",
    when: (c) => c.f.radwaste === "noWater", basis: () => "소화수 수집·처리설비 없음",
  },
  {
    id: "wat-tunnel", fac: "water", from: D.B08, to: INF, cert: "M", src: "manual,hist24,s2,cur4", cur: "7)",
    text: "터널 — 2008.8.16.~ 길이 3,000m 이상으로서 위험등급 이상, 2013.2.10.~ 길이요건 삭제(예상교통량·경사도 등 행정안전부령 위험등급) — 물분무소화설비", scope: "터널",
    when: (c) => (c.g("tunnel") ? (c.d < D.B13 ? and(ge(tunnelLen(c), 3000), U) : U) : F),
    basis: (c) => `${TL(c)} — 행정안전부령(터널 위험등급) 확인 필요`,
  },
  {
    id: "wat-heritage", fac: "water", from: D.H09b, to: INF, cert: "M", src: "manual,reasons,cur4", cur: "8)",
    text: "지정문화재(국가유산) 중 소방청장이 문화재청장(국가유산청장)과 협의하여 정하는 것 — 2009.2.6. 개정, 부칙상 공포 후 1년(2010.2.7.) 시행", scope: "해당 국가유산",
    when: (c) => (c.g("heritage") ? U : F), basis: () => "협의 대상 지정 여부 확인",
  },

  // ───────────────────────── 옥외소화전설비 ─────────────────────────
  {
    id: "out-9000", fac: "outhyd", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "1)",
    text: "지상 1층·2층 바닥면적 합계 9천㎡ 이상 (가스시설·지하구 1994~, 터널 1997~, 아파트 2012.2.5.~ 제외 / 연소 우려 구조 동은 하나로 봄)", scope: "해당 대상물",
    when: (c) => ((c.g("gas", "ugduct") && c.d >= D.P94) || (c.g("tunnel") && c.d >= D.P97) || (c.g("apt") && c.d >= D.B12) ? F : ge(c.x.f12, 9000)),
    basis: (c) => `지상 1·2층 합계 ${fmt(c.x.f12)}㎡`,
  },
  {
    id: "out-heritage-s1", fac: "outhyd", from: D.P92, to: D.H09b, cert: "M", src: "manual,s1", cur: "",
    text: "(종전) 지정문화재 연면적 1천㎡ 이상", scope: "해당 대상물",
    when: (c) => (c.g("heritage") ? ge(c.x.area, 1000) : F), basis: A,
  },
  {
    id: "out-heritage", fac: "outhyd", from: D.H09b, to: INF, cert: "M", src: "hist24,manual,s2,cur4", cur: "2)",
    text: "보물·국보로 지정된 목조건축물 (2009.2.6. 개정, 2010.2.7. 시행)", scope: "해당 대상물",
    when: (c) => c.g("heritage"), basis: (c) => c.u.name,
  },
  {
    id: "out-comb", fac: "outhyd", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "3)",
    text: "공장·창고: 특수가연물 750배 이상", scope: "해당 대상물",
    when: (c) => (c.g("factory", "warehouse") ? ge(comb(c), 750) : F), basis: (c) => `특수가연물 ${fmt(comb(c))}배`,
  },

  // ───────────────────────── 단독경보형 감지기 (2004.5.30. 신설) ─────────────────────────
  {
    id: "sgl-apt", fac: "single", from: D.A, to: D.C, cert: "V", src: "manual,s1,s2", cur: "",
    text: "(종전) 아파트·기숙사 연면적 1천㎡ 미만", scope: "해당 대상물",
    when: (c) => (c.g("apt", "dorm") ? lt(c.x.area, 1000) : F), basis: A,
  },
  {
    id: "sgl-edudorm", fac: "single", from: D.A, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "1)·2)",
    text: "교육연구시설·수련시설 내 기숙사·합숙소 연면적 2천㎡ 미만", scope: "해당 대상물",
    when: (c) => (c.g("edu_dorm") ? lt(c.x.area, 2000) : F), basis: A,
  },
  {
    id: "sgl-lodging", fac: "single", from: D.A, to: D.C, cert: "V", src: "manual,s1,s2", cur: "",
    text: "(종전) 숙박시설 연면적 600㎡ 미만", scope: "해당 대상물",
    when: (c) => (c.g("lodging") ? lt(c.x.area, 600) : F), basis: A,
  },
  {
    id: "sgl-training", fac: "single", from: D.A, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "3)",
    text: "숙박시설이 있는 수련(청소년)시설로 자동화재탐지설비 대상(수용인원 100명 이상)이 아닌 것", scope: "해당 대상물",
    when: (c) => (c.g("training_lodge") ? lt(c.x.occ, 100) : F), basis: (c) => `수용인원 ${fmt(c.x.occ)}명`,
  },
  {
    id: "sgl-kinder", fac: "single", from: D.B18, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "4)",
    text: "연면적 400㎡ 미만 유치원 (2018.6.27.)", scope: "해당 대상물",
    when: (c) => (c.g("kinder") ? lt(c.x.area, 400) : F), basis: A,
  },
  {
    id: "sgl-row", fac: "single", from: D.C24, to: INF, cert: "V", src: "cur4,curDecree", cur: "5)",
    text: "연립주택·다세대주택 — 연동형 (2024.12.1. 이후 신청분)", scope: "각 세대(연동형)",
    when: (c) => c.g("row", "multi"), basis: (c) => c.u.name,
  },
  {
    id: "sgl-ugpark", fac: "single", from: D.C26, to: INF, cert: "I", src: "reasons,fpn2026", cur: "6)",
    text: "지하 차고·주차장 바닥면적 200㎡ 미만 부분 (2026.3.1. 이후 신청분 — 원문 문구 확인)", scope: "해당 부분",
    when: (c) => and(ge(ugpk(c), 0.01), lt(ugpk(c), 200)), basis: (c) => `지하 주차장 ${fmt(ugpk(c))}㎡`,
  },

  // ───────────────────────── 비상경보설비 ─────────────────────────
  {
    id: "alm-1", fac: "alarm", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "1)·2)",
    text: "연면적 400㎡ 이상, 또는 지하층·무창층 바닥면적 150㎡(공연장 100㎡) 이상 (가스시설·지하구 1994~, 사람 거주 않거나 벽 없는 축사 2005.11.11.~ 등 제외)", scope: "모든 층",
    when: (c) => {
      if (c.g("gas", "ugduct", "tunnel")) return F;
      return or(ge(c.x.area, 400), c.x.ugOrWlGE(c.g("perf") ? 100 : 150));
    },
    basis: (c) => `${A(c)}, 지하·무창층 최대 ${fmt(c.x.ugOrWlMax)}㎡`,
  },
  {
    id: "alm-tunnel", fac: "alarm", from: D.P97, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "3)",
    text: "터널 길이 500m 이상 (1997.9.27.)", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 500) : F), basis: TL,
  },
  {
    id: "alm-workers", fac: "alarm", from: D.P01, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "4)",
    text: "상시 50명 이상 근로자가 작업하는 옥내 작업장 (2001.5.20.)", scope: "해당 작업장",
    when: (c) => !!c.f.workers50, basis: () => "근로자 50명 이상",
  },
  {
    id: "alm-ugpark", fac: "alarm", from: D.C26, to: INF, cert: "I", src: "reasons,fpn2026", cur: "5)",
    text: "지하 차고·주차장 (2026.3.1. 이후 신청분 — 원문 문구 확인)", scope: "모든 층",
    when: (c) => and(ge(ugpk(c), 0.01), lt(ugpk(c), 200)), basis: (c) => `지하 주차장 ${fmt(ugpk(c))}㎡`,
  },

  // ───────────────────────── 자동화재탐지설비 ─────────────────────────
  {
    id: "afd-old", fac: "afd", from: D.P92, to: D.A, cert: "M", src: "manual", cur: "",
    text: "(소방법) 용도별 연면적 600·1,000·2,000㎡ 기준 — 1992.7.28./1994.7.20./1995.8.10./2001.5.21. 개정 시기별 용도군 적용(구 용도분류 근사 대응; 1994.7.20.~2001.5.20. 아파트는 의무관리대상만)",
    scope: "모든 층",
    when: (c) => afdOld(c),
    basis: (c) => `${A(c)} (${afdOldGroup(c)})`,
  },
  {
    id: "afd-noyu-01", fac: "afd", from: D.P01, to: D.A, cert: "M", src: "hist24,manual", cur: "",
    text: "(소방법) 연면적 400㎡ 이상이고 수용인원 100인 이상인 청소년시설(숙박시설이 있는 것)·노유자시설 (2001.5.21. — 두 요건 모두 충족)", scope: "모든 층",
    when: (c) => (c.g("noyu", "training_lodge") ? and(ge(c.x.area, 400), ge(c.x.occ, 100)) : F),
    basis: (c) => `${A(c)}, 수용인원 ${fmt(c.x.occ)}명`,
  },
  {
    id: "afd-duct-old", fac: "afd", from: D.P94, to: D.A, cert: "M", src: "manual", cur: "",
    text: "(소방법) 행정안전부령으로 정하는 지하구(길이 등 요건)", scope: "지하구",
    when: (c) => (c.g("ugduct") ? U : F), basis: () => "지하구 규모 요건 확인",
  },
  {
    id: "afd-aptlodge", fac: "afd", from: D.C, to: INF, cert: "M", src: "hist24,cur4", cur: "1)",
    text: "공동주택 중 아파트등·기숙사 및 숙박시설 (규모 무관)", scope: "모든 층",
    when: (c) => c.g("apt", "dorm", "lodging"), basis: (c) => c.u.name,
  },
  {
    id: "afd-6f", fac: "afd", from: D.C, to: INF, cert: "M", src: "hist24,cur4", cur: "2)",
    text: "층수 6층 이상 건축물", scope: "모든 층",
    when: (c) => (c.g("tunnel", "ugduct") ? F : ge(c.x.gf, 6)), basis: GF,
  },
  {
    id: "afd-600", fac: "afd", from: D.A, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "3)",
    text: "근생(목욕장 제외)·의료(2014 개정부터 정신의료기관·요양병원 제외)·위락·장례·복합건축물 연면적 600㎡ 이상", scope: "모든 층",
    when: (c) =>
      (c.g("neigh") && !c.g("bath")) || (c.g("medical") && !c.g("mental", "nursing", "rehab")) || c.g("entertain", "funeral", "mixed")
        ? ge(c.x.area, 600)
        : F,
    basis: A,
  },
  {
    id: "afd-600-old", fac: "afd", from: D.A, to: D.C, cert: "V", src: "manual,s1,s2", cur: "",
    text: "(종전) 숙박시설 연면적 600㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("lodging") ? ge(c.x.area, 600) : F), basis: A,
  },
  {
    id: "afd-600-med-old", fac: "afd", from: D.A, to: D.U14b, cert: "M", src: "manual,s1", cur: "",
    text: "(2014 개정 전) 정신의료기관·요양병원·의료재활시설도 의료시설로서 연면적 600㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("mental", "nursing", "rehab") ? ge(c.x.area, 600) : F), basis: A,
  },
  {
    id: "afd-1000", fac: "afd", from: D.A, to: INF, cert: "V", src: "manual,hist24,s1,s2,cur4", cur: "4)",
    text: "목욕장·문화집회·종교·판매(영업)·운수·운동·업무·공장·창고·항공기및자동차·방송통신·관광휴게·지하가(터널 제외) 연면적 1천㎡ 이상 + (2011.7.7.~) 위험물·국방·군사·발전시설", scope: "모든 층",
    when: (c) => {
      const cond = ge(c.x.area, 1000);
      if (c.g("bath", "culture", "religion", "retail", "transport", "sports", "office", "factory", "warehouse", "aircar", "broadcast", "tourist", "ugmall")) return cond;
      if (c.g("hazmat", "military", "power")) return c.d >= D.B11 ? cond : and(U, cond); // 2011.7.7. 전 당시 용도분류 확인
      return F;
    },
    basis: A,
  },
  {
    id: "afd-1000-apt-old", fac: "afd", from: D.A, to: D.C, cert: "V", src: "manual,s1,s2", cur: "",
    text: "(종전) 공동주택(아파트·기숙사) 연면적 1천㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("apt", "dorm") ? ge(c.x.area, 1000) : F), basis: A,
  },
  {
    id: "afd-2000", fac: "afd", from: D.A, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "5)",
    text: "교육연구(내 기숙사·합숙소 포함)·수련시설(숙박 없는 것)·동식물관련·자원순환(위생 등)·교정(국방군사 제외)·묘지관련 연면적 2천㎡ 이상", scope: "모든 층",
    when: (c) =>
      c.g("edu", "animal", "recycle", "cemetery") || (c.g("training") && !c.g("training_lodge")) || (c.g("correction") && !c.g("military"))
        ? ge(c.x.area, 2000)
        : F,
    basis: A,
  },
  {
    id: "afd-noyures", fac: "afd", from: D.B12, to: INF, cert: "V", src: "manual,reasons,incheon2012,s2,cur4", cur: "6)",
    text: "노유자 생활시설 (면적 무관, 2012.2.5. 구분 도입 — 그 전은 모두 노유자시설 400㎡ 기준)", scope: "모든 층",
    when: (c) => isNoyuRes(c.u, c.f, c.d), basis: (c) => c.u.name,
  },
  {
    id: "afd-noyu400", fac: "afd", from: D.A, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "7)",
    text: "노유자시설(생활시설 외) 연면적 400㎡ 이상, 숙박시설이 있는 수련시설 수용인원 100명 이상", scope: "모든 층",
    when: (c) => {
      return or(and(isNoyuGen(c.u, c.f, c.d), ge(c.x.area, 400)), c.g("training_lodge") ? ge(c.x.occ, 100) : F);
    },
    basis: (c) => `${A(c)}, 수용인원 ${fmt(c.x.occ)}명`,
  },
  {
    id: "afd-nursing-14", fac: "afd", from: D.U14b, to: D.B15b, cert: "M", src: "manual", cur: "",
    text: "(2014 개정) 정신의료기관·요양병원: 바닥면적 합계 300㎡ 이상, 또는 300㎡ 미만으로 창살 설치", scope: "모든 층",
    when: (c) => (c.g("nursing") ? or(ge(c.x.useArea, 300), and(lt(c.x.useArea, 300), !!c.f.bars)) : F),
    basis: UA,
  },
  {
    id: "afd-nursing", fac: "afd", from: D.B15b, to: INF, cert: "M", src: "manual,s2,cur4", cur: "8)가)",
    text: "요양병원(정신병원·의료재활시설 제외) — 면적 무관 (2015.7.1.)", scope: "모든 층",
    when: (c) => c.g("nursing"), basis: (c) => c.u.name,
  },
  {
    id: "afd-mental", fac: "afd", from: D.U14b, to: INF, cert: "M", src: "manual,s2,cur4", cur: "8)나)·다)",
    text: "정신의료기관·의료재활시설(2015.7.1.~) 바닥면적 합계 300㎡ 이상, 또는 300㎡ 미만으로 창살 설치 (2014.10.8.)", scope: "모든 층",
    when: (c) =>
      c.g("mental") || (c.g("rehab") && c.d >= D.B15b) ? or(ge(c.x.useArea, 300), and(lt(c.x.useArea, 300), !!c.f.bars)) : F,
    basis: UA,
  },
  {
    id: "afd-market", fac: "afd", from: D.B18, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "9)",
    text: "판매시설 중 전통시장 (2018.6.27.) ※ 2023.12.1. 이후 신청분은 화재알림설비 설치 시 면제 검토", scope: "모든 층",
    when: (c) => c.g("market"), basis: (c) => c.u.name,
  },
  {
    id: "afd-tunnel", fac: "afd", from: D.A, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "10)",
    text: "터널 길이 1천m 이상 (2004.5.30.)", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 1000) : F), basis: TL,
  },
  {
    id: "afd-duct", fac: "afd", from: D.A, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "11)",
    text: "지하구", scope: "지하구",
    when: (c) => c.g("ugduct"), basis: (c) => c.u.name,
  },
  {
    id: "afd-midwife", fac: "afd", from: D.C22a, to: INF, cert: "M", src: "hist24,cur4", cur: "12)",
    text: "조산원·산후조리원 (면적 무관, 2022.2.25.)", scope: "모든 층",
    when: (c) => c.g("midwife"), basis: (c) => c.u.name,
  },
  {
    id: "afd-comb", fac: "afd", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "13)",
    text: "공장·창고: 특수가연물 500배 이상", scope: "모든 층",
    when: (c) => (c.g("factory", "warehouse") ? ge(comb(c), 500) : F), basis: (c) => `특수가연물 ${fmt(comb(c))}배`,
  },
  {
    id: "afd-ess", fac: "afd", from: D.C22a, to: INF, cert: "M", src: "hist24,cur4", cur: "14)",
    text: "발전시설 중 전기저장시설 (2022.2.25.)", scope: "모든 층",
    when: (c) => c.g("ess"), basis: (c) => c.u.name,
  },
  {
    id: "afd-ugpark", fac: "afd", from: D.C26, to: INF, cert: "I", src: "reasons,fpn2026", cur: "15)",
    text: "지하 차고·주차장 바닥면적 200㎡ 이상 (2026.3.1. 이후 신청분 — 원문 문구 확인)", scope: "모든 층",
    when: (c) => ge(ugpk(c), 200), basis: (c) => `지하 주차장 ${fmt(ugpk(c))}㎡`,
  },

  // ───────────────────────── 시각경보기 (2004.5.30. 신설, 자탐 연동) ─────────────────────────
  {
    id: "vis-1", fac: "visual", from: D.A, to: INF, cert: "M", src: "manual,cur4", cur: "1)~4)",
    text: "자동화재탐지설비 설치 대상 중 근생·위락·문화집회·운동·판매·숙박·노유자·의료·업무(2006.12.7.~ 군사시설 제외)·방송국·도서관·지하상가 (2004.5.30.)", scope: "자탐 설치 부분",
    dependsOn: "afd",
    when: (c) => {
      const list =
        c.g("neigh", "entertain", "culture", "religion", "sports", "retail", "lodging", "noyu", "medical", "bstation", "library", "ugmall") ||
        (c.g("office") && !(c.g("military") && c.d >= D.B06));
      return list ? c.dep.afd : F;
    },
    basis: () => "자동화재탐지설비 설치 대상 연동",
  },
  {
    id: "vis-2", fac: "visual", from: D.B11, to: INF, cert: "M", src: "hist24,cur4", cur: "1)~2)",
    text: "자동화재탐지설비 설치 대상 중 운수시설·물류터미널·발전시설·장례시설 (2011.4.6. 개정, 2011.7.7. 시행)", scope: "자탐 설치 부분",
    dependsOn: "afd",
    when: (c) => (c.g("transport", "logistics", "power", "funeral") ? c.dep.afd : F),
    basis: () => "자동화재탐지설비 설치 대상 연동",
  },
  {
    id: "vis-lithium", fac: "visual", from: D.C26, to: INF, cert: "I", src: "reasons,fpn2026", cur: "5)",
    text: "리튬 1차전지 제조 공장 (2026.3.1. 이후 신청분 — 원문 문구 확인)", scope: "해당 공장",
    when: (c) => c.g("factory") && !!c.f.lithium, basis: () => "리튬1차전지 공장",
  },

  // ───────────────────────── 화재알림설비 ─────────────────────────
  {
    id: "ntf-market", fac: "notify", from: D.C23, to: INF, cert: "V", src: "cur4,curDecree", cur: "",
    text: "판매시설 중 전통시장 (2023.12.1. 이후 신청분)", scope: "해당 시장",
    when: (c) => c.g("market"), basis: (c) => c.u.name,
  },

  // ───────────────────────── 비상방송설비 ─────────────────────────
  {
    id: "pa-1", fac: "pa", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "1)~3)",
    text: "연면적 3,500㎡ 이상, 지하층 제외 11층 이상, 또는 지하층 3층 이상 (가스시설·지하구 1994.7.20.~, 터널 1997.9.27.~, 사람 거주 않는 동식물시설 2009.2.6.~ 제외)", scope: "모든 층",
    when: (c) => ((c.g("gas", "ugduct") && c.d >= D.P94) || (c.g("tunnel") && c.d >= D.P97) || (c.g("cattle") && c.d >= D.B09) ? F : or(ge(c.x.area, 3500), ge(c.x.gf, 11), ge(c.x.bf, 3))),
    basis: (c) => `${A(c)}, ${GF(c)}, 지하 ${c.x.bf}층`,
  },

  // ───────────────────────── 자동화재속보설비 ─────────────────────────
  {
    id: "rep-old92", fac: "report", from: D.P92, toU: P99U, cert: "M", src: "manual,hist24", cur: "",
    text: "(소방법) 판매·숙박·의료·통신촬영·전시·공장 및 창고시설 '바닥면적 1,500㎡ 이상' (1992.7.28. — 층 기준 명시는 1999 개정부터이므로 해당 용도 바닥면적 합계로 판정)", scope: "해당 대상물",
    when: (c) => (c.g("retail", "lodging", "medical", "broadcast", "culture", "factory", "warehouse") ? ge(c.x.useArea, 1500) : F),
    basis: UA,
  },
  {
    id: "rep-old99a", fac: "report", fromU: P99U, to: D.A, cert: "M", src: "hist24,manual", cur: "",
    text: "(소방법) 판매·숙박·의료·통신촬영·전시·공장·창고시설로서 바닥면적 1,500㎡ 이상인 층이 있는 것 (1999 개정 — 법령집 1999.8.6. / 매뉴얼 1999.2.5.)", scope: "해당 대상물",
    when: (c) => (c.g("retail", "lodging", "medical", "broadcast", "culture", "factory", "warehouse") ? c.x.anyFloorAnyGE(1500) : F),
    basis: () => "층별 바닥면적 기준",
  },
  {
    id: "rep-old99", fac: "report", fromU: P99U, to: D.A, cert: "M", src: "hist24,manual", cur: "",
    text: "(소방법) 노유자시설, 숙박시설 있는 청소년시설 바닥면적 500㎡ 이상인 층이 있는 것 (1999 개정 — 법령집 1999.8.6. / 매뉴얼 1999.2.5.)", scope: "해당 대상물",
    when: (c) => (c.g("noyu", "training_lodge") ? c.x.anyFloorAnyGE(500) : F),
    basis: () => "층별 바닥면적 기준",
  },
  {
    id: "rep-1500", fac: "report", from: D.A, to: D.C, cert: "M", src: "manual,s1,s2", cur: "",
    text: "(종전) 공장·창고시설·업무시설(사람이 근무하지 않는 시간에 무인경비시스템으로 관리하는 시설에 한함) 바닥면적 1,500㎡ 이상인 층이 있는 것 (2004.5.30.~2022.11.30.; 2014.10.8.부터 24시간 상시 근무 시 설치 제외 가능)", scope: "모든 층",
    when: (c) => {
      if (!c.g("office", "factory", "warehouse")) return F;
      const big = c.x.anyFloorAnyGE(1500);
      if (big !== T) return big;
      return c.f.unmanned ? T : U; // 무인경비 여부 미확인 → 확인 필요
    },
    basis: (c) => `1,500㎡ 이상인 층 있음${c.f.unmanned ? ", 야간 무인경비" : " — 야간 무인경비시스템 관리 여부 확인"}`,
  },
  {
    id: "rep-1500b", fac: "report", from: D.B11, to: D.C, cert: "M", src: "hist24,s2", cur: "",
    text: "(종전) 국방·군사시설·발전시설(무인경비시스템 관리) 바닥면적 1,500㎡ 이상인 층이 있는 것 (2011.7.7. 추가)", scope: "모든 층",
    when: (c) => {
      if (!c.g("military", "power")) return F;
      const big = c.x.anyFloorAnyGE(1500);
      if (big !== T) return big;
      return c.f.unmanned ? T : U;
    },
    basis: () => "1,500㎡ 이상인 층 있음",
  },
  {
    id: "rep-noyures", fac: "report", from: D.B12, to: INF, cert: "V", src: "manual,reasons,incheon2012,s2,cur4", cur: "1)",
    text: "노유자 생활시설 (면적 무관, 2012.2.5. 구분 도입 — 그 전은 모두 노유자시설 500㎡ 기준)", scope: "해당 시설",
    when: (c) => isNoyuRes(c.u, c.f, c.d), basis: (c) => c.u.name,
  },
  {
    id: "rep-noyu500", fac: "report", from: D.A, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "2)·3)",
    text: "노유자시설, 숙박시설이 있는 수련시설: 바닥면적 500㎡ 이상인 층이 있는 것", scope: "해당 시설",
    when: (c) =>
      or(and(isNoyuGen(c.u, c.f, c.d), c.x.anyFloorAnyGE(500)), c.g("training_lodge") ? c.x.anyFloorAnyGE(500) : F),
    basis: () => "층별 바닥면적 기준",
  },
  {
    id: "rep-heritage", fac: "report", from: D.H09b, to: INF, cert: "M", src: "manual,s2,cur4", cur: "4)",
    text: "국보·보물로 지정된 목조건축물 — 2009.2.6. 개정, 부칙상 2010.2.7. 시행", scope: "해당 대상물",
    when: (c) => c.g("heritage"), basis: (c) => c.u.name,
  },
  {
    id: "rep-clinic", fac: "report", from: D.B19, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "5)가)",
    text: "의원·치과의원·한의원으로서 입원실이 있는 시설 (2019.8.6.)", scope: "해당 시설",
    when: (c) => c.g("clinic") && !!c.f.inpatient, basis: () => "입원실 있음",
  },
  {
    id: "rep-midwife", fac: "report", from: D.C22a, to: INF, cert: "M", src: "hist24,cur4", cur: "5)나)",
    text: "조산원·산후조리원 (2022.2.25.)", scope: "해당 시설",
    when: (c) => c.g("midwife"), basis: (c) => c.u.name,
  },
  {
    id: "rep-hosp", fac: "report", from: D.B19, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "6)가)",
    text: "종합병원·병원·치과병원·한방병원 (2019.8.6.)", scope: "해당 시설",
    when: (c) => c.g("hosp"), basis: (c) => c.u.name,
  },
  {
    id: "rep-nursing-14", fac: "report", from: D.U14b, to: D.B15b, cert: "M", src: "manual", cur: "",
    text: "(2014 개정) 요양병원으로서 바닥면적 500㎡ 이상인 층이 있는 것", scope: "해당 시설",
    when: (c) => (c.g("nursing") ? c.x.anyFloorAnyGE(500) : F), basis: () => "층별 바닥면적 기준",
  },
  {
    id: "rep-nursing", fac: "report", from: D.B15b, to: INF, cert: "M", src: "manual,s2,cur4", cur: "6)가)",
    text: "요양병원(정신병원·의료재활시설 제외) — 면적 무관 (2015.7.1.)", scope: "해당 시설",
    when: (c) => c.g("nursing"), basis: (c) => c.u.name,
  },
  {
    id: "rep-mental", fac: "report", from: D.B15b, to: INF, cert: "M", src: "manual,s2,cur4", cur: "6)나)",
    text: "정신병원·의료재활시설로 바닥면적 500㎡ 이상인 층이 있는 것 (2015.7.1.)", scope: "해당 시설",
    when: (c) => (c.g("mental", "rehab") ? c.x.anyFloorAnyGE(500) : F), basis: () => "층별 바닥면적 기준",
  },
  {
    id: "rep-market", fac: "report", from: D.B18, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "7)",
    text: "판매시설 중 전통시장 (2018.6.27.)", scope: "해당 시설",
    when: (c) => c.g("market"), basis: (c) => c.u.name,
  },
  {
    id: "rep-30f", fac: "report", from: D.B12, to: D.C, cert: "M", src: "manual,hist24,s2", cur: "",
    text: "(종전) 층수 30층 이상 (2012.2.5.~2022.11.30.)", scope: "모든 층",
    when: (c) => ge(c.x.gf, 30), basis: GF,
  },
  {
    id: "rep-ess", fac: "report", from: D.C22a, to: D.C, cert: "M", src: "hist24", cur: "",
    text: "(종전) 발전시설 중 전기저장시설 (2022.2.25.~2022.11.30. — 2022.12.1. 전부개정 시 삭제)", scope: "해당 시설",
    when: (c) => c.g("ess"), basis: (c) => c.u.name,
  },

  // ───────────────────────── 통합감시시설 ─────────────────────────
  {
    id: "mon-common", fac: "monitor", from: D.P01, to: INF, cert: "M", src: "manual,cur4", cur: "",
    text: "공동구 (2001.5.21.)", scope: "공동구",
    when: (c) => c.g("commonduct"), basis: (c) => c.u.name,
  },
  {
    id: "mon-duct", fac: "monitor", from: D.U14b, to: INF, cert: "M", src: "manual,reasons,cur4", cur: "",
    text: "지하구 (2014.10.8., 2020.12.10. 지하구 기준 전면 개편)", scope: "지하구",
    when: (c) => c.g("ugduct") && !c.g("commonduct"), basis: (c) => c.u.name,
  },

  // ───────────────────────── 누전경보기 ─────────────────────────
  {
    id: "leak-old", fac: "leak", from: D.P92, toU: [D.P99b, D.A], cert: "M", src: "hist24,manual", cur: "",
    text: "(소방법) 라스(철망) 비내화 건축물로서 ①연면적 500㎡ 이상(1992: 사업장, 1994.7.20.~: 업무·통신촬영·교육연구·전시시설은 1,000㎡) 또는 ②계약전류 100A 초과 — ①은 1999.7.29. 개정(8.6. 시행)으로 삭제(법령집; 매뉴얼은 2004.5.30.에 100A만 표기)", scope: "해당 건축물",
    when: (c) => {
      if ((c.g("gas", "ugduct") && c.d >= D.P94) || !lath(c)) return F;
      const t = c.g("office", "broadcast", "edu", "culture") || (c.d < D.P94 && c.g("factory")) ? 1000 : 500;
      return or(ge(c.x.area, t), !!c.f.leak100A);
    },
    basis: (c) => `${A(c)}, 라스구조${c.f.leak100A ? ", 계약전류 100A 초과" : ""}`,
  },
  {
    id: "leak-1", fac: "leak", fromU: [D.P99b, D.A], to: INF, cert: "M", src: "hist24,manual,cur4", cur: "",
    text: "계약전류용량 100A 초과 + 라스(철망) 비내화구조 건축물 (가스시설·지하구·터널 제외; 면적 요건 삭제 — 법령집 1999.8.6. / 매뉴얼 2004.5.30.)", scope: "해당 건축물",
    when: (c) => (c.g("gas", "tunnel", "ugduct") ? F : and(lath(c), !!c.f.leak100A)), basis: () => "계약전류 100A 초과·라스구조",
  },

  // ───────────────────────── 가스누설경보기 (2004.5.30. 신설) ─────────────────────────
  {
    id: "gas-1", fac: "gasleak", from: D.A, to: INF, cert: "M", src: "manual,cur4", cur: "1)·2)",
    text: "가스시설이 설치된 숙박·노유자·판매·청소년(수련)·의료·문화집회 및 운동·종교시설", scope: "가스시설 설치 장소",
    when: (c) => (c.g("lodging", "noyu", "retail", "training", "medical", "culture", "sports", "religion") ? !!c.f.gasUse : F),
    basis: () => "가스시설 설치",
  },
  {
    id: "gas-2", fac: "gasleak", from: D.B11, to: INF, cert: "M", src: "hist24,cur4", cur: "1)·2)",
    text: "가스시설이 설치된 운수시설·물류터미널·장례시설 (2011.7.7. 추가)", scope: "가스시설 설치 장소",
    when: (c) => (c.g("transport", "logistics", "funeral") ? !!c.f.gasUse : F),
    basis: () => "가스시설 설치",
  },
  {
    id: "gas-factory", fac: "gasleak", from: D.C26, to: INF, cert: "I", src: "reasons,fpn2026", cur: "2)",
    text: "가스시설이 설치된 공장 (2026.3.1. 이후 신청분 — 원문 문구 확인)", scope: "가스시설 설치 장소",
    when: (c) => (c.g("factory") ? !!c.f.gasUse : F), basis: () => "가스시설 설치",
  },

  // ───────────────────────── 피난기구 ─────────────────────────
  {
    id: "esc-1", fac: "escape", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "",
    text: "피난층·지상 1층·2층·11층 이상인 층을 제외한 모든 층 (1992.7.28.~1994.7.19.은 지하층도 제외 / 가스시설·지하구·터널 제외)", scope: "해당 층",
    when: (c) => {
      if (c.g("gas", "tunnel", "ugduct")) return F;
      if (c.x.gf >= 3) return T;
      if (c.x.bf > 0 && c.d >= D.P94) return T;
      return F;
    },
    basis: (c) => escapeFloors(c),
  },
  {
    id: "esc-noyu12", fac: "escape", from: D.B17, to: INF, cert: "M", src: "hist24,s2,cur4", cur: "",
    text: "노유자시설의 피난층이 아닌 지상 1층·2층 (2017.1.26. 개정, 2017.1.28. 시행)", scope: "해당 층",
    when: (c) => c.g("noyu") && c.x.gf >= 2, basis: () => "노유자시설 지상 1·2층 중 피난층 아닌 층",
  },

  // ───────────────────────── 인명구조기구 ─────────────────────────
  {
    id: "res-old", fac: "rescue", from: D.P92, to: D.A, cert: "M", src: "manual", cur: "",
    text: "(소방법) 지하층 제외 7층 이상 관광호텔, 지하층 제외 5층 이상 병원(1994.7.20.~ 병원은 인공소생기 제외)", scope: "해당 용도 층",
    when: (c) => or(c.g("hotel") ? ge(c.x.gf, 7) : F, c.g("hosp", "nursing", "mental") ? ge(c.x.gf, 5) : F),
    basis: GF,
  },
  {
    id: "res-hotel", fac: "rescue", from: D.A, to: INF, cert: "V", src: "manual,s1,cur4", cur: "1)",
    text: "지하층 포함 7층 이상 관광호텔 — 방열복(방화복)·공기호흡기·인공소생기", scope: "관광호텔 용도 층",
    when: (c) => (c.g("hotel") ? ge(c.x.totalFloors, 7) : F), basis: TF,
  },
  {
    id: "res-hosp", fac: "rescue", from: D.A, to: INF, cert: "V", src: "manual,s1,cur4", cur: "2)",
    text: "지하층 포함 5층 이상 병원 — 방열복(방화복)·공기호흡기", scope: "병원 용도 층",
    when: (c) => (c.g("hosp", "nursing", "mental") ? ge(c.x.totalFloors, 5) : F), basis: TF,
  },
  {
    id: "res-scba-04", fac: "rescue", from: D.A, to: D.B12, cert: "M", src: "manual", cur: "",
    text: "공기호흡기: 수용인원 100명 이상 지하역사·백화점·대형점·쇼핑센터·지하상가·영화상영관 (층마다 2대, 2004.5.30.)", scope: "해당 시설",
    when: (c) => (c.g("station", "bigstore", "ugmall", "cinema") ? ge(c.x.occ, 100) : F),
    basis: (c) => `${c.u.name}, 수용인원 ${fmt(c.x.occ)}명`,
  },
  {
    id: "res-scba", fac: "rescue", from: D.B12, to: INF, cert: "M", src: "manual,hist24,cur4", cur: "3)",
    text: "공기호흡기: 영화상영관(수용 100명 이상), 대규모점포, 지하역사, 지하상가 — 2012.2.5.~2014.10.7.은 네 용도 모두 수용인원 100명 이상 요건", scope: "해당 시설",
    when: (c) => {
      if (c.g("cinema")) return ge(c.x.occ, 100);
      if (!c.g("bigstore", "station", "ugmall")) return F;
      return c.d < D.U14b ? ge(c.x.occ, 100) : T;
    },
    basis: (c) => `${c.u.name}, 수용인원 ${fmt(c.x.occ)}명`,
  },
  {
    id: "res-co2", fac: "rescue", from: D.B12, to: INF, cert: "M", src: "use24,hist24,cur4", cur: "3)마)",
    text: "공기호흡기: 이산화탄소소화설비 설치 장소 — 2012.2.5. 인명구조기구 화재안전기준 개정으로 비치(기존 대상 2013.2.5.까지 소급, 2024 용도별 자료), 2014.10.8. 시행령 별표 반영(법령집), 2018.6.27.부터 호스릴 이산화탄소소화설비 제외 — 물분무등 전체가 아님", scope: "해당 장소",
    when: (c) => !!c.f.co2, basis: () => "이산화탄소소화설비 설치",
  },

  // ───────────────────────── 유도등 ─────────────────────────
  {
    id: "gd-1", fac: "guide", from: D.P92, to: INF, cert: "V", src: "manual,hist24,s1,s2,cur4", cur: "",
    text: "피난구유도등·통로유도등·유도표지: 모든 특정소방대상물 (터널 1997.9.27.~ 제외, 지하구 1994.7.20.~2020.12.9. 제외, 축사 중 가축 직접 사육 부분 2014.10.8.~ 제외)", scope: "해당 대상물",
    when: (c) => {
      if (c.g("house")) return F;
      if (c.g("tunnel") && c.d >= D.P97) return F;
      if (c.g("ugduct") && c.d >= D.P94 && c.d < D.S2) return F;
      return T;
    },
    basis: (c) => (c.g("cattle") && c.d >= D.U14b ? "축사 — 가축 사육 부분 제외" : c.u.name),
  },
  {
    id: "gd-seat", fac: "seatguide", from: D.P92, to: INF, cert: "M", src: "manual,cur4", cur: "",
    text: "객석유도등: 무대 있는 유흥주점(카바레·나이트클럽 등), 문화집회(관람집회)·운동시설, 종교시설(2014~)", scope: "객석",
    when: (c) => (c.g("dance", "culture", "sports") || (c.g("religion") && c.d >= D.U14b)) && !c.g("zoo"),
    basis: (c) => c.u.name,
  },

  // ───────────────────────── 비상조명등 ─────────────────────────
  {
    id: "el-1-old", fac: "elight", from: D.P92, to: D.A, cert: "M", src: "manual,hist24", cur: "",
    text: "(소방법) 지하층 제외 층수 5층 이상으로서 연면적 3천㎡ 이상 (1994.7.20.~ 차고·주차장·가스시설·지하구·창고(냉동창고 포함)·하역장 제외)", scope: "모든 층",
    when: (c) => (elOldExcl(c) ? F : and(ge(c.x.gf, 5), ge(c.x.area, 3000))), basis: (c) => `${GF(c)}, ${A(c)}`,
  },
  {
    id: "el-1", fac: "elight", from: D.A, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "1)",
    text: "지하층 포함 층수 5층 이상 + 연면적 3천㎡ 이상 (창고·하역장·가스시설·사람이 거주하지 않는 동식물시설 제외)", scope: "모든 층",
    when: (c) => (elExcl(c) ? F : and(ge(c.x.totalFloors, 5), ge(c.x.area, 3000))),
    basis: (c) => `${TF(c)}, ${A(c)}`,
  },
  {
    id: "el-2", fac: "elight", from: D.P92, to: INF, cert: "V", src: "manual,hist24,s1,s2,cur4", cur: "2)",
    text: "1)에 해당하지 않는 것으로 지하층 또는 무창층 바닥면적 450㎡ 이상", scope: "해당 층",
    when: (c) => ((c.d < D.A ? elOldExcl(c) : elExcl(c)) ? F : c.x.ugOrWlGE(450)), basis: (c) => `지하·무창층 최대 ${fmt(c.x.ugOrWlMax)}㎡`,
  },
  {
    id: "el-tunnel", fac: "elight", from: D.P97, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "3)",
    text: "터널 길이 500m 이상 (1997.9.27.)", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 500) : F), basis: TL,
  },

  // ───────────────────────── 휴대용비상조명등 ─────────────────────────
  {
    id: "pl-02", fac: "plight", from: D.P02, to: D.A, cert: "M", src: "manual", cur: "",
    text: "(소방법) 숙박시설(오피스텔 제외)·다중이용업소 (2002.3.30. 신설)", scope: "해당 시설",
    when: (c) => c.g("lodging"), basis: (c) => c.u.name,
  },
  {
    id: "pl-1", fac: "plight", from: D.A, to: INF, cert: "V", src: "manual,hist24,s1,s2,cur4", cur: "1)·2)",
    text: "숙박시설, 수용인원 100명 이상의 영화상영관·대규모점포(백화점 등)·지하역사·지하상가 (수용인원 요건은 숙박시설 외 전체에 적용)", scope: "해당 시설",
    when: (c) => or(c.g("lodging"), c.g("cinema", "bigstore", "station", "ugmall") ? ge(c.x.occ, 100) : F),
    basis: (c) => `${c.u.name}${c.g("lodging") ? "" : `, 수용인원 ${fmt(c.x.occ)}명`}`,
  },

  // ───────────────────────── 상수도소화용수설비 ─────────────────────────
  {
    id: "ws-5000", fac: "waterSupply", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "가",
    text: "연면적 5천㎡ 이상 (가스시설·지하구·터널 제외) ※ 2004.5.30.부터 대지경계선 180m 이내 75mm 이상 상수도 배수관 없으면 소화수조·저수조", scope: "해당 대상물",
    when: (c) => ((c.g("gas", "ugduct") && c.d >= D.P94) || (c.g("tunnel") && c.d >= D.P97) ? F : ge(c.x.area, 5000)), basis: A,
  },
  {
    id: "ws-tank-old", fac: "waterSupply", from: D.P92, to: D.A, cert: "M", src: "hist24", cur: "",
    text: "(소방법) 소화수조 또는 저수조: 지상 1층·2층 바닥면적 합계 15,000㎡ 이상, 또는 지하층 제외 11층 이상으로서 지상층 바닥면적 합계 25,000㎡ 이상 (1994.7.20.~ 아파트·가스시설 제외) — 상수도소화용수설비와 별도 기준", scope: "해당 대상물(소화수조·저수조)",
    when: (c) => {
      if (c.d >= D.P94 && c.g("apt", "gas")) return F;
      const above = c.x.aboveSum;
      return or(ge(c.x.f12, 15000), and(ge(c.x.gf, 11), ge(above, 25000)));
    },
    basis: (c) => `지상 1·2층 합계 ${fmt(c.x.f12)}㎡, ${GF(c)}`,
  },
  {
    id: "ws-gas", fac: "waterSupply", from: D.P94, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "나",
    text: "가스시설 지상 노출 탱크 저장용량 합계 100톤 이상 (1994.7.20.)", scope: "해당 시설",
    when: (c) => (c.g("gas") ? ge(gasTon(c), 100) : F), basis: (c) => `탱크 ${fmt(gasTon(c))}톤`,
  },
  {
    id: "ws-waste", fac: "waterSupply", from: D.C, to: INF, cert: "M", src: "hist24,cur4", cur: "다",
    text: "자원순환 관련 시설 중 폐기물재활용시설·폐기물처분시설", scope: "해당 시설",
    when: (c) => c.g("waste"), basis: (c) => c.u.name,
  },

  // ───────────────────────── 제연설비 ─────────────────────────
  {
    id: "sm-stage", fac: "smoke", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "1)·2)",
    text: "문화집회(관람집회)·종교·운동시설 무대부 바닥면적 200㎡ 이상, 수용인원 100명 이상 영화상영관(2004.5.30.~)", scope: "무대부·영화상영관",
    when: (c) =>
      or(c.g("culture", "religion", "sports") ? ge(stageVal(c), 200) : F, c.g("cinema") && c.d >= D.A ? ge(c.x.occ, 100) : F),
    basis: (c) => `무대부 ${fmt(stageVal(c))}㎡${c.g("cinema") ? `, 수용인원 ${fmt(c.x.occ)}명` : ""}`,
  },
  {
    id: "sm-ug", fac: "smoke", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "3)",
    text: "지하층·무창층에 설치된 근생·판매(영업)·숙박·위락 용도 바닥면적 합계 1천㎡ 이상 (2014 개정부터 '해당 층')", scope: "해당 부분",
    when: (c) => (c.g("neigh", "retail", "lodging", "entertain") ? ugWlUseGE(c, 1000) : F),
    basis: (c) => `지하층·무창층 바닥면적 합계 ${fmt(ugWlTotal(c))}㎡(단일 용도 가정)`,
  },
  {
    id: "sm-ug-trans", fac: "smoke", fromU: [D.B12s, D.B13], to: INF, cert: "M", src: "manual,hist24,s2,cur4", cur: "3)",
    text: "지하층·무창층에 설치된 운수시설·창고시설(물류터미널) 바닥면적 합계 1천㎡ 이상 (법령집 2012.9.14. / 매뉴얼 2013.2.10.)", scope: "해당 부분",
    when: (c) => (c.g("transport", "logistics") ? ugWlUseGE(c, 1000) : F),
    basis: (c) => `지하층·무창층 바닥면적 합계 ${fmt(ugWlTotal(c))}㎡`,
  },
  {
    id: "sm-ug-med", fac: "smoke", fromU: [D.S15b, D.S15c], to: INF, cert: "M", src: "manual,reasons,s2,cur4", cur: "3)",
    text: "지하층·무창층에 설치된 의료·노유자시설 바닥면적 합계 1천㎡ 이상 (2015.1.6. 개정, 부칙상 공포 후 3개월 — 매뉴얼 2015.4.7. / 법령집 2015.4.8.)", scope: "해당 부분",
    when: (c) => (c.g("medical", "noyu") ? ugWlUseGE(c, 1000) : F),
    basis: (c) => `지하층·무창층 바닥면적 합계 ${fmt(ugWlTotal(c))}㎡`,
  },
  {
    id: "sm-terminal", fac: "smoke", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "4)",
    text: "시외버스정류장·철도역사·공항·항만(해운)시설 대합실·휴게시설로서 지하층·무창층 바닥면적 1천㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("terminal") ? ugWlUseGE(c, 1000) : F),
    basis: (c) => `지하층·무창층 바닥면적 합계 ${fmt(ugWlTotal(c))}㎡`,
  },
  {
    id: "sm-ugmall", fac: "smoke", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "5)",
    text: "지하가(터널 제외) 연면적 1천㎡ 이상", scope: "해당 대상물",
    when: (c) => (c.g("ugmall") ? ge(c.x.area, 1000) : F), basis: A,
  },
  {
    id: "sm-tunnel-97", fac: "smoke", from: D.P97, to: D.B08, cert: "M", src: "manual", cur: "",
    text: "터널 길이 1천m 이상 (1997.9.27.~2008.8.15.)", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 1000) : F), basis: TL,
  },
  {
    id: "sm-tunnel", fac: "smoke", from: D.B08, to: INF, cert: "M", src: "manual,hist24,s2,cur4", cur: "6)",
    text: "터널 — 2008.8.16.~ 길이 500m 이상으로서 위험등급 이상, 2013.2.10.~ 길이요건 삭제(예상교통량·경사도 등 행정안전부령 위험등급)", scope: "터널",
    when: (c) => (c.g("tunnel") ? (c.d < D.B13 ? and(ge(tunnelLen(c), 500), U) : U) : F),
    basis: (c) => `${TL(c)} — 행정안전부령(터널 위험등급) 확인 필요`,
  },
  {
    id: "sm-stair", fac: "smoke", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "7)",
    text: "특별피난계단·비상용 승강기 승강장·피난용 승강기 승강장 (갓복도형 아파트 1995.8.10.~ 제외)", scope: "부속실·승강장",
    when: (c) => !!c.f.specialStairs && !(c.f.corridorApt && c.d >= D.P95), basis: () => "특별피난계단·비상용승강기 승강장 있음",
  },

  // ───────────────────────── 연결송수관설비 ─────────────────────────
  {
    id: "sp-5f", fac: "standpipe", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "1)",
    text: "층수 5층 이상 + 연면적 6천㎡ 이상 (가스시설·지하구 제외)", scope: "모든 층",
    when: (c) => (c.g("gas", "ugduct", "tunnel") ? F : and(ge(c.x.gf, 5), ge(c.x.area, 6000))), basis: (c) => `${GF(c)}, ${A(c)}`,
  },
  {
    id: "sp-7f-old", fac: "standpipe", from: D.P92, to: D.A, cert: "M", src: "manual", cur: "",
    text: "(소방법) 지하층을 제외한 층수 7층 이상", scope: "모든 층",
    when: (c) => (c.g("gas", "ugduct", "tunnel") ? F : ge(c.x.gf, 7)), basis: GF,
  },
  {
    id: "sp-7f", fac: "standpipe", from: D.A, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "2)",
    text: "지하층 포함 층수 7층 이상 (2004.5.30.)", scope: "모든 층",
    when: (c) => (c.g("gas", "ugduct", "tunnel") ? F : ge(c.x.totalFloors, 7)), basis: TF,
  },
  {
    id: "sp-ug3-92", fac: "standpipe", from: D.P92, to: D.P94, cert: "M", src: "manual", cur: "",
    text: "(소방법) 지하층 층수 3층 이상 (1992.7.28.)", scope: "모든 층",
    when: (c) => (c.g("gas", "ugduct", "tunnel") ? F : ge(c.x.bf, 3)), basis: (c) => `지하 ${c.x.bf}층`,
  },
  {
    id: "sp-ug3", fac: "standpipe", from: D.P94, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "3)",
    text: "지하층 층수 3층 이상 + 지하층 바닥면적 합계 1천㎡ 이상 (1994.7.20.)", scope: "모든 층",
    when: (c) => (c.g("gas", "ugduct", "tunnel") ? F : and(ge(c.x.bf, 3), ge(c.x.ugSum, 1000))),
    basis: (c) => `지하 ${c.x.bf}층, 지하층 합계 ${fmt(c.x.ugSum)}㎡`,
  },
  {
    id: "sp-tunnel-2000", fac: "standpipe", from: D.P97, to: D.B08, cert: "M", src: "manual,s1", cur: "",
    text: "터널 길이 2천m 이상 (1997.9.27.~2008.8.15.)", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 2000) : F), basis: TL,
  },
  {
    id: "sp-tunnel-1000", fac: "standpipe", from: D.B08, to: D.C26, cert: "M", src: "manual,s2,cur4", cur: "4)",
    text: "터널 길이 1천m 이상 (2008.8.16.)", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 1000) : F), basis: TL,
  },
  {
    id: "sp-tunnel-500", fac: "standpipe", from: D.C26, to: INF, cert: "V", src: "reasons,fpn2026,curDecree", cur: "4)",
    text: "터널 길이 500m 이상 (2026.3.1. 이후 터널 설계용역 입찰공고분 — 기준일을 입찰공고일로 입력)", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 500) : F), basis: TL,
  },

  // ───────────────────────── 연결살수설비 ─────────────────────────
  {
    id: "cs-retail", fac: "conspk", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "1)",
    text: "판매시설(영업시설): 해당 용도 바닥면적 합계 1천㎡ 이상", scope: "해당 시설",
    when: (c) => (c.g("retail") ? ge(c.x.useArea, 1000) : F), basis: UA,
  },
  {
    id: "cs-retail-trans", fac: "conspk", from: D.B11, to: INF, cert: "M", src: "hist24,s2,cur4", cur: "1)",
    text: "운수시설·창고시설(물류터미널): 해당 용도 바닥면적 합계 1천㎡ 이상 (2011.7.7.)", scope: "해당 시설",
    when: (c) => (c.g("transport", "logistics") ? ge(c.x.useArea, 1000) : F), basis: UA,
  },
  {
    id: "cs-ug", fac: "conspk", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "2)",
    text: "지하층 바닥면적 합계 150㎡ 이상(국민주택규모 이하 아파트 지하층(대피시설)·학교 지하층은 700㎡ / 2012.2.5.부터 피난층으로 주출입구가 도로와 접한 지하층 제외)", scope: "지하층의 모든 층",
    when: (c) => {
      if (c.g("ugduct") || c.x.bf <= 0 || (c.f.roadDirect && c.d >= D.B12)) return F;
      const t = c.g("school") || (c.g("apt") && c.f.nationalHousingShelter) ? 700 : 150;
      return ge(c.x.ugSum, t);
    },
    basis: (c) => `지하층 합계 ${fmt(c.x.ugSum)}㎡`,
  },
  {
    id: "cs-gas-old", fac: "conspk", from: D.P92, to: D.P94, cert: "M", src: "manual", cur: "",
    text: "(소방법) 가연성가스 100톤 이상 저장·취급 (1992.7.28.~1994.7.19.)", scope: "탱크시설",
    when: (c) => (c.g("gas") ? ge(gasTon(c), 100) : F), basis: (c) => `탱크 ${fmt(gasTon(c))}톤`,
  },
  {
    id: "cs-gas", fac: "conspk", from: D.P94, to: INF, cert: "V", src: "hist24,s1,s2,cur4", cur: "3)",
    text: "가스시설 지상 노출 탱크 저장용량 30톤 이상 (1994.7.20.)", scope: "탱크시설",
    when: (c) => (c.g("gas") ? ge(gasTon(c), 30) : F), basis: (c) => `탱크 ${fmt(gasTon(c))}톤`,
  },
  {
    id: "cs-ugpark", fac: "conspk", from: D.C26, to: INF, cert: "I", src: "reasons,fpn2026", cur: "5)·6)",
    text: "지하 차고·주차장 200㎡ 미만, 20대 미만 기계식 주차시설 (2026.3.1. 이후 신청분 — 원문 문구 확인)", scope: "해당 부분",
    when: (c) => or(and(ge(ugpk(c), 0.01), lt(ugpk(c), 200)), and(ge(n0(c.f.mechCars), 1), lt(n0(c.f.mechCars), 20))),
    basis: (c) => `지하 주차장 ${fmt(ugpk(c))}㎡, 기계식 ${fmt(n0(c.f.mechCars))}대`,
  },

  // ───────────────────────── 비상콘센트설비 ─────────────────────────
  {
    id: "out-11f", fac: "outlet", from: D.P92, to: INF, cert: "V", src: "manual,hist24,s1,s2,cur4", cur: "1)",
    text: "층수 11층 이상 — 11층 이상의 층 (2004.5.30.~2014.10.7.은 '지하층을 포함하는 층수 11층 이상', 그 외 기간은 지하층 제외 층수)", scope: "11층 이상의 층",
    when: (c) => (c.g("gas", "ugduct") ? F : c.d >= D.A && c.d < D.U14b ? ge(c.x.totalFloors, 11) : ge(c.x.gf, 11)),
    basis: (c) => (c.d >= D.A && c.d < D.U14b ? TF(c) : GF(c)),
  },
  {
    id: "out-ug-92", fac: "outlet", from: D.P92, to: D.P94, cert: "M", src: "manual", cur: "",
    text: "(소방법) 지하층 3층 이상", scope: "지하층의 모든 층",
    when: (c) => (c.g("gas", "ugduct") ? F : ge(c.x.bf, 3)), basis: (c) => `지하 ${c.x.bf}층`,
  },
  {
    id: "out-ug", fac: "outlet", from: D.P94, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "2)",
    text: "지하층 층수 3층 이상 + 지하층 바닥면적 합계 1천㎡ 이상 (1994.7.20.)", scope: "지하층의 모든 층",
    when: (c) => (c.g("gas", "ugduct") ? F : and(ge(c.x.bf, 3), ge(c.x.ugSum, 1000))),
    basis: (c) => `지하 ${c.x.bf}층, 지하층 합계 ${fmt(c.x.ugSum)}㎡`,
  },
  {
    id: "out-tunnel", fac: "outlet", from: D.P97, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "3)",
    text: "터널 길이 500m 이상 (1997.9.27.)", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 500) : F), basis: TL,
  },

  // ───────────────────────── 무선통신보조설비 ─────────────────────────
  {
    id: "rd-ugmall", fac: "radio", from: D.P92, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "1)",
    text: "지하가(터널 제외) 연면적 1천㎡ 이상", scope: "해당 대상물",
    when: (c) => (c.g("ugmall") ? ge(c.x.area, 1000) : F), basis: A,
  },
  {
    id: "rd-ug-92", fac: "radio", from: D.P92, to: D.P94, cert: "M", src: "manual", cur: "",
    text: "(소방법) 지하층 바닥면적 합계 3천㎡ 이상 또는 지하층 3층 이상", scope: "지하층의 모든 층",
    when: (c) => (c.g("gas") || c.x.bf <= 0 ? F : or(ge(c.x.ugSum, 3000), ge(c.x.bf, 3))),
    basis: (c) => `지하 ${c.x.bf}층, 지하층 합계 ${fmt(c.x.ugSum)}㎡`,
  },
  {
    id: "rd-ug", fac: "radio", from: D.P94, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "2)",
    text: "지하층 바닥면적 합계 3천㎡ 이상, 또는 지하층 층수 3층 이상 + 지하층 바닥면적 합계 1천㎡ 이상 (1994.7.20.)", scope: "지하층의 모든 층",
    when: (c) => (c.g("gas") || c.x.bf <= 0 ? F : or(ge(c.x.ugSum, 3000), and(ge(c.x.bf, 3), ge(c.x.ugSum, 1000)))),
    basis: (c) => `지하 ${c.x.bf}층, 지하층 합계 ${fmt(c.x.ugSum)}㎡`,
  },
  {
    id: "rd-tunnel", fac: "radio", from: D.P97, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "3)",
    text: "터널 길이 500m 이상 (1997.9.27.)", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 500) : F), basis: TL,
  },
  {
    id: "rd-commonduct", fac: "radio", from: D.P01, to: INF, cert: "V", src: "manual,s1,s2,cur4", cur: "4)",
    text: "지하구 중 공동구 (2001.5.20.)", scope: "공동구",
    when: (c) => c.g("commonduct"), basis: (c) => c.u.name,
  },
  {
    id: "rd-30f", fac: "radio", from: D.B12, to: INF, cert: "V", src: "manual,reasons,s2,cur4", cur: "5)",
    text: "층수 30층 이상 (16층 이상 부분의 모든 층, 2012.2.5.)", scope: "16층 이상의 모든 층",
    when: (c) => (c.g("gas") ? F : ge(c.x.gf, 30)), basis: GF,
  },

  // ───────────────────────── 연소방지설비 ─────────────────────────
  {
    id: "spr-duct", fac: "spread", from: D.P94, to: INF, cert: "M", src: "manual,cur4", cur: "",
    text: "지하구 — 1994.7.20. 내무부령 지하구, 1999.2.5. 폭 1.8m·높이 2m·길이 50m(전력·통신구 500m) 이상, 2004.5.30. 전력·통신사업용 지하구", scope: "지하구",
    when: (c) => (c.g("ugduct") ? (c.d < D.A ? U : T) : F),
    basis: (c) => (c.d < D.A ? "지하구 규모 요건 확인" : c.u.name),
  },
];

// ── 보조 함수 ──
/** 라스(철망) 비내화구조 여부 — 종전 입력(leak100A 하나로 두 요건 표시)은 라스구조 포함으로 간주 */
function lath(c) {
  return c.f.lath === undefined ? !!c.f.leak100A : !!c.f.lath;
}
/** 비상조명등 1992~2004 제외: 1994.7.20.~ 차고·주차장·가스시설·지하구·창고·하역장 */
function elOldExcl(c) {
  if (c.d < D.P94) return false;
  return c.g("parking", "gas", "ugduct") || (c.g("warehouse") && !c.g("logistics"));
}
function elExcl(c) {
  return c.g("gas") || (c.g("warehouse") && !c.g("logistics")) || c.g("cattle");
}
function ugWlTotal(c) {
  return c.x.ugWlSum;
}
function ugWlUseGE(c, t) {
  return ge(ugWlTotal(c), t);
}
function escapeFloors(c) {
  const parts = [];
  if (c.x.bf > 0 && c.d >= D.P94) parts.push(`지하 1~${c.x.bf}층(피난층 제외)`);
  if (c.x.gf >= 3) parts.push(`지상 3~${Math.min(c.x.gf, 10)}층`);
  return parts.join(", ") || "해당 층 없음";
}

/** 소방법(1992.7.28.~2004.5.29.) 자동화재탐지설비 용도군 — 매뉴얼 연도별 적용기준 */
function afdOldSets(c) {
  const d = c.d;
  const g = c.g;
  const nb = g("neigh") && !g("bath");
  const edu = g("edu") || (g("training") && !(d >= D.P01 && g("training_lodge")));
  const wi = g("recycle", "cemetery"); // 위생 등 관련 시설
  if (d < D.P95) {
    const early = d < D.P94;
    return {
      s600: nb || g("entertain", "culture", "sports", "lodging", "noyu", "medical", "broadcast", "tourist", "ugmall", "mixed"),
      s1000: g("bath", "retail", "apt", "dorm", "factory", "warehouse") || (!early && g("office", "transport", "aircar")),
      s2000: edu || g("religion", "animal", "correction") || wi || (early && g("office", "transport", "aircar")),
    };
  }
  if (d < D.P01) {
    return {
      s600: nb || g("entertain", "lodging", "noyu", "medical", "mixed"),
      s1000: g("bath", "culture", "sports", "broadcast", "tourist", "ugmall", "retail", "apt", "dorm", "office", "transport", "aircar", "factory", "warehouse"),
      s2000: edu || g("religion", "animal", "correction") || wi,
    };
  }
  return {
    s600: nb || g("entertain", "lodging", "medical", "mixed"),
    s1000: g("bath", "culture", "sports", "broadcast", "tourist", "ugmall", "retail", "apt", "dorm", "office", "transport", "aircar", "factory", "warehouse"),
    s2000: edu || g("religion", "animal", "correction") || wi,
  };
}
function afdOld(c) {
  if (c.g("tunnel")) return F;
  const s = afdOldSets(c);
  let r = or(s.s600 ? ge(c.x.area, 600) : F, s.s1000 ? ge(c.x.area, 1000) : F, s.s2000 ? ge(c.x.area, 2000) : F);
  // 1994.7.20.~2001.5.20.: 아파트는 공동주택관리령 제7조① 의무관리대상(300세대 이상·승강기 설치·중앙집중난방)만
  if (r === T && c.g("apt") && c.d >= D.P94 && c.d < D.P01) {
    const hh = num(c.f.households);
    if (!(hh !== null && hh >= 300)) r = U;
  }
  return r;
}
function afdOldGroup(c) {
  const s = afdOldSets(c);
  return s.s600 ? "600㎡ 용도군" : s.s1000 ? "1,000㎡ 용도군" : s.s2000 ? "2,000㎡ 용도군" : "해당 용도군 없음";
}

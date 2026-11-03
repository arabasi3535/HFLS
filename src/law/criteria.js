// ============================================================
// 소방시설 설치기준 판정 규칙 (시기별 효력 구간 포함)
//
// 각 규칙(criterion)
//   id      : 고유 ID (관리자 검증메모 키)
//   fac     : 소방시설 키(facilities.js)
//   from/to : 효력 구간 [from, to) — 기준일(건축허가등 신청일)과 비교
//   fromU   : [a, b] 도입시점 불명확 구간(a~b 사이 도입) → 해당 구간 판정은 [확인 필요]
//   toU     : [a, b] 폐지/변경시점 불명확 구간
//   cert    : 'V' 원문·부칙·개정이유 확인 / 'I' 시점 추정 / 'U' 미검증
//   src     : 근거 원문 키(sources.js)
//   cur     : 현행 별표4 세부번호(기준일이 2022.12.1. 이후일 때 표시)
//   text    : 기준 요지(기준값)
//   scope   : 설치 범위
//   when    : (ctx) => true | false | null(입력 부족)
//   basis   : (ctx) => 대상물 수치 설명
//
// 원문 대조 자료:
//   S1 = 소방시설설치유지법 시행령 별표4(초기본), S2 = 화재예방소방시설법 시행령 별표5(2020.12.10.),
//   S3 = 소방시설법 시행령 별표4(2025.11.25.), 그리고 법제처 제·개정이유·부칙
// ============================================================
import { D } from "./sources";
import { ge, lt, between, or, and, num, fmt, T, F, U } from "./logic";

const INF = "9999-12-31";
const n0 = (v) => num(v) ?? 0; // 부가조건 수치: 미입력은 0(해당없음)으로 보고 체크리스트로 안내
const tunnelLen = (c) => (c.g("tunnel") ? num(c.f.tunnelLen) : 0);
const comb = (c) => n0(c.f.combustibleTimes);
const ugpk = (c) => n0(c.f.ugParking);

const A = (s) => `연면적 ${fmt(s.x.area)}㎡`;
const UA = (s) => `해당 용도 바닥면적 합계 ${fmt(s.x.useArea)}㎡${s.x.useAreaAssumed ? "(미입력→연면적 적용)" : ""}`;
const GF = (s) => `지상 ${s.x.gf}층`;
const TF = (s) => `지하층 포함 ${s.x.totalFloors}층`;

export const CRITERIA = [
  // ───────────────────────── 소화기구 ─────────────────────────
  {
    id: "ext-33", fac: "ext", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)",
    text: "연면적 33㎡ 이상", scope: "해당 대상물",
    when: (c) => ge(c.x.area, 33), basis: A,
  },
  {
    id: "ext-special", fac: "ext", fromU: [D.A, D.C], to: INF, cert: "I", src: "cur4", cur: "2)·3)",
    text: "가스시설·발전시설 중 전기저장시설·국가유산(지정문화유산)·터널 (면적 무관)", scope: "해당 대상물",
    when: (c) => c.g("gas", "ess", "heritage", "tunnel"), basis: (c) => c.u.name,
  },
  {
    id: "ext-duct", fac: "ext", from: D.S2, to: INF, cert: "V", src: "reasons,cur4", cur: "4)",
    text: "지하구 (2020.12.10. 시행, 기존 공동구는 부칙으로 2022.12.9.까지)", scope: "지하구",
    when: (c) => c.g("ugduct"), basis: (c) => c.u.name,
  },

  // ───────────────────────── 자동소화장치 ─────────────────────────
  {
    id: "auto-apt05", fac: "autoext", from: D.APT05, to: D.C, cert: "I", src: "curDecree", cur: "",
    text: "아파트 각 세대 주방 자동식소화기 (제18404호, 2005.1.1. 시행분 — 층수 범위 등 세부는 연혁본 확인)", scope: "각 세대 주방",
    when: (c) => c.g("apt"), basis: (c) => c.u.name,
  },
  {
    id: "auto-ot30", fac: "autoext", from: D.B12, to: D.C, cert: "V", src: "reasons", cur: "",
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
    id: "hyd-1", fac: "hydrant", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)",
    text: "연면적 3천㎡ 이상(터널 제외) 또는 지하층·무창층(축사 제외)·4층 이상 층 중 바닥면적 600㎡ 이상인 층이 있는 것", scope: "모든 층",
    when: (c) =>
      c.g("gas", "ugduct") ? F
        : or(and(ge(c.x.area, 3000), !c.g("tunnel")), c.g("cattle") ? F : c.x.ugOrWlGE(600), c.x.upper4GE(600)),
    basis: (c) => `${A(c)}, 지하·무창층 최대 ${fmt(c.x.ugOrWlMax)}㎡`,
  },
  {
    id: "hyd-2", fac: "hydrant", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "2)",
    text: "근생·판매·운수·의료·노유자·업무·숙박·위락·공장·창고·항공기및자동차·교정(국방·군사 제외)·방송통신·발전·장례·복합: 연면적 1,500㎡ 이상 또는 지하층·무창층·4층 이상 층 중 바닥면적 300㎡ 이상인 층", scope: "모든 층",
    when: (c) =>
      c.g("neigh", "retail", "transport", "medical", "noyu", "office", "lodging", "entertain", "factory", "warehouse", "aircar", "broadcast", "power", "funeral", "mixed") ||
      (c.g("correction") && !c.g("military"))
        ? or(ge(c.x.area, 1500), c.x.ugOrWlGE(300), c.x.upper4GE(300))
        : F,
    basis: A,
  },
  {
    id: "hyd-roof", fac: "hydrant", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "건축물 옥상 차고·주차장 200㎡ 이상", scope: "해당 부분",
    when: (c) => ge(n0(c.f.rooftopParking), 200), basis: (c) => `옥상 주차장 ${fmt(n0(c.f.rooftopParking))}㎡`,
  },
  {
    id: "hyd-tunnel", fac: "hydrant", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "4)",
    text: "터널 길이 1천m 이상 (또는 행정안전부령으로 정하는 터널)", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 1000) : F), basis: (c) => `터널 길이 ${fmt(tunnelLen(c))}m`,
  },
  {
    id: "hyd-comb", fac: "hydrant", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "5)",
    text: "공장·창고: 특수가연물 지정수량 750배 이상 저장·취급", scope: "해당 대상물",
    when: (c) => (c.g("factory", "warehouse") ? ge(comb(c), 750) : F), basis: (c) => `특수가연물 ${fmt(comb(c))}배`,
  },

  // ───────────────────────── 스프링클러설비 ─────────────────────────
  {
    id: "spk-11f", fac: "spk", from: D.A, to: D.B17, cert: "V", src: "s1,reasons", cur: "",
    text: "층수 11층 이상 (모든 층) — 2017.1.28. 전 기준", scope: "모든 층",
    when: (c) => (c.g("apt") && c.d < D.APT07 ? F : ge(c.x.gf, 11)), basis: GF,
  },
  {
    id: "spk-apt-pre07", fac: "spk", from: D.A, to: D.APT07, cert: "U", src: "reasons", cur: "",
    text: "아파트 스프링클러 — 2007.7.1. 전 허가신청분은 종전 기준(대통령령 제19748호 부칙). 적용 층 범위 연혁본 확인 필요", scope: "[확인 필요]",
    when: (c) => and(c.g("apt"), ge(c.x.gf, 11)), basis: GF,
  },
  {
    id: "spk-6f", fac: "spk", from: D.B17, to: INF, cert: "V", src: "s2,cur4,reasons", cur: "1)",
    text: "층수 6층 이상 (모든 층) — 단, 연면적·층높이 불변 아파트 리모델링, 스프링클러 없는 기존 대상물의 용도변경(일부 용도 제외)은 예외", scope: "모든 층",
    when: (c) => ge(c.x.gf, 6), basis: GF,
  },
  {
    id: "spk-dorm", fac: "spk", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "2)",
    text: "기숙사(교육연구·수련시설 내 학생 수용) 또는 복합건축물: 연면적 5천㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("dorm", "edu_dorm", "mixed") ? ge(c.x.area, 5000) : F), basis: A,
  },
  {
    id: "spk-assembly", fac: "spk", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "문화집회(동·식물원 제외)·종교(목조 제외)·운동(물놀이형 등 제외): 수용인원 100명 이상, 영화상영관 지하·무창층 500㎡/그 밖 1천㎡ 이상, 무대부 지하·무창·4층 이상 300㎡/그 밖 500㎡ 이상", scope: "모든 층",
    when: (c) => {
      if (!(c.g("culture", "religion", "sports") && !c.g("zoo"))) return F;
      const cin = c.g("cinema") ? ge(num(c.f.cinemaArea) ?? c.x.useArea, c.f.cinemaUG ? 500 : 1000) : F;
      const stage = num(c.f.stageArea) ? ge(num(c.f.stageArea), c.f.stageUG ? 300 : 500) : F;
      return or(ge(c.x.occ, 100), cin, stage);
    },
    basis: (c) => `수용인원 ${fmt(c.x.occ)}명${c.g("cinema") ? `, 상영관 ${fmt(num(c.f.cinemaArea) ?? c.x.useArea)}㎡` : ""}${num(c.f.stageArea) ? `, 무대부 ${fmt(num(c.f.stageArea))}㎡` : ""}`,
  },
  {
    id: "spk-retail-s1", fac: "spk", from: D.A, toU: [D.A, D.S2], cert: "V", src: "s1", cur: "",
    text: "(초기 기준) 판매시설: 3층 이하 바닥면적 합계 6천㎡ 이상, 4층 이상 5천㎡ 이상, 또는 수용인원 500명 이상 — 변경시점 확인 필요", scope: "모든 층",
    when: (c) =>
      c.g("retail")
        ? or(and(lt(c.x.gf, 4), ge(c.x.useArea, 6000)), and(ge(c.x.gf, 4), ge(c.x.useArea, 5000)), ge(c.x.occ, 500))
        : F,
    basis: (c) => `${UA(c)}, 수용인원 ${fmt(c.x.occ)}명`,
  },
  {
    id: "spk-retail", fac: "spk", fromU: [D.A, D.S2], to: INF, cert: "V", src: "s2,cur4", cur: "4)",
    text: "판매시설·운수시설·창고시설(물류터미널): 바닥면적 합계 5천㎡ 이상 또는 수용인원 500명 이상", scope: "모든 층",
    when: (c) => (c.g("retail", "transport", "logistics") ? or(ge(c.x.useArea, 5000), ge(c.x.occ, 500)) : F),
    basis: (c) => `${UA(c)}, 수용인원 ${fmt(c.x.occ)}명`,
  },
  {
    id: "spk-care", fac: "spk", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "5)",
    text: "노유자시설·정신의료기관·숙박이 가능한 수련시설: 바닥면적 합계 600㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("noyu", "mental", "training_lodge") ? ge(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "spk-nursing", fac: "spk", from: D.B14, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "5)",
    text: "요양병원: 바닥면적 합계 600㎡ 이상 (2014.7.8.)", scope: "모든 층",
    when: (c) => (c.g("nursing") ? ge(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "spk-hosp", fac: "spk", from: D.B19, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "5)",
    text: "종합병원·병원·치과병원·한방병원: 바닥면적 합계 600㎡ 이상 (2019.8.6.)", scope: "모든 층",
    when: (c) => (c.g("hosp") ? ge(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "spk-midlodge", fac: "spk", from: D.C, to: INF, cert: "I", src: "cur4", cur: "5)",
    text: "조산원·산후조리원, 숙박시설: 바닥면적 합계 600㎡ 이상 (2022.12.1. 전부개정 시 도입 추정)", scope: "모든 층",
    when: (c) => (c.g("midwife", "lodging") ? ge(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "spk-ware", fac: "spk", from: D.B14, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "6)",
    text: "창고시설(물류터미널 제외): 바닥면적 합계 5천㎡ 이상 (2014.7.8.)", scope: "모든 층",
    when: (c) => (c.g("warehouse") && !c.g("logistics") ? ge(c.x.useArea, 5000) : F), basis: UA,
  },
  {
    id: "spk-floor1000", fac: "spk", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "7)",
    text: "지하층·무창층(축사 제외) 또는 4층 이상인 층으로서 바닥면적 1천㎡ 이상인 층", scope: "해당 층",
    when: (c) => (c.g("cattle") ? c.x.upper4GE(1000) : c.x.ugWlOrUpper4GE(1000)),
    basis: (c) => "층별 바닥면적 기준",
  },
  {
    id: "spk-rack", fac: "spk", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "8)",
    text: "랙식 창고(천장·반자 높이 10m 초과): 랙 부분 바닥면적 합계 1,500㎡ 이상", scope: "모든 층",
    when: (c) => ge(n0(c.f.rackArea), 1500), basis: (c) => `랙 부분 ${fmt(n0(c.f.rackArea))}㎡`,
  },
  {
    id: "spk-comb", fac: "spk", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "9)",
    text: "공장·창고: 특수가연물 1천배 이상 저장·취급", scope: "해당 대상물",
    when: (c) => (c.g("factory", "warehouse") ? ge(comb(c), 1000) : F), basis: (c) => `특수가연물 ${fmt(comb(c))}배`,
  },
  {
    id: "spk-radwaste", fac: "spk", from: D.B08, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "9)나)",
    text: "중·저준위방사성폐기물 저장시설 중 소화수 수집·처리설비가 있는 저장시설 (2008.8.16.)", scope: "해당 시설",
    when: (c) => c.f.radwaste === "withWater", basis: () => "소화수 수집·처리설비 있음",
  },
  {
    id: "spk-nonfire", fac: "spk", from: D.B14, to: INF, cert: "I", src: "reasons,s2,cur4", cur: "10)",
    text: "지붕·외벽이 불연재료가 아니거나 내화구조가 아닌 공장·창고: 물류터미널 2,500㎡·250명, 창고 2,500㎡, 지하·무창·4층 이상 층 500㎡, 랙식 750㎡, 특수가연물 500배 이상 (2014.7.8. 도입, 세부항목 도입시점 추정)", scope: "모든 층",
    when: (c) => {
      if (!(c.g("factory", "warehouse") && c.f.nonFireproof)) return F;
      return or(
        c.g("logistics") ? or(ge(c.x.useArea, 2500), ge(c.x.occ, 250)) : F,
        c.g("warehouse") && !c.g("logistics") ? ge(c.x.useArea, 2500) : F,
        c.x.ugWlOrUpper4GE(500),
        ge(n0(c.f.rackArea), 750),
        ge(comb(c), 500)
      );
    },
    basis: (c) => `${UA(c)}, 불연·내화 아님`,
  },
  {
    id: "spk-corr", fac: "spk", from: D.B08, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "11)",
    text: "교정시설(보호감호소·교도소·구치소 등 수용거실, 경찰서 유치장 등)", scope: "해당 장소",
    when: (c) => c.g("correction") && !c.g("military"), basis: (c) => c.u.name,
  },
  {
    id: "spk-ugmall", fac: "spk", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "12)",
    text: "지하가(터널 제외) 연면적 1천㎡ 이상", scope: "해당 대상물",
    when: (c) => (c.g("ugmall") ? ge(c.x.area, 1000) : F), basis: A,
  },
  {
    id: "spk-ess", fac: "spk", from: D.C, to: INF, cert: "I", src: "cur4", cur: "13)",
    text: "발전시설 중 전기저장시설", scope: "해당 시설",
    when: (c) => c.g("ess"), basis: (c) => c.u.name,
  },

  // ───────────────────────── 간이스프링클러설비 ─────────────────────────
  {
    id: "sspk-row", fac: "sspk", from: D.C24, to: INF, cert: "V", src: "cur4,curDecree", cur: "1)",
    text: "연립주택·다세대주택 — 주택전용 간이스프링클러설비 (2024.12.1. 이후 신청분)", scope: "주택 부분",
    when: (c) => c.g("row", "multi"), basis: (c) => c.u.name,
  },
  {
    id: "sspk-neigh", fac: "sspk", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "2)가)",
    text: "근린생활시설로 사용하는 부분의 바닥면적 합계 1천㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("neigh") ? ge(c.x.useArea, 1000) : F), basis: UA,
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
    id: "sspk-midwife", fac: "sspk", from: D.C, to: INF, cert: "I", src: "cur4", cur: "2)다)",
    text: "조산원·산후조리원 연면적 600㎡ 미만", scope: "해당 시설",
    when: (c) => (c.g("midwife") ? lt(c.x.area, 600) : F), basis: A,
  },
  {
    id: "sspk-nursing", fac: "sspk", from: D.B14, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "3)가)",
    text: "요양병원(의료재활시설 제외) 바닥면적 합계 600㎡ 미만 (2014.7.8.)", scope: "해당 시설",
    when: (c) => (c.g("nursing") ? lt(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "sspk-hosp", fac: "sspk", from: D.B19, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "3)가)",
    text: "종합병원·병원·치과병원·한방병원 바닥면적 합계 600㎡ 미만 (2019.8.6.)", scope: "해당 시설",
    when: (c) => (c.g("hosp") ? lt(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "sspk-mental", fac: "sspk", from: D.B08, to: INF, cert: "I", src: "reasons,s2,cur4", cur: "3)나)·다)",
    text: "정신의료기관·의료재활시설: 바닥면적 합계 300㎡ 이상 600㎡ 미만, 또는 300㎡ 미만으로 창살(자동개방 제외) 설치", scope: "해당 시설",
    when: (c) => (c.g("mental", "rehab") ? or(between(c.x.useArea, 300, 600), and(lt(c.x.useArea, 300), !!c.f.bars)) : F),
    basis: (c) => `${UA(c)}${c.f.bars ? ", 창살 있음" : ""}`,
  },
  {
    id: "sspk-edudorm", fac: "sspk", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "4)",
    text: "교육연구시설 내 합숙소 연면적 100㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("edu_dorm") ? ge(c.x.area, 100) : F), basis: A,
  },
  {
    id: "sspk-noyures", fac: "sspk", from: D.B12, to: INF, cert: "V", src: "reasons,incheon2012,s2,cur4", cur: "5)가)",
    text: "노유자 생활시설 (면적 무관, 2012.2.5.) ※ 단독·공동주택에 설치되는 일부 시설 제외", scope: "해당 시설",
    when: (c) => c.g("noyu_res"), basis: (c) => c.u.name,
  },
  {
    id: "sspk-noyu", fac: "sspk", from: D.B08, to: INF, cert: "I", src: "reasons,s2,cur4", cur: "5)나)·다)",
    text: "노유자시설(생활시설 외): 바닥면적 합계 300㎡ 이상 600㎡ 미만, 또는 300㎡ 미만으로 창살 설치", scope: "해당 시설",
    when: (c) =>
      c.g("noyu") && !c.g("noyu_res") ? or(between(c.x.useArea, 300, 600), and(lt(c.x.useArea, 300), !!c.f.bars)) : F,
    basis: (c) => `${UA(c)}${c.f.bars ? ", 창살 있음" : ""}`,
  },
  {
    id: "sspk-lodging-s2", fac: "sspk", from: D.B13, to: D.C, cert: "V", src: "reasons,s2", cur: "",
    text: "취사 가능한 숙박시설(생활숙박시설) 바닥면적 합계 600㎡ 이상 (2013.2.10.~2022.11.30.)", scope: "모든 층",
    when: (c) => (c.g("lodging") && c.f.cooking ? ge(c.x.useArea, 600) : F), basis: UA,
  },
  {
    id: "sspk-lodging", fac: "sspk", from: D.C, to: INF, cert: "I", src: "cur4", cur: "6)",
    text: "숙박시설 바닥면적 합계 300㎡ 이상 600㎡ 미만", scope: "해당 시설",
    when: (c) => (c.g("lodging") ? between(c.x.useArea, 300, 600) : F), basis: UA,
  },
  {
    id: "sspk-mixedres", fac: "sspk", from: D.B13, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "8)",
    text: "복합건축물(별표2 제30호나목: 근생·판매·업무·숙박·위락 + 주택) 연면적 1천㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("mixed_res") ? ge(c.x.area, 1000) : F), basis: A,
  },

  // ───────────────────────── 물분무등소화설비 ─────────────────────────
  {
    id: "wat-hangar", fac: "water", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)",
    text: "항공기 격납고", scope: "해당 시설",
    when: (c) => c.g("hangar"), basis: (c) => c.u.name,
  },
  {
    id: "wat-parkbldg", fac: "water", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "2)",
    text: "차고·주차용 건축물·철골 조립식 주차시설 연면적 800㎡ 이상", scope: "해당 시설",
    when: (c) => (c.g("parking") ? ge(c.x.area, 800) : F), basis: A,
  },
  {
    id: "wat-inpark", fac: "water", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "건축물 내부 차고·주차장 면적 합계 200㎡ 이상 (50세대 미만 연립·다세대 제외 — 2017.1.28.)", scope: "해당 부분",
    when: (c) => {
      if (c.g("gas", "ugduct")) return F;
      if (c.g("row", "multi") && c.d >= D.B17 && lt(n0(c.f.households), 50) === T) return F;
      return ge(n0(c.f.parkingInside), 200);
    },
    basis: (c) => `내부 차고·주차장 ${fmt(n0(c.f.parkingInside))}㎡`,
  },
  {
    id: "wat-mech", fac: "water", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "4)",
    text: "기계장치에 의한 주차시설로 20대 이상 주차", scope: "해당 시설",
    when: (c) => ge(n0(c.f.mechCars), 20), basis: (c) => `기계식 ${fmt(n0(c.f.mechCars))}대`,
  },
  {
    id: "wat-elec", fac: "water", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "5)",
    text: "전기실·발전실·변전실·축전지실·통신기기실·전산실 바닥면적 300㎡ 이상(하나의 방화구획 내 실은 합산, 불연 절연유 변압기 등만 있는 실 제외)", scope: "해당 실",
    when: (c) => ge(n0(c.f.elecRoom), 300), basis: (c) => `전기실 등 ${fmt(n0(c.f.elecRoom))}㎡`,
  },
  {
    id: "wat-radwaste", fac: "water", from: D.B08, to: INF, cert: "I", src: "s2,cur4", cur: "6)",
    text: "소화수 수집·처리설비가 없는 중·저준위방사성폐기물 저장시설 (가스계 소화설비)", scope: "해당 시설",
    when: (c) => c.f.radwaste === "noWater", basis: () => "소화수 수집·처리설비 없음",
  },
  {
    id: "wat-tunnel", fac: "water", from: D.A, to: INF, cert: "V", src: "s2,cur4", cur: "7)",
    text: "예상교통량·경사도 등 행정안전부령으로 정하는 터널 (물분무소화설비)", scope: "터널",
    when: (c) => (c.g("tunnel") ? U : F), basis: () => "행정안전부령(터널 등급) 확인 필요",
  },
  {
    id: "wat-heritage", fac: "water", from: D.B09, to: INF, cert: "V", src: "reasons,cur4", cur: "8)",
    text: "국가유산 중 소방청장이 국가유산청장과 협의하여 정하는 것 (2009.2.6.)", scope: "해당 국가유산",
    when: (c) => (c.g("heritage") ? U : F), basis: () => "소방청장·국가유산청장 협의 대상 여부 확인",
  },

  // ───────────────────────── 옥외소화전설비 ─────────────────────────
  {
    id: "out-9000", fac: "outhyd", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)",
    text: "지상 1층·2층 바닥면적 합계 9천㎡ 이상 (아파트등·가스시설·지하구·터널 제외, 연소 우려 구조 동은 하나로 봄)", scope: "해당 대상물",
    when: (c) => (c.g("apt", "gas", "ugduct", "tunnel") ? F : ge(c.x.f12, 9000)),
    basis: (c) => `지상 1·2층 합계 ${fmt(c.x.f12)}㎡`,
  },
  {
    id: "out-heritage-s1", fac: "outhyd", from: D.A, to: D.B09, cert: "I", src: "s1", cur: "",
    text: "(초기 기준) 지정문화재 연면적 1천㎡ 이상", scope: "해당 대상물",
    when: (c) => (c.g("heritage") ? ge(c.x.area, 1000) : F), basis: A,
  },
  {
    id: "out-heritage", fac: "outhyd", from: D.B09, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "2)",
    text: "보물·국보로 지정된 목조건축물 (2009.2.6.)", scope: "해당 대상물",
    when: (c) => c.g("heritage"), basis: (c) => c.u.name,
  },
  {
    id: "out-comb", fac: "outhyd", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "공장·창고: 특수가연물 750배 이상", scope: "해당 대상물",
    when: (c) => (c.g("factory", "warehouse") ? ge(comb(c), 750) : F), basis: (c) => `특수가연물 ${fmt(comb(c))}배`,
  },

  // ───────────────────────── 단독경보형 감지기 ─────────────────────────
  {
    id: "sgl-apt", fac: "single", from: D.A, to: D.C, cert: "V", src: "s1,s2", cur: "",
    text: "(종전) 아파트·기숙사 연면적 1천㎡ 미만", scope: "해당 대상물",
    when: (c) => (c.g("apt", "dorm") ? lt(c.x.area, 1000) : F), basis: A,
  },
  {
    id: "sgl-edudorm", fac: "single", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)·2)",
    text: "교육연구시설·수련시설 내 기숙사·합숙소 연면적 2천㎡ 미만", scope: "해당 대상물",
    when: (c) => (c.g("edu_dorm") ? lt(c.x.area, 2000) : F), basis: A,
  },
  {
    id: "sgl-lodging", fac: "single", from: D.A, to: D.C, cert: "V", src: "s1,s2", cur: "",
    text: "(종전) 숙박시설 연면적 600㎡ 미만", scope: "해당 대상물",
    when: (c) => (c.g("lodging") ? lt(c.x.area, 600) : F), basis: A,
  },
  {
    id: "sgl-training", fac: "single", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "숙박시설이 있는 수련시설로 자동화재탐지설비 대상(수용인원 100명 이상)이 아닌 것", scope: "해당 대상물",
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
    id: "alm-1", fac: "alarm", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)·2)",
    text: "연면적 400㎡ 이상, 또는 지하층·무창층 바닥면적 150㎡(공연장 100㎡) 이상 (가스시설·지하구·사람이 거주하지 않거나 벽이 없는 축사 등 제외)", scope: "모든 층",
    when: (c) => {
      if (c.g("gas", "ugduct", "tunnel")) return F;
      return or(ge(c.x.area, 400), c.x.ugOrWlGE(c.g("perf") ? 100 : 150));
    },
    basis: (c) => `${A(c)}, 지하·무창층 최대 ${fmt(c.x.ugOrWlMax)}㎡`,
  },
  {
    id: "alm-tunnel", fac: "alarm", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "터널 길이 500m 이상", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 500) : F), basis: (c) => `터널 ${fmt(tunnelLen(c))}m`,
  },
  {
    id: "alm-workers", fac: "alarm", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "4)",
    text: "50명 이상 근로자가 작업하는 옥내 작업장", scope: "해당 작업장",
    when: (c) => !!c.f.workers50, basis: () => "근로자 50명 이상",
  },
  {
    id: "alm-ugpark", fac: "alarm", from: D.C26, to: INF, cert: "I", src: "reasons,fpn2026", cur: "5)",
    text: "지하 차고·주차장 (2026.3.1. 이후 신청분 — 원문 문구 확인)", scope: "모든 층",
    when: (c) => and(ge(ugpk(c), 0.01), lt(ugpk(c), 200)), basis: (c) => `지하 주차장 ${fmt(ugpk(c))}㎡`,
  },

  // ───────────────────────── 자동화재탐지설비 ─────────────────────────
  {
    id: "afd-aptlodge", fac: "afd", from: D.C, to: INF, cert: "I", src: "cur4", cur: "1)",
    text: "공동주택 중 아파트등·기숙사 및 숙박시설 (규모 무관)", scope: "모든 층",
    when: (c) => c.g("apt", "dorm", "lodging"), basis: (c) => c.u.name,
  },
  {
    id: "afd-6f", fac: "afd", from: D.C, to: INF, cert: "I", src: "cur4", cur: "2)",
    text: "층수 6층 이상 건축물", scope: "모든 층",
    when: (c) => (c.g("tunnel", "ugduct") ? F : ge(c.x.gf, 6)), basis: GF,
  },
  {
    id: "afd-600", fac: "afd", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "근생(목욕장 제외)·의료(정신의료기관·요양병원 제외)·위락·장례·복합건축물 연면적 600㎡ 이상", scope: "모든 층",
    when: (c) =>
      (c.g("neigh") && !c.g("bath")) || (c.g("medical") && !c.g("mental", "nursing", "rehab")) || c.g("entertain", "funeral", "mixed")
        ? ge(c.x.area, 600)
        : F,
    basis: A,
  },
  {
    id: "afd-600-old", fac: "afd", from: D.A, to: D.C, cert: "V", src: "s1,s2", cur: "",
    text: "(종전) 숙박시설 연면적 600㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("lodging") ? ge(c.x.area, 600) : F), basis: A,
  },
  {
    id: "afd-600-med-old", fac: "afd", from: D.A, toU: [D.B08, D.B14], cert: "I", src: "s1", cur: "",
    text: "(초기 기준) 의료시설 전체(정신·요양 포함) 연면적 600㎡ 이상 — 세분 시점 확인 필요", scope: "모든 층",
    when: (c) => (c.g("mental", "nursing", "rehab") ? ge(c.x.area, 600) : F), basis: A,
  },
  {
    id: "afd-1000", fac: "afd", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "4)",
    text: "목욕장·문화집회·종교·판매·운수·운동·업무·공장·창고·위험물·항공기및자동차·국방군사·방송통신·발전·관광휴게·지하가(터널 제외) 연면적 1천㎡ 이상", scope: "모든 층",
    when: (c) =>
      c.g("bath", "culture", "religion", "retail", "transport", "sports", "office", "factory", "warehouse", "hazmat", "aircar", "military", "broadcast", "power", "tourist", "ugmall")
        ? ge(c.x.area, 1000)
        : F,
    basis: A,
  },
  {
    id: "afd-1000-apt-old", fac: "afd", from: D.A, to: D.C, cert: "V", src: "s1,s2", cur: "",
    text: "(종전) 공동주택(아파트·기숙사) 연면적 1천㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("apt", "dorm") ? ge(c.x.area, 1000) : F), basis: A,
  },
  {
    id: "afd-2000", fac: "afd", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "5)",
    text: "교육연구(내 기숙사·합숙소 포함)·수련시설(숙박 없는 것)·동식물관련(기둥·지붕만 개방형 제외)·자원순환·교정(국방군사 제외)·묘지관련 연면적 2천㎡ 이상", scope: "모든 층",
    when: (c) =>
      c.g("edu", "animal", "recycle", "cemetery") || (c.g("training") && !c.g("training_lodge")) || (c.g("correction") && !c.g("military"))
        ? ge(c.x.area, 2000)
        : F,
    basis: A,
  },
  {
    id: "afd-noyures", fac: "afd", from: D.B12, to: INF, cert: "V", src: "reasons,incheon2012,s2,cur4", cur: "6)",
    text: "노유자 생활시설 (면적 무관, 2012.2.5.)", scope: "모든 층",
    when: (c) => c.g("noyu_res"), basis: (c) => c.u.name,
  },
  {
    id: "afd-noyu400", fac: "afd", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "7)",
    text: "노유자시설(생활시설 외) 연면적 400㎡ 이상, 숙박시설이 있는 수련시설 수용인원 100명 이상", scope: "모든 층",
    when: (c) => {
      const noyu = c.g("noyu") && (!c.g("noyu_res") || c.d < D.B12);
      return or(noyu ? ge(c.x.area, 400) : F, c.g("training_lodge") ? ge(c.x.occ, 100) : F);
    },
    basis: (c) => `${A(c)}, 수용인원 ${fmt(c.x.occ)}명`,
  },
  {
    id: "afd-nursing", fac: "afd", from: D.B14, to: INF, cert: "I", src: "s2,cur4", cur: "8)가)",
    text: "요양병원(의료재활시설 제외) — 면적 무관", scope: "모든 층",
    when: (c) => c.g("nursing"), basis: (c) => c.u.name,
  },
  {
    id: "afd-mental", fac: "afd", from: D.B08, to: INF, cert: "I", src: "s2,cur4", cur: "8)나)·다)",
    text: "정신의료기관·의료재활시설 바닥면적 합계 300㎡ 이상, 또는 300㎡ 미만으로 창살 설치", scope: "모든 층",
    when: (c) => (c.g("mental", "rehab") ? or(ge(c.x.useArea, 300), and(lt(c.x.useArea, 300), !!c.f.bars)) : F),
    basis: UA,
  },
  {
    id: "afd-market", fac: "afd", from: D.B18, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "9)",
    text: "판매시설 중 전통시장 (2018.6.27.) ※ 2023.12.1. 이후 신청분은 화재알림설비 설치 시 면제 검토", scope: "모든 층",
    when: (c) => c.g("market"), basis: (c) => c.u.name,
  },
  {
    id: "afd-tunnel", fac: "afd", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "10)",
    text: "터널 길이 1천m 이상", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 1000) : F), basis: (c) => `터널 ${fmt(tunnelLen(c))}m`,
  },
  {
    id: "afd-duct", fac: "afd", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "11)",
    text: "지하구", scope: "지하구",
    when: (c) => c.g("ugduct"), basis: (c) => c.u.name,
  },
  {
    id: "afd-midwife", fac: "afd", from: D.C, to: INF, cert: "I", src: "cur4", cur: "12)",
    text: "조산원·산후조리원 (연면적 600㎡ 미만 포함, 면적 무관)", scope: "모든 층",
    when: (c) => c.g("midwife"), basis: (c) => c.u.name,
  },
  {
    id: "afd-comb", fac: "afd", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "13)",
    text: "공장·창고: 특수가연물 500배 이상", scope: "모든 층",
    when: (c) => (c.g("factory", "warehouse") ? ge(comb(c), 500) : F), basis: (c) => `특수가연물 ${fmt(comb(c))}배`,
  },
  {
    id: "afd-ess", fac: "afd", from: D.C, to: INF, cert: "I", src: "cur4", cur: "14)",
    text: "발전시설 중 전기저장시설", scope: "모든 층",
    when: (c) => c.g("ess"), basis: (c) => c.u.name,
  },
  {
    id: "afd-ugpark", fac: "afd", from: D.C26, to: INF, cert: "I", src: "reasons,fpn2026", cur: "15)",
    text: "지하 차고·주차장 바닥면적 200㎡ 이상 (2026.3.1. 이후 신청분 — 원문 문구 확인)", scope: "모든 층",
    when: (c) => ge(ugpk(c), 200), basis: (c) => `지하 주차장 ${fmt(ugpk(c))}㎡`,
  },

  // ───────────────────────── 시각경보기 (자탐 결과 연동 — engine 에서 처리) ─────────────────────────
  {
    id: "vis-1", fac: "visual", fromU: [D.A, D.C], to: INF, cert: "I", src: "cur4", cur: "1)~4)",
    text: "자동화재탐지설비 설치 대상 중 근생·문화집회·종교·판매·운수·의료·노유자·운동·업무·숙박·위락·물류터미널·발전·장례·도서관·방송국·지하상가", scope: "자탐 설치 부분",
    dependsOn: "afd",
    when: (c) =>
      c.g("neigh", "culture", "religion", "retail", "transport", "medical", "noyu", "sports", "office", "lodging", "entertain", "logistics", "power", "funeral", "library", "bstation", "ugmall")
        ? c.dep.afd
        : F,
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
    id: "pa-1", fac: "pa", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)~3)",
    text: "연면적 3,500㎡ 이상, 지하층 제외 11층 이상, 또는 지하층 3층 이상 (가스시설·사람이 거주하지 않는 동식물시설·터널·축사·지하구 제외)", scope: "모든 층",
    when: (c) => (c.g("gas", "tunnel", "ugduct", "cattle") ? F : or(ge(c.x.area, 3500), ge(c.x.gf, 11), ge(c.x.bf, 3))),
    basis: (c) => `${A(c)}, ${GF(c)}, 지하 ${c.x.bf}층`,
  },

  // ───────────────────────── 자동화재속보설비 ─────────────────────────
  {
    id: "rep-1500", fac: "report", from: D.A, to: D.C, cert: "I", src: "s1,s2", cur: "",
    text: "(종전) 업무·공장·창고·국방군사·발전(무인경비 대상) 바닥면적 1,500㎡ 이상인 층이 있는 것 — 2022.12.1. 전부개정 시 삭제 추정", scope: "모든 층",
    when: (c) => (c.g("office", "factory", "warehouse", "military", "power") ? c.x.anyFloorAnyGE(1500) : F),
    basis: () => "층별 바닥면적 기준",
  },
  {
    id: "rep-noyures", fac: "report", from: D.B12, to: INF, cert: "V", src: "reasons,incheon2012,s2,cur4", cur: "1)",
    text: "노유자 생활시설 (면적 무관, 2012.2.5.)", scope: "해당 시설",
    when: (c) => c.g("noyu_res"), basis: (c) => c.u.name,
  },
  {
    id: "rep-noyu500", fac: "report", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "2)·3)",
    text: "노유자시설, 숙박시설이 있는 수련시설: 바닥면적 500㎡ 이상인 층이 있는 것", scope: "해당 시설",
    when: (c) =>
      (c.g("noyu") && (!c.g("noyu_res") || c.d < D.B12)) || c.g("training_lodge") ? c.x.anyFloorAnyGE(500) : F,
    basis: () => "층별 바닥면적 기준",
  },
  {
    id: "rep-heritage", fac: "report", fromU: [D.A, D.S2], to: INF, cert: "I", src: "s2,cur4", cur: "4)",
    text: "보물·국보로 지정된 목조건축물", scope: "해당 대상물",
    when: (c) => c.g("heritage"), basis: (c) => c.u.name,
  },
  {
    id: "rep-clinic", fac: "report", from: D.B19, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "5)가)",
    text: "의원·치과의원·한의원으로서 입원실이 있는 시설 (2019.8.6.)", scope: "해당 시설",
    when: (c) => c.g("clinic") && !!c.f.inpatient, basis: () => "입원실 있음",
  },
  {
    id: "rep-midwife", fac: "report", from: D.C, to: INF, cert: "I", src: "cur4", cur: "5)나)",
    text: "조산원·산후조리원", scope: "해당 시설",
    when: (c) => c.g("midwife"), basis: (c) => c.u.name,
  },
  {
    id: "rep-hosp", fac: "report", from: D.B19, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "6)가)",
    text: "종합병원·병원·치과병원·한방병원 (2019.8.6.)", scope: "해당 시설",
    when: (c) => c.g("hosp"), basis: (c) => c.u.name,
  },
  {
    id: "rep-nursing", fac: "report", fromU: [D.B14, D.B19], to: INF, cert: "I", src: "s2,cur4", cur: "6)가)",
    text: "요양병원(의료재활시설 제외) — 도입시점 2014.7.8.~2019.8.6. 사이 확인 필요", scope: "해당 시설",
    when: (c) => c.g("nursing"), basis: (c) => c.u.name,
  },
  {
    id: "rep-mental", fac: "report", fromU: [D.B14, D.B19], to: INF, cert: "I", src: "s2,cur4", cur: "6)나)",
    text: "정신병원·의료재활시설로 바닥면적 500㎡ 이상인 층이 있는 것", scope: "해당 시설",
    when: (c) => (c.g("mental", "rehab") ? c.x.anyFloorAnyGE(500) : F), basis: () => "층별 바닥면적 기준",
  },
  {
    id: "rep-market", fac: "report", from: D.B18, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "7)",
    text: "판매시설 중 전통시장 (2018.6.27.)", scope: "해당 시설",
    when: (c) => c.g("market"), basis: (c) => c.u.name,
  },
  {
    id: "rep-30f", fac: "report", from: D.B12, to: D.C, cert: "I", src: "reasons,s2", cur: "",
    text: "(종전) 층수 30층 이상 (2012.2.5.~2022.11.30. 추정)", scope: "모든 층",
    when: (c) => ge(c.x.gf, 30), basis: GF,
  },

  // ───────────────────────── 통합감시시설 ─────────────────────────
  {
    id: "mon-duct", fac: "monitor", from: D.S2, to: INF, cert: "V", src: "reasons,cur4", cur: "",
    text: "지하구 (2020.12.10.)", scope: "지하구",
    when: (c) => c.g("ugduct"), basis: (c) => c.u.name,
  },

  // ───────────────────────── 누전경보기 ─────────────────────────
  {
    id: "leak-1", fac: "leak", from: D.A, to: INF, cert: "I", src: "cur4", cur: "",
    text: "계약전류용량 100A 초과 + 벽·바닥·반자 전부 또는 일부를 불연·준불연 아닌 재료에 철망을 넣어 만든 비내화구조 건축물 (가스시설·터널·지하구 제외)", scope: "해당 건축물",
    when: (c) => (c.g("gas", "tunnel", "ugduct") ? F : !!c.f.leak100A), basis: () => "계약전류 100A 초과·라스구조",
  },

  // ───────────────────────── 가스누설경보기 ─────────────────────────
  {
    id: "gas-1", fac: "gasleak", fromU: [D.A, D.C], to: INF, cert: "I", src: "cur4", cur: "1)·2)",
    text: "가스시설이 설치된 문화집회·종교·판매·운수·의료·노유자·수련·운동·숙박·물류터미널·장례시설", scope: "가스시설 설치 장소",
    when: (c) =>
      c.g("culture", "religion", "retail", "transport", "medical", "noyu", "training", "sports", "lodging", "logistics", "funeral") ? !!c.f.gasUse : F,
    basis: () => "가스시설 설치",
  },
  {
    id: "gas-factory", fac: "gasleak", from: D.C26, to: INF, cert: "I", src: "reasons,fpn2026", cur: "2)",
    text: "가스시설이 설치된 공장 (2026.3.1. 이후 신청분 — 원문 문구 확인)", scope: "가스시설 설치 장소",
    when: (c) => (c.g("factory") ? !!c.f.gasUse : F), basis: () => "가스시설 설치",
  },

  // ───────────────────────── 피난기구 ─────────────────────────
  {
    id: "esc-1", fac: "escape", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "",
    text: "모든 층 (피난층·지상 1층·지상 2층·11층 이상인 층 제외, 노유자시설의 피난층 아닌 1·2층은 포함 / 가스시설·터널·지하구 제외)", scope: "해당 층",
    when: (c) => {
      if (c.g("gas", "tunnel", "ugduct")) return F;
      if (c.x.bf > 0 || c.x.gf >= 3) return T;
      if (c.g("noyu") && c.x.gf >= 2) return T;
      return F;
    },
    basis: (c) => escapeFloors(c),
  },

  // ───────────────────────── 인명구조기구 ─────────────────────────
  {
    id: "res-hotel", fac: "rescue", from: D.A, to: INF, cert: "V", src: "s1,cur4", cur: "1)",
    text: "지하층 포함 7층 이상 관광호텔 — 방열복(방화복)·공기호흡기·인공소생기", scope: "관광호텔 용도 층",
    when: (c) => (c.g("hotel") ? ge(c.x.totalFloors, 7) : F), basis: TF,
  },
  {
    id: "res-hosp", fac: "rescue", from: D.A, to: INF, cert: "V", src: "s1,cur4", cur: "2)",
    text: "지하층 포함 5층 이상 병원 — 방열복(방화복)·공기호흡기", scope: "병원 용도 층",
    when: (c) => (c.g("hosp", "nursing", "mental") ? ge(c.x.totalFloors, 5) : F), basis: TF,
  },
  {
    id: "res-scba", fac: "rescue", fromU: [D.B12, D.C], to: INF, cert: "I", src: "cur4", cur: "3)",
    text: "공기호흡기: 수용인원 100명 이상 영화상영관, 대규모점포, 지하역사, 지하상가", scope: "해당 시설",
    when: (c) => or(c.g("cinema") ? ge(c.x.occ, 100) : F, c.g("bigstore", "station", "ugmall")),
    basis: (c) => `${c.u.name}${c.g("cinema") ? `, 수용인원 ${fmt(c.x.occ)}명` : ""}`,
  },
  {
    id: "res-co2", fac: "rescue", from: D.B12, to: INF, cert: "V", src: "reasons,cur4", cur: "3)마)",
    text: "공기호흡기: 이산화탄소소화설비(호스릴 제외) 설치 대상 (2012.2.5.)", scope: "해당 장소",
    when: (c) => !!c.f.co2, basis: () => "이산화탄소소화설비 설치",
  },

  // ───────────────────────── 유도등 ─────────────────────────
  {
    id: "gd-1", fac: "guide", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "",
    text: "피난구유도등·통로유도등·유도표지: 특정소방대상물 (축사 중 가축 직접 사육 부분·터널 제외)", scope: "해당 대상물",
    when: (c) => !c.g("tunnel", "house"), basis: (c) => (c.g("cattle") ? "축사 — 가축 사육 부분 제외" : c.u.name),
  },
  {
    id: "gd-seat", fac: "seatguide", from: D.A, to: INF, cert: "I", src: "cur4", cur: "",
    text: "객석유도등: 무대 있는 유흥주점(카바레·나이트클럽 등), 문화집회시설, 종교시설, 운동시설", scope: "객석",
    when: (c) => c.g("dance", "culture", "religion", "sports") && !c.g("zoo"), basis: (c) => c.u.name,
  },

  // ───────────────────────── 비상조명등 ─────────────────────────
  {
    id: "el-1", fac: "elight", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)",
    text: "지하층 포함 층수 5층 이상 + 연면적 3천㎡ 이상 (창고·하역장·가스시설·사람이 거주하지 않는 동식물시설 제외)", scope: "모든 층",
    when: (c) => (elExcl(c) ? F : and(ge(c.x.totalFloors, 5), ge(c.x.area, 3000))),
    basis: (c) => `${TF(c)}, ${A(c)}`,
  },
  {
    id: "el-2", fac: "elight", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "2)",
    text: "1)에 해당하지 않는 것으로 지하층 또는 무창층 바닥면적 450㎡ 이상", scope: "해당 층",
    when: (c) => (elExcl(c) ? F : c.x.ugOrWlGE(450)), basis: (c) => `지하·무창층 최대 ${fmt(c.x.ugOrWlMax)}㎡`,
  },
  {
    id: "el-tunnel", fac: "elight", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "터널 길이 500m 이상", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 500) : F), basis: (c) => `터널 ${fmt(tunnelLen(c))}m`,
  },

  // ───────────────────────── 휴대용비상조명등 ─────────────────────────
  {
    id: "pl-1", fac: "plight", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)·2)",
    text: "숙박시설, 수용인원 100명 이상 영화상영관, 대규모점포, 지하역사, 지하상가", scope: "해당 시설",
    when: (c) => or(c.g("lodging", "bigstore", "station", "ugmall"), c.g("cinema") ? ge(c.x.occ, 100) : F),
    basis: (c) => c.u.name,
  },

  // ───────────────────────── 상수도소화용수설비 ─────────────────────────
  {
    id: "ws-5000", fac: "waterSupply", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "가",
    text: "연면적 5천㎡ 이상 (가스시설·터널·지하구 제외) ※ 대지경계선 180m 이내 75mm 이상 상수도 배수관 없으면 소화수조·저수조", scope: "해당 대상물",
    when: (c) => (c.g("gas", "tunnel", "ugduct") ? F : ge(c.x.area, 5000)), basis: A,
  },
  {
    id: "ws-gas", fac: "waterSupply", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "나",
    text: "가스시설 지상 노출 탱크 저장용량 합계 100톤 이상", scope: "해당 시설",
    when: (c) => (c.g("gas") ? ge(n0(c.f.gasTankTon), 100) : F), basis: (c) => `탱크 ${fmt(n0(c.f.gasTankTon))}톤`,
  },
  {
    id: "ws-waste", fac: "waterSupply", fromU: [D.S2, D.C], to: INF, cert: "I", src: "cur4", cur: "다",
    text: "자원순환 관련 시설 중 폐기물재활용시설·폐기물처분시설", scope: "해당 시설",
    when: (c) => c.g("waste"), basis: (c) => c.u.name,
  },

  // ───────────────────────── 제연설비 ─────────────────────────
  {
    id: "sm-stage", fac: "smoke", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)·2)",
    text: "문화집회·종교·운동시설 무대부 바닥면적 200㎡ 이상, 수용인원 100명 이상 영화상영관", scope: "무대부·영화상영관",
    when: (c) =>
      or(c.g("culture", "religion", "sports") ? ge(n0(c.f.stageArea), 200) : F, c.g("cinema") ? ge(c.x.occ, 100) : F),
    basis: (c) => `무대부 ${fmt(n0(c.f.stageArea))}㎡${c.g("cinema") ? `, 수용인원 ${fmt(c.x.occ)}명` : ""}`,
  },
  {
    id: "sm-ug", fac: "smoke", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "지하층·무창층에 설치된 근생·판매·숙박·위락 용도 바닥면적 합계 1천㎡ 이상", scope: "해당 부분",
    when: (c) => (c.g("neigh", "retail", "lodging", "entertain") ? ugWlUseGE(c, 1000) : F),
    basis: (c) => `지하층·무창층 바닥면적 합계 ${fmt(ugWlTotal(c))}㎡(단일 용도 가정)`,
  },
  {
    id: "sm-ug-med", fac: "smoke", from: D.B15, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "3)",
    text: "지하층·무창층에 설치된 의료·노유자시설 바닥면적 합계 1천㎡ 이상 (2015.1.8.)", scope: "해당 부분",
    when: (c) => (c.g("medical", "noyu") ? ugWlUseGE(c, 1000) : F),
    basis: (c) => `지하층·무창층 바닥면적 합계 ${fmt(ugWlTotal(c))}㎡`,
  },
  {
    id: "sm-ug-trans", fac: "smoke", fromU: [D.A, D.S2], to: INF, cert: "I", src: "s2,cur4", cur: "3)",
    text: "지하층·무창층에 설치된 운수시설·창고시설(물류터미널) 바닥면적 합계 1천㎡ 이상", scope: "해당 부분",
    when: (c) => (c.g("transport", "logistics") ? ugWlUseGE(c, 1000) : F),
    basis: (c) => `지하층·무창층 바닥면적 합계 ${fmt(ugWlTotal(c))}㎡`,
  },
  {
    id: "sm-terminal", fac: "smoke", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "4)",
    text: "시외버스정류장·철도·공항·항만 대합실·휴게시설로서 지하층·무창층 바닥면적 1천㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("terminal") ? ugWlUseGE(c, 1000) : F),
    basis: (c) => `지하층·무창층 바닥면적 합계 ${fmt(ugWlTotal(c))}㎡`,
  },
  {
    id: "sm-ugmall", fac: "smoke", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "5)",
    text: "지하가(터널 제외) 연면적 1천㎡ 이상", scope: "해당 대상물",
    when: (c) => (c.g("ugmall") ? ge(c.x.area, 1000) : F), basis: A,
  },
  {
    id: "sm-tunnel", fac: "smoke", from: D.A, to: INF, cert: "V", src: "s2,cur4", cur: "6)",
    text: "예상교통량·경사도 등 행정안전부령으로 정하는 터널", scope: "터널",
    when: (c) => (c.g("tunnel") ? U : F), basis: () => "행정안전부령 확인 필요",
  },
  {
    id: "sm-stair", fac: "smoke", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "7)",
    text: "특별피난계단·비상용 승강기 승강장·피난용 승강기 승강장 (갓복도형 아파트등 제외)", scope: "부속실·승강장",
    when: (c) => !!c.f.specialStairs && !c.f.corridorApt, basis: () => "특별피난계단·비상용승강기 승강장 있음",
  },

  // ───────────────────────── 연결송수관설비 ─────────────────────────
  {
    id: "sp-5f", fac: "standpipe", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)",
    text: "층수 5층 이상 + 연면적 6천㎡ 이상 (가스시설·지하구 제외)", scope: "모든 층",
    when: (c) => (c.g("gas", "ugduct", "tunnel") ? F : and(ge(c.x.gf, 5), ge(c.x.area, 6000))), basis: (c) => `${GF(c)}, ${A(c)}`,
  },
  {
    id: "sp-7f", fac: "standpipe", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "2)",
    text: "지하층 포함 층수 7층 이상", scope: "모든 층",
    when: (c) => (c.g("gas", "ugduct", "tunnel") ? F : ge(c.x.totalFloors, 7)), basis: TF,
  },
  {
    id: "sp-ug3", fac: "standpipe", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "지하층 층수 3층 이상 + 지하층 바닥면적 합계 1천㎡ 이상", scope: "모든 층",
    when: (c) => (c.g("gas", "ugduct", "tunnel") ? F : and(ge(c.x.bf, 3), ge(c.x.ugSum, 1000))),
    basis: (c) => `지하 ${c.x.bf}층, 지하층 합계 ${fmt(c.x.ugSum)}㎡`,
  },
  {
    id: "sp-tunnel-2000", fac: "standpipe", from: D.A, toU: [D.A, D.S2], cert: "V", src: "s1", cur: "",
    text: "(초기 기준) 터널 길이 2천m 이상 — 1천m로 변경된 시점 확인 필요", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 2000) : F), basis: (c) => `터널 ${fmt(tunnelLen(c))}m`,
  },
  {
    id: "sp-tunnel-1000", fac: "standpipe", fromU: [D.A, D.S2], to: D.C26, cert: "V", src: "s2,cur4", cur: "4)",
    text: "터널 길이 1천m 이상", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 1000) : F), basis: (c) => `터널 ${fmt(tunnelLen(c))}m`,
  },
  {
    id: "sp-tunnel-500", fac: "standpipe", from: D.C26, to: INF, cert: "V", src: "reasons,fpn2026,curDecree", cur: "4)",
    text: "터널 길이 500m 이상 (2026.3.1. 이후 터널 설계용역 입찰공고분 — 기준일을 입찰공고일로 입력)", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 500) : F), basis: (c) => `터널 ${fmt(tunnelLen(c))}m`,
  },

  // ───────────────────────── 연결살수설비 ─────────────────────────
  {
    id: "cs-retail", fac: "conspk", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)",
    text: "판매시설·운수시설·창고시설(물류터미널): 해당 용도 바닥면적 합계 1천㎡ 이상", scope: "해당 시설",
    when: (c) => (c.g("retail", "transport", "logistics") ? ge(c.x.useArea, 1000) : F), basis: UA,
  },
  {
    id: "cs-ug", fac: "conspk", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "2)",
    text: "지하층 바닥면적 합계 150㎡ 이상(국민주택규모 이하 아파트등 대피시설 지하층·학교 지하층은 700㎡ 이상, 피난층으로 주출입구가 도로와 접한 지하층 제외)", scope: "지하층의 모든 층",
    when: (c) => {
      if (c.g("ugduct") || c.x.bf <= 0 || c.f.roadDirect) return F;
      const t = c.g("school") || (c.g("apt") && c.f.nationalHousingShelter) ? 700 : 150;
      return ge(c.x.ugSum, t);
    },
    basis: (c) => `지하층 합계 ${fmt(c.x.ugSum)}㎡`,
  },
  {
    id: "cs-gas", fac: "conspk", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "가스시설 지상 노출 탱크 저장용량 30톤 이상", scope: "탱크시설",
    when: (c) => (c.g("gas") ? ge(n0(c.f.gasTankTon), 30) : F), basis: (c) => `탱크 ${fmt(n0(c.f.gasTankTon))}톤`,
  },
  {
    id: "cs-ugpark", fac: "conspk", from: D.C26, to: INF, cert: "I", src: "reasons,fpn2026", cur: "5)·6)",
    text: "지하 차고·주차장 200㎡ 미만, 20대 미만 기계식 주차시설 (2026.3.1. 이후 신청분 — 원문 문구 확인)", scope: "해당 부분",
    when: (c) => or(and(ge(ugpk(c), 0.01), lt(ugpk(c), 200)), and(ge(n0(c.f.mechCars), 1), lt(n0(c.f.mechCars), 20))),
    basis: (c) => `지하 주차장 ${fmt(ugpk(c))}㎡, 기계식 ${fmt(n0(c.f.mechCars))}대`,
  },

  // ───────────────────────── 비상콘센트설비 ─────────────────────────
  {
    id: "out-11f", fac: "outlet", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)",
    text: "층수 11층 이상 (11층 이상의 층)", scope: "11층 이상의 층",
    when: (c) => (c.g("gas", "ugduct") ? F : ge(c.x.gf, 11)), basis: GF,
  },
  {
    id: "out-ug", fac: "outlet", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "2)",
    text: "지하층 층수 3층 이상 + 지하층 바닥면적 합계 1천㎡ 이상", scope: "지하층의 모든 층",
    when: (c) => (c.g("gas", "ugduct") ? F : and(ge(c.x.bf, 3), ge(c.x.ugSum, 1000))),
    basis: (c) => `지하 ${c.x.bf}층, 지하층 합계 ${fmt(c.x.ugSum)}㎡`,
  },
  {
    id: "out-tunnel", fac: "outlet", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "터널 길이 500m 이상", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 500) : F), basis: (c) => `터널 ${fmt(tunnelLen(c))}m`,
  },

  // ───────────────────────── 무선통신보조설비 ─────────────────────────
  {
    id: "rd-ugmall", fac: "radio", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "1)",
    text: "지하가(터널 제외) 연면적 1천㎡ 이상", scope: "해당 대상물",
    when: (c) => (c.g("ugmall") ? ge(c.x.area, 1000) : F), basis: A,
  },
  {
    id: "rd-ug", fac: "radio", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "2)",
    text: "지하층 바닥면적 합계 3천㎡ 이상, 또는 지하층 층수 3층 이상 + 지하층 바닥면적 합계 1천㎡ 이상", scope: "지하층의 모든 층",
    when: (c) => (c.g("gas") || c.x.bf <= 0 ? F : or(ge(c.x.ugSum, 3000), and(ge(c.x.bf, 3), ge(c.x.ugSum, 1000)))),
    basis: (c) => `지하 ${c.x.bf}층, 지하층 합계 ${fmt(c.x.ugSum)}㎡`,
  },
  {
    id: "rd-tunnel", fac: "radio", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "3)",
    text: "터널 길이 500m 이상", scope: "터널",
    when: (c) => (c.g("tunnel") ? ge(tunnelLen(c), 500) : F), basis: (c) => `터널 ${fmt(tunnelLen(c))}m`,
  },
  {
    id: "rd-commonduct", fac: "radio", from: D.A, to: INF, cert: "V", src: "s1,s2,cur4", cur: "4)",
    text: "지하구 중 공동구", scope: "공동구",
    when: (c) => c.g("commonduct"), basis: (c) => c.u.name,
  },
  {
    id: "rd-30f", fac: "radio", from: D.B12, to: INF, cert: "V", src: "reasons,s2,cur4", cur: "5)",
    text: "층수 30층 이상 (16층 이상 부분의 모든 층, 2012.2.5.)", scope: "16층 이상의 모든 층",
    when: (c) => (c.g("gas") ? F : ge(c.x.gf, 30)), basis: GF,
  },

  // ───────────────────────── 연소방지설비 ─────────────────────────
  {
    id: "spr-duct", fac: "spread", from: D.A, to: INF, cert: "I", src: "cur4", cur: "",
    text: "지하구(전력 또는 통신사업용) — 2020.12.10. 지하구 기준 전면 개편", scope: "지하구",
    when: (c) => c.g("ugduct"), basis: (c) => c.u.name,
  },
];

// ── 보조 함수 ──
function elExcl(c) {
  return c.g("gas") || (c.g("warehouse") && !c.g("logistics")) || c.g("cattle");
}
function ugWlTotal(c) {
  const a = c.x.ugSum;
  const b = c.x.wlSum;
  if (a === null || b === null) return null;
  return a + b;
}
function ugWlUseGE(c, t) {
  return ge(ugWlTotal(c), t);
}
function escapeFloors(c) {
  const parts = [];
  if (c.x.bf > 0) parts.push(`지하 1~${c.x.bf}층(피난층 제외)`);
  if (c.g("noyu") && c.x.gf >= 2) parts.push("지상 1·2층 중 피난층 아닌 층");
  if (c.x.gf >= 3) parts.push(`지상 3~${Math.min(c.x.gf, 10)}층`);
  return parts.join(", ") || "해당 층 없음";
}



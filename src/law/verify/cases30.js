// 검증 사례 30건 — 기대값은 현행 별표4 원문(국가법령정보센터 게재본) 및 운영매뉴얼 연도별 적용기준으로 독립 작성
// exp: 설치(설치 또는 설치(연혁확인))여야 하는 시설 키 / chk: 확인 필요가 정당한 시설 키
const fl = (gf, bf, a, ua) => {
  const l = [];
  for (let i = bf; i >= 1; i--) l.push({ level: -i, area: ua ?? a, windowless: false });
  for (let i = 1; i <= gf; i++) l.push({ level: i, area: a, windowless: false });
  return l;
};
const T = "2026-11-04";
export const CASES = [
  { id: "C01", t: "근린생활시설 900㎡ 지상3층", d: T, i: { use: "neigh", area: 900, gf: 3, bf: 0, floors: fl(3, 0, 300) }, exp: ["ext", "alarm", "afd", "visual", "escape", "guide"] },
  { id: "C02", t: "업무시설 7,000㎡ 지상7층", d: T, i: { use: "office", area: 7000, gf: 7, bf: 0, floors: fl(7, 0, 1000) }, exp: ["ext", "hydrant", "spk", "afd", "visual", "alarm", "pa", "escape", "guide", "elight", "standpipe", "waterSupply"] },
  { id: "C03", t: "아파트 20층/지하2층 30,000㎡ (지하주차장)", d: T, i: { use: "apt", area: 30000, gf: 20, bf: 2, floors: fl(20, 2, 1300, 2000), f: { parkingInside: 4000, ugParking: 4000 } }, exp: ["ext", "autoext", "hydrant", "spk", "afd", "alarm", "pa", "escape", "guide", "elight", "standpipe", "waterSupply", "outlet", "radio", "water", "conspk"] },
  { id: "C04", t: "단독주택 150㎡ 2층", d: T, i: { use: "house", area: 150, gf: 2, bf: 0, floors: fl(2, 0, 75) }, exp: [] },
  { id: "C05", t: "다세대주택 600㎡ 4층 (2026)", d: T, i: { use: "multi", area: 600, gf: 4, bf: 0, floors: fl(4, 0, 150) }, exp: ["ext", "sspk", "single", "alarm", "escape", "guide"] },
  { id: "C06", t: "요양병원 450㎡ 2층", d: T, i: { use: "nursing", area: 450, gf: 2, bf: 0, floors: fl(2, 0, 225) }, exp: ["ext", "sspk", "afd", "visual", "report", "alarm", "guide"] },
  { id: "C07", t: "병원 2,000㎡ 4층", d: T, i: { use: "hosp", area: 2000, gf: 4, bf: 0, floors: fl(4, 0, 500) }, exp: ["ext", "hydrant", "spk", "afd", "visual", "alarm", "report", "escape", "guide"] },
  { id: "C08", t: "숙박시설 500㎡ 3층", d: T, i: { use: "lodging", area: 500, gf: 3, bf: 0, floors: fl(3, 0, 166.67) }, exp: ["ext", "sspk", "afd", "visual", "alarm", "plight", "escape", "guide"] },
  { id: "C09", t: "숙박시설 700㎡ 3층", d: T, i: { use: "lodging", area: 700, gf: 3, bf: 0, floors: fl(3, 0, 233.34) }, exp: ["ext", "spk", "afd", "visual", "alarm", "plight", "escape", "guide"] },
  { id: "C10", t: "공장 2,000㎡ 단층(불연·내화)", d: T, i: { use: "factory", area: 2000, gf: 1, bf: 0, floors: fl(1, 0, 2000), f: { combustibleTimes: 0 } }, exp: ["ext", "hydrant", "afd", "alarm", "guide"] },
  { id: "C11", t: "창고 6,000㎡ 단층(내화)", d: T, i: { use: "warehouse", area: 6000, gf: 1, bf: 0, floors: fl(1, 0, 6000), f: { combustibleTimes: 0 } }, exp: ["ext", "hydrant", "spk", "afd", "alarm", "pa", "guide", "waterSupply"] }, // 연면적 3,500㎡ 이상 → 비상방송
  { id: "C12", t: "판매시설 1,200㎡ 2층 수용 400명", d: T, i: { use: "retail", area: 1200, gf: 2, bf: 0, occ: 400, floors: fl(2, 0, 600) }, exp: ["ext", "afd", "visual", "alarm", "guide", "conspk"] },
  { id: "C13", t: "근린생활시설 1,500㎡ 지상2/지하1", d: T, i: { use: "neigh", area: 1500, gf: 2, bf: 1, floors: fl(2, 1, 500) }, exp: ["ext", "hydrant", "sspk", "afd", "visual", "alarm", "escape", "guide", "conspk", "elight"] },
  { id: "C14", t: "노유자시설(어린이집) 350㎡ 단층", d: T, i: { use: "noyu", area: 350, gf: 1, bf: 0, floors: fl(1, 0, 350) }, exp: ["ext", "sspk", "guide"] },
  { id: "C15", t: "노유자 생활시설(주·야간보호) 200㎡ 단층", d: T, i: { use: "noyu_res", area: 200, gf: 1, bf: 0, floors: fl(1, 0, 200) }, exp: ["ext", "sspk", "afd", "report", "visual", "guide"] },
  { id: "C16", t: "공연장 1,000㎡ 단층 수용 300명 무대부 250㎡", d: T, i: { use: "perf", area: 1000, gf: 1, bf: 0, occ: 300, floors: fl(1, 0, 1000), f: { stageArea: 250 } }, exp: ["ext", "spk", "afd", "visual", "alarm", "seatguide", "smoke", "guide"] },
  { id: "C17", t: "터널 1,200m", d: T, i: { use: "tunnel", area: 0, gf: 0, bf: 0, floors: [], f: { tunnelLen: 1200 } }, exp: ["ext", "hydrant", "afd", "alarm", "elight", "outlet", "radio", "standpipe"], chk: ["water", "smoke"] },
  { id: "C18", t: "업무시설 3,000㎡ 지상3/지하1(주차 600㎡)", d: T, i: { use: "office", area: 3000, gf: 3, bf: 1, floors: fl(3, 1, 800, 600), f: { parkingInside: 600, ugParking: 600 } }, exp: ["ext", "hydrant", "afd", "visual", "alarm", "water", "conspk", "escape", "guide", "elight"] },
  { id: "C19", t: "의원(입원실) 300㎡ 2층", d: T, i: { use: "clinic", area: 300, gf: 2, bf: 0, floors: fl(2, 0, 150), f: { inpatient: true } }, exp: ["ext", "sspk", "report", "guide"] },
  { id: "C20", t: "전통시장 2,000㎡ 단층", d: T, i: { use: "market", area: 2000, gf: 1, bf: 0, occ: 600, floors: fl(1, 0, 2000) }, exp: ["ext", "hydrant", "spk", "afd", "notify", "report", "visual", "alarm", "conspk", "guide"] },
  { id: "C21", t: "국방·군사시설 1,600㎡ 2층", d: T, i: { use: "military", area: 1600, gf: 2, bf: 0, floors: fl(2, 0, 800) }, exp: ["ext", "hydrant", "afd", "alarm", "guide"] },
  { id: "C22", t: "교정시설 1,600㎡ 2층", d: T, i: { use: "correction", area: 1600, gf: 2, bf: 0, floors: fl(2, 0, 800) }, exp: ["ext", "spk", "alarm", "guide"] },
  { id: "H01", t: "2016 업무시설 7층 4,000㎡", d: "2016-01-01", i: { use: "office", area: 4000, gf: 7, bf: 0, floors: fl(7, 0, 571.43) }, exp: ["ext", "hydrant", "afd", "visual", "alarm", "pa", "escape", "guide", "elight", "standpipe"] },
  { id: "H02", t: "2010 노유자 생활시설 200㎡", d: "2010-06-01", i: { use: "noyu_res", area: 200, gf: 1, bf: 0, floors: fl(1, 0, 200) }, exp: ["ext", "guide"] },
  { id: "H03", t: "2001 아파트 15층/지하1 9,900㎡", d: "2001-06-01", i: { use: "apt", area: 9900, gf: 15, bf: 1, floors: fl(15, 1, 600, 900) }, exp: ["ext", "autoext", "hydrant", "afd", "alarm", "pa", "standpipe", "outlet", "escape", "guide", "elight", "waterSupply", "conspk"] },
  { id: "H04", t: "2005 아파트 15층/지하1 9,900㎡", d: "2005-06-01", i: { use: "apt", area: 9900, gf: 15, bf: 1, floors: fl(15, 1, 600, 900) }, exp: ["ext", "autoext", "hydrant", "spk", "afd", "alarm", "pa", "standpipe", "outlet", "escape", "guide", "elight", "waterSupply", "conspk"] },
  { id: "H05", t: "1996 판매시설 4층 6,000㎡", d: "1996-01-01", i: { use: "retail", area: 6000, gf: 4, bf: 0, floors: fl(4, 0, 1500) }, exp: ["ext", "hydrant", "spk", "afd", "alarm", "pa", "escape", "guide", "conspk", "waterSupply", "report"] },
  { id: "H06", t: "2013 요양병원 450㎡ 2층", d: "2013-06-01", i: { use: "nursing", area: 450, gf: 2, bf: 0, floors: fl(2, 0, 225) }, exp: ["ext", "alarm", "guide"] },
  { id: "H07", t: "2019 다세대주택 600㎡ 4층 — 2024.12.1. 전 특정소방대상물 아님(주택용소방시설)", d: "2019-01-01", i: { use: "multi", area: 600, gf: 4, bf: 0, floors: fl(4, 0, 150) }, exp: [] },
  { id: "H08", t: "2000 업무시설 12층 4,000㎡", d: "2000-06-01", i: { use: "office", area: 4000, gf: 12, bf: 0, floors: fl(12, 0, 333.34) }, exp: ["ext", "hydrant", "spk", "afd", "alarm", "pa", "standpipe", "outlet", "escape", "guide", "elight"] },
];

// 추가 회귀 사례 (검증 중 발견 오류)
export const EXTRA = [
  { id: "X01", t: "2010 업무시설 3층 각 2,000㎡ — 무인경비 미확인", d: "2010-01-01", i: { use: "office", area: 6000, gf: 3, bf: 0, floors: fl(3, 0, 2000) }, exp: ["ext", "hydrant", "afd", "visual", "alarm", "pa", "escape", "guide", "waterSupply"], chk: ["report"] },
  { id: "X02", t: "2010 업무시설 3층 각 2,000㎡ — 야간 무인경비", d: "2010-01-01", i: { use: "office", area: 6000, gf: 3, bf: 0, floors: fl(3, 0, 2000), f: { unmanned: true } }, exp: ["ext", "hydrant", "afd", "visual", "alarm", "pa", "escape", "guide", "waterSupply", "report"] },
];

// ===== (구) 게임용 간이 판정 엔진 — 화면 판정에는 쓰지 않음 =====
// 「소방 인허가 시티」 이식 전 자체 규칙. 설비 목록(SYSTEMS·GROUPS)과 면적 함수만 게임에서 쓰고,
// legacyEvaluate는 HFLS 판정과의 차이 비교(검증 테스트)용으로만 남겨 둠.
// 근거: 「소방시설 설치 및 관리에 관한 법률 시행령」 [별표 4] (현행 기준 요약, 게임용 간이화)
// 생략: 무창층, 수용인원 기준(일부), 특수용도 예외, 일부 면제(별표5) 조건
const GROUPS = [
  ['fire', '소화설비', '별표4 제1호'],
  ['alarm', '경보설비', '별표4 제2호'],
  ['evac', '피난구조설비', '별표4 제3호'],
  ['water', '소화용수설비', '별표4 제4호'],
  ['act', '소화활동설비', '별표4 제5호'],
];
const SYSTEMS = [
  { id: 'ext', g: 'fire', name: '소화기구' },
  { id: 'kitchen', g: 'fire', name: '주거용 주방자동소화장치' },
  { id: 'hyd', g: 'fire', name: '옥내소화전설비' },
  { id: 'sp', g: 'fire', name: '스프링클러설비' },
  { id: 'ssp', g: 'fire', name: '간이스프링클러설비' },
  { id: 'ohyd', g: 'fire', name: '옥외소화전설비' },
  { id: 'single', g: 'alarm', name: '단독경보형감지기' },
  { id: 'alarm', g: 'alarm', name: '비상경보설비' },
  { id: 'afd', g: 'alarm', name: '자동화재탐지설비' },
  { id: 'visual', g: 'alarm', name: '시각경보기' },
  { id: 'broadcast', g: 'alarm', name: '비상방송설비' },
  { id: 'report', g: 'alarm', name: '자동화재속보설비' },
  { id: 'escape', g: 'evac', name: '피난기구' },
  { id: 'exitlight', g: 'evac', name: '유도등·유도표지' },
  { id: 'emlight', g: 'evac', name: '비상조명등' },
  { id: 'water', g: 'water', name: '상수도소화용수설비' },
  { id: 'standpipe', g: 'act', name: '연결송수관설비' },
  { id: 'sprinkle', g: 'act', name: '연결살수설비' },
  { id: 'outlet', g: 'act', name: '비상콘센트설비' },
  { id: 'radio', g: 'act', name: '무선통신보조설비' },
];
const USE_SHORT = {
  house: '단독주택', multi: '다세대주택', apt: '아파트', retail: '근린생활시설',
  lodging: '숙박시설', daycare: '노유자시설(어린이집)', nursing: '노유자 생활시설',
  factory: '공장', office: '업무시설', hospital: '병원', sales: '판매시설',
};
const GROUP_B = ['retail', 'lodging', 'daycare', 'nursing', 'factory', 'office', 'hospital', 'sales'];
const VIS_USES = ['retail', 'lodging', 'daycare', 'nursing', 'office', 'hospital', 'sales'];

function r2(n) { return Math.round(n * 100) / 100; }
function fa(n) { return n.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function totals(b) {
  const bTot = r2(b.Ab * b.BF);
  const T = r2(b.A * b.GF + bTot);
  return { bTot, T, total: b.GF + b.BF };
}

function evaluate(b) {
  const { use, GF, BF, A, Ab } = b;
  const { bTot, T, total } = totals(b);
  const r = {};
  const S = (id, req, why) => { r[id] = { req: !!req, why }; };

  if (use === 'house') {
    for (const s of SYSTEMS) S(s.id, false, '단독주택은 특정소방대상물(시행령 별표2)이 아니므로 별표4 적용 대상 아님');
    S('ext', true, '「소방시설법」 제10조 — 단독주택에는 주택용 소방시설(소화기) 설치');
    S('single', true, '「소방시설법」 제10조 — 단독주택에는 주택용 소방시설(단독경보형감지기) 설치');
    return r;
  }

  // ── 소화설비 ──
  S('ext', T >= 33, T >= 33 ? `연면적 ${fa(T)}㎡ ≥ 33㎡` : '연면적 33㎡ 미만');
  S('kitchen', use === 'apt', use === 'apt' ? '아파트등 및 오피스텔 → 모든 층' : '아파트등·오피스텔 아님');

  const gb = GROUP_B.includes(use);
  const thr = gb ? 1500 : 3000, fthr = gb ? 300 : 600;
  const hydT = T >= thr, hydB = BF > 0 && Ab >= fthr, hyd4 = GF >= 4 && A >= fthr;
  S('hyd', hydT || hydB || hyd4,
    hydT ? `연면적 ${fa(T)}㎡ ≥ ${thr.toLocaleString()}㎡${gb ? ' (근생·판매·숙박·노유자·의료·업무·공장 등 기준)' : ''} → 모든 층`
      : hydB ? `지하층 바닥면적 ${fa(Ab)}㎡ ≥ ${fthr}㎡인 층 있음 → 모든 층`
        : hyd4 ? `4층 이상 층 바닥면적 ${fa(A)}㎡ ≥ ${fthr}㎡ → 모든 층`
          : `연면적 ${fa(T)}㎡ < ${thr.toLocaleString()}㎡이고, 지하층·4층 이상 층 중 ${fthr}㎡ 이상인 층 없음`);

  let sp = false, spWhy;
  if (GF >= 6) { sp = true; spWhy = `층수 ${GF}층 ≥ 6층 → 모든 층`; }
  else if (use === 'sales' && T >= 5000) { sp = true; spWhy = `판매시설 바닥면적 합계 ${fa(T)}㎡ ≥ 5,000㎡ → 모든 층`; }
  else if (['lodging', 'daycare', 'nursing', 'hospital'].includes(use) && T >= 600) { sp = true; spWhy = `${USE_SHORT[use]} 바닥면적 합계 ${fa(T)}㎡ ≥ 600㎡ → 모든 층`; }
  else if ((BF > 0 && Ab >= 1000) || (GF >= 4 && A >= 1000)) { sp = true; spWhy = '지하층·4층 이상 층 중 바닥면적 1,000㎡ 이상인 층 있음 → 해당 층'; }
  else {
    const p = [`층수 ${GF}층 < 6층`];
    if (use === 'sales') p.push(`판매시설 ${fa(T)}㎡ < 5,000㎡(수용인원 500명 미만)`);
    if (['lodging', 'daycare', 'nursing', 'hospital'].includes(use)) p.push(`바닥면적 합계 ${fa(T)}㎡ < 600㎡`);
    p.push('바닥면적 1,000㎡ 이상인 지하층·4층 이상 층 없음');
    spWhy = p.join(', ');
  }
  S('sp', sp, spWhy);

  let ssp = false, sspWhy;
  if (sp) sspWhy = '스프링클러설비 설치 대상 → 간이스프링클러설비 별도 불요';
  else if (use === 'multi') { ssp = true; sspWhy = '연립·다세대주택 → 주택전용 간이스프링클러설비'; }
  else if (use === 'retail' && T >= 1000) { ssp = true; sspWhy = `근린생활시설 바닥면적 합계 ${fa(T)}㎡ ≥ 1,000㎡ → 모든 층`; }
  else if (use === 'nursing') { ssp = true; sspWhy = '노유자 생활시설(600㎡ 미만) → 간이스프링클러설비'; }
  else if ((use === 'daycare' || use === 'lodging') && T >= 300) { ssp = true; sspWhy = `바닥면적 합계 ${fa(T)}㎡ (300㎡ 이상 600㎡ 미만)`; }
  else if (use === 'hospital') { ssp = true; sspWhy = `병원 바닥면적 합계 ${fa(T)}㎡ < 600㎡ → 간이스프링클러설비`; }
  else sspWhy = use === 'retail' ? `근생 바닥면적 합계 ${fa(T)}㎡ < 1,000㎡`
    : (use === 'daycare' || use === 'lodging') ? `바닥면적 합계 ${fa(T)}㎡ < 300㎡` : '해당 용도·규모 기준 없음';
  S('ssp', ssp, sspWhy);

  const g12 = r2(A * Math.min(GF, 2));
  S('ohyd', g12 >= 9000, g12 >= 9000 ? `지상 1·2층 바닥면적 합계 ${fa(g12)}㎡ ≥ 9,000㎡` : `지상 1·2층 바닥면적 합계 ${fa(g12)}㎡ < 9,000㎡`);

  // ── 경보설비 ──
  let afd = false, afdWhy;
  if (use === 'apt') { afd = true; afdWhy = '아파트등 → 모든 층'; }
  else if (use === 'lodging') { afd = true; afdWhy = '숙박시설 → 모든 층'; }
  else if (use === 'nursing') { afd = true; afdWhy = '노유자 생활시설 → 모든 층'; }
  else if (GF >= 6) { afd = true; afdWhy = `층수 ${GF}층 ≥ 6층 → 모든 층`; }
  else {
    const th = { retail: 600, hospital: 600, sales: 1000, office: 1000, factory: 1000, daycare: 400 }[use];
    if (th && T >= th) { afd = true; afdWhy = `${USE_SHORT[use]} 연면적 ${fa(T)}㎡ ≥ ${th.toLocaleString()}㎡ → 모든 층`; }
    else afdWhy = th ? `${USE_SHORT[use]} 연면적 ${fa(T)}㎡ < ${th.toLocaleString()}㎡`
      : use === 'multi' ? '연립·다세대주택은 자동화재탐지설비 대상 아님(단독경보형감지기 대상)' : '해당 없음';
  }
  S('afd', afd, afdWhy);

  if (afd) S('alarm', false, '자동화재탐지설비 설치 대상 → 비상경보설비 면제(시행령 별표5)');
  else if (use === 'multi') S('alarm', false, T >= 400 ? '연동형 단독경보형감지기 설치 → 비상경보설비 면제(시행령 별표5)' : `연면적 ${fa(T)}㎡ < 400㎡`);
  else {
    const a = T >= 400, bb = BF > 0 && Ab >= 150;
    S('alarm', a || bb, a ? `연면적 ${fa(T)}㎡ ≥ 400㎡ → 모든 층` : bb ? `지하층 바닥면적 ${fa(Ab)}㎡ ≥ 150㎡ → 모든 층` : '연면적 400㎡ 미만, 지하층 150㎡ 이상 층 없음');
  }

  S('single', use === 'multi', use === 'multi' ? '연립·다세대주택 → 연동형 단독경보형감지기' : '단독경보형감지기 대상 용도 아님');

  const vis = afd && VIS_USES.includes(use);
  S('visual', vis, vis ? `자동화재탐지설비 설치 대상인 ${USE_SHORT[use]}` : afd ? `${USE_SHORT[use]}은(는) 시각경보기 대상 용도 아님` : '자동화재탐지설비 설치 대상 아님');

  const bc1 = T >= 3500, bc2 = total >= 11, bc3 = BF >= 3;
  S('broadcast', bc1 || bc2 || bc3,
    bc1 ? `연면적 ${fa(T)}㎡ ≥ 3,500㎡` : bc2 ? `지하층 포함 층수 ${total}층 ≥ 11층` : bc3 ? `지하층 ${BF}개층 ≥ 3개층`
      : `연면적 3,500㎡ 미만, 지하 포함 ${total}개층, 지하 ${BF}개층`);

  let rep = false, repWhy = '자동화재속보설비 대상 용도 아님';
  if (use === 'nursing') { rep = true; repWhy = '노유자 생활시설 → 설치'; }
  else if (use === 'daycare' && A >= 500) { rep = true; repWhy = '노유자시설 바닥면적 500㎡ 이상 층 있음'; }
  else if (use === 'daycare') repWhy = `노유자시설 층 바닥면적 ${fa(A)}㎡ < 500㎡`;
  else if (use === 'hospital') { rep = true; repWhy = '의료시설 중 병원 → 설치 (방재실 24시간 감시자 근무 시 제외 가능)'; }
  S('report', rep, repWhy);

  // ── 피난구조설비 ──
  const noy = use === 'daycare' || use === 'nursing';
  const fl = [];
  if (BF > 0) fl.push(BF > 1 ? `지하1~${BF}층` : '지하1층');
  const lo = noy ? 2 : 3, hi = Math.min(GF, 10);
  if (hi >= lo) fl.push(lo === hi ? `${lo}층` : `${lo}~${hi}층`);
  S('escape', fl.length > 0, fl.length
    ? `${fl.join(', ')}에 설치 (피난층·지상1층·지상2층${noy ? '[노유자는 2층 포함]' : ''}·11층 이상 제외)`
    : `지상 ${GF}층 이하·지하층 없음 → 피난층·지상1·2층은 제외`);

  S('exitlight', true, '모든 특정소방대상물(피난구·통로유도등, 유도표지)');

  const em1 = total >= 5 && T >= 3000, em2 = BF > 0 && Ab >= 450;
  S('emlight', em1 || em2, em1 ? `지하 포함 ${total}개층(≥5) & 연면적 ${fa(T)}㎡ ≥ 3,000㎡` : em2 ? `지하층 바닥면적 ${fa(Ab)}㎡ ≥ 450㎡ → 해당 층`
    : '5층 이상·연면적 3,000㎡ 이상 아님, 지하층 450㎡ 이상 층 없음');

  // ── 소화용수설비 ──
  S('water', T >= 5000, T >= 5000 ? `연면적 ${fa(T)}㎡ ≥ 5,000㎡` : `연면적 ${fa(T)}㎡ < 5,000㎡`);

  // ── 소화활동설비 ──
  const s1 = GF >= 5 && T >= 6000, s2 = total >= 7, s3 = BF >= 3 && bTot >= 1000;
  S('standpipe', s1 || s2 || s3, s1 ? `층수 ${GF}층(≥5) & 연면적 ${fa(T)}㎡ ≥ 6,000㎡` : s2 ? `지하층 포함 층수 ${total}층 ≥ 7층`
    : s3 ? `지하 ${BF}개층 & 지하층 바닥면적 합계 ${fa(bTot)}㎡ ≥ 1,000㎡` : '5층·6,000㎡, 지하 포함 7층, 지하 3개층·1,000㎡ 기준 모두 미해당');

  if (sp || ssp) S('sprinkle', false, `${sp ? '스프링클러' : '간이스프링클러'}설비 설치 → 연결살수설비 면제(시행령 별표5)`);
  else {
    const c1 = use === 'sales' && T >= 1000, c2 = BF > 0 && bTot >= 150;
    S('sprinkle', c1 || c2, c1 ? `판매시설 바닥면적 합계 ${fa(T)}㎡ ≥ 1,000㎡` : c2 ? `지하층 바닥면적 합계 ${fa(bTot)}㎡ ≥ 150㎡ → 지하층`
      : BF > 0 ? `지하층 바닥면적 합계 ${fa(bTot)}㎡ < 150㎡` : '지하층 없음, 판매시설 1,000㎡ 기준 미해당');
  }

  const o1 = GF >= 11, o2 = BF >= 3 && bTot >= 1000;
  S('outlet', o1 || o2, o1 ? `층수 ${GF}층 ≥ 11층 → 11층 이상의 층` : o2 ? `지하 ${BF}개층 & 지하층 합계 ${fa(bTot)}㎡ ≥ 1,000㎡ → 지하층 모든 층` : '11층 미만, 지하 3개층·1,000㎡ 기준 미해당');

  const w1 = GF >= 30, w2 = bTot >= 3000, w3 = BF >= 3 && bTot >= 1000;
  S('radio', w1 || w2 || w3, w1 ? `층수 ${GF}층 ≥ 30층 → 16층 이상 모든 층` : w2 ? `지하층 바닥면적 합계 ${fa(bTot)}㎡ ≥ 3,000㎡ → 지하층 모든 층`
    : w3 ? `지하 ${BF}개층 & 지하층 합계 ${fa(bTot)}㎡ ≥ 1,000㎡ → 지하층 모든 층` : '30층 미만, 지하층 3,000㎡·지하 3개층 1,000㎡ 기준 미해당');

  return r;
}

export { evaluate as legacyEvaluate, SYSTEMS, GROUPS, USE_SHORT, totals, fa };

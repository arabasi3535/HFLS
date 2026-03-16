// ══════════════════════════════════════════════════════════════════
// HFLS data.js v2.0
// 근거: 소방시설 설치 및 관리에 관한 법률 시행령 별표1·2 (2025.11.25 개정)
// ══════════════════════════════════════════════════════════════════

export const LAW_ERAS = [
  {
    id: "era0", label: "소방법 시대", start: "1958-03-11", end: "2004-05-29",
    lawName: "소방법", lawShort: "소방법",
    lawCode: "법률 제485호 (1958.3.11 제정)",
    decree: "소방법 시행령", rule: "소방법 시행규칙",
    standard: "소방기술기준에관한규칙", standardAuth: "내무부령 → 행정자치부령",
    mainArticle: "제8조(소방시설 설치), 제9조(특수장소)",
    selfCheck: "소방법 제8조의2 (자체점검)",
    safetyInspection: "소방특별조사 (소방서장)",
    color: "#6b7280",
    note: "단일법 체계. 소방기본·시설·공사·위험물 기능 통합 규율. 2004.5.29 폐지."
  },
  {
    id: "era1", label: "소방시설설치유지법 시대", start: "2004-05-30", end: "2012-02-04",
    lawName: "소방시설설치유지및안전관리에관한법률", lawShort: "소방시설설치유지법",
    lawCode: "법률 제6893호 (2003.5.29 제정, 2004.5.30 시행)",
    decree: "소방시설설치유지 및 안전관리에관한법률 시행령",
    rule: "소방시설설치유지 및 안전관리에관한법률 시행규칙",
    standard: "화재안전기준 (NFSC)", standardAuth: "소방방재청 고시",
    mainArticle: "제9조(특정소방대상물 소방시설 설치)",
    selfCheck: "제25조 (소방시설등의 자체점검)",
    safetyInspection: "소방특별조사 (소방본부장·소방서장)",
    color: "#2563eb",
    note: "소방 4분법 시행(2004.5.30). NFSC 고시체계 도입. 2006년 다중이용업소 특별법 별도 제정."
  },
  {
    id: "era2", label: "화재예방소방시설법 시대", start: "2012-02-05", end: "2022-11-30",
    lawName: "화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률", lawShort: "화재예방소방시설법",
    lawCode: "법률 제11037호 (2011.8.4 제정, 2012.2.5 시행)",
    decree: "화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률 시행령",
    rule: "화재예방, 소방시설 설치·유지 및 안전관리에 관한 법률 시행규칙",
    standard: "화재안전기준 (NFSC)", standardAuth: "국민안전처 → 소방청 고시",
    mainArticle: "제9조(특정소방대상물 소방시설 설치)",
    selfCheck: "제25조 (소방시설등의 자체점검)",
    safetyInspection: "화재안전조사 (소방관서장)",
    color: "#d97706",
    note: "2017.1.26 아파트 스프링클러 6층↑ 의무화. 빈번한 NFSC 개정. 다중이용업소 기준 강화."
  },
  {
    id: "era3", label: "현행 소방시설법 시대", start: "2022-12-01", end: "2099-12-31",
    lawName: "소방시설 설치 및 관리에 관한 법률", lawShort: "소방시설법(현행)",
    lawCode: "법률 제18522호 (2021.11.30 제정, 2022.12.1 시행)",
    decree: "소방시설 설치 및 관리에 관한 법률 시행령",
    rule: "소방시설 설치 및 관리에 관한 법률 시행규칙",
    standard: "화재안전기술기준(NFTC) / 화재안전성능기준(NFPC)", standardAuth: "소방청 고시 (이원화)",
    mainArticle: "제12조(특정소방대상물 소방시설 설치)",
    selfCheck: "제22조 (소방시설등의 자체점검)",
    safetyInspection: "화재안전조사 (화재예방법 제7조)",
    color: "#16a34a",
    note: "2분법 시행(소방시설법+화재예방법). NFTC/NFPC 이원화. 창고·공동주택 용도별 기준 신설. 2024.7.17 아파트 전층 SPK."
  }
];

// 특정소방대상물 [별표2 제5조 관련, 2025.11.25 개정]
export const BUILDING_TYPES = [
  { id: "apt",              name: "[별표2 제1호 가목] 공동주택 — 아파트등 (주거층 5층 이상)" },
  { id: "villa",            name: "[별표2 제1호 나·다목] 공동주택 — 연립·다세대주택" },
  { id: "dormitory",        name: "[별표2 제1호 라목] 공동주택 — 기숙사" },
  { id: "geunlin",          name: "[별표2 제2호] 근린생활시설 (제1종·제2종)" },
  { id: "culture",          name: "[별표2 제3호] 문화 및 집회시설 (공연장·집회장·관람장·전시장·동식물원)" },
  { id: "religion",         name: "[별표2 제4호] 종교시설 (종교집회장·봉안당)" },
  { id: "retail",           name: "[별표2 제5호] 판매시설 (도매시장·소매시장·전통시장·상점)" },
  { id: "transport",        name: "[별표2 제6호] 운수시설 (여객자동차터미널·철도·공항·항만)" },
  { id: "medical",          name: "[별표2 제7호] 의료시설 (병원·격리병원·정신의료기관·의료재활시설)" },
  { id: "education",        name: "[별표2 제8호] 교육연구시설 (학교·교육원·직업훈련소·학원·연구소·도서관)" },
  // ─ 제9호 노유자시설 (생활시설·이용시설 구분) ─
  { id: "welfare_living",   name: "[별표2 제9호] 노유자시설 — 생활시설 (양로·노인요양·장애인거주·아동양육·정신요양·노숙인요양 등 24시간 거주형)" },
  { id: "welfare_use",      name: "[별표2 제9호] 노유자시설 — 이용시설 (경로당·어린이집·유치원·주야간보호·재가복지·직업재활 등 주간 이용형)" },
  { id: "training",         name: "[별표2 제10호] 수련시설 (청소년수련관·수련원·야영장·유스호스텔)" },
  { id: "sports",           name: "[별표2 제11호] 운동시설 (체육관·운동장, 근린생활시설 미해당분)" },
  { id: "office",           name: "[별표2 제12호] 업무시설 (공공업무·일반업무·주민자치센터 등)" },
  { id: "lodging",          name: "[별표2 제13호] 숙박시설 (일반형·생활형 숙박업·고시원 등)" },
  { id: "entertainment",    name: "[별표2 제14호] 위락시설 (단란주점·유흥주점·테마파크·무도장·카지노)" },
  { id: "factory",          name: "[별표2 제15호] 공장" },
  { id: "warehouse",        name: "[별표2 제16호] 창고시설 (창고·하역장·물류터미널·집배송시설)" },
  { id: "hazmat",           name: "[별표2 제17호] 위험물 저장 및 처리 시설 (제조소등·가스시설)" },
  { id: "aviation",         name: "[별표2 제18호] 항공기 및 자동차 관련 시설 (격납고·주차장·세차장·정비공장 등)" },
  { id: "animal_plant",     name: "[별표2 제19호] 동물 및 식물 관련 시설 (축사·도축장·온실·재배사 등)" },
  { id: "recycling",        name: "[별표2 제20호] 자원순환 관련 시설 (하수처리·고물상·폐기물재활용·처분시설)" },
  { id: "correctional",     name: "[별표2 제21호] 교정 및 군사시설 (교도소·구치소·치료감호시설·소년원·군사시설)" },
  { id: "broadcast",        name: "[별표2 제22호] 방송통신시설 (방송국·전신전화국·데이터센터 등)" },
  { id: "power",            name: "[별표2 제23호] 발전시설 (원자력·화력·수력·풍력·전기저장시설 등)" },
  { id: "cemetery",         name: "[별표2 제24호] 묘지 관련 시설 (화장시설·봉안당·동물화장·건조장시설)" },
  { id: "tourism",          name: "[별표2 제25호] 관광 휴게시설 (야외음악당·야외극장·어린이회관·관망탑·휴게소)" },
  { id: "funeral",          name: "[별표2 제26호] 장례시설 (장례식장·동물전용 장례식장)" },
  { id: "underground",      name: "[별표2 제27호] 지하상가" },
  { id: "tunnel",           name: "[별표2 제27호의2] 터널 (차량 통행용 지하·수저·산악 터널·방음터널)" },
  { id: "underground_duct", name: "[별표2 제28호] 지하구 (전력·통신용 전력구·통신구·공동구)" },
  { id: "heritage",         name: "[별표2 제29호] 국가유산 (지정문화유산·천연기념물등 건축물)" },
  { id: "mixed_a",          name: "[별표2 제30호 가목] 복합건축물 — 가목 (둘 이상 용도 복합, 비주거)" },
  { id: "mixed_b",          name: "[별표2 제30호 나목] 복합건축물 — 나목 (근생·판매·업무·숙박·위락 + 주택 복합)" },
];

export function getEraByDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return LAW_ERAS.find(e => d >= new Date(e.start) && d <= new Date(e.end)) || null;
}

// 소방시설 설치기준 산출 [별표1 / 시행령 제12조]
// 분류: 1.소화설비 2.경보설비 3.피난구조설비 4.소화용수설비 5.소화활동설비
export function getRequirements(type, area, gf, bf, occ, eraId) {
  const reqs = [];
  const era3 = eraId === "era3";
  const era0 = eraId === "era0";
  const std = k => era3 ? "NFTC " + k : era0 ? "소방기술기준에관한규칙" : "NFSC " + k;

  // ① 소화설비 [별표1 제1호]
  if (area >= 33)
    reqs.push({ cat: "소화설비", name: "소화기구 (소화기·간이소화용구·자동확산소화기)",
      cond: "연면적 33㎡ 이상 [입력: " + area.toLocaleString() + "㎡]",
      std: std("101"), art: era0 ? "소방기술기준에관한규칙 제4조" : std("101") + " 제4조" });

  if (["apt","villa","dormitory"].includes(type) && !era0)
    reqs.push({ cat: "소화설비", name: "자동소화장치 — 주거용 주방자동소화장치",
      cond: "공동주택 각 세대 주방 전 세대 설치 의무",
      std: std("101"), art: std("101") + " 제5조" });

  if (["geunlin","retail","entertainment","welfare_living","welfare_use"].includes(type) && area >= 200 && !era0)
    reqs.push({ cat: "소화설비", name: "자동소화장치 — 상업용 주방자동소화장치",
      cond: "조리시설 설치 대상 (후드·배기덕트)",
      std: std("101"), art: std("101") + " 제5조" });

  const hydMin = era0 ? 1000 : 3000;
  if (area >= hydMin || (bf > 0 && area >= 150) || ["underground","underground_duct"].includes(type))
    reqs.push({ cat: "소화설비", name: "옥내소화전설비",
      cond: "연면적 " + hydMin.toLocaleString() + "㎡ 이상 또는 지하층 150㎡ 이상 [입력: " + area.toLocaleString() + "㎡]",
      std: std("102"), art: std("102") + " 제4조" });

  if (type === "apt") {
    let need = false, cond = "";
    if (era0 && gf >= 11)            { need = true; cond = "11층 이상 아파트 (소방법 시대 기준)"; }
    else if (eraId==="era1"&&gf>=16) { need = true; cond = "16층 이상 아파트"; }
    else if (eraId==="era2"&&gf>=6)  { need = true; cond = "6층 이상 아파트 (2017.1.26 시행령 개정)"; }
    else if (era3)                   { need = true; cond = "전층 의무 (2024.7.17 NFTC 103 개정)"; }
    if (need) reqs.push({ cat: "소화설비", name: "스프링클러설비", cond, std: std("103"), art: std("103") + " 제4조" });
  }

  const sprMap = { medical:2000, retail:3000, welfare_living:0, welfare_use:600, lodging:600, entertainment:1000,
    education:3000, culture:5000, sports:5000, office:5000, dormitory:5000, factory:5000,
    correctional:2000, funeral:1000, underground:0, religion:3000, transport:5000,
    broadcast:5000, power:5000, hazmat:1000, mixed_a:3000, mixed_b:3000, tourism:1000 };
  if (!["apt","villa","warehouse","geunlin"].includes(type) && sprMap[type]!==undefined) {
    const thr = sprMap[type];
    if (thr===0 || area>=thr)
      reqs.push({ cat: "소화설비", name: "스프링클러설비",
        cond: thr===0 ? "전 층 설치 의무 (면적 무관)" : "연면적 " + thr.toLocaleString() + "㎡ 이상 [입력: " + area.toLocaleString() + "㎡]",
        std: std("103"), art: std("103") + " 제4조" });
  }

  if (type === "warehouse" && area >= 1500)
    reqs.push({ cat: "소화설비",
      name: era3 ? "스프링클러설비 — 창고 전용 기준 (NFTC 103A)" : "스프링클러설비",
      cond: "창고시설 연면적 1,500㎡ 이상 [입력: " + area.toLocaleString() + "㎡]",
      std: era3 ? "NFTC 103A" : std("103"),
      art: era3 ? "NFTC 103A" : std("103"),
      warn: era3 ? "NFTC 103A 2022.12.1 신설 — 기존 창고시설 소급 여부 부칙 경과규정 확인 필요" : null });

  if (type==="underground")
    reqs.push({ cat: "소화설비", name: "간이스프링클러설비",
      cond: "전 장소 의무 (면적 무관)",
      std: std("103B"), art: std("103B") });

  if (type==="geunlin" && !era0 && area>=1000)
    reqs.push({ cat: "소화설비", name: "간이스프링클러설비",
      cond: "근린생활시설 연면적 1,000㎡ 이상 [입력: " + area.toLocaleString() + "㎡]",
      std: std("103B"), art: std("103B") });

  // 간이스프링클러 — 노유자 생활시설 (면적 무관, NFTC 103B)
  if (type==="welfare_living" && !era0)
    reqs.push({ cat: "소화설비", name: "간이스프링클러설비 — 노유자 생활시설 (면적 무관)",
      cond: "노유자 생활시설 전체 — 면적 무관 설치 의무 (24시간 거주형·자력 피난 곤란자 상시 재실)",
      std: std("103B"), art: std("103B") + " 제4조",
      warn: "노유자 생활시설은 연면적·층수 무관 간이스프링클러 설치 의무 (NFTC 103B)" });
  // 간이스프링클러 — 노유자 이용시설 (300㎡ 이상)
  if (type==="welfare_use" && !era0 && area>=300)
    reqs.push({ cat: "소화설비", name: "간이스프링클러설비 — 노유자 이용시설",
      cond: "노유자 이용시설 300㎡ 이상 [입력: " + area.toLocaleString() + "㎡]",
      std: std("103B"), art: std("103B") });

  if (["factory","warehouse","hazmat"].includes(type) && area>=5000)
    reqs.push({ cat: "소화설비", name: "옥외소화전설비",
      cond: "공장·창고·위험물시설 연면적 5,000㎡ 이상 [입력: " + area.toLocaleString() + "㎡]",
      std: std("109"), art: std("109") + " 제4조" });

  // ② 경보설비 [별표1 제2호]
  const atdMap = { geunlin:600, dormitory:400, culture:400, religion:400, retail:500,
    transport:500, medical:300, education:400, welfare_living:300, welfare_use:300, training:500, sports:500,
    office:600, lodging:300, entertainment:300, factory:1000, warehouse:2000, hazmat:500,
    aviation:500, animal_plant:1000, recycling:1000, correctional:300, broadcast:500,
    power:1000, cemetery:1000, tourism:400, funeral:400, underground:0, tunnel:0,
    underground_duct:0, heritage:300, mixed_a:400, mixed_b:400 };
  const atdFlr = ["apt","villa"].includes(type) && gf>=3;
  const atdThr = atdMap[type];
  const needsAtd = atdFlr || atdThr===0 || (atdThr>0 && area>=atdThr);
  if (needsAtd)
    reqs.push({ cat: "경보설비", name: "자동화재탐지설비",
      cond: atdFlr ? "공동주택 3층 이상 [입력: " + gf + "층]"
           : atdThr===0 ? "전 장소 의무 (면적 무관)"
           : "연면적 " + atdThr.toLocaleString() + "㎡ 이상 [입력: " + area.toLocaleString() + "㎡]",
      std: std("203"), art: era0 ? "소방기술기준에관한규칙 제11조" : std("203") + " 제4조" });

  if (area>=400 && !needsAtd && !["underground_duct","tunnel"].includes(type))
    reqs.push({ cat: "경보설비", name: "비상경보설비 (비상벨설비 또는 자동식사이렌설비)",
      cond: "연면적 400㎡ 이상 (자동화재탐지설비 미해당) [입력: " + area.toLocaleString() + "㎡]",
      std: std("201"), art: std("201") });

  if (["apt","villa","dormitory"].includes(type) && gf<3)
    reqs.push({ cat: "경보설비", name: "단독경보형 감지기",
      cond: "공동주택 세대 내 (3층 미만)", std: std("201"), art: std("201") });

  if (area>=3500 || gf>=11)
    reqs.push({ cat: "경보설비", name: "비상방송설비",
      cond: "연면적 3,500㎡ 이상 또는 11층 이상 [입력: " + area.toLocaleString() + "㎡, " + gf + "층]",
      std: std("202"), art: std("202") });

  if (["welfare_living","welfare_use","medical","correctional"].includes(type) && area>=500 && !era0)
    reqs.push({ cat: "경보설비", name: "자동화재속보설비",
      cond: "노유자·의료·교정시설 연면적 500㎡ 이상 [입력: " + area.toLocaleString() + "㎡]",
      std: std("204"), art: std("204") });

  if (area>=1000 && !["underground_duct","tunnel","heritage","cemetery","animal_plant"].includes(type))
    reqs.push({ cat: "경보설비", name: "누전경보기",
      cond: "계약전류 100A 초과 해당 시설",
      std: std("205"), art: std("205") });

  if (["geunlin","apt","villa","dormitory","retail","welfare_living","welfare_use","lodging"].includes(type) && !era0)
    reqs.push({ cat: "경보설비", name: "가스누설경보기",
      cond: "가스(도시가스·LPG) 사용 공간 설치 의무",
      std: std("206"), art: std("206") });

  // ③ 피난구조설비 [별표1 제3호]
  if (gf>=2 || area>=400 || bf>0) {
    const noPinan = ["underground_duct","tunnel"].includes(type);
    if (!noPinan && (gf>=2||bf>0))
      reqs.push({ cat: "피난구조설비", name: "피난기구 (완강기·구조대·피난사다리·간이완강기 등)",
        cond: "2층 이상 또는 지하층 피난 가능층 [지상" + gf + "층·지하" + bf + "층] — 피난층·옥상 제외",
        std: std("301"), art: std("301") });
    if (!noPinan)
      reqs.push({ cat: "피난구조설비", name: "유도등 및 유도표지 (피난구·통로·객석유도등·유도표지)",
        cond: "연면적 400㎡ 이상 또는 3층 이상 [입력: " + area.toLocaleString() + "㎡, " + gf + "층]",
        std: std("303"), art: std("303") });
    if (!noPinan)
      reqs.push({ cat: "피난구조설비", name: "비상조명등 및 휴대용 비상조명등",
        cond: "연면적 400㎡ 이상 또는 3층 이상 [입력: " + area.toLocaleString() + "㎡, " + gf + "층]",
        std: std("304"), art: std("304") });
    if (gf>=7 || ["medical","correctional","hazmat"].includes(type))
      reqs.push({ cat: "피난구조설비", name: "인명구조기구 (방열복·공기호흡기·인공소생기)",
        cond: "7층 이상 또는 의료·교정·위험물시설 [입력: " + gf + "층]",
        std: std("302"), art: std("302") });
  }

  // ④ 소화용수설비 [별표1 제4호]
  const noWater = ["underground_duct","tunnel","heritage","cemetery","animal_plant"];
  if (area>=5000 && !noWater.includes(type))
    reqs.push({ cat: "소화용수설비", name: "상수도소화용수설비",
      cond: "연면적 5,000㎡ 이상 [입력: " + area.toLocaleString() + "㎡]",
      std: std("401"), art: std("401") + " 제4조 (도로변 75m 이내 소화전 있는 경우 면제 가능)" });

  if (area>=5000 && ["factory","warehouse","hazmat"].includes(type))
    reqs.push({ cat: "소화용수설비", name: "소화수조·저수조",
      cond: "공장·창고·위험물시설 5,000㎡ 이상 (상수도 미설치 구역 포함) [입력: " + area.toLocaleString() + "㎡]",
      std: std("402"), art: std("402") });

  // ⑤ 소화활동설비 [별표1 제5호]
  if (gf>=11)
    reqs.push({ cat: "소화활동설비", name: "제연설비 (특별피난계단 전실·비상용 승강기 승강장)",
      cond: "11층 이상 (특별피난계단 설치 의무 대상) [입력: " + gf + "층]",
      std: std("501A"), art: std("501A") + " 제4조" });

  if ((bf>0 || ["retail","transport","medical","entertainment","underground","culture"].includes(type)) && area>=1000)
    reqs.push({ cat: "소화활동설비", name: "제연설비 (거실 및 통로 제연)",
      cond: "지하층·판매·운수·의료·위락·지하상가 연면적 1,000㎡ 이상 [입력: " + area.toLocaleString() + "㎡]",
      std: std("501"), art: std("501") + " 제4조" });

  if (gf>=5 || area>=6000)
    reqs.push({ cat: "소화활동설비", name: "연결송수관설비",
      cond: "5층 이상 또는 연면적 6,000㎡ 이상 [입력: " + gf + "층, " + area.toLocaleString() + "㎡]",
      std: std("502"), art: std("502") + " 제4조" });

  if (bf>0 && area>=150 && ["retail","factory","warehouse","geunlin","entertainment","underground","hazmat"].includes(type))
    reqs.push({ cat: "소화활동설비", name: "연결살수설비",
      cond: "지하층 바닥면적 150㎡ 이상 (해당 용도) [지하" + bf + "층]",
      std: std("503"), art: std("503") });

  if (gf>=11 || bf>=3)
    reqs.push({ cat: "소화활동설비", name: "비상콘센트설비",
      cond: "11층 이상 또는 지하 3층 이상 [지상" + gf + "층·지하" + bf + "층]",
      std: std("504"), art: std("504") + " 제4조" });

  if ((bf>0 && area>=3000) || ["tunnel","underground"].includes(type))
    reqs.push({ cat: "소화활동설비", name: "무선통신보조설비",
      cond: "지하층 포함 연면적 3,000㎡ 이상 또는 터널·지하상가 [입력: " + area.toLocaleString() + "㎡]",
      std: std("505"), art: std("505") + " 제4조" });

  if (type==="underground_duct")
    reqs.push({ cat: "소화활동설비", name: "연소방지설비",
      cond: "지하구 케이블 구간 (폭 1.8m↑, 길이 50m↑ 해당)",
      std: std("506"), art: std("506") });

  return reqs;
}

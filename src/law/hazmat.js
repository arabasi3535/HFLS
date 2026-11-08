// ============================================================
// 위험물 지정수량 배수 판정 — 위험물안전관리법 시행령 [별표1] <개정 2024.4.30.>
// · 품명별 지정수량(Q), 배수 = Σ(저장·취급량 ÷ 지정수량) — 법 제5조제5항
// · 물질 목록(CAS)은 별표1 비고의 정의·예시에 따른 일반적 분류. 제품(혼합물)은 MSDS 인화점·시험결과로 확인
// ============================================================

/** 품명 — q: 지정수량, u: 단위(L|kg), opts: 지정수량이 복수인 품명 */
export const HZ_ITEMS = [
  // 제1류 산화성고체
  { id: "1-1", cls: 1, no: 1, name: "아염소산염류", q: 50, u: "kg" },
  { id: "1-2", cls: 1, no: 2, name: "염소산염류", q: 50, u: "kg" },
  { id: "1-3", cls: 1, no: 3, name: "과염소산염류", q: 50, u: "kg" },
  { id: "1-4", cls: 1, no: 4, name: "무기과산화물", q: 50, u: "kg" },
  { id: "1-5", cls: 1, no: 5, name: "브로민산염류", q: 300, u: "kg" },
  { id: "1-6", cls: 1, no: 6, name: "질산염류", q: 300, u: "kg" },
  { id: "1-7", cls: 1, no: 7, name: "아이오딘산염류", q: 300, u: "kg" },
  { id: "1-8", cls: 1, no: 8, name: "과망가니즈산염류", q: 1000, u: "kg" },
  { id: "1-9", cls: 1, no: 9, name: "다이크로뮴산염류", q: 1000, u: "kg" },
  { id: "1-10", cls: 1, no: 10, name: "그 밖에 행정안전부령으로 정하는 것", opts: [50, 300, 1000], u: "kg" },
  { id: "1-11", cls: 1, no: 11, name: "제1호~제10호 위험물을 하나 이상 함유한 것", opts: [50, 300, 1000], u: "kg" },
  // 제2류 가연성고체
  { id: "2-1", cls: 2, no: 1, name: "황화인", q: 100, u: "kg" },
  { id: "2-2", cls: 2, no: 2, name: "적린", q: 100, u: "kg" },
  { id: "2-3", cls: 2, no: 3, name: "황", q: 100, u: "kg", cond: "순도 60중량퍼센트 이상(비고 3)" },
  { id: "2-4", cls: 2, no: 4, name: "철분", q: 500, u: "kg", cond: "53㎛ 표준체 통과분 50중량퍼센트 이상(비고 4)" },
  { id: "2-5", cls: 2, no: 5, name: "금속분", q: 500, u: "kg", cond: "150㎛ 체 통과분 50중량퍼센트 이상, 구리분·니켈분 제외(비고 5)" },
  { id: "2-6", cls: 2, no: 6, name: "마그네슘", q: 500, u: "kg", cond: "2㎜ 체 미통과 덩어리·지름 2㎜ 이상 막대 모양 제외(비고 6)" },
  { id: "2-7", cls: 2, no: 7, name: "그 밖에 행정안전부령으로 정하는 것", opts: [100, 500], u: "kg" },
  { id: "2-8", cls: 2, no: 8, name: "제1호~제7호 위험물을 하나 이상 함유한 것", opts: [100, 500], u: "kg" },
  { id: "2-9", cls: 2, no: 9, name: "인화성고체", q: 1000, u: "kg", cond: "고형알코올 그 밖에 1기압에서 인화점 40℃ 미만인 고체(비고 8)" },
  // 제3류 자연발화성물질 및 금수성물질
  { id: "3-1", cls: 3, no: 1, name: "칼륨", q: 10, u: "kg" },
  { id: "3-2", cls: 3, no: 2, name: "나트륨", q: 10, u: "kg" },
  { id: "3-3", cls: 3, no: 3, name: "알킬알루미늄", q: 10, u: "kg" },
  { id: "3-4", cls: 3, no: 4, name: "알킬리튬", q: 10, u: "kg" },
  { id: "3-5", cls: 3, no: 5, name: "황린", q: 20, u: "kg" },
  { id: "3-6", cls: 3, no: 6, name: "알칼리금속(칼륨·나트륨 제외) 및 알칼리토금속", q: 50, u: "kg" },
  { id: "3-7", cls: 3, no: 7, name: "유기금속화합물(알킬알루미늄·알킬리튬 제외)", q: 50, u: "kg" },
  { id: "3-8", cls: 3, no: 8, name: "금속의 수소화물", q: 300, u: "kg" },
  { id: "3-9", cls: 3, no: 9, name: "금속의 인화물", q: 300, u: "kg" },
  { id: "3-10", cls: 3, no: 10, name: "칼슘 또는 알루미늄의 탄화물", q: 300, u: "kg" },
  { id: "3-11", cls: 3, no: 11, name: "그 밖에 행정안전부령으로 정하는 것", opts: [10, 20, 50, 300], u: "kg" },
  { id: "3-12", cls: 3, no: 12, name: "제1호~제11호 위험물을 하나 이상 함유한 것", opts: [10, 20, 50, 300], u: "kg" },
  // 제4류 인화성액체
  { id: "4-sp", cls: 4, no: 1, name: "특수인화물", q: 50, u: "L" },
  { id: "4-1n", cls: 4, no: 2, name: "제1석유류(비수용성액체)", q: 200, u: "L" },
  { id: "4-1w", cls: 4, no: 2, name: "제1석유류(수용성액체)", q: 400, u: "L" },
  { id: "4-al", cls: 4, no: 3, name: "알코올류", q: 400, u: "L", cond: "탄소수 1~3 포화1가 알코올 함유량 60중량퍼센트 이상(비고 14)" },
  { id: "4-2n", cls: 4, no: 4, name: "제2석유류(비수용성액체)", q: 1000, u: "L" },
  { id: "4-2w", cls: 4, no: 4, name: "제2석유류(수용성액체)", q: 2000, u: "L" },
  { id: "4-3n", cls: 4, no: 5, name: "제3석유류(비수용성액체)", q: 2000, u: "L" },
  { id: "4-3w", cls: 4, no: 5, name: "제3석유류(수용성액체)", q: 4000, u: "L" },
  { id: "4-4", cls: 4, no: 6, name: "제4석유류", q: 6000, u: "L" },
  { id: "4-veg", cls: 4, no: 7, name: "동식물유류", q: 10000, u: "L", cond: "용기기준에 따라 수납·저장하고 품명·수량·화기엄금 표시가 있으면 제외(비고 18 단서)" },
  // 제5류 자기반응성물질 — 시험 결과 제1종 10kg / 제2종 100kg
  ...["유기과산화물", "질산에스터류", "나이트로화합물", "나이트로소화합물", "아조화합물", "다이아조화합물", "하이드라진 유도체", "하이드록실아민", "하이드록실아민염류", "그 밖에 행정안전부령으로 정하는 것", "제1호~제10호 위험물을 하나 이상 함유한 것"].map((name, i) => ({
    id: `5-${i + 1}`,
    cls: 5,
    no: i + 1,
    name,
    opts: [10, 100],
    optLabel: { 10: "제1종 10kg", 100: "제2종 100kg" },
    u: "kg",
    cond: "자기반응성 시험 결과로 제1종·제2종 분류(비고 19)",
  })),
  // 제6류 산화성액체
  { id: "6-1", cls: 6, no: 1, name: "과염소산", q: 300, u: "kg" },
  { id: "6-2", cls: 6, no: 2, name: "과산화수소", q: 300, u: "kg", cond: "농도 36중량퍼센트 이상(비고 22)" },
  { id: "6-3", cls: 6, no: 3, name: "질산", q: 300, u: "kg", cond: "비중 1.49 이상(비고 23)" },
  { id: "6-4", cls: 6, no: 4, name: "그 밖에 행정안전부령으로 정하는 것", q: 300, u: "kg" },
  { id: "6-5", cls: 6, no: 5, name: "제1호~제4호 위험물을 하나 이상 함유한 것", q: 300, u: "kg" },
];
export const HZ_CLASSES = { 1: "제1류 산화성고체", 2: "제2류 가연성고체", 3: "제3류 자연발화성물질 및 금수성물질", 4: "제4류 인화성액체", 5: "제5류 자기반응성물질", 6: "제6류 산화성액체" };
const ITEM = Object.fromEntries(HZ_ITEMS.map((x) => [x.id, x]));
export const hzItem = (id) => ITEM[id];

/**
 * 물질 목록 — cas: 대표 CAS(제품·혼합물은 제품마다 다를 수 있음), item: 품명 id
 * quick: 제4류 빠른 선택 버튼, note: 확인 사항
 */
export const HZ_SUBS = [
  // 제4류 — 별표1 비고 12·13·15~18 예시 물질과 통상 분류
  { id: "gasoline", name: "휘발유", alias: ["가솔린", "gasoline", "petrol"], cas: "86290-81-5", item: "4-1n", quick: 1, note: "비고 13 예시" },
  { id: "diesel", name: "경유", alias: ["디젤", "diesel"], cas: "68334-30-5", item: "4-2n", quick: 2, note: "비고 15 예시" },
  { id: "kerosene", name: "등유", alias: ["kerosene", "보일러등유"], cas: "8008-20-6", item: "4-2n", quick: 3, note: "비고 15 예시" },
  { id: "heavy", name: "중유", alias: ["벙커C유", "bunker", "fuel oil"], cas: "68476-33-5", item: "4-3n", note: "비고 16 예시 — CAS는 제품마다 다름" },
  { id: "lube", name: "윤활유·엔진오일", alias: ["엔진오일", "윤활유", "유압유", "작동유"], cas: "", item: "4-4", quick: 4, note: "제품 인화점으로 확인 — 70~200℃ 제3석유류, 200~250℃ 제4석유류, 250℃ 이상은 위험물 아님" },
  { id: "gear", name: "기어유·실린더유", alias: ["기어유", "실린더유"], cas: "", item: "4-4", note: "비고 17 예시 — 인화점 200℃ 이상 250℃ 미만" },
  { id: "thinner", name: "시너(신나)", alias: ["신나", "thinner", "희석제"], cas: "", item: "4-1n", quick: 5, note: "혼합물 — MSDS 인화점(21℃ 미만 여부)·수용성 확인" },
  { id: "ethanol", name: "에탄올(에틸알코올)", alias: ["에틸알코올", "주정", "ethanol", "소독용 알코올"], cas: "64-17-5", item: "4-al", quick: 6, note: "60중량퍼센트 미만 수용액은 알코올류 제외(비고 14 가)" },
  { id: "methanol", name: "메탄올(메틸알코올)", alias: ["메틸알코올", "methanol"], cas: "67-56-1", item: "4-al", quick: 7 },
  { id: "ipa", name: "아이소프로필알코올(IPA)", alias: ["이소프로필알코올", "IPA", "isopropanol", "2-프로판올"], cas: "67-63-0", item: "4-al" },
  { id: "npa", name: "1-프로판올(n-프로필알코올)", alias: ["프로필알코올", "propanol"], cas: "71-23-8", item: "4-al" },
  { id: "acetone", name: "아세톤", alias: ["acetone"], cas: "67-64-1", item: "4-1w", note: "비고 13 예시" },
  { id: "toluene", name: "톨루엔", alias: ["toluene"], cas: "108-88-3", item: "4-1n" },
  { id: "xylene", name: "크실렌(자일렌)", alias: ["자일렌", "xylene", "크시렌"], cas: "1330-20-7", item: "4-2n" },
  { id: "veg", name: "식용유 등 동식물유", alias: ["식용유", "콩기름", "들기름", "참기름", "동식물유"], cas: "", item: "4-veg" },
  { id: "benzene", name: "벤젠", alias: ["benzene"], cas: "71-43-2", item: "4-1n" },
  { id: "hexane", name: "노말헥세인(n-헥산)", alias: ["헥산", "hexane"], cas: "110-54-3", item: "4-1n" },
  { id: "cyclohexane", name: "사이클로헥세인", alias: ["시클로헥산", "cyclohexane"], cas: "110-82-7", item: "4-1n" },
  { id: "ethylbenzene", name: "에틸벤젠", alias: ["ethylbenzene"], cas: "100-41-4", item: "4-1n" },
  { id: "mek", name: "메틸에틸케톤(MEK)", alias: ["MEK", "methyl ethyl ketone", "부탄온"], cas: "78-93-3", item: "4-1n" },
  { id: "etac", name: "아세트산에틸(초산에틸)", alias: ["초산에틸", "ethyl acetate"], cas: "141-78-6", item: "4-1n" },
  { id: "pyridine", name: "피리딘", alias: ["pyridine"], cas: "110-86-1", item: "4-1w" },
  { id: "acn", name: "아세토나이트릴", alias: ["아세토니트릴", "acetonitrile"], cas: "75-05-8", item: "4-1w" },
  { id: "ether", name: "다이에틸에터", alias: ["디에틸에테르", "에테르", "diethyl ether"], cas: "60-29-7", item: "4-sp", note: "비고 12 예시" },
  { id: "cs2", name: "이황화탄소", alias: ["carbon disulfide"], cas: "75-15-0", item: "4-sp", note: "비고 12 예시" },
  { id: "acetaldehyde", name: "아세트알데하이드", alias: ["아세트알데히드", "acetaldehyde"], cas: "75-07-0", item: "4-sp" },
  { id: "po", name: "산화프로필렌", alias: ["프로필렌옥사이드", "propylene oxide"], cas: "75-56-9", item: "4-sp" },
  { id: "styrene", name: "스타이렌", alias: ["스티렌", "styrene"], cas: "100-42-5", item: "4-2n" },
  { id: "chlorobenzene", name: "클로로벤젠", alias: ["chlorobenzene"], cas: "108-90-7", item: "4-2n" },
  { id: "acetic", name: "아세트산(빙초산)", alias: ["초산", "빙초산", "acetic acid"], cas: "64-19-7", item: "4-2w" },
  { id: "formic", name: "폼산(의산·개미산)", alias: ["포름산", "의산", "개미산", "formic acid"], cas: "64-18-6", item: "4-2w" },
  { id: "acrylic", name: "아크릴산", alias: ["acrylic acid"], cas: "79-10-7", item: "4-2w" },
  { id: "eg", name: "에틸렌글리콜", alias: ["ethylene glycol", "부동액 원액"], cas: "107-21-1", item: "4-3w" },
  { id: "glycerin", name: "글리세린", alias: ["글리세롤", "glycerin", "glycerol"], cas: "56-81-5", item: "4-3w" },
  { id: "aniline", name: "아닐린", alias: ["aniline"], cas: "62-53-3", item: "4-3n" },
  { id: "nitrobenzene", name: "나이트로벤젠", alias: ["니트로벤젠", "nitrobenzene"], cas: "98-95-3", item: "4-3n" },
  { id: "creosote", name: "크레오소트유", alias: ["creosote"], cas: "8001-58-9", item: "4-3n", note: "비고 16 예시" },
  // 제1류
  { id: "kclo4", name: "과염소산칼륨", alias: ["potassium perchlorate"], cas: "7778-74-7", item: "1-3" },
  { id: "naclo4", name: "과염소산나트륨", alias: ["sodium perchlorate"], cas: "7601-89-0", item: "1-3" },
  { id: "kclo3", name: "염소산칼륨", alias: ["potassium chlorate"], cas: "3811-04-9", item: "1-2" },
  { id: "naclo3", name: "염소산나트륨", alias: ["sodium chlorate"], cas: "7775-09-9", item: "1-2" },
  { id: "naclo2", name: "아염소산나트륨", alias: ["sodium chlorite"], cas: "7758-19-2", item: "1-1" },
  { id: "na2o2", name: "과산화나트륨", alias: ["sodium peroxide"], cas: "1313-60-6", item: "1-4" },
  { id: "kno3", name: "질산칼륨", alias: ["초석", "potassium nitrate"], cas: "7757-79-1", item: "1-6" },
  { id: "nano3", name: "질산나트륨", alias: ["칠레초석", "sodium nitrate"], cas: "7631-99-4", item: "1-6" },
  { id: "nh4no3", name: "질산암모늄", alias: ["ammonium nitrate", "초안"], cas: "6484-52-2", item: "1-6" },
  { id: "kmno4", name: "과망가니즈산칼륨", alias: ["과망간산칼륨", "potassium permanganate"], cas: "7722-64-7", item: "1-8" },
  { id: "k2cr2o7", name: "다이크로뮴산칼륨", alias: ["중크롬산칼륨", "potassium dichromate"], cas: "7778-50-9", item: "1-9" },
  // 제2류
  { id: "p2s5", name: "오황화인", alias: ["오황화린", "phosphorus pentasulfide"], cas: "1314-80-3", item: "2-1" },
  { id: "redp", name: "적린", alias: ["red phosphorus"], cas: "7723-14-0", item: "2-2" },
  { id: "sulfur", name: "황", alias: ["유황", "sulfur", "sulphur"], cas: "7704-34-9", item: "2-3" },
  { id: "fe", name: "철분", alias: ["철 분말", "iron powder"], cas: "7439-89-6", item: "2-4" },
  { id: "al", name: "알루미늄분", alias: ["알루미늄 분말", "aluminium powder", "aluminum powder"], cas: "7429-90-5", item: "2-5" },
  { id: "zn", name: "아연분", alias: ["아연 분말", "zinc powder"], cas: "7440-66-6", item: "2-5" },
  { id: "mg", name: "마그네슘", alias: ["magnesium"], cas: "7439-95-4", item: "2-6" },
  { id: "solidalc", name: "고형알코올", alias: ["고체연료", "solid alcohol"], cas: "", item: "2-9", note: "비고 8 예시" },
  // 제3류
  { id: "k", name: "칼륨(금속)", alias: ["potassium"], cas: "7440-09-7", item: "3-1" },
  { id: "na", name: "나트륨(금속)", alias: ["sodium"], cas: "7440-23-5", item: "3-2" },
  { id: "tea", name: "트라이에틸알루미늄", alias: ["트리에틸알루미늄", "TEA", "triethylaluminium"], cas: "97-93-8", item: "3-3" },
  { id: "buli", name: "n-뷰틸리튬", alias: ["부틸리튬", "butyllithium"], cas: "109-72-8", item: "3-4" },
  { id: "whitep", name: "황린", alias: ["백린", "white phosphorus"], cas: "12185-10-3", item: "3-5" },
  { id: "li", name: "리튬(금속)", alias: ["lithium"], cas: "7439-93-2", item: "3-6" },
  { id: "ca", name: "칼슘(금속)", alias: ["calcium"], cas: "7440-70-2", item: "3-6" },
  { id: "nah", name: "수소화나트륨", alias: ["sodium hydride"], cas: "7646-69-7", item: "3-8" },
  { id: "ca3p2", name: "인화칼슘", alias: ["calcium phosphide"], cas: "1305-99-3", item: "3-9" },
  { id: "cac2", name: "탄화칼슘(카바이드)", alias: ["카바이드", "calcium carbide"], cas: "75-20-7", item: "3-10" },
  { id: "al4c3", name: "탄화알루미늄", alias: ["aluminium carbide"], cas: "1299-86-1", item: "3-10" },
  // 제5류
  { id: "bpo", name: "과산화벤조일", alias: ["벤조일퍼옥사이드", "BPO", "benzoyl peroxide"], cas: "94-36-0", item: "5-1", note: "35.5중량퍼센트 미만으로 전분가루 등과의 혼합물은 제외(비고 20 가)" },
  { id: "ng", name: "나이트로글리세린", alias: ["니트로글리세린", "nitroglycerin"], cas: "55-63-0", item: "5-2" },
  { id: "nc", name: "나이트로셀룰로오스", alias: ["니트로셀룰로오스", "질화면", "nitrocellulose"], cas: "9004-70-0", item: "5-2" },
  { id: "tnt", name: "트라이나이트로톨루엔(TNT)", alias: ["TNT", "트리니트로톨루엔"], cas: "118-96-7", item: "5-3" },
  { id: "picric", name: "피크르산", alias: ["트라이나이트로페놀", "picric acid"], cas: "88-89-1", item: "5-3" },
  { id: "ha", name: "하이드록실아민", alias: ["히드록실아민", "hydroxylamine"], cas: "7803-49-8", item: "5-8" },
  // 제6류
  { id: "hclo4", name: "과염소산", alias: ["perchloric acid"], cas: "7601-90-3", item: "6-1" },
  { id: "h2o2", name: "과산화수소", alias: ["hydrogen peroxide", "과수"], cas: "7722-84-1", item: "6-2" },
  { id: "hno3", name: "질산", alias: ["nitric acid"], cas: "7697-37-2", item: "6-3" },
];
const SUB = Object.fromEntries(HZ_SUBS.map((x) => [x.id, x]));
export const hzSub = (id) => SUB[id];
export const HZ_QUICK = HZ_SUBS.filter((s) => s.quick).sort((a, b) => a.quick - b.quick);

/** 위험물이 아닌 것으로 자주 묻는 물질 */
export const HZ_NOT = [
  { name: "프로판(LPG)", alias: ["LPG", "프로판", "propane"], cas: "74-98-6", why: "기체 — 위험물 아님(액화석유가스법 등 적용)" },
  { name: "부탄", alias: ["butane", "부탄가스"], cas: "106-97-8", why: "기체 — 위험물 아님(액화석유가스법 등 적용)" },
  { name: "메탄(LNG·도시가스)", alias: ["LNG", "도시가스", "methane"], cas: "74-82-8", why: "기체 — 위험물 아님(도시가스사업법 등 적용)" },
  { name: "수소", alias: ["hydrogen"], cas: "1333-74-0", why: "기체 — 위험물 아님(고압가스 안전관리법 등 적용)" },
];

const norm = (s) => String(s || "").toLowerCase().replace(/[\s()·\-_,.]/g, "");
const casNorm = (s) => String(s || "").replace(/[^0-9]/g, "");
export const isCasLike = (q) => /^\d{2,7}-?\d{2}-?\d$/.test(String(q).trim());

/** CAS 또는 이름 검색 → [{type:'sub'|'not', ...}] */
export function hzSearch(q, limit = 8) {
  const t = String(q || "").trim();
  if (!t) return [];
  const qc = casNorm(t);
  const qn = norm(t);
  const out = [];
  const hit = (s) => {
    if (qc.length >= 4 && s.cas && casNorm(s.cas) === qc) return 3;
    if (qc.length >= 4 && s.cas && casNorm(s.cas).startsWith(qc) && /^[\d-\s]+$/.test(t)) return 2;
    if (qn.length >= 1 && /[^\d-\s]/.test(t) && [s.name, ...(s.alias || [])].some((a) => norm(a).includes(qn))) return 1;
    return 0;
  };
  for (const s of HZ_SUBS) {
    const h = hit(s);
    if (h) out.push({ type: "sub", h, s });
  }
  for (const s of HZ_NOT) {
    const h = hit(s);
    if (h) out.push({ type: "not", h, s });
  }
  return out.sort((a, b) => b.h - a.h).slice(0, limit);
}

/** CAS 검사숫자 확인 */
export function casValid(cas) {
  const m = String(cas || "").trim().match(/^(\d{2,7})-(\d{2})-(\d)$/);
  if (!m) return false;
  const digits = (m[1] + m[2]).split("").reverse();
  const sum = digits.reduce((a, d, i) => a + Number(d) * (i + 1), 0);
  return sum % 10 === Number(m[3]);
}

/**
 * 인화점 등으로 제4류 품명 판정 (별표1 비고 12·13·15~17)
 * @param {{flash, ignite, boil, water}} p 인화점·발화점·비점(℃), water: 수용성
 */
export function class4ByFlash(p) {
  const num = (v) => (v === "" || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));
  const f = num(p.flash);
  const ig = num(p.ignite);
  const bp = num(p.boil);
  if (ig !== null && ig <= 100) return { item: "4-sp", why: `발화점 ${ig}℃ — 100℃ 이하(비고 12)` };
  if (f !== null && bp !== null && f <= -20 && bp <= 40) return { item: "4-sp", why: `인화점 ${f}℃(−20℃ 이하)·비점 ${bp}℃(40℃ 이하)(비고 12)` };
  if (f === null) return null;
  const w = !!p.water;
  if (f < 21) return { item: w ? "4-1w" : "4-1n", why: `인화점 ${f}℃ — 21℃ 미만(비고 13)` };
  if (f < 70) return { item: w ? "4-2w" : "4-2n", why: `인화점 ${f}℃ — 21℃ 이상 70℃ 미만(비고 15)` };
  if (f < 200) return { item: w ? "4-3w" : "4-3n", why: `인화점 ${f}℃ — 70℃ 이상 200℃ 미만(비고 16)` };
  if (f < 250) return { item: "4-4", why: `인화점 ${f}℃ — 200℃ 이상 250℃ 미만(비고 17)` };
  return { item: null, why: `인화점 ${f}℃ — 250℃ 이상: 제4류 석유류에 해당하지 않음(동식물유류는 별도)` };
}

/**
 * 배수 계산
 * row: { item, q?(복수 지정수량 선택), amount, unit('L'|'kg'), sg(비중), off(조건 미충족) }
 */
/**
 * 팔레트 적재 수량: 용기 1개 용량 × 한 층 용기 수 × 층수 = 팔레트 1개 수량, × 팔레트 수 (+ 낱개 용기)
 * p: { cap, per, layers, pals, extra }
 */
export function palletQty(p, unit = "") {
  const v = (x) => (x === "" || x === undefined || x === null ? null : Number(x));
  const cap = v(p && p.cap);
  const per = v(p && p.per);
  const layers = v(p && p.layers);
  const pals = v(p && p.pals);
  const extra = v(p && p.extra) || 0;
  const bad = [cap, per, layers, pals].some((x) => x === null || !Number.isFinite(x) || x < 0) || !Number.isFinite(extra) || extra < 0;
  if (bad) return { ok: false, msg: "용기 용량·한 층 용기 수·층수·팔레트 수 입력 필요" };
  const perPallet = cap * per * layers;
  const total = perPallet * pals + cap * extra;
  const f = (x) => round(x).toLocaleString("ko-KR");
  const text =
    `${f(cap)}${unit} × ${f(per)}개 × ${f(layers)}층 = ${f(perPallet)}${unit}/팔레트` +
    ` × ${f(pals)}팔레트${extra ? ` + 낱개 ${f(extra)}개 × ${f(cap)}${unit}` : ""} = ${f(total)}${unit}`;
  return { ok: true, perPallet, total, cans: per * layers * pals + extra, text };
}

export function hzRow(row) {
  const it = ITEM[row.item];
  if (!it) return { ok: false, msg: "품명 선택 필요" };
  const q = it.opts ? Number(row.q) || null : it.q;
  if (!q) return { ok: false, it, msg: it.cls === 5 ? "시험 결과 종(제1종·제2종) 선택 필요" : "지정수량 선택 필요" };
  if (row.off) return { ok: true, it, q, ratio: 0, qty: 0, excluded: true };
  const unit = row.unit || it.u;
  let pal = null;
  let amount = row.amount;
  if (row.pallet && row.pallet.on) {
    pal = palletQty(row.pallet, unit);
    if (!pal.ok) return { ok: false, it, q, msg: pal.msg };
    amount = pal.total;
  }
  const a = Number(amount);
  if (amount === "" || amount === undefined || !Number.isFinite(a) || a < 0) return { ok: false, it, q, msg: "수량 입력 필요" };
  let qty = a;
  let conv = "";
  if (unit !== it.u) {
    const sg = Number(row.sg);
    if (!(sg > 0)) return { ok: false, it, q, msg: `단위 환산에 비중 입력 필요(${unit} → ${it.u})` };
    qty = it.u === "kg" ? a * sg : a / sg;
    conv = `${a.toLocaleString("ko-KR")}${unit} ${it.u === "kg" ? "×" : "÷"} 비중 ${sg} = ${round(qty).toLocaleString("ko-KR")}${it.u}`;
  }
  return { ok: true, it, q, qty, conv, pal, ratio: qty / q };
}
const round = (x, d = 4) => Math.round(x * 10 ** d) / 10 ** d;

export function hzTotal(rows) {
  const rs = rows.map(hzRow);
  const valid = rs.filter((r) => r.ok);
  const sum = valid.reduce((a, r) => a + r.ratio, 0);
  const pending = rs.filter((r) => !r.ok).length;
  let level;
  if (!valid.length) level = "none";
  else if (sum >= 1) level = "over";
  else if (sum >= 0.2) level = "small";
  else level = "under";
  return { rows: rs, sum: round(sum), pending, level };
}

export const hzFmt = (x) => (x === null || x === undefined ? "—" : round(x, 3).toLocaleString("ko-KR", { maximumFractionDigits: 3 }));

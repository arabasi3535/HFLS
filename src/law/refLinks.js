// 기타 자료 › 해설서·매뉴얼, 관련 사이트 — 링크 목록(2026-11-17 사용자 제공 주소)
//  · 해설서: 소방청 누리집 법령자료실(법령/정책 › 법령정보 › 법령자료실) 게시물, 위험물실무해설서는 소방안전 빅데이터 플랫폼 게시물
//  · 새 자료: 알맞은 묶음의 items에 { t, url, src } 추가(최신 판을 위로)

const NFA = (cntId, pageIdx = "") =>
  `https://www.nfa.go.kr/nfa/publicrelations/legalinformation/archives/?boardId=bbs_0000000000000018&mode=view&cntId=${cntId}&category=&pageIdx=${pageIdx}&searchCondition=${pageIdx ? "all" : ""}&searchKeyword=`;
const NFA_SRC = "소방청 법령자료실";

export const GUIDE_GROUPS = [
  {
    id: "law",
    name: "소방시설법령 해설·질의회신",
    items: [
      { t: "2026년 소방시설법령 해설서", url: NFA(64), src: NFA_SRC },
      { t: "2026년 소방시설법령 질의회신집", url: NFA(63), src: NFA_SRC },
      { t: "2025년 소방시설법령 질의회신집", url: NFA(62), src: NFA_SRC },
      { t: "2024년 소방시설법령 질의회신집", url: NFA(61), src: NFA_SRC },
      { t: "2021년 소방시설법령 질의회신집", url: NFA(43, "2"), src: NFA_SRC },
    ],
  },
  {
    id: "std",
    name: "화재안전기준 해설",
    items: [
      { t: "2024년 화재안전기술기준 해설서", url: NFA(56), src: NFA_SRC },
      { t: "소방시설의 내진설계 기준 해설서", url: NFA(42, "2"), src: NFA_SRC },
    ],
  },
  {
    id: "permit",
    name: "인허가·설계 업무",
    items: [
      { t: "건축허가 등의 동의 업무처리 표준 매뉴얼", url: NFA(48, "2"), src: NFA_SRC },
      { t: "건축위원회(심의) 표준 가이드라인", url: NFA(49, "2"), src: NFA_SRC },
      { t: "2025년 성능위주설계 평가 운영 표준 가이드라인", url: NFA(58), src: NFA_SRC },
    ],
  },
  {
    id: "insp",
    name: "점검·유지관리",
    items: [{ t: "소방시설등 점검관리 매뉴얼", url: NFA(57), src: NFA_SRC }],
  },
  {
    id: "haz",
    name: "위험물",
    items: [
      {
        t: "위험물실무해설서 제20판 (1~4권)",
        url: "https://www.bigdata-119.kr/safetyinfo/policyView?safety_info_id=198",
        src: "한국소방안전원 발간 · 소방안전 빅데이터 플랫폼(2026. 7. 30. 게시)",
      },
    ],
  },
];

// 관련 사이트 — 업무 흐름 순(기준 → 인허가·착공 → 점검·민원 → 위험물 → 통계·데이터 → 교육)
export const SITE_GROUPS = [
  {
    id: "std",
    name: "기준·인허가",
    items: [
      {
        t: "화재안전기술기준정보시스템",
        url: "https://nftc.nfire.go.kr/kor/",
        org: "국립소방연구원",
        d: "현행 화재안전성능기준(NFPC)·기술기준(NFTC) 원문 확인 — 허가 당시의 옛 기준은 이 앱의 「연혁법 찾기」",
      },
      {
        t: "소방시설업 등록시스템",
        url: "http://fdept.ekffa.or.kr/login.do",
        org: "소방청",
        d: "소방시설업(설계·공사·감리·방염) 등록·변경 처리와 등록 현황 확인",
        login: true,
      },
      {
        t: "소방기술자·감리원 배치시스템",
        url: "http://fesa.ekffa.or.kr/fe/login/NR_index.do",
        org: "한국소방시설협회",
        d: "공사·감리 현장의 소방기술자·감리원 배치 입력·확인 — 착공신고·감리자 지정신고 때 배치 확인",
        login: true,
      },
    ],
  },
  {
    id: "civil",
    name: "점검·민원",
    items: [
      {
        t: "소방민원센터(소민터)",
        url: "https://safeland.go.kr/",
        org: "소방청",
        d: "자체점검 실시결과 보고, 소방안전관리자 선임신고 등 소방민원 온라인 신청·처리",
      },
    ],
  },
  {
    id: "haz",
    name: "위험물",
    items: [
      {
        t: "국가위험물통합정보시스템",
        url: "https://hazmat.nfa.go.kr/",
        org: "소방청",
        d: "위험물 제조소등의 허가·신고와 안전관리 정보 조회·관리",
        login: true,
      },
    ],
  },
  {
    id: "data",
    name: "통계·데이터",
    items: [
      {
        t: "국가화재정보시스템",
        url: "https://www.nfds.go.kr/",
        org: "소방청",
        d: "화재 발생 통계(지역·장소·원인별 건수·인명·재산피해) 조회",
      },
      {
        t: "소방안전 빅데이터 플랫폼",
        url: "https://bigdata-119.kr/",
        org: "소방청",
        d: "소방 공공데이터 개방·분석, 정책·기술자료(위험물실무해설서 등) 게시",
      },
    ],
  },
  {
    id: "edu",
    name: "안전교육",
    items: [
      {
        t: "국민안전교육플랫폼",
        url: "https://kasem.safekorea.go.kr/",
        org: "행정안전부",
        d: "생애주기·분야별 안전교육 자료, 전국 안전체험관 안내",
      },
    ],
  },
];

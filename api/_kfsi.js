// 한국소방안전원 YouTube 채널 — 영상 자료 「한국소방안전원 영상」 줄 구성
//  · 첫 줄: 채널 「동영상」 재생목록(UULF…, 쇼츠 제외) 최신순
//  · 다음 줄부터: 채널 재생목록을 업무 분류별로 묶음(재생목록 ID는 채널 「재생목록」 화면에서 확인, 2026.11.15.)
//  · 분류를 바꾸려면 rows만 고치면 됨 — [재생목록 ID, 표시 이름, (선택) 제목 거르기 정규식]
//    「디지털 콘텐츠 실습교육」은 소방시설·위험물 강의가 섞여 있어 제목으로 나눠 두 줄에 넣음
module.exports = {
  id: "UCxxWnGhFgJOzsNOwYSHN5cQ",
  name: "한국소방안전원",
  rows: [
    {
      k: "fac",
      title: "소방시설 점검·사용법",
      lists: [
        ["PLwbdgJqiVBvBhkOG0vBHM0gAgJrvbT7Zg", "소방시설 사용법(교재 영상)"],
        ["PLwbdgJqiVBvDv93_AMzp1hiTWKXwUcT24", "자동화재탐지설비 실습"],
        ["PLwbdgJqiVBvD49_de7knNuCLsC6C-oAC9", "공동주택 피난설비 사용법"],
        ["PLPWSPCuIgiY8", "디지털 실습교육(소방시설)", "수신기|스프링클러|소화설비|소화기|감지기|유도등|피난"],
      ],
    },
    {
      k: "haz",
      title: "위험물 점검",
      lists: [
        ["PLDJQWjwo05tI", "이동탱크저장소 점검"],
        ["PLN-PrEGch6X8", "위험물 류별 특징"],
        ["PLPWSPCuIgiY8", "디지털 실습교육(위험물)", "저장소|탱크|취급소|제조소|위험물"],
      ],
    },
    {
      k: "mgr",
      title: "소방안전관리 실무",
      lists: [
        ["PLwbdgJqiVBvCdloMFfjLJ03ei6EABsNGu", "소방안전관리자에 대한 모든 것"],
        ["PLwbdgJqiVBvDKzaiuTTD1j1EdswHxihyu", "소방안전관리대상"],
        ["PLwbdgJqiVBvC39VSIY4LaPtWgN7cKzgZO", "실무교육"],
        ["PLwbdgJqiVBvCF2dL34E-sadtmGwvTwhNy", "강습교육"],
        ["PLwbdgJqiVBvAiZtD9xCghY_bD_9YM9-4b", "화재예방안전진단"],
        ["PLwbdgJqiVBvAc4Q_ICSU_qEGcfZE1Zb44", "민원업무"],
      ],
    },
    {
      k: "aid",
      title: "응급처치·소방훈련",
      lists: [
        ["PLwbdgJqiVBvAA-h64zAsHBXjk3axVC9_Q", "응급처치"],
        ["PLwbdgJqiVBvBzvhNANvlr9IIC28FbGP5I", "소방훈련·교육"],
      ],
    },
  ],
};

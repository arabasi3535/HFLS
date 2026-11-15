// ============================================================
// 제작자 정보 — 머리말·바닥글의 「안동소방서 예방안전과 이제현」을 누르면 보이는 창(src/components/Profile.js)
//  · 항목을 늘리려면 아래 배열에 추가하면 됨(비어 있으면 「준비 중」으로 표시)
// ============================================================
import { CHANNEL } from "./videos";

export const PROFILE = {
  name: "이제현",
  org: "안동소방서 예방안전과",
  email: "arabasi3535@gmail.com",
  intro: "소방시설 적용·안전관리 검토 시스템을 만들고 운영합니다. 오류나 개선 의견은 메일 또는 화면 아래 「오류 신고 · 의견 보내기」로 보내 주세요.",
  sections: [
    {
      k: "paper",
      title: "논문",
      // { t: "제목", j: "학술지", y: 2027, state: "게재 예정", url: "" }
      items: [{ t: "지하주차장 습식 스프링클러 설비의 동파 방지를 위한 지열순환(GCS) 방식 적용 가능성에 관한 연구", state: "게재 예정" }],
      empty: "",
    },
    {
      k: "youtube",
      title: "유튜브 채널",
      items: [{ t: `「${CHANNEL.name}」`, note: "소방시설 법령 적용·기준 해설 영상", url: CHANNEL.url }],
      empty: "",
    },
    {
      k: "novel",
      title: "네이버 웹소설",
      // { t: "작품명", note: "연재 정보", url: "https://novel.naver.com/..." }
      items: [{ t: "네이버 웹소설 베스트리그 연재작", url: "https://novel.naver.com/best/list?novelId=1250300" }],
      empty: "",
    },
    {
      k: "app",
      title: "기타 앱",
      items: [{ t: "다이사이 점수 기록", url: "https://arabasi3535.github.io/daesai-tracker/" }],
      empty: "",
    },
  ],
};

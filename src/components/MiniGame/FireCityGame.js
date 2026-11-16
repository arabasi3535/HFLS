import { useEffect, useRef, useState } from "react";
import { initGame } from "./game";
import { evaluate, extrasOf, ASSUMPTIONS, STAGE_ASSUMPTIONS } from "./rulesAdapter";
import * as stages from "./stagesAdapter";
import "./MiniGame.css";

// 「소방 인허가 시티」 — 판정은 HFLS 판정 엔진(rulesAdapter·stagesAdapter)을 그대로 사용
// 난이도: 초급(허가 동의) · 중급(허가 → 착공 → 준공) · 고급(기존 건축물: 허가 당시 → 현행 관리) — 도시·계급·랭킹 따로
const LEVELS = [
  { id: "basic", name: "초급", sub: "허가 동의" },
  { id: "mid", name: "중급", sub: "허가→착공→준공" },
  { id: "adv", name: "고급", sub: "기존 건축물·연혁" },
];
const INTRO = {
  basic: "신축 건축물의 설치 소방시설을 고르는 단계입니다.",
  mid: "신축 건축물을 허가 동의 → 착공(신고·기술자·감리·임시소방시설·방염 등) → 준공 후(안전관리 등급·자체점검)까지 검토합니다.",
  adv: "과거에 허가된 기존 건축물을 허가 당시 기준(연혁)과 지금 기준(안전관리·자체점검)으로 검토합니다.",
};
const LV_KEY = "firecity_level";

export default function FireCityGame({ adminPw = "" }) {
  const ref = useRef(null);
  const pwRef = useRef(adminPw);
  pwRef.current = adminPw; // 관리자 로그인 시 랭킹 삭제 버튼 표시
  const [level, setLevel] = useState(() => {
    try {
      const v = localStorage.getItem(LV_KEY);
      return LEVELS.some((l) => l.id === v) ? v : "basic";
    } catch (e) {
      return "basic";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(LV_KEY, level);
    } catch (e) {
      /* 저장 불가 환경 */
    }
    const el = ref.current;
    if (!el) return undefined;
    return initGame(el, { evaluate, extrasOf, ASSUMPTIONS, STAGE_ASSUMPTIONS, stages, level, getAdminPw: () => pwRef.current });
  }, [level]);
  return (
    <div className="mg">
      <div className="mg-lv" role="tablist" aria-label="난이도">
        {LEVELS.map((l) => (
          <button key={l.id} type="button" role="tab" aria-selected={level === l.id} className={level === l.id ? "on" : ""} onClick={() => setLevel(l.id)}>
            {l.name}
            <small>{l.sub}</small>
          </button>
        ))}
      </div>
      <p className="mg-intro">
        {INTRO[level]} 채점은 <b>HFLS 판정 기준</b>과 같고, 난이도마다 도시·계급·🏆 랭킹이 따로입니다.
      </p>
      <div className="fc-root" ref={ref} />
    </div>
  );
}

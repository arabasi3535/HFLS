import { useEffect, useRef } from "react";
import { initGame } from "./game";
import { evaluate, extrasOf, ASSUMPTIONS } from "./rulesAdapter";
import "./MiniGame.css";

// 「소방 인허가 시티」 — 설치대상 판정은 HFLS 판정 엔진(rulesAdapter → evaluateAt)을 그대로 사용
export default function FireCityGame() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    return initGame(el, { evaluate, extrasOf, ASSUMPTIONS });
  }, []);
  return (
    <div className="mg">
      <p className="mg-intro">
        소방서 인허가 담당이 되어 건축허가 동의를 검토하는 미니게임입니다. 설치대상 판정은 <b>신축 건축물 탭과 같은 HFLS 판정 기준</b>(신청일 기준
        연혁 적용)으로 채점합니다. 진행 상황은 이 브라우저에만 저장됩니다.
      </p>
      <div className="fc-root" ref={ref} />
    </div>
  );
}

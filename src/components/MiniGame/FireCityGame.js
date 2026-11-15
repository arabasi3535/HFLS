import { useEffect, useRef } from "react";
import { initGame } from "./game";
import { evaluate, extrasOf, ASSUMPTIONS } from "./rulesAdapter";
import "./MiniGame.css";

// 「소방 인허가 시티」 — 설치대상 판정은 HFLS 판정 엔진(rulesAdapter → evaluateAt)을 그대로 사용
export default function FireCityGame({ adminPw = "" }) {
  const ref = useRef(null);
  const pwRef = useRef(adminPw);
  pwRef.current = adminPw; // 관리자 로그인 시 랭킹 삭제 버튼 표시
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    return initGame(el, { evaluate, extrasOf, ASSUMPTIONS, getAdminPw: () => pwRef.current });
  }, []);
  return (
    <div className="mg">
      <p className="mg-intro">
        소방서 인허가 담당이 되어 건축허가 동의를 검토하는 미니게임입니다. 설치대상 판정은 <b>신축 건축물 탭과 같은 HFLS 판정 기준</b>(신청일 기준
        연혁 적용)으로 채점합니다. 진행 상황은 이 브라우저에 저장되고, 🏆 랭킹은 상단의 「🏆 랭킹 참여」 버튼을 눌러 닉네임만 등록하면 참여할 수 있습니다(① XP ② 1회 적합 횟수 순).
      </p>
      <div className="fc-root" ref={ref} />
    </div>
  );
}

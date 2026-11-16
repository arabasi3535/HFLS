import { useEffect, useState } from "react";

// ============================================================
// 📱 휴대폰에 앱으로 설치 — 제목 옆 버튼 + 기기별 설치 안내
//  · 안드로이드: 크롬 ⋮ → 홈 화면에 추가 → 설치 (크롬이 설치 이벤트를 주면 「지금 바로 설치」 버튼)
//  · 아이폰: 사파리 공유(iOS 26은 ⋯ → 공유) → 홈 화면에 추가 → 웹 앱으로 열기 → 추가
//  · 이미 설치한 앱으로 실행 중이면 버튼을 숨김
// ============================================================

export function detect(ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "", touch = typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0) {
  const iPadOS = /Macintosh/.test(ua) && touch > 1; // iPadOS는 맥으로 표시됨
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "pc";
}
const isStandalone = () =>
  typeof window !== "undefined" && ((window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true);

const STEPS = {
  android: {
    title: "안드로이드 (크롬)",
    steps: [
      ["크롬으로 열기", <>스마트폰의 <b>Chrome(크롬)</b> 앱에서 <b>hfls.vercel.app</b>에 접속합니다. 카카오톡·문자 링크로 열었다면 오른쪽 위 메뉴에서 「다른 브라우저로 열기 → Chrome」을 고릅니다.</>],
      ["메뉴 열기", <>주소창 오른쪽 위 <b>⋮</b>(점 세 개) 메뉴를 누릅니다.</>],
      ["홈 화면에 추가", <><b>「홈 화면에 추가」</b>를 누릅니다(크롬 버전에 따라 <b>「앱 설치」</b>로 보이기도 합니다).</>],
      ["설치", <>창이 뜨면 이름이 「소방시설 검토」인지 확인하고 <b>「설치」</b>를 누릅니다(「바로가기 만들기」가 아니라 「설치」).</>],
      ["홈 화면에 배치", <>갤럭시 등 일부 기종은 아이콘이 <b>앱 서랍(전체 앱 목록)</b>에 먼저 생깁니다. 아이콘을 길게 눌러 홈 화면으로 끌어 놓으십시오.</>],
    ],
    tip: "접속했을 때 화면 아래에 「설치」 안내가 저절로 뜨면 그것을 눌러도 됩니다. 삼성 인터넷은 하단 ≡ 메뉴 → 「현재 페이지 추가」 → 「홈 화면」입니다.",
  },
  ios: {
    title: "아이폰·아이패드 (사파리)",
    steps: [
      ["사파리로 열기", <><b>Safari(사파리)</b>에서 <b>hfls.vercel.app</b>에 접속합니다. 카카오톡 등 앱 안에서 열렸다면 「Safari로 열기」를 먼저 누릅니다.</>],
      ["공유 누르기", <><b>iOS 26</b>: 주소창 오른쪽 <b>「⋯」</b> → <b>「공유」</b>. <b>iOS 18 이하</b>: 화면 아래 <b>공유 버튼 □↑</b>.</>],
      ["홈 화면에 추가", <>메뉴를 아래로 내려 <b>「홈 화면에 추가」</b>를 누릅니다. 안 보이면 맨 아래 「동작 편집」에서 추가할 수 있습니다.</>],
      ["웹 앱으로 열기 · 추가", <><b>「웹 앱으로 열기」</b>가 켜져 있는지 확인하고(iOS 26), 이름 「소방시설 검토」를 확인한 뒤 오른쪽 위 <b>「추가」</b>를 누릅니다.</>],
      ["실행", <>홈 화면의 아이콘을 누르면 주소창 없이 앱처럼 열립니다.</>],
    ],
    tip: "아이폰용 크롬도 iOS 16.4 이상이면 공유 → 「홈 화면에 추가」로 설치할 수 있지만, 앱처럼 쓰려면 사파리를 권장합니다. 아이폰은 사파리에서 쓰던 입력·미니게임 진행이 설치한 앱과 따로 저장될 수 있습니다(랭킹 기록은 서버에 그대로).",
  },
};

export default function PhoneInstall() {
  const [open, setOpen] = useState(false);
  const [dev] = useState(detect);
  const [tab, setTab] = useState(() => (detect() === "ios" ? "ios" : "android"));
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    // 크롬(안드로이드·PC)이 설치 가능하다고 알려 주면 「지금 바로 설치」 버튼에 사용
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (installed) return null;
  const installNow = async () => {
    if (!deferred) return;
    deferred.prompt();
    try {
      const r = await deferred.userChoice;
      if (r && r.outcome === "accepted") setOpen(false);
    } catch (e) {
      /* 무시 */
    }
    setDeferred(null);
  };
  const cur = STEPS[tab];
  const devLabel = dev === "ios" ? "아이폰·아이패드" : dev === "android" ? "안드로이드폰" : "PC";

  return (
    <>
      <button type="button" className="pi-btn no-print" onClick={() => setOpen(true)} title="스마트폰 홈 화면에 앱처럼 설치하는 방법">
        📱 휴대폰에 앱으로 설치
      </button>
      {open && (
        <div className="modal-bg no-print" onClick={() => setOpen(false)}>
          <div className="modal pi" role="dialog" aria-modal="true" aria-label="휴대폰에 앱으로 설치" onClick={(e) => e.stopPropagation()}>
            <div className="modal-h">
              <b>📱 휴대폰에 앱으로 설치</b>
              <button type="button" className="modal-x" onClick={() => setOpen(false)} aria-label="닫기">
                ×
              </button>
            </div>
            <p className="pi-lead">
              앱스토어 없이 <b>홈 화면 아이콘</b>으로 설치해 앱처럼 쓸 수 있습니다. 사이트가 바뀌면 설치한 앱도 자동으로 최신 버전이 됩니다.
              <span className="pi-dev"> 지금 기기: {devLabel}</span>
            </p>
            {deferred && (
              <button type="button" className="btn btn-primary pi-now" onClick={installNow}>
                📲 지금 바로 설치
              </button>
            )}
            <div className="pi-tabs" role="tablist">
              {["android", "ios"].map((k) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
                  {k === "android" ? "🤖 안드로이드 (크롬)" : "🍎 아이폰 (사파리)"}
                </button>
              ))}
            </div>
            <ol className="pi-steps">
              {cur.steps.map(([t, d], i) => (
                <li key={i}>
                  <span className="pi-no">{i + 1}</span>
                  <div>
                    <b>{t}</b>
                    <p>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="pi-tip">💡 {cur.tip}</p>
            {dev === "pc" && (
              <p className="pi-tip">
                지금은 PC에서 보고 계십니다. 휴대폰에서 <b>hfls.vercel.app</b>을 연 뒤 위 순서대로 설치하십시오.
              </p>
            )}
            <p className="pi-sub">지우기: 홈 화면 아이콘을 길게 눌러 「삭제」(아이폰은 「앱 제거」·「북마크 삭제」).</p>
          </div>
        </div>
      )}
    </>
  );
}

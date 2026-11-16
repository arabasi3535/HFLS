import { lazy, Suspense, useEffect, useState } from "react";

const PhoneInstallGuide = lazy(() => import("./PhoneInstallGuide"));

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

export default function PhoneInstall() {
  const [open, setOpen] = useState(false);
  const [dev] = useState(detect);
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

  return (
    <>
      <button type="button" className="pi-btn no-print" onClick={() => setOpen(true)} title="스마트폰 홈 화면에 앱처럼 설치하는 방법">
        📱 휴대폰에 앱으로 설치
      </button>
      {open && (
        <Suspense fallback={null}>
          <PhoneInstallGuide dev={dev} deferred={deferred} onInstall={installNow} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

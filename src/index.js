import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PC 브라우저: 날짜 입력칸 아무 곳이나 누르면 달력이 열리도록(휴대폰은 기본 동작으로 열림)
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t && t.tagName === "INPUT" && t.type === "date" && !t.readOnly && !t.disabled && typeof t.showPicker === "function") {
    try {
      t.showPicker();
    } catch (err) {
      /* 지원하지 않는 환경은 기본 동작 */
    }
  }
});

// PWA 서비스워커 등록 (배포 빌드 + 웹 브라우저에서만. 안드로이드 앱(Capacitor)은 앱 내부에 파일이 포함되어 불필요)
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator && !window.Capacitor) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/sw.js`).catch(() => {});
  });
}

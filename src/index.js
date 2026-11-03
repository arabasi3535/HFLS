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

// PWA 서비스워커 등록 (배포 빌드 + 웹 브라우저에서만. 안드로이드 앱(Capacitor)은 앱 내부에 파일이 포함되어 불필요)
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator && !window.Capacitor) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/sw.js`).catch(() => {});
  });
}

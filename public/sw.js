/* 서비스워커 — 오프라인 실행 지원
 * 페이지(HTML): 네트워크 우선 → 실패 시 캐시 (배포 즉시 최신 반영)
 * 정적 파일(/static, 아이콘): 캐시 우선 (파일명에 해시 포함)
 */
const CACHE = "hfls-v2.44.0";
const CORE = ["/", "/index.html", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // 사용 통계·오류 신고는 항상 네트워크
  if (url.pathname.startsWith("/docs/")) return; // 실무 자료 PDF 등은 브라우저에 맡김(캐시 안 함)

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          // 앱 화면(HTML)만 오프라인용으로 보관 — PDF 등 다른 파일을 index.html로 저장하지 않음
          if (res.ok && (res.headers.get("content-type") || "").includes("text/html")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put("/index.html", copy));
          }
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && (url.pathname.startsWith("/static/") || url.pathname.startsWith("/icons/"))) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});

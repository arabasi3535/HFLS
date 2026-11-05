// 서버(Vercel 함수) 호출 — 저장소 미설정·로컬 실행 시 조용히 실패
const json = async (r) => {
  let body = null;
  try {
    body = await r.json();
  } catch (e) {
    body = null;
  }
  return { ok: r.ok, status: r.status, body };
};

/** 사용 횟수: 같은 탭 세션당 1회만 기록, 이후는 조회 */
export async function loadStats() {
  let first = true;
  try {
    first = !sessionStorage.getItem("hfls_visit");
    sessionStorage.setItem("hfls_visit", "1");
  } catch (e) {
    /* 저장 불가 환경 */
  }
  try {
    const r = await json(await fetch("/api/stats", { method: first ? "POST" : "GET" }));
    if (!r.ok || !r.body || !r.body.configured) return null;
    return r.body;
  } catch (e) {
    return null;
  }
}

export async function sendReport(payload) {
  try {
    const r = await json(
      await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    );
    if (r.ok) return { ok: true };
    if (r.status === 503 || r.status === 404) return { ok: false, unconfigured: true };
    return { ok: false, error: (r.body && r.body.error) || `오류 ${r.status}` };
  } catch (e) {
    return { ok: false, unconfigured: true };
  }
}

export async function listReports(pw) {
  try {
    const r = await json(await fetch("/api/report", { headers: { "x-admin-pw": pw } }));
    if (r.ok) return { ok: true, ...r.body };
    if (r.status === 503 || r.status === 404) return { ok: false, error: "신고 저장소가 설정되지 않았습니다(README 「사용 통계·오류 신고 설정」 참고)." };
    return { ok: false, error: (r.body && r.body.error) || `오류 ${r.status}` };
  } catch (e) {
    return { ok: false, error: "서버에 연결할 수 없습니다." };
  }
}

export async function deleteReport(pw, id) {
  try {
    const r = await fetch(`/api/report?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { "x-admin-pw": pw } });
    return r.ok;
  } catch (e) {
    return false;
  }
}

/** 관리자 확인: {ok} | {unset} | {unreachable} | {error} */
export async function adminAuth(pw) {
  try {
    const r = await json(await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pw }) }));
    if (!r.body || r.status === 404) return { unreachable: true };
    if (r.status === 429) return { error: r.body.error };
    if (r.body.unset) return { unset: true };
    return { ok: !!r.body.ok };
  } catch (e) {
    return { unreachable: true };
  }
}

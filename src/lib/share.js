// ============================================================
// 결과 공유 링크 — 신축·기존 건축물 입력값을 주소(#share=…)에 담아 전달
//  · 주소의 # 뒤 부분은 서버로 보내지지 않음 → 서버에 아무것도 저장하지 않음
//  · 입력값만 담음(건축물 명칭·주소 같은 개인정보 입력란은 없음)
//  · 형식: #share=<n|e>.<deflate+base64url(JSON)>   n = 신축, e = 기존
// ============================================================
import { deflateSync, inflateSync, strToU8, strFromU8 } from "fflate";

const V = 1;

function b64url(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64url(str) {
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4));
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}

/** 입력값 → 공유 주소 */
export function makeShareUrl(mode, input, base) {
  const body = b64url(deflateSync(strToU8(JSON.stringify({ v: V, i: input })), { level: 9 }));
  const origin = base || `${window.location.origin}${window.location.pathname}`;
  return `${origin}#share=${mode === "existing" ? "e" : "n"}.${body}`;
}

/** 주소의 hash → { mode, input } (형식이 맞지 않으면 null) */
export function readShareHash(hash) {
  const m = /^#share=([ne])\.([A-Za-z0-9_-]+)$/.exec(hash || "");
  if (!m) return null;
  try {
    const o = JSON.parse(strFromU8(inflateSync(unb64url(m[2]))));
    if (!o || o.v !== V || typeof o.i !== "object" || !o.i) return null;
    return { mode: m[1] === "e" ? "existing" : "new", input: o.i };
  } catch (e) {
    return null;
  }
}

/** 클립보드 복사(실패하면 false) */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e2) {
      return false;
    }
  }
}

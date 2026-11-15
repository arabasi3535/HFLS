/** 기타 자료 › 질의회신으로 이 검색어를 넘겨 바로 검색(#qa=…) */
export default function QaLink({ word, label }) {
  const w = String(word || "").replace(/\(.*?\)/g, "").trim();
  if (!w) return null;
  return (
    <a className="qa-link no-print" href={"#qa=" + encodeURIComponent(w)}>
      🔎 {label || `「${w}」 관련 소방청 질의회신 찾기`}
    </a>
  );
}

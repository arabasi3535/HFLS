import { useEffect, useState } from "react";
import { GUIDE_GROUPS, SITE_GROUPS } from "../law/refLinks";
import { PRACTICE_DOCS, practiceUrl } from "../law/practiceDocs";
import { loadDownloads, countDownload } from "../lib/remote";

// ============================================================
// 기타 자료 › 해설서·매뉴얼 / 관련 사이트 — 링크 모음(목록: src/law/refLinks.js)
// ============================================================

export function GuideTab() {
  return (
    <div className="pp">
      {GUIDE_GROUPS.map((g) => (
        <section key={g.id} className="pp-sec">
          <h4>
            {g.name} <span>{g.items.length}</span>
          </h4>
          <ol>
            {g.items.map((it) => (
              <li key={it.url}>
                <a className="pp-t" href={it.url} target="_blank" rel="noopener noreferrer">
                  {it.t} ↗
                </a>
                <div className="pp-m">{it.src}</div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function SiteTab() {
  return (
    <div className="pp">
      {SITE_GROUPS.map((g) => (
        <section key={g.id} className="pp-sec">
          <h4>
            {g.name} <span>{g.items.length}</span>
          </h4>
          <ol>
            {g.items.map((it) => (
              <li key={it.url}>
                <a className="pp-t" href={it.url} target="_blank" rel="noopener noreferrer">
                  {it.t} ↗
                </a>
                <span className="rl-org">{it.org}</span>
                {it.login && <em className="rl-login">업무용 로그인</em>}
                <div className="pp-m">{it.d}</div>
                {it.how && <div className="pp-m rl-how">사용 방법: {it.how}</div>}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function PracticeTab() {
  const [dl, setDl] = useState(null); // 파일별 내려받기(열기 포함) 횟수 — 저장소 미설정이면 표시 안 함
  useEffect(() => {
    let on = true;
    loadDownloads().then((c) => on && setDl(c));
    return () => {
      on = false;
    };
  }, []);
  const hit = (f) => {
    countDownload(f);
    setDl((p) => (p ? { ...p, [f]: (p[f] || 0) + 1 } : p));
  };
  return (
    <div className="pp">
      <div className="pr-warn" role="note">
        <b>⚠ 참고용 자료입니다.</b> 업무 이해를 돕기 위해 요약한 자료로, 법령 개정·해석에 따라 내용이 달라질 수 있으며 정확성을 보증하지 않습니다. 실제 업무·민원 판단은 반드시 법령 원문과 소관 부서 지침으로 확인하십시오.
      </div>
      <section className="pp-sec">
        <div className="pr-grid">
          {PRACTICE_DOCS.map((it, i) => (
            <div key={it.f} className="pr-card">
              <a className="pr-thumb" href={practiceUrl(it.f)} target="_blank" rel="noopener noreferrer" title="크게 보기">
                <img src={practiceUrl(it.f, "webp")} alt={`${it.t} 한눈에 보기 미리보기`} loading="lazy" width="360" height="509" />
              </a>
              <div className="pr-body">
                <div className="pr-t">
                  {i + 1}. {it.t} 한눈에 보기
                </div>
                <div className="pp-m">{it.core}</div>
                <div className="pr-btns">
                  <a className="btn small" href={practiceUrl(it.f)} target="_blank" rel="noopener noreferrer" onClick={() => hit(it.f)}>
                    열기 ↗
                  </a>
                  <a className="btn small" href={practiceUrl(it.f)} download={`${it.t} 한눈에 보기.pdf`} onClick={() => hit(it.f)}>
                    ⬇ 내려받기
                  </a>
                  {dl && <span className="pr-dl" title="열기·내려받기 횟수(같은 사람은 하루 1회)">⬇ {(dl[it.f] || 0).toLocaleString()}회</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

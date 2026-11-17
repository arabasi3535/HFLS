import { GUIDE_GROUPS, SITE_GROUPS } from "../law/refLinks";
import { PRACTICE_GROUPS, practiceUrl } from "../law/practiceDocs";

// ============================================================
// 기타 자료 › 해설서·매뉴얼 / 관련 사이트 — 링크 모음(목록: src/law/refLinks.js)
// ============================================================

const count = (groups) => groups.reduce((n, g) => n + g.items.length, 0);

export function GuideTab() {
  return (
    <div className="pp">
      <div className="vd-head pp-head">
        <div>
          <b>해설서·매뉴얼 {count(GUIDE_GROUPS)}건</b>
          <p>
            소방청 법령자료실 등에 올라온 법령 해설서·질의회신집·업무 매뉴얼의 게시물로 연결합니다. 파일(PDF·HWP)은 열린 게시물의 첨부파일에서 받으십시오. 해설서는 발간 당시 법령 기준이므로 개정된 부분은 법령 원문으로 확인하십시오.
          </p>
        </div>
      </div>
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
      <div className="vd-head pp-head">
        <div>
          <b>관련 사이트 {count(SITE_GROUPS)}곳</b>
          <p>소방 업무에 자주 쓰는 기관 누리집입니다. 「업무용 로그인」 표시가 있는 곳은 담당자 계정(인증서)으로 들어갑니다.</p>
        </div>
      </div>
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
  const n = PRACTICE_GROUPS.reduce((s, g) => s + g.items.length, 0);
  return (
    <div className="pp">
      <div className="pr-warn" role="note">
        <b>⚠ 참고용 자료입니다.</b> 업무 이해를 돕기 위해 요약한 자료로, 법령 개정·해석에 따라 내용이 달라질 수 있으며 정확성을 보증하지 않습니다. 실제 업무·민원 판단은 반드시 법령 원문과 소관 부서 지침으로 확인하십시오.
      </div>
      <div className="vd-head pp-head">
        <div>
          <b>실무 자료 — 한눈에 보기 {n}종</b>
          <p>주제별 1쪽 요약(PDF, 2026. 11. 작성). 미리보기를 누르면 크게 열리고, 「내려받기」로 저장할 수 있습니다.</p>
        </div>
      </div>
      {PRACTICE_GROUPS.map((g) => (
        <section key={g.id} className="pp-sec">
          <h4>
            {g.name} <span>{g.items.length}</span>
          </h4>
          <div className="pr-grid">
            {g.items.map((it) => (
              <div key={it.f} className="pr-card">
                <a className="pr-thumb" href={practiceUrl(it.f)} target="_blank" rel="noopener noreferrer" title="크게 보기">
                  <img src={practiceUrl(it.f, "webp")} alt={`${it.t} 한눈에 보기 미리보기`} loading="lazy" width="360" height="509" />
                </a>
                <div className="pr-body">
                  <div className="pr-t">{it.t} 한눈에 보기</div>
                  <div className="pp-m">{it.core}</div>
                  <div className="pr-btns">
                    <a className="btn small" href={practiceUrl(it.f)} target="_blank" rel="noopener noreferrer">
                      열기 ↗
                    </a>
                    <a className="btn small" href={practiceUrl(it.f)} download={`${it.t} 한눈에 보기.pdf`}>
                      ⬇ 내려받기
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

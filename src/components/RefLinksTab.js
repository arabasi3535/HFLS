import { GUIDE_GROUPS, SITE_GROUPS } from "../law/refLinks";

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
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

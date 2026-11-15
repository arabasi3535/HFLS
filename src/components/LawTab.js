import { useMemo, useState } from "react";
import { LAW_GROUPS, HAZ_GUIDES, HAZ_HISTORY, LAW_CHECKED, lawUrl } from "../law/lawlinks";

// ============================================================
// 기타 자료 › 법령 자료 — 국가법령정보센터 현행 원문 링크 모음
// ============================================================

const BIG = new Set(["nfpc", "nftc"]); // 41건씩 — 처음엔 접어 둠

export default function LawTab() {
  const [q, setQ] = useState("");
  const k = q.trim().replace(/\s+/g, "").toLowerCase();
  const hit = (n) => !k || n.replace(/\s+/g, "").toLowerCase().includes(k);
  const groups = useMemo(
    () => LAW_GROUPS.map((g) => ({ ...g, list: g.items.filter((it) => hit(it.n)) })).filter((g) => g.list.length),
    [k] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const guides = HAZ_GUIDES.filter((g) => hit(g.n));
  const total = LAW_GROUPS.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="pp lw">
      <div className="vd-head pp-head">
        <div>
          <b>법령 자료 {total + HAZ_GUIDES.length}건</b> <span className="pp-count">(원문 링크 {total}건 · 위험물 업무지침 {HAZ_GUIDES.length}건)</span>
          <p>
            소방시설 관계 법령·고시와 화재안전성능기준(NFPC)·화재안전기술기준(NFTC), 위험물 법령을 국가법령정보센터 원문으로
            연결합니다. 링크는 항상 <b>현행</b> 원문으로 열리므로 개정되어도 따로 고칠 필요가 없습니다. 연혁·부칙은 원문 화면의
            「연혁」에서 확인하세요.
          </p>
        </div>
      </div>

      <div className="pp-bar">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="법령·고시 이름 검색 (예: 스프링클러, 자체점검, 방염)" aria-label="법령 검색" />
        <span className="pp-count">{groups.reduce((s, g) => s + g.list.length, 0) + guides.length}건</span>
      </div>

      {groups.length === 0 && guides.length === 0 && <div className="pp-empty">검색 결과가 없습니다.</div>}

      {groups.map((g) => (
        <details key={g.id + (k ? "-q" : "")} className="pp-sec lw-sec" open={!!k || !BIG.has(g.id)}>
          <summary>
            <h4>
              {g.title} <span>{g.list.length}</span>
            </h4>
          </summary>
          {g.id === "haz" && !k && (
            <div className="lw-hist">
              <div className="lw-hist-h">위험물 법령 연혁 — 허가 시점의 기준이 어느 법령에 있었는지</div>
              <div className="lw-hist-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>기간</th>
                      <th>법률</th>
                      <th>대통령령</th>
                      <th>부령</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HAZ_HISTORY.map((h) => (
                      <tr key={h.p}>
                        <td className="nw">{h.p}</td>
                        <td>{h.law}</td>
                        <td>
                          {h.dec}
                          {h.note && <div className="lw-hist-n">※ {h.note}</div>}
                        </td>
                        <td>{h.rule}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lw-note">
                옛 법령(소방법 등)의 당시 조문은 국가법령정보센터에서 해당 법령의 「연혁」으로 찾습니다. 출처: 2026년 하반기 위험물담당공무원 교육 교재 「위험물 법령 연혁 및 현황」.
              </div>
            </div>
          )}
          <ol>
            {g.list.map((it) => (
              <li key={it.n}>
                <a className="pp-t" href={lawUrl(it.n, it.t)} target="_blank" rel="noopener noreferrer">
                  {it.n}
                </a>
                <span className={`lw-tag ${it.t === "법령" ? "law" : "adm"}`}>{it.k || it.t}</span>
              </li>
            ))}
          </ol>
        </details>
      ))}

      {guides.length > 0 && (
        <details className="pp-sec lw-sec" open={!!k}>
          <summary>
            <h4>
              위험물 업무지침(소방청) <span>{guides.length}</span>
            </h4>
          </summary>
          <div className="lw-note">국가법령정보센터에 실려 있지 않은 소방청 내부 업무지침이라 링크가 없습니다. 개정일자는 2026년 하반기 위험물담당공무원 교육 교재 기준입니다.</div>
          <ol>
            {guides.map((it) => (
              <li key={it.n}>
                <span className="lw-plain">{it.n}</span> <span className="lw-date">{it.d}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      <div className="pp-foot">
        링크 확인 {LAW_CHECKED}(국가법령정보센터 한글주소). 「행정규칙」에는 고시·훈령·예규·공고가 포함됩니다. 원문 화면이 「해당 한글주소명을 찾을 수
        없습니다」로 나오면 법령명이 바뀐 것이니 「오류 신고」로 알려 주세요.
      </div>
    </div>
  );
}

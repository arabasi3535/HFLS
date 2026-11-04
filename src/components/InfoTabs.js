import { useMemo, useState } from "react";
import { LAW_SYSTEMS, AMENDMENTS, SOURCES } from "../law/sources";
import { CRITERIA } from "../law/criteria";
import { FACILITIES, getFacility } from "../law/facilities";
import { RETRO_RULES, STRENGTHENED } from "../law/retro";

const fd = (d) => (d && d !== "9999-12-31" ? d.replace(/-/g, ".") + "." : "현재");
const win = (c) => {
  const a = c.from ? fd(c.from) : `${fd(c.fromU[0])}~${fd(c.fromU[1])} 사이`;
  const b = c.to ? fd(c.to) : `${fd(c.toU[0])}~${fd(c.toU[1])} 사이`;
  return `${a} → ${b}`;
};

export function HistoryTab() {
  return (
    <div className="info">
      <div className="card">
        <div className="card-t">법령 체계 변천</div>
        <div className="sys-list">
          {LAW_SYSTEMS.map((s) => (
            <div key={s.id} className={`sys ${s.supported ? "" : "unsup"}`}>
              <div className="sys-h">
                <b>{s.label}</b>
                <span className="muted">
                  {fd(s.from)} ~ {fd(s.to)}
                </span>
              </div>
              <div className="small">{s.act}</div>
              <div className="small muted">
                {s.table} · {s.std}
              </div>
              <div className="small">{s.note}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-t">시행령 개정 연혁 — 소방시설 설치기준 관련 (법제처 제·개정이유 기준)</div>
        <div className="table-wrap">
          <table className="review">
            <thead>
              <tr>
                <th>시행일</th>
                <th>대통령령</th>
                <th>구분</th>
                <th>주요 내용</th>
                <th>검증</th>
              </tr>
            </thead>
            <tbody>
              {[...AMENDMENTS].sort((p, q) => (p.eff < q.eff ? -1 : p.eff > q.eff ? 1 : 0)).map((a, i) => (
                <tr key={i}>
                  <td className="nowrap">{fd(a.eff)}</td>
                  <td className="nowrap">{a.no}</td>
                  <td className="nowrap small">{a.kind}</td>
                  <td className="small">{a.text}</td>
                  <td>
                    <span className={`cert ${a.cert === "V" ? "cert-v" : a.cert === "M" ? "cert-m" : "cert-i"}`}>
                      {a.cert === "V" ? "확인" : a.cert === "M" ? "연혁자료" : "추정"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="muted small">
          출처: <a href={SOURCES.reasons.url} target="_blank" rel="noreferrer">{SOURCES.reasons.title}</a>
        </div>
      </div>
      <div className="card">
        <div className="card-t">소급·특례 규정</div>
        <ul className="plain">
          {RETRO_RULES.map((r) => (
            <li key={r.id}>
              <b>{r.title}</b> — 기한 {fd(r.deadline)} · {r.basis}
            </li>
          ))}
          <li>
            <b>강화기준 적용(재량)</b> — {STRENGTHENED.basis}
          </li>
          <li>
            <b>주택용소방시설</b> — 소방시설법 제10조(구 법 제8조, 2012.2.5. 시행), 기존 주택 5년 유예
          </li>
          <li>
            <b>증축·용도변경</b> — 시행령 제15조 (2025.11.25. 개정: 60분 방화문 구획 추가, 2022.12.1. 이후 증축 신청분 소급)
          </li>
        </ul>
      </div>
    </div>
  );
}

export function RulesTab({ adminMode, overrides, setOverrides }) {
  const [fac, setFac] = useState("");
  const [q, setQ] = useState("");
  const list = useMemo(
    () =>
      CRITERIA.filter((c) => (!fac || c.fac === fac) && (!q || (c.text + c.id).includes(q))),
    [fac, q]
  );
  const counts = useMemo(() => {
    const m = { V: 0, M: 0, I: 0, U: 0 };
    CRITERIA.forEach((c) => (m[(overrides[c.id] && overrides[c.id].cert) || c.cert] += 1));
    return m;
  }, [overrides]);

  const setOv = (id, patch) => {
    setOverrides((o) => {
      const next = { ...o, [id]: { ...(o[id] || {}), ...patch } };
      const v = next[id];
      if (!v.cert && !v.note && !v.disabled) delete next[id];
      return next;
    });
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "hfls_overrides.json";
    a.click();
  };
  const importJSON = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    file.text().then((t) => {
      try {
        const obj = JSON.parse(t);
        if (obj && typeof obj === "object") setOverrides(obj);
      } catch (err) {
        alert("JSON 형식 오류");
      }
    });
  };

  return (
    <div className="info">
      <div className="card">
        <div className="card-t">판정 규칙 데이터 ({CRITERIA.length}건) · 검증현황</div>
        <div className="small">
          <span className="cert cert-v">원문확인 {counts.V}</span> <span className="cert cert-m">연혁자료확인 {counts.M}</span>{" "}
          <span className="cert cert-i">시점추정 {counts.I}</span>{" "}
          <span className="cert cert-u">미검증 {counts.U}</span>
          <span className="muted"> — 추정·미검증 규칙은 소방청 「소방시설 설치기준 개정연혁 법령집」 및 국가법령정보센터 연혁본으로 대조해 갱신하십시오.</span>
        </div>
        <div className="filters">
          <select value={fac} onChange={(e) => setFac(e.target.value)}>
            <option value="">전체 시설</option>
            {FACILITIES.map((f) => (
              <option key={f.key} value={f.key}>
                {f.name}
              </option>
            ))}
          </select>
          <input placeholder="검색(기준 문구·ID)" value={q} onChange={(e) => setQ(e.target.value)} />
          {adminMode && (
            <>
              <button className="btn small" onClick={exportJSON}>
                검증메모 내보내기
              </button>
              <label className="btn small">
                가져오기
                <input type="file" accept="application/json" onChange={importJSON} hidden />
              </label>
            </>
          )}
        </div>
        <div className="table-wrap">
          <table className="review">
            <thead>
              <tr>
                <th>시설</th>
                <th>기준</th>
                <th>효력 구간(기준일)</th>
                <th>검증</th>
                {adminMode && <th>관리</th>}
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const ov = overrides[c.id] || {};
                const cert = ov.cert || c.cert;
                return (
                  <tr key={c.id} className={ov.disabled ? "disabled" : ""}>
                    <td className="nowrap small">{getFacility(c.fac).name}</td>
                    <td className="small">
                      {c.text}
                      <div className="muted">
                        <code className="cid">{c.id}</code> {c.cur && `현행 ${getFacility(c.fac).cur} ${c.cur}`}
                      </div>
                      {ov.note && <div className="crit-note">메모: {ov.note}</div>}
                    </td>
                    <td className="small nowrap">{win(c)}</td>
                    <td>
                      <span className={`cert ${cert === "V" ? "cert-v" : cert === "M" ? "cert-m" : cert === "I" ? "cert-i" : "cert-u"}`}>
                        {cert === "V" ? "원문확인" : cert === "M" ? "연혁자료확인" : cert === "I" ? "시점추정" : "미검증"}
                      </span>
                    </td>
                    {adminMode && (
                      <td className="admin-cell">
                        <select value={ov.cert || ""} onChange={(e) => setOv(c.id, { cert: e.target.value || undefined })}>
                          <option value="">기본</option>
                          <option value="V">원문확인</option>
                          <option value="M">연혁자료확인</option>
                          <option value="I">시점추정</option>
                          <option value="U">미검증</option>
                        </select>
                        <label className="check small">
                          <input type="checkbox" checked={!!ov.disabled} onChange={(e) => setOv(c.id, { disabled: e.target.checked || undefined })} />
                          <span>비활성</span>
                        </label>
                        <input placeholder="검증 메모" defaultValue={ov.note || ""} onBlur={(e) => setOv(c.id, { note: e.target.value || undefined })} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-t">원문 출처</div>
        <ul className="plain">
          {Object.entries(SOURCES).map(([k, s]) => (
            <li key={k}>
              <code className="cid">[{k}]</code>{" "}
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function GuideTab() {
  return (
    <div className="info">
      <div className="card prose">
        <div className="card-t">판정 원칙</div>
        <ol>
          <li>
            <b>기준일</b>: 건축허가등(신축·증축·개축·재축·이전·용도변경·대수선)의 <b>허가·협의 신청일 또는 신고일</b>. 현행 시행령 부칙(대통령령 제33004호 부칙 제2조 등)은 "허가·협의를 신청하거나 신고하는 경우부터 적용"으로 규정합니다. 사용승인일이 아닙니다. 터널 연결송수관 500m 기준은 <b>설계용역 입찰공고일</b>.
          </li>
          <li>
            <b>종전 기준 유지</b>: 기준이 강화되어도 기존 대상물에는 변경 전 기준을 적용(법 제13조제1항 본문).
          </li>
          <li>
            <b>강화기준 적용(재량)</b>: 소화기구·비상경보·자동화재탐지·자동화재속보·피난구조설비, 공동구·전력통신 지하구, 노유자시설(간이스프링클러·자탐·단독경보형), 의료시설(스프링클러·간이스프링클러·자탐·속보)은 강화된 기준을 <b>적용할 수 있음</b>(법 제13조제1항 단서, 시행령 제13조).
          </li>
          <li>
            <b>부칙 소급(의무)</b>: 노유자 생활시설(2012), 기존 병원(2019 → 기한 2026.12.31.), 공동구(2020) 등 부칙이 기존 대상물에 기한을 정해 설치를 명한 경우.
          </li>
          <li>
            <b>증축·용도변경</b>: 시행령 제15조에 따라 적용 기준일을 전체/부분으로 분리.
          </li>
          <li>
            <b>면제</b>: 별표5(유사 소방시설 면제)는 '면제 검토' 안내만 하고 자동으로 제외하지 않습니다. 별표6(설치 제외)은 판정하지 않습니다.
          </li>
        </ol>
        <div className="card-t">검증 등급</div>
        <ul>
          <li>
            <span className="cert cert-v">원문확인</span> 별표 원문(2004 초기본·2020.12.10.·2025.11.25.), 부칙, 법제처 제·개정이유로 확인한 기준·시점
          </li>
          <li>
            <span className="cert cert-m">연혁자료확인</span> 소방특별조사 운영매뉴얼 「소방시설의 연도별 적용기준」(1968~2015) 및 한국소방시설관리협회 「소방시설 설치기준 개정연혁」(2024.11.)으로 확인한 기준·시점
          </li>
          <li>
            <span className="cert cert-i">시점추정</span> 기준 내용은 원문에 있으나 도입·폐지 시점을 개정이유 대조로 추정 — 연혁본 대조 권장
          </li>
          <li>
            <span className="cert cert-u">미검증</span> 연혁본 확인 전 — 결과는 '설치(연혁 확인)'으로 하향 표시
          </li>
        </ul>
        <div className="card-t">한계</div>
        <ul>
          <li>1992.7.28.~2004.5.29.(소방법 시대)은 운영매뉴얼 연도별 적용기준으로 판정(당시 용도분류는 근사 대응). 1992.7.28. 이전은 미수록 — 참고값만 표시.</li>
          <li>복합건축물은 구성 용도별로 각각 조회 후 별표4 비고1(근린생활시설등 기준이 더 강하면 그 부분에 그 기준) 적용.</li>
          <li>다중이용업소(다중이용업소법), 위험물(위험물안전관리법), 초고층·지하연계 복합건축물(초고층재난관리법) 별도 기준은 미포함.</li>
          <li>본 결과는 업무 참고자료이며 법적 효력이 없습니다. 최종 판단은 국가법령정보센터 연혁본·부칙과 소방청 질의회신으로 확인하십시오.</li>
        </ul>
      </div>
    </div>
  );
}

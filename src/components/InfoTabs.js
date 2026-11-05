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

export function GuideTab({ adminMode }) {
  return (
    <div className="info guide">
      <div className="card prose">
        <div className="card-t">신축 건축물</div>
        <ol>
          <li>
            <b>대상물 분류</b> — 시행령 별표2 대분류를 고릅니다(필요하면 세부 용도 선택).
          </li>
          <li>
            <b>규모</b> — 층수·연면적·층별 바닥면적·무창층. 층별 면적을 넣을수록 층 단위 기준이 정확해집니다.
          </li>
          <li>
            <b>세부 사항</b> — 그 용도에 필요한 항목(수용인원·무대부·입원실 등)만 나타납니다.
          </li>
          <li>
            <b>결과</b> — 별표4 순서(소화설비 → 소화활동설비)로 설치 대상을 보여 주고, 별표5 면제(대체)를 선택할 수 있습니다. 예: 지하주차장 물분무등 → 스프링클러설비.
          </li>
        </ol>

        <div className="card-t">기존 건축물</div>
        <ol>
          <li>
            <b>건축허가일</b> — 건축물대장의 최초 건축허가(설계허가)일. 그 날짜에 시행 중이던 시행령 별표를 적용합니다(허가등 신청일 기준).
          </li>
          <li>이후 과정은 신축과 같습니다. 노유자시설·연립·다세대주택처럼 당시 분류가 지금과 다른 경우 안내가 함께 표시됩니다.</li>
          <li>
            <b>부칙 소급</b> — 개정 시행령 부칙이 기존 대상물에도 기한을 정해 설치를 명한 시설은 <span className="tag t-retro">소급</span>으로 구분해 표시합니다(기본 반영, 해제 가능).
            <br />
            예: 노유자 생활시설(2012.2.5.) 간이스프링클러·자동화재탐지·자동화재속보설비, 요양병원(2015.7.1.) 스프링클러·간이스프링클러·자탐·속보, 병원(2019.8.6.) 스프링클러·간이스프링클러·속보.
          </li>
          <li>
            <b>강화기준</b> — 소화기구·경보·피난구조설비 등은 현행 기준을 적용할 수 있습니다(재량). 필요할 때 선택하면 <span className="tag t-strong">강화기준</span>으로 표시됩니다.
          </li>
          <li>부칙 소급이 없는 개정은 종전 기준을 그대로 유지합니다(소방시설법 제13조제1항).</li>
        </ol>

        <div className="card-t">표시</div>
        <ul>
          <li>
            <b>연혁 확인</b> — 기준은 해당하지만 시행 시점·문구를 연혁본으로 한 번 더 확인할 항목.
          </li>
          <li>
            <b>확인 필요</b> — 입력 정보가 부족해 판정하지 못한 항목. 해당 칸을 채우면 다시 판정됩니다.
          </li>
          <li>각 시설을 누르면 기준 문구·대상물 수치·근거 조문이 펼쳐지며, PDF로 저장하면 모든 설명이 함께 인쇄됩니다.</li>
        </ul>

        <div className="card-t">유의</div>
        <ul>
          <li>증축·용도변경(시행령 제15조)은 별도로 판단하십시오: 용도변경은 변경 부분에 변경 당시 기준, 증축은 전체에 증축 당시 기준(60분+·60분 방화문 등으로 구획하면 증축 부분만).</li>
          <li>다중이용업소·위험물·초고층 등 개별 법령 기준과 설비 수량 산정은 포함하지 않습니다.</li>
          <li>업무 참고용이며 법적 효력이 없습니다. 최종 판단은 국가법령정보센터 연혁본·부칙과 소방청 질의회신으로 확인하십시오.</li>
        </ul>
      </div>

      {adminMode && (
        <div className="card prose">
          <div className="card-t">판정 원칙 (관리자)</div>
          <ol>
            <li>
              <b>기준일</b>: 건축허가등(신축·증축·개축·재축·이전·용도변경·대수선)의 <b>허가·협의 신청일 또는 신고일</b>. 현행 시행령 부칙(대통령령 제33004호 부칙 제2조 등)은 "허가·협의를 신청하거나 신고하는 경우부터 적용"으로 규정합니다. 터널 연결송수관 500m 기준은 <b>설계용역 입찰공고일</b>.
            </li>
            <li>
              <b>부칙 소급 시설</b>: 부칙은 「개정규정에 따라」 설치하도록 하므로 부칙 시행일 기준으로 판정해 실제 시설을 정합니다(예: 요양병원 600㎡ 이상 스프링클러, 미만 간이스프링클러). 사용승인일이 부칙 시행일 이후면 소급 대상이 아닙니다.
            </li>
            <li>
              <b>강화기준(재량)</b>: 법 제13조제1항 단서·시행령 제13조 — 소화기구·비상경보·자탐·속보·피난구조설비, 공동구·전력통신 지하구, 노유자시설(간이SPK·자탐·단독경보형), 의료시설(SPK·간이SPK·자탐·속보).
            </li>
            <li>
              <b>면제(별표5)</b>: 현행 별표5로 대체 후보를 제시합니다. 기본 선택: 간이SPK←SPK, 주차장 물분무등←SPK, 비상경보·단독경보형←자탐, 연결살수←SPK, 연소방지←SPK. 기존 건축물은 당시 별표(면제 규정) 문구를 함께 확인.
            </li>
            <li>증축·용도변경 판정 로직은 엔진(review)에 남아 있으나 화면에서는 제외했습니다.</li>
          </ol>
          <div className="card-t">검증 등급</div>
          <ul>
            <li>
              <span className="cert cert-v">원문확인</span> 별표 원문(2004 초기본·2020.12.10.·2025.11.25.), 부칙, 법제처 제·개정이유로 확인
            </li>
            <li>
              <span className="cert cert-m">연혁자료확인</span> 소방특별조사 운영매뉴얼 「소방시설의 연도별 적용기준」, 소방시설 법령집(2024) 연혁·질의회신으로 확인
            </li>
            <li>
              <span className="cert cert-i">시점추정</span> 도입·폐지 시점 추정 → 결과 '설치(연혁 확인)'
            </li>
            <li>
              <span className="cert cert-u">미검증</span> 연혁본 확인 전 → 결과 '설치(연혁 확인)'
            </li>
          </ul>
          <div className="card-t">한계</div>
          <ul>
            <li>1992.7.28.~2004.5.29.(소방법 시기)은 운영매뉴얼 연도별 적용기준으로 판정(당시 용도분류는 근사 대응). 1992.7.28. 이전은 참고값.</li>
            <li>복합건축물은 구성 용도별로 각각 조회 후 별표4 비고 적용.</li>
            <li>별표6 설치 제외, 설비 수량 산정은 하지 않습니다.</li>
          </ul>
        </div>
      )}
    </div>
  );
}

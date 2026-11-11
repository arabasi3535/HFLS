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

const GUIDE = [
  {
    tab: "신축 건축물",
    what: "용도·규모·층별 면적을 입력하면 현행 시행령 별표4로 설치할 소방시설을 산정합니다.",
    out: [
      "소방시설 적용 검토서(별표4 순서, 근거 조문·별표5 면제 포함) — PDF 저장·인쇄",
      "안전관리 검토: 소방안전관리대상물 등급, 자체점검(종합·작동, 시기), 방염 대상, 소방자동차 전용구역",
      "소방공사 착공·감리 판정: 착공신고, 소방기술자 등급·분야, 감리 종류(상주·일반), 책임·보조감리원 등급",
      "입력 내용 엑셀로 받기·빈 서식 받기 — 컴퓨터에서 엑셀로 작성해 「불러오기」로 올림",
    ],
  },
  {
    tab: "기존 건축물",
    what: "건축허가일을 입력하면 그날 시행 중이던 기준으로 산정하고, 부칙 소급·강화기준과 현행 기준을 비교합니다.",
    out: ["허가일 기준 소방시설 검토서(소급 시설·강화기준 구분 표시) — PDF 저장·인쇄", "안전관리 검토와 자체점검 보고서 바로 작성", "입력 내용 엑셀로 받기·빈 서식 받기·불러오기"],
  },
  {
    tab: "보조 계산기",
    what: "검토에 필요한 계산을 따로 합니다.",
    out: [
      "무창층 판정 — 층별 개구부 면적 ÷ 바닥면적(1/30 이하)",
      "수용인원 산정 — 시행령 별표7",
      "소방공사 착공·감리 판정 — 신축 결과에서 넘겨받아 세부 조정",
      "위험물 지정수량 배수 판정 — CAS·물질명 검색, 자주 쓰는 제4류 빠른 선택, 인화점 판정, 팔레트 적재 수량 계산",
      "학원 다중이용업소 판단 — 층별 업소·층간/영업장별 방화구획으로 학원마다 해당 여부(수용인원 산정과 연계)",
      "소화펌프 용량 산정 — 양정·토출량·전동기 출력·수원",
    ],
  },
  {
    tab: "자체점검",
    what: "작동점검(관계인)·작동점검(관리업)·종합점검(최초점검)·종합점검(그 밖) 보고서를 작성합니다.",
    out: [
      "[별지 제9호서식] 소방시설등 자체점검 실시결과 보고서 — 불량이 있으면 [별지 제10호서식] 이행계획서 포함, PDF·인쇄",
      "불량 항목은 고시 점검표의 점검번호·항목에서 골라 자동 기재(종합점검은 ● 항목 포함)",
      "관리업·종합점검: 점검인력 배치기준 확인과 필요 점검일수(시행규칙 별표4)",
      "입력 내용 파일 저장·불러오기 — 다음 해에 날짜만 고쳐 다시 사용",
      "빈 서식(엑셀) 받기 — 컴퓨터에서 대상물 정보·불량 항목을 적어 올리면 보고서가 채워짐",
    ],
  },
  {
    tab: "위험물 정기점검",
    what: "제조소등 일반점검표(주유취급소·이동탱크저장소·일반취급소·지하탱크저장소 등 10종)와 소화·경보설비 일반점검표(7종), 위험물안전카드를 작성합니다.",
    out: [
      "「위험물안전관리에 관한 세부기준」 [별지 제9~24호서식] 일반점검표 — PDF·인쇄",
      "기본은 적합, 시설 형태(셀프 주유·현수식·이중벽·컨테이너식·부상지붕·설비 유무·가압송수장치 등)와 한국소방안전원 교재 작성예시에 따라 해당없음 자동 표시",
      "위험물 현황의 품명·허가량으로 지정수량 배수 자동 계산",
      "시행규칙 [별지 제48호서식] 위험물안전카드 — 물질 목록에서 불러오기",
      "입력 내용 파일 저장·불러오기, 빈 서식(엑셀) 받기 — 엑셀에서 형태를 고르면 기본 결과(적합·해당없음)가 따라 바뀜",
    ],
  },
  {
    tab: "영상 자료",
    what: "소방시설 법령 적용·기준을 정리한 YouTube 영상을 앱 안에서 바로 봅니다.",
    out: ["주제별(법령 적용·용도별 기준·유지관리·설계·계산) 영상 목록", "영상과 관련된 앱 화면으로 바로 이동"],
  },
  {
    tab: "다중이용업 세부점검",
    what: "다중이용업주가 분기마다 하는 안전시설등 점검을 「안전시설등 세부점검표」로 작성합니다.",
    out: [
      "다중이용업소법 시행규칙 [별지 제10호서식] 안전시설등 세부점검표 — PDF·인쇄",
      "점검사항 15개를 항목마다 양호·불량·해당없음으로 직접 선택, 불량은 조치사항 기재",
      "입력 내용 파일 저장·불러오기(다음 분기 재사용), 빈 서식(엑셀) 받기",
    ],
  },
];

export function GuideTab({ adminMode }) {
  return (
    <div className="info guide">
      <div className="card prose">
        <div className="card-t">이 시스템으로 할 수 있는 일</div>
        <p className="small">
          건축허가일·용도·규모로 <b>설치해야 할 소방시설</b>을 법령 연혁에 맞게 판정하고, 그 결과를 <b>안전관리 검토 → 착공·감리 판정 → 자체점검</b>로 이어서 씁니다.
        </p>
        <div className="table-wrap">
          <table className="review guide-t">
            <thead>
              <tr>
                <th>탭</th>
                <th>하는 일</th>
                <th>얻는 결과물</th>
              </tr>
            </thead>
            <tbody>
              {GUIDE.map((g) => (
                <tr key={g.tab}>
                  <td className="nowrap">
                    <b>{g.tab}</b>
                  </td>
                  <td className="small">{g.what}</td>
                  <td className="small">
                    <ul className="plain">
                      {g.out.map((o) => (
                        <li key={o}>{o}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-t">사용 순서</div>
        <ol>
          <li>
            <b>신축</b> 또는 <b>기존 건축물</b>(건축허가일 입력)을 고르고 대상물 분류 → 규모 → 세부 사항을 차례로 입력합니다.
          </li>
          <li>결과에서 설치 시설과 안전관리 검토를 확인하고, 각 시설을 눌러 근거 조문을 봅니다. 「PDF 저장」으로 검토서를 받습니다.</li>
          <li>
            이어서 쓸 결과물은 결과 화면 버튼으로 넘깁니다 — 「소방공사 착공·감리 판정 → 자세히 보기·조정」(신축), 「관계인 작동점검 / 작동점검(관리업) / 종합점검 보고서 작성」(안전관리 검토 → 자체점검). 용도·면적·층수·설치 시설이 자동으로 채워집니다.
          </li>
          <li>보고서는 빈칸만 채우고 불량 설비만 고른 뒤 PDF로 받아 서명·날인합니다.</li>
        </ol>

        <div className="card-t">표시 읽는 법</div>
        <ul>
          <li>
            <span className="tag t-retro">소급</span> 부칙으로 기존 대상물에도 설치를 명한 시설 · <span className="tag t-strong">강화기준</span> 현행 기준을 선택 적용한 시설(재량)
          </li>
          <li>
            <b>연혁 확인</b> 시행 시점·문구를 연혁본으로 한 번 더 볼 항목 · <b>확인 필요</b> 입력이 부족해 판정하지 못한 항목(빈칸을 채우면 다시 판정)
          </li>
        </ul>

        <div className="card-t">유의</div>
        <ul>
          <li>증축·용도변경(시행령 제15조), 다중이용업소·초고층 등 개별 법령 기준, 설비 수량 산정은 포함하지 않습니다.</li>
          <li>입력 내용은 이 기기의 브라우저에만 저장됩니다(서버 전송 없음).</li>
          <li>업무 참고용이며 법적 효력이 없습니다. 최종 판단은 국가법령정보센터 원문·부칙과 소방청 질의회신으로 확인하십시오.</li>
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

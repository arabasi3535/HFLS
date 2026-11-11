import { HZ_SUBS, hzItem } from "../law/hazmat";

// ============================================================
// 위험물안전카드 — 위험물안전관리법 시행규칙 [별지 제48호서식] <개정 2021.7.13.>
// 입력(왼쪽)과 A4 서식(미리보기·PDF)
// ============================================================

// UN 번호는 확인된 것만 자동 입력(그 밖은 직접 입력)
const UN = { gasoline: "1203", diesel: "1202", kerosene: "1223" };
const CHEM = [
  ["toxic", "유독물질"],
  ["accident", "사고대비물질"],
  ["etc", "기타"],
];
const GUN = [
  ["powder", "화약"],
  ["explosive", "폭약"],
];
const FEAT = [
  ["water", "금수성"],
  ["explode", "폭발성"],
  ["flam", "가연성"],
  ["gasN", "유해가스발생 — 상온"],
  ["gasH", "유해가스발생 — 고온"],
  ["gasW", "유해가스발생 — 물과 접촉"],
  ["skin", "눈·피부 접촉시 위험성"],
  ["river", "하천 등 유입 주의"],
];
const STATE = [
  ["solid", "고체"],
  ["liquid", "액체"],
  ["gas", "기체"],
  ["sol", "수용성"],
];
const O = (b) => (b ? "○" : "");

export function CardEditor({ c, set }) {
  const up = (p) => set({ ...c, ...p });
  const tog = (k, key) => up({ [k]: { ...c[k], [key]: !c[k][key] } });
  const fill = (id) => {
    const s = HZ_SUBS.find((x) => x.id === id);
    if (!s) return;
    const it = hzItem(s.item);
    up({
      name1: s.name.replace(/\(.*\)$/, ""),
      name2: (s.alias || []).find((a) => /[가-힣]/.test(a)) || "",
      cas: s.cas || "",
      un: UN[s.id] || c.un,
      cls: { [it.cls]: true },
      item: it.name,
      feat: it.cls === 4 ? { ...c.feat, flam: true } : c.feat,
      state: it.cls === 4 ? { ...c.state, liquid: true } : c.state,
    });
  };
  const F = (label, k, ph) => (
    <label className="w-field">
      <span className="w-label">{label}</span>
      <input value={c[k]} placeholder={ph || ""} onChange={(e) => up({ [k]: e.target.value })} />
    </label>
  );
  const P = (who, label) => (
    <div className="wm-party">
      <b>{label}</b>
      {["name", "addr", "day", "night"].map((k) => (
        <input
          key={k}
          value={c[who][k]}
          placeholder={{ name: label === "화주" ? "화주 명칭" : "운송자 명칭", addr: "주소", day: "전화(주간)", night: "전화(야간)" }[k]}
          onChange={(e) => up({ [who]: { ...c[who], [k]: e.target.value } })}
        />
      ))}
    </div>
  );
  return (
    <div className="wm-card-ed">
      <label className="w-field">
        <span className="w-label">물질 불러오기(선택)</span>
        <select value="" onChange={(e) => fill(e.target.value)}>
          <option value="">— 위험물 지정수량 판정의 물질 목록에서 선택 —</option>
          {HZ_SUBS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.cas ? `(${s.cas})` : ""}
            </option>
          ))}
        </select>
        <span className="w-hint">물질명·CAS·유별·품명을 채웁니다. UN 번호는 휘발유·경유·등유만 자동 입력되니 나머지는 확인해 적으십시오.</span>
      </label>
      <div className="w-grid2">
        {F("물질명(화학명)", "name1")}
        {F("물질명(통칭명 등)", "name2")}
        {F("UN No.", "un")}
        {F("화학물질 식별번호(CAS No.)", "cas")}
      </div>
      <div className="w-hint wm-lookup">
        번호 찾기 — UN No.: <a href="https://hazmat.nfa.go.kr" target="_blank" rel="noopener noreferrer">국가위험물통합정보시스템</a>에서 물질명 검색 · CAS No.:{" "}
        <a href="https://hazmat.nfa.go.kr" target="_blank" rel="noopener noreferrer">국가위험물통합정보시스템</a>,{" "}
        <a href="https://kreach.mcee.go.kr" target="_blank" rel="noopener noreferrer">화학물질정보처리시스템</a>,{" "}
        <a href="https://msds.kosha.or.kr" target="_blank" rel="noopener noreferrer">산업안전보건공단 MSDS</a>
      </div>
      <div className="wm-chk-row">
        <span className="w-label">유별</span>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <label key={n} className="cx-chk">
            <input type="checkbox" checked={!!c.cls[n]} onChange={() => tog("cls", n)} /> 제{n}류
          </label>
        ))}
      </div>
      {F("품명(위험물안전관리법 시행령 별표1)", "item")}
      <div className="wm-chk-row">
        <span className="w-label">화학물질관리법</span>
        {CHEM.map(([k, l]) => (
          <label key={k} className="cx-chk">
            <input type="checkbox" checked={!!c.chem[k]} onChange={() => tog("chem", k)} /> {l}
          </label>
        ))}
        <span className="w-label">총포·화약류법</span>
        {GUN.map(([k, l]) => (
          <label key={k} className="cx-chk">
            <input type="checkbox" checked={!!c.gun[k]} onChange={() => tog("gun", k)} /> {l}
          </label>
        ))}
      </div>
      <div className="wm-chk-row">
        <span className="w-label">특성</span>
        {FEAT.map(([k, l]) => (
          <label key={k} className="cx-chk">
            <input type="checkbox" checked={!!c.feat[k]} onChange={() => tog("feat", k)} /> {l}
          </label>
        ))}
      </div>
      {F("그 밖의 위험성(주의사항 등)", "other")}
      <div className="wm-chk-row">
        <span className="w-label">성질·상태</span>
        {STATE.map(([k, l]) => (
          <label key={k} className="cx-chk">
            <input type="checkbox" checked={!!c.state[k]} onChange={() => tog("state", k)} /> {l}
          </label>
        ))}
      </div>
      <div className="w-field">
        <span className="w-label">사고발생시의 응급조치 요령(누출·화재 시 조치사항, 처리약제 등)</span>
        {c.aid.map((a, i) => (
          <input key={i} value={a} placeholder={`${i + 1}.`} onChange={(e) => up({ aid: c.aid.map((x, j) => (j === i ? e.target.value : x)) })} />
        ))}
      </div>
      <div className="w-grid2">
        {F("긴급신고 — 시군구청 번호", "city")}
        {F("긴급신고 — 한국도로공사 번호", "ex", "해당 지역 전화번호")}
      </div>
      {P("owner", "화주")}
      {P("carrier", "운송자")}
    </div>
  );
}

export function CardDoc({ c }) {
  return (
    <div className="rp-doc" id="rp-doc">
      <div className="rp-page wm-cardp">
        <div className="rp-top">
          <span>■ 위험물안전관리법 시행규칙 [별지 제48호서식] &lt;개정 2021. 7. 13.&gt;</span>
          <span>(앞쪽)</span>
        </div>
        <table className="rp-t wm-card">
          <colgroup>
            {Array.from({ length: 16 }, (_, i) => (
              <col key={i} style={{ width: "6.25%" }} />
            ))}
          </colgroup>
          <tbody>
            <tr>
              <td colSpan={16} className="wm-card-title">
                위험물안전카드
              </td>
            </tr>
            <tr>
              <th rowSpan={2} colSpan={3}>
                물 질 명
              </th>
              <td colSpan={7} className="wm-big">
                {c.name1}
              </td>
              <th colSpan={2}>UN No.</th>
              <td colSpan={4}>{c.un}</td>
            </tr>
            <tr>
              <td colSpan={7}>{c.name2}</td>
              <th colSpan={2}>
                화학물질 식별번호
                <br />
                (CAS No.)
              </th>
              <td colSpan={4}>{c.cas}</td>
            </tr>
            <tr>
              <th colSpan={16}>해당법규 및 위험·유해성</th>
            </tr>
            <tr>
              <th colSpan={9}>위험물안전관리법</th>
              <th colSpan={3}>화학물질관리법</th>
              <th colSpan={4}>총포·도검·화약류등의 안전관리에 관한 법률</th>
            </tr>
            <tr>
              <th colSpan={6}>유 별</th>
              <th rowSpan={2} colSpan={3}>
                품 명
              </th>
              <th rowSpan={2}>유독물질</th>
              <th rowSpan={2}>사고대비물질</th>
              <th rowSpan={2}>기 타</th>
              <th rowSpan={2} colSpan={2}>
                화 약
              </th>
              <th rowSpan={2} colSpan={2}>
                폭 약
              </th>
            </tr>
            <tr>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <th key={n}>제{n}류</th>
              ))}
            </tr>
            <tr className="wm-o">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <td key={n}>{O(c.cls[n])}</td>
              ))}
              <td colSpan={3} className="wm-item-c">
                {c.item}
              </td>
              <td>{O(c.chem.toxic)}</td>
              <td>{O(c.chem.accident)}</td>
              <td>{O(c.chem.etc)}</td>
              <td colSpan={2}>{O(c.gun.powder)}</td>
              <td colSpan={2}>{O(c.gun.explosive)}</td>
            </tr>
            <tr>
              <th rowSpan={3}>특성</th>
              <th colSpan={3}>위험성</th>
              <th colSpan={4}>유해성</th>
              <th colSpan={2}>환경오염성</th>
              <th colSpan={2}>그 밖의 위험성</th>
              <th colSpan={4}>성질·상태</th>
            </tr>
            <tr>
              <th>금수성</th>
              <th>폭발성</th>
              <th>가연성</th>
              <th colSpan={3}>
                유해가스발생
                <div className="wm-sub3">
                  <span>상온</span>
                  <span>고온</span>
                  <span>물과 접촉</span>
                </div>
              </th>
              <th>눈·피부 접촉시 위험성</th>
              <th colSpan={2}>하천 등 유입 주의</th>
              <td colSpan={2} rowSpan={2} className="wm-other">
                {c.other}
              </td>
              <th>고체</th>
              <th>액체</th>
              <th>기체</th>
              <th>수용성</th>
            </tr>
            <tr className="wm-o">
              <td>{O(c.feat.water)}</td>
              <td>{O(c.feat.explode)}</td>
              <td>{O(c.feat.flam)}</td>
              <td>{O(c.feat.gasN)}</td>
              <td>{O(c.feat.gasH)}</td>
              <td>{O(c.feat.gasW)}</td>
              <td>{O(c.feat.skin)}</td>
              <td colSpan={2}>{O(c.feat.river)}</td>
              <td>{O(c.state.solid)}</td>
              <td>{O(c.state.liquid)}</td>
              <td>{O(c.state.gas)}</td>
              <td>{O(c.state.sol)}</td>
            </tr>
            <tr>
              <td colSpan={16} className="wm-aid">
                <div>&lt;사고발생시의 응급조치 요령&gt;</div>
                {c.aid.map((a, i) => (
                  <div key={i}>
                    {i + 1}. {a}
                  </div>
                ))}
              </td>
            </tr>
            <tr>
              <td colSpan={16} className="wm-aid">
                <div>
                  &lt;긴급신고 번호&gt;: 소방서(119), 경찰서(112), 시군구청( {c.city || "　　　　"} ), 한국도로공사 ( {c.ex || "　　　　"} )
                </div>
                <div>&lt;긴급신고 내용&gt;: 사고시각, 사고장소, 물질명, 사고유형, 부상자 유무, 운송자 명칭</div>
              </td>
            </tr>
            <tr>
              <td colSpan={16} className="wm-aid">
                <div>&lt;긴급 연락처&gt;</div>
                <div className="wm-parties">
                  {[
                    ["화 주", c.owner],
                    ["운송자", c.carrier],
                  ].map(([l, p]) => (
                    <table key={l} className="rp-t">
                      <tbody>
                        <tr>
                          <th style={{ width: "26%" }}>{l}</th>
                          <td>{p.name}</td>
                        </tr>
                        <tr>
                          <th>주 소</th>
                          <td>{p.addr}</td>
                        </tr>
                        <tr>
                          <th rowSpan={2}>전 화</th>
                          <td>(주간) {p.day}</td>
                        </tr>
                        <tr>
                          <td>(야간) {p.night}</td>
                        </tr>
                      </tbody>
                    </table>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="rp-paper">210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]</div>
      </div>
    </div>
  );
}

import { ROWS_L, ROWS_R, ROWS_M_L, ROWS_M_R, rowState, mRowState, defects, DEFECT_CATS, stationFor, daysInclusive } from "../law/report";

// ============================================================
// 출력용 서식 — [별지 제9호서식] 소방시설등 자체점검 실시결과 보고서(작동점검, 관계인) + [별지 제10호서식] 이행계획서
// A4(210×297mm) 페이지 단위로 그림 → 인쇄 또는 PDF 저장
// ============================================================

const C = (on) => (on ? "[√]" : "[  ]");
const ymd = (d) => {
  if (!d) return "      년    월    일";
  const [y, m, dd] = d.split("-");
  return `${y}년 ${Number(m)}월 ${Number(dd)}일`;
};
const v = (x, w = 6) => (x === "" || x === null || x === undefined ? " ".repeat(w) : x);

function Page({ no, total, form = "9", children }) {
  return (
    <div className="rp-page">
      <div className="rp-top">
        <span>
          {form === "9" ? "■ 소방시설 설치 및 관리에 관한 법률 시행규칙 [별지 제9호서식] <개정 2025. 12. 1.>" : "■ 소방시설 설치 및 관리에 관한 법률 시행규칙 [별지 제10호서식]"}
        </span>
        {form === "9" && <span>({total}쪽 중 제{no}쪽)</span>}
      </div>
      {children}
      <div className="rp-paper">210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]</div>
    </div>
  );
}

function ResultTable({ rep, left, right, stateOf }) {
  const n = Math.max(left.length, right.length);
  const rows = [];
  const catSpan = (list, i) => {
    const c = list[i] && list[i].cat;
    if (!c) return null;
    if (i > 0 && list[i - 1] && list[i - 1].cat === c) return null;
    let k = i;
    while (k < list.length && list[k].cat === c) k++;
    return { c, span: k - i };
  };
  for (let i = 0; i < n; i++) {
    const L = left[i];
    const R = right[i];
    const lc = catSpan(left, i);
    const rc = catSpan(right, i);
    const ls = L ? stateOf(rep, L) : null;
    const rs = R ? stateOf(rep, R) : null;
    rows.push(
      <tr key={i}>
        {lc ? <td rowSpan={lc.span} className="rp-cat">{lc.c}</td> : !L ? <td /> : null}
        <td className={L && L.sub ? "rp-sub" : ""}>{L ? `${C(ls.on)}${L.label}` : ""}</td>
        <td className="rp-res">{L ? ls.res : ""}</td>
        {rc ? <td rowSpan={rc.span} className="rp-cat">{rc.c}</td> : !R ? <td /> : null}
        <td className={R && R.sub ? "rp-sub" : ""}>{R ? `${C(rs.on)}${R.label}` : ""}</td>
        <td className="rp-res">{R ? rs.res : ""}</td>
      </tr>
    );
  }
  return (
    <table className="rp-t rp-res-t">
      <colgroup>
        <col style={{ width: "9%" }} />
        <col style={{ width: "33%" }} />
        <col style={{ width: "8%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "33%" }} />
        <col style={{ width: "8%" }} />
      </colgroup>
      <thead>
        <tr>
          <th>구분</th>
          <th>해 당 설 비</th>
          <th>점검결과</th>
          <th>구분</th>
          <th>해 당 설 비</th>
          <th>점검결과</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

/** 설치장소 문구 */
function place(rep) {
  const gf = Number(rep.bld.gf) || 0;
  const bf = Number(rep.bld.bf) || 0;
  const dong = rep.detail.dong || rep.name || "";
  const from = bf > 0 ? `[  ]지상/[√]지하(${bf})층` : `[√]지상/[  ]지하(1)층`;
  return `동명(${v(dong, 4)}) [√]전체층/[  ]일부층 ${from} ~ [√]지상/[  ]지하(${gf || " "})층`;
}
const on = (rep, id) => rep.rows[id] && rep.rows[id].on;

function Detail({ rep }) {
  const d = rep.detail;
  const dong = d.dong || rep.name || "";
  const blocks = [];
  if (on(rep, "ext") || on(rep, "auto_res") || on(rep, "auto_com") || on(rep, "auto_cab") || on(rep, "auto_gas")) {
    const e = d.ext;
    const num = (x) => Number(x) || 0;
    const sum = num(e.powder) + num(e.other) + num(e.throw) + num(e.simple) + num(e.spread) + num(e.auto);
    blocks.push(
      <div key="ext" className="rp-blk">
        <div className="rp-bh">3-1. 소화기구, 자동소화장치</div>
        <table className="rp-t rp-c">
          <thead>
            <tr>
              <th rowSpan={2}>구분</th>
              <th colSpan={2}>{C(num(e.powder) + num(e.other) > 0)} 소화기</th>
              <th colSpan={2}>{C(num(e.throw) + num(e.simple) > 0)} 간이소화용구</th>
              <th rowSpan={2}>{C(num(e.spread) > 0)} 자동확산소화기</th>
              <th rowSpan={2}>{C(num(e.auto) > 0)} 자동소화장치</th>
              <th rowSpan={2}>비 고</th>
            </tr>
            <tr>
              <th>{C(num(e.powder) > 0)} 분말</th>
              <th>{C(num(e.other) > 0)} 기타</th>
              <th>{C(num(e.throw) > 0)} 투척용</th>
              <th>{C(num(e.simple) > 0)} 기타</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>합계</td>
              <td>{e.powder}</td>
              <td>{e.other}</td>
              <td>{e.throw}</td>
              <td>{e.simple}</td>
              <td>{e.spread}</td>
              <td>{e.auto}</td>
              <td>{sum ? `${sum}개` : ""}</td>
            </tr>
            <tr>
              <td>{v(dong, 4)}</td>
              <td>{e.powder}</td>
              <td>{e.other}</td>
              <td>{e.throw}</td>
              <td>{e.simple}</td>
              <td>{e.spread}</td>
              <td>{e.auto}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  const lines = [];
  if (on(rep, "sspk"))
    lines.push(["간이스프링클러설비", [`◦ 종류: ${C(d.sspk.kind === "펌프")}펌프 ${C(d.sspk.kind === "캐비닛")}캐비닛 ${C(d.sspk.kind === "상수도")}상수도`, `◦ 설치장소: ${place(rep)}`]]);
  if (on(rep, "single")) lines.push(["단독경보형감지기", [`◦ 설치장소: ${place(rep)}`, `◦ 주전원 ${C(d.single.power === "상용전원")}상용전원 ${C(d.single.power === "건전지")}건전지`]]);
  if (on(rep, "alarm"))
    lines.push([
      "비상경보설비",
      [
        `${C(d.alarm.kind === "비상벨설비")}비상벨설비 ${C(d.alarm.kind === "자동식사이렌설비")}자동식사이렌설비`,
        `◦ 설치장소: ${place(rep)}`,
        `◦ 조작장치 설치장소: 동명(${v(dong, 4)}) [√]지상/[  ]지하 (${v(d.alarm.floor, 2)})층 실명(${v(d.alarm.room, 6)})`,
      ],
    ]);
  if (on(rep, "afd"))
    lines.push([
      "자동화재탐지설비",
      [
        `◦ 수신기 위치: 동명(${v(dong, 4)}) [√]지상/[  ]지하 (${v(d.afd.floor, 2)})층 실명(${v(d.afd.room, 6)})`,
        `◦ 경보방식 ${C(d.afd.alarm === "전층경보")}전층경보 ${C(d.afd.alarm === "우선경보")}우선경보, 시각경보기 ${C(d.afd.visual)}유 ${C(!d.afd.visual)}무`,
        `◦ 설치장소: ${place(rep)}`,
        `◦ 감지기종류 ${C(d.afd.heat)}열 ${C(d.afd.smoke)}연기 [  ]그 밖의 것([  ]불꽃 [  ]아날로그식 [  ]복합형)`,
      ],
    ]);
  if (on(rep, "report")) lines.push(["자동화재속보설비", [`◦ 속보기 설치장소: 동명(${v(dong, 4)}) [√]지상/[  ]지하 (${v(d.report.floor, 2)})층, 실명(${v(d.report.room, 6)})`]]);
  if (on(rep, "esc_a") || on(rep, "esc_b") || on(rep, "esc_c")) {
    const k = d.escape.kind;
    const opts = ["피난사다리", "완강기", "다수인피난장비", "승강식피난기", "미끄럼대", "피난교", "피난용트랩", "구조대", "간이완강기", "공기안전매트"];
    lines.push(["피난기구", [`◦ 종류: ${opts.map((o) => `${C(k === o)}${o}`).join(" ")}`, `◦ 설치장소: ${place(rep)}`]]);
  }
  if (on(rep, "guide") || on(rep, "sign") || on(rep, "line"))
    lines.push([
      "유도등",
      [
        `◦ 종류: ${C(on(rep, "guide") && d.guide.exit)}피난구 ${C(on(rep, "guide") && d.guide.path)}통로 ${C(on(rep, "guide") && d.guide.seat)}객석유도등 ${C(on(rep, "sign"))}유도표지 ${C(on(rep, "line"))}피난유도선`,
        `◦ 설치장소: ${place(rep)}`,
      ],
    ]);
  if (on(rep, "elight"))
    lines.push(["비상조명등", [`◦ 설치장소: ${place(rep)}`, `◦ 비상전원 ${C(d.elight.power === "자가발전설비")}자가발전설비 ${C(d.elight.power === "축전지설비")}축전지설비 ${C(d.elight.power === "내장형")}내장형`]]);
  if (on(rep, "plight"))
    lines.push(["휴대용비상조명등", [`◦ 설치장소: ${place(rep)}`, `◦ 전원 ${C(d.plight.power === "건전지식")}건전지식 ${C(d.plight.power === "충전식 배터리식")}충전식 배터리식`]]);
  const others = [...ROWS_L, ...ROWS_R].filter((r) => !r.group && on(rep, r.id) && !["ext", "auto_res", "auto_com", "auto_cab", "auto_gas", "sspk", "single", "alarm", "afd", "report", "esc_a", "esc_b", "esc_c", "guide", "sign", "line", "elight", "plight", "door", "exit", "flame"].includes(r.id));
  for (const r of others) lines.push([r.label, [`◦ 설치장소: ${place(rep)}`]]);
  if (lines.length)
    blocks.push(
      <div key="lines" className="rp-blk">
        <table className="rp-t rp-detail">
          <colgroup>
            <col style={{ width: "18%" }} />
            <col />
          </colgroup>
          <tbody>
            {lines.map(([h, ls]) => (
              <tr key={h}>
                <td className="rp-cat">[√] {h}</td>
                <td>
                  {ls.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <>
      <div className="rp-h2">3. 소방시설등의 세부 현황</div>
      {blocks}
      <div className="rp-note">
        비고 1. 해당 특정소방대상물에 설치된 소방시설에 대하여만 작성(설치되지 않은 소방시설의 기입란은 삭제, 서식 작성방법). 2. [ ]에는 해당 시설에 √ 표를 하고, 세부 현황 및 설치된 수량을 기입합니다.
      </div>
    </>
  );
}

export default function ReportForm({ rep }) {
  const st = stationFor(rep.addr, rep.station) || "○○ 소방서장";
  const days = daysInclusive(rep.from, rep.to);
  const defs = defects(rep);
  const hasMulti = Object.values(rep.multi || {}).some((x) => Number(x) > 0);
  const MULTI = [
    "휴게음식점영업", "제과점영업", "일반음식점영업", "단란주점영업", "유흥주점영업", "영화상영관", "비디오물감상실업", "비디오물소극장업", "복합영상물제공업", "학원", "독서실", "목욕장업",
    "찜질방업", "게임제공업", "인터넷컴퓨터게임시설제공업", "복합유통게임제공업", "노래연습장업", "산후조리업", "고시원업", "권총사격장", "가상체험 체육시설업", "안마시술소", "전화방업",
    "화상대화방업", "수면방업", "콜라텍업",
  ];
  const total = 5;
  const b = rep.bld;
  return (
    <div className="rp-doc" id="rp-doc">
      {/* 제1쪽 */}
      <Page no={1} total={total}>
        <div className="rp-titlebox">
          <div className="rp-kind">[√] 작동점검, [  ] 종합점검([  ]최초점검, [  ]그 밖의 종합점검)</div>
          <div className="rp-title">소방시설등 자체점검 실시결과 보고서</div>
        </div>
        <div className="rp-small">※ [ ]에는 해당되는 곳에 √표를 합니다.</div>
        <table className="rp-t">
          <colgroup>
            <col style={{ width: "14%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "16%" }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th rowSpan={2}>특정소방대상물</th>
              <th>명칭(상호)</th>
              <td>{rep.name}</td>
              <th>대상물 구분(용도)</th>
              <td>{rep.useLabel}</td>
            </tr>
            <tr>
              <th>소재지</th>
              <td colSpan={3}>{rep.addr}</td>
            </tr>
            <tr>
              <th>점검기간</th>
              <td colSpan={4}>
                {ymd(rep.from)} ~ {ymd(rep.to)} ( 총 점검일수: {days} 일 )
              </td>
            </tr>
            <tr>
              <th rowSpan={4}>점검자</th>
              <td colSpan={4}>
                [√]관계인 (성명: {rep.owner.name}, 전화번호: {rep.owner.tel})
              </td>
            </tr>
            <tr>
              <td colSpan={4}>[  ]소방안전관리자 (성명:{v("", 10)}, 전화번호:{v("", 14)})</td>
            </tr>
            <tr>
              <td colSpan={4}>[  ]소방시설관리업자 (업체명:{v("", 10)}, 전화번호:{v("", 14)})</td>
            </tr>
            <tr>
              <td colSpan={4} className="rp-email">
                <div>전자우편 송달 동의 — 「행정절차법」 제14조에 따라 정보통신망을 이용한 문서 송달에 동의합니다.</div>
                <div>
                  {C(rep.email.agree)} 동의함 {C(!rep.email.agree)} 동의하지 않음 &nbsp;&nbsp; 관계인 {rep.owner.name} (서명 또는 인)
                </div>
                <div>전자우편 주소: {rep.email.agree ? rep.email.addr : ""}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <table className="rp-t rp-c">
          <colgroup>
            <col style={{ width: "14%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "16%" }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th rowSpan={7}>점검인력</th>
              <th>구분</th>
              <th>성명</th>
              <th>자격구분</th>
              <th>자격번호</th>
              <th>점검참여일(기간)</th>
            </tr>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const p = rep.inspectors[i];
              return (
                <tr key={i}>
                  <td>{i === 0 ? "주된 점검인력" : "보조 점검인력"}</td>
                  <td>{p ? p.name : ""}</td>
                  <td>{p ? p.qual : ""}</td>
                  <td>{p ? p.no : ""}</td>
                  <td>{p ? p.days || `${rep.from.slice(5).replace("-", ".")}~${rep.to.slice(5).replace("-", ".")}` : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="rp-decl">
          「소방시설 설치 및 관리에 관한 법률」 제23조제3항 및 같은 법 시행규칙 제23조제1항 및 제2항에 따라 위와 같이 소방시설등 자체점검 실시결과 보고서를 제출합니다.
        </div>
        <div className="rp-date">{ymd(rep.reportDate)}</div>
        <div className="rp-sign">
          소방시설관리업자ㆍ소방안전관리자ㆍ<b>관계인</b>: {rep.owner.name} &nbsp;&nbsp;(서명 또는 인)
        </div>
        <div className="rp-to">{st} 귀하</div>
        <table className="rp-t rp-att">
          <colgroup>
            <col style={{ width: "28%" }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>구분</th>
              <th>첨부서류</th>
            </tr>
            <tr>
              <td>소방시설관리업자 또는 소방안전관리자가 관계인에게 제출</td>
              <td>소방청장이 정하여 고시하는 소방시설등점검표</td>
            </tr>
            <tr>
              <td>관계인이 소방본부장 또는 소방서장에게 제출</td>
              <td>
                1. 점검인력 배치확인서(소방시설관리업자가 점검한 경우에만 제출합니다) 1부
                <br />
                2. 별지 제10호서식의 소방시설등의 자체점검 결과 이행계획서{defs.length ? " 1부" : "(불량 사항이 있는 경우)"}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="rp-warn">
          유의 사항 — 1. 특정소방대상물의 관계인이 소방시설등에 대한 자체점검을 하지 않거나 관리업자 등으로 하여금 정기적으로 점검하게 하지 않은 경우 1년 이하의 징역 또는 1천만원 이하의 벌금에 처합니다. 2. 특정소방대상물의 관계인이 소방시설등의 점검 결과를 보고하지 않거나 거짓으로 보고한 경우 300만원 이하의 과태료를 부과합니다.(「소방시설 설치 및 관리에 관한 법률」 제58조제1호 및 제61조제1항제8호)
        </div>
      </Page>

      {/* 제2쪽 */}
      <Page no={2} total={total}>
        <div className="rp-h1">특정소방대상물 정보</div>
        <div className="rp-h2">1. 소방안전정보</div>
        <table className="rp-t">
          <colgroup>
            <col style={{ width: "14%" }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>대표자</th>
              <td>
                {C(rep.owner.kind === "소유자")}소유자, {C(rep.owner.kind === "관리자")}관리자, {C(rep.owner.kind === "점유자")}점유자 / 성명: {rep.owner.name}, 전화번호: {rep.owner.tel}
              </td>
            </tr>
            <tr>
              <th>소방안전 관리등급</th>
              <td>
                {C(rep.grade === "특급")}특급, {C(rep.grade === "1급")}1급, {C(rep.grade === "2급")}2급, {C(rep.grade === "3급")}3급
              </td>
            </tr>
            <tr>
              <th>소방안전 관리자</th>
              <td>
                {["소방기술자격", "소방안전관리자수첩", "업무대행감독", "겸직", "기타"].map((t) => (
                  <span key={t}>
                    {C(rep.manager.type === t)}
                    {t}{" "}
                  </span>
                ))}
                <br />
                성명: {rep.manager.name}, 전화번호: {rep.manager.tel}, 최근 교육이수일: {rep.manager.edu ? ymd(rep.manager.edu) : "      년    월    일"}
              </td>
            </tr>
            <tr>
              <th>소방계획서</th>
              <td>
                {C(rep.plan !== "미작성")}작성 ({C(rep.plan === "작성보관")}보관 {C(rep.plan === "작성미보관")}미보관), {C(rep.plan === "미작성")}미작성
              </td>
            </tr>
            <tr>
              <th>자체점검 (전년도)</th>
              <td>
                작동점검 ({C(rep.prevOp === "실시")}실시 {C(rep.prevOp === "미실시")}미실시), 종합점검 ({C(rep.prevComp === "실시")}실시 {C(rep.prevComp === "미실시")}미실시)
              </td>
            </tr>
            <tr>
              <th>교육훈련</th>
              <td>
                소방안전교육 ({C(rep.edu === "실시")}실시 {C(rep.edu === "미실시")}미실시), 소방훈련 ({C(rep.drill === "실시")}실시 {C(rep.drill === "미실시")}미실시)
              </td>
            </tr>
            <tr>
              <th>화재보험</th>
              <td>
                {C(rep.insurance.on)}가입, {C(!rep.insurance.on)}미가입
                <br />
                보험사: {rep.insurance.on ? rep.insurance.company : ""}, 가입기간: {rep.insurance.on ? `${ymd(rep.insurance.from)} ~ ${ymd(rep.insurance.to)}` : "      년    월    일 ~       년    월    일"}
                <br />
                가입금액: 대인({rep.insurance.on ? rep.insurance.person : "      "} 천만원) 대물({rep.insurance.on ? rep.insurance.property : "      "} 천만원)
              </td>
            </tr>
            <tr>
              <th>다중이용 업소현황</th>
              <td className="rp-multi">
                {MULTI.map((m) => (
                  <span key={m}>
                    {C(Number(rep.multi[m]) > 0)}
                    {m}({Number(rep.multi[m]) > 0 ? rep.multi[m] : "  "}개소){" "}
                  </span>
                ))}
                <span>{C(!hasMulti)}해당없음</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="rp-h2">2. 건축물 정보</div>
        <table className="rp-t">
          <colgroup>
            <col style={{ width: "14%" }} />
            <col style={{ width: "36%" }} />
            <col style={{ width: "14%" }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>건축허가일</th>
              <td>{ymd(b.permit)}</td>
              <th>사용승인일</th>
              <td>{ymd(b.approval)}</td>
            </tr>
            <tr>
              <th>연 면 적</th>
              <td>{b.area ? Number(b.area).toLocaleString("ko-KR") : ""} ㎡</td>
              <th>건축면적 / 세대수</th>
              <td>
                {b.bArea ? Number(b.bArea).toLocaleString("ko-KR") : ""} ㎡ / 세대수 {b.households}
              </td>
            </tr>
            <tr>
              <th>층수</th>
              <td>
                지상 {b.gf} 층 / 지하 {b.bf || 0} 층
              </td>
              <th>높이 / 건물동수</th>
              <td>
                {b.height} m / {b.dong} 개동
              </td>
            </tr>
            <tr>
              <th>건축물구조</th>
              <td colSpan={3}>
                {["콘크리트구조", "철골구조", "조적조", "목구조", "기타"].map((t) => (
                  <span key={t}>
                    {C(b.structure === t)}
                    {t}{" "}
                  </span>
                ))}
              </td>
            </tr>
            <tr>
              <th>지붕구조</th>
              <td>
                {["슬래브", "기와", "슬레이트", "기타"].map((t) => (
                  <span key={t}>
                    {C(b.roof === t)}
                    {t}{" "}
                  </span>
                ))}
              </td>
              <th>경사로</th>
              <td>{b.ramp || 0} 개소</td>
            </tr>
            <tr>
              <th>계단</th>
              <td colSpan={3}>
                {C(Number(b.stair) > 0)}직통(또는 피난계단) ({b.stair || " "} 개소), {C(Number(b.stairSp) > 0)}특별피난계단 ({b.stairSp || " "} 개소)
              </td>
            </tr>
            <tr>
              <th>승강기</th>
              <td colSpan={3}>
                {C(Number(b.elev) > 0)}승용({b.elev || " "} 대), {C(Number(b.elevE) > 0)}비상용({b.elevE || " "} 대), {C(Number(b.elevR) > 0)}피난용({b.elevR || " "} 대)
              </td>
            </tr>
            <tr>
              <th>주차장</th>
              <td colSpan={3}>
                {C(["지하", "지상", "필로티", "기계식"].some((x) => b.parking.includes(x)))}옥내({C(b.parking.includes("지하"))}지하 {C(b.parking.includes("지상"))}지상 {C(b.parking.includes("필로티"))}필로티{" "}
                {C(b.parking.includes("기계식"))}기계식), {C(b.parking.includes("옥상"))}옥상, {C(b.parking.includes("옥외"))}옥외
              </td>
            </tr>
          </tbody>
        </table>
      </Page>

      {/* 제3쪽 */}
      <Page no={3} total={total}>
        <div className="rp-h1">소방시설등의 현황</div>
        <div className="rp-small">※ [ ]에는 해당 시설에 √ 표를 하고, 점검 결과란은 양호○, 불량×, 해당없는 항목은 /표시를 합니다.</div>
        <div className="rp-h2">1. 소방시설등 점검 결과</div>
        <ResultTable rep={rep} left={ROWS_L} right={ROWS_R} stateOf={rowState} />
        <div className="rp-note">비고: {rep.note}</div>
        <div className="rp-h2">2. 안전시설등 점검 결과(다중이용업소)</div>
        <ResultTable rep={rep} left={ROWS_M_L} right={ROWS_M_R} stateOf={mRowState} />
      </Page>

      {/* 제4쪽 세부 현황 */}
      <Page no={4} total={total}>
        <Detail rep={rep} />
      </Page>

      {/* 제5쪽 불량 세부 사항 */}
      <Page no={5} total={total}>
        <div className="rp-h2">4. 소방시설등 불량 세부 사항</div>
        <table className="rp-t rp-def">
          <colgroup>
            <col style={{ width: "16%" }} />
            <col style={{ width: "16%" }} />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>설비명</th>
              <th>점검번호</th>
              <th>불량내용</th>
            </tr>
          </thead>
          <tbody>
            {DEFECT_CATS.map((cat) => {
              const list = defs.filter((x) => x.cat === cat);
              if (!list.length)
                return (
                  <tr key={cat}>
                    <td className="rp-cat">{cat}</td>
                    <td />
                    <td className="rp-empty">{defs.length ? "" : cat === "소화설비" ? "불량 사항 없음" : ""}</td>
                  </tr>
                );
              return list.map((x, i) => (
                <tr key={cat + x.code}>
                  {i === 0 && (
                    <td rowSpan={list.length} className="rp-cat">
                      {cat}
                    </td>
                  )}
                  <td>{x.code}</td>
                  <td>
                    {x.row} — {x.text}
                    {x.qty ? ` ${x.qty}` : ""}
                  </td>
                </tr>
              ));
            })}
            <tr>
              <td className="rp-cat">비고</td>
              <td colSpan={2}>점검번호는 소방시설등 자체점검표의 점검항목별 번호를 기입합니다.</td>
            </tr>
          </tbody>
        </table>
      </Page>

      {/* 별지 제10호서식 이행계획서 — 불량이 있을 때 */}
      {defs.length > 0 && (
        <Page form="10">
          <div className="rp-titlebox">
            <div className="rp-title">소방시설등의 자체점검 결과 이행계획서</div>
          </div>
          <table className="rp-t">
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "36%" }} />
              <col style={{ width: "14%" }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th rowSpan={3}>특정소방대상물</th>
                <td>대상물 명칭(상호): {rep.name}</td>
                <th>대상물 구분(용도)</th>
                <td>{rep.useLabel}</td>
              </tr>
              <tr>
                <td>
                  관계인 (성명: {rep.owner.name} 전화번호: {rep.owner.tel})
                </td>
                <th>소방안전관리자</th>
                <td>
                  (성명: {rep.manager.name} 전화번호: {rep.manager.tel})
                </td>
              </tr>
              <tr>
                <td colSpan={3}>소재지: {rep.addr}</td>
              </tr>
            </tbody>
          </table>
          <table className="rp-t">
            <colgroup>
              <col style={{ width: "14%" }} />
              <col />
              <col style={{ width: "34%" }} />
            </colgroup>
            <thead>
              <tr>
                <th />
                <th>이행조치 사항</th>
                <th>이행조치 일자</th>
              </tr>
            </thead>
            <tbody>
              {defs.map((x, i) => {
                const p = (rep.plan10.items || {})[x.code] || {};
                return (
                  <tr key={x.code}>
                    {i === 0 && (
                      <th rowSpan={defs.length} className="rp-cat">
                        이행조치 계획사항
                      </th>
                    )}
                    <td>
                      {x.row} — {x.text}
                      {x.qty ? ` ${x.qty}` : ""} 수리ㆍ교체ㆍ정비
                    </td>
                    <td>
                      {p.from ? p.from.replace(/-/g, ". ") + "." : "    .   .   ."} ~ {p.to ? p.to.replace(/-/g, ". ") + "." : "    .   .   ."}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <th>이행조치 필요기간</th>
                <td colSpan={2}>
                  {ymd(rep.plan10.from)} ~ {ymd(rep.plan10.to)} (총 {daysInclusive(rep.plan10.from, rep.plan10.to)} 일)
                </td>
              </tr>
            </tbody>
          </table>
          <div className="rp-decl">
            「소방시설 설치 및 관리에 관한 법률」 제23조제3항 및 같은 법 시행규칙 제23조제2항에 따라 위와 같이 소방시설등의 수리ㆍ교체ㆍ정비에 대한 이행계획서를 제출합니다.
          </div>
          <div className="rp-date">{ymd(rep.reportDate)}</div>
          <div className="rp-sign">관계인: {rep.owner.name} &nbsp;&nbsp;(서명 또는 인)</div>
          <div className="rp-to">{st} 귀하</div>
          <div className="rp-warn">
            유의 사항 — 1. 특정소방대상물의 관계인이 법 제22조에 따른 소방시설등의 자체점검 결과에 따른 수리ㆍ조치ㆍ정비사항의 발생 시 이행계획서를 첨부하지 않거나 거짓으로 제출한 경우 300만원 이하의 과태료를 부과합니다. 2. 특정소방대상물의 관계인이 소방시설등의 수리ㆍ조치ㆍ정비 이행계획을 별도의 연기신청 없이 기간 내에 완료하지 않은 경우 300만원 이하의 과태료를 부과합니다.(「소방시설 설치 및 관리에 관한 법률」 제61조제1항제8호 및 제9호)
          </div>
        </Page>
      )}
    </div>
  );
}

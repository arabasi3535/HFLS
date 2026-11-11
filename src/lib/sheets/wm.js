// ============================================================
// 위험물 정기점검표·위험물안전카드 ↔ 엑셀 서식
// ============================================================
import { WM_FORMS, wmForm, wmRows, results, optVals, emptyWm, emptyCard, RESULTS, defaultResult } from "../../law/wm";
import { HZ_ITEMS, HZ_CLASSES, hzItem } from "../../law/hazmat";
import { CHEM, GUN, FEAT, STATE } from "../../components/WmCard";
import { makeBook, readForms, yn, toDate } from "../sheetForm";

const HZ_N = 5;
const clsShort = (c) => HZ_CLASSES[c].split(" ")[0];
const hzName = (it) => `${clsShort(it.cls)} ${it.name}`;
const HZ_NAMES = HZ_ITEMS.map(hzName);
const findHz = (s) => {
  const n = String(s || "").replace(/\s+/g, "");
  return HZ_ITEMS.find((it) => hzName(it).replace(/\s+/g, "") === n) || HZ_ITEMS.find((it) => it.id === s) || null;
};

/** 머리 부분 입력 항목 [키, 항목, 종류, 설명] */
function headFields(f) {
  const fac = f.kind === "facility";
  const mob = f.form === "13";
  return [
    ["from", "점검 시작일", "date"],
    ["to", "점검 종료일", "date", "하루면 시작일과 같게"],
    ["checker", mob ? "점검자(위험물운송자 등)" : "점검자(안전관리자 등)", "text"],
    f.extra && ["extra", f.extra[0], "text"],
    ["permitDate", fac ? "설치허가 연월일" : "제조소등의 설치허가 연월일", "date"],
    ["permitNo", "완공검사번호", "text"],
    ["owner", "설치자", "text"],
    fac && ["manager", mob ? "위험물운송자" : "안전관리자", "text", mob ? "" : "중복 선임이면 「중복 선임」 표기"],
    fac && ["biz", "사업소명", "text"],
    fac && ["loc", mob ? "상치장소" : "설치위치", "text", "주소와 설치위치를 특정할 수 있는 내용"],
    !fac && ["facKind", "제조소등의 구분", "text", "예: 주유취급소"],
    ["facName", !fac ? (f.form === "24" ? "탐지설비의 호칭번호" : "소화설비의 호칭번호") : "시설명/호칭번호", "text", mob ? "자동차 등록번호 등" : ""],
    fac && ["summary", "위험물 저장·취급 개요", "text", "용도, 저장·취급기간, 저장·취급방법 등"],
  ].filter(Boolean);
}

/**
 * 조건키 → 엑셀 수식(형태 칸을 바꾸면 기본 결과가 따라 바뀜)
 *  형태 하나만 결과를 바꾸는지 앱의 기본값 규칙(defaultResult)으로 직접 확인해 만든다
 */
function condFormula(f, cond) {
  if (!cond) return null;
  const base = Object.fromEntries(f.opts.map((x) => [x.k, x.def]));
  for (const x of f.opts) {
    const res = x.ch.map(([k]) => defaultResult(f, cond, { ...base, [x.k]: k }));
    if (new Set(res).size < 2) continue;
    const ok = x.ch.filter((c, j) => res[j] === "적합").map((c) => c[1]);
    const defL = (x.ch.find((c) => c[0] === x.def) || x.ch[0])[1];
    return (refOf) => {
      const r = refOf(`opt.${x.k}`);
      const v = `IF(${r}="","${defL}",${r})`;
      return `IF(OR(${ok.map((l) => `${v}="${l}"`).join(",")}),"적합","해당없음")`;
    };
  }
  return null;
}

function formSpec(f, st0) {
  const st = st0 || emptyWm();
  const h = st.hdr || {};
  const o = optVals(f, st);
  const fields = [{ sec: "1. 기본 정보", secHelp: `[별지 제${f.form}호서식] 머리 부분` }];
  for (const [k, label, type, help] of headFields(f)) fields.push({ key: `hdr.${k}`, label, type, value: h[k] || "", help });
  for (const x of f.opts) fields.push({ key: `opt.${x.k}`, label: x.label, type: "list", list: x.ch.map((c) => c[1]), value: (x.ch.find((c) => c[0] === o[x.k]) || [])[1] || "", help: x.hint || "형태에 따라 해당없음 항목이 정해짐" });
  if (f.kind === "facility") {
    fields.push({ sec: "위험물 현황", secHelp: "품명·허가량 — 지정수량 배수는 앱에서 자동 계산" });
    const hz = st.hz || [];
    for (let i = 0; i < HZ_N; i++) {
      const r = hz[i] || {};
      const it = r.item ? hzItem(r.item) : null;
      fields.push({ key: `hz.${i}.item`, label: `품명 ${i + 1}`, type: "list", list: HZ_NAMES, value: it ? hzName(it) : "" });
      fields.push({ key: `hz.${i}.amount`, label: `품명 ${i + 1} 허가량(L·kg)`, type: "num", value: r.amount || "" });
      fields.push({ key: `hz.${i}.q`, label: `품명 ${i + 1} 지정수량`, type: "num", value: r.q || "", help: "지정수량이 여러 개인 품명(제1·2·3·5류 일부)만" });
    }
  }
  fields.push({ sec: "2. 점검 결과", secHelp: "기본값: 적합(시설 형태에 없는 항목·교재 예시 항목은 해당없음) — 부적합은 비고에 수리·개조 연월일과 내용" });
  const rows = wmRows(f);
  const res = results(f, st);
  let g = null;
  rows.forEach((r, i) => {
    if (r[0] !== g) {
      g = r[0];
      fields.push({ sec: g });
    }
    const formula = !(st.res || {})[i] ? condFormula(f, r[4]) : null;
    fields.push({ key: `res.${i}`, formula, label: `${r[1] ? `${r[1].split(" > ").join(" · ")} — ` : ""}${r[2]} (${r[3]})`, type: "list", list: RESULTS, value: res[i], note: { value: (st.note || {})[i] || "" }, help: "" });
  });
  fields.push({ sec: "기타사항" });
  fields.push({ key: "etc", label: "기타사항", type: "text", value: st.etc || "", help: "실제 점검한 사람이 실시자와 다르면 그 성명·상호 등" });
  return {
    id: `hfls:wm:${f.id}`,
    name: f.tab.slice(0, 28),
    title: `${f.form === "19" ? "물분무소화설비·스프링클러설비" : f.title.replace(/ 일반점검표$/, "")} 일반점검표 — 입력 서식([별지 제${f.form}호서식])`,
    intro: [
      "노란 칸(입력값·비고)에만 적으십시오. 목록이 있는 칸은 눌러서 고릅니다. 다 쓴 뒤 앱 「위험물 정기점검 → " + f.tab + "」의 「불러오기」로 이 파일을 올리면 점검표가 채워집니다.",
      "점검 결과는 적합이 기본입니다. 형태(셀프·현수식·부상지붕 등)를 바꾸면 앱에서 해당없음 항목이 다시 정해지므로, 형태를 먼저 고르고 결과를 적으십시오.",
    ],
    noteCol: "비고",
    fields,
  };
}

const CARD_FIELDS = [
  { sec: "1. 위험물" },
  ["name1", "물질명(화학명)", "text"],
  ["name2", "물질명(통칭명 등)", "text"],
  ["un", "UN No.", "text", "국가위험물통합정보시스템(hazmat.nfa.go.kr)에서 물질명 검색"],
  ["cas", "화학물질 식별번호(CAS No.)", "text", "국가위험물통합정보시스템, 화학물질정보처리시스템, 산업안전보건공단 MSDS"],
  ...[1, 2, 3, 4, 5, 6].map((n) => [`cls.${n}`, `유별 — 제${n}류`, "yn"]),
  ["item", "품명(위험물안전관리법 시행령 별표1)", "text"],
  ...CHEM.map(([k, l]) => [`chem.${k}`, `화학물질관리법 — ${l}`, "yn"]),
  ...GUN.map(([k, l]) => [`gun.${k}`, `총포·화약류법 — ${l}`, "yn"]),
  { sec: "2. 특성·성질" },
  ...FEAT.map(([k, l]) => [`feat.${k}`, `특성 — ${l}`, "yn"]),
  ["other", "그 밖의 위험성(주의사항 등)", "text"],
  ...STATE.map(([k, l]) => [`state.${k}`, `성질·상태 — ${l}`, "yn"]),
  { sec: "3. 사고발생시의 응급조치 요령", secHelp: "누출·화재 시 조치사항, 처리약제 등" },
  ...[0, 1, 2, 3, 4].map((i) => [`aid.${i}`, `응급조치 ${i + 1}`, "text"]),
  { sec: "4. 긴급신고·연락처" },
  ["city", "긴급신고 — 시군구청 번호", "text"],
  ["ex", "긴급신고 — 한국도로공사 번호", "text"],
  ...["owner", "carrier"].flatMap((p) => {
    const n = p === "owner" ? "화주" : "운송자";
    return [
      [`${p}.name`, `${n} 명칭`, "text"],
      [`${p}.addr`, `${n} 주소`, "text"],
      [`${p}.day`, `${n} 전화(주간)`, "text"],
      [`${p}.night`, `${n} 전화(야간)`, "text"],
    ];
  }),
];
const getP = (o, path) => path.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);

function cardSpec(c0) {
  const c = c0 || emptyCard();
  const fields = CARD_FIELDS.map((x) => {
    if (!Array.isArray(x)) return x;
    const [key, label, type, help] = x;
    const v = getP(c, key);
    return { key, label, type, value: type === "yn" ? (v ? "예" : "") : v || "", help };
  });
  return {
    id: "hfls:wmcard",
    name: "위험물안전카드",
    title: "위험물안전카드 — 입력 서식(위험물안전관리법 시행규칙 [별지 제48호서식])",
    intro: ["노란 칸에만 적으십시오. 해당하는 항목은 「예」. 다 쓴 뒤 앱 「위험물 정기점검 → 위험물안전카드」의 「불러오기」로 올리면 카드가 채워집니다."],
    fields,
  };
}

/** 엑셀 서식 — sub: 점검표 id 또는 "card", st: 채울 값(없으면 빈 서식) */
export function wmBook(sub, st) {
  if (sub === "card") return makeBook([cardSpec(st)]);
  const f = wmForm(sub);
  if (!f) throw new Error("점검표를 찾지 못했습니다.");
  return makeBook([formSpec(f, st)]);
}

/** 올린 엑셀 → [{ sub, data }] (시트마다) + warn */
export function readWmBook(buf) {
  const forms = readForms(buf);
  const out = [];
  const warn = [];
  for (const sh of forms) {
    if (sh.id === "hfls:wmcard") {
      const c = emptyCard();
      for (const x of CARD_FIELDS) {
        if (!Array.isArray(x)) continue;
        const [key, label, type] = x;
        const s = sh.values[key];
        if (!s) continue;
        const [a, b] = key.split(".");
        let val = s;
        if (type === "yn") {
          const y = yn(s);
          if (y === null) {
            warn.push(`「${label}」: 「${s}」 → 예/아니오`);
            continue;
          }
          if (!y) continue;
          val = true;
        }
        if (b === undefined) c[a] = val;
        else if (a === "aid") c.aid[Number(b)] = val;
        else c[a] = { ...c[a], [b]: val };
      }
      out.push({ sub: "card", data: c });
      continue;
    }
    const m = /^hfls:wm:(.+)$/.exec(sh.id);
    if (!m) continue;
    const f = wmForm(m[1]);
    if (!f) continue;
    const v = sh.values;
    const st = emptyWm();
    for (const [k, label, type] of headFields(f)) {
      const s = v[`hdr.${k}`];
      if (!s) continue;
      const d = type === "date" ? toDate(s) : s;
      if (type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(d)) warn.push(`${f.tab} 「${label}」: 「${s}」 → 2026-03-05 형식`);
      st.hdr[k] = d;
    }
    for (const x of f.opts) {
      const s = v[`opt.${x.k}`];
      if (!s) continue;
      const c = x.ch.find((p) => p[1] === s || p[0] === s);
      if (c) st.opts[x.k] = c[0];
      else warn.push(`${f.tab} 「${x.label}」: 「${s}」는 목록에 없는 값`);
    }
    if (f.kind === "facility") {
      const hz = [];
      for (let i = 0; i < HZ_N; i++) {
        const s = v[`hz.${i}.item`];
        const amount = (v[`hz.${i}.amount`] || "").replace(/[,\s]/g, "");
        if (!s && !amount) continue;
        const it = findHz(s);
        if (s && !it) warn.push(`${f.tab} 품명 「${s}」를 찾지 못했습니다.`);
        const q = (v[`hz.${i}.q`] || "").replace(/[,\s]/g, "");
        hz.push({ item: it ? it.id : "", amount, ...(q && it && it.opts ? { q } : {}) });
      }
      if (hz.length) st.hz = hz;
    }
    // 점검 결과: 형태로 정해지는 기본값과 다른 것만 저장
    const rows = wmRows(f);
    const o = optVals(f, st);
    rows.forEach((r, i) => {
      const s = v[`res.${i}`];
      const n = (sh.notes[`res.${i}`] || "").trim();
      if (n) st.note[i] = n;
      if (!s) return;
      const val = RESULTS.find((x) => x === s.replace(/\s+/g, "")) || (s === "양호" ? "적합" : s === "불량" ? "부적합" : null);
      if (!val) {
        warn.push(`${f.tab} ${i + 1}번째 항목: 「${s}」 → 적합·부적합·해당없음·점검곤란`);
        return;
      }
      if (val !== defaultResult(f, r[4], o)) st.res[i] = val;
    });
    if (v.etc) st.etc = v.etc;
    out.push({ sub: f.id, data: st });
  }
  if (!out.length) throw new Error("위험물 정기점검표 엑셀 서식이 아닙니다. 「빈 서식 받기(엑셀)」로 받은 파일을 써 주십시오.");
  return { list: out, warn };
}

export { WM_FORMS };

// ============================================================
// 엑셀 입력 서식 — 「항목 · 입력값 · (비고) · 입력 방법」 표를 만들고 다시 읽는다
//  · A열(숨김)에 항목 키를 적어 두고, 올린 파일은 A열 키로 값을 찾는다(행 순서·삽입과 무관)
//  · A1 셀에 서식 표지(@hfls:…)를 넣어 다른 서식과 섞이지 않게 한다
// ============================================================
import { writeBook, readBook, sheetRows, toDate, colName, ST } from "./xlsx";

export const YES = "예";
export const NO = "아니오";
/** 예/아니오 해석 — 빈칸은 null */
export function yn(v) {
  const s = String(v == null ? "" : v).trim().toUpperCase();
  if (!s) return null;
  if (["예", "Y", "YES", "O", "○", "●", "V", "√", "✓", "1", "TRUE", "있음", "해당"].includes(s)) return true;
  if (["아니오", "아니요", "N", "NO", "X", "×", "0", "FALSE", "없음", "-", "해당없음"].includes(s)) return false;
  return null;
}

const LIST_INLINE_MAX = 200;

/**
 * 서식 시트 정의
 *  spec = { id, name, title, intro:[문장…], fields:[…], noteCol: "비고" | null }
 *  field = { sec: "구분 제목" } | { key, label, type: text|num|date|yn|list, list:[…], value, help, req, note: {key, value},
 *            formula: (refOf) => "엑셀 수식" — 다른 항목 값으로 바뀌는 기본값(직접 적으면 수식 대신 그 값) }
 */
function buildFormSheet(spec, listPool) {
  const hasNote = !!spec.noteCol;
  const cols = hasNote ? [4, 44, 24, 26, 46] : [4, 44, 28, 52];
  const last = colName(cols.length - 1);
  const rows = [];
  const merges = [];
  const heights = {};
  const lists = [];
  rows.push([`@${spec.id}`, { v: spec.title, s: ST.title }]);
  merges.push(`B1:${last}1`);
  heights[1] = 24;
  (spec.intro || []).forEach((t) => {
    rows.push(["", { v: t, s: ST.intro }]);
    merges.push(`B${rows.length}:${last}${rows.length}`);
    heights[rows.length] = t.length > 70 ? 30 : 17;
  });
  rows.push([]);
  rows.push(["", { v: "항목", s: ST.head }, { v: "입력값", s: ST.head }, ...(hasNote ? [{ v: spec.noteCol, s: ST.head }] : []), { v: "입력 방법·설명", s: ST.head }]);
  const freeze = rows.length;
  const listRef = (items) => {
    const joined = items.join(",");
    if (joined.length <= LIST_INLINE_MAX && !items.some((x) => /[,"]/.test(x))) return { items };
    const k = items.join("\u0001");
    if (!listPool.map.has(k)) {
      const col = listPool.cols.length;
      listPool.cols.push(items);
      listPool.map.set(k, `'목록'!$${colName(col)}$1:$${colName(col)}$${items.length}`);
    }
    return { range: listPool.map.get(k) };
  };
  // 수식 칸이 참조할 항목 위치(키 → 행번호)
  const keyRow = {};
  spec.fields.forEach((f, i) => {
    if (f.key) keyRow[f.key] = rows.length + i + 1;
  });
  const refOf = (k) => `$C$${keyRow[k]}`;
  for (const f of spec.fields) {
    if (f.sec) {
      rows.push(["", { v: f.sec, s: ST.sec }, { v: "", s: ST.sec }, ...(hasNote ? [{ v: "", s: ST.sec }] : []), { v: f.secHelp || "", s: ST.sec }]);
      continue;
    }
    const r = rows.length + 1;
    let help = f.help || "";
    const list = f.type === "yn" ? [YES, NO] : f.type === "list" ? f.list : null;
    if (f.type === "date") help = help ? `${help} (예: 2026-03-05)` : "날짜(예: 2026-03-05)";
    if (f.type === "num") help = help || "숫자";
    if (list && f.type === "yn") help = help ? `예/아니오 — ${help}` : "예/아니오";
    else if (list && !help) help = f.free ? "목록에서 선택(직접 입력 가능)" : "목록에서 선택";
    const v = f.value == null ? "" : typeof f.value === "boolean" ? (f.value ? YES : NO) : String(f.value);
    const row = [f.key, { v: f.label, s: f.req ? ST.req : ST.label }, f.formula ? { f: f.formula(refOf), v, s: ST.input } : { v, s: ST.input }];
    if (hasNote) row.push(f.note ? { v: f.note.value || "", s: ST.input } : { v: "", s: ST.label });
    row.push({ v: help, s: ST.help });
    rows.push(row);
    if (f.height) heights[r] = f.height;
    if (list) lists.push({ ref: `C${r}`, ...listRef(list), free: !!f.free });
    if (f.noteList && hasNote) lists.push({ ref: `D${r}`, ...listRef(f.noteList) });
  }
  // 같은 목록은 한 줄로 묶기
  const merged = [];
  for (const l of lists) {
    const key = (l.range || l.items.join(",")) + (l.free ? "~" : "");
    const prev = merged.find((x) => (x.range || x.items.join(",")) + (x.free ? "~" : "") === key);
    if (prev) prev.ref += ` ${l.ref}`;
    else merged.push({ ...l });
  }
  return { name: spec.name, cols, hiddenCols: [0], rows, merges, heights, lists: merged, freeze };
}

/** 표 형태 시트(층별 바닥면적 등): spec = { id, name, title, intro, head:[…], widths:[…], rows:[[…]], lists:{열번호:[…]}, blankRows } */
function buildTableSheet(spec, listPool) {
  const n = spec.head.length;
  const cols = [4, ...spec.widths];
  const last = colName(n);
  const rows = [[`@${spec.id}`, { v: spec.title, s: ST.title }]];
  const merges = [`B1:${last}1`];
  const heights = { 1: 24 };
  (spec.intro || []).forEach((t) => {
    rows.push(["", { v: t, s: ST.intro }]);
    merges.push(`B${rows.length}:${last}${rows.length}`);
  });
  rows.push([]);
  rows.push(["#head", ...spec.head.map((h) => ({ v: h, s: ST.head }))]);
  const freeze = rows.length;
  const first = rows.length + 1;
  const data = [...spec.rows];
  for (let i = 0; i < (spec.blankRows || 0); i++) data.push(Array(n).fill(""));
  for (const r of data) rows.push(["", ...r.map((v) => ({ v: v == null ? "" : String(v), s: ST.input }))]);
  const lastRow = rows.length;
  const lists = [];
  for (const [ci, items] of Object.entries(spec.lists || {})) {
    const L = colName(Number(ci) + 1);
    const ref = `${L}${first}:${L}${Math.max(first, lastRow)}`;
    const joined = items.join(",");
    if (joined.length <= LIST_INLINE_MAX) lists.push({ ref, items });
    else {
      const col = listPool.cols.length;
      listPool.cols.push(items);
      lists.push({ ref, range: `'목록'!$${colName(col)}$1:$${colName(col)}$${items.length}` });
    }
  }
  return { name: spec.name, cols, hiddenCols: [0], rows, merges, heights, lists, freeze };
}

/** 서식 여러 장 → .xlsx 바이트 */
export function makeBook(specs) {
  const pool = { cols: [], map: new Map() };
  const sheets = specs.map((s) => (s.table ? buildTableSheet(s, pool) : buildFormSheet(s, pool)));
  if (pool.cols.length) {
    const h = Math.max(...pool.cols.map((c) => c.length));
    const rows = [];
    for (let r = 0; r < h; r++) rows.push(pool.cols.map((c) => (c[r] === undefined ? "" : c[r])));
    sheets.push({ name: "목록", hidden: true, rows, cols: pool.cols.map(() => 40) });
  }
  return writeBook(sheets);
}

/**
 * 올린 .xlsx 읽기 → [{ id, name, values:{키:값}, notes:{키:비고}, table:[[…]] }]
 *  서식 표지(@…)가 없는 시트는 건너뜀
 */
export function readForms(buf) {
  const book = readBook(buf);
  const out = [];
  for (const sh of book) {
    if (sh.name === "목록") continue;
    // 수식 칸은 「직접 입력하지 않은 기본값」으로 보고 비움
    const rows = sheetRows({ cells: Object.fromEntries(Object.entries(sh.cells).filter(([ref]) => !(sh.formulas || {})[ref])) });
    const tag = String((rows[0] && rows[0][0]) || "").trim();
    if (!tag.startsWith("@")) continue;
    const id = tag.slice(1);
    const values = {};
    const notes = {};
    const table = [];
    // 머리행(항목·입력값…) 위치로 비고 열 유무 판단
    const headIdx = rows.findIndex((r) => r && r[1] === "항목" && r[2] === "입력값");
    const hasNote = headIdx >= 0 && rows[headIdx][3] && rows[headIdx][3] !== "입력 방법·설명";
    const tHead = rows.findIndex((r) => r && String(r[0] || "").trim() === "#head");
    rows.forEach((r, i) => {
      if (!r || i === 0) return;
      if (tHead >= 0) {
        const cells = r.slice(1).map((x) => String(x == null ? "" : x).trim());
        if (i > tHead && cells.some(Boolean)) table.push(cells);
        return;
      }
      const k = String(r[0] || "").trim();
      if (!k) return;
      values[k] = String(r[2] == null ? "" : r[2]).trim();
      if (hasNote) notes[k] = String(r[3] == null ? "" : r[3]).trim();
    });
    out.push({ id, name: sh.name, values, notes, table });
  }
  return out;
}

export { toDate };

/** 파일(File) → ArrayBuffer */
export const fileBuffer = (file) =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(fr.error);
    fr.readAsArrayBuffer(file);
  });
/** 파일(File) → 글자(UTF-8) */
export const fileText = (file) =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(fr.error);
    fr.readAsText(file, "utf-8");
  });
export const isXlsx = (file) => /\.xlsx$/i.test(file.name || "") || (file.type || "").includes("spreadsheetml");

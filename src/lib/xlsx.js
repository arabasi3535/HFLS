// ============================================================
// 최소 엑셀(.xlsx) 쓰기·읽기 — fflate(zip)만 사용, 외부 엑셀 라이브러리 없음
//  · 쓰기: 셀 문자열(inlineStr)·스타일 몇 가지·목록(드롭다운)·병합·틀 고정·숨긴 열/시트
//  · 읽기: 공유 문자열·인라인 문자열·숫자·논리값(엑셀·한셀·리브레오피스에서 저장한 파일)
// ============================================================
import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";

const esc = (s) =>
  String(s)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const unesc = (s) =>
  String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, "&");

/** 0 → A, 25 → Z, 26 → AA */
export function colName(i) {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
function colIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * 스타일 번호(cellXfs 순서)
 *  0 기본 · 1 제목 · 2 표 머리 · 3 구분(섹션) · 4 항목명 · 5 입력칸(노랑·텍스트 서식) · 6 설명(회색 글씨) · 7 안내문 · 8 필수 항목명
 */
export const ST = { base: 0, title: 1, head: 2, sec: 3, label: 4, input: 5, help: 6, intro: 7, req: 8 };
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="5">
<font><sz val="10"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>
<font><b/><sz val="14"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>
<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>
<font><b/><sz val="10"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>
<font><sz val="9"/><color rgb="FF6B7280"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font>
</fonts>
<fills count="5">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF374151"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFE5E7EB"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF7CC"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFBFC5CE"/></left><right style="thin"><color rgb="FFBFC5CE"/></right><top style="thin"><color rgb="FFBFC5CE"/></top><bottom style="thin"><color rgb="FFBFC5CE"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="9">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="49" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1" applyProtection="1"><alignment vertical="center" wrapText="1"/><protection locked="0"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/**
 * 시트 정의
 *  { name, cols:[너비…], hiddenCols:[열번호…], rows:[[셀…]…], heights:{행번호: 높이}, merges:["B1:E1"],
 *    lists:[{ref:"C5:C5", items:[…]} | {ref, range:"'목록'!$A$1:$A$9"}], freeze: 행수, hidden: true }
 *  셀: 문자열 · 숫자 · { v, s } (s = ST 스타일 번호)
 */
function sheetXml(sh) {
  const out = [];
  out.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  out.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">');
  out.push('<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
  out.push("<sheetViews><sheetView workbookViewId=\"0\"" + (sh.active ? ' tabSelected="1"' : "") + ">");
  if (sh.freeze) out.push(`<pane ySplit="${sh.freeze}" topLeftCell="A${sh.freeze + 1}" activePane="bottomLeft" state="frozen"/>`);
  out.push("</sheetView></sheetViews>");
  out.push('<sheetFormatPr defaultRowHeight="16.5"/>');
  if (sh.cols && sh.cols.length) {
    out.push("<cols>");
    sh.cols.forEach((w, i) => {
      const hid = (sh.hiddenCols || []).includes(i);
      out.push(`<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"${hid ? ' hidden="1"' : ""}/>`);
    });
    out.push("</cols>");
  }
  out.push("<sheetData>");
  (sh.rows || []).forEach((row, ri) => {
    if (!row) return;
    const h = sh.heights && sh.heights[ri + 1];
    out.push(`<row r="${ri + 1}"${h ? ` ht="${h}" customHeight="1"` : ""}>`);
    row.forEach((cell, ci) => {
      if (cell === undefined || cell === null) return;
      const c = typeof cell === "object" ? cell : { v: cell };
      const ref = colName(ci) + (ri + 1);
      const s = c.s ? ` s="${c.s}"` : "";
      if (c.f) out.push(`<c r="${ref}"${s} t="str"><f>${esc(c.f)}</f><v>${esc(c.v == null ? "" : c.v)}</v></c>`);
      else if (c.v === undefined || c.v === null || c.v === "") {
        if (c.s) out.push(`<c r="${ref}"${s}/>`);
      } else if (typeof c.v === "number") out.push(`<c r="${ref}"${s}><v>${c.v}</v></c>`);
      else out.push(`<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(c.v)}</t></is></c>`);
    });
    out.push("</row>");
  });
  out.push("</sheetData>");
  if (sh.merges && sh.merges.length) out.push(`<mergeCells count="${sh.merges.length}">${sh.merges.map((m) => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>`);
  if (sh.lists && sh.lists.length) {
    out.push(`<dataValidations count="${sh.lists.length}">`);
    for (const l of sh.lists) {
      const f = l.range ? esc(l.range) : esc(`"${l.items.join(",")}"`);
      out.push(`<dataValidation type="list" allowBlank="1" showErrorMessage="${l.free ? 0 : 1}" errorTitle="목록에서 고르십시오" error="칸을 눌러 나오는 목록에서 고르십시오." sqref="${l.ref}"><formula1>${f}</formula1></dataValidation>`);
    }
    out.push("</dataValidations>");
  }
  out.push('<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>');
  out.push('<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>');
  out.push("</worksheet>");
  return out.join("");
}

/** 통합문서 → Uint8Array(.xlsx) */
export function writeBook(sheets) {
  const files = {};
  const ct = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
    ...sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`),
    "</Types>",
  ].join("");
  files["[Content_Types].xml"] = strToU8(ct);
  files["_rels/.rels"] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
  );
  const activeIdx = Math.max(0, sheets.findIndex((s) => !s.hidden));
  files["xl/workbook.xml"] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      `<bookViews><workbookView activeTab="${activeIdx}"/></bookViews><sheets>` +
      sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}"${s.hidden ? ' state="hidden"' : ""} r:id="rId${i + 1}"/>`).join("") +
      '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>'
  );
  files["xl/_rels/workbook.xml.rels"] = strToU8(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("") +
      `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      "</Relationships>"
  );
  files["xl/styles.xml"] = strToU8(STYLES);
  sheets.forEach((s, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml({ ...s, active: i === activeIdx }));
  });
  return zipSync(files, { level: 6 });
}

const attr = (s, name) => {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(s);
  return m ? unesc(m[1]) : null;
};
/** <si>·<is> 안의 글자(윗주 rPh 제외) */
const textOf = (xml) => {
  const body = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
  let s = "";
  const re = /<t\b[^>]*>([\s\S]*?)<\/t>|<t\b[^>]*\/>/g;
  let m;
  while ((m = re.exec(body))) s += m[1] ? unesc(m[1]) : "";
  return s;
};

/**
 * .xlsx 읽기 → [{ name, hidden, cells: { "C5": "값" }, formulas: { "C5": true } }]
 *  값은 모두 문자열(숫자는 엑셀 표기 그대로, 논리값은 "TRUE"/"FALSE")
 */
export function readBook(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let files;
  try {
    files = unzipSync(u8);
  } catch (e) {
    throw new Error("엑셀(.xlsx) 파일이 아닙니다.");
  }
  const get = (p) => {
    const k = Object.keys(files).find((x) => x.toLowerCase() === p.toLowerCase());
    return k ? strFromU8(files[k]) : null;
  };
  const wb = get("xl/workbook.xml");
  if (!wb) throw new Error("엑셀(.xlsx) 파일이 아닙니다.");
  const rels = get("xl/_rels/workbook.xml.rels") || "";
  const relMap = {};
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) relMap[attr(m[0], "Id")] = attr(m[0], "Target");
  const ssXml = get("xl/sharedStrings.xml");
  const ss = ssXml ? [...ssXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g)].map((m) => (m[1] ? textOf(m[1]) : "")) : [];
  const out = [];
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const name = attr(m[0], "name");
    const rid = attr(m[0], "r:id");
    let target = relMap[rid] || "";
    target = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
    const xml = get(target.replace(/[^/]+\/\.\.\//g, ""));
    const cells = {};
    const formulas = {};
    if (xml) {
      const data = (/<sheetData\b[^>]*>([\s\S]*?)<\/sheetData>/.exec(xml) || [])[1] || "";
      for (const c of data.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const a = c[1];
        const body = c[2] || "";
        const ref = attr(a, "r");
        if (!ref) continue;
        const t = attr(a, "t");
        let v = "";
        if (t === "inlineStr") v = textOf(body);
        else {
          const vm = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body);
          const raw = vm ? unesc(vm[1]) : "";
          if (t === "s") v = ss[parseInt(raw, 10)] || "";
          else if (t === "b") v = raw === "1" ? "TRUE" : raw === "0" ? "FALSE" : raw;
          else v = raw;
        }
        if (/<f\b/.test(body)) formulas[ref] = true;
        if (v !== "") cells[ref] = v;
      }
    }
    out.push({ name, hidden: /state="(hidden|veryHidden)"/.test(m[0]), cells, formulas });
  }
  return out;
}

/** 시트 셀 → 행 배열 [[A, B, C…]…] (빈 칸은 "") */
export function sheetRows(sheet) {
  const rows = [];
  for (const [ref, v] of Object.entries(sheet.cells || {})) {
    const m = /^([A-Z]+)(\d+)$/.exec(ref);
    if (!m) continue;
    const r = parseInt(m[2], 10) - 1;
    const c = colIndex(m[1]);
    rows[r] = rows[r] || [];
    rows[r][c] = v;
  }
  return Array.from(rows, (r) => Array.from(r || [], (x) => (x === undefined ? "" : x)));
}

/** 엑셀 날짜 일련번호 → 'YYYY-MM-DD' (텍스트면 정리만) */
export function toDate(v) {
  const s = String(v == null ? "" : v).trim();
  if (!s) return "";
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(parseFloat(s)) * 864e5);
    return d.toISOString().slice(0, 10);
  }
  const m = /^(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?\.?$/.exec(s);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return s;
}

/** 내려받기 */
export function downloadBytes(bytes, name, type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
  const blob = new Blob([bytes], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name.replace(/[\\/:*?"<>|]+/g, "_");
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

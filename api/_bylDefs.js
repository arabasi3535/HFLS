// ============================================================
// 별표 본문에서 용어 정의 뽑기(v2.49.0) — 표(│┃┌ 등) 밖의 번호 항목 중
//  「"용어"란 …을 말한다」 · 「"용어"라 함은 …」 · 「"A", "B" 및 "C"은 …을 말한다」 형태
//  법제처 별표 글은 고정 폭으로 줄이 바뀌어(낱말 중간 포함) 줄바꿈은 원문 그대로 두고 앞 들여쓰기만 지움
// ============================================================

const TABLE = /[│┃┌┏├┠└┗┐┓┤┨┘┛─━┬┯┴┷┼]/;
const MARKS = [/^(\d+)\.\s*/, /^([가-하])\.\s*/, /^(\d+)\)\s*/, /^([가-하])\)\s*/];
const ONE = /^["“]([^"”]{1,40})["”]\s*(?:\(([^)]{1,40})\))?\s*(?:이)?(?:란|라\s*함은|라고\s*함은)\s/;
const MANY = /^(?:위\s*표에서\s*)?((?:["“][^"”]{1,30}["”]\s*(?:,|및|또는)?\s*){2,})(?:은|는|이란|란)\s/;
const ENDS = /(말한다|말하며|라\s*한다|이라\s*한다)[.)]?/;

const HAN = "가나다라마바사아자차카타파하";
const idxOf = (x) => (/^\d+$/.test(x) ? parseInt(x, 10) : HAN.indexOf(x) + 1);

function mark(l) {
  for (let i = 0; i < MARKS.length; i++) {
    const m = l.match(MARKS[i]);
    if (m && l.length > m[0].length) return { level: i + 1, idx: idxOf(m[1]), no: m[0].trim(), rest: l.slice(m[0].length) };
  }
  return null;
}

function termsOf(rest) {
  const one = rest.match(ONE);
  if (one) return { terms: [one[1].trim()], alias: one[2] ? one[2].trim() : "" };
  const many = rest.match(MANY);
  if (many) return { terms: [...many[1].matchAll(/["“]([^"”]{1,30})["”]/g)].map((x) => x[1].trim()), alias: "" };
  return null;
}

/** byl: { k, title, text } → [{ byl, title, section, bigo, no, terms, alias, text }] */
function bylDefs(byl) {
  const out = [];
  if (!byl || !byl.text) return out;
  const lines = String(byl.text).split(/\r?\n/);
  let section = "";
  let bigo = false;
  let cur = null;
  let seq = {}; // 단계별 마지막 번호 — 줄이 바뀌며 「다.」처럼 번호 모양으로 시작한 줄을 항목으로 잘못 보지 않게
  const close = () => {
    if (cur && ENDS.test(cur.lines.join(""))) out.push({ byl: byl.k, title: byl.title || "", section: cur.section, bigo: cur.bigo, no: cur.no, terms: cur.terms, alias: cur.alias, text: cur.lines.join("\n") });
    cur = null;
  };
  const nextLine = (i) => {
    for (let j = i + 1; j < lines.length; j++) if (lines[j].trim()) return lines[j].trim();
    return "";
  };
  lines.forEach((raw, i) => {
    const l = raw.trim();
    if (!l || TABLE.test(l)) return close();
    if (/^■/.test(l)) {
      close();
      section = "";
      bigo = false;
      seq = {};
      return;
    }
    if (/^비\s*고$/.test(l)) {
      close();
      bigo = true;
      seq = {};
      return;
    }
    const raw0 = mark(l);
    // 큰 제목(「1. 소방시설설계업」 등): 1단계 번호, 문장 끝·따옴표 없음, 다음 줄이 표이거나 번호로 시작
    if (raw0 && raw0.level === 1 && l.length <= 40 && !/[.:」"”]$/.test(l) && !/["“]/.test(l)) {
      const nx = nextLine(i);
      if (TABLE.test(nx) || mark(nx)) {
        close();
        section = l;
        bigo = false;
        seq = {};
        return;
      }
    }
    let m = raw0;
    if (m && m.idx !== 1 && seq[m.level] !== undefined && m.idx !== seq[m.level] + 1) m = null; // 번호가 이어지지 않으면 앞 줄의 이어짐
    if (cur && (!m || m.level > cur.level)) {
      cur.lines.push(l);
      return;
    }
    close();
    if (!m) return;
    seq[m.level] = m.idx;
    for (let d = m.level + 1; d <= MARKS.length; d++) delete seq[d];
    const t = termsOf(m.rest);
    if (t) cur = { level: m.level, no: m.no, section, bigo, terms: t.terms, alias: t.alias, lines: [m.rest] };
  });
  close();
  return out;
}

module.exports = { bylDefs };

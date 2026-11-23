/* 버전 정보(변경 기록) 생성 — README.md의 「## vX 변경사항 (날짜) — 제목」 절을 src/changelog.json 으로 정리
 * build-info.js(npm run build / start / test 직전)에서 함께 실행됩니다.
 * 새 버전은 README 맨 위에 같은 형식으로 절을 추가하면 「사용 안내 › 버전 정보」에 자동으로 들어갑니다.
 * 지원하는 마크다운: 표, 글머리(- , 들여쓰기 하위 항목), 번호 목록, ### 소제목, > 인용, 문단, **굵게**, `코드`
 */
const fs = require("fs");
const path = require("path");

const HEAD = /^## v(\d+(?:\.\d+)+) 변경사항(?:\s*\((\d{4}-\d{2}-\d{2})\))?(?:\s*—\s*(.+))?\s*$/;

const cells = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

/** 절 본문(마크다운 줄 배열) → 블록 목록 */
function parseBlocks(lines) {
  const out = [];
  let para = null;
  let list = null;
  let tbl = null;
  const end = () => {
    para = null;
    list = null;
    tbl = null;
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) {
      end();
      continue;
    }
    if (/^\s*\|/.test(line)) {
      if (!tbl) {
        end();
        tbl = { t: "tbl", h: cells(line), r: [] };
        out.push(tbl);
      } else if (!/^\s*\|?\s*:?-{2,}/.test(line)) tbl.r.push(cells(line));
      continue;
    }
    tbl = null;
    let m;
    if ((m = line.match(/^###+\s+(.+)$/))) {
      end();
      out.push({ t: "h", s: m[1] });
      continue;
    }
    if ((m = line.match(/^>\s?(.*)$/))) {
      end();
      out.push({ t: "q", s: m[1] });
      continue;
    }
    if ((m = line.match(/^(\s*)(?:[-*]|(\d+)\.)\s+(.+)$/))) {
      const sub = m[1].length >= 2;
      const kind = m[2] ? "ol" : "ul";
      para = null;
      if (sub && list && list.i.length) {
        const last = list.i[list.i.length - 1];
        (last.c = last.c || []).push({ s: m[3] });
      } else {
        if (!list || list.t !== kind) {
          list = { t: kind, i: [] };
          out.push(list);
        }
        list.i.push({ s: m[3] });
      }
      continue;
    }
    if (/^\s{2,}\S/.test(line) && list && list.i.length) {
      // 목록 항목에 이어지는 줄(예: "  · ②…") — 마지막 항목(하위 항목이 있으면 그 마지막)에 줄바꿈으로 붙임
      const last = list.i[list.i.length - 1];
      const tgt = last.c && last.c.length ? last.c[last.c.length - 1] : last;
      tgt.s += "\n" + line.trim();
      continue;
    }
    list = null;
    if (para) para.s += " " + line.trim();
    else {
      para = { t: "p", s: line.trim() };
      out.push(para);
    }
  }
  return out;
}

const plain = (s) => s.replace(/\*\*|`/g, "").replace(/\s+/g, " ").trim();

/** 제목이 없는 버전의 목차용 요약 — 첫 표의 첫 칸, 없으면 첫 글머리·문단 */
function fallbackTitle(blocks) {
  const t = blocks.find((b) => b.t === "tbl" && b.r.length);
  let s = t ? t.r[0][0] : "";
  if (!s) {
    const b = blocks.find((x) => x.t === "ul" || x.t === "ol" || x.t === "p");
    s = b ? (b.i ? b.i[0].s : b.s) : "";
  }
  s = plain(s.split("\n")[0]).replace(/[:：].*$/, "");
  // 긴 설명 문장은 첫 구절(— · → · 괄호 앞)까지만
  const cut = s.search(/\s—\s|\s→\s|\(/);
  if (s.length > 24 && cut >= 4) s = s.slice(0, cut).trim();
  return s.length > 32 ? s.slice(0, 31) + "…" : s;
}

/** README 전체 → 버전 목록(최신순, README 순서 그대로) */
function parseChangelog(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(HEAD);
    if (m) {
      cur = { v: m[1], date: m[2] || "", title: (m[3] || "").trim(), body: [] };
      out.push(cur);
      continue;
    }
    if (cur && (/^## /.test(line) || /^---\s*$/.test(line))) cur = null;
    if (cur) cur.body.push(line);
  }
  return out.map(({ v, date, title, body }) => {
    const blocks = parseBlocks(body);
    const parts = v.split(".").map(Number);
    return { v, date, title, auto: title ? undefined : fallbackTitle(blocks) || undefined, major: !(parts[2] > 0), blocks };
  });
}

function writeChangelog(root) {
  const md = fs.readFileSync(path.join(root, "README.md"), "utf8");
  const list = parseChangelog(md);
  fs.writeFileSync(path.join(root, "src", "changelog.json"), JSON.stringify(list) + "\n");
  console.log(`[changelog] 버전 ${list.length}개 (최신 v${list[0] ? list[0].v : "-"})`);
  return list;
}

module.exports = { parseChangelog, parseBlocks, writeChangelog };

if (require.main === module) writeChangelog(path.join(__dirname, ".."));

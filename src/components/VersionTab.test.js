import { createRoot } from "react-dom/client";
import { act } from "react";
import VersionTab, { groupLog } from "./VersionTab";
import LOG from "../changelog.json";
import pkg from "../../package.json";

const { parseChangelog, parseBlocks } = require("../../scripts/changelog");
const fs = require("fs");
const path = require("path");

test("changelog.json이 README.md 변경사항과 같음(빌드 전 자동 생성분이 최신)", () => {
  const md = fs.readFileSync(path.join(__dirname, "..", "..", "README.md"), "utf8");
  expect(LOG).toEqual(JSON.parse(JSON.stringify(parseChangelog(md))));
  expect(LOG[0].v).toBe(pkg.version);
  expect(LOG.length).toBeGreaterThan(80);
  expect(LOG[LOG.length - 1].v).toBe("2.2");
});

test("마크다운 블록 — 표·글머리(하위·이어지는 줄)·번호 목록·소제목·문단", () => {
  const b = parseBlocks([
    "| 구분 | 전 | 후 |",
    "|---|---|---|",
    "| 가 | **나** | `다` |",
    "",
    "문단 첫 줄",
    "둘째 줄",
    "- 항목1",
    "  - 하위",
    "  · 이어지는 줄",
    "- 항목2",
    "### 소제목",
    "1. 하나",
    "2. 둘",
  ]);
  expect(b[0]).toEqual({ t: "tbl", h: ["구분", "전", "후"], r: [["가", "**나**", "`다`"]] });
  expect(b[1]).toEqual({ t: "p", s: "문단 첫 줄 둘째 줄" });
  expect(b[2]).toEqual({ t: "ul", i: [{ s: "항목1", c: [{ s: "하위\n· 이어지는 줄" }] }, { s: "항목2" }] });
  expect(b[3]).toEqual({ t: "h", s: "소제목" });
  expect(b[4]).toEqual({ t: "ol", i: [{ s: "하나" }, { s: "둘" }] });
});

test("목차 묶음 — 가운데 번호별, 주요 버전 제목", () => {
  const g = groupLog(LOG);
  const g43 = g.find((x) => x.k === "2.43");
  expect(g43.items.map((x) => x.v).slice(-1)).toEqual(["2.43.0"]);
  expect(g43.title).toBe("업무자료 대조 점검 반영");
  expect(g.find((x) => x.k === "2.7").items.map((x) => x.v)).toEqual(["2.7.1", "2.7"]);
});

test("하나씩 펼치기·전체 펼치기·전체 접기", () => {
  const log = parseChangelog(
    "## v1.2.1 변경사항 (2026-01-02) — 둘\n| 구분 | 전 | 후 |\n|---|---|---|\n| 항목B | 이전 | 이후 |\n\n## v1.2.0 변경사항 (2026-01-01)\n- 첫 기능 **굵게**\n"
  );
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  act(() => root.render(<VersionTab log={log} />));
  const has = (t) => [...div.querySelectorAll(".vi-body")].some((b) => b.textContent.includes(t)); // 펼친 본문만
  const btn = (t) => [...div.querySelectorAll("button")].find((b) => b.textContent.trim() === t || b.textContent.includes(t));
  const click = (t) => act(() => btn(t).dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(has("항목B")).toBe(true); // 최신만 펼침
  expect(has("굵게")).toBe(false);
  click("전체 펼치기");
  expect(div.querySelector(".vi-body b").textContent).toBe("굵게");
  click("전체 접기");
  expect(has("항목B")).toBe(false);
  expect(has("굵게")).toBe(false);
  click("v1.2.0"); // 제목 줄(목차 칩은 v 없이 표시)
  expect(has("굵게")).toBe(true);
  expect(has("항목B")).toBe(false);
  // 목차: 누른 항목 바로 아래(목차 안)에 내용 표시
  const tocText = () => (div.querySelector(".vi-toc-body") || { textContent: "" }).textContent;
  const chip = [...div.querySelectorAll(".vi-chips button")].find((x) => x.textContent === "1.2.0");
  act(() => chip.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(tocText()).toContain("굵게");
  expect(tocText()).not.toContain("항목B");
  expect(chip.parentElement.parentElement.querySelector(".vi-toc-body")).not.toBeNull(); // 그 목차 줄 안
  act(() => div.querySelector(".vi-toc-t").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(tocText()).toContain("굵게");
  expect(tocText()).toContain("항목B"); // 묶음 제목 → 묶음 전체
  act(() => div.querySelector(".vi-toc-t").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(div.querySelector(".vi-toc-body")).toBeNull(); // 다시 누르면 닫힘
  act(() => root.unmount());
});

import { makeShareUrl, readShareHash } from "./share";

test("공유 링크 — 입력값 왕복", () => {
  const input = { action: "new", date: "2010-05-01", use: "2-1", area: "1234.5", gf: "5", bf: "1", floors: [{ level: -1, area: "300", windowless: true }], f: { x: 1 } };
  const url = makeShareUrl("existing", input, "https://hfls.vercel.app/");
  const hash = url.slice(url.indexOf("#"));
  expect(hash.startsWith("#share=e.")).toBe(true);
  expect(readShareHash(hash)).toEqual({ mode: "existing", input });
  expect(readShareHash("#share=n.@@@")).toBeNull();
  expect(readShareHash("#other")).toBeNull();
});

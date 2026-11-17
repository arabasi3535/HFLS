import fs from "fs";
import path from "path";
import { PRACTICE_GROUPS, practiceUrl } from "./practiceDocs";

test("실무 자료 11종 — 파일(PDF·미리보기)이 모두 있고 중복 없음", () => {
  const all = PRACTICE_GROUPS.flatMap((g) => g.items);
  expect(all).toHaveLength(11);
  expect(new Set(all.map((x) => x.f)).size).toBe(11);
  for (const it of all) {
    for (const ext of ["pdf", "webp"]) expect(fs.existsSync(path.join(__dirname, "../../public", practiceUrl(it.f, ext)))).toBe(true);
    expect(it.t && it.core).toBeTruthy();
  }
});

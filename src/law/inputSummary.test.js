import fs from "fs";
import path from "path";
import { floorRows, inputItems, _keys } from "./inputSummary";

test("입력 화면의 모든 세부 항목(setF)에 요약 라벨이 있음 — 새 입력 항목을 만들면 inputSummary.js에도 추가", () => {
  const src = fs.readFileSync(path.join(__dirname, "../components/Wizard.js"), "utf8");
  const keys = [...new Set([...src.matchAll(/setF\("(\w+)"/g)].map((m) => m[1]))];
  const known = new Set([...Object.keys(_keys.NUMS), ...Object.keys(_keys.PICKS), ...Object.keys(_keys.CHECKS)]);
  expect(keys.filter((k) => !known.has(k))).toEqual([]);
});

test("층별 바닥면적·무창층(위층부터), 입력·선택 사항(0·빈칸·미체크 생략)", () => {
  const input = {
    occ: "120",
    floors: [
      { level: -1, area: "500", windowless: false },
      { level: 1, area: "300", windowless: true },
      { level: 2, area: "", windowless: false },
    ],
    f: { parkingInside: "1200", ugParking: "0", mechCars: "", specialStairs: true, co2: false, clinicType: "dental" },
  };
  expect(floorRows(input)).toEqual([
    { name: "2층", area: "—", windowless: false },
    { name: "1층", area: "300㎡", windowless: true },
    { name: "지하 1층", area: "500㎡", windowless: false },
  ]);
  expect(inputItems(input)).toEqual(["수용인원 120명", "건물 내부 차고·주차장 합계 1,200㎡", "의원 종류: 치과의원", "특별피난계단·비상용(피난용) 승강기 승강장 있음"]);
  expect(floorRows({ floors: [{ level: 1, area: "" }] })).toEqual([]);
});

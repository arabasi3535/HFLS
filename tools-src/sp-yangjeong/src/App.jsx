import { useState, useMemo } from "react";

// ─── DATA TABLES ───────────────────────────────────────────────────────────────

const PIPE_DIAMETERS = [25, 32, 40, 50, 65, 80, 100, 125, 150, 200];

// Table 1-3-8(A) : 일반강관 JIS G 3452, 100m당 마찰손실수두(m)
const TABLE_A = {
  1:  [28.36,  8.10,   3.85,   1.19,   0.35,  0.15,  null,  null,  null, null],
  2:  [102.23, 29.19,  13.86,  4.30,   1.28,  0.55,  0.15,  null,  null, null],
  3:  [216.44, 61.81,  29.35,  9.11,   2.70,  1.16,  0.32,  0.11,  null, null],
  4:  [368.54, 105.25, 49.97,  15.51,  4.60,  1.98,  0.54,  0.19,  null, null],
  5:  [556.88, 159.04, 75.51,  23.43,  6.95,  3.00,  0.82,  0.29,  0.12, null],
  6:  [780.27, 222.83, 105.80, 32.83,  9.73,  4.20,  1.15,  0.40,  0.17, null],
  7:  [null,   296.37, 140.72, 43.66,  12.95, 5.58,  1.53,  0.53,  0.23, null],
  8:  [null,   379.42, 180.15, 55.90,  16.57, 7.15,  1.96,  0.68,  0.30, null],
  9:  [null,   471.79, 224.01, 69.50,  20.61, 8.89,  2.43,  0.85,  0.37, 0.10],
  10: [null,   573.32, 272.21, 84.46,  25.04, 10.80, 2.96,  1.03,  0.45, 0.12],
  11: [null,   683.87, 324.70, 100.75, 29.87, 12.88, 3.53,  1.23,  0.53, 0.14],
  12: [null,   803.31, 381.41, 118.35, 35.09, 15.13, 4.14,  1.44,  0.63, 0.16],
  13: [null,   931.53, 442.29, 137.23, 40.69, 17.55, 4.80,  1.67,  0.73, 0.19],
  14: [null,   null,   507.28, 157.40, 46.67, 20.13, 5.51,  1.92,  0.83, 0.22],
  15: [null,   null,   576.34, 178.83, 53.02, 22.87, 6.26,  2.18,  0.95, 0.25],
  16: [null,   null,   649.43, 201.51, 59.75, 25.77, 7.05,  2.45,  1.07, 0.28],
  17: [null,   null,   726.51, 225.42, 66.84, 28.82, 7.89,  2.74,  1.19, 0.31],
  18: [null,   null,   807.54, 250.57, 74.29, 32.04, 8.77,  3.05,  1.33, 0.34],
  19: [null,   null,   892.49, 276.92, 82.11, 35.41, 9.69,  3.37,  1.47, 0.38],
  20: [null,   null,   981.33, 304.49, 90.28, 38.93, 10.66, 3.71,  1.61, 0.42],
  21: [null,   null,   null,   333.25, 98.81, 42.61, 11.66, 4.06,  1.76, 0.46],
  22: [null,   null,   null,   363.20, 107.69,46.44, 12.71, 4.42,  1.92, 0.50],
  23: [null,   null,   null,   394.33, 116.92,50.42, 13.80, 4.80,  2.09, 0.54],
  24: [null,   null,   null,   426.64, 126.50,54.55, 14.93, 5.19,  2.26, 0.59],
  25: [null,   null,   null,   460.10, 136.42,58.83, 16.10, 5.60,  2.43, 0.63],
  26: [null,   null,   null,   494.73, 146.69,63.26, 17.31, 6.02,  2.62, 0.68],
  27: [null,   null,   null,   530.50, 157.29,67.83, 18.56, 6.46,  2.81, 0.73],
  28: [null,   null,   null,   567.43, 168.24,72.55, 19.86, 6.91,  3.00, 0.78],
  29: [null,   null,   null,   605.48, 179.53,77.42, 21.19, 7.37,  3.20, 0.83],
  30: [null,   null,   null,   644.68, 191.15,82.43, 22.56, 7.85,  3.41, 0.89],
};

// Table 1-3-8(B) : 압력배관 JIS G 3454(Sch.40), 100m당 마찰손실수두(m)
const TABLE_B = {
  1:  [30.45,  8.32,   4.03,   1.22,   0.41,  0.18,  null,  null,  null, null],
  2:  [109.76, 30.00,  14.53,  4.38,   1.48,  0.65,  0.17,  null,  null, null],
  3:  [232.39, 63.53,  30.76,  9.28,   3.12,  1.37,  0.37,  0.13,  null, null],
  4:  [395.69, 108.17, 52.38,  15.79,  5.32,  2.33,  0.62,  0.22,  null, null],
  5:  [597.92, 163.45, 79.15,  23.87,  8.04,  3.51,  0.94,  0.33,  0.14, null],
  6:  [837.76, 229.01, 110.90, 33.44,  11.26, 4.92,  1.32,  0.47,  0.20, null],
  7:  [null,   304.59, 147.50, 44.47,  14.97, 6.55,  1.76,  0.62,  0.26, null],
  8:  [null,   389.94, 188.83, 56.94,  19.17, 8.36,  2.25,  0.80,  0.34, null],
  9:  [null,   484.88, 234.80, 70.80,  23.84, 10.42, 2.80,  0.99,  0.42, 0.11],
  10: [null,   589.22, 285.33, 86.04,  28.97, 12.67, 3.40,  1.21,  0.51, 0.13],
  11: [null,   702.84, 340.34, 102.62, 34.55, 15.11, 4.06,  1.44,  0.61, 0.16],
  12: [null,   825.60, 399.79, 120.55, 40.59, 17.75, 4.77,  1.69,  0.72, 0.18],
  13: [null,   957.37, 463.60, 139.79, 47.07, 20.58, 5.53,  1.96,  0.83, 0.21],
  14: [null,   null,   531.72, 160.33, 53.98, 23.61, 6.34,  2.25,  0.95, 0.24],
  15: [null,   null,   604.11, 182.16, 61.33, 26.82, 7.20,  2.55,  1.08, 0.28],
  16: [null,   null,   680.72, 205.26, 69.11, 30.22, 8.12,  2.88,  1.22, 0.31],
  17: [null,   null,   761.51, 229.62, 77.31, 33.81, 9.08,  3.22,  1.36, 0.35],
  18: [null,   null,   846.45, 255.23, 85.94, 37.58, 10.09, 3.58,  1.52, 0.39],
  19: [null,   null,   935.49, 282.08, 94.98, 41.53, 11.16, 3.95,  1.67, 0.43],
  20: [null,   null,   null,   310.16, 104.43,45.67, 12.27, 4.34,  1.84, 0.47],
  21: [null,   null,   null,   339.46, 114.30,49.98, 13.42, 4.76,  2.02, 0.51],
  22: [null,   null,   null,   369.96, 124.57,54.47, 14.63, 5.18,  2.20, 0.56],
  23: [null,   null,   null,   401.67, 135.24,59.14, 15.89, 5.63,  2.38, 0.61],
  24: [null,   null,   null,   434.58, 146.32,63.98, 17.19, 6.09,  2.58, 0.66],
  25: [null,   null,   null,   468.67, 157.80,69.00, 18.53, 6.57,  2.78, 0.71],
  26: [null,   null,   null,   503.94, 169.68,74.20, 19.93, 7.06,  2.99, 0.76],
  27: [null,   null,   null,   540.38, 181.96,79.56, 21.37, 7.57,  3.21, 0.82],
  28: [null,   null,   null,   577.99, 194.61,85.10, 22.86, 8.10,  3.43, 0.88],
  29: [null,   null,   null,   616.76, 207.68,90.81, 24.39, 8.64,  3.66, 0.93],
  30: [null,   null,   null,   656.68, 221.11,96.69, 25.97, 9.20,  3.90, 0.99],
};

// Table 1-3-9 : 관 부속 및 밸브류 상당 직관장(m)
// key: diameter, value: [90엘보, 45엘보, 분류T, 직류T, 게이트밸브, 볼밸브, 앵글밸브, 체크밸브]
const TABLE_9 = {
  25:  [0.90, 0.54, 1.50,  0.27, 0.18, 7.5,  4.5,  2.0],
  32:  [1.20, 0.72, 1.80,  0.36, 0.24, 10.5, 5.4,  2.5],
  40:  [1.50, 0.90, 2.10,  0.45, 0.30, 13.5, 6.5,  3.1],
  50:  [2.10, 1.20, 3.00,  0.60, 0.39, 16.5, 8.4,  4.0],
  65:  [2.40, 1.50, 3.60,  0.75, 0.48, 19.5, 10.2, 4.6],
  80:  [3.00, 1.80, 4.50,  0.90, 0.63, 24.0, 12.0, 5.7],
  100: [4.20, 2.40, 6.30,  1.20, 0.81, 37.5, 16.5, 7.6],
  125: [5.10, 3.00, 7.50,  1.50, 0.99, 42.0, 21.0, 10.0],
  150: [6.00, 3.60, 9.00,  1.80, 1.20, 49.5, 24.0, 12.0],
  200: [6.50, 3.70, 14.00, 4.00, 1.40, 70.0, 33.0, 15.0],
};

const FITTING_NAMES = ["90° 엘보", "45° 엘보", "분류 티(T)", "직류 티(T)", "게이트밸브", "볼밸브", "앵글밸브", "체크밸브"];

// 표 1-3-9 (주) 기준 동일 적용 항목
const FITTING_ALIASES = [
  "",                              // 90° 엘보
  "리듀서 포함",                    // 45° 엘보
  "",                              // 분류 티
  "커플링 포함",                    // 직류 티
  "",                              // 게이트밸브
  "오토밸브·글로브밸브 포함",        // 볼밸브
  "알람밸브·풋밸브·스트레이너 포함", // 앵글밸브
  "",                              // 체크밸브
];

function getTableValue(heads, diamIdx, pipeType) {
  const tbl = pipeType === "A" ? TABLE_A : TABLE_B;
  const row = tbl[heads];
  if (!row) return null;
  return row[diamIdx] ?? null;
}

let segId = 0;
const newSeg = (diam = 50) => ({
  id: ++segId,
  diameter: diam,
  pipeType: "A",
  headCount: 10,
  pipeLength: "",
  fittings: FITTING_NAMES.map(() => ""),
});

// ─── COMPONENTS ────────────────────────────────────────────────────────────────

function Badge({ children, color = "orange" }) {
  const cls = color === "orange"
    ? "bg-orange-500 text-white"
    : color === "blue"
    ? "bg-blue-600 text-white"
    : "bg-gray-600 text-white";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${cls}`}>
      {children}
    </span>
  );
}

function SectionCard({ step, title, sub, children }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 overflow-hidden shadow-xl mb-6">
      <div className="flex items-center gap-3 px-5 py-4 bg-gray-800 border-b border-gray-700">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-sm">
          {step}
        </div>
        <div>
          <div className="text-white font-bold text-base leading-tight">{title}</div>
          {sub && <div className="text-gray-400 text-xs mt-0.5">{sub}</div>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function NumInput({ label, unit, value, onChange, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-gray-400 text-xs font-semibold tracking-wide uppercase">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="any"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-36 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-orange-500 transition-colors"
          placeholder="0"
        />
        {unit && <span className="text-gray-400 text-sm font-mono">{unit}</span>}
      </div>
      {hint && <div className="text-gray-500 text-xs">{hint}</div>}
    </div>
  );
}

function ResultRow({ label, value, unit, highlight }) {
  return (
    <div className={`flex items-center justify-between py-2 px-4 rounded-lg ${highlight ? "bg-orange-500/10 border border-orange-500/30" : "bg-gray-800"}`}>
      <span className={`text-sm ${highlight ? "text-orange-300 font-semibold" : "text-gray-300"}`}>{label}</span>
      <span className={`font-mono font-bold ${highlight ? "text-orange-400 text-lg" : "text-white text-base"}`}>
        {value != null && !isNaN(value) ? Number(value).toFixed(3) : "—"} <span className="text-xs font-normal">{unit}</span>
      </span>
    </div>
  );
}

// ─── PIPE SEGMENT ──────────────────────────────────────────────────────────────

function PipeSegment({ seg, segNum, onChange, onRemove }) {
  const { pipeType, headCount, diameter } = seg;
  const diamIdx = PIPE_DIAMETERS.indexOf(diameter);
  const hc = Math.max(1, Math.min(30, parseInt(headCount) || 0));
  const tableVal = hc >= 1 && hc <= 30 ? getTableValue(hc, diamIdx, pipeType) : null;

  const fittingEqLen = seg.fittings.reduce((sum, qty, i) => {
    const q = parseFloat(qty) || 0;
    const eqLen = TABLE_9[diameter]?.[i] ?? 0;
    return sum + q * eqLen;
  }, 0);

  const pipeLen = parseFloat(seg.pipeLength) || 0;
  const totalEqLen = pipeLen + fittingEqLen;
  const frictionLoss = tableVal != null ? (totalEqLen / 100) * tableVal : null;
  const flowRate = hc * 80;

  return (
    <div className="border border-gray-700 rounded-xl bg-gray-800/50 overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 text-xs font-bold">
            {segNum}
          </div>
          <span className="text-orange-400 font-bold font-mono text-sm">φ{diameter}mm</span>
          <span className="text-gray-500 text-xs">배관 구간</span>
          {tableVal == null && hc > 0 && (
            <Badge color="gray">해당 관경 사용불가</Badge>
          )}
        </div>
        <button
          onClick={onRemove}
          className="text-gray-500 hover:text-red-400 transition-colors text-lg leading-none"
        >✕</button>
      </div>

      <div className="p-4 grid grid-cols-1 gap-4">

        {/* ① 배관 종류 + 헤드 개수 — 구간별 설정 */}
        <div className="flex flex-wrap gap-4 items-end p-3 bg-gray-900 rounded-xl border border-gray-700">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide w-full mb-1">
            ① 이 구간 설정
          </div>

          {/* 배관 종류 */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs font-semibold">배관 종류</label>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ ...seg, pipeType: "A" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  pipeType === "A"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                일반강관
                <div className="text-xs font-normal opacity-75">JIS G 3452</div>
              </button>
              <button
                onClick={() => onChange({ ...seg, pipeType: "B" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  pipeType === "B"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                압력배관
                <div className="text-xs font-normal opacity-75">Sch.40</div>
              </button>
            </div>
          </div>

          {/* 헤드 개수 */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs font-semibold">헤드 개수</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={headCount}
                onChange={e => {
                  const v = Math.max(1, Math.min(30, parseInt(e.target.value) || 1));
                  onChange({ ...seg, headCount: v });
                }}
                className="w-20 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
              />
              <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs">
                <span className="text-gray-500">토출량</span>
                <span className="text-yellow-400 font-mono font-bold ml-1">{flowRate} Lpm</span>
              </div>
            </div>
            <div className="text-gray-600 text-xs">1~30개 (1개당 80 Lpm)</div>
          </div>
        </div>

        {/* ② 관경 + 직관 길이 */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">② 관경 선택</label>
            <select
              value={diameter}
              onChange={e => onChange({ ...seg, diameter: Number(e.target.value) })}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-orange-500"
            >
              {PIPE_DIAMETERS.map(d => (
                <option key={d} value={d}>{d}mm</option>
              ))}
            </select>
          </div>
          <NumInput
            label="직관 배관 길이"
            unit="m"
            value={seg.pipeLength}
            onChange={v => onChange({ ...seg, pipeLength: v })}
          />
        </div>

        {/* ③ 부속류 및 밸브류 */}
        <div>
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">③ 부속류 및 밸브류 수량 (개)</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FITTING_NAMES.map((name, i) => (
              <div key={i} className="flex flex-col gap-1">
                <label className="text-gray-500 text-xs font-semibold" title={name}>{name}</label>
                {FITTING_ALIASES[i] && (
                  <span className="text-yellow-600 text-xs leading-tight">= {FITTING_ALIASES[i]}</span>
                )}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={seg.fittings[i]}
                    onChange={e => {
                      const newFit = [...seg.fittings];
                      newFit[i] = e.target.value;
                      onChange({ ...seg, fittings: newFit });
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    placeholder="0"
                  />
                  <span className="text-gray-500 text-xs whitespace-nowrap">
                    ×{TABLE_9[diameter]?.[i]?.toFixed(2)}m
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 표 1-3-9 (주) 안내 박스 */}
          <div className="mt-3 bg-gray-900 border border-gray-700 rounded-lg p-3">
            <div className="text-gray-500 text-xs font-semibold mb-2">📋 표 1-3-9 (주) — 동일 적용 기준</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-400">
              <div>• <span className="text-yellow-500 font-semibold">리듀서</span> → 45° 엘보와 같이 적용</div>
              <div>• <span className="text-yellow-500 font-semibold">커플링</span> → 직류 티(T)와 같이 적용</div>
              <div>• <span className="text-yellow-500 font-semibold">오토밸브 · 글로브밸브</span> → 볼밸브와 같이 적용</div>
              <div>• <span className="text-yellow-500 font-semibold">알람밸브 · 풋밸브 · 스트레이너</span> → 앵글밸브와 같이 적용</div>
              <div className="sm:col-span-2 text-gray-600 mt-1">※ 엘보·티는 나사접합 기준 / 유니온·플랜지·소켓은 손실 미소하여 생략</div>
            </div>
          </div>
        </div>

        {/* 구간 계산 결과 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-700">
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-gray-500 text-xs mb-1">직관 길이</div>
            <div className="text-white font-mono font-bold">{pipeLen.toFixed(2)} m</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-gray-500 text-xs mb-1">부속 등가길이</div>
            <div className="text-blue-400 font-mono font-bold">{fittingEqLen.toFixed(2)} m</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-gray-500 text-xs mb-1">총 등가길이</div>
            <div className="text-yellow-400 font-mono font-bold">{totalEqLen.toFixed(2)} m</div>
          </div>
          <div className={`rounded-lg p-3 ${frictionLoss != null ? "bg-orange-500/10 border border-orange-500/20" : "bg-gray-900"}`}>
            <div className="text-gray-500 text-xs mb-1">구간 마찰손실</div>
            {frictionLoss != null ? (
              <div className="text-orange-400 font-mono font-bold">{frictionLoss.toFixed(3)} m</div>
            ) : (
              <div className="text-gray-600 font-mono text-xs">—</div>
            )}
          </div>
        </div>

        {/* 계산식 */}
        {tableVal != null && (
          <div className="text-gray-500 text-xs font-mono bg-gray-900 rounded p-2">
            표1-3-8({pipeType}) [{hc}개/{flowRate}Lpm, φ{diameter}mm] = {tableVal} m/100m
            &nbsp;→&nbsp; {totalEqLen.toFixed(2)}m ÷ 100 × {tableVal} = <span className="text-orange-400">{frictionLoss?.toFixed(3)} m</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────

export default function App() {
  // H1 inputs
  const [dischargeHead, setDischargeHead] = useState(""); // 토출실양정 (m)
  const [suctionMode, setSuctionMode] = useState("direct"); // "direct" | "mmhg"
  const [suctionDirect, setSuctionDirect] = useState(""); // m
  const [suctionMmhg, setSuctionMmhg] = useState(""); // mmHg (연성계)

  // H2 inputs
  const [segments, setSegments] = useState([newSeg(50)]);

  // 전동기 출력
  const [pumpEff, setPumpEff] = useState("0.65");
  const [transCoef, setTransCoef] = useState("1.1");

  // 수원 용량
  const [useRoofTank, setUseRoofTank] = useState(false);

  // ── Computed values ──────────────────────────────────────────────────────────
  const suctionHead = useMemo(() => {
    if (suctionMode === "direct") return parseFloat(suctionDirect) || 0;
    const mmhg = parseFloat(suctionMmhg) || 0;
    return mmhg * (133.322 / 9806.65);
  }, [suctionMode, suctionDirect, suctionMmhg]);

  const H1 = useMemo(() => {
    const dh = parseFloat(dischargeHead) || 0;
    return dh + suctionHead;
  }, [dischargeHead, suctionHead]);

  const segResults = useMemo(() => {
    return segments.map(seg => {
      const hc = Math.max(1, Math.min(30, parseInt(seg.headCount) || 0));
      const diamIdx = PIPE_DIAMETERS.indexOf(seg.diameter);
      const tableVal = hc >= 1 && hc <= 30
        ? getTableValue(hc, diamIdx, seg.pipeType)
        : null;
      const fittingEqLen = seg.fittings.reduce((sum, qty, i) => {
        const q = parseFloat(qty) || 0;
        const eqLen = TABLE_9[seg.diameter]?.[i] ?? 0;
        return sum + q * eqLen;
      }, 0);
      const pipeLen = parseFloat(seg.pipeLength) || 0;
      const totalEqLen = pipeLen + fittingEqLen;
      const frictionLoss = tableVal != null ? (totalEqLen / 100) * tableVal : null;
      return { seg, tableVal, fittingEqLen, pipeLen, totalEqLen, frictionLoss };
    });
  }, [segments]);

  const H2 = useMemo(() => {
    return segResults.reduce((sum, r) => sum + (r.frictionLoss ?? 0), 0);
  }, [segResults]);

  const H_total = H1 + H2 + 10;
  // 펌프 토출량 = 가장 많은 헤드수 구간 기준
  const maxHeadCount = segments.reduce((m, s) => Math.max(m, parseInt(s.headCount) || 0), 0);
  const flowRate = maxHeadCount * 80;

  // 전동기 출력  P(kW) = 0.163 × Q(m³/min) × H(m) / η × K
  const Q_m3min = flowRate / 1000;  // Lpm → m³/min
  const eta = parseFloat(pumpEff) || 1;
  const K = parseFloat(transCoef) || 1;
  const motorPower = (0.163 * Q_m3min * H_total / eta) * K;

  // 수원 용량
  const waterVolL = flowRate * 20;          // L (Lpm × 20min)
  const waterVolM3 = waterVolL / 1000;      // m³
  const roofTankM3 = waterVolM3 / 3;        // 옥상수조 = 수원의 1/3

  const addSegment = () => setSegments(prev => [...prev, newSeg(50)]);
  const removeSegment = (id) => setSegments(prev => prev.filter(s => s.id !== id));
  const updateSegment = (id, updated) =>
    setSegments(prev => prev.map(s => s.id === id ? updated : s));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Header ── */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white text-lg">🔥</div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                스프링클러 펌프 양정 계산기
              </h1>
              <p className="text-gray-500 text-xs mt-0.5">
                NFPC 103 · NFTC 103 기준 &nbsp;|&nbsp; 표 1-3-8(A/B) · 표 1-3-9 내장
              </p>
            </div>
            <div className="ml-auto flex gap-2">
              <Badge color="orange">안동소방서 이제현</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── STEP 1 : H1 ── */}
        <SectionCard
          step="1"
          title="H₁ · 건물높이의 실양정 (낙차 및 흡입수두)"
          sub="토출실양정 + 흡입실양정"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* 토출실양정 */}
            <div className="space-y-3">
              <div className="text-gray-300 text-sm font-semibold">① 토출 실양정</div>
              <NumInput
                label="펌프 중심 → 최상층 헤드 수직거리"
                unit="m"
                value={dischargeHead}
                onChange={setDischargeHead}
                hint="건물 높이 (실양정)"
              />
              <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
                최고위 말단 헤드 ~ 펌프축 중심까지의 수직거리
              </div>
            </div>

            {/* 흡입실양정 */}
            <div className="space-y-3">
              <div className="text-gray-300 text-sm font-semibold">② 흡입 실양정</div>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setSuctionMode("direct")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    suctionMode === "direct"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  직접 입력 (m)
                </button>
                <button
                  onClick={() => setSuctionMode("mmhg")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    suctionMode === "mmhg"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  연성계 (mmHg)
                </button>
              </div>

              {suctionMode === "direct" ? (
                <NumInput
                  label="흡수면 → 펌프축 중심 수직거리"
                  unit="m"
                  value={suctionDirect}
                  onChange={setSuctionDirect}
                />
              ) : (
                <div className="space-y-2">
                  <NumInput
                    label="연성계 게이지 읽음값"
                    unit="mmHg"
                    value={suctionMmhg}
                    onChange={setSuctionMmhg}
                  />
                  <div className="bg-gray-800 rounded-lg p-2 text-xs font-mono text-gray-400">
                    환산: {(parseFloat(suctionMmhg) || 0).toFixed(1)} mmHg
                    &nbsp;×&nbsp;0.01360 =&nbsp;
                    <span className="text-blue-400">{suctionHead.toFixed(4)} m</span>
                  </div>
                </div>
              )}
              <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
                흡수면 ~ 펌프축 중심까지 수직거리 (연성계 사용 시 자동환산)
              </div>
            </div>
          </div>

          {/* H1 결과 */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-gray-500 text-xs mb-1">토출 실양정</div>
              <div className="text-white font-mono font-bold">{(parseFloat(dischargeHead)||0).toFixed(3)} m</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-gray-500 text-xs mb-1">흡입 실양정</div>
              <div className="text-blue-400 font-mono font-bold">{suctionHead.toFixed(3)} m</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
              <div className="text-orange-300 text-xs font-semibold mb-1">H₁ = 토출 + 흡입</div>
              <div className="text-orange-400 font-mono font-bold text-lg">{H1.toFixed(3)} m</div>
            </div>
          </div>
        </SectionCard>

        {/* ── STEP 2 : H2 ── */}
        <SectionCard
          step="2"
          title="H₂ · 배관의 마찰손실수두"
          sub="구간별로 배관 종류·헤드개수·관경을 각각 설정"
        >
          {/* 배관 구간 목록 */}
          {segments.map((seg, i) => (
            <PipeSegment
              key={seg.id}
              seg={seg}
              segNum={i + 1}
              onChange={updated => updateSegment(seg.id, updated)}
              onRemove={() => removeSegment(seg.id)}
            />
          ))}

          <button
            onClick={addSegment}
            className="w-full border-2 border-dashed border-gray-700 hover:border-orange-500 rounded-xl py-3 text-gray-500 hover:text-orange-400 text-sm font-semibold transition-colors"
          >
            + 배관 구간 추가
          </button>

          {/* H2 집계 */}
          <div className="mt-5 pt-5 border-t border-gray-700">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">구간별 마찰손실 집계</div>
            <div className="space-y-2 mb-4">
              {segResults.map((r, i) => (
                <div key={r.seg.id} className="flex items-center justify-between text-sm bg-gray-800 rounded-lg px-4 py-2">
                  <span className="text-gray-400 font-mono">
                    구간{i+1} &nbsp;φ{r.seg.diameter}mm
                    &nbsp;<span className="text-gray-600 text-xs">
                      ({r.seg.pipeType === "A" ? "일반강관" : "압력배관"} / {r.seg.headCount}개 / 등가길이 {r.totalEqLen.toFixed(2)}m)
                    </span>
                  </span>
                  <span className={`font-mono font-bold ${r.frictionLoss != null ? "text-white" : "text-gray-600"}`}>
                    {r.frictionLoss != null ? `${r.frictionLoss.toFixed(3)} m` : "계산불가"}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-orange-300 font-semibold">H₂ (마찰손실수두 합계)</span>
              <span className="text-orange-400 font-mono font-bold text-lg">{H2.toFixed(3)} m</span>
            </div>
          </div>
        </SectionCard>

        {/* ── STEP 3 : 결과 ── */}
        <SectionCard
          step="3"
          title="최종 양정 H = H₁ + H₂ + 10m"
          sub="펌프 선정을 위한 최소 양정"
        >
          <div className="space-y-2">
            <ResultRow label="H₁ · 건물높이의 실양정" value={H1} unit="m" />
            <ResultRow label="H₂ · 배관의 마찰손실수두" value={H2} unit="m" />
            <div className="flex items-center justify-between py-2 px-4 rounded-lg bg-gray-800">
              <span className="text-sm text-gray-300">헤드 방사압력 (고정값)</span>
              <span className="font-mono font-bold text-white text-base">10.000 <span className="text-xs font-normal">m</span></span>
            </div>
            <div className="h-px bg-gray-700 my-2" />
            <div className="flex items-center justify-between py-4 px-5 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/10 border border-orange-500/50">
              <div>
                <div className="text-orange-200 font-bold text-base">H = H₁ + H₂ + 10</div>
                <div className="text-orange-300/70 font-mono text-sm mt-0.5">
                  = {H1.toFixed(3)} + {H2.toFixed(3)} + 10.000
                </div>
              </div>
              <div className="text-right">
                <div className="text-orange-300 text-xs mb-1 font-semibold">펌프 최소 양정</div>
                <div className="text-orange-400 font-mono font-black text-3xl">
                  {H_total.toFixed(2)}<span className="text-base font-normal ml-1">m</span>
                </div>
              </div>
            </div>
          </div>

          {/* 계산식 요약 */}
          <div className="mt-5 bg-gray-900 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">계산식 요약</div>
            <div className="font-mono text-xs text-gray-400 space-y-1">
              <div>H(m) = H₁ + H₂ + 10 &nbsp;&nbsp;[식 1-3-3]</div>
              <div className="text-gray-600">─────────────────────────────</div>
              <div>
                H₁ = 토출실양정 + 흡입실양정
                &nbsp;= {(parseFloat(dischargeHead)||0).toFixed(3)} + {suctionHead.toFixed(3)}
                &nbsp;= <span className="text-blue-400">{H1.toFixed(3)} m</span>
              </div>
              <div>
                H₂ = Σ(등가길이 ÷ 100 × 100m당손실수두)
                &nbsp;= <span className="text-yellow-400">{H2.toFixed(3)} m</span>
              </div>
              <div>
                H = {H1.toFixed(3)} + {H2.toFixed(3)} + 10
                &nbsp;= <span className="text-orange-400 font-bold">{H_total.toFixed(2)} m</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-500 text-xs">최대 헤드 개수 (기준)</div>
              <div className="text-white font-mono font-bold">{maxHeadCount} 개</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-500 text-xs">펌프 토출량 (Q)</div>
              <div className="text-white font-mono font-bold">{flowRate} Lpm</div>
            </div>
          </div>
        </SectionCard>

        {/* ── STEP 4 : 전동기 출력 + 수원 용량 ── */}
        <SectionCard
          step="4"
          title="전동기 출력 및 수원 용량"
          sub="펌프 동력 산출 · 수원 및 옥상수조 용량 산정"
        >
          {/* ── 전동기 출력 ── */}
          <div className="mb-6">
            <div className="text-gray-300 text-sm font-semibold mb-3">① 전동기 출력 산출</div>
            <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-gray-400 mb-4">
              P(kW) = 0.163 × Q(m³/min) × H(m) ÷ η × K
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
              {/* 펌프 효율 */}
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-2">
                  펌프 효율 η
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {["0.45","0.50","0.55","0.60","0.65","0.70","0.75","0.80"].map(v => (
                    <button key={v} onClick={() => setPumpEff(v)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                        pumpEff === v ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >{v}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.01" min="0.1" max="1.0"
                    value={pumpEff}
                    onChange={e => setPumpEff(e.target.value)}
                    className="w-24 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-gray-400 text-sm">직접 입력 가능</span>
                </div>
              </div>

              {/* 전달계수 */}
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-2">
                  전달계수 K
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    { label: "직결 1.1", val: "1.1" },
                    { label: "V벨트 1.2", val: "1.2" },
                    { label: "기어 1.15", val: "1.15" },
                  ].map(o => (
                    <button key={o.val} onClick={() => setTransCoef(o.val)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        transCoef === o.val ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >{o.label}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.01" min="1.0" max="2.0"
                    value={transCoef}
                    onChange={e => setTransCoef(e.target.value)}
                    className="w-24 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-gray-400 text-sm">직접 입력 가능</span>
                </div>
              </div>
            </div>

            {/* 전동기 출력 결과 */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-gray-500 text-xs mb-1">Q (m³/min)</div>
                <div className="text-white font-mono font-bold">{Q_m3min.toFixed(4)}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-gray-500 text-xs mb-1">H (m)</div>
                <div className="text-white font-mono font-bold">{H_total.toFixed(3)}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-gray-500 text-xs mb-1">η × K</div>
                <div className="text-white font-mono font-bold">{eta.toFixed(2)} × {K.toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-blue-200 font-bold text-sm">전동기 출력 P</div>
                <div className="text-blue-300/70 font-mono text-xs mt-1">
                  = 0.163 × {Q_m3min.toFixed(4)} × {H_total.toFixed(2)} ÷ {eta.toFixed(2)} × {K.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-blue-400 font-mono font-black text-3xl">
                  {motorPower.toFixed(2)}<span className="text-base font-normal ml-1">kW</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-700 mb-6" />

          {/* ── 수원 용량 ── */}
          <div>
            <div className="text-gray-300 text-sm font-semibold mb-3">② 수원 용량 산정</div>
            <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-gray-400 mb-4">
              수원(L) = Q(Lpm) × 20min &nbsp;|&nbsp; 옥상수조 = 수원 × 1/3
            </div>

            {/* 수원 기준값 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-gray-500 text-xs mb-1">펌프 토출량 Q</div>
                <div className="text-white font-mono font-bold">{flowRate} Lpm</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-gray-500 text-xs mb-1">방사 시간</div>
                <div className="text-white font-mono font-bold">20 min</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-gray-500 text-xs mb-1">수원 (L)</div>
                <div className="text-yellow-400 font-mono font-bold">{waterVolL.toLocaleString()} L</div>
              </div>
            </div>

            {/* 주수원 */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-4 flex items-center justify-between mb-3">
              <div>
                <div className="text-green-200 font-bold text-sm">주수원 용량</div>
                <div className="text-green-300/70 font-mono text-xs mt-1">
                  = {flowRate} Lpm × 20 min = {waterVolL.toLocaleString()} L
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-mono font-black text-2xl">
                  {waterVolM3.toFixed(2)}<span className="text-base font-normal ml-1">m³</span>
                </div>
              </div>
            </div>

            {/* 옥상수조 선택 */}
            <div className="border border-gray-700 rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3 bg-gray-800 cursor-pointer select-none"
                onClick={() => setUseRoofTank(v => !v)}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                  useRoofTank ? "bg-orange-500 border-orange-500" : "border-gray-500"
                }`}>
                  {useRoofTank && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">옥상수조 포함 (선택)</div>
                  <div className="text-gray-500 text-xs">NFPC 103 제4조 2항 — 주수원의 1/3 이상</div>
                </div>
              </div>

              {useRoofTank && (
                <div className="p-4 bg-orange-500/5 border-t border-gray-700">
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-orange-200 font-bold text-sm">옥상수조 용량</div>
                      <div className="text-orange-300/70 font-mono text-xs mt-1">
                        = {waterVolM3.toFixed(2)} m³ ÷ 3 = {roofTankM3.toFixed(2)} m³ (주수원의 1/3)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-orange-400 font-mono font-black text-2xl">
                        {roofTankM3.toFixed(2)}<span className="text-base font-normal ml-1">m³</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-gray-500 text-xs mb-1">주수원 + 옥상수조 합계</div>
                      <div className="text-white font-mono font-bold">
                        {(waterVolM3 + roofTankM3).toFixed(2)} m³
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="text-gray-500 text-xs mb-1">옥상수조 비율</div>
                      <div className="text-orange-400 font-mono font-bold">1/3 ({(roofTankM3/waterVolM3*100).toFixed(1)}%)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Footer */}
        <div className="text-center text-gray-600 text-xs py-4">
          NFPC 103 / NFTC 103 스프링클러설비 · 표 1-3-8(A/B) · 표 1-3-9 기준<br/>
          소방설비기사 기계분야 실기 대비용 · 실무 참고용
        </div>
      </div>
    </div>
  );
}

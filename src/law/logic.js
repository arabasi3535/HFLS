// ============================================================
// 3값 논리(true / false / null=판단불가) 헬퍼와 입력값 파생 계산
// null 은 "입력 부족으로 판정 불가" → 결과에서 [확인 필요]로 표시
// ============================================================

export const T = true;
export const F = false;
export const U = null;

/** 범위값 {lo, hi}: 층별 면적 일부 미입력 시 연면적으로 상·하한을 잡은 값 (hi=null: 상한 불명) */
export const isRange = (a) => a !== null && typeof a === "object" && "lo" in a;

/** a >= t (a 가 null 이면 null, 범위값이면 하한·상한으로 판정) */
export function ge(a, t) {
  if (isRange(a)) {
    if (a.lo >= t) return T;
    if (a.hi !== null && a.hi < t) return F;
    return U;
  }
  if (a === null || a === undefined || a === "" || Number.isNaN(a)) return U;
  return Number(a) >= t;
}
/** a < t */
export function lt(a, t) {
  const r = ge(a, t);
  return r === U ? U : !r;
}
/** a >= lo && a < hi */
export function between(a, lo, hi) {
  return and(ge(a, lo), lt(a, hi));
}
export function not(a) {
  return a === U ? U : !a;
}
/** 하나라도 true → true, 전부 false → false, 그 외 null */
export function or(...xs) {
  let unknown = false;
  for (const x of xs) {
    if (x === true) return T;
    if (x === U || x === undefined) unknown = true;
  }
  return unknown ? U : F;
}
/** 하나라도 false → false, 전부 true → true, 그 외 null */
export function and(...xs) {
  let unknown = false;
  for (const x of xs) {
    if (x === false) return F;
    if (x === U || x === undefined) unknown = true;
  }
  return unknown ? U : T;
}
/** 불리언 플래그: 미입력(undefined/null) → null */
export function flag(v) {
  if (v === true) return T;
  if (v === false) return F;
  return U;
}

export function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const fmt = (n) => {
  if (isRange(n)) return n.hi === null ? "일부 미입력" : `일부 미입력(최대 ${Number(n.hi).toLocaleString("ko-KR")})`;
  return n === null || n === undefined ? "미입력" : Number(n).toLocaleString("ko-KR");
};
export { fmt };

/**
 * 입력 건축물(b)로부터 판정에 쓰는 파생값(x)을 계산
 * floors: [{ level: -2|-1|1|2..., area, windowless }]
 */
export function derive(b, u) {
  const ug_ = (k) => !!u && u.g.includes(k);
  const floors = Array.isArray(b.floors) ? b.floors : [];
  const area = num(b.area);
  const gf = num(b.gf) ?? 0;
  const bf = num(b.bf) ?? 0;
  const fa = (f) => num(f.area);

  const ug = floors.filter((f) => f.level < 0);
  const above = floors.filter((f) => f.level > 0);
  const wl = above.filter((f) => f.windowless);

  const sum = (list) => {
    if (!list.length) return 0;
    let s = 0;
    for (const f of list) {
      const a = fa(f);
      if (a === null) return null;
      s += a;
    }
    return s;
  };
  // 미입력 층이 가질 수 있는 최대 면적 = 연면적 − 입력된 층 면적 합 (연면적 미입력이면 상한 불명)
  const knownAll = floors.reduce((s, f) => s + (fa(f) ?? 0), 0);
  const slack = area === null ? null : Math.max(0, area - knownAll);
  /** 합계: 모두 입력 → 숫자, 일부 미입력 → {lo, hi} 범위 */
  const sumR = (list) => {
    if (!list.length) return 0;
    const exact = sum(list);
    if (exact !== null) return exact;
    const lo = list.reduce((s, f) => s + (fa(f) ?? 0), 0);
    return { lo, hi: slack === null ? null : lo + slack };
  };
  /** 조건(pred)을 만족하는 층 중 바닥면적 t 이상인 층이 있는가 (3값) */
  const anyFloorGE = (pred, t) => {
    const list = floors.filter(pred);
    if (!list.length) return F;
    let unknown = false;
    for (const f of list) {
      const a = fa(f);
      if (a === null) {
        if (slack === null || slack >= t) unknown = true; // 연면적상 t 이상이 불가능하면 '아님'
      } else if (a >= t) return T;
    }
    return unknown ? U : F;
  };
  const maxOf = (pred) => {
    const list = floors.filter(pred);
    let m = 0;
    for (const f of list) {
      const a = fa(f);
      if (a === null) return null;
      m = Math.max(m, a);
    }
    return m;
  };

  const ugSum = bf > 0 ? sumR(ug) : 0;
  const f12 = sumR(above.filter((f) => f.level === 1 || f.level === 2));
  const wlSum = sumR(wl);
  const ugWlSum = sumR(floors.filter((f) => (f.level < 0 && bf > 0) || f.windowless));
  const aboveSum = sumR(above);
  const floorSum = sum(floors);
  const useArea = num(b.useArea) ?? area; // 해당 용도 바닥면적 합계(미입력 시 연면적으로 간주)

  return {
    area,
    gf,
    bf,
    totalFloors: gf + bf, // 지하층을 포함한 층수
    // 수용인원: 미입력 시 시행령 별표7 제2호(강의실 등 ÷1.9㎡, 그 밖 ÷3㎡)로 상한 산정
    //  — 의자·침대 기준 용도(문화집회·종교·운동·숙박·숙박형 수련시설)는 상한을 잡지 않음
    occ:
      num(b.occ) !== null
        ? num(b.occ)
        : useArea !== null && !["culture", "religion", "sports", "lodging", "training_lodge"].some(ug_)
        ? { lo: 0, hi: Math.floor(useArea / 1.9) }
        : null,
    occEstimated: num(b.occ) === null,
    useArea,
    useAreaAssumed: num(b.useArea) === null,
    ugSum, // 지하층 바닥면적 합계
    f12, // 지상 1·2층 바닥면적 합계
    wlSum, // 무창층 바닥면적 합계
    ugWlSum, // 지하층+무창층 바닥면적 합계
    aboveSum, // 지상층 바닥면적 합계
    floorSum,
    hasWindowless: wl.length > 0,
    ugOrWlMax: maxOf((f) => f.level < 0 || f.windowless),
    anyFloorGE,
    ugOrWlGE: (t) => anyFloorGE((f) => f.level < 0 || f.windowless, t),
    ugOrWlNoCattleGE: (t) => anyFloorGE((f) => f.level < 0 || f.windowless, t),
    upper4GE: (t) => anyFloorGE((f) => f.level >= 4, t),
    ugWlOrUpper4GE: (t) => anyFloorGE((f) => f.level < 0 || f.windowless || f.level >= 4, t),
    anyFloorAnyGE: (t) => anyFloorGE(() => true, t),
    floorsComplete: floors.length > 0 && floors.every((f) => fa(f) !== null),
  };
}

/** 입력 간 불일치 점검 (판정 전에 먼저 알림) */
export function consistencyIssues(b, x) {
  const issues = [];
  if (x.area !== null && x.floorSum !== null && x.floorSum > 0) {
    const diff = Math.abs(x.floorSum - x.area);
    if (diff > Math.max(1, x.area * 0.01)) {
      issues.push(
        `층별 바닥면적 합계(${fmt(x.floorSum)}㎡)와 연면적(${fmt(x.area)}㎡)이 다릅니다(차이 ${fmt(
          Math.round(diff * 100) / 100
        )}㎡). 연면적 산정 제외 부분(주차용 지하층 등) 여부를 확인하십시오(건축법 시행령 제119조).`
      );
    }
  }
  if (x.useArea !== null && x.area !== null && x.useArea > x.area) {
    issues.push(`해당 용도 바닥면적 합계(${fmt(x.useArea)}㎡)가 연면적(${fmt(x.area)}㎡)보다 큽니다.`);
  }
  if (b.use === "bigstore" && x.area !== null && x.area < 3000) {
    issues.push(`대규모점포(유통산업발전법: 매장면적 합계 3,000㎡ 이상)로 선택했으나 연면적이 ${fmt(x.area)}㎡입니다. 일반 판매시설인지 확인하십시오.`);
  }
  if (x.gf <= 0 && b.use !== "tunnel" && b.use !== "ugduct" && b.use !== "commonduct" && b.use !== "ugmall") {
    issues.push("지상 층수가 0입니다. 지하가·지하구가 아니면 층수를 확인하십시오.");
  }
  return issues;
}

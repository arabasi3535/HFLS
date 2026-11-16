// ============================================================
// 「소방 인허가 시티」 게임 본체 — initGame(root, rules) → cleanup()
//  · 원본: firecity-handoff src/game.js (IIFE) → HFLS 탭용 모듈로 전환
//  · 판정: rules.evaluate (rulesAdapter.js — HFLS evaluateAt 호출)
//  · 난이도(rules.level): basic 초급(허가 동의) / mid 중급(허가 → 착공 → 준공) / adv 고급(기존 건축물: 허가 당시 → 현행 관리)
//    중급·고급 단계 문항은 rules.stages(stagesAdapter.js — HFLS 착공·안전관리 판정 호출)
//  · DOM id는 'fc-' 접두어, CSS 클래스는 .fc-root 범위(MiniGame.css)
// ============================================================
/* eslint-disable no-mixed-operators */
import { SYSTEMS, GROUPS, totals, fa } from "./legacyRules";
import { MARKUP } from "./markup";
import { RANKS, RANK_XP, STAGES } from "./progress";
import * as RK from "./rankClient";

export function initGame(root, rules) {
const { evaluate, extrasOf = () => [], ASSUMPTIONS = [], STAGE_ASSUMPTIONS = [], getAdminPw = () => '', level = 'basic', stages = null } = rules;
// 난이도별 설정 — 저장·랭킹은 난이도마다 따로(초급은 기존 저장 키 유지)
const LEVELS = {
  basic: { name: '초급', save: 'firecity_v1', phases: ['consent'] },
  mid: { name: '중급', save: 'firecity_mid_v1', phases: ['consent', 'start', 'post'] },
  adv: { name: '고급', save: 'firecity_adv_v1', phases: ['consent', 'post'] },
};
const LV = LEVELS[level] || LEVELS.basic;
const answerLabel = q => (stages ? stages.answerLabel(q) : '');
const ADV = level === 'adv';
const PH = {
  consent: { bubble: '허가', color: '#d62828', stamp: ADV ? '건축허가 동의(당시)' : '건축허가 동의', done: '동의' },
  start: { bubble: '착공', color: '#f77f00', stamp: '착공 단계', done: '착공' },
  post: { bubble: ADV ? '관리' : '준공', color: '#3a6ea5', stamp: ADV ? '현행 안전관리' : '준공 후 안전관리', done: ADV ? '관리' : '준공' },
};
root.innerHTML = MARKUP;
const cleanups = [];
const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); cleanups.push(() => el.removeEventListener(ev, fn, opt)); };
let rafId = 0, alive = true;
const later = (fn, ms) => { const id = setTimeout(() => { if (alive) fn(); }, ms); cleanups.push(() => clearTimeout(id)); };
// ================== 상수 ==================
const N = 20, TW = 64, TH = 32;
const WORLD_W = N * TW + 120, WORLD_H = N * TH + 330;
const OX = WORLD_W / 2, OY = 280;
const SAVE_KEY = LV.save;


const USE = {
  house:    { label: '단독주택', wall: '#f4e6cc', roof: '#b5533c' },
  multi:    { label: '공동주택(다세대주택)', wall: '#eadbc3', roof: '#8a6d5a' },
  apt:      { label: '공동주택(아파트)', wall: '#efeae2', roof: '#6f6a64' },
  retail:   { label: '근린생활시설', wall: '#d3e6f2', roof: '#5b7c99' },
  lodging:  { label: '숙박시설(일반숙박시설)', wall: '#f5d6e1', roof: '#a14a6b' },
  daycare:  { label: '노유자시설(어린이집)', wall: '#fff1b8', roof: '#e0a100' },
  nursing:  { label: '노유자시설(노인요양시설 · 노유자 생활시설)', wall: '#dcefd6', roof: '#5f9a55' },
  factory:  { label: '공장(일반 제조, 특수가연물 미저장)', wall: '#d9d9d9', roof: '#7d7d7d' },
  office:   { label: '업무시설(일반업무시설, 오피스텔 제외)', wall: '#c6d4ea', roof: '#3f5a85' },
  hospital: { label: '의료시설(병원)', wall: '#ffffff', roof: '#c9d1dc' },
  sales:    { label: '판매시설(소매시장·상점)', wall: '#f8dfc2', roof: '#d9822b' },
};
const DETAIL = {
  house: ['단독주택(주거용)'],
  multi: ['다세대주택 (주택으로 쓰는 층수 4개층 이하, 1개 동 연면적 660㎡ 이하)'],
  apt: ['아파트 (주택으로 쓰는 층수 5개층 이상) · 지하층 주차장'],
  retail: ['1층 소매점, 2층 이상 사무소', '휴게음식점·제과점·사무소', '소매점·미용원·사무소', '일반음식점·사무소'],
  lodging: ['일반숙박시설(모텔)', '일반숙박시설(여관)'],
  daycare: ['어린이집'],
  nursing: ['노인요양시설'],
  factory: ['금속가공 제조공장', '식품 제조공장', '기계부품 조립공장'],
  office: ['일반업무시설(사무소)'],
  hospital: ['병원(입원실 있음)'],
  sales: ['소매시장', '상점(대형마트 아님)'],
};
const NAMES = ['한빛', '새봄', '푸른', '하늘', '청솔', '다온', '해오름', '별빛', '소담', '가람', '누리', '온새미', '미리내', '라온', '아라', '솔빛', '한울', '은하', '단비', '여울'];
const SUFFIX = {
  house: ['주택', '전원주택'], multi: ['빌라', '하우스'], apt: ['아파트 101동', '아파트 102동'], retail: ['상가', '프라자', '빌딩'],
  lodging: ['모텔', '호텔'], daycare: ['어린이집'], nursing: ['요양원', '실버센터'], factory: ['산업', '정밀', '식품'],
  office: ['빌딩', '타워', '센터'], hospital: ['병원'], sales: ['마트', '쇼핑센터', '시장'],
};
const DONG = ['신도리', '산합리', '오천리', '송평리', '중앙동', '새솔동', '도청로', '119로'];

// tier: 해금 단계(계급 인덱스 기준)
const TPL = [
  { id: 'house', tier: 0, use: 'house', GF: [1, 2], A: [60, 150] },
  { id: 'retailS', tier: 0, use: 'retail', GF: [1, 2], A: [70, 190] },
  { id: 'retailM', tier: 1, use: 'retail', GF: [2, 3], A: [150, 350], BF: [0, 1], Ab: [80, 320] },
  { id: 'multi', tier: 1, use: 'multi', GF: [3, 4], A: [110, 165] },
  { id: 'daycare', tier: 1, use: 'daycare', GF: [1, 2], A: [120, 300] },
  { id: 'retailL', tier: 2, use: 'retail', GF: [3, 5], A: [220, 450], BF: [0, 1], Ab: [120, 520] },
  { id: 'lodging', tier: 2, use: 'lodging', GF: [2, 5], A: [70, 210], BF: [0, 1], Ab: [60, 200] },
  { id: 'factory', tier: 2, use: 'factory', GF: [1, 2], A: [400, 2600] },
  { id: 'nursingS', tier: 2, use: 'nursing', GF: [1, 2], A: [120, 280] },
  { id: 'office', tier: 3, use: 'office', GF: [4, 7], A: [300, 900], BF: [0, 2], Ab: [300, 1100] },
  { id: 'nursing', tier: 3, use: 'nursing', GF: [2, 4], A: [180, 450] },
  { id: 'hospital', tier: 3, use: 'hospital', GF: [2, 6], A: [140, 700], BF: [0, 1], Ab: [120, 600] },
  { id: 'sales', tier: 3, use: 'sales', GF: [1, 4], A: [400, 1600], BF: [0, 1], Ab: [140, 1200] },
  { id: 'apt', tier: 4, use: 'apt', GF: [5, 15], A: [350, 700], BF: [1, 2], Ab: [900, 3500] },
  { id: 'officeH', tier: 4, use: 'office', GF: [8, 12], A: [600, 1200], BF: [1, 3], Ab: [500, 1800] },
  { id: 'lodgingL', tier: 4, use: 'lodging', GF: [6, 10], A: [300, 600], BF: [1, 2], Ab: [300, 900] },
  { id: 'aptH', tier: 5, use: 'apt', GF: [16, 29], A: [400, 700], BF: [2, 3], Ab: [2500, 6000] },
  { id: 'tower', tier: 5, use: 'office', GF: [20, 35], A: [1000, 1800], BF: [3, 5], Ab: [1500, 3200] },
  { id: 'mall', tier: 5, use: 'sales', GF: [3, 6], A: [1800, 4000], BF: [1, 3], Ab: [1500, 4000] },
];
const TPL_NAME = { house: '단독주택', retailS: '소규모 근린생활시설', retailM: '근린생활시설', multi: '다세대주택', daycare: '어린이집', retailL: '중형 근린생활시설', lodging: '숙박시설', factory: '공장', nursingS: '소규모 노인요양시설', office: '업무시설', nursing: '노인요양시설', hospital: '병원', sales: '판매시설', apt: '아파트', officeH: '고층 업무시설', lodgingL: '관광호텔급 숙박시설', aptH: '초고층급 아파트', tower: '오피스 타워', mall: '대형 판매시설' };

// ================== 유틸 ==================
const $ = id => root.querySelector('#fc-' + id);
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const key = (x, y) => x + ',' + y;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
// 신청일(허가일) 생성 — 2026.01.05부터 준공 1건당 6일씩 진행. '시대별 모드'를 붙일 때 이 함수만 바꾸면 됨
const fmtD = d => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
function gameDate(day) { return fmtD(new Date(2026, 0, 5 + day * 6)); }
// 고급: 과거 허가일(1992.8.1.~2025.6.30. — HFLS 연혁 수록 범위) + 사용승인일(허가 후 1~3년)
function pastDates() {
  const t0 = new Date(1992, 7, 1).getTime(), t1 = new Date(2025, 5, 30).getTime();
  const p = new Date(t0 + Math.random() * (t1 - t0));
  const d = new Date(p.getTime() + ri(300, 1000) * 86400000);
  return [fmtD(p), fmtD(d)];
}

// ================== 상태 ==================
let S;
function newState() {
  const tiles = [];
  for (let y = 0; y < N; y++) { tiles.push([]); for (let x = 0; x < N; x++) tiles[y].push(Math.random() < 0.2 ? 't' : 'g'); }
  const st = { tiles, b: {}, sites: {}, xp: 0, rank: 0, done: 0, first: 0, pop: 0, day: 0, seq: 1, log: [], ver: 1 };
  for (let x = 5; x <= 14; x++) st.tiles[10][x] = 'r';
  for (let y = 7; y <= 10; y++) st.tiles[y][10] = 'r';
  st.tiles[9][9] = 's';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (st.tiles[y][x] === 't' && nearType(st, x, y, 'r', 1)) st.tiles[y][x] = 'g';
  }
  return st;
}
function nearType(st, x, y, t, d) {
  for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) {
    const xx = x + dx, yy = y + dy;
    if (xx >= 0 && yy >= 0 && xx < N && yy < N && st.tiles[yy][xx] === t) return true;
  }
  return false;
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.ver === 1 && s.tiles) {
      // 이동 중 표시(일시 상태) 정리 · 이전 저장본 호환
      for (const k in s.sites) { const t = s.sites[k]; delete t.showPh; if (t.ph === undefined) t.ph = 0; if (t.firstAll === undefined) t.firstAll = true; }
      for (const k in s.b) delete s.b[k].wait;
      return s;
    }
  } catch (e) { }
  return null;
}
function addLog(html) { S.log.unshift({ d: gameDate(S.day), h: html }); S.log = S.log.slice(0, 40); }

// ================== 생성 로직 ==================
function rankOf(xp) { let r = 0; for (let i = 0; i < RANK_XP.length; i++) if (xp >= RANK_XP[i]) r = i; return r; }
function tierUnlocked() { return Math.min(S.rank, 5); }
function maxSites() { return Math.min(2 + Math.floor(S.rank / 2), 5); }
function genBuilding() {
  const tu = tierUnlocked();
  const pool = [];
  for (const t of TPL) if (t.tier <= tu) { const w = t.tier === tu ? 4 : t.tier === tu - 1 ? 2 : 1; for (let i = 0; i < w; i++) pool.push(t); }
  const t = pick(pool);
  const GF = ri(t.GF[0], t.GF[1]);
  let A = rnd(t.A[0], t.A[1]);
  if (t.use === 'multi') A = Math.min(A, 659 / GF);
  A = Math.round(A * 100) / 100;
  const BF = t.BF ? ri(t.BF[0], t.BF[1]) : 0;
  const Ab = BF ? Math.round(rnd(t.Ab[0], t.Ab[1]) * 100) / 100 : 0;
  const no = S.seq++;
  // 세대수(공동주택) · 높이(층수 × 3.3m) — 중급·고급 안전관리 판정용
  let hh = 0;
  if (t.use === 'apt') hh = GF * clamp(Math.round(A / 110 + rnd(-1, 1)), 2, 6);
  if (t.use === 'multi') hh = GF * ri(2, 4);
  const H = Math.round(GF * 33) / 10;
  const [pd, dd] = ADV ? pastDates() : [gameDate(S.day), ''];
  return {
    use: t.use, tpl: t.id, GF, BF, A, Ab, hh, H, ph: 0, firstAll: true,
    name: pick(NAMES) + ' ' + pick(SUFFIX[t.use]), detail: pick(DETAIL[t.use]),
    addr: `소방시 ${pick(DONG)} ${ri(10, 899)}-${ri(1, 9)}`,
    no: `${ADV ? '기존' : '동의'}-${String(no).padStart(4, '0')}`, date: pd, done: dd, today: gameDate(S.day),
  };
}
function freeTiles() {
  const out = [], tl = S.tiles;
  const nearRoad = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => tl[y + dy] && tl[y + dy][x + dx] === 'r');
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const t = tl[y][x];
    if ((t === 'g' || t === 't') && !S.b[key(x, y)] && !S.sites[key(x, y)]) {
      if (nearRoad(x, y)) out.push([x, y]);
    }
  }
  return out;
}
function growRoads() {
  const roads = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (S.tiles[y][x] === 'r') roads.push([x, y]);
  for (let tries = 0; tries < 60; tries++) {
    const [x0, y0] = pick(roads);
    const [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    const len = ri(3, 6);
    const path = [];
    let x = x0, y = y0;
    for (let i = 0; i < len; i++) {
      x += dx; y += dy;
      if (x < 1 || y < 1 || x >= N - 1 || y >= N - 1) break;
      const t = S.tiles[y][x];
      if (S.b[key(x, y)] || S.sites[key(x, y)] || t === 's') break;
      if (t === 'r') break;
      path.push([x, y]);
    }
    if (path.length >= 2) { for (const [px, py] of path) S.tiles[py][px] = 'r'; return true; }
  }
  return false;
}
function spawnSites() {
  let guard = 0;
  while (Object.keys(S.sites).length < maxSites() && guard++ < 10) {
    let cand = freeTiles();
    if (cand.length < 3) { growRoads(); cand = freeTiles(); }
    if (!cand.length) break;
    // 도심(소방서 주변)부터 채워지도록 거리 가중
    cand.sort((a, b) => (Math.hypot(a[0] - 9.5, a[1] - 9.5) + Math.random() * 4) - (Math.hypot(b[0] - 9.5, b[1] - 9.5) + Math.random() * 4));
    const [x, y] = cand[Math.floor(Math.random() * Math.min(4, cand.length))];
    S.tiles[y][x] = 'g';
    S.sites[key(x, y)] = { ...genBuilding(), x, y, sel: [], tries: 0, born: performance.now() };
  }
}
function popOf(b) {
  const { T } = totals(b);
  if (b.use === 'house') return 4;
  if (b.use === 'multi') return Math.round(T / 60 * 2.5);
  if (b.use === 'apt') return Math.round(T / 85 * 2.6);
  return Math.round(T / 40);
}
function stageOf(p) { let s = STAGES[0], n = null; for (let i = 0; i < STAGES.length; i++) { if (p >= STAGES[i][0]) { s = STAGES[i]; n = STAGES[i + 1] || null; } } return [s, n]; }

// ================== 렌더링 ==================
const cv = $('cv'), ctx = cv.getContext('2d');
let dpr = 1, cam = { x: 0, y: 0, z: 1 }, hover = null, bubbles = [], parts = [];
function iso(x, y) { return [OX + (x - y) * TW / 2, OY + (x + y) * TH / 2]; }
function toTile(wx, wy) {
  const u = (wx - OX) / (TW / 2), v = (wy - OY) / (TH / 2);
  return [Math.floor((u + v) / 2), Math.floor((v - u) / 2)];
}
function resize() {
  const r = cv.parentElement.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr);
}
function fit() {
  const r = cv.parentElement.getBoundingClientRect();
  cam.z = Math.min(r.width / WORLD_W, r.height / WORLD_H) * 1.05;
  cam.x = (r.width - WORLD_W * cam.z) / 2; cam.y = (r.height - WORLD_H * cam.z) / 2;
}
function focusTown() {
  fit();
  const r = cv.parentElement.getBoundingClientRect();
  const z = clamp(cam.z * 1.8, 0.3, 3);
  const [wx, wy] = iso(10, 10);
  cam.z = z; cam.x = r.width / 2 - wx * z; cam.y = r.height / 2 - (wy - 40) * z;
}
function poly(pts, fill, stroke, lw) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function diamond(x, y, i = 0) { return [iso(x + i, y + i), iso(x + 1 - i, y + i), iso(x + 1 - i, y + 1 - i), iso(x + i, y + 1 - i)]; }
const up = (p, h) => [p[0], p[1] - h];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function drawGround() {
  // 지반 단면
  const L = iso(0, N), B = iso(N, N), R = iso(N, 0);
  poly([L, B, [B[0], B[1] + 18], [L[0], L[1] + 18]], '#8b6a43');
  poly([B, R, [R[0], R[1] + 18], [B[0], B[1] + 18]], '#6f5333');
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const t = S.tiles[y][x], k = key(x, y);
    let c = (x + y) % 2 ? '#8fca6b' : '#89c366';
    if (t === 'r') c = '#6d727a';
    else if (t === 's' || S.b[k]) c = '#cfc9bb';
    else if (S.sites[k]) c = '#cfa769';
    poly(diamond(x, y), c, 'rgba(0,0,0,.06)');
    if (t === 'r') {
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = '#f2d36b'; ctx.lineWidth = 1.6;
      const c0 = iso(x + .5, y + .5);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (S.tiles[y + dy] && S.tiles[y + dy][x + dx] === 'r') {
          const m = iso(x + .5 + dx * .5, y + .5 + dy * .5);
          ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(m[0], m[1]); ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
  if (hover && hover[0] >= 0 && hover[1] >= 0 && hover[0] < N && hover[1] < N) {
    poly(diamond(hover[0], hover[1]), 'rgba(255,255,255,.25)', 'rgba(255,255,255,.95)', 2);
  }
}

function box(x, y, inset, h, wall, roof, opt = {}) {
  const [T, R, B, L] = diamond(x, y, inset);
  const lf = [L, B, up(B, h), up(L, h)], rf = [B, R, up(R, h), up(B, h)];
  poly(lf, shade(wall, -0.06), 'rgba(0,0,0,.18)');
  poly(rf, shade(wall, -0.24), 'rgba(0,0,0,.18)');
  // 창문
  if (opt.floors) {
    const fh = (h - (opt.base || 0)) / opt.floors;
    const cols = opt.cols || 4;
    ctx.fillStyle = opt.win || 'rgba(70,110,160,.55)';
    for (let f = 0; f < opt.floors; f++) {
      const yy = (opt.base || 0) + fh * (f + 0.35);
      for (let c = 0; c < cols; c++) {
        const t = (c + 0.5) / cols;
        const p1 = up(lerp(L, B, t), yy), p2 = up(lerp(B, R, t), yy);
        const ww = Math.min(5, 40 / cols), wh = Math.max(1.6, Math.min(4, fh * 0.45));
        ctx.save(); ctx.translate(p1[0], p1[1]); ctx.transform(1, 0.5, 0, 1, 0, 0); ctx.fillRect(-ww / 2, -wh, ww, wh); ctx.restore();
        ctx.save(); ctx.translate(p2[0], p2[1]); ctx.transform(1, -0.5, 0, 1, 0, 0); ctx.fillRect(-ww / 2, -wh, ww, wh); ctx.restore();
      }
    }
  }
  if (opt.pitched) {
    const ap = up(iso(x + .5, y + .5), h + opt.pitched);
    poly([up(T, h), up(R, h), ap], shade(roof, -0.1));
    poly([up(L, h), up(T, h), ap], shade(roof, 0.05));
    poly([up(L, h), up(B, h), ap], roof, 'rgba(0,0,0,.2)');
    poly([up(B, h), up(R, h), ap], shade(roof, -0.2), 'rgba(0,0,0,.2)');
  } else {
    poly([up(T, h), up(R, h), up(B, h), up(L, h)], roof, 'rgba(0,0,0,.2)');
  }
  return { T: up(T, h), R: up(R, h), B: up(B, h), L: up(L, h), C: up(iso(x + .5, y + .5), h) };
}

function bHeight(b) { return b.use === 'house' ? 14 * b.GF + 2 : Math.max(12, 6.2 * Math.min(b.GF, 36) + 4); }
function bInset(b) { const { T } = totals(b); return T > 8000 ? 0.06 : T > 2000 ? 0.1 : T > 600 ? 0.16 : 0.24; }

function drawBuilding(x, y, b, now, frac = 1) {
  const u = USE[b.use];
  if (b.wait) { drawSite(x, y, b, now, true); return; } // 소방관 도착 전 — 공사장 모습 유지
  let p = 1;
  if (b.anim) { p = clamp((now - b.anim) / 1500, 0, 1); if (p >= 1) b.anim = 0; }
  const ease = (1 - Math.pow(1 - p, 3)) * frac;
  const H = bHeight(b) * ease;
  if (H < 1) return;
  const floors = Math.max(1, Math.round(Math.min(b.GF, 36) * ease));
  const ins = bInset(b);
  if (b.use === 'house') { box(x, y, ins, H, u.wall, u.roof, { floors, cols: 2, pitched: 12 * ease, win: 'rgba(90,120,160,.6)' }); return; }
  if (b.use === 'factory') {
    const top = box(x, y, ins, H, u.wall, u.roof, { floors, cols: 3 });
    const c = lerp(top.T, top.C, .45);
    poly([[c[0] - 4, c[1]], [c[0] + 4, c[1]], [c[0] + 4, c[1] - 22 * ease], [c[0] - 4, c[1] - 22 * ease]], '#9b3d2e');
    if (p >= 1 && frac >= 1 && Math.random() < .08) parts.push({ x: c[0], y: c[1] - 24, vx: rnd(-.1, .3), vy: -rnd(.3, .6), life: 90, max: 90, c: 'rgba(200,200,200,', s: rnd(3, 6), smoke: 1 });
    return;
  }
  const opt = { floors, cols: b.use === 'office' ? 5 : 4 };
  if (b.use === 'office') opt.win = 'rgba(40,80,140,.65)';
  const top = box(x, y, ins, H, u.wall, u.roof, opt);
  if (b.use === 'hospital' && p >= 1 && frac >= 1) {
    ctx.fillStyle = '#d62828'; const c = top.C;
    ctx.fillRect(c[0] - 7, c[1] - 2, 14, 4); ctx.fillRect(c[0] - 2, c[1] - 6, 4, 12);
  }
  if (b.use === 'apt' && p >= 1 && frac >= 1) { // 옥탑
    const c = top.C; poly([[c[0] - 8, c[1]], [c[0], c[1] + 4], [c[0] + 8, c[1]], [c[0], c[1] - 4]], shade(u.roof, -.2));
  }
}

function drawStation(x, y) {
  const top = box(x, y, 0.12, 30, '#e04a3a', '#7a1f17', { floors: 2, cols: 3, win: 'rgba(255,255,255,.6)' });
  ctx.font = '700 11px "Noto Sans KR",sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#fff'; ctx.fillText('119', top.C[0], top.C[1] + 4);
  // 깃대
  const f = lerp(top.T, top.L, .2);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(f[0], f[1]); ctx.lineTo(f[0], f[1] - 24); ctx.stroke();
  poly([[f[0], f[1] - 24], [f[0] + 11, f[1] - 20], [f[0], f[1] - 16]], '#fcbf49');
}

function drawTree(x, y) {
  const c = iso(x + .5, y + .5);
  const s = ((x * 7 + y * 13) % 5) / 10 + .8;
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(c[0] - 1.5, c[1] - 8 * s, 3, 8 * s);
  ctx.beginPath(); ctx.ellipse(c[0], c[1] - 14 * s, 8 * s, 9 * s, 0, 0, Math.PI * 2); ctx.fillStyle = '#4f9a45'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(c[0] - 2 * s, c[1] - 16 * s, 4 * s, 4.5 * s, 0, 0, Math.PI * 2); ctx.fillStyle = '#69b55c'; ctx.fill();
}

// 단계별 공사장 모습: 중급 준공 단계 = 골조 60% + 크레인, 고급 관리 단계 = 완성 건물(기존 건축물)
function sitePhase(s) { const ph = s.showPh !== undefined ? s.showPh : (s.ph || 0); return LV.phases[ph] || 'consent'; }
function drawSite(x, y, s, now, noBubble) {
  const vp = noBubble ? 'consent' : sitePhase(s);
  if (vp === 'post' && ADV) { drawBuilding(x, y, s, now); if (s.showPh === undefined) pushBubble(x, y, s, bHeight(s), now); return; }
  if (vp === 'post') { box(x, y, 0.2, 4, '#9a9a9a', '#b5b5b5'); drawBuilding(x, y, { ...s, anim: 0 }, now, 0.6); }
  // 기초
  else box(x, y, 0.2, 4, '#9a9a9a', '#b5b5b5');
  // 계획 건물 윤곽(점선)
  const h = bHeight(s), ins = bInset(s);
  const [T, R, B, L] = diamond(x, y, ins);
  ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(247,127,0,.75)'; ctx.lineWidth = 1.1;
  for (const p of [L, B, R]) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] - h); ctx.stroke(); }
  poly([up(T, h), up(R, h), up(B, h), up(L, h)], null, 'rgba(247,127,0,.75)', 1.1);
  ctx.restore();
  // 펜스
  const [, r2, b2, l2] = diamond(x, y, 0.04);
  ctx.strokeStyle = '#f77f00'; ctx.lineWidth = 2;
  for (const [a, b] of [[l2, b2], [b2, r2]]) { ctx.beginPath(); ctx.moveTo(a[0], a[1] - 3); ctx.lineTo(b[0], b[1] - 3); ctx.stroke(); }
  // 크레인
  const m = iso(x + .22, y + .22), mh = Math.min(h + 26, 150);
  ctx.strokeStyle = '#e0a100'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(m[0], m[1]); ctx.lineTo(m[0], m[1] - mh); ctx.stroke();
  const sw = Math.sin(now / 1400 + x) * 0.35;
  const jx = Math.cos(sw) * 38, jy = Math.sin(sw) * 10;
  ctx.beginPath(); ctx.moveTo(m[0] - jx * .35, m[1] - mh - jy * .35); ctx.lineTo(m[0] + jx, m[1] - mh + jy); ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = '#555';
  const hk = [m[0] + jx * .8, m[1] - mh + jy * .8];
  const hl = 20 + Math.sin(now / 900 + y) * 8;
  ctx.beginPath(); ctx.moveTo(hk[0], hk[1]); ctx.lineTo(hk[0], hk[1] + hl); ctx.stroke();
  ctx.fillStyle = '#c0392b'; ctx.fillRect(hk[0] - 4, hk[1] + hl, 8, 4);
  // 말풍선 위치 기록(나중 패스에서 그림) — 소방관 이동 중에는 숨김
  if (!noBubble && s.showPh === undefined) pushBubble(x, y, s, h, now);
}
function pushBubble(x, y, s, h, now) {
  const c = iso(x + .5, y + .5);
  bubbles.push({ x: c[0], y: c[1] - Math.max(h, 40) - 24 + Math.sin(now / 350 + x * 2) * 3, k: key(x, y), s });
}

function drawBubble(bb) {
  const { x, y } = bb;
  const col = bb.s.tries ? '#d62828' : PH[sitePhase(bb.s)].color;
  ctx.beginPath(); ctx.moveTo(x - 6, y + 13); ctx.lineTo(x + 6, y + 13); ctx.lineTo(x, y + 21); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '900 13px "Noto Sans KR",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(bb.s.tries ? '보완' : PH[sitePhase(bb.s)].bubble, x, y + 1);
  ctx.textBaseline = 'alphabetic';
}

// ================== 소방관 캐릭터 ==================
// 승인할 때마다 도로를 따라 그 건물 앞으로 달려가 도장을 찍는다(이동은 화면 효과 — 진행 상태는 즉시 저장됨)
const hero = { run: null, face: 1 };
const heroQ = [];
let stamps = [];
const isRoad = (x, y) => x >= 0 && y >= 0 && x < N && y < N && S.tiles[y][x] === 'r';
const DIR4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function homeTile() {
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (S.tiles[y][x] === 's') {
    for (const [dx, dy] of DIR4) if (isRoad(x + dx, y + dy)) return { x: x + dx + .5, y: y + dy + .5 };
  }
  return { x: 10.5, y: 10.5 };
}
function nearestRoad(x, y) {
  let best = null, bd = 1e9;
  for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) if (isRoad(xx, yy)) {
    const d = Math.abs(xx - x) + Math.abs(yy - y);
    if (d < bd) { bd = d; best = [xx, yy]; }
  }
  return best;
}
/** 도로 타일 최단 경로(BFS): from → 목표 건물에 붙은 도로 타일 */
function roadPath(fx, fy, tx, ty) {
  const start = isRoad(fx, fy) ? [fx, fy] : nearestRoad(fx, fy);
  if (!start) return null;
  const goal = new Set(DIR4.map(([dx, dy]) => [tx + dx, ty + dy]).filter(([x, y]) => isRoad(x, y)).map(([x, y]) => key(x, y)));
  if (!goal.size) return null;
  const prev = new Map([[key(...start), null]]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    if (goal.has(key(x, y))) {
      const path = [];
      for (let c = key(x, y); c; c = prev.get(c)) path.unshift(c.split(',').map(Number));
      return path;
    }
    for (const [dx, dy] of DIR4) {
      const nx = x + dx, ny = y + dy, nk = key(nx, ny);
      if (isRoad(nx, ny) && !prev.has(nk)) { prev.set(nk, key(x, y)); q.push([nx, ny]); }
    }
  }
  return null;
}
/** 출동 예약 — k: 대상 타일, txt: 도장 문구, cb: 도착 후 처리 */
function heroGo(k, txt, cb) { heroQ.push({ k, txt, cb }); if (!hero.run) heroNext(); }
function heroNext() {
  const job = heroQ.shift();
  if (!job) return;
  const [tx, ty] = job.k.split(',').map(Number);
  const h = S.hero || (S.hero = homeTile());
  const path = roadPath(Math.floor(h.x), Math.floor(h.y), tx, ty);
  const pts = [[h.x, h.y]];
  if (path) for (const [x, y] of path) pts.push([x + .5, y + .5]);
  const last = pts[pts.length - 1];
  pts.push([last[0] + (tx + .5 - last[0]) * .42, last[1] + (ty + .5 - last[1]) * .42]); // 건물 쪽으로 반 걸음
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  hero.run = { pts, len, t0: performance.now(), dur: clamp(len * 170, 450, 2600), job };
}
function heroUpdate(now) {
  const r = hero.run;
  if (!r) return;
  const f = clamp((now - r.t0) / r.dur, 0, 1);
  let d = f * r.len, i = 1;
  for (; i < r.pts.length; i++) {
    const seg = Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]);
    if (d <= seg || i === r.pts.length - 1) {
      const t = seg ? clamp(d / seg, 0, 1) : 1;
      const a = r.pts[i - 1], b = r.pts[i];
      S.hero = { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t };
      const sdx = (b[0] - a[0]) - (b[1] - a[1]); // 화면 가로 방향
      if (Math.abs(sdx) > .01) hero.face = sdx > 0 ? 1 : -1;
      break;
    }
    d -= seg;
  }
  if (f >= 1) {
    const { job } = r;
    hero.run = null;
    const [tx, ty] = job.k.split(',').map(Number);
    const c = iso(tx + .5, ty + .5);
    stamps.push({ x: c[0], y: c[1] - 30, t0: now, txt: job.txt });
    later(() => { job.cb(); save(); }, 380);
    later(heroNext, 520);
  }
}
// 귀여운 소방관(2등신) — 발 위치 기준
function drawHero(now) {
  const h = S.hero || homeTile();
  const [px, py] = iso(h.x, h.y);
  const run = !!hero.run, t = now / 1000;
  const bob = run ? Math.abs(Math.sin(t * 16)) * 2.4 : Math.sin(t * 3) * .5;
  const sw = run ? Math.sin(t * 16) : 0;
  ctx.save(); ctx.translate(px, py); ctx.scale(hero.face * 1.35, 1.35);
  ctx.beginPath(); ctx.ellipse(0, 0, 7.5, 2.8, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fill();
  // 다리·장화
  ctx.fillStyle = '#1d2433';
  ctx.fillRect(-4 + sw * 1.8, -6 - bob, 3, 6 + bob * .4); ctx.fillRect(1 - sw * 1.8, -6 - bob, 3, 6 + bob * .4);
  // 몸통(방화복) + 반사띠
  const by = -15 - bob;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-5.5, by, 11, 10, 3) : ctx.rect(-5.5, by, 11, 10); ctx.fillStyle = '#e76f51'; ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.fillRect(-5.5, by + 5.2, 11, 1.8);
  // 팔
  ctx.strokeStyle = '#e76f51'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-5, by + 3); ctx.lineTo(-7.5 - sw * 1.5, by + 7.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, by + 3); ctx.lineTo(7 + sw * 1.5, by + 7.5); ctx.stroke();
  // 결재판(파란 서류)
  ctx.fillStyle = '#3a86ff'; ctx.fillRect(5.5 + sw * 1.5, by + 5.5, 4, 5);
  // 얼굴
  const hy = by - 6;
  ctx.beginPath(); ctx.arc(0, hy, 7, 0, Math.PI * 2); ctx.fillStyle = '#ffd8b1'; ctx.fill();
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(2.6, hy + .6, 1.1, 0, Math.PI * 2); ctx.arc(-1.4, hy + .6, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,120,120,.55)'; ctx.beginPath(); ctx.arc(4.6, hy + 2.8, 1.4, 0, Math.PI * 2); ctx.arc(-3.6, hy + 2.8, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a4b2a'; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(.8, hy + 2.6, 1.6, .15 * Math.PI, .85 * Math.PI); ctx.stroke();
  // 헬멧(빨강) + 챙 + 금색 휘장
  ctx.beginPath(); ctx.arc(0, hy - 1.2, 7.6, Math.PI, 0); ctx.fillStyle = '#d62828'; ctx.fill();
  ctx.fillStyle = '#a4161a'; ctx.beginPath(); ctx.ellipse(.5, hy - 1, 9.4, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fcbf49'; ctx.beginPath(); ctx.arc(0, hy - 5.2, 2.1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawStamps(now) {
  stamps = stamps.filter(st => now - st.t0 < 1100);
  for (const st of stamps) {
    const a = (now - st.t0) / 1100;
    const sc = a < .18 ? 1.8 - a / .18 * .8 : 1;
    ctx.save(); ctx.globalAlpha = a > .7 ? (1 - a) / .3 : 1; ctx.translate(st.x, st.y - a * 14); ctx.rotate(-.18); ctx.scale(sc, sc);
    ctx.font = '900 12px "Noto Sans KR",sans-serif';
    const w = ctx.measureText(st.txt).width + 14;
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(-w / 2, -11, w, 22);
    ctx.strokeStyle = '#d62828'; ctx.lineWidth = 2.4; ctx.strokeRect(-w / 2, -11, w, 22);
    ctx.fillStyle = '#d62828'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(st.txt, 0, 1);
    ctx.restore();
  }
  ctx.textBaseline = 'alphabetic';
}

function draw(now) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, dpr * cam.x, dpr * cam.y);
  bubbles = [];
  heroUpdate(now);
  drawGround();
  const hp = S.hero || homeTile();
  const heroD = Math.floor(hp.x) + Math.floor(hp.y);
  for (let d = 0; d <= 2 * N - 2; d++) {
    for (let x = Math.max(0, d - N + 1); x <= Math.min(d, N - 1); x++) {
      const y = d - x, k = key(x, y), t = S.tiles[y][x];
      if (S.b[k]) drawBuilding(x, y, S.b[k], now);
      else if (S.sites[k]) drawSite(x, y, S.sites[k], now);
      else if (t === 's') drawStation(x, y);
      else if (t === 't') drawTree(x, y);
    }
    if (d === heroD) drawHero(now);
  }
  for (const bb of bubbles) drawBubble(bb);
  drawStamps(now);
  // 파티클
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.x += p.vx; p.y += p.vy; if (!p.smoke) p.vy += 0.12; p.life--;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    const a = p.life / p.max;
    if (p.smoke) { ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1.6 - a), 0, Math.PI * 2); ctx.fillStyle = p.c + (a * .5) + ')'; ctx.fill(); }
    else { ctx.fillStyle = p.c; ctx.globalAlpha = a; ctx.fillRect(p.x, p.y, p.s, p.s * .6); ctx.globalAlpha = 1; }
  }
  if (alive) rafId = requestAnimationFrame(draw);
}
function burst(x, y) {
  const c = iso(x + .5, y + .5);
  const cols = ['#d62828', '#f77f00', '#fcbf49', '#2a9d5c', '#3a86ff', '#ffffff'];
  for (let i = 0; i < 70; i++) parts.push({ x: c[0], y: c[1] - 40, vx: rnd(-3, 3), vy: rnd(-6, -2), life: ri(50, 90), max: 90, c: pick(cols), s: rnd(3, 6) });
  for (let i = 0; i < 18; i++) parts.push({ x: c[0] + rnd(-20, 20), y: c[1], vx: rnd(-.6, .6), vy: -rnd(.2, .6), life: 70, max: 70, c: 'rgba(190,170,140,', s: rnd(4, 8), smoke: 1 });
}

// ================== 입력 ==================
let ptr = null;
function screenToWorld(sx, sy) { return [(sx - cam.x) / cam.z, (sy - cam.y) / cam.z]; }
function localXY(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
on(cv, 'pointerdown', e => { const [sx, sy] = localXY(e); ptr = { sx, sy, cx: cam.x, cy: cam.y, moved: false }; cv.setPointerCapture(e.pointerId); });
on(cv, 'pointermove', e => {
  const [sx, sy] = localXY(e);
  if (ptr) {
    const dx = sx - ptr.sx, dy = sy - ptr.sy;
    if (Math.abs(dx) + Math.abs(dy) > 5) ptr.moved = true;
    if (ptr.moved) { cam.x = ptr.cx + dx; cam.y = ptr.cy + dy; }
  }
  const [wx, wy] = screenToWorld(sx, sy);
  hover = toTile(wx, wy);
  const onB = bubbles.some(b => Math.hypot(b.x - wx, b.y - wy) < 18);
  cv.style.cursor = onB || (hover && (S.sites[key(...hover)] || S.b[key(...hover)])) ? 'pointer' : (ptr && ptr.moved ? 'grabbing' : 'grab');
});
on(cv, 'pointerup', e => {
  if (ptr && !ptr.moved) { const [sx, sy] = localXY(e); clickAt(...screenToWorld(sx, sy)); }
  ptr = null;
});
on(cv, 'pointerleave', () => { hover = null; });
on(cv, 'wheel', e => { e.preventDefault(); const [sx, sy] = localXY(e); zoomAt(sx, sy, e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
function zoomAt(sx, sy, f) {
  const nz = clamp(cam.z * f, 0.3, 3);
  const [wx, wy] = screenToWorld(sx, sy);
  cam.z = nz; cam.x = sx - wx * nz; cam.y = sy - wy * nz;
}
$('zin').onclick = () => { const r = cv.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1.25); };
$('zout').onclick = () => { const r = cv.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1 / 1.25); };
$('zfit').onclick = fit;
function clickAt(wx, wy) {
  for (const b of bubbles) if (Math.hypot(b.x - wx, b.y - wy) < 18) return openReview(b.k);
  const [x, y] = toTile(wx, wy);
  if (x < 0 || y < 0 || x >= N || y >= N) return;
  const k = key(x, y);
  if (S.sites[k]) return openReview(k);
  if (S.b[k]) return openInfo(k);
  if (S.tiles[y][x] === 's') return openHelp();
}

// ================== UI ==================
function toast(msg) {
  const d = document.createElement('div'); d.className = 'fc-tmsg'; d.innerHTML = msg;
  $('toast').appendChild(d); later(() => d.remove(), 2600);
}
function updateHud() {
  const r = S.rank, cur = RANK_XP[r], nxt = RANK_XP[r + 1];
  $('hRank').textContent = '🎖 ' + RANKS[r];
  $('hXp').style.width = nxt ? ((S.xp - cur) / (nxt - cur) * 100) + '%' : '100%';
  $('hXpT').textContent = nxt ? `${S.xp} / ${nxt} XP · 다음 계급 ${RANKS[r + 1]}` : `${S.xp} XP · 최고 계급`;
  $('hPop').textContent = S.pop.toLocaleString();
  $('hDone').textContent = S.done;
  $('hAcc').textContent = S.done ? Math.round(S.first / S.done * 100) + '%' : '-';
  $('hDate').textContent = gameDate(S.day);
  const [st, nx] = stageOf(S.pop);
  $('hStage').textContent = st[1];
  $('hStageNext').textContent = nx ? `인구 ${nx[0].toLocaleString()}명 → ${nx[1]}` : '최고 단계 도달';
  const ul = $('siteList'); ul.innerHTML = '';
  const sites = Object.entries(S.sites);
  $('siteCnt').textContent = `(${sites.length}건)`;
  for (const [k, s] of sites) {
    const li = document.createElement('li');
    const pn = sitePhase(s);
    li.innerHTML = `<div class="fc-nm"><span class="fc-ph" style="background:${PH[pn].color}">${s.showPh !== undefined ? '이동 중' : PH[pn].bubble}</span> ${esc(s.name)}${ADV ? ` <small>(${s.date.slice(0, 4)}년 허가)</small>` : ''}</div><div class="fc-sb">${esc(USE[s.use].label.split('(')[0])} · 지상 ${s.GF}층${s.BF ? ' / 지하 ' + s.BF + '층' : ''} · ${fa(totals(s).T)}㎡${s.tries ? ' · <b style="color:#d62828">보완 ' + s.tries + '회</b>' : ''}</div>`;
    li.onclick = () => openReview(k);
    ul.appendChild(li);
  }
  $('log').innerHTML = S.log.map(l => `<li><small>${l.d}</small> ${l.h}</li>`).join('');
}

const modal = $('modal'), card = $('card');
function showModal(html) { stopRankPoll(); card.innerHTML = html; modal.classList.remove('hidden'); card.scrollTop = 0; }
function closeModal() { stopRankPoll(); modal.classList.add('hidden'); }
on(modal, 'click', e => { if (e.target === modal) closeModal(); });
on(document, 'keydown', e => { if (e.key === 'Escape') closeModal(); });

function infoTable(s, stamp) {
  const { T, bTot } = totals(s);
  const st = stamp || PH[LV.phases[s.ph || 0] || 'consent'].stamp;
  const extra = level === 'basic' ? '' : `${s.hh ? `<tr><th>세대수</th><td>${s.hh}세대</td></tr>` : ''}${s.H ? `<tr><th>높이</th><td>${s.H}m</td></tr>` : ''}`;
  const dates = ADV
    ? `<tr><th>허가일<br>(신청일)</th><td><b>${s.date}</b> <small>(설치대상 판정 기준일)</small></td></tr><tr><th>사용승인일</th><td>${s.done}</td></tr><tr><th>현재</th><td>${s.today} <small>(안전관리 판정 기준일)</small></td></tr>`
    : `<tr><th>신청일</th><td>${s.date} <small>(HFLS 판정 기준일)</small></td></tr>`;
  return `<table class="fc-info">
    <tr><th>접수번호</th><td>${s.no} <span class="fc-stamp">${st}</span></td></tr>
    <tr><th>건축물명</th><td><b>${esc(s.name)}</b></td></tr>
    <tr><th>소재지</th><td>${esc(s.addr)}</td></tr>
    <tr><th>주용도</th><td><b>${esc(USE[s.use].label)}</b></td></tr>
    <tr><th>세부내역</th><td>${esc(s.detail)}</td></tr>
    <tr><th>규모</th><td><b>지상 ${s.GF}층${s.BF ? ' / 지하 ' + s.BF + '층' : ' (지하층 없음)'}</b></td></tr>
    <tr><th>지상 층별<br>바닥면적</th><td>${fa(s.A)}㎡ × ${s.GF}개층</td></tr>
    <tr><th>지하 층별<br>바닥면적</th><td>${s.BF ? fa(s.Ab) + '㎡ × ' + s.BF + '개층 (합계 ' + fa(bTot) + '㎡)' : '-'}</td></tr>
    <tr><th>연면적</th><td><b>${fa(T)}㎡</b></td></tr>
    ${extra}${dates}
  </table>
  <details class="fc-assume"><summary>게임 가정 보기</summary>${[...ASSUMPTIONS, ...(level === 'basic' ? [] : STAGE_ASSUMPTIONS)].map(esc).join(' · ')}</details>`;
}

function openReview(k) {
  const s = S.sites[k]; if (!s) return;
  if (s.showPh !== undefined) { toast('🚒 소방관이 이동 중입니다'); return; }
  if (LV.phases[s.ph || 0] !== 'consent') return openStage(k);
  const sel = new Set(s.sel);
  const showDetail = s.tries >= 2 && s.last;
  const groupsHtml = GROUPS.map(([g, gname, basis]) => {
    const items = SYSTEMS.filter(x => x.g === g);
    let err = '';
    if (s.tries >= 1 && s.last && s.last.groupErr[g]) err = `<span class="fc-err">⚠ ${s.last.groupErr[g]}건 불일치</span>`;
    return `<div class="fc-grp"><h4>${gname} <small>${basis}</small> ${err}</h4><div class="fc-chips">${items.map(it => {
      let cls = 'fc-chip' + (sel.has(it.id) ? ' on' : '');
      if (showDetail) { if (s.last.miss.includes(it.id) && !sel.has(it.id)) cls += ' miss'; if (s.last.extra.includes(it.id) && sel.has(it.id)) cls += ' extra'; }
      return `<button class="${cls}" data-id="${it.id}">${it.name}</button>`;
    }).join('')}</div></div>`;
  }).join('');
  let resHtml = '';
  if (s.last) {
    if (s.tries === 1 || !showDetail) {
      resHtml = `<div class="fc-res bad"><b>⚠ 보완 요구</b> — 설치대상 판정이 ${s.last.miss.length + s.last.extra.length}건 맞지 않습니다. 설비군별 불일치 개수를 참고해 다시 검토하세요.<br><small>한 번 더 틀리면 항목별 근거가 공개됩니다.</small></div>`;
    } else {
      const ev = evaluate(s);
      resHtml = `<div class="fc-res bad"><b>⚠ 보완 요구 (${s.tries}회차)</b><ul>${s.last.miss.map(id => `<li><b>누락</b> ${nm(id)} — ${esc(ev[id].why)}</li>`).join('')}${s.last.extra.map(id => `<li><b>과다</b> ${nm(id)} — ${esc(ev[id].why)}</li>`).join('')}</ul></div>`;
    }
  }
  showModal(`<div class="fc-hd"><h2>🏗 건축허가등 동의${ADV ? '(허가 당시)' : ''} — ${esc(s.name)}</h2><button class="fc-x" id="fc-mx">×</button></div>
  <div class="fc-bd"><div class="fc-grid2"><div>${infoTable(s)}</div>
  <div><div class="fc-lead">${ADV ? `<b>${s.date}</b> 당시 기준으로 ` : ''}설치해야 하는 소방시설을 <b>모두</b> 선택하세요. (면제·대체 설비는 제외)</div>${groupsHtml}${resHtml}</div></div></div>
  <div class="fc-ft"><div class="fc-grow">${s.tries ? `제출 ${s.tries}회 · 이번 적합 시 XP ${Math.round(xpMult(s.tries) * 100)}%` : '첫 제출에 적합하면 XP 100%'}</div>
  <button class="fc-btn" id="fc-mref">📖 기준 요약</button><button class="fc-btn pri" id="fc-msub">동의 회신 제출 ▶</button></div>`);
  $('mx').onclick = closeModal;
  $('mref').onclick = () => openRef(k);
  card.querySelectorAll('.fc-chip').forEach(c => c.onclick = () => {
    const id = c.dataset.id;
    if (sel.has(id)) sel.delete(id); else sel.add(id);
    c.classList.toggle('on'); c.classList.remove('miss', 'extra');
    s.sel = [...sel]; save();
  });
  $('msub').onclick = () => submit(k, sel);
}
const nm = id => SYSTEMS.find(s => s.id === id).name;
function extrasHtml(s) {
  const ex = extrasOf(s);
  if (!ex.length) return '';
  return `<div class="fc-res fc-extra"><b>참고 — 게임 선택지 밖 HFLS 판정</b><ul>${ex.map(e => `<li><b>${esc(e.name)}</b> (${esc(e.status)}) — ${esc(e.why)}</li>`).join('')}</ul></div>`;
}
const xpMult = tries => [1, 0.6, 0.35, 0.2][Math.min(tries, 3)];

function submit(k, sel) {
  const s = S.sites[k];
  const ev = evaluate(s);
  const req = SYSTEMS.filter(x => ev[x.id].req).map(x => x.id);
  const miss = req.filter(id => !sel.has(id));
  const extra = [...sel].filter(id => !ev[id].req && !ev[id].chk); // '확인 필요'는 채점 제외
  if (miss.length || extra.length) {
    const groupErr = {};
    for (const id of [...miss, ...extra]) { const g = SYSTEMS.find(x => x.id === id).g; groupErr[g] = (groupErr[g] || 0) + 1; }
    s.tries++; s.last = { miss, extra, groupErr }; save(); updateHud();
    openReview(k);
    card.querySelector('.fc-res')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  // 적합
  const gain = Math.round((20 + req.length * 8 + Math.min(s.GF, 30) * 2) * xpMult(s.tries));
  const firstTry = s.tries === 0;
  const multi = LV.phases.length > 1;
  showModal(`<div class="fc-hd"><h2>✅ 동의 회신 완료 — ${esc(s.name)}</h2></div>
  <div class="fc-bd"><div class="fc-big">🏢✨</div><div class="fc-ctr"><b style="font-size:17px">설치대상 판정 적합!</b> ${firstTry ? '<span class="fc-tag y">1회 적합</span>' : ''}<br><span style="color:#f77f00;font-weight:900;font-size:20px">+${gain} XP</span></div>
  <table class="fc-ans"><tr><th>소방시설</th><th>판정</th><th>근거·사유</th></tr>
  ${SYSTEMS.map(x => `<tr class="${ev[x.id].req ? 'y' : ''}"><td>${x.name}</td><td>${ev[x.id].req ? '<span class="fc-tag y">설치</span>' : ev[x.id].chk ? '<span class="fc-tag c">확인 필요</span>' : '<span class="fc-tag n">해당없음</span>'}</td><td>${esc(ev[x.id].why)}</td></tr>`).join('')}
  </table>${extrasHtml(s)}<div class="fc-note">HFLS 판정 엔진으로 ${s.date} 기준 채점 · 별표5 면제는 간이SP←SP, 비상경보←자탐·단독경보형, 연결살수←SP·간이SP만 반영 · '확인 필요'는 채점 제외</div></div>
  <div class="fc-ft"><button class="fc-btn go" id="fc-mok">${multi ? '🚒 동의 회신 — 소방관 출동' : '🚒 준공 처리 — 소방관 출동'}</button></div>`);
  $('mok').onclick = () => { closeModal(); s.req = req; if (multi) advance(k, gain, firstTry); else complete(k, gain, firstTry && s.firstAll !== false); };
}

// ================== 중급·고급 단계 검토 ==================
const qCache = new Map();
function stageQs(s) {
  const pn = LV.phases[s.ph || 0];
  const ck = `${s.no}:${pn}`;
  if (!qCache.has(ck)) {
    let r = { qs: [], facs: [] };
    try { r = pn === 'start' ? stages.startQuestions(s) : stages.postQuestions(s, ADV); } catch (e) { r = { qs: [], facs: [], err: true }; }
    qCache.set(ck, r);
  }
  return qCache.get(ck);
}
const shortRef = r => String(r || '').split(/,\s*같은|, /)[0];
function openStage(k) {
  const s = S.sites[k]; if (!s) return;
  const pn = LV.phases[s.ph];
  const { qs, facs } = stageQs(s);
  const picks = s.picks || (s.picks = {});
  const wrong = new Set(s.last ? s.last.wrong : []);
  const detail = s.tries >= 2 && s.last;
  const qHtml = qs.map(q => {
    const hide = q.parent && picks[q.parent.id] !== q.parent.v;
    const sel = q.kind === 'multi' ? new Set(picks[q.id] || []) : null;
    const err = wrong.has(q.id) ? '<span class="fc-err">⚠ 불일치</span>' : '';
    const chips = q.opts.map(o => `<button class="fc-chip${(sel ? sel.has(o.v) : picks[q.id] === o.v) ? ' on' : ''}" data-q="${q.id}" data-v="${esc(o.v)}">${esc(o.label)}</button>`).join('');
    const det = detail && wrong.has(q.id)
      ? `<div class="fc-why"><b>정답: ${esc(answerLabel(q))}</b> — ${esc(q.why)}${q.kind === 'multi' ? `<ul>${q.opts.map(o => `<li>${esc(o.label)}: ${esc(q.whyOf[o.v])}</li>`).join('')}</ul>` : ''}</div>` : '';
    return `<div class="fc-grp fc-q" data-qbox="${q.id}"${q.parent ? ` data-parent="${q.parent.id}" data-pv="${q.parent.v}"` : ''}${hide ? ' style="display:none"' : ''}><h4>${esc(q.title)} <small>${esc(shortRef(q.ref))}</small> ${err}</h4><div class="fc-chips">${chips}</div>${det}</div>`;
  }).join('');
  const facNote = ADV ? '허가 당시 기준 설치 시설(부칙 소급은 직접 판단)' : '설치 소방시설(HFLS 판정)';
  const facList = facs.filter(f => !ADV || f.kind === 'base');
  const facHtml = `<h4 class="fc-h4">${facNote}</h4><div class="fc-chips">${facList.length ? facList.map(f => `<span class="fc-chip on sm">${esc(f.name)}${f.sub && !f.sub.partial ? ' <small>(대체)</small>' : ''}${f.check ? ' <small>(확인)</small>' : ''}</span>`).join('') : '<span class="fc-note">없음</span>'}</div>`;
  let resHtml = '';
  if (s.last && !detail) resHtml = `<div class="fc-res bad"><b>⚠ 보완 요구</b> — ${s.last.wrong.length}개 항목이 맞지 않습니다. 한 번 더 틀리면 정답과 근거가 공개됩니다.</div>`;
  else if (detail) resHtml = `<div class="fc-res bad"><b>⚠ 보완 요구 (${s.tries}회차)</b> — 각 항목 아래 정답·근거를 확인하세요.</div>`;
  const lead = pn === 'start' ? '착공 단계에서 판단할 사항을 고르세요.' : ADV ? `현재(${s.today}) 기준으로 판단하세요. 부칙 소급 의무 시설도 반영합니다.` : '준공 후 소방안전관리 사항을 고르세요.';
  showModal(`<div class="fc-hd"><h2>${pn === 'start' ? '🏗' : '🏢'} ${PH[pn].stamp} — ${esc(s.name)}</h2><button class="fc-x" id="fc-mx">×</button></div>
  <div class="fc-bd"><div class="fc-grid2 fc-stagegrid"><div>${infoTable(s)}${facHtml}</div>
  <div><div class="fc-lead">${lead}</div>${qs.length ? qHtml : '<div class="fc-note">판정할 항목이 없습니다 — 그대로 제출하세요.</div>'}${resHtml}</div></div></div>
  <div class="fc-ft"><div class="fc-grow">${s.tries ? `제출 ${s.tries}회 · 이번 적합 시 XP ${Math.round(xpMult(s.tries) * 100)}%` : '첫 제출에 적합하면 XP 100%'}</div>
  <button class="fc-btn" id="fc-mref">📖 기준 요약</button><button class="fc-btn pri" id="fc-msub">검토 결과 제출 ▶</button></div>`);
  $('mx').onclick = closeModal;
  $('mref').onclick = () => openRef(k);
  card.querySelectorAll('.fc-chip[data-q]').forEach(c => c.onclick = () => {
    const q = qs.find(x => x.id === c.dataset.q), v = c.dataset.v;
    if (q.kind === 'multi') {
      const set = new Set(picks[q.id] || []);
      if (set.has(v)) set.delete(v); else set.add(v);
      picks[q.id] = [...set];
      c.classList.toggle('on');
    } else {
      picks[q.id] = picks[q.id] === v ? undefined : v;
      card.querySelectorAll(`.fc-chip[data-q="${q.id}"]`).forEach(x => x.classList.toggle('on', x.dataset.v === picks[q.id]));
      card.querySelectorAll(`[data-parent="${q.id}"]`).forEach(box => { box.style.display = picks[q.id] === box.dataset.pv ? '' : 'none'; });
    }
    save();
  });
  $('msub').onclick = () => submitStage(k);
}
function submitStage(k) {
  const s = S.sites[k];
  const pn = LV.phases[s.ph];
  const { qs } = stageQs(s);
  const r = stages.gradeAnswers(qs, s.picks || {});
  if (r.wrong.length) {
    s.tries++; s.last = { wrong: r.wrong }; save(); updateHud();
    openStage(k);
    card.querySelector('.fc-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const gain = Math.round((20 + r.scored * (pn === 'start' ? 10 : 15)) * xpMult(s.tries));
  const firstTry = s.tries === 0;
  const lastPh = s.ph >= LV.phases.length - 1;
  showModal(`<div class="fc-hd"><h2>✅ ${PH[pn].stamp} 적합 — ${esc(s.name)}</h2></div>
  <div class="fc-bd"><div class="fc-ctr"><b style="font-size:17px">검토 적합!</b> ${firstTry ? '<span class="fc-tag y">1회 적합</span>' : ''}<br><span style="color:#f77f00;font-weight:900;font-size:20px">+${gain} XP</span></div>
  <table class="fc-ans"><tr><th>항목</th><th>정답</th><th>근거</th></tr>
  ${qs.map(q => `<tr><td>${esc(q.title)}</td><td>${q.chk ? '<span class="fc-tag c">확인 필요</span>' : `<b>${esc(answerLabel(q))}</b>`}</td><td>${esc(q.why)}<br><small>${esc(q.ref)}</small></td></tr>`).join('')}
  </table><div class="fc-note">HFLS 판정 함수(착공 계산기·안전관리 검토와 같은 기준)로 채점 · '확인 필요'는 채점 제외</div></div>
  <div class="fc-ft"><button class="fc-btn go" id="fc-mok">🚒 ${lastPh ? (ADV ? '검토 완료' : '준공 처리') : '승인'} — 소방관 출동</button></div>`);
  $('mok').onclick = () => { closeModal(); if (lastPh) complete(k, gain, firstTry && s.firstAll !== false); else advance(k, gain, firstTry); };
}
/** 중간 단계 통과 — 진행은 즉시 저장, 다음 단계 말풍선은 소방관 도착 후 표시 */
function advance(k, gain, firstTry) {
  const s = S.sites[k];
  const pn = LV.phases[s.ph];
  s.firstAll = s.firstAll !== false && firstTry;
  s.tries = 0; s.last = null; s.picks = {};
  s.showPh = s.ph; s.ph++;
  if (LV.phases[s.ph] === 'post' && !ADV) s.today = gameDate(S.day);
  S.xp += gain;
  addLog(`🖊 <b>${esc(s.name)}</b> ${PH[pn].done} 승인 (+${gain}XP)`);
  toast(`🚒 ${PH[pn].done} 승인! +${gain} XP`);
  checkPromo();
  updateHud(); save();
  heroGo(k, `${PH[pn].done} 승인`, () => { const t = S.sites[k]; if (t) delete t.showPh; updateHud(); });
}

function complete(k, gain, firstTry) {
  const s = S.sites[k];
  delete S.sites[k];
  const b = { use: s.use, tpl: s.tpl, GF: s.GF, BF: s.BF, A: s.A, Ab: s.Ab, hh: s.hh, H: s.H, name: s.name, detail: s.detail, addr: s.addr, no: s.no, date: s.date, done: s.done, today: s.today, sys: s.req || [], wait: true };
  S.b[k] = b;
  const doneTxt = ADV ? '검토 완료' : '준공 승인';
  heroGo(k, doneTxt, () => { b.wait = false; b.anim = performance.now(); burst(s.x, s.y); });
  const before = stageOf(S.pop)[0][1];
  S.pop += popOf(b);
  S.xp += gain; S.done++; if (firstTry) S.first++; S.day++;
  addLog(`✅ <b>${esc(s.name)}</b> ${ADV ? '관리 검토 완료' : '준공'} (+${gain}XP)`);
  toast(`🎉 ${esc(s.name)} ${ADV ? '검토 완료' : '준공'}! +${gain} XP`);
  const after = stageOf(S.pop)[0][1];
  if (after !== before) { addLog(`🏙 도시가 <b>${after}</b>(으)로 성장`); later(() => toast(`🏙 도시가 ${after}(으)로 성장했습니다!`), 900); growRoads(); growRoads(); }
  if (Math.random() < 0.45) growRoads();
  checkPromo();
  later(() => { spawnSites(); updateHud(); save(); pushRank(); }, 1600);
  updateHud(); save();
}
function checkPromo() {
  const nr = rankOf(S.xp);
  if (nr > S.rank) {
    const oldTier = tierUnlocked();
    S.rank = nr;
    addLog(`🎖 <b>${RANKS[nr]}</b>(으)로 진급`);
    const nt = tierUnlocked();
    const unlocked = nt > oldTier ? TPL.filter(t => t.tier === nt).map(t => TPL_NAME[t.id]) : [];
    later(() => openPromo(nr, unlocked), 2600);
  }
}

function openPromo(r, unlocked) {
  showModal(`<div class="fc-hd"><h2>🎖 진급을 축하합니다!</h2></div><div class="fc-bd fc-ctr">
  <div class="fc-big">🚒🎖</div><div style="font-size:22px;font-weight:900;color:#d62828">${RANKS[r]}</div>
  <p>정확한 인허가 검토로 도시 안전에 기여했습니다.</p>
  ${unlocked.length ? `<p><b>새로운 건축물 유형 해금</b><br>${unlocked.map(u => `<span class="fc-tag y" style="margin:3px">${u}</span>`).join(' ')}</p>` : ''}
  <p style="color:#6b7385;font-size:13px">동시 접수 가능 건수: 최대 ${maxSites()}건</p></div>
  <div class="fc-ft"><button class="fc-btn pri" id="fc-mok">계속하기</button></div>`);
  $('mok').onclick = closeModal;
}

function openInfo(k) {
  const b = S.b[k];
  showModal(`<div class="fc-hd"><h2>🏢 ${esc(b.name)} <small style="font-weight:400;color:#6b7385">준공 완료</small></h2><button class="fc-x" id="fc-mx">×</button></div>
  <div class="fc-bd"><div class="fc-grid2"><div>${infoTable(b, ADV ? '검토 완료' : '준공 완료')}</div><div><h4 style="margin:0 0 8px">설치된 소방시설 (${b.sys.length}종)</h4><div class="fc-chips">${b.sys.map(id => `<span class="fc-chip on">${nm(id)}</span>`).join('')}</div></div></div></div>
  <div class="fc-ft"><button class="fc-btn" id="fc-mok">닫기</button></div>`);
  $('mx').onclick = $('mok').onclick = closeModal;
}

function openHelp() {
  const steps = {
    basic: [
      '지도에서 <b style="color:#d62828">\'허가\'</b> 말풍선이 뜬 공사장을 누릅니다.',
      '설치해야 할 소방시설을 <b>모두</b> 골라 제출 — 맞으면 소방관이 달려가 승인하고 건물이 준공됩니다.',
      '틀리면 \'보완\' — 2회차부터 항목별 근거가 공개됩니다.',
      'XP로 진급하면 더 큰 건물이 열리고 도시가 자랍니다.',
    ],
    mid: [
      '<b style="color:#d62828">허가</b> — 설치해야 할 소방시설 선택',
      '<b style="color:#f77f00">착공</b> — 착공신고·소방기술자 등급·공사감리·감리원 등급·임시소방시설·방염·소방차 전용구역·건설현장 소방안전관리자',
      '<b style="color:#3a6ea5">준공</b> — 소방안전관리대상물 등급·자체점검',
      '단계를 통과할 때마다 소방관이 출동하고, 세 단계를 마치면 준공됩니다.',
    ],
    adv: [
      '모든 건물은 <b>과거에 허가받은 기존 건축물</b>입니다(1992~2025년).',
      '<b style="color:#d62828">허가</b> — <b>허가일 당시 기준(연혁)</b>으로 설치 소방시설 선택',
      '<b style="color:#3a6ea5">관리</b> — 지금 기준으로 소방차 전용구역·안전관리 등급·자체점검(부칙 소급 반영)',
      '착공·감리·임시소방시설은 HFLS에 연혁 기준이 없어 고급에서 다루지 않습니다.',
    ],
  }[level] || [];
  showModal(`<div class="fc-hd"><h2>❓ 플레이 방법 · ${LV.name}</h2><button class="fc-x" id="fc-mx">×</button></div>
  <div class="fc-bd" style="line-height:1.7;font-size:14.5px">
  <ol>${steps.map(t => `<li>${t}</li>`).join('')}</ol>
  <p class="fc-note">채점: HFLS 판정 엔진(신축·기존 건축물 탭과 같은 기준) · '확인 필요' 항목은 채점 제외 · 진행은 이 브라우저에 자동 저장(난이도별 따로) · 지도는 드래그로 이동, 휠·버튼으로 확대</p>
  </div><div class="fc-ft"><button class="fc-btn pri" id="fc-mok">시작하기</button></div>`);
  $('mx').onclick = $('mok').onclick = closeModal;
}

function openRef(backKey) {
  const rows = [
    ['소화기구', '연면적 33㎡ 이상 (단독주택: 주택용 소방시설)'],
    ['주거용 주방자동소화장치', '아파트등·오피스텔 모든 층'],
    ['옥내소화전', '연면적 3,000㎡↑ 또는 지하층·4층↑ 중 600㎡↑ 층 / 근생·판매·숙박·노유자·의료·업무·공장 등은 1,500㎡↑ 또는 300㎡↑ 층'],
    ['스프링클러', '6층 이상 / 판매 5,000㎡↑ / 숙박·노유자·병원 600㎡↑ / 지하층·4층↑ 중 1,000㎡↑ 층'],
    ['간이스프링클러', '근생 1,000㎡↑ / 숙박·노유자 300~600㎡ / 노유자 생활시설 / 병원 600㎡ 미만 / 연립·다세대(주택전용) — SP 대상이면 불요'],
    ['옥외소화전', '지상 1·2층 바닥면적 합계 9,000㎡↑'],
    ['단독경보형감지기', '연립·다세대(연동형), 단독주택(주택용)'],
    ['비상경보설비', '연면적 400㎡↑ 또는 지하층 150㎡↑ — 자탐 설치 시·연동형 단독경보형 설치 시 면제'],
    ['자동화재탐지설비', '아파트·숙박·노유자생활시설 모든 층 / 6층↑ / 근생·의료 600㎡↑ / 판매·업무·공장 1,000㎡↑ / 노유자 400㎡↑'],
    ['시각경보기', '자탐 대상 중 근생·판매·숙박·의료·노유자·업무 등'],
    ['비상방송설비', '연면적 3,500㎡↑ / 지하층 제외 11층↑ / 지하 3개층↑'],
    ['자동화재속보설비', '노유자 생활시설 / 노유자 500㎡↑ 층 / 병원'],
    ['피난기구', '피난층·지상1·2층(노유자는 2층 포함)·11층↑ 제외한 지상층 — 지하층 제외(NFTC 301 표 2.1.1에 지하층 적응 기구 없음)'],
    ['유도등·유도표지', '모든 특정소방대상물'],
    ['비상조명등', '지하 포함 5층↑ & 연면적 3,000㎡↑ / 지하층 450㎡↑'],
    ['휴대용비상조명등', '숙박시설 / 수용인원 100명↑ 영화상영관·대규모점포·지하역사·지하상가'],
    ['상수도소화용수설비', '연면적 5,000㎡↑'],
    ['연결송수관설비', '5층↑ & 6,000㎡↑ / 지하 포함 7층↑ / 지하 3개층↑ & 지하 1,000㎡↑'],
    ['연결살수설비', '판매 1,000㎡↑ / 지하층 합계 150㎡↑ — SP·간이SP 설치 시 면제'],
    ['비상콘센트설비', '11층↑(11층 이상 층) / 지하 3개층↑ & 지하 1,000㎡↑'],
    ['무선통신보조설비', '30층↑(16층↑ 층) / 지하층 3,000㎡↑ / 지하 3개층↑ & 1,000㎡↑'],
  ];
  // 중급·고급 단계 기준 요약(HFLS construction.js·temporary.js·safety.js 판정 조건과 같은 내용)
  const stageRows = [
    ['착공신고', '옥내·옥외소화전, SP·간이SP, 물분무등, 소화용수, 제연, 연결송수관·연결살수, 연소방지, 비상경보·자탐·화재알림·비상방송, 비상콘센트·무선통신보조 신설 공사 (공사업법 시행령 제4조)'],
    ['소방기술자 등급', '특급: 20만㎡↑ 또는 지하 포함 40층↑ / 고급: 3만~20만㎡(아파트 제외) 또는 16~40층 / 중급: 물분무등(호스릴 제외)·제연, 5천~3만㎡(아파트 제외), 아파트 1만~20만㎡ / 초급: 1천~5천㎡(아파트 제외), 아파트 1천~1만㎡ / 자격수첩: 1천㎡ 미만 (별표2)'],
    ['공사감리 지정', '옥내·옥외소화전, SP등(캐비닛형 간이SP 제외), 물분무등(호스릴 제외), 자탐·화재알림·비상방송, 통합감시시설, 소화용수, 제연·연결송수관·연결살수·비상콘센트·무선통신·연소방지 신설 (시행령 제10조②)'],
    ['책임감리원 등급', '특급 중 소방기술사: 20만㎡↑ 또는 40층↑ / 특급: 3만~20만㎡(아파트 제외) 또는 16~40층 / 고급: 물분무등·제연, 아파트 3만~20만㎡ / 중급: 5천~3만㎡ / 초급: 5천㎡ 미만 (별표4)'],
    ['임시소방시설', '소화기: 건축허가등 동의대상 공사 / 간이소화장치: 연면적 3천㎡↑ 또는 지하·무창·4층↑ 층 600㎡↑ / 비상경보장치: 연면적 400㎡↑ 또는 지하·무창층 150㎡↑ / 가스누설경보기·간이피난유도선·비상조명등: 지하·무창층 150㎡↑ / 방화포: 용접·용단 작업 (시행령 별표8)'],
    ['방염 대상', '근생 중 의원·치과의원·한의원·조산원·산후조리원·체력단련장·공연장·종교집회장 / 옥내 문화·집회·종교·운동시설(수영장 제외) / 의료시설 / 교육연구시설 중 합숙소 / 노유자 시설 / 숙박 가능 수련시설 / 숙박시설 / 방송국·촬영소 / 다중이용업소 / 그 외 11층 이상(아파트등 제외) (소방시설법 시행령 제30조)'],
    ['소방차 전용구역', '100세대↑ 아파트, 3층↑ 기숙사 — 2018.8.10. 이후 건축허가 등 신청분 (소방기본법 시행령 제7조의12)'],
    ['건설현장 소방안전관리자', '연면적 1만5천㎡↑ / 5천㎡↑ + 지하 2개 층↑·지상 11층↑·냉동냉장창고 (화재예방법 시행령 제29조)'],
    ['소방안전관리 등급', '특급: 아파트 50층↑·200m↑, 그 외 지하 포함 30층↑·120m↑·10만㎡↑ / 1급: 아파트 30층↑·120m↑, 그 외 1만5천㎡↑·지상 11층↑ / 2급: 옥내소화전·SP·물분무등 설치 대상, 의무관리 공동주택 / 3급: 간이SP(주택전용 제외)·자탐 설치 대상 (화재예방법 시행령 별표4)'],
    ['자체점검', '작동점검: 소방안전관리대상물(특급 제외) / 종합점검: SP 설치, 물분무등(호스릴 제외) 5천㎡↑ 등 — 특급은 종합점검 반기 1회 (소방시설법 시행규칙 별표3)'],
  ];
  const tbl = rs => `<table class="fc-info fc-ref">${rs.map(r => `<tr><th style="width:150px">${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</table>`;
  const stageFirst = backKey && S.sites[backKey] && LV.phases[S.sites[backKey].ph || 0] !== 'consent';
  const consentHtml = `<h4 class="fc-h4">설치대상(현행 요약)</h4>${tbl(rows)}`;
  const stageHtml = level === 'basic' ? '' : `<h4 class="fc-h4">${ADV ? '관리 단계' : '착공·준공 단계'}</h4>${tbl(ADV ? stageRows.filter(r => ['소방차 전용구역', '소방안전관리 등급', '자체점검'].includes(r[0])) : stageRows)}`;
  showModal(`<div class="fc-hd"><h2>📖 기준 요약 (참고용)</h2><button class="fc-x" id="fc-mx">×</button></div>
  <div class="fc-bd">${stageFirst ? stageHtml + consentHtml : consentHtml + stageHtml}
  <div class="fc-note">예외·세부 조건은 생략한 요약입니다${ADV ? '(설치대상은 현행 요약 — 허가 당시 기준은 다를 수 있음)' : ''}. 채점은 HFLS 판정 결과로 합니다.</div></div>
  <div class="fc-ft">${backKey ? '<button class="fc-btn pri" id="fc-mback">◀ 검토로 돌아가기</button>' : '<button class="fc-btn" id="fc-mok">닫기</button>'}</div>`);
  $('mx').onclick = closeModal;
  if (backKey) $('mback').onclick = () => openReview(backKey); else $('mok').onclick = closeModal;
}

// ================== 랭킹 (XP → 1회 적합 횟수) ==================
let rankTimer = 0, myPos = null;
function stopRankPoll() { if (rankTimer) { clearInterval(rankTimer); rankTimer = 0; } }
cleanups.push(stopRankPoll);
function showMyPos() {
  const el = $('hMyRank');
  if (!el) return;
  el.style.display = myPos ? '' : 'none';
  el.innerHTML = myPos ? `🏆 <b>${myPos}</b>위` : '';
  // 순위 옆 랭킹 버튼: 미등록이면 「랭킹 참여」(누르면 닉네임 입력창), 등록 후엔 「랭킹 보기」
  const bt = $('hRankBtn');
  if (bt) {
    const joined = !!RK.getMe();
    bt.textContent = joined ? '랭킹 보기' : '🏆 랭킹 참여';
    bt.classList.toggle('join', !joined);
    bt.title = joined ? '랭킹 보기' : '닉네임만 입력하면 바로 참여';
  }
}
async function pushRank() {
  const j = await RK.submit(S, level);
  if (!alive || !j || j.error) return;
  const before = myPos;
  myPos = j.me && j.me.pos;
  showMyPos();
  if (before && myPos && myPos < before) toast(`🏆 랭킹 ${myPos}위로 상승!`);
}
const pct = (f, d) => (d ? Math.round(f / d * 100) + '%' : '-');
function rankRows(list, meId, admin) {
  return list.map((r, i) => `<tr class="${r.id === meId ? 'me' : ''}"><td class="pos">${r.pos || i + 1}</td><td><b>${esc(r.nick)}</b>${r.id === meId ? ' <span class="fc-tag y">나</span>' : ''}</td><td>${esc(r.rankName)}</td><td>${esc(r.stage)}</td><td class="num">${r.pop.toLocaleString()}</td><td class="num">${r.done}</td><td class="num">${r.first}회 <small>(${pct(r.first, r.done)})</small></td><td class="num"><b>${r.xp.toLocaleString()}</b></td>${admin ? `<td><button class="fc-btn sm" data-del="${esc(r.id)}" data-nick="${esc(r.nick)}">삭제</button></td>` : ''}</tr>`).join('');
}
async function openRank(opts = {}) {
  const me = RK.getMe();
  const admin = getAdminPw();
  const head = `<div class="fc-hd"><h2>🏆 랭킹 · ${LV.name} <small style="font-weight:400;color:#6b7385;font-size:13px">① XP ② 1회 적합 횟수 순 · 30초마다 갱신</small></h2><button class="fc-x" id="fc-mx">×</button></div>`;
  const regForm = (msg, val) => `<div class="fc-reg"><b>${me ? '닉네임 변경' : '랭킹에 참여하기'}</b><div class="fc-regrow"><input id="fc-nick" maxlength="10" placeholder="닉네임 (2~10자)" value="${esc(val || '')}"><button class="fc-btn pri" id="fc-regbtn">${me ? '변경' : '등록'}</button>${me ? '<button class="fc-btn" id="fc-regcancel">취소</button>' : ''}</div>
    <div class="fc-note">${msg ? `<span style="color:#d62828">${esc(msg)}</span><br>` : ''}로그인 없음 — 이 브라우저의 비밀키로 본인을 구분합니다. 개인정보는 받지 않고, 최고 기록이 남습니다. 닉네임은 초급·중급·고급 랭킹에 함께 쓰입니다.</div></div>`;
  const editing = opts.edit || !me;
  showModal(`${head}<div class="fc-bd">${editing ? regForm(opts.msg, opts.nick || (me && me.nick)) : `<div class="fc-meline">내 닉네임 <b>${esc(me.nick)}</b> <button class="fc-btn sm" id="fc-nickedit">변경</button></div>`}<div id="fc-board"><div class="fc-note">불러오는 중…</div></div></div>
  <div class="fc-ft"><div class="fc-grow" id="fc-rankinfo"></div><button class="fc-btn" id="fc-mok">닫기</button></div>`);
  $('mx').onclick = $('mok').onclick = closeModal;
  if ($('nickedit')) $('nickedit').onclick = () => openRank({ edit: true });
  if ($('regcancel')) $('regcancel').onclick = () => openRank();
  if ($('regbtn')) {
    const go = async () => {
      const nick = $('nick').value.trim();
      $('regbtn').disabled = true;
      const j = await RK.register(nick, S, level);
      if (!alive) return;
      if (j.error) return openRank({ edit: true, msg: j.error, nick });
      myPos = j.me && j.me.pos; showMyPos();
      toast(`🏆 ${esc(j.me.nick)} — 현재 ${myPos}위`);
      openRank();
    };
    $('regbtn').onclick = go;
    $('nick').onkeydown = e => { if (e.key === 'Enter') go(); };
    if (!me) setTimeout(() => $('nick') && $('nick').focus(), 50);
  }
  const load = async () => {
    const j = await RK.board(level);
    const box = $('board');
    if (!alive || !box) return;
    if (j.error) { box.innerHTML = `<div class="fc-res bad">${esc(j.error)}</div>`; return; }
    const meId = me && me.id;
    if (j.me) { myPos = j.me.pos; showMyPos(); }
    const inTop = j.me && j.top.some(r => r.id === j.me.id);
    box.innerHTML = j.top.length ? `<div class="fc-tblwrap"><table class="fc-lb"><tr><th>순위</th><th>닉네임</th><th>계급</th><th>도시</th><th class="num">인구</th><th class="num">준공</th><th class="num">1회 적합</th><th class="num">XP</th>${admin ? '<th></th>' : ''}</tr>
      ${rankRows(j.top, meId, admin)}${j.me && !inTop ? `<tr class="gap"><td colspan="${admin ? 9 : 8}">⋯</td></tr>${rankRows([j.me], meId, admin)}` : ''}</table></div>`
      : '<div class="fc-note">아직 등록된 기록이 없습니다. 첫 번째 주인공이 되어 보세요!</div>';
    $('rankinfo').textContent = `참여 ${j.total}명 · ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 기준`;
    box.querySelectorAll('[data-del]').forEach(bt => bt.onclick = async () => {
      if (!window.confirm(`「${bt.dataset.nick}」 기록을 삭제할까요? 되돌릴 수 없습니다.`)) return;
      const r = await RK.remove(bt.dataset.del, getAdminPw(), level);
      if (r.error) toast(esc(r.error)); else load();
    });
  };
  await load();
  if ($('board')) rankTimer = setInterval(load, 30000);
}
$('btnRank').onclick = () => openRank();
$('hMyRank').onclick = () => openRank();
$('hRankBtn').onclick = () => openRank();

$('btnRef').onclick = () => openRef(null);
$('btnHelp').onclick = openHelp;
$('btnReset').onclick = () => {
  showModal(`<div class="fc-hd"><h2>↺ 새 게임</h2></div><div class="fc-bd">현재 진행 상황(계급·도시·건물)이 모두 초기화됩니다. 계속할까요?</div>
  <div class="fc-ft"><button class="fc-btn" id="fc-mno">취소</button><button class="fc-btn pri" id="fc-myes">초기화</button></div>`);
  $('mno').onclick = closeModal;
  $('myes').onclick = () => { S = newState(); S.hero = homeTile(); heroQ.length = 0; hero.run = null; qCache.clear(); spawnSites(); addLog(`🚒 소방시 소방서 인허가 담당(${LV.name})으로 첫 출근`); save(); updateHud(); focusTown(); closeModal(); };
};

// ================== 시작 ==================
if (level !== 'basic') $('qTitle').textContent = ADV ? '📋 기존 건축물 검토 대기' : '📋 검토 대기(허가·착공·준공)';
S = load();
const fresh = !S;
if (!S) { S = newState(); addLog(`🚒 소방시 소방서 인허가 담당(${LV.name})으로 첫 출근`); }
for (const k in S.b) S.b[k].anim = 0;
if (!S.hero) S.hero = homeTile();
spawnSites();
resize(); focusTown();
const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
if (ro) { ro.observe(cv.parentElement); cleanups.push(() => ro.disconnect()); } else on(window, 'resize', () => { resize(); fit(); });
updateHud(); save();
rafId = requestAnimationFrame(draw);
if (fresh) openHelp();
showMyPos();
if (RK.getMe() && S.done > 0) pushRank();
// 테스트용 훅
window.__fc = { get S() { return S; }, evaluate, openReview, submit, stageQs, level, get heroBusy() { return !!hero.run || heroQ.length > 0; } };
return () => {
  alive = false;
  cancelAnimationFrame(rafId);
  cleanups.forEach(fn => fn());
  if (window.__fc && window.__fc.evaluate === evaluate) delete window.__fc;
  root.innerHTML = '';
};
}

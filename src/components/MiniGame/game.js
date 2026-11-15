// ============================================================
// 「소방 인허가 시티」 게임 본체 — initGame(root, rules) → cleanup()
//  · 원본: firecity-handoff src/game.js (IIFE) → HFLS 탭용 모듈로 전환
//  · 판정: rules.evaluate (rulesAdapter.js — HFLS evaluateAt 호출)
//  · DOM id는 'fc-' 접두어, CSS 클래스는 .fc-root 범위(MiniGame.css)
// ============================================================
/* eslint-disable no-mixed-operators */
import { SYSTEMS, GROUPS, totals, fa } from "./legacyRules";
import { MARKUP } from "./markup";

export function initGame(root, rules) {
const { evaluate, extrasOf = () => [], ASSUMPTIONS = [] } = rules;
root.innerHTML = MARKUP;
const cleanups = [];
const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); cleanups.push(() => el.removeEventListener(ev, fn, opt)); };
let rafId = 0, alive = true;
const later = (fn, ms) => { const id = setTimeout(() => { if (alive) fn(); }, ms); cleanups.push(() => clearTimeout(id)); };
// ================== 상수 ==================
const N = 20, TW = 64, TH = 32;
const WORLD_W = N * TW + 120, WORLD_H = N * TH + 330;
const OX = WORLD_W / 2, OY = 280;
const SAVE_KEY = 'firecity_v1';

const RANKS = ['소방사', '소방교', '소방장', '소방위', '소방경', '소방령', '소방정', '소방준감', '소방감', '소방정감', '소방총감'];
const RANK_XP = [0, 80, 200, 380, 620, 920, 1300, 1760, 2300, 2950, 3700];
const STAGES = [[0, '시골마을'], [40, '농촌 마을'], [150, '읍내'], [500, '소도시'], [1500, '중소도시'], [4000, '중견도시'], [10000, '대도시'], [25000, '광역도시']];

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
function gameDate(day) {
  const d = new Date(2026, 0, 5 + day * 6);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
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
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.ver === 1 && s.tiles) return s; } catch (e) { }
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
  return {
    use: t.use, tpl: t.id, GF, BF, A, Ab,
    name: pick(NAMES) + ' ' + pick(SUFFIX[t.use]), detail: pick(DETAIL[t.use]),
    addr: `소방시 ${pick(DONG)} ${ri(10, 899)}-${ri(1, 9)}`,
    no: `동의-${String(no).padStart(4, '0')}`, date: gameDate(S.day),
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

function drawBuilding(x, y, b, now) {
  const u = USE[b.use];
  let p = 1;
  if (b.anim) { p = clamp((now - b.anim) / 1500, 0, 1); if (p >= 1) b.anim = 0; }
  const ease = 1 - Math.pow(1 - p, 3);
  const H = bHeight(b) * ease;
  if (H < 1) return;
  const floors = Math.max(1, Math.round(Math.min(b.GF, 36) * ease));
  const ins = bInset(b);
  if (b.use === 'house') { box(x, y, ins, H, u.wall, u.roof, { floors, cols: 2, pitched: 12 * ease, win: 'rgba(90,120,160,.6)' }); return; }
  if (b.use === 'factory') {
    const top = box(x, y, ins, H, u.wall, u.roof, { floors, cols: 3 });
    const c = lerp(top.T, top.C, .45);
    poly([[c[0] - 4, c[1]], [c[0] + 4, c[1]], [c[0] + 4, c[1] - 22 * ease], [c[0] - 4, c[1] - 22 * ease]], '#9b3d2e');
    if (p >= 1 && Math.random() < .08) parts.push({ x: c[0], y: c[1] - 24, vx: rnd(-.1, .3), vy: -rnd(.3, .6), life: 90, max: 90, c: 'rgba(200,200,200,', s: rnd(3, 6), smoke: 1 });
    return;
  }
  const opt = { floors, cols: b.use === 'office' ? 5 : 4 };
  if (b.use === 'office') opt.win = 'rgba(40,80,140,.65)';
  const top = box(x, y, ins, H, u.wall, u.roof, opt);
  if (b.use === 'hospital' && p >= 1) {
    ctx.fillStyle = '#d62828'; const c = top.C;
    ctx.fillRect(c[0] - 7, c[1] - 2, 14, 4); ctx.fillRect(c[0] - 2, c[1] - 6, 4, 12);
  }
  if (b.use === 'apt' && p >= 1) { // 옥탑
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

function drawSite(x, y, s, now) {
  // 기초
  box(x, y, 0.2, 4, '#9a9a9a', '#b5b5b5');
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
  // 말풍선 위치 기록(나중 패스에서 그림)
  const c = iso(x + .5, y + .5);
  bubbles.push({ x: c[0], y: c[1] - Math.max(h, 40) - 24 + Math.sin(now / 350 + x * 2) * 3, k: key(x, y), s });
}

function drawBubble(bb) {
  const { x, y } = bb;
  ctx.beginPath(); ctx.moveTo(x - 6, y + 13); ctx.lineTo(x + 6, y + 13); ctx.lineTo(x, y + 21); ctx.closePath(); ctx.fillStyle = '#d62828'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fillStyle = '#d62828'; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '900 13px "Noto Sans KR",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(bb.s.tries ? '보완' : '허가', x, y + 1);
  ctx.textBaseline = 'alphabetic';
}

function draw(now) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, dpr * cam.x, dpr * cam.y);
  bubbles = [];
  drawGround();
  for (let d = 0; d <= 2 * N - 2; d++) {
    for (let x = Math.max(0, d - N + 1); x <= Math.min(d, N - 1); x++) {
      const y = d - x, k = key(x, y), t = S.tiles[y][x];
      if (S.b[k]) drawBuilding(x, y, S.b[k], now);
      else if (S.sites[k]) drawSite(x, y, S.sites[k], now);
      else if (t === 's') drawStation(x, y);
      else if (t === 't') drawTree(x, y);
    }
  }
  for (const bb of bubbles) drawBubble(bb);
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
    li.innerHTML = `<div class="fc-nm">🏗 ${esc(s.name)}</div><div class="fc-sb">${esc(USE[s.use].label.split('(')[0])} · 지상 ${s.GF}층${s.BF ? ' / 지하 ' + s.BF + '층' : ''} · ${fa(totals(s).T)}㎡${s.tries ? ' · <b style="color:#d62828">보완 ' + s.tries + '회</b>' : ''}</div>`;
    li.onclick = () => openReview(k);
    ul.appendChild(li);
  }
  $('log').innerHTML = S.log.map(l => `<li><small>${l.d}</small> ${l.h}</li>`).join('');
}

const modal = $('modal'), card = $('card');
function showModal(html) { card.innerHTML = html; modal.classList.remove('hidden'); card.scrollTop = 0; }
function closeModal() { modal.classList.add('hidden'); }
on(modal, 'click', e => { if (e.target === modal) closeModal(); });
on(document, 'keydown', e => { if (e.key === 'Escape') closeModal(); });

function infoTable(s) {
  const { T, bTot } = totals(s);
  return `<table class="fc-info">
    <tr><th>접수번호</th><td>${s.no} <span class="fc-stamp">건축허가 동의</span></td></tr>
    <tr><th>건축물명</th><td><b>${esc(s.name)}</b></td></tr>
    <tr><th>소재지</th><td>${esc(s.addr)}</td></tr>
    <tr><th>주용도</th><td><b>${esc(USE[s.use].label)}</b></td></tr>
    <tr><th>세부내역</th><td>${esc(s.detail)}</td></tr>
    <tr><th>규모</th><td><b>지상 ${s.GF}층${s.BF ? ' / 지하 ' + s.BF + '층' : ' (지하층 없음)'}</b></td></tr>
    <tr><th>지상 층별<br>바닥면적</th><td>${fa(s.A)}㎡ × ${s.GF}개층</td></tr>
    <tr><th>지하 층별<br>바닥면적</th><td>${s.BF ? fa(s.Ab) + '㎡ × ' + s.BF + '개층 (합계 ' + fa(bTot) + '㎡)' : '-'}</td></tr>
    <tr><th>연면적</th><td><b>${fa(T)}㎡</b></td></tr>
    <tr><th>신청일</th><td>${s.date} <small>(HFLS 판정 기준일)</small></td></tr>
  </table>
  <div class="fc-note">게임 가정(HFLS 입력 기본값): ${ASSUMPTIONS.map(esc).join(' · ')}</div>`;
}

function openReview(k) {
  const s = S.sites[k]; if (!s) return;
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
  showModal(`<div class="fc-hd"><h2>🏗 건축허가등 동의 검토 — ${esc(s.name)}</h2><button class="fc-x" id="fc-mx">×</button></div>
  <div class="fc-bd"><div class="fc-grid2"><div>${infoTable(s)}</div>
  <div><div style="font-size:13.5px;margin-bottom:10px;color:#4a5368">설치해야 하는 소방시설을 <b>모두</b> 선택하세요. (설치 면제·대체되는 설비는 선택하지 않음)</div>${groupsHtml}${resHtml}</div></div></div>
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
  showModal(`<div class="fc-hd"><h2>✅ 동의 회신 완료 — ${esc(s.name)}</h2></div>
  <div class="fc-bd"><div class="fc-big">🏢✨</div><div class="fc-ctr"><b style="font-size:17px">설치대상 판정 적합!</b> ${firstTry ? '<span class="fc-tag y">1회 적합</span>' : ''}<br><span style="color:#f77f00;font-weight:900;font-size:20px">+${gain} XP</span></div>
  <table class="fc-ans"><tr><th>소방시설</th><th>판정</th><th>근거·사유</th></tr>
  ${SYSTEMS.map(x => `<tr class="${ev[x.id].req ? 'y' : ''}"><td>${x.name}</td><td>${ev[x.id].req ? '<span class="fc-tag y">설치</span>' : ev[x.id].chk ? '<span class="fc-tag c">확인 필요</span>' : '<span class="fc-tag n">해당없음</span>'}</td><td>${esc(ev[x.id].why)}</td></tr>`).join('')}
  </table>${extrasHtml(s)}<div class="fc-note">판정: HFLS 판정 엔진(신축 건축물 탭과 같은 기준)으로 신청일 ${s.date} 기준 연혁을 적용. 게임 선택지 20종 모두 HFLS 판정을 사용하며, 별표5 면제는 간이SP←SP, 비상경보←자탐·단독경보형(연동), 연결살수←SP·간이SP만 '선택 안 함'으로 처리. '확인 필요'는 채점에서 제외.</div></div>
  <div class="fc-ft"><button class="fc-btn go" id="fc-mok">🎉 준공 처리</button></div>`);
  $('mok').onclick = () => { closeModal(); complete(k, gain, firstTry, req); };
}

function complete(k, gain, firstTry, req) {
  const s = S.sites[k];
  delete S.sites[k];
  const b = { use: s.use, tpl: s.tpl, GF: s.GF, BF: s.BF, A: s.A, Ab: s.Ab, name: s.name, detail: s.detail, addr: s.addr, no: s.no, date: s.date, sys: req, anim: performance.now() };
  S.b[k] = b;
  burst(s.x, s.y);
  const before = stageOf(S.pop)[0][1];
  S.pop += popOf(b);
  S.xp += gain; S.done++; if (firstTry) S.first++; S.day++;
  addLog(`✅ <b>${esc(s.name)}</b> 준공 (+${gain}XP)`);
  toast(`🎉 ${esc(s.name)} 준공! +${gain} XP`);
  const after = stageOf(S.pop)[0][1];
  if (after !== before) { addLog(`🏙 도시가 <b>${after}</b>(으)로 성장`); later(() => toast(`🏙 도시가 ${after}(으)로 성장했습니다!`), 900); growRoads(); growRoads(); }
  if (Math.random() < 0.45) growRoads();
  const nr = rankOf(S.xp);
  if (nr > S.rank) {
    const oldTier = tierUnlocked();
    S.rank = nr;
    addLog(`🎖 <b>${RANKS[nr]}</b>(으)로 진급`);
    const nt = tierUnlocked();
    const unlocked = nt > oldTier ? TPL.filter(t => t.tier === nt).map(t => TPL_NAME[t.id]) : [];
    later(() => openPromo(nr, unlocked), 1700);
  }
  later(() => { spawnSites(); updateHud(); save(); }, 1600);
  updateHud(); save();
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
  <div class="fc-bd"><div class="fc-grid2"><div>${infoTable(b)}</div><div><h4 style="margin:0 0 8px">설치된 소방시설 (${b.sys.length}종)</h4><div class="fc-chips">${b.sys.map(id => `<span class="fc-chip on">${nm(id)}</span>`).join('')}</div></div></div></div>
  <div class="fc-ft"><button class="fc-btn" id="fc-mok">닫기</button></div>`);
  $('mx').onclick = $('mok').onclick = closeModal;
}

function openHelp() {
  showModal(`<div class="fc-hd"><h2>❓ 소방 인허가 시티 — 플레이 방법</h2><button class="fc-x" id="fc-mx">×</button></div>
  <div class="fc-bd" style="line-height:1.75;font-size:14.5px">
  <p>당신은 <b>소방서 인허가 담당 소방공무원</b>입니다. 작은 시골마을에서 시작해 도시를 키워 나가세요.</p>
  <ol>
    <li>지도에서 <b style="color:#d62828">빨간 '허가' 말풍선</b>이 뜬 공사장(또는 오른쪽 대기 목록)을 클릭합니다.</li>
    <li>건축물 개요(용도·층수·바닥면적·연면적)를 보고 <b>설치해야 하는 소방시설을 모두 선택</b>한 뒤 동의 회신을 제출합니다.</li>
    <li>판정이 맞으면 건물이 <b>준공</b>되고 XP를 얻습니다. 틀리면 '보완 요구' — 1회차는 설비군별 오류 개수, 2회차부터는 항목별 근거가 공개됩니다.</li>
    <li>XP가 쌓이면 <b>진급</b>하고, 계급이 오르면 숙박·노유자·병원·아파트·고층빌딩 등 <b>더 어려운 건축물</b>이 해금됩니다.</li>
    <li>인구가 늘면 도로가 뻗어 나가고 마을이 <b>읍내 → 소도시 → 대도시</b>로 성장합니다.</li>
  </ol>
  <p class="fc-note">· 판정 기준: HFLS 판정 엔진(「소방시설 설치 및 관리에 관한 법률 시행령」 별표4 및 연혁) — 신청일 기준으로 판정하며, HFLS 기준이 바뀌면 게임 판정도 함께 바뀝니다. 무창층 등 게임에 없는 입력은 기본값(검토 화면 '게임 가정')을 씁니다.<br>· 진행 상황은 이 브라우저에 자동 저장됩니다. 지도는 드래그로 이동, 휠/버튼으로 확대·축소합니다.</p>
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
    ['상수도소화용수설비', '연면적 5,000㎡↑'],
    ['연결송수관설비', '5층↑ & 6,000㎡↑ / 지하 포함 7층↑ / 지하 3개층↑ & 지하 1,000㎡↑'],
    ['연결살수설비', '판매 1,000㎡↑ / 지하층 합계 150㎡↑ — SP·간이SP 설치 시 면제'],
    ['비상콘센트설비', '11층↑(11층 이상 층) / 지하 3개층↑ & 지하 1,000㎡↑'],
    ['무선통신보조설비', '30층↑(16층↑ 층) / 지하층 3,000㎡↑ / 지하 3개층↑ & 1,000㎡↑'],
  ];
  showModal(`<div class="fc-hd"><h2>📖 설치기준 요약 (참고용)</h2><button class="fc-x" id="fc-mx">×</button></div>
  <div class="fc-bd"><table class="fc-info fc-ref">${rows.map(r => `<tr><th style="width:150px">${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</table>
  <div class="fc-note">출처: 「소방시설 설치 및 관리에 관한 법률 시행령」 별표4·별표5, 「소방시설법」 제10조(주택용 소방시설). 무창층·수용인원·특수용도 예외 등은 생략한 요약입니다. 채점은 이 요약이 아니라 HFLS 판정 엔진 결과로 합니다.</div></div>
  <div class="fc-ft">${backKey ? '<button class="fc-btn pri" id="fc-mback">◀ 검토로 돌아가기</button>' : '<button class="fc-btn" id="fc-mok">닫기</button>'}</div>`);
  $('mx').onclick = closeModal;
  if (backKey) $('mback').onclick = () => openReview(backKey); else $('mok').onclick = closeModal;
}

$('btnRef').onclick = () => openRef(null);
$('btnHelp').onclick = openHelp;
$('btnReset').onclick = () => {
  showModal(`<div class="fc-hd"><h2>↺ 새 게임</h2></div><div class="fc-bd">현재 진행 상황(계급·도시·건물)이 모두 초기화됩니다. 계속할까요?</div>
  <div class="fc-ft"><button class="fc-btn" id="fc-mno">취소</button><button class="fc-btn pri" id="fc-myes">초기화</button></div>`);
  $('mno').onclick = closeModal;
  $('myes').onclick = () => { S = newState(); spawnSites(); addLog('🚒 소방시 소방서 인허가 담당으로 첫 출근'); save(); updateHud(); focusTown(); closeModal(); };
};

// ================== 시작 ==================
S = load();
const fresh = !S;
if (!S) { S = newState(); addLog('🚒 소방시 소방서 인허가 담당으로 첫 출근'); }
for (const k in S.b) S.b[k].anim = 0;
spawnSites();
resize(); focusTown();
const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
if (ro) { ro.observe(cv.parentElement); cleanups.push(() => ro.disconnect()); } else on(window, 'resize', () => { resize(); fit(); });
updateHud(); save();
rafId = requestAnimationFrame(draw);
if (fresh) openHelp();
// 테스트용 훅
window.__fc = { get S() { return S; }, evaluate, openReview, submit };
return () => {
  alive = false;
  cancelAnimationFrame(rafId);
  cleanups.forEach(fn => fn());
  if (window.__fc && window.__fc.evaluate === evaluate) delete window.__fc;
  root.innerHTML = '';
};
}

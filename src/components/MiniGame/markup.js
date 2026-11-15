// 「소방 인허가 시티」 화면 구조 (원본 template.html body — id는 fc- 접두어)
export const MARKUP = `
<div class="fc-app">
  <div class="fc-top">
    <div class="fc-title">🚒 소방 인허가 <span>시티</span></div>
    <div class="fc-rank" id="fc-hRank">소방사</div>
    <div class="fc-xpwrap"><div class="fc-xpbar"><i id="fc-hXp"></i></div><div class="fc-xptxt" id="fc-hXpT">0 / 80 XP</div></div>
    <div class="fc-stat">👥 인구 <b id="fc-hPop">0</b></div>
    <div class="fc-stat">🏢 준공 <b id="fc-hDone">0</b></div>
    <div class="fc-stat">🎯 1회 적합률 <b id="fc-hAcc">-</b></div>
    <div class="fc-stat">📅 <b id="fc-hDate">2026.01.05</b></div>
    <button class="fc-myrank" id="fc-hMyRank" style="display:none" title="랭킹 보기"></button>
  </div>
  <div class="fc-main">
    <div id="fc-mapWrap">
      <canvas id="fc-cv"></canvas>
      <div id="fc-stage">🏘 <b id="fc-hStage">시골마을</b><br><small id="fc-hStageNext"></small></div>
      <div id="fc-mapCtl"><button id="fc-zin" title="확대">＋</button><button id="fc-zout" title="축소">－</button><button id="fc-zfit" title="전체 보기">⤢</button></div>
      <div id="fc-toast"></div>
    </div>
    <div class="fc-side">
      <div class="fc-sec">
        <div class="fc-h3">📋 건축허가 동의 대기 <small id="fc-siteCnt" style="color:#6b7385;font-weight:400"></small></div>
        <ul id="fc-siteList"></ul>
      </div>
      <div class="fc-sec">
        <div class="fc-h3">📜 업무일지</div>
        <ul id="fc-log"></ul>
      </div>
      <div class="fc-sec fc-btns">
        <button class="fc-btn pri" id="fc-btnRank">🏆 랭킹</button>
        <button class="fc-btn" id="fc-btnRef">📖 설치기준 요약</button>
        <button class="fc-btn" id="fc-btnHelp">❓ 도움말</button>
        <button class="fc-btn" id="fc-btnReset">↺ 새 게임</button>
      </div>
    </div>
  </div>
</div>
<div id="fc-modal" class="hidden"><div class="fc-card" id="fc-card"></div></div>
`;

'use strict';
// =========================================================
// 진담은행 V7 · 팬더 행원 에디션
//  - 데이터는 이 기기의 브라우저(localStorage)에 저장됩니다.
//  - 기존 V6 저장 데이터(jindam_bank_v6)를 그대로 이어서 사용합니다.
// =========================================================

const STORAGE_KEY = 'jindam_bank_v6';
const SOUND_KEY = 'jindam_bank_sound';
const TEACHER_CODE = '老师';
const AVATARS = ['🐶', '🐱', '🐰', '🐻', '🐼', '🐯', '🦁', '🐸', '🐨', '🐹', '🦊', '🐧'];
const SHOP_EMOJIS = ['🍬', '🍭', '🍫', '⭐', '✏️', '📒', '💺', '🎵', '📚', '🎲', '👑', '🎁', '🧸', '🎟️', '🏅', '🍪'];
const BGM_LIST = ['bgm1.mp3', 'bgm2.mp3'];
const HISTORY_LEN = 40;

// ---------- 작은 도우미 ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;
const fmt = (n) => round1(n).toLocaleString('ko-KR');
const won = (n) => fmt(n) + '원';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pandaSvg = (mood = '', cls = '') =>
  `<svg class="panda ${cls}" viewBox="0 0 120 140"><use href="#panda-clerk${mood ? '-' + mood : ''}"/></svg>`;
const stockInfo = (sym) => GLOBAL_STOCKS.find((s) => s.symbol === sym);
const stockLabel = (s) => `${s.emoji} ${s.name}`;
const regionText = (s) => {
  const r = REGIONS[s.region];
  return `${r.flag} ${s.country || r.label}`;
};

// =========================================================
// 🎵 배경음악 (볼륨 조절 · 음소거 · 다음 곡)
//   iPhone/iPad는 audio.volume이 안 먹어서 Web Audio 게인으로 조절합니다.
// =========================================================
const sound = { vol: 0.25, muted: false, idx: 0 };
try {
  Object.assign(sound, JSON.parse(localStorage.getItem(SOUND_KEY) || '{}'));
} catch (e) {}
sound.idx = clamp(sound.idx | 0, 0, BGM_LIST.length - 1);

const bgm = new Audio();
bgm.preload = 'none';
bgm.src = BGM_LIST[sound.idx];
let audioCtx = null;
let gainNode = null;
let bgmStarted = false;

function setupAudioGraph() {
  if (audioCtx || !/^https?:/.test(location.protocol)) return; // 파일로 열면 기본 볼륨 사용
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    const src = audioCtx.createMediaElementSource(bgm);
    gainNode = audioCtx.createGain();
    src.connect(gainNode).connect(audioCtx.destination);
    bgm.volume = 1;
  } catch (e) {
    audioCtx = null;
    gainNode = null;
  }
}
function saveSound() {
  try {
    localStorage.setItem(SOUND_KEY, JSON.stringify(sound));
  } catch (e) {}
}
function applySound() {
  const v = sound.muted ? 0 : sound.vol;
  if (gainNode) gainNode.gain.value = v;
  else bgm.volume = v;
  const pct = Math.round(sound.vol * 100);
  $('#sound-vol').value = pct;
  $('#sound-val').textContent = sound.muted ? '꺼짐' : pct + '%';
  $('#sound-track').textContent = `${sound.idx + 1}번 곡 / 총 ${BGM_LIST.length}곡`;
  const icon = sound.muted || sound.vol === 0 ? '#i-mute' : '#i-sound';
  $$('.js-sound use, #sound-fab use, #sound-mute use').forEach((u) => u.setAttribute('href', icon));
  $('#sound-mute').classList.toggle('muted', sound.muted);
  $('#sound-vol').style.background = '';
}
function playBgm() {
  if (sound.muted || sound.vol === 0) return;
  setupAudioGraph();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  bgm.play().catch(() => {});
}
bgm.addEventListener('ended', () => nextTrack());
function nextTrack() {
  sound.idx = (sound.idx + 1) % BGM_LIST.length;
  bgm.src = BGM_LIST[sound.idx];
  saveSound();
  applySound();
  if (bgmStarted) playBgm();
}
function toggleSoundPop(e) {
  if (e) e.stopPropagation();
  $('#sound-pop').classList.toggle('open');
}

// =========================================================
// 상태 + 저장
// =========================================================
const state = {
  gameMonth: 1,
  students: {},
  stockPrices: {},
  news: [],
  shop: [],
  currentUser: null,
  tab: 'home',
  selectedStock: null,
  stockFilter: 'all',
  stockSort: 'default',
  tipIdx: 0,
  editingItem: null,
};

function freshPrice() {
  const p = Math.floor(Math.random() * 30) + 10;
  return { price: p, prev: p, base: p, open: p, origin: p, history: Array(15).fill(p) };
}

function normalizeStudent(s) {
  s.cash = Number(s.cash) || 0;
  if (!s.savings) s.savings = { isActive: false, startMonth: 0, principal: 0, interest: 0 };
  if (!s.stocks) s.stocks = {};
  Object.keys(s.stocks).forEach((sym) => {
    if (typeof s.stocks[sym] === 'number') {
      s.stocks[sym] = { qty: s.stocks[sym], avgPrice: state.stockPrices[sym] ? state.stockPrices[sym].price : 0 };
    }
    if (!state.stockPrices[sym]) delete s.stocks[sym];
  });
  if (!Array.isArray(s.logs)) s.logs = [];
  if (!Array.isArray(s.items)) s.items = [];
  if (typeof s.seenNews !== 'number') s.seenNews = 0;
  if (!s.avatar) s.avatar = '🐶';
  return s;
}

function load() {
  GLOBAL_STOCKS.forEach((st) => (state.stockPrices[st.symbol] = freshPrice()));
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch (e) {
    console.error(e);
  }
  if (saved) {
    if (saved.gameMonth) state.gameMonth = saved.gameMonth;
    if (saved.stockPrices) {
      for (const [sym, p] of Object.entries(saved.stockPrices)) {
        if (!state.stockPrices[sym] || !p || !p.price) continue;
        const base = p.base || p.price;
        state.stockPrices[sym] = {
          price: p.price,
          prev: p.prev || p.price,
          base,
          open: p.open || base,
          origin: p.origin || base,
          trend: p.trend || 0,
          trend: p.trend || 0,
          history: Array.isArray(p.history) && p.history.length ? p.history.slice(-HISTORY_LEN) : Array(15).fill(p.price),
        };
      }
    }
    if (saved.students) state.students = saved.students;
    if (Array.isArray(saved.news)) state.news = saved.news;
    if (Array.isArray(saved.shop)) state.shop = saved.shop;
    else state.shop = JSON.parse(JSON.stringify(DEFAULT_SHOP));
  } else {
    state.shop = JSON.parse(JSON.stringify(DEFAULT_SHOP));
  }
  Object.values(state.students).forEach(normalizeStudent);
}

function save() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 7,
        gameMonth: state.gameMonth,
        students: state.students,
        stockPrices: state.stockPrices,
        news: state.news,
        shop: state.shop,
      }),
    );
  } catch (e) {
    console.error('저장 실패', e);
  }
}

const me = () => (state.currentUser ? state.students[state.currentUser] : null);
function addLog(student, text) {
  student.logs.push(`<span class="log-month">[${state.gameMonth}개월]</span> ${text}`);
  if (student.logs.length > 200) student.logs.splice(0, student.logs.length - 200);
}

// ---------- 자산 계산 ----------
const getTotalBank = (s) => (s.savings.isActive ? s.savings.principal + s.savings.interest : 0);
function getTotalStockVal(s) {
  let v = 0;
  for (const [sym, d] of Object.entries(s.stocks)) if (d.qty > 0 && state.stockPrices[sym]) v += d.qty * state.stockPrices[sym].price;
  return v;
}
const getTotalAsset = (s) => s.cash + getTotalBank(s) + getTotalStockVal(s);
const investLimit = (s) => getTotalAsset(s) * 0.5;
const investRoom = (s) => Math.max(0, investLimit(s) - getTotalStockVal(s));
// 이번 달에 산 주식은 다음 달(선생님이 달력을 넘긴 뒤)부터 팔 수 있어요
const lockedQty = (d) => (d && d.lockMonth === state.gameMonth ? d.lockQty || 0 : 0);
const sellableQty = (d) => (d ? Math.max(0, d.qty - lockedQty(d)) : 0);
const pctChange = (p) => (p.open ? ((p.price - p.open) / p.open) * 100 : 0);

// =========================================================
// 공통 팝업 · 토스트
// =========================================================
function iconHtml(icon) {
  if (['happy', 'sad', 'normal'].includes(icon)) return pandaSvg(icon === 'normal' ? '' : icon);
  return icon || pandaSvg();
}
function customAlert(message, title = '알림', icon = 'normal') {
  $('#alert-title').textContent = title;
  $('#alert-msg').innerHTML = message;
  $('#alert-icon').innerHTML = iconHtml(icon);
  openModal('custom-alert');
  setTimeout(() => $('#alert-ok').focus(), 50);
}
let confirmCb = null;
function customConfirm(message, onConfirm, title = '확인해 주세요', icon = 'normal') {
  $('#confirm-title').textContent = title;
  $('#confirm-msg').innerHTML = message;
  $('#confirm-icon').innerHTML = iconHtml(icon);
  confirmCb = onConfirm;
  openModal('custom-confirm');
}
function toast(msg, mood = 'happy') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${pandaSvg(mood)}<span>${msg}</span>`;
  $('#toast-wrap').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2200);
  setTimeout(() => el.remove(), 2600);
}
function openModal(id) {
  $('#' + id).classList.add('open');
}
function closeModal(id) {
  $('#' + id).classList.remove('open');
  if (id === 'stock-modal') state.selectedStock = null;
}

// =========================================================
// 화면 전환
// =========================================================
function showView(id) {
  $$('.view').forEach((v) => v.classList.remove('active'));
  $('#' + id).classList.add('active');
  document.body.classList.toggle('in-app', id === 'view-student' || id === 'view-admin');
  $('#sound-pop').classList.remove('open');
}

function renderAvatarSelection() {
  const c = $('#avatar-selection');
  c.innerHTML = AVATARS.map(
    (a) => `<button type="button" class="avatar-item ${a === selectedAvatar ? 'selected' : ''}" data-avatar="${a}">${a}</button>`,
  ).join('');
}
let selectedAvatar = AVATARS[0];

function createAccount() {
  const nick = $('#signup-nick').value.trim();
  if (!nick) return customAlert('이름을 입력해 주세요!', '앗!', 'sad');
  if (nick === TEACHER_CODE) return customAlert('그 이름은 사용할 수 없어요.', '앗!', 'sad');
  if (state.students[nick]) return customAlert('이미 있는 이름이에요. 다른 이름을 써 주세요!', '이름이 겹쳐요', 'sad');
  const r4 = () => Math.floor(1000 + Math.random() * 9000);
  state.students[nick] = normalizeStudent({
    accountNum: `진담-${r4()}-${r4()}`,
    avatar: selectedAvatar,
    cash: 0,
    logs: [],
    seenNews: state.news.length ? state.news[state.news.length - 1].month : 0,
  });
  addLog(state.students[nick], '🪙 진담은행 통장 개설!');
  save();
  $('#signup-nick').value = '';
  showView('view-login');
  $('#login-nick').value = nick;
  customAlert(`<b>${esc(nick)}</b>님의 통장이 만들어졌어요!<br>선생님께 원래 모은 돈을 넣어 달라고 해 보세요.`, '통장 개설 완료!', 'happy');
}

function login() {
  if (!$('#view-login').classList.contains('active')) return;
  const nick = $('#login-nick').value.trim();
  if (!nick) return customAlert('이름을 입력해 주세요!', '앗!', 'sad');
  $('#login-nick').blur();
  if (nick === TEACHER_CODE) {
    $('#login-nick').value = '';
    showView('view-admin');
    renderAdmin();
    return;
  }
  const s = state.students[nick];
  if (!s) return customAlert('아직 그 이름의 통장이 없어요.<br>새 통장을 먼저 만들어 주세요!', '누구신가요?', 'sad');
  state.currentUser = nick;
  $('#login-nick').value = '';
  showView('view-student');
  switchTab('home');
  renderStudentAll();
  // 안 본 뉴스가 있으면 한 번 보여주기
  const latest = state.news[state.news.length - 1];
  if (latest && s.seenNews < latest.month) setTimeout(openNews, 400);
}

function logout() {
  state.currentUser = null;
  closeModal('stock-modal');
  showView('view-login');
}

function switchTab(tab) {
  state.tab = tab;
  $$('.tab-page').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + tab));
  $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  $('#student-main').scrollTop = 0;
  renderCurrentTab();
}

// =========================================================
// 학생 화면 렌더링
// =========================================================
function renderStudentAll() {
  const s = me();
  if (!s) return;
  $('#user-display-name').textContent = state.currentUser;
  $('#user-avatar').textContent = s.avatar;
  $('#user-account-num').textContent = s.accountNum;
  $('#game-month-display').textContent = `${state.gameMonth}개월 차`;
  renderNewsBar();
  renderHome();
  renderCurrentTab();
}
function renderCurrentTab() {
  if (!me()) return;
  if (state.tab === 'home') renderHome();
  if (state.tab === 'bank') renderBank();
  if (state.tab === 'stock') renderStocks();
  if (state.tab === 'shop') renderShop();
}

// ---------- 뉴스 바 (항상 떠 있음) ----------
function newsKind(type) {
  return type === 'good' ? '호재' : type === 'bad' ? '악재' : '관망';
}
function stripTag(text) {
  return String(text).replace(/\[(호재|악재|시장 관망)\]\s*/, '');
}
function renderNewsBar() {
  const bar = $('#news-bar');
  const latest = state.news[state.news.length - 1];
  const s = me();
  if (!latest) {
    bar.innerHTML = `
      <div class="news-tag"><svg class="ic"><use href="#i-news"/></svg>뉴스</div>
      <div class="news-lines"><div class="news-line">아직 뉴스가 없어요. 선생님이 <b>달력을 넘기면</b> 이번 달 경제 뉴스가 여기에 나와요!</div></div>`;
    return;
  }
  const isNew = s && s.seenNews < latest.month;
  bar.innerHTML = `
    ${isNew ? '<span class="news-new">NEW</span>' : ''}
    <div class="news-tag"><svg class="ic"><use href="#i-news"/></svg>${latest.month}개월</div>
    <div class="news-lines">
      <div class="news-line"><span class="k ${latest.global.type}">🌍 ${newsKind(latest.global.type)}</span>${esc(stripTag(latest.global.text))}</div>
      <div class="news-line"><span class="k ${latest.company.type}">🏢 ${newsKind(latest.company.type)}</span>${esc(stripTag(latest.company.text))}</div>
    </div>
    <span class="news-more">전체 ›</span>`;
}

function newsCardsHtml(n) {
  return `
    <div class="news-card ${n.global.type}"><span class="kind">🌍 세계 경제 뉴스 · ${newsKind(n.global.type)}</span>${esc(n.global.text)}</div>
    <div class="news-card ${n.company.type}"><span class="kind">🏢 기업 뉴스 · ${newsKind(n.company.type)}</span>${esc(n.company.text)}</div>`;
}
function openNews() {
  const list = $('#news-list');
  if (!state.news.length) {
    list.innerHTML = `<div class="empty">${pandaSvg('')}아직 뉴스가 없어요.<br>선생님이 달력을 넘기면 뉴스가 나와요!</div>`;
  } else {
    list.innerHTML = state.news
      .slice()
      .reverse()
      .map(
        (n, i) => `
        <div>
          <div class="news-month">📅 ${n.month}개월 차 ${i === 0 ? '<span class="latest">최신</span>' : ''}</div>
          ${newsCardsHtml(n)}
        </div>`,
      )
      .join('');
  }
  openModal('news-modal');
  const s = me();
  const latest = state.news[state.news.length - 1];
  if (s && latest && s.seenNews < latest.month) {
    s.seenNews = latest.month;
    save();
    renderNewsBar();
  }
}

// ---------- 홈 ----------
function renderHome() {
  const s = me();
  const cash = s.cash,
    bank = getTotalBank(s),
    stock = getTotalStockVal(s),
    total = cash + bank + stock;
  $('#my-total').textContent = won(total);
  $('#my-cash').textContent = won(cash);
  $('#my-bank').textContent = won(bank);
  $('#my-stock-val').textContent = won(stock);
  const pct = (v) => (total > 0 ? (v / total) * 100 : 0);
  $('#asset-bar').innerHTML = total
    ? `<i class="seg-cash" style="width:${pct(cash)}%"></i><i class="seg-bank" style="width:${pct(bank)}%"></i><i class="seg-stock" style="width:${pct(stock)}%"></i>`
    : '';
  if (!$('#clerk-tip').dataset.set) showTip(0);
  const logs = s.logs.slice().reverse().slice(0, 60);
  $('#my-logs').innerHTML = logs.length
    ? logs.map((l) => `<div class="log-item">${l}</div>`).join('')
    : '<div class="empty">아직 기록이 없어요.</div>';
}
function showTip(step = 1) {
  state.tipIdx = (state.tipIdx + step + PANDA_TIPS.length) % PANDA_TIPS.length;
  const el = $('#clerk-tip');
  el.innerHTML = PANDA_TIPS[state.tipIdx];
  el.dataset.set = '1';
  const p = $('#clerk-panda');
  p.classList.remove('wiggle');
  void p.getBoundingClientRect();
  p.classList.add('wiggle');
}

// ---------- 적금 ----------
function renderBank() {
  const s = me();
  $('#bank-my-cash').textContent = won(s.cash);
  const c = $('#deposit-list-container');
  if (!s.savings.isActive) {
    c.innerHTML = `
      <div class="card-title">🎯 나의 적금 통장</div>
      <div class="empty">${pandaSvg('')}아직 적금이 없어요.<br>왼쪽에서 저금하면 <b>6개월 적금</b>이 바로 시작돼요!</div>`;
    return;
  }
  const sv = s.savings;
  const passed = clamp(state.gameMonth - sv.startMonth, 0, 6);
  const remain = 6 - passed;
  const expected = sv.principal + sv.interest + sv.principal * 0.01 * remain;
  const steps = Array.from({ length: 6 }, (_, i) => {
    const done = i < passed;
    const goal = i === 5 && !done;
    return `<div class="piggy-step ${done ? 'done' : ''} ${goal ? 'goal' : ''}">${done ? '🐷' : goal ? '🎁' : '·'}<small>${i + 1}달</small></div>`;
  }).join('');
  c.innerHTML = `
    <div class="saving-box">
      <div class="row-between"><div class="card-title" style="margin:0">🎯 나의 6개월 적금</div><span class="chip chip-pink">${passed} / 6개월</span></div>
      <div class="piggy-steps">${steps}</div>
      <div class="stat-rows">
        <div class="row-between"><span>내가 넣은 돈 (원금)</span><b>${won(sv.principal)}</b></div>
        <div class="row-between plus"><span>쌓인 이자 (+1%/월)</span><b>+${won(sv.interest)}</b></div>
        <div class="row-between total"><span>지금 통장 금액</span><b>${won(sv.principal + sv.interest)}</b></div>
      </div>
      <div class="maturity-note">🎁 이대로 <b>${remain}달</b> 더 기다리면 약 <b>${won(expected)}</b>을 받을 수 있어요!</div>
      <button class="btn btn-gray sm" type="button" data-action="break-savings">중간에 해지하기 (이자 포기 😢)</button>
    </div>`;
}
function makeDeposit() {
  const input = $('#bank-input-amount');
  const amt = parseInt(input.value, 10);
  if (isNaN(amt) || amt <= 0) return customAlert('저금할 금액을 숫자로 써 주세요!', '앗!', 'sad');
  const s = me();
  if (s.cash < amt) return customAlert(`지갑에 현금이 부족해요!<br>지금 지갑: <b>${won(s.cash)}</b>`, '잔액 부족', 'sad');
  s.cash -= amt;
  if (!s.savings.isActive) {
    s.savings = { isActive: true, startMonth: state.gameMonth, principal: amt, interest: 0 };
    addLog(s, `🐷 6개월 적금 시작! (-${amt}원)`);
    customAlert('6개월 적금이 시작되었어요!<br>달력이 넘어갈 때마다 넣은 돈의 <b>1%</b>가 이자로 쌓여요.', '적금 시작', 'happy');
  } else {
    s.savings.principal += amt;
    addLog(s, `🐷 적금에 더 저금 (-${amt}원)`);
    toast(`적금에 ${amt}원을 넣었어요!`);
  }
  input.value = '';
  save();
  renderHome();
  renderBank();
}
function bankQuick(kind) {
  const s = me();
  const input = $('#bank-input-amount');
  const cur = parseInt(input.value, 10) || 0;
  let v = cur;
  if (kind === 'all') v = Math.floor(s.cash);
  else if (kind === 'half') v = Math.floor(s.cash / 2);
  else v = cur + Number(kind);
  input.value = Math.max(0, Math.min(v, Math.floor(s.cash))) || '';
}
function breakSavings() {
  customConfirm(
    '정말 적금을 깰까요?<br>중간에 해지하면 쌓인 <b>이자는 사라지고</b> 넣은 돈(원금)만 돌아와요.',
    () => {
      const s = me();
      const p = s.savings.principal;
      s.cash += p;
      addLog(s, `🏦 적금 해지 (원금 +${p}원 돌려받음)`);
      s.savings = { isActive: false, startMonth: 0, principal: 0, interest: 0 };
      save();
      renderHome();
      renderBank();
      toast(`원금 ${p}원이 지갑으로 돌아왔어요`, 'sad');
    },
    '적금 깨기',
    'sad',
  );
}

// ---------- 주식 ----------
function sparkSvg(hist, cls) {
  const h = hist.slice(-20);
  const min = Math.min(...h),
    max = Math.max(...h),
    rng = max - min || 1;
  const pts = h.map((v, i) => `${((i / (h.length - 1 || 1)) * 64).toFixed(1)},${(28 - ((v - min) / rng) * 26).toFixed(1)}`).join(' ');
  const color = cls === 'up' ? 'var(--up)' : cls === 'down' ? 'var(--down)' : '#b8b0cc';
  return `<svg class="spark" viewBox="0 0 64 30" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function chgParts(p) {
  const pct = pctChange(p);
  const diff = p.price - p.open;
  const cls = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '−';
  return { cls, text: `${arrow} ${Math.abs(diff)}원 (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`, pct };
}
function latestCompanyNews() {
  const n = state.news[state.news.length - 1];
  return n && n.month === state.gameMonth ? n.company : null;
}

function renderStockFilters() {
  const s = me();
  const owned = Object.values(s.stocks).filter((d) => d.qty > 0).length;
  const opts = [
    ['all', '전체'],
    ['mine', `⭐ 내 주식 ${owned}`],
    ['kr', '🇰🇷 한국'],
    ['us', '🇺🇸 미국'],
    ['cn', '🇨🇳 중국'],
    ['etc', '🌏 일본·대만·유럽'],
  ];
  $('#stock-filters').innerHTML = opts
    .map(([k, l]) => `<button type="button" class="chip ${state.stockFilter === k ? 'active' : ''}" data-filter="${k}">${l}</button>`)
    .join('');
}
function renderStocks() {
  const s = me();
  // 투자 한도
  const lim = investLimit(s),
    used = getTotalStockVal(s),
    room = investRoom(s);
  $('#limit-card').innerHTML = `
    <div class="card-title" style="margin-bottom:4px">🛡️ 안전 투자 규칙</div>
    <div class="desc" style="margin-bottom:6px">주식에는 내 전체 자산의 <b>절반(50%)</b>까지만 넣을 수 있어요.</div>
    <div class="row-between"><span class="label">더 투자할 수 있는 돈</span><span class="limit-big">${won(Math.min(room, s.cash))}</span></div>
    <div class="meter"><i style="width:${lim > 0 ? clamp((used / lim) * 100, 0, 100) : 0}%"></i></div>
    <div class="limit-nums"><span>투자 중 ${won(used)}</span><span>한도 ${won(lim)}</span></div>`;
  renderPortfolio();
  renderStockFilters();
  renderStockList();
}
function renderPortfolio() {
  const s = me();
  const c = $('#portfolio-container');
  let invested = 0,
    current = 0;
  const rows = [];
  for (const [sym, d] of Object.entries(s.stocks)) {
    if (!(d.qty > 0)) continue;
    const info = stockInfo(sym);
    const price = state.stockPrices[sym].price;
    const inv = d.qty * d.avgPrice,
      val = d.qty * price;
    invested += inv;
    current += val;
    const profit = val - inv;
    const pp = inv ? (profit / inv) * 100 : 0;
    const cls = profit > 0 ? 'up' : profit < 0 ? 'down' : 'flat';
    rows.push(`
      <button type="button" class="pf-item" data-stock="${sym}">
        <div><div class="pf-title">${stockLabel(info)} <span class="pf-details">${d.qty}주${lockedQty(d) ? ` · 🔒${lockedQty(d)}` : ''}</span></div>
        <div class="pf-details">평단가 ${fmt(d.avgPrice)}원 · 지금 ${price}원</div></div>
        <div class="pf-right"><div class="pf-pct ${cls}">${pp >= 0 ? '+' : ''}${pp.toFixed(1)}%</div><div class="pf-details">${won(val)}</div></div>
      </button>`);
  }
  if (!rows.length) {
    c.innerHTML = `<div class="empty">${pandaSvg('')}아직 산 주식이 없어요.<br>뉴스를 읽고 마음에 드는 회사를 골라 봐요!</div>`;
    return;
  }
  const tp = current - invested;
  const tpp = invested ? (tp / invested) * 100 : 0;
  const cls = tp > 0 ? 'up' : tp < 0 ? 'down' : 'flat';
  c.innerHTML = `
    <div class="pf-summary">
      <div class="pf-box"><div class="label">💰 산 금액</div><b>${won(invested)}</b></div>
      <div class="pf-box"><div class="label">📈 지금 가치</div><b class="${cls}">${won(current)}</b><div class="pf-details ${cls}">${tp >= 0 ? '+' : ''}${fmt(tp)}원 (${tpp >= 0 ? '+' : ''}${tpp.toFixed(1)}%)</div></div>
    </div>
    ${rows.join('')}`;
}
let lastPrices = {};
function renderStockList() {
  const s = me();
  const cn = latestCompanyNews();
  let list = GLOBAL_STOCKS.slice();
  const f = state.stockFilter;
  if (f === 'mine') list = list.filter((st) => s.stocks[st.symbol] && s.stocks[st.symbol].qty > 0);
  else if (f !== 'all') list = list.filter((st) => st.region === f);
  const P = (st) => state.stockPrices[st.symbol];
  if (state.stockSort === 'up') list.sort((a, b) => pctChange(P(b)) - pctChange(P(a)));
  if (state.stockSort === 'down') list.sort((a, b) => pctChange(P(a)) - pctChange(P(b)));
  if (state.stockSort === 'cheap') list.sort((a, b) => P(a).price - P(b).price);
  if (state.stockSort === 'pricey') list.sort((a, b) => P(b).price - P(a).price);

  const box = $('#stock-list-container');
  if (!list.length) {
    box.innerHTML = `<div class="card empty">${pandaSvg('')}여기에 해당하는 주식이 없어요.</div>`;
    return;
  }
  box.innerHTML = list
    .map((st) => {
      const p = P(st);
      const ch = chgParts(p);
      const owned = s.stocks[st.symbol] ? s.stocks[st.symbol].qty : 0;
      const prev = lastPrices[st.symbol];
      const flash = prev != null && prev !== p.price ? (p.price > prev ? 'flash-up' : 'flash-down') : '';
      const badge =
        cn && cn.symbol === st.symbol
          ? `<span class="st-badge ${cn.type}">${cn.type === 'good' ? '🔥 이번 달 호재' : '🚨 이번 달 악재'}</span>`
          : '';
      return `
      <button type="button" class="stock-card ${owned > 0 ? 'owned' : ''} ${flash}" data-stock="${st.symbol}">
        ${badge}
        <div class="st-emoji">${st.emoji}</div>
        <div class="st-info">
          <div class="st-name">${esc(st.name)}</div>
          <div class="st-meta"><span>${regionText(st)}</span>${owned > 0 ? `<span class="st-owned">⭐ ${owned}주 보유</span>` : ''}</div>
        </div>
        <div class="st-right"><span class="st-chg ${ch.cls}">${ch.text.split(' (')[0]}</span><span class="st-price">${p.price}원</span></div>
        ${sparkSvg(p.history, ch.cls)}
      </button>`;
    })
    .join('');
  GLOBAL_STOCKS.forEach((st) => (lastPrices[st.symbol] = P(st).price));
}

// 주식 거래 모달
function openStockModal(sym) {
  state.selectedStock = sym;
  const info = stockInfo(sym);
  $('#modal-stock-emoji').textContent = info.emoji;
  $('#modal-stock-name').textContent = info.name;
  $('#modal-stock-region').textContent = regionText(info);
  const cn = latestCompanyNews();
  const nb = $('#modal-stock-news');
  if (cn && cn.symbol === sym) {
    nb.className = `sm-news ${cn.type}`;
    nb.textContent = '📰 ' + cn.text;
  } else nb.className = 'sm-news hidden';
  $('#modal-qty-input').value = 1;
  openModal('stock-modal');
  updateStockModal();
}
function maxBuy(s, price) {
  return Math.max(0, Math.floor(Math.min(s.cash, investRoom(s)) / price));
}
function updateStockModal() {
  const sym = state.selectedStock;
  if (!sym) return;
  const s = me();
  const p = state.stockPrices[sym];
  const d = s.stocks[sym] || { qty: 0, avgPrice: 0 };
  const ch = chgParts(p);
  $('#modal-stock-price').textContent = p.price + '원';
  $('#modal-stock-price').className = 'sm-price ' + ch.cls;
  $('#modal-stock-change').textContent = ch.text;
  $('#modal-stock-change').className = 'sm-change ' + ch.cls;
  const profit = d.qty > 0 ? d.qty * (p.price - d.avgPrice) : 0;
  const pcls = profit > 0 ? 'up' : profit < 0 ? 'down' : '';
  $('#modal-mine').innerHTML = `
    <div>가진 주식<b>${d.qty}주</b></div>
    <div>평단가<b>${d.qty > 0 ? fmt(d.avgPrice) + '원' : '-'}</b></div>
    <div>수익<b class="${pcls}">${d.qty > 0 ? (profit >= 0 ? '+' : '') + fmt(profit) + '원' : '-'}</b></div>`;
  const qty = parseInt($('#modal-qty-input').value, 10) || 0;
  const mb = maxBuy(s, p.price);
  const total = qty * p.price;
  let warn = '';
  if (qty > mb && qty > sellableQty(d)) warn = `<br><span class="warn">지금은 최대 ${mb}주까지 살 수 있어요</span>`;
  const canSell = sellableQty(d);
  const locked = lockedQty(d);
  const lockNote = locked > 0 ? `<br><span style="font-size:12.5px;color:#6b5cf0">🔒 이번 달에 산 ${locked}주는 다음 달부터 팔 수 있어요</span>` : '';
  $('#modal-preview').innerHTML = `${qty}주 × ${p.price}원 = <b>${fmt(total)}원</b><br><span style="font-size:12.5px;color:var(--muted)">살 수 있는 최대 ${mb}주 · 지금 팔 수 있는 ${canSell}주</span>${warn}${lockNote}`;
  $('[data-trade="buy"]').disabled = !(qty > 0 && qty <= mb);
  $('[data-trade="sell"]').disabled = !(qty > 0 && qty <= canSell);
  drawStockChart(sym, d.qty > 0 ? d.avgPrice : null);
}
function setQty(v) {
  $('#modal-qty-input').value = Math.max(0, v | 0);
  updateStockModal();
}

function drawStockChart(sym, avg) {
  const canvas = $('#stock-canvas');
  const box = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const W = box.clientWidth - 16,
    H = box.clientHeight - 16;
  if (W <= 0 || H <= 0) return;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const data = state.stockPrices[sym].history;
  const vals = avg ? data.concat([avg]) : data;
  let min = Math.min(...vals),
    max = Math.max(...vals);
  const pad = (max - min) * 0.2 || 2;
  min = Math.max(0, min - pad);
  max = max + pad;
  const rng = max - min || 1;
  const cw = W - 40;
  const x = (i) => (i / (data.length - 1 || 1)) * cw;
  const y = (v) => H - 6 - ((v - min) / rng) * (H - 12);
  const p = state.stockPrices[sym];
  const up = p.price >= p.open;
  const col = up ? '#ff4f6d' : '#3f7bff';

  // 가이드 선
  ctx.strokeStyle = '#efe8f3';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const yy = 6 + ((H - 12) / 3) * i;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(cw, yy);
    ctx.stroke();
  }
  // 평단가
  if (avg) {
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#9a8cff';
    ctx.beginPath();
    ctx.moveTo(0, y(avg));
    ctx.lineTo(cw, y(avg));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#7b6cf0';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('내 평단가', 4, y(avg) - 4);
  }
  // 영역
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, up ? 'rgba(255,79,109,.28)' : 'rgba(63,123,255,.28)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  data.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
  ctx.lineTo(cw, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  // 선
  ctx.beginPath();
  data.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  // 현재 점
  const lx = x(data.length - 1),
    ly = y(data[data.length - 1]);
  ctx.beginPath();
  ctx.arc(lx, ly, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.stroke();
  // 라벨
  ctx.fillStyle = '#8f88aa';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(Math.round(max), cw + 6, 14);
  ctx.fillText(Math.round(min), cw + 6, H - 4);
  ctx.fillStyle = col;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(data[data.length - 1], cw + 6, clamp(ly + 4, 28, H - 16));
}

function executeStockTrade(type) {
  const qty = parseInt($('#modal-qty-input').value, 10);
  if (isNaN(qty) || qty <= 0) return customAlert('몇 개를 거래할지 써 주세요!', '앗!', 'sad');
  const s = me();
  const sym = state.selectedStock;
  const info = stockInfo(sym);
  const price = state.stockPrices[sym].price;
  const cost = price * qty;
  if (!s.stocks[sym]) s.stocks[sym] = { qty: 0, avgPrice: 0 };
  const d = s.stocks[sym];
  if (type === 'buy') {
    if (s.cash < cost) return customAlert(`지갑에 돈이 부족해요!<br>필요한 돈: <b>${won(cost)}</b><br>내 지갑: ${won(s.cash)}`, '잔액 부족', 'sad');
    if (getTotalStockVal(s) + cost > investLimit(s))
      return customAlert(
        `<b>[안전 투자 규칙]</b><br>주식에는 전체 자산의 50%까지만 넣을 수 있어요.<br>지금 더 넣을 수 있는 돈: <b>${won(investRoom(s))}</b>`,
        '한도 초과',
        'sad',
      );
    s.cash -= cost;
    const nq = d.qty + qty;
    d.avgPrice = (d.qty * d.avgPrice + qty * price) / nq;
    d.qty = nq;
    if (d.lockMonth !== state.gameMonth) d.lockQty = 0;
    d.lockMonth = state.gameMonth;
    d.lockQty = (d.lockQty || 0) + qty;
    addLog(s, `📈 ${stockLabel(info)} ${qty}주 샀어요 (-${cost}원)`);
    toast(`${info.name} ${qty}주를 샀어요!`, 'happy');
  } else {
    if (d.qty < qty) return customAlert('가진 주식보다 많이 팔 수 없어요!', '주식 부족', 'sad');
    if (sellableQty(d) < qty)
      return customAlert(
        `이번 달에 산 <b>${lockedQty(d)}주</b>는 <b>다음 달</b>부터 팔 수 있어요.<br>지금 팔 수 있는 주식: <b>${sellableQty(d)}주</b><br><span style="font-size:13px">주식은 금방 사고팔기보다, 뉴스를 보고 기다리는 거예요!</span>`,
        '아직 못 팔아요',
        'sad',
      );
    const profit = (price - d.avgPrice) * qty;
    d.qty -= qty;
    s.cash += cost;
    if (d.qty === 0) d.avgPrice = 0;
    addLog(s, `📉 ${stockLabel(info)} ${qty}주 팔았어요 (+${cost}원)`);
    toast(
      profit > 0 ? `${fmt(profit)}원 이익! 지갑에 ${cost}원이 들어왔어요` : profit < 0 ? `${fmt(-profit)}원 손해… 다음엔 더 잘할 수 있어요` : `지갑에 ${cost}원이 들어왔어요`,
      profit >= 0 ? 'happy' : 'sad',
    );
  }
  save();
  $('#modal-qty-input').value = 1;
  updateStockModal();
  renderHome();
  if (state.tab === 'stock') renderStocks();
}

// ---------- 실시간 주가 움직임 (2초마다) ----------
function startMarketSimulation() {
  setInterval(() => {
    let changed = false;
    GLOBAL_STOCKS.forEach((st) => {
      if (Math.random() < 0.4) return;
      const p = state.stockPrices[st.symbol];
      const trend = p.trend || 0; // 호재 +, 악재 -
      // 호재면 오를 확률↑, 악재면 내릴 확률↑ (기업 뉴스 회사는 더 강하게)
      const upChance = 0.5 + trend * 0.1;
      const dir = Math.random() < upChance ? 1 : -1;
      const amt = Math.random() > 0.8 ? dir * 2 : dir;
      // 이번 달 기준가(base)에서 보통 ±8%, 뉴스 방향으로는 조금 더(최대 ±12%)
      const room = 0.08 + Math.abs(trend) * 0.027;
      const hi = Math.round(p.base * (1 + (trend > 0 ? room : 0.08))),
        lo = Math.max(5, Math.round(p.base * (1 - (trend < 0 ? room : 0.08))));
      const np = clamp(p.price + amt, lo, hi);
      if (np !== p.price) {
        p.prev = p.price;
        p.price = np;
        p.history.push(np);
        if (p.history.length > HISTORY_LEN) p.history.shift();
        changed = true;
      }
    });
    if (!changed) return;
    save();
    if (me() && $('#view-student').classList.contains('active')) {
      if (state.tab === 'home') renderHome();
      if (state.tab === 'stock') renderStocks();
      if (state.selectedStock && $('#stock-modal').classList.contains('open')) updateStockModal();
    }
  }, 2000);
}

// ---------- 상점 ----------
function renderShop() {
  const s = me();
  $('#shop-my-cash').textContent = won(s.cash);
  const grid = $('#shop-list');
  if (!state.shop.length) {
    grid.innerHTML = `<div class="card empty" style="grid-column:1/-1">${pandaSvg('')}아직 상점에 물건이 없어요.</div>`;
  } else {
    grid.innerHTML = state.shop
      .map((it) => {
        const sold = it.stock === 0;
        const poor = s.cash < it.price;
        return `
        <div class="shop-item ${sold ? 'soldout' : ''}">
          ${it.stock > 0 ? `<span class="shop-left">${it.stock}개 남음</span>` : ''}
          <div class="shop-emoji">${esc(it.emoji)}</div>
          <div class="shop-name">${esc(it.name)}</div>
          <div class="shop-desc">${esc(it.desc || '')}</div>
          <div class="shop-price">${won(it.price)}</div>
          <button type="button" class="btn btn-pink" data-buy="${esc(it.id)}" ${sold ? 'disabled' : ''}>${sold ? '다 팔렸어요' : poor ? `${won(it.price - s.cash)} 부족` : '살래요!'}</button>
        </div>`;
      })
      .join('');
  }
  const items = s.items.slice().sort((a, b) => (a.used === b.used ? b.at - a.at : a.used ? 1 : -1));
  $('#bag-list').innerHTML = items.length
    ? items
        .map(
          (it) => `
      <div class="bag-item ${it.used ? 'used' : ''}">
        <div class="bag-emoji">${esc(it.emoji)}</div>
        <div class="bag-info"><div class="bag-name">${esc(it.name)}</div><div class="bag-sub">${it.month}개월 차에 ${won(it.price)}에 샀어요${it.used ? ' · 사용 완료' : ''}</div></div>
        ${it.used ? '<span class="chip">✅ 사용함</span>' : `<button type="button" class="chip chip-pink" data-use="${esc(it.id)}">사용하기</button>`}
      </div>`,
        )
        .join('')
    : `<div class="empty">가방이 비어 있어요. 상점에서 물건을 사 보세요!</div>`;
}
function buyItem(id) {
  const s = me();
  const it = state.shop.find((x) => x.id === id);
  if (!it) return;
  if (it.stock === 0) return customAlert('이 물건은 다 팔렸어요.', '품절', 'sad');
  if (s.cash < it.price) return customAlert(`지갑에 돈이 부족해요!<br>필요한 돈: <b>${won(it.price)}</b><br>내 지갑: ${won(s.cash)}`, '잔액 부족', 'sad');
  customConfirm(
    `<span style="font-size:40px">${esc(it.emoji)}</span><br><b>${esc(it.name)}</b>을(를)<br>${won(it.price)}에 살까요?<br><span style="font-size:13px">사고 나면 지갑에 <b>${won(s.cash - it.price)}</b>이 남아요.</span>`,
    () => {
      if (s.cash < it.price || it.stock === 0) return;
      s.cash -= it.price;
      if (it.stock > 0) it.stock -= 1;
      s.items.push({ id: uid(), itemId: it.id, emoji: it.emoji, name: it.name, price: it.price, month: state.gameMonth, at: Date.now(), used: false });
      addLog(s, `🛍️ ${esc(it.emoji)} ${esc(it.name)} 구매 (-${it.price}원)`);
      save();
      renderShop();
      renderHome();
      toast(`${esc(it.name)}을(를) 샀어요! 가방을 확인해 봐요`);
    },
    '살까요?',
    'happy',
  );
}
function useItem(id) {
  const s = me();
  const it = s.items.find((x) => x.id === id);
  if (!it || it.used) return;
  customConfirm(
    `<b>${esc(it.name)}</b>을(를) 지금 사용할까요?<br><span style="font-size:13px">선생님께 이 화면을 보여 드리고 눌러 주세요!</span>`,
    () => {
      it.used = true;
      it.usedMonth = state.gameMonth;
      addLog(s, `🎟️ ${esc(it.emoji)} ${esc(it.name)} 사용`);
      save();
      renderShop();
      renderHome();
      toast('사용 완료! 즐거운 시간 보내요');
    },
    '사용하기',
    'happy',
  );
}

// =========================================================
// 👩‍🏫 선생님 창구
// =========================================================
function renderAdmin() {
  $('#admin-month-display').textContent = state.gameMonth;
  const latest = state.news[state.news.length - 1];
  $('#admin-news').innerHTML = latest
    ? `<div class="row-between"><b style="font-family:var(--font-round)">📰 ${latest.month}개월 차 뉴스</b><button type="button" class="chip" data-action="open-news">전체 기록</button></div>${newsCardsHtml(latest)}`
    : '<div class="desc" style="margin:0">아직 뉴스가 없어요. 달력을 넘기면 첫 뉴스가 나와요.</div>';

  // 학생 목록
  const list = $('#admin-students');
  const nicks = Object.keys(state.students);
  const totals = nicks.map((n) => getTotalAsset(state.students[n]));
  const sum = totals.reduce((a, b) => a + b, 0);
  const top = nicks.length ? nicks[totals.indexOf(Math.max(...totals))] : null;
  $('#admin-economy').innerHTML = nicks.length
    ? `<div class="eco-box"><span class="label">반 전체 돈</span><b>${won(sum)}</b></div>
       <div class="eco-box"><span class="label">학생 평균</span><b>${won(sum / nicks.length)}</b></div>
       <div class="eco-box"><span class="label">최고 부자</span><b>${esc(top)}</b><span class="pf-details">${won(Math.max(...totals))}</span></div>`
    : '';
  list.innerHTML = nicks.length
    ? nicks
        .map((nick) => {
          const s = state.students[nick];
          const pending = s.items.filter((i) => !i.used).length;
          return `
        <div class="admin-student">
          <div class="av">${esc(s.avatar)}</div>
          <div class="info">
            <div class="nm">${esc(nick)}</div>
            <div class="sub mono">${esc(s.accountNum)}</div>
            <div class="cash">지갑 ${won(s.cash)} · 총 ${won(getTotalAsset(s))}${pending ? ` · 🎟️${pending}` : ''}</div>
          </div>
          <div class="admin-actions">
            <button type="button" class="mini-btn give" data-give="${esc(nick)}">지급 💸</button>
            <button type="button" class="mini-btn gray" data-take="${esc(nick)}">회수</button>
            <button type="button" class="mini-btn red" data-del="${esc(nick)}">삭제</button>
          </div>
        </div>`;
        })
        .join('')
    : `<div class="empty">${pandaSvg('')}아직 가입한 학생이 없어요.</div>`;

  // 상점 관리
  $('#admin-shop').innerHTML = state.shop.length
    ? state.shop
        .map(
          (it) => `
      <div class="admin-shop-item">
        <div class="em">${esc(it.emoji)}</div>
        <div class="info"><b>${esc(it.name)}</b><div class="pf-details">${won(it.price)} · ${it.stock < 0 ? '무제한' : `남은 수량 ${it.stock}개`}</div></div>
        <div class="row-btns">
          <button type="button" class="mini-btn gray" data-edit-item="${esc(it.id)}">수정</button>
          <button type="button" class="mini-btn red" data-del-item="${esc(it.id)}">삭제</button>
        </div>
      </div>`,
        )
        .join('')
    : '<div class="empty">상품이 없어요. "+ 새 상품"으로 추가해 주세요.</div>';

  // 사용 대기 쿠폰
  const pend = [];
  nicks.forEach((nick) =>
    state.students[nick].items.forEach((it) => {
      if (!it.used) pend.push({ nick, it });
    }),
  );
  $('#admin-pending').innerHTML = pend.length
    ? pend
        .map(
          ({ nick, it }) => `
      <div class="admin-shop-item">
        <div class="em">${esc(it.emoji)}</div>
        <div class="info"><b>${esc(nick)}</b> · ${esc(it.name)}<div class="pf-details">${it.month}개월 차 구매</div></div>
        <div class="row-btns"><button type="button" class="mini-btn mint" data-done-nick="${esc(nick)}" data-done-id="${esc(it.id)}">사용 완료</button></div>
      </div>`,
        )
        .join('')
    : '<div class="empty">기다리는 쿠폰이 없어요.</div>';
}

function rewardAmount(kind) {
  const sel = $('#admin-reward-type');
  if (sel.value === 'custom') {
    const amt = parseInt($('#admin-custom-amount').value, 10);
    if (isNaN(amt) || amt <= 0) {
      customAlert(`${kind === 'take' ? '회수' : '지급'}할 금액을 적어 주세요.`, '앗!', 'sad');
      return null;
    }
    return { amt, label: null };
  }
  return { amt: parseInt(sel.value, 10), label: sel.options[sel.selectedIndex].text };
}
function giveReward(nick) {
  const r = rewardAmount('give');
  if (!r) return;
  const s = state.students[nick];
  s.cash += r.amt;
  addLog(s, r.label ? `👩‍🏫 보상: ${esc(r.label)}` : `👩‍🏫 선생님 입금 (+${r.amt}원)`);
  save();
  renderAdmin();
  toast(`${esc(nick)}에게 ${r.amt}원 입금!`);
}
function giveRewardAll() {
  const nicks = Object.keys(state.students);
  if (!nicks.length) return customAlert('가입한 학생이 없어요.', '앗!', 'sad');
  const r = rewardAmount('give');
  if (!r) return;
  customConfirm(
    `학생 <b>${nicks.length}명</b> 모두에게 <b>${r.amt}원</b>씩 지급할까요?`,
    () => {
      nicks.forEach((n) => {
        state.students[n].cash += r.amt;
        addLog(state.students[n], r.label ? `👩‍🏫 보상: ${esc(r.label)}` : `👩‍🏫 선생님 입금 (+${r.amt}원)`);
      });
      save();
      renderAdmin();
      toast(`${nicks.length}명에게 ${r.amt}원씩 지급했어요!`);
    },
    '모두에게 지급',
    'happy',
  );
}
function takeReward(nick) {
  const r = rewardAmount('take');
  if (!r) return;
  const s = state.students[nick];
  if (s.cash < r.amt) return customAlert(`지갑 현금(${won(s.cash)})보다 많이 회수할 수 없어요.`, '회수 불가', 'sad');
  s.cash -= r.amt;
  addLog(s, r.label ? `👩‍🏫 지급 취소 (-${r.amt}원)` : `👩‍🏫 선생님 회수 (-${r.amt}원)`);
  save();
  renderAdmin();
  toast(`${esc(nick)}의 ${r.amt}원을 회수했어요`, 'sad');
}
function deleteAccount(nick) {
  customConfirm(
    `정말 <b>${esc(nick)}</b> 학생의 통장을 삭제할까요?<br>모든 돈과 기록이 사라지고 되돌릴 수 없어요.`,
    () => {
      delete state.students[nick];
      save();
      renderAdmin();
      toast(`${esc(nick)} 통장을 삭제했어요`, 'sad');
    },
    '통장 삭제',
    'sad',
  );
}
function markItemUsed(nick, id) {
  const s = state.students[nick];
  const it = s && s.items.find((x) => x.id === id);
  if (!it) return;
  it.used = true;
  it.usedMonth = state.gameMonth;
  addLog(s, `🎟️ ${esc(it.emoji)} ${esc(it.name)} 사용 (선생님 확인)`);
  save();
  renderAdmin();
  toast('사용 완료로 바꿨어요');
}

// 상점 상품 편집
function openItemModal(id) {
  const it = id ? state.shop.find((x) => x.id === id) : null;
  state.editingItem = it ? it.id : null;
  $('#item-modal-title').textContent = it ? '상품 수정' : '새 상품';
  $('#item-emoji').value = it ? it.emoji : '🎁';
  $('#item-name').value = it ? it.name : '';
  $('#item-desc').value = it ? it.desc || '' : '';
  $('#item-price').value = it ? it.price : '';
  $('#item-stock').value = it && it.stock >= 0 ? it.stock : '';
  renderEmojiPick();
  openModal('item-modal');
}
function renderEmojiPick() {
  const cur = $('#item-emoji').value;
  $('#item-emoji-pick').innerHTML = SHOP_EMOJIS.map(
    (e) => `<button type="button" class="${e === cur ? 'selected' : ''}" data-emoji="${e}">${e}</button>`,
  ).join('');
}
function saveItem() {
  const emoji = $('#item-emoji').value.trim() || '🎁';
  const name = $('#item-name').value.trim();
  const desc = $('#item-desc').value.trim();
  const price = parseInt($('#item-price').value, 10);
  const stockRaw = $('#item-stock').value.trim();
  const stock = stockRaw === '' ? -1 : Math.max(0, parseInt(stockRaw, 10) || 0);
  if (!name) return customAlert('상품 이름을 써 주세요.', '앗!', 'sad');
  if (isNaN(price) || price <= 0) return customAlert('가격을 1원 이상으로 써 주세요.', '앗!', 'sad');
  if (state.editingItem) {
    Object.assign(state.shop.find((x) => x.id === state.editingItem), { emoji, name, desc, price, stock });
  } else {
    state.shop.push({ id: uid(), emoji, name, desc, price, stock });
  }
  save();
  closeModal('item-modal');
  renderAdmin();
  toast('상점에 저장했어요!');
}
function deleteItem(id) {
  const it = state.shop.find((x) => x.id === id);
  if (!it) return;
  customConfirm(
    `<b>${esc(it.emoji)} ${esc(it.name)}</b>을(를) 상점에서 뺄까요?<br><span style="font-size:13px">이미 산 학생의 가방에서는 사라지지 않아요.</span>`,
    () => {
      state.shop = state.shop.filter((x) => x.id !== id);
      save();
      renderAdmin();
    },
    '상품 삭제',
    'sad',
  );
}

// 한 달 넘기기
function advanceGameMonth() {
  customConfirm(
    '달력을 한 달 넘길까요?<br><br>① 적금에 넣은 돈의 <b>1% 이자</b>가 쌓여요.<br>② 새 <b>경제 뉴스</b>가 나오고 주가가 움직여요.',
    () => {
      state.gameMonth += 1;
      let matured = 0;
      Object.values(state.students).forEach((s) => {
        if (!s.savings.isActive) return;
        const it = round1(s.savings.principal * 0.01);
        s.savings.interest = round1(s.savings.interest + it);
        addLog(s, `📅 한 달이 지났어요 (적금 이자 +${it}원)`);
        if (state.gameMonth - s.savings.startMonth >= 6) {
          const total = round1(s.savings.principal + s.savings.interest);
          s.cash += total;
          addLog(s, `🎉 6개월 적금 만기! (+${total}원 지갑으로)`);
          s.savings = { isActive: false, startMonth: 0, principal: 0, interest: 0 };
          matured++;
        }
      });

      // 호재 40% · 악재 40% · 관망 20% → 평균적으로 공짜 돈이 생기지 않게
      const roll = Math.random();
      const gType = roll < 0.4 ? 'good' : roll < 0.8 ? 'bad' : 'neutral';
      const gPool = MARKET_EVENTS.filter((e) => e.type === gType);
      const g = gPool[Math.floor(Math.random() * gPool.length)];
      const c = COMPANY_EVENTS[Math.floor(Math.random() * COMPANY_EVENTS.length)];
      const target = GLOBAL_STOCKS[Math.floor(Math.random() * GLOBAL_STOCKS.length)];
      const cText = c.text.replace('{회사명}', stockLabel(target));

      // 📰 뉴스 효과 (호재·악재에 따라 확실하게 움직임)
      //  - 세계 뉴스: 모든 주식 ±2~5%  (관망은 -2~+2%)
      //  - 기업 뉴스: 해당 회사만 추가로 ±10~15%
      //  - 그리고 이번 달 내내 뉴스 방향으로 조금씩 기울어서 움직임(trend)
      const gSign = g.type === 'good' ? 1 : g.type === 'bad' ? -1 : 0;
      const cSign = c.type === 'good' ? 1 : -1;
      GLOBAL_STOCKS.forEach((st) => {
        const p = state.stockPrices[st.symbol];
        const isTarget = st.symbol === target.symbol;
        let f = gSign ? gSign * ((Math.random() * 3 + 2) / 100) : (Math.random() * 4 - 2) / 100;
        if (isTarget) f += cSign * ((Math.random() * 5 + 10) / 100);
        let np = Math.round(p.price * (1 + f));
        if (np === p.price && Math.abs(f) >= 0.02) np += f > 0 ? 1 : -1; // 싼 주식도 효과가 보이게
        if (isTarget && Math.abs(np - p.price) < 2) np = p.price + cSign * 2; // 기업 뉴스는 최소 2원
        // 장기 안전장치: 처음 가격의 50% ~ 200% 안에서만
        np = clamp(np, Math.max(5, Math.round(p.origin * 0.5)), Math.round(p.origin * 2));
        p.open = p.price; // 지난달 마지막 가격 → 이번 달 비교 기준
        p.prev = p.price;
        p.price = np;
        p.base = np; // 이번 달 출렁임의 중심
        p.trend = isTarget ? cSign * 1 : gSign * 0.5; // 이번 달 기울기
        p.history.push(np);
        if (p.history.length > HISTORY_LEN) p.history.shift();
      });

      state.news.push({
        month: state.gameMonth,
        global: { text: g.text, type: g.type },
        company: { text: cText, type: c.type, symbol: target.symbol },
      });
      if (state.news.length > 36) state.news.shift();
      save();
      renderAdmin();

      let msg = `<b>${state.gameMonth}개월 차</b>가 시작되었어요!<br><br>${newsCardsHtml(state.news[state.news.length - 1])}`;
      if (matured) msg += `<br>🎉 만기 적금 <b>${matured}개</b>가 지갑으로 들어갔어요.`;
      customAlert(`<div style="text-align:left">${msg}</div>`, '달력 넘기기 완료', 'happy');
    },
    '시간 진행',
    'normal',
  );
}

function reqResetSystem() {
  customConfirm(
    '모든 학생의 통장, 뉴스, 주가가 <b>영구 삭제</b>돼요.<br>정말 초기화할까요?',
    () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      state.students = {};
      state.gameMonth = 1;
      state.news = [];
      GLOBAL_STOCKS.forEach((st) => (state.stockPrices[st.symbol] = freshPrice()));
      save();
      renderAdmin();
      customAlert('모든 데이터가 지워졌어요. (상점 상품은 그대로예요)', '초기화 완료', 'sad');
    },
    '경고!',
    'sad',
  );
}

// =========================================================
// 이벤트 연결
// =========================================================
function startJindamBank() {
  const intro = $('#intro-screen');
  if (!intro || intro.dataset.done) return;
  intro.dataset.done = '1';
  intro.style.opacity = '0';
  setTimeout(() => (intro.style.display = 'none'), 500);
  bgmStarted = true;
  playBgm();
  setTimeout(() => $('#login-nick').focus({ preventScroll: true }), 520);
}

function bindEvents() {
  const intro = $('#intro-screen');
  intro.addEventListener('pointerdown', startJindamBank);
  document.addEventListener('keydown', function onKey(e) {
    if (!$('#intro-screen').dataset.done) {
      e.preventDefault();
      startJindamBank();
    }
  });

  // 소리
  $('#sound-fab').addEventListener('click', toggleSoundPop);
  $$('.js-sound').forEach((b) => b.addEventListener('click', toggleSoundPop));
  $('[data-close-sound]').addEventListener('click', () => $('#sound-pop').classList.remove('open'));
  $('#sound-vol').addEventListener('input', (e) => {
    sound.vol = e.target.value / 100;
    if (sound.vol > 0 && sound.muted) sound.muted = false;
    applySound();
    saveSound();
    if (bgmStarted && bgm.paused) playBgm();
  });
  $('#sound-mute').addEventListener('click', () => {
    sound.muted = !sound.muted;
    applySound();
    saveSound();
    if (sound.muted) bgm.pause();
    else if (bgmStarted) playBgm();
  });
  $('#sound-next').addEventListener('click', () => {
    bgmStarted = true;
    nextTrack();
  });
  document.addEventListener('click', (e) => {
    const pop = $('#sound-pop');
    if (pop.classList.contains('open') && !pop.contains(e.target) && !e.target.closest('.js-sound, #sound-fab')) pop.classList.remove('open');
  });

  // 로그인 / 가입
  $('#btn-login').addEventListener('click', login);
  $('#login-nick').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      login();
    }
  });
  $('#btn-show-signup').addEventListener('click', () => {
    showView('view-signup');
    renderAvatarSelection();
  });
  $('#btn-cancel-signup').addEventListener('click', () => showView('view-login'));
  $('#btn-signup').addEventListener('click', createAccount);
  $('#signup-nick').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      createAccount();
    }
  });
  $('#avatar-selection').addEventListener('click', (e) => {
    const b = e.target.closest('[data-avatar]');
    if (!b) return;
    selectedAvatar = b.dataset.avatar;
    renderAvatarSelection();
  });

  // 학생 화면
  $$('.nav-btn').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  $('#news-bar').addEventListener('click', openNews);
  $('#btn-next-tip').addEventListener('click', () => showTip(1));
  $('#btn-deposit').addEventListener('click', makeDeposit);
  $('#bank-input-amount').addEventListener('keydown', (e) => e.key === 'Enter' && makeDeposit());
  $('#bank-quick').addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (b) bankQuick(b.dataset.add);
  });
  $('#stock-sort').addEventListener('change', (e) => {
    state.stockSort = e.target.value;
    renderStockList();
  });

  // 위임 클릭 (여러 화면 공통)
  document.addEventListener('click', (e) => {
    const t = e.target;
    let el;
    if ((el = t.closest('[data-action="logout"]'))) return logout();
    if ((el = t.closest('[data-action="open-news"]'))) return openNews();
    if ((el = t.closest('[data-action="break-savings"]'))) return breakSavings();
    if ((el = t.closest('[data-goto]'))) return switchTab(el.dataset.goto);
    if ((el = t.closest('[data-filter]'))) {
      state.stockFilter = el.dataset.filter;
      renderStockFilters();
      renderStockList();
      return;
    }
    if ((el = t.closest('[data-stock]'))) return openStockModal(el.dataset.stock);
    if ((el = t.closest('[data-buy]'))) return buyItem(el.dataset.buy);
    if ((el = t.closest('[data-use]'))) return useItem(el.dataset.use);
    if ((el = t.closest('[data-give]'))) return giveReward(el.dataset.give);
    if ((el = t.closest('[data-take]'))) return takeReward(el.dataset.take);
    if ((el = t.closest('[data-del]'))) return deleteAccount(el.dataset.del);
    if ((el = t.closest('[data-edit-item]'))) return openItemModal(el.dataset.editItem);
    if ((el = t.closest('[data-del-item]'))) return deleteItem(el.dataset.delItem);
    if ((el = t.closest('[data-done-id]'))) return markItemUsed(el.dataset.doneNick, el.dataset.doneId);
    if ((el = t.closest('[data-close]'))) return closeModal(el.dataset.close);
    if ((el = t.closest('[data-emoji]'))) {
      $('#item-emoji').value = el.dataset.emoji;
      renderEmojiPick();
      return;
    }
  });

  // 모달 바깥 누르면 닫기 (알림/확인 제외)
  ['stock-modal', 'news-modal', 'item-modal'].forEach((id) =>
    $('#' + id).addEventListener('click', (e) => {
      if (e.target.id === id) closeModal(id);
    }),
  );
  $('#alert-ok').addEventListener('click', () => closeModal('custom-alert'));
  $('#confirm-no').addEventListener('click', () => closeModal('custom-confirm'));
  $('#confirm-yes').addEventListener('click', () => {
    closeModal('custom-confirm');
    const cb = confirmCb;
    confirmCb = null;
    if (cb) cb();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    for (const id of ['custom-confirm', 'custom-alert', 'item-modal', 'news-modal', 'stock-modal'])
      if ($('#' + id).classList.contains('open')) return closeModal(id);
    $('#sound-pop').classList.remove('open');
  });

  // 주식 모달
  $('#stock-modal').addEventListener('click', (e) => {
    const step = e.target.closest('[data-qty]');
    if (step) return setQty((parseInt($('#modal-qty-input').value, 10) || 0) + Number(step.dataset.qty));
    const set = e.target.closest('[data-qty-set]');
    if (set) {
      const v = set.dataset.qtySet;
      const s = me();
      const p = state.stockPrices[state.selectedStock];
      if (v === 'maxbuy') return setQty(maxBuy(s, p.price));
      if (v === 'maxsell') return setQty(sellableQty(s.stocks[state.selectedStock]));
      return setQty(Number(v));
    }
    const tr = e.target.closest('[data-trade]');
    if (tr) executeStockTrade(tr.dataset.trade);
  });
  $('#modal-qty-input').addEventListener('input', updateStockModal);
  window.addEventListener('resize', () => {
    if (state.selectedStock) updateStockModal();
  });

  // 선생님
  $('#admin-reward-type').addEventListener('change', (e) => $('#admin-custom-amount').classList.toggle('hidden', e.target.value !== 'custom'));
  $('#btn-reward-all').addEventListener('click', giveRewardAll);
  $('#btn-advance').addEventListener('click', advanceGameMonth);
  $('#btn-reset').addEventListener('click', reqResetSystem);
  $('#btn-add-item').addEventListener('click', () => openItemModal(null));
  $('#btn-save-item').addEventListener('click', saveItem);
  $('#item-emoji').addEventListener('input', renderEmojiPick);

  // 다른 탭에서 데이터가 바뀌면 반영
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    load();
    if (me()) renderStudentAll();
    else if (state.currentUser) logout();
    if ($('#view-admin').classList.contains('active')) renderAdmin();
  });
}

// =========================================================
load();
bindEvents();
applySound();
renderAvatarSelection();
startMarketSimulation();

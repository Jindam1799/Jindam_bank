// --- 공통 알림 팝업 ---
function customAlert(message, title = '알림', icon = '🔔') {
  document.getElementById('alert-title').innerText = title;
  document.getElementById('alert-msg').innerHTML = message;
  document.getElementById('alert-icon').innerText = icon;
  document.getElementById('custom-alert').classList.add('active');
}
function closeAlert() {
  document.getElementById('custom-alert').classList.remove('active');
}

function customConfirm(message, onConfirm, title = '확인해주세요') {
  document.getElementById('confirm-title').innerText = title;
  document.getElementById('confirm-msg').innerHTML = message;
  document.getElementById('custom-confirm').classList.add('active');
  document.getElementById('confirm-yes').onclick = function () {
    closeConfirm();
    onConfirm();
  };
}
function closeConfirm() {
  document.getElementById('custom-confirm').classList.remove('active');
}

const AVATARS = ['🐶', '🐱', '🐰', '🐻', '🐼', '🐯', '🦁', '🐸'];
let selectedAvatar = '🐶';

const GLOBAL_STOCKS = [
  { symbol: 'AAPL', name: '🍎 애플 (미국)' },
  { symbol: 'MSFT', name: '💻 마이크로소프트 (미국)' },
  { symbol: 'GOOGL', name: '🔍 구글 (미국)' },
  { symbol: 'AMZN', name: '📦 아마존 (미국)' },
  { symbol: 'TSLA', name: '🚗 테슬라 (미국)' },
  { symbol: 'NVDA', name: '🎮 엔비디아 (미국)' },
  { symbol: 'META', name: '📱 메타 (미국)' },
  { symbol: 'NFLX', name: '🍿 넷플릭스 (미국)' },
  { symbol: '005930', name: '📱 삼성전자 (한국)' },
  { symbol: 'TCEHY', name: '🐧 텐센트 (중국)' },
  { symbol: 'BABA', name: '🛒 알리바바 (중국)' },
  { symbol: 'BIDU', name: '🐾 바이두 (중국)' },
  { symbol: 'JD', name: '📦 징둥닷컴 (중국)' },
  { symbol: 'BYDDY', name: '🚙 BYD (중국)' },
  { symbol: 'XIACY', name: '📱 샤오미 (중국)' },
  { symbol: 'NTES', name: '🕹️ 넷이즈 (중국)' },
  { symbol: 'PDD', name: '🍋 핀둬둬 (중국)' },
  { symbol: 'MEIT', name: '🛵 메이퇀 (중국)' },
  { symbol: 'NIO', name: '⚡ 니오 (중국)' },
  { symbol: 'XPEV', name: '🦅 샤오펑 (중국)' },
  { symbol: 'LI', name: '🚙 리오토 (중국)' },
  { symbol: 'TSM', name: '🔬 TSMC (대만)' },
  { symbol: 'SONY', name: '🎮 소니 (일본)' },
  { symbol: 'TM', name: '🚙 토요타 (일본)' },
  { symbol: 'NINT', name: '🍄 닌텐도 (일본)' },
  { symbol: 'DIS', name: '🏰 디즈니 (미국)' },
  { symbol: 'LEGO', name: '🧱 레고 (유럽)' },
  { symbol: 'MCD', name: '🍔 맥도날드 (미국)' },
  { symbol: 'SBUX', name: '☕ 스타벅스 (미국)' },
  { symbol: 'NKE', name: '👟 나이키 (미국)' },
];

// ==========================================
// 🎵 BGM 및 인트로 화면 제어 시스템
// ==========================================
const BGM_LIST = ['bgm1.mp3', 'bgm2.mp3']; // 재생할 음악 목록
let currentBgmIndex = 0;
let bgmAudio = new Audio(BGM_LIST[currentBgmIndex]);

// 1곡이 끝나면 다음 곡으로 넘어가고, 끝까지 가면 다시 처음으로 돌아오는 로직
bgmAudio.addEventListener('ended', function () {
  currentBgmIndex = (currentBgmIndex + 1) % BGM_LIST.length;
  bgmAudio.src = BGM_LIST[currentBgmIndex];
  bgmAudio.play();
});

// 인트로 화면 클릭/터치/키보드 입력 시 게임 시작
function startJindamBank() {
  const introScreen = document.getElementById('intro-screen');

  // 이미 인트로가 숨겨진 상태라면 무시 (중복 실행 방지)
  if (introScreen.style.display === 'none') return;

  // 인트로 화면 페이드아웃 후 삭제
  introScreen.style.opacity = '0';
  setTimeout(() => {
    introScreen.style.display = 'none';
  }, 500);

  // BGM 재생 시작!
  bgmAudio.play().catch((error) => {
    console.warn('오디오 재생이 브라우저에 의해 차단되었습니다:', error);
  });

  // 한 번 실행된 후에는 이벤트 리스너 제거
  document.removeEventListener('keydown', startJindamBank);
  document.removeEventListener('click', startJindamBank);
  document.removeEventListener('touchstart', startJindamBank);
}

// 화면이 열리자마자 사용자 입력을 기다리는 이벤트 리스너 등록
document.addEventListener('keydown', startJindamBank); // 키보드 아무 키
document.addEventListener('click', startJindamBank); // 마우스 클릭
document.addEventListener('touchstart', startJindamBank); // 모바일 터치

let state = {
  gameMonth: 1,
  students: {},
  stockPrices: {},
  currentUser: null,
  selectedStock: null,
};

// --- 초기화 ---
function init() {
  const saved = localStorage.getItem('jindam_bank_v6');

  GLOBAL_STOCKS.forEach((stock) => {
    let initPrice = Math.floor(Math.random() * 30) + 10;
    state.stockPrices[stock.symbol] = {
      price: initPrice,
      prev: initPrice,
      base: initPrice,
      history: Array(15).fill(initPrice),
    };
  });

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.gameMonth) state.gameMonth = parsed.gameMonth;
      if (parsed.students) {
        state.students = parsed.students;
        Object.values(state.students).forEach((s) => {
          if (!s.savings) {
            s.savings = {
              isActive: false,
              startMonth: 0,
              principal: 0,
              interest: 0,
            };
          }
          Object.keys(s.stocks).forEach((sym) => {
            if (typeof s.stocks[sym] === 'number') {
              s.stocks[sym] = {
                qty: s.stocks[sym],
                avgPrice: state.stockPrices[sym].price,
              };
            }
          });
        });
      }
      if (parsed.stockPrices) {
        for (const [sym, p] of Object.entries(parsed.stockPrices)) {
          if (state.stockPrices[sym] && p.base) {
            state.stockPrices[sym].base = p.base;
            state.stockPrices[sym].price = p.price;
            state.stockPrices[sym].history =
              p.history || Array(15).fill(p.price);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  renderAvatarSelection();
  startMarketSimulation();
}

function save() {
  localStorage.setItem(
    'jindam_bank_v6',
    JSON.stringify({
      gameMonth: state.gameMonth,
      students: state.students,
      stockPrices: state.stockPrices,
    }),
  );
}

function renderAvatarSelection() {
  const container = document.getElementById('avatar-selection');
  container.innerHTML = '';
  AVATARS.forEach((emoji) => {
    const div = document.createElement('div');
    div.className = `avatar-item ${emoji === selectedAvatar ? 'selected' : ''}`;
    div.innerText = emoji;
    div.onclick = () => {
      selectedAvatar = emoji;
      renderAvatarSelection();
    };
    container.appendChild(div);
  });
}

function showSignup() {
  document
    .querySelectorAll('.view')
    .forEach((v) => v.classList.remove('active'));
  document.getElementById('view-signup').classList.add('active');
}
function cancelSignup() {
  document
    .querySelectorAll('.view')
    .forEach((v) => v.classList.remove('active'));
  document.getElementById('view-login').classList.add('active');
}

function createAccount() {
  const nick = document.getElementById('signup-nick').value.trim();
  if (!nick) return customAlert('이름을 입력해주세요!', '가입 실패', '😥');
  if (state.students[nick])
    return customAlert('이미 존재하는 이름입니다.', '이름 중복', '🤔');

  state.students[nick] = {
    accountNum: `진담-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    avatar: selectedAvatar,
    cash: 0,
    savings: { isActive: false, startMonth: 0, principal: 0, interest: 0 },
    stocks: {},
    logs: ['🪙 진담은행 통장 개설!'],
  };
  save();
  customAlert(
    `${nick}님의 통장이 만들어졌어요!<br>선생님께 원래 돈을 입금해달라고 하세요.`,
    '가입 환영!',
    '🎉',
  );
  document.getElementById('signup-nick').value = '';
  cancelSignup();
}

function login() {
  // 버그 방지: 로그인 화면이 아닐 때는 (예: 이미 로그인 후 엔터키 이벤트 전파 시) 무시함
  if (!document.getElementById('view-login').classList.contains('active'))
    return;

  const nick = document.getElementById('login-nick').value.trim();
  if (!nick) return customAlert('이름을 입력해주세요!', '앗!', '✍️');

  // 선생님 중국어 비밀 로그인
  if (nick === '老师') {
    document
      .querySelectorAll('.view')
      .forEach((v) => v.classList.remove('active'));
    document.getElementById('view-admin').classList.add('active');
    renderAdminPanel();
    document.getElementById('login-nick').value = '';
    return;
  }

  const student = state.students[nick];
  if (!student) return customAlert('아직 통장이 없어요!', '누구신가요?', '👀');

  state.currentUser = nick;
  document.getElementById('user-display-name').innerText = nick;
  document.getElementById('user-avatar').innerText = student.avatar || '👶';
  document.getElementById('user-account-num').innerText = student.accountNum;

  document
    .querySelectorAll('.view')
    .forEach((v) => v.classList.remove('active'));
  document.getElementById('view-student').classList.add('active');
  document.getElementById('login-nick').value = '';

  updateStudentUI();
  switchTab('tab-home');
}

function logout() {
  state.currentUser = null;
  document
    .querySelectorAll('.view')
    .forEach((v) => v.classList.remove('active'));
  document.getElementById('view-login').classList.add('active');
}

function switchTab(tabId) {
  document.getElementById('tab-home').style.display = 'none';
  document.getElementById('tab-bank').style.display = 'none';
  document.getElementById('tab-stock').style.display = 'none';
  document.getElementById('nav-home').classList.remove('active');
  document.getElementById('nav-bank').classList.remove('active');
  document.getElementById('nav-stock').classList.remove('active');

  document.getElementById(tabId).style.display = 'block';
  document
    .getElementById(tabId.replace('tab-', 'nav-'))
    .classList.add('active');

  if (tabId === 'tab-stock') renderStockList();
  if (tabId === 'tab-bank') renderSavingsUI();
}

// --- 자산 계산 로직 ---
function getTotalBank(student) {
  return student.savings.isActive
    ? student.savings.principal + student.savings.interest
    : 0;
}
function getTotalStockVal(student) {
  let val = 0;
  for (const [sym, data] of Object.entries(student.stocks)) {
    if (data.qty > 0) val += data.qty * state.stockPrices[sym].price;
  }
  return val;
}
function getTotalAsset(student) {
  return student.cash + getTotalBank(student) + getTotalStockVal(student);
}

function updateStudentUI() {
  if (!state.currentUser) return;
  const student = state.students[state.currentUser];

  document.getElementById('game-month-display').innerText =
    `${state.gameMonth}개월 차`;
  document.getElementById('my-cash').innerText =
    student.cash.toLocaleString() + ' 원';
  document.getElementById('bank-my-cash').innerText =
    student.cash.toLocaleString() + ' 원';

  document.getElementById('my-bank').innerText =
    Math.round(getTotalBank(student) * 10) / 10 + ' 원';
  document.getElementById('my-stock-val').innerText =
    getTotalStockVal(student).toLocaleString() + ' 원';

  const logHtml = student.logs
    .slice()
    .reverse()
    .map(
      (l) =>
        `<div style="border-bottom:1px solid #eee; padding:5px 0;">${l}</div>`,
    )
    .join('');
  document.getElementById('my-logs').innerHTML = logHtml || '기록이 없어요.';
}

// --- 누적형 6개월 적금 로직 ---
function renderSavingsUI() {
  const student = state.students[state.currentUser];
  const container = document.getElementById('deposit-list-container');

  if (!student.savings.isActive) {
    container.innerHTML = `
            <div style="text-align:center; padding:10px;">
                <div style="font-size:40px; margin-bottom:10px;">🌱</div>
                <div style="color:var(--text-muted); font-size:13px; font-weight:bold;">아직 가입한 적금이 없어요.</div>
                <div style="color:var(--text-muted); font-size:12px; margin-top:5px;">위에서 저금을 하면 자동으로 6개월 만기 적금이 시작됩니다!</div>
            </div>
        `;
    return;
  }

  const s = student.savings;
  const monthsPassed = state.gameMonth - s.startMonth;
  const progressStr = '🟩'.repeat(monthsPassed) + '⬜'.repeat(6 - monthsPassed);

  container.innerHTML = `
        <div style="background:#fafafa; border:1px solid #eee; border-radius:12px; padding:15px; position:relative;">
            <div style="position:absolute; top:15px; right:15px; font-size:12px; font-weight:bold; color:var(--blue);">
                진행: ${monthsPassed} / 6 개월
            </div>
            <div style="font-weight:bold; font-size:16px; margin-bottom:10px;">🎯 나의 6개월 적금</div>
            
            <div style="font-size:15px; margin-bottom:15px; letter-spacing:2px;">
                ${progressStr}
            </div>

            <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:13px;">
                <span>내가 넣은 돈 (누적 원금):</span>
                <strong>${s.principal} 원</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:13px; color:var(--success);">
                <span>쌓인 이자 (+1%/월):</span>
                <strong>+${Math.round(s.interest * 10) / 10} 원</strong>
            </div>
            <div style="border-top:1px dashed #ccc; padding-top:10px; display:flex; justify-content:space-between; font-size:15px; font-weight:bold;">
                <span>현재 통장 자산:</span>
                <span style="color:var(--danger);">${Math.round((s.principal + s.interest) * 10) / 10} 원</span>
            </div>

            <button class="btn-cute" style="margin-top:20px; padding:8px; font-size:13px; background:#dfe6e9; color:var(--text-dark); box-shadow:0 3px 0 #b2bec3;" onclick="breakSavings()">
                적금 도중 해지하기 (이자 포기 😭)
            </button>
        </div>
    `;
}

function makeDeposit() {
  const input = document.getElementById('bank-input-amount');
  const amt = parseInt(input.value);
  if (isNaN(amt) || amt <= 0)
    return customAlert('정확한 숫자를 써주세요!', '오류', '❌');

  const student = state.students[state.currentUser];
  if (student.cash < amt)
    return customAlert('지갑에 현금이 부족해요!', '잔액 부족', '💸');

  student.cash -= amt;

  if (!student.savings.isActive) {
    student.savings = {
      isActive: true,
      startMonth: state.gameMonth,
      principal: amt,
      interest: 0,
    };
    student.logs.push(`🏦 6개월 적금 시작! (-${amt}원)`);
    customAlert(
      `새로운 6개월 적금이 시작되었어요!<br>달력이 넘어가면 누적 원금의 1%씩 이자가 쌓입니다.`,
      '적금 시작',
      '🌱',
    );
  } else {
    student.savings.principal += amt;
    student.logs.push(`🏦 적금 추가 납입 (-${amt}원)`);
    customAlert(`적금 통장에 ${amt}원을 추가로 넣었어요!`, '저금 완료', '🐷');
  }

  input.value = '';
  save();
  updateStudentUI();
  renderSavingsUI();
}

function breakSavings() {
  customConfirm(
    '정말 적금을 깰까요?<br>도중에 해지하면 그동안 쌓인 <strong>이자는 모두 사라지고 원금만</strong> 지갑으로 돌아갑니다.',
    function () {
      const student = state.students[state.currentUser];
      const principal = student.savings.principal;

      student.cash += principal;
      student.logs.push(`🏦 적금 해지 (원금 +${principal}원 수령)`);
      student.savings = {
        isActive: false,
        startMonth: 0,
        principal: 0,
        interest: 0,
      };

      save();
      updateStudentUI();
      renderSavingsUI();
      customAlert(
        `적금을 깼습니다. 원금 ${principal}원이 지갑으로 들어왔습니다.`,
        '해지 완료',
        '🥲',
      );
    },
    '적금 깨기',
  );
}

// --- 주식 포트폴리오 ---
function renderPortfolio() {
  const student = state.students[state.currentUser];
  const container = document.getElementById('portfolio-container');
  container.innerHTML = '';

  let hasStock = false;
  let totalMyInvestment = 0; // 내가 주식을 사기 위해 쓴 원래 총 돈(원금)
  let totalCurrentValue = 0; // 그 주식들의 현재 가치 합

  // 주식 목록 먼저 생성
  const listDiv = document.createElement('div');

  for (const [sym, data] of Object.entries(student.stocks)) {
    if (data.qty > 0) {
      hasStock = true;
      const stockInfo = GLOBAL_STOCKS.find((s) => s.symbol === sym);
      const curPrice = state.stockPrices[sym].price;

      const totalInvested = data.qty * data.avgPrice; // 산 원래 금액
      const totalVal = data.qty * curPrice; // 현재 가치

      totalMyInvestment += totalInvested;
      totalCurrentValue += totalVal;

      const profit = totalVal - totalInvested;
      const profitPercent = ((profit / totalInvested) * 100).toFixed(1);

      const isUp = profit >= 0;
      const color = isUp ? 'var(--success)' : 'var(--danger)';
      const sign = isUp ? '+' : '';

      const div = document.createElement('div');
      div.className = 'portfolio-item';
      div.innerHTML = `
                <div>
                    <div class="pf-title">${stockInfo.name} <span style="font-size:11px; color:#aaa;">(${data.qty}주)</span></div>
                    <div class="pf-details">평단가: ${Math.round(data.avgPrice * 10) / 10}원 | 현재가: ${curPrice}원</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:bold; color:${color}; font-size:14px; margin-bottom:3px;">${sign}${profitPercent}%</div>
                    <div style="font-size:11px; color:var(--text-muted);">산 금액: ${Math.round(totalInvested)}원</div>
                    <div style="font-size:12px; color:var(--text-dark); font-weight:bold;">현재 가치: ${Math.round(totalVal)}원</div>
                </div>
            `;
      listDiv.appendChild(div);
    }
  }

  if (!hasStock) {
    container.innerHTML =
      '<div style="color:#aaa; padding:10px; text-align:center;">보유 중인 주식이 없습니다.</div>';
  } else {
    // 전체 요약 박스 (내가 산 원래 총 주가 vs 현재 총가치)
    const totalProfit = totalCurrentValue - totalMyInvestment;
    const totalProfitPercent = (
      (totalProfit / totalMyInvestment) *
      100
    ).toFixed(1);
    const totalIsUp = totalProfit >= 0;
    const totalColor = totalIsUp ? 'var(--success)' : 'var(--danger)';
    const totalSign = totalIsUp ? '+' : '';

    const summaryDiv = document.createElement('div');
    summaryDiv.style = `background:#fff; border:1px dashed #dfe6e9; border-radius:8px; padding:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;`;
    summaryDiv.innerHTML = `
            <div>
                <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">💰 내가 산 원래 총 금액</div>
                <div style="font-weight:bold; font-size:14px; color:var(--text-dark);">${Math.round(totalMyInvestment)} 원</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">📈 현재 총 주식 가치</div>
                <div style="font-weight:bold; font-size:15px; color:${totalColor};">${Math.round(totalCurrentValue)} 원 <span style="font-size:12px;">(${totalSign}${totalProfitPercent}%)</span></div>
            </div>
        `;

    container.appendChild(summaryDiv);
    container.appendChild(listDiv);
  }
}

function renderStockList() {
  renderPortfolio();
  const container = document.getElementById('stock-list-container');
  container.innerHTML = '';
  const student = state.students[state.currentUser];

  GLOBAL_STOCKS.forEach((stock) => {
    const pData = state.stockPrices[stock.symbol];
    const change = pData.price - pData.base;
    const isUp = change >= 0;
    const owned = student.stocks[stock.symbol]
      ? student.stocks[stock.symbol].qty
      : 0;

    const div = document.createElement('div');
    div.className = 'stock-item';
    div.onclick = () => openStockModal(stock.symbol);

    div.innerHTML = `
            <div class="stock-info">
                <div class="stock-name">${stock.name}</div>
                ${owned > 0 ? `<div class="stock-owned">보유: ${owned}개</div>` : ''}
            </div>
            <div class="stock-price-col">
                <div class="stock-price">${pData.price}원</div>
                <div class="stock-trend ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'} ${Math.abs(change)}원</div>
            </div>
        `;
    container.appendChild(div);
  });
}

function drawStockChart(symbol) {
  const canvas = document.getElementById('stock-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = state.stockPrices[symbol].history;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const padding = (maxVal - minVal) * 0.2 || 5;
  const min = Math.max(0, minVal - padding);
  const max = maxVal + padding;
  const range = max - min;

  const chartWidth = canvas.width - 35;
  const isUp = data[data.length - 1] >= data[0];
  const lineColor = isUp ? '#00b894' : '#d63031';

  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = lineColor;
  ctx.lineJoin = 'round';

  data.forEach((val, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = canvas.height - ((val - min) / range) * canvas.height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.lineTo(chartWidth, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.fillStyle = isUp ? 'rgba(0,184,148,0.15)' : 'rgba(214,48,49,0.15)';
  ctx.fill();

  ctx.fillStyle = '#636e72';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.round(max)}`, chartWidth + 5, 12);
  ctx.fillText(`${Math.round(min)}`, chartWidth + 5, canvas.height - 5);

  const curY =
    canvas.height - ((data[data.length - 1] - min) / range) * canvas.height;
  ctx.fillStyle = lineColor;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`▶${data[data.length - 1]}`, chartWidth + 2, curY + 4);
}
// ----------------------------------------------------
// 주식 가격 변동 로직 (절대 한도 +-10% 적용 완료)
// ----------------------------------------------------
function applyStockLimit(basePrice, calculatedPrice) {
  const maxLimit = Math.round(basePrice * 1.1); // 최대 +10%
  const minLimit = Math.max(5, Math.round(basePrice * 0.9)); // 최대 -10%

  if (calculatedPrice > maxLimit) return maxLimit;
  if (calculatedPrice < minLimit) return minLimit;
  return calculatedPrice;
}

function startMarketSimulation() {
  // 3초에서 2초(2000ms)로 단축하여 더 역동적으로 보이게 함
  setInterval(() => {
    let changed = false;
    GLOBAL_STOCKS.forEach((stock) => {
      // 80%의 높은 확률로 주가가 변동하여 화면이 쉴 새 없이 움직이는 느낌 부여
      if (Math.random() > 0.2) {
        const p = state.stockPrices[stock.symbol];
        p.prev = p.price;

        // % 계산 대신 확실하게 움직임이 보이도록 강제로 -1원 또는 +1원 부여
        const forceChange = Math.random() > 0.5 ? 1 : -1;

        // 가끔씩(20% 확률) 2원씩 변동하도록 하여 재미 추가
        const changeAmt = Math.random() > 0.8 ? forceChange * 2 : forceChange;

        let newPrice = p.price + changeAmt;

        // 초기 주가 기준 +-10% 한도 필터링은 엄격하게 유지
        newPrice = applyStockLimit(p.base, newPrice);

        if (newPrice !== p.price) {
          p.price = newPrice;
          p.history.push(p.price);
          if (p.history.length > 15) p.history.shift();
          changed = true;
        }
      }
    });

    if (changed) {
      // 화면 새로고침
      if (document.getElementById('tab-stock').style.display === 'block')
        renderStockList();
      updateStudentUI();

      // 주식 상세 모달창을 켜둔 상태라면 모달 안의 가격과 차트도 실시간으로 흔들리게 함
      if (
        state.selectedStock &&
        document.getElementById('stock-modal').classList.contains('active')
      ) {
        document.getElementById('modal-stock-price').innerText =
          state.stockPrices[state.selectedStock].price.toLocaleString() + ' 원';
        drawStockChart(state.selectedStock);
      }
    }
  }, 2000); // 2초마다 갱신
}

// --- 주식 매매 ---
function openStockModal(symbol) {
  state.selectedStock = symbol;
  const stockInfo = GLOBAL_STOCKS.find((s) => s.symbol === symbol);
  const pData = state.stockPrices[symbol];
  const student = state.students[state.currentUser];
  const stockData = student.stocks[symbol] || { qty: 0, avgPrice: 0 };

  document.getElementById('modal-stock-name').innerText = stockInfo.name;
  document.getElementById('modal-stock-price').innerText =
    pData.price.toLocaleString() + ' 원';
  document.getElementById('modal-my-shares').innerText = stockData.qty;
  document.getElementById('modal-my-avg').innerText =
    Math.round(stockData.avgPrice * 10) / 10;
  document.getElementById('modal-qty-input').value = '';

  document.getElementById('stock-modal').classList.add('active');
  drawStockChart(symbol);
}

function closeStockModal() {
  document.getElementById('stock-modal').classList.remove('active');
  state.selectedStock = null;
}

function executeStockTrade(type) {
  const input = document.getElementById('modal-qty-input');
  const qty = parseInt(input.value);
  if (isNaN(qty) || qty <= 0)
    return customAlert('몇 개를 거래할지 정확히 써주세요!', '확인 필수', '🤔');

  const student = state.students[state.currentUser];
  const symbol = state.selectedStock;
  const price = state.stockPrices[symbol].price;
  const totalCost = price * qty;
  const stockName = GLOBAL_STOCKS.find((s) => s.symbol === symbol).name;

  if (!student.stocks[symbol]) student.stocks[symbol] = { qty: 0, avgPrice: 0 };
  const stockData = student.stocks[symbol];

  if (type === 'buy') {
    if (student.cash < totalCost)
      return customAlert(
        `지갑에 돈이 부족해요!<br>(필요한 돈: ${totalCost}원)`,
        '잔액 부족',
        '💸',
      );

    const totalAsset = getTotalAsset(student);
    const currentInvested = getTotalStockVal(student);
    const limitAmount = totalAsset * 0.5;

    if (currentInvested + totalCost > limitAmount) {
      return customAlert(
        `<b>[안전 투자 규칙]</b><br>주식에는 전체 자산의 50%까지만 투자할 수 있어요!<br>투자 한도: ${Math.floor(limitAmount)}원`,
        '한도 초과',
        '🛑',
      );
    }

    student.cash -= totalCost;
    const newTotalQty = stockData.qty + qty;
    stockData.avgPrice =
      (stockData.qty * stockData.avgPrice + qty * price) / newTotalQty;
    stockData.qty = newTotalQty;

    student.logs.push(`📈 ${stockName} 매수 (${qty}주, -${totalCost}원)`);
    customAlert(`${stockName} 주식을 샀어요!`, '매수 완료', '📈');
  } else {
    if (stockData.qty < qty)
      return customAlert('가진 주식보다 많이 팔 수 없어요!', '주식 부족', '📉');

    stockData.qty -= qty;
    student.cash += totalCost;
    if (stockData.qty === 0) stockData.avgPrice = 0;

    student.logs.push(`📉 ${stockName} 매도 (${qty}주, +${totalCost}원)`);
    customAlert(
      `${stockName} 주식을 팔아서 지갑에 돈이 들어왔어요!`,
      '매도 완료',
      '💰',
    );
  }

  save();
  updateStudentUI();
  renderStockList();
  closeStockModal();
}

// --- 선생님 패널 ---
function toggleCustomReward() {
  const select = document.getElementById('admin-reward-type');
  const customInput = document.getElementById('admin-custom-amount');
  customInput.style.display = select.value === 'custom' ? 'block' : 'none';
}

function renderAdminPanel() {
  document.getElementById('admin-month-display').innerText = state.gameMonth;
  const container = document.getElementById('admin-students');
  container.innerHTML = '';

  const nicks = Object.keys(state.students);
  if (nicks.length === 0) {
    container.innerHTML =
      '<div style="text-align:center; padding:20px; color:#aaa;">가입한 학생이 없습니다.</div>';
    return;
  }

  nicks.forEach((nick) => {
    const s = state.students[nick];
    const div = document.createElement('div');
    div.className = 'admin-student-card';
    // 개별 학생 레이아웃: 버튼 3개를 예쁘게 배치
    div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; flex:1;">
                <div style="font-size:24px;">${s.avatar || '👶'}</div>
                <div>
                    <div style="font-weight:bold; font-size:16px;">${nick}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${s.accountNum}</div>
                    <div style="font-size:12px; color:var(--danger); margin-top:2px;">지갑: ${Math.round(s.cash * 10) / 10}원 / 총: ${Math.round(getTotalAsset(s) * 10) / 10}원</div>
                </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:5px; width: 85px;">
                <button class="admin-btn" style="padding:6px 0; font-size:12px; text-align:center;" onclick="giveReward('${nick}')">지급 💸</button>
                <div style="display:flex; gap:5px;">
                    <button class="admin-btn" style="flex:1; background:#b2bec3; box-shadow: 0 3px 0 #636e72; padding:4px 0; font-size:11px; color:#2d3436;" onclick="takeReward('${nick}')">회수</button>
                    <button class="admin-btn" style="flex:1; background:var(--danger); box-shadow: 0 3px 0 #b32526; padding:4px 0; font-size:11px; color:white;" onclick="deleteAccount('${nick}')">삭제</button>
                </div>
            </div>
        `;
    container.appendChild(div);
  });
}

function giveReward(nick) {
  const select = document.getElementById('admin-reward-type');
  let amt = 0;
  let logMsg = '';
  if (select.value === 'custom') {
    amt = parseInt(document.getElementById('admin-custom-amount').value);
    if (isNaN(amt) || amt <= 0)
      return customAlert('지급할 금액을 적어주세요.', '오류', '❌');
    logMsg = `👩‍🏫 선생님 특별 입금 (+${amt}원)`;
  } else {
    amt = parseInt(select.value);
    logMsg = `👩‍🏫 보상 받음: ${select.options[select.selectedIndex].text}`;
  }
  state.students[nick].cash += amt;
  state.students[nick].logs.push(logMsg);
  save();
  renderAdminPanel();
  customAlert(`${nick}에게 ${amt}원 입금 완료.`, '지급 완료', '💖');
  document.getElementById('admin-custom-amount').value = '';
}

function takeReward(nick) {
  const select = document.getElementById('admin-reward-type');
  let amt = 0;
  let logMsg = '';
  if (select.value === 'custom') {
    amt = parseInt(document.getElementById('admin-custom-amount').value);
    if (isNaN(amt) || amt <= 0)
      return customAlert('회수할 금액을 적어주세요.', '오류', '❌');
    logMsg = `👩‍🏫 선생님 금액 회수 (-${amt}원)`;
  } else {
    amt = parseInt(select.value);
    logMsg = `👩‍🏫 선생님 지급 취소 (-${amt}원)`;
  }
  if (state.students[nick].cash < amt)
    return customAlert(
      `지갑 현금(${state.students[nick].cash}원)보다 많이 뺏을 수 없습니다.`,
      '회수 불가',
      '⚠️',
    );

  state.students[nick].cash -= amt;
  state.students[nick].logs.push(logMsg);
  save();
  renderAdminPanel();
  customAlert(`${nick}의 돈 ${amt}원을 회수했습니다.`, '취소 완료', '♻️');
  document.getElementById('admin-custom-amount').value = '';
}

// 개별 계좌 삭제
function deleteAccount(nick) {
  customConfirm(
    `정말 <strong>${nick}</strong> 학생의 통장을 삭제하시겠습니까?<br>모든 돈과 기록이 사라지며 복구할 수 없습니다.`,
    function () {
      delete state.students[nick];
      save();
      renderAdminPanel();
      customAlert(`${nick} 학생의 통장이 삭제되었습니다.`, '삭제 완료', '🗑️');
    },
    '개별 계좌 삭제',
  );
}
function advanceGameMonth() {
  customConfirm(
    `달력을 한 달 넘기시겠습니까?<br><br>1. 적금에 <strong>누적 원금의 1% 이자</strong>가 지급됩니다.<br>2. 이달의 <strong>경제 뉴스</strong>에 따라 주가가 변동합니다.`,
    function () {
      state.gameMonth += 1;
      let maturedCount = 0;

      // 1. 적금 이자 처리
      Object.values(state.students).forEach((student) => {
        if (student.savings && student.savings.isActive) {
          const monthlyInterest =
            Math.round(student.savings.principal * 0.01 * 10) / 10;
          student.savings.interest += monthlyInterest;

          const monthsPassed = state.gameMonth - student.savings.startMonth;
          student.logs.push(
            `📅 1달 경과 (적금 이자 +${monthlyInterest}원 쌓임)`,
          );

          if (monthsPassed >= 6) {
            const totalReturn =
              Math.round(
                (student.savings.principal + student.savings.interest) * 10,
              ) / 10;
            student.cash += totalReturn;
            student.logs.push(
              `🎉 6개월 적금 만기 달성! (+${totalReturn}원 지갑 입금)`,
            );
            student.savings = {
              isActive: false,
              startMonth: 0,
              principal: 0,
              interest: 0,
            };
            maturedCount++;
          }
        }
      });

      // 2. 뉴스 뽑기
      const globalEvent =
        MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
      const companyEvent =
        COMPANY_EVENTS[Math.floor(Math.random() * COMPANY_EVENTS.length)];
      const targetStock =
        GLOBAL_STOCKS[Math.floor(Math.random() * GLOBAL_STOCKS.length)];

      const companyNewsText = companyEvent.text.replace(
        '{회사명}',
        targetStock.name,
      );

      // 3. 주식 시장 변동 적용 (안전선 구축)
      GLOBAL_STOCKS.forEach((stock) => {
        const p = state.stockPrices[stock.symbol];
        p.prev = p.price;

        let fluctuate = 0;

        // [글로벌 시장의 영향: 소폭 변동]
        if (globalEvent.type === 'good') {
          fluctuate = (Math.random() * 4 + 1) / 100; // +1% ~ +5%
        } else if (globalEvent.type === 'bad') {
          fluctuate = (Math.random() * -4 - 1) / 100; // -1% ~ -5%
        } else {
          fluctuate = (Math.random() * 4 - 2) / 100; // 중립: -2% ~ +2%
        }

        // [개별 회사의 영향: 최대 10%까지만 변동하도록 조절]
        if (stock.symbol === targetStock.symbol) {
          if (companyEvent.type === 'good') {
            fluctuate += (Math.random() * 5 + 5) / 100; // 글로벌에 더해서 추가 +5% ~ +10%
          } else if (companyEvent.type === 'bad') {
            fluctuate -= (Math.random() * 5 + 5) / 100; // 글로벌에 더해서 추가 -5% ~ -10%
          }
        }

        let newPrice = Math.round(p.price + p.price * fluctuate);

        // [핵심 안전장치] ★ 초기 주가(base) 대비 상하한선 ±10% 로 엄격하게 제한! ★
        const maxLimit = Math.round(p.base * 1.1);
        const minLimit = Math.max(5, Math.round(p.base * 0.9));

        if (newPrice > maxLimit) newPrice = maxLimit;
        if (newPrice < minLimit) newPrice = minLimit;

        // 가격 갱신 및 기록
        if (newPrice !== p.price) {
          p.price = newPrice;
          p.history.push(p.price);
          if (p.history.length > 15) p.history.shift();
        }
      });

      save();
      renderAdminPanel();

      // 4. 결과 팝업 표시
      let msg = `새로운 한 달(${state.gameMonth}개월 차)이 시작되었습니다!<br><br>`;

      msg += `📰 <strong>[글로벌 경제 뉴스]</strong><br><span style="color:var(--text-dark); display:block; margin-top:5px; padding:8px; background:#f1f2f6; border-radius:8px;">${globalEvent.text}</span><br>`;

      msg += `🎯 <strong>[개별 기업 뉴스]</strong><br><span style="color:var(--text-dark); display:block; margin-top:5px; padding:8px; background:#ffeaa7; border-radius:8px;">${companyNewsText}</span>`;

      if (maturedCount > 0)
        msg += `<br><br>만기를 달성한 적금 <strong>${maturedCount}개</strong>가 자동으로 지갑에 입금되었습니다. 🥳`;

      customAlert(msg, '달력 넘기기 완료', '⏰');
    },
    '시간 진행',
  );
}

function reqResetSystem() {
  customConfirm(
    '모든 학생의 데이터가 영구 삭제됩니다.<br>정말 초기화 하시겠습니까?',
    function () {
      localStorage.removeItem('jindam_bank_v6');
      state.students = {};
      state.gameMonth = 1;
      renderAdminPanel();
      customAlert('모든 데이터가 지워졌습니다.', '초기화', '🗑️');
    },
    '경고!',
  );
}

init();

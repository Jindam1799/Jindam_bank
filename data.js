// --- 게임 내 경제 뉴스 이벤트 (실제 주가에 반영됨) ---

// 1. 글로벌 시장 이벤트 (총 30개 - 전체 주식에 영향)
const MARKET_EVENTS = [
  // 🟢 [글로벌 호재 - 14개]
  {
    text: '🚀 [호재] 전 세계적인 AI 기술 혁신으로 모든 기업들의 생산성이 올랐습니다!',
    type: 'good',
  },
  {
    text: '🎉 [호재] 글로벌 무역 협정 체결! 수출입이 활발해지며 경제가 호황입니다.',
    type: 'good',
  },
  {
    text: '📉 [호재] 은행 대출 이자가 낮아져 기업들이 투자를 마구 늘리고 있습니다.',
    type: 'good',
  },
  {
    text: '💡 [호재] 친환경 무한 에너지가 발명되어 전 세계 산업이 환호합니다!',
    type: 'good',
  },
  {
    text: '✈️ [호재] 전 세계 여행객이 역대 최고를 기록하며 관광 및 유통업이 대박 났습니다.',
    type: 'good',
  },
  {
    text: '💊 [호재] 획기적인 신약 개발 소식에 글로벌 헬스케어 시장이 들썩입니다.',
    type: 'good',
  },
  {
    text: '🛰️ [호재] 우주 산업의 상용화 성공으로 미래 기술에 대한 투자금이 쏟아집니다.',
    type: 'good',
  },
  {
    text: '🤖 [호재] 산업용 로봇의 보급으로 물건을 만드는 비용이 크게 줄었습니다.',
    type: 'good',
  },
  {
    text: '💰 [호재] 세계 주요 국가들이 세금을 깎아주기로 하여 기업들의 이익이 늘어납니다.',
    type: 'good',
  },
  {
    text: '🌾 [호재] 올해 전 세계 농사가 대풍년을 맞아 식탁 물가가 크게 안정되었습니다.',
    type: 'good',
  },
  {
    text: '🛍️ [호재] 연말 초대형 할인 행사가 대성공을 거두며 소비가 폭발했습니다.',
    type: 'good',
  },
  {
    text: '🚄 [호재] 초고속 진공 열차 기술이 발표되며 글로벌 물류 혁신이 기대됩니다.',
    type: 'good',
  },
  {
    text: '🎬 [호재] K-콘텐츠 열풍이 전 세계를 휩쓸며 미디어 및 소비재 수출이 껑충 뛰었습니다.',
    type: 'good',
  },
  {
    text: '🔋 [호재] 차세대 꿈의 배터리가 개발되어 전기차 및 IT 기기 시장이 급성장합니다.',
    type: 'good',
  },

  // 🔴 [글로벌 악재 - 12개]
  {
    text: '🌪️ [악재] 기상이변으로 전 세계적인 물류 대란이 발생했습니다.',
    type: 'bad',
  },
  {
    text: '💸 [악재] 심각한 인플레이션(물가 상승)으로 사람들의 소비가 꽁꽁 얼어붙었습니다.',
    type: 'bad',
  },
  {
    text: '🏦 [악재] 은행 이자율이 폭등하여 사람들이 주식을 팔고 예금으로 돈을 옮깁니다.',
    type: 'bad',
  },
  {
    text: '⚔️ [악재] 국제 분쟁 심화로 투자자들이 불안감에 주식을 내다 팔고 있습니다.',
    type: 'bad',
  },
  {
    text: '🛑 [악재] 핵심 국제 운하가 화물선에 막혀 글로벌 수출입이 멈췄습니다.',
    type: 'bad',
  },
  {
    text: '🛢️ [악재] 산유국들의 감산 결정으로 국제 기름값이 폭등해 기업들의 비상이 걸렸습니다.',
    type: 'bad',
  },
  {
    text: '💻 [악재] 전 세계적인 동시다발적 해킹으로 주요 금융망이 한때 마비되었습니다.',
    type: 'bad',
  },
  {
    text: '📉 [악재] 대형 글로벌 은행의 파산설이 돌면서 주식 시장이 공포에 빠졌습니다.',
    type: 'bad',
  },
  {
    text: '🦠 [악재] 새로운 유행병 발생 우려로 사람들이 외출을 줄이고 지갑을 닫았습니다.',
    type: 'bad',
  },
  {
    text: '🚧 [악재] 강대국들 간의 관세 전쟁(무역 갈등)이 심해져 수출 기업들이 울상입니다.',
    type: 'bad',
  },
  {
    text: '⚡ [악재] 대규모 전력망 고장으로 주요 공장들의 가동이 멈춰 피해가 막심합니다.',
    type: 'bad',
  },
  {
    text: '🪧 [악재] 전 세계 주요 항구 노동자들이 파업에 돌입해 배들이 발을 묶였습니다.',
    type: 'bad',
  },

  // ⚪ [시장 관망 / 중립 - 4개]
  {
    text: '😐 [시장 관망] 이번 달은 전 세계 경제에 특별한 이슈 없이 조용히 지나갑니다.',
    type: 'neutral',
  },
  {
    text: '📊 [시장 관망] 경제 지표가 좋고 나쁨이 섞여 발표되어 투자자들이 눈치를 보고 있습니다.',
    type: 'neutral',
  },
  {
    text: '☕ [시장 관망] 연휴 기간이 겹치면서 주식 시장의 거래가 평소보다 뜸한 한 달이었습니다.',
    type: 'neutral',
  },
  {
    text: '⚖️ [시장 관망] 물가와 금리가 모두 안정세를 보이며 주식 시장도 큰 변화 없이 평온합니다.',
    type: 'neutral',
  },
];

// 2. 개별 회사 이벤트 (특정 주식 1개에만 큰 영향)
const COMPANY_EVENTS = [
  {
    text: '🔥 [호재] {회사명}의 신제품이 전 세계적인 품절 대란을 일으키며 초대박이 났습니다!',
    type: 'good',
  },
  {
    text: '🤝 [호재] {회사명}이(가) 엄청난 규모의 정부 지원 프로젝트를 따냈습니다!',
    type: 'good',
  },
  {
    text: '🌟 [호재] {회사명}의 숨겨져 있던 엄청난 신기술이 공개되어 투자자들이 몰려듭니다.',
    type: 'good',
  },
  {
    text: '🏆 [호재] {회사명}이(가) 업계 1위 경쟁사를 인수하며 시장을 독점하게 되었습니다!',
    type: 'good',
  },
  {
    text: '🚨 [악재] {회사명}의 최고경영자(CEO)가 사임하는 초유의 사태가 발생했습니다!',
    type: 'bad',
  },
  {
    text: '💻 [악재] {회사명}에 대규모 해킹이 발생해 고객 정보가 유출, 주가가 폭락합니다.',
    type: 'bad',
  },
  {
    text: '📉 [악재] {회사명}의 핵심 기술이 경쟁사로 유출되어 막대한 손해를 입었습니다.',
    type: 'bad',
  },
  {
    text: '🔥 [악재] {회사명}의 핵심 공장에 큰 불이 나 생산이 전면 중단되었습니다.',
    type: 'bad',
  },
];


// 3. 주식 종목 (region: kr / us / cn / etc)
const GLOBAL_STOCKS = [
  { symbol: 'AAPL', emoji: '🍎', name: '애플', region: 'us' },
  { symbol: 'MSFT', emoji: '💻', name: '마이크로소프트', region: 'us' },
  { symbol: 'GOOGL', emoji: '🔍', name: '구글', region: 'us' },
  { symbol: 'AMZN', emoji: '📦', name: '아마존', region: 'us' },
  { symbol: 'TSLA', emoji: '🚗', name: '테슬라', region: 'us' },
  { symbol: 'NVDA', emoji: '🎮', name: '엔비디아', region: 'us' },
  { symbol: 'META', emoji: '📱', name: '메타', region: 'us' },
  { symbol: 'NFLX', emoji: '🍿', name: '넷플릭스', region: 'us' },
  { symbol: '005930', emoji: '📱', name: '삼성전자', region: 'kr' },
  { symbol: 'TCEHY', emoji: '🐧', name: '텐센트', region: 'cn' },
  { symbol: 'BABA', emoji: '🛒', name: '알리바바', region: 'cn' },
  { symbol: 'BIDU', emoji: '🐾', name: '바이두', region: 'cn' },
  { symbol: 'JD', emoji: '📦', name: '징둥닷컴', region: 'cn' },
  { symbol: 'BYDDY', emoji: '🚙', name: 'BYD', region: 'cn' },
  { symbol: 'XIACY', emoji: '📱', name: '샤오미', region: 'cn' },
  { symbol: 'NTES', emoji: '🕹️', name: '넷이즈', region: 'cn' },
  { symbol: 'PDD', emoji: '🍋', name: '핀둬둬', region: 'cn' },
  { symbol: 'MEIT', emoji: '🛵', name: '메이퇀', region: 'cn' },
  { symbol: 'NIO', emoji: '⚡', name: '니오', region: 'cn' },
  { symbol: 'XPEV', emoji: '🦅', name: '샤오펑', region: 'cn' },
  { symbol: 'LI', emoji: '🚙', name: '리오토', region: 'cn' },
  { symbol: 'TSM', emoji: '🔬', name: 'TSMC', region: 'etc', country: '대만' },
  { symbol: 'SONY', emoji: '🎮', name: '소니', region: 'etc', country: '일본' },
  { symbol: 'TM', emoji: '🚙', name: '토요타', region: 'etc', country: '일본' },
  { symbol: 'NINT', emoji: '🍄', name: '닌텐도', region: 'etc', country: '일본' },
  { symbol: 'DIS', emoji: '🏰', name: '디즈니', region: 'us' },
  { symbol: 'LEGO', emoji: '🧱', name: '레고', region: 'etc', country: '유럽' },
  { symbol: 'MCD', emoji: '🍔', name: '맥도날드', region: 'us' },
  { symbol: 'SBUX', emoji: '☕', name: '스타벅스', region: 'us' },
  { symbol: 'NKE', emoji: '👟', name: '나이키', region: 'us' },
];

const REGIONS = {
  kr: { label: '한국', flag: '🇰🇷' },
  us: { label: '미국', flag: '🇺🇸' },
  cn: { label: '중국', flag: '🇨🇳' },
  etc: { label: '일본·대만·유럽', flag: '🌏' },
};

// 4. 상점 기본 상품 (선생님 패널에서 추가·수정·삭제 가능)
//    stock: -1 이면 무제한
const DEFAULT_SHOP = [
  { id: 'candy', emoji: '🍬', name: '사탕 1개', desc: '달콤한 사탕 하나!', price: 3, stock: -1 },
  { id: 'sticker', emoji: '⭐', name: '칭찬 스티커', desc: '내 노트에 붙이는 반짝 스티커', price: 5, stock: -1 },
  { id: 'seat', emoji: '💺', name: '자리 바꾸기 쿠폰', desc: '원하는 자리에 앉을 수 있어요', price: 10, stock: -1 },
  { id: 'music', emoji: '🎵', name: '음악 선곡권', desc: '쉬는 시간 노래를 내가 골라요', price: 8, stock: -1 },
  { id: 'hw', emoji: '📚', name: '숙제 1회 면제권', desc: '숙제 한 번 쉬어 가기', price: 20, stock: -1 },
  { id: 'game', emoji: '🎲', name: '선생님과 게임 한 판', desc: '수업 끝나고 선생님과 대결!', price: 15, stock: -1 },
  { id: 'leader', emoji: '👑', name: '하루 반장', desc: '오늘 수업의 반장이 되어요', price: 25, stock: 1 },
];

// 5. 팬더 행원의 경제 꿀팁 (홈 화면 말풍선)
const PANDA_TIPS = [
  '어서 오세요! 오늘도 진담은행에 와 줘서 고마워요 🐼',
  '<b>이자</b>는 내 돈이 은행에서 일해서 벌어 온 돈이에요.',
  '적금은 <b>끝까지 기다리면</b> 이자를 다 받을 수 있어요. 중간에 깨면 이자가 사라져요!',
  '주식은 오르기도 하고 <b>내리기도</b> 해요. 그래서 전 재산을 넣으면 위험해요.',
  '여러 회사에 <b>나눠서</b> 투자하는 걸 <b>분산 투자</b>라고 해요.',
  '사고 싶은 게 생기면, <b>꼭 필요한지</b> 한 번 더 생각해 봐요.',
  '<b>뉴스</b>를 잘 읽으면 어떤 회사 주가가 오를지 힌트를 얻을 수 있어요!',
  '<b>평단가</b>는 내가 주식 1개를 평균 얼마에 샀는지 알려 주는 숫자예요.',
  '돈을 모으는 비결: <b>조금씩, 꾸준히!</b>',
  '이번 달에 산 주식은 <b>다음 달</b>부터 팔 수 있어요. 투자는 기다림이 중요해요!',
  '주식은 오르락내리락하지만, <b>오래 기다리면</b> 조금씩 오르는 경우가 많아요.',
  '숙제를 하면 돈이 생겨요. 공부도 하고 돈도 모으고, 일석이조!',
];

// 6. 프로필 캐릭터 (진담은행 오리지널 그림, index.html의 av-○○ 그림과 짝)
const CHARACTERS = [
  { id: 'dog', name: '멍멍이' },
  { id: 'cat', name: '야옹이' },
  { id: 'rabbit', name: '깡총이' },
  { id: 'bear', name: '곰돌이' },
  { id: 'panda', name: '아기 판다' },
  { id: 'tiger', name: '어흥이' },
  { id: 'lion', name: '사자왕' },
  { id: 'frog', name: '개굴이' },
  { id: 'koala', name: '코알라' },
  { id: 'hamster', name: '햄찌' },
  { id: 'fox', name: '여우' },
  { id: 'penguin', name: '펭펭이' },
];
// 프로필 바꾸기 기본 가격 (첫 1회는 무료, 선생님 창구에서 바꿀 수 있음)
const DEFAULT_AVATAR_PRICE = 10;

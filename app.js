const PRESETS = [
  { label: '高松',   query: 'Takamatsu' },
  { label: '東京',   query: 'Tokyo' },
  { label: '大阪',   query: 'Osaka' },
  { label: '京都',   query: 'Kyoto' },
  { label: '名古屋', query: 'Nagoya' },
  { label: '神戸',   query: 'Kobe' },
  { label: '福岡',   query: 'Fukuoka' },
  { label: '札幌',   query: 'Sapporo' },
  { label: '仙台',   query: 'Sendai' },
  { label: '広島',   query: 'Hiroshima' },
  { label: '那覇',   query: 'Naha' },
  { label: '金沢',   query: 'Kanazawa' },
];

function getWeatherInfo(code) {
  const c = Number(code);
  if (c === 113)                              return { emoji: '☀️',  label: '快晴' };
  if (c === 116)                              return { emoji: '🌤️', label: '晴れ時々くもり' };
  if (c === 119 || c === 122)                 return { emoji: '☁️',  label: 'くもり' };
  if ([143, 248, 260].includes(c))            return { emoji: '🌫️', label: '霧' };
  if ([176, 263, 266, 281, 293, 296].includes(c)) return { emoji: '🌦️', label: '小雨' };
  if ([299, 302, 305, 308, 311, 314, 317].includes(c)) return { emoji: '🌧️', label: '雨' };
  if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 350, 368, 371, 374, 377].includes(c)) return { emoji: '❄️', label: '雪' };
  if ([353, 356, 359, 362, 365].includes(c))  return { emoji: '🌦️', label: 'にわか雨' };
  if ([386, 389, 392, 395].includes(c))       return { emoji: '⛈️',  label: '雷雨' };
  return { emoji: '🌡️', label: '不明' };
}

const cache = {};

async function fetchWeather(query) {
  const key = query.toLowerCase();
  if (cache[key] && Date.now() - cache[key].ts < 10 * 60 * 1000) return cache[key].data;
  const res = await fetch(`https://wttr.in/${encodeURIComponent(query)}?format=j1`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  cache[key] = { data: json, ts: Date.now() };
  return json;
}

function render(data, displayName) {
  const cur = data.current_condition[0];
  const { emoji, label } = getWeatherInfo(cur.weatherCode);
  const wind = Math.round(Number(cur.windspeedKmph) / 3.6 * 10) / 10;
  const timeStr = new Date().toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  document.getElementById('content').innerHTML = `
    <div class="weather-main fade" id="weatherMain">
      <div class="weather-emoji">${emoji}</div>
      <div class="temperature">${cur.temp_C}<span>°C</span></div>
      <div class="weather-label">${label}</div>
      <div class="city-name">${displayName}</div>
    </div>
    <hr class="divider">
    <div class="details">
      <div class="detail-item">
        <div class="detail-icon">💧</div>
        <div class="detail-value">${cur.humidity}%</div>
        <div class="detail-label">湿度</div>
      </div>
      <div class="detail-item">
        <div class="detail-icon">💨</div>
        <div class="detail-value">${wind} m/s</div>
        <div class="detail-label">風速</div>
      </div>
    </div>
    <div class="updated-at">最終更新 ${timeStr}</div>
  `;
  requestAnimationFrame(() => {
    const el = document.getElementById('weatherMain');
    if (el) el.classList.add('fade-in');
  });
}

function setActiveBtn(activeBtn) {
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  if (activeBtn) activeBtn.classList.add('active');
}

async function loadByQuery(query, displayName, activeBtn = null) {
  document.getElementById('content').innerHTML = '<div class="loading">読み込み中...</div>';
  setActiveBtn(activeBtn);
  try {
    render(await fetchWeather(query), displayName);
  } catch (e) {
    document.getElementById('content').innerHTML = `
      <div class="error">
        データを取得できませんでした。
        <div class="error-detail">${e.message}</div>
        <button class="retry-btn" onclick="loadByQuery('${query}','${displayName}')">再試行</button>
      </div>`;
  }
}

function doSearch() {
  const val = document.getElementById('searchInput').value.trim();
  if (val) loadByQuery(val, val, null);
}

// プリセットボタン生成
const grid = document.getElementById('presetGrid');
PRESETS.forEach(({ label, query }) => {
  const btn = document.createElement('button');
  btn.className = 'preset-btn';
  btn.textContent = label;
  btn.addEventListener('click', () => loadByQuery(query, label, btn));
  grid.appendChild(btn);
});

document.getElementById('searchBtn').addEventListener('click', doSearch);
document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});

// 初期表示：高松
loadByQuery('Takamatsu', '高松', grid.firstChild);

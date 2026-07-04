// map.js — Japan nationwide weather map

const MAP_CITIES = [
  { label: '札幌',   query: 'Sapporo',   lat: 43.06, lon: 141.35 },
  { label: '仙台',   query: 'Sendai',    lat: 38.27, lon: 140.87 },
  { label: '東京',   query: 'Tokyo',     lat: 35.69, lon: 139.69 },
  { label: '名古屋', query: 'Nagoya',    lat: 35.18, lon: 136.91 },
  { label: '大阪',   query: 'Osaka',     lat: 34.69, lon: 135.50 },
  { label: '広島',   query: 'Hiroshima', lat: 34.39, lon: 132.46 },
  { label: '高松',   query: 'Takamatsu', lat: 34.34, lon: 134.05 },
  { label: '福岡',   query: 'Fukuoka',   lat: 33.59, lon: 130.40 },
  { label: '金沢',   query: 'Kanazawa',  lat: 36.56, lon: 136.66 },
  { label: '那覇',   query: 'Naha',      lat: 26.21, lon: 127.68, inset: true },
];

// 地図の地理的範囲
const LON_MIN = 128.5, LON_MAX = 145.5;
const LAT_MAX = 45.5,  LAT_MIN = 26.0;

function toPos(lat, lon) {
  const left = ((lon - LON_MIN) / (LON_MAX - LON_MIN) * 100).toFixed(2);
  const top  = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * 100).toFixed(2);
  return { left: left + '%', top: top + '%' };
}

async function showMap() {
  document.getElementById('mapOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const pinsEl  = document.getElementById('mapPins');
  const insetEl = document.getElementById('mapInset');
  pinsEl.innerHTML  = '';
  insetEl.innerHTML = '<span class="inset-label">沖縄</span><span class="inset-loading">読み込み中…</span>';

  const results = await Promise.allSettled(
    MAP_CITIES.map(c => fetchWeather(c.query).then(d => ({ city: c, data: d })))
  );

  pinsEl.innerHTML  = '';
  insetEl.innerHTML = '<span class="inset-label">沖縄</span>';

  results.forEach(r => {
    if (r.status !== 'fulfilled') return;
    const { city, data } = r.value;
    const cur = data.current_condition[0];
    const { emoji } = getWeatherInfo(cur.weatherCode);

    const onclick = `loadByQuery('${city.query}','${city.label}');closeMap()`;

    if (city.inset) {
      const div = document.createElement('div');
      div.className = 'map-pin inset-city';
      div.setAttribute('onclick', onclick);
      div.innerHTML = `<div class="pin-bubble">${emoji}</div><div class="pin-temp">${cur.temp_C}°</div><div class="pin-name">${city.label}</div>`;
      insetEl.appendChild(div);
    } else {
      const pos = toPos(city.lat, city.lon);
      const div = document.createElement('div');
      div.className = 'map-pin';
      div.style.left = pos.left;
      div.style.top  = pos.top;
      div.setAttribute('onclick', onclick);
      div.innerHTML = `<div class="pin-bubble">${emoji}</div><div class="pin-temp">${cur.temp_C}°</div><div class="pin-name">${city.label}</div>`;
      pinsEl.appendChild(div);
    }
  });
}

function closeMap() {
  document.getElementById('mapOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

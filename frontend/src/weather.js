const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'

const WMO = {
  0:  ['CLEAR SKY',        'KLARER HIMMEL'],
  1:  ['MAINLY CLEAR',     'ÜBERWIEGEND KLAR'],
  2:  ['PARTLY CLOUDY',    'TEILWEISE BEWÖLKT'],
  3:  ['OVERCAST',         'BEDECKT'],
  45: ['FOG',              'NEBEL'],
  48: ['ICING FOG',        'GEFRIERENDER NEBEL'],
  51: ['LIGHT DRIZZLE',    'LEICHTER NIESELREGEN'],
  53: ['DRIZZLE',          'NIESELREGEN'],
  55: ['HEAVY DRIZZLE',    'STARKER NIESELREGEN'],
  61: ['LIGHT RAIN',       'LEICHTER REGEN'],
  63: ['RAIN',             'REGEN'],
  65: ['HEAVY RAIN',       'STARKER REGEN'],
  71: ['LIGHT SNOW',       'LEICHTER SCHNEE'],
  73: ['SNOW',             'SCHNEE'],
  75: ['HEAVY SNOW',       'STARKER SCHNEE'],
  77: ['SNOW GRAINS',      'SCHNEEKÖRNER'],
  80: ['SHOWERS',          'SCHAUER'],
  81: ['SHOWERS',          'SCHAUER'],
  82: ['HEAVY SHOWERS',    'STARKE SCHAUER'],
  85: ['SNOW SHOWERS',     'SCHNEESCHAUER'],
  86: ['HEAVY SNOW SHOWERS','STARKE SCHNEESCHAUER'],
  95: ['THUNDERSTORM',     'GEWITTER'],
  96: ['THUNDERSTORM',     'GEWITTER'],
  99: ['THUNDERSTORM',     'GEWITTER'],
}

function windDir(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function renderWeather() {
  const el = document.getElementById('weather-terminal')
  if (!el) return

  const lang = localStorage.getItem('lang') || 'en'
  const de = lang === 'de'

  el.innerHTML = `<span>&gt; ${de ? 'WETTER-UPLINK INITIALISIEREN...' : 'INITIALIZING WEATHER UPLINK...'}</span>`

  fetch(`${API_URL}/api/weather`)
    .then(r => r.json())
    .then(data => {
      const idx = de ? 1 : 0
      const condition = (WMO[data.weather_code] || ['UNKNOWN', 'UNBEKANNT'])[idx]
      const now = new Date().toLocaleString('de-DE').replace('T', ' ').slice(0, 16)
      const sep = '─'.repeat(36)
      const waterTemp = data.water_temperature != null ? `${data.water_temperature}°C` : '--'

      const lines = [
        `> ${de ? 'WETTER-UPLINK: LANDZUNGE-NODE' : 'WEATHER UPLINK: LANDZUNGE NODE'}`,
        `> ${de ? 'ZEITSTEMPEL  ' : 'TIMESTAMP    '}: ${now}`,
        `> ${de ? 'KOORDINATEN  ' : 'COORDINATES  '}: 51.2615°N 12.3393°E`,
        `> ${sep}`,
        `> ${de ? 'TEMP         ' : 'TEMP         '}: ${data.temperature_2m}°C`,
        `> ${de ? 'FEUCHTIGKEIT ' : 'HUMIDITY     '}: ${data.relative_humidity_2m}%`,
        `> ${de ? 'WIND         ' : 'WIND         '}: ${data.wind_speed_10m} km/h ${windDir(data.wind_direction_10m)}`,
        `> ${de ? 'WASSERTEMP   ' : 'WATER TEMP   '}: ${waterTemp}`,
        `> ${de ? 'STATUS       ' : 'STATUS       '}: ${condition}`,
        `> ${sep}`,
        `> ${de ? 'VERBINDUNG: STABIL' : 'CONNECTION: STABLE'}`,
      ]

      el.innerHTML = lines.map(l => `<span>${l}</span>`).join('\n')
    })
    .catch(() => {
      el.innerHTML = `<span>&gt; CONNECTION FAILED — NODE OFFLINE</span>`
    })
}

export function initWeather() {
  document.addEventListener('landzunge:langchange', renderWeather)
  renderWeather()
}

const LAT = 51.2614894
const LON = 12.339342

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

  fetch(
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${LAT}&longitude=${LON}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m` +
    `&wind_speed_unit=kmh&timezone=Europe/Berlin`
  )
    .then(r => r.json())
    .then(data => {
      const c = data.current
      const idx = de ? 1 : 0
      const condition = (WMO[c.weather_code] || ['UNKNOWN', 'UNBEKANNT'])[idx]
      const now = new Date().toLocaleString('de-DE').replace('T', ' ').slice(0, 16)
      const sep = '\u2500'.repeat(36)

      const lines = [
        `> ${de ? 'WETTER-UPLINK: LANDZUNGE-NODE' : 'WEATHER UPLINK: LANDZUNGE NODE'}`,
        `> ${de ? 'ZEITSTEMPEL  ' : 'TIMESTAMP    '}: ${now}`,
        `> ${de ? 'KOORDINATEN  ' : 'COORDINATES  '}: 51.2615\u00b0N 12.3393\u00b0E`,
        `> ${sep}`,
        `> ${de ? 'TEMP         ' : 'TEMP         '}: ${c.temperature_2m}\u00b0C`,
        `> ${de ? 'FEUCHTIGKEIT ' : 'HUMIDITY     '}: ${c.relative_humidity_2m}%`,
        `> ${de ? 'WIND         ' : 'WIND         '}: ${c.wind_speed_10m} km/h ${windDir(c.wind_direction_10m)}`,
        `> ${de ? 'STATUS       ' : 'STATUS       '}: ${condition}`,
        `> ${sep}`,
        `> ${de ? 'VERBINDUNG: STABIL' : 'CONNECTION: STABLE'}`,
      ]

      el.innerHTML = lines.map(l => `<span>${l}</span>`).join('\n')
    })
    .catch(() => {
      el.innerHTML = `<span>&gt; CONNECTION FAILED \u2014 NODE OFFLINE</span>`
    })
}

export function initWeather() {
  document.addEventListener('landzunge:langchange', renderWeather)
  renderWeather()
}

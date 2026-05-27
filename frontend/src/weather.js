const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.finnslandzunge.com'

function setLoading() {
  const ids = ['wx-wind', 'wx-temp', 'wx-water']
  ids.forEach(id => {
    const el = document.getElementById(id)
    if (el) {
      el.textContent = '--'
      el.setAttribute('data-loading', '')
    }
  })
}

function setValues(wind, temp, water) {
  const windEl  = document.getElementById('wx-wind')
  const tempEl  = document.getElementById('wx-temp')
  const waterEl = document.getElementById('wx-water')

  if (windEl)  { windEl.textContent  = wind;  windEl.removeAttribute('data-loading') }
  if (tempEl)  { tempEl.textContent  = temp;  tempEl.removeAttribute('data-loading') }
  if (waterEl) { waterEl.textContent = water; waterEl.removeAttribute('data-loading') }
}

export function initWeather() {
  setLoading()
  fetch(`${API_URL}/api/weather`)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
    .then(data => {
      const wind  = data.wind_speed_10m  != null ? String(Math.round(data.wind_speed_10m))  : '--'
      const temp  = data.temperature_2m  != null ? String(Math.round(data.temperature_2m))  : '--'
      const water = data.water_temperature != null ? String(Math.round(data.water_temperature)) : '--'
      setValues(wind, temp, water)
    })
    .catch(() => setValues('--', '--', '--'))
}

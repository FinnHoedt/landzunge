import { initI18n } from './i18n.js'
import { initSound } from './sound.js'
import { initGuestbook } from './guestbook.js'
import { initTracker } from './tracker.js'
import { initWeather } from './weather.js'
import { initDispatchesTeaser } from './dispatches.js'

initI18n()
initSound()
initGuestbook()
initTracker()
initWeather()
initDispatchesTeaser()

document.getElementById('enter-btn')?.addEventListener('click', () => {
  document.getElementById('room-02')?.scrollIntoView({ behavior: 'smooth' })
})

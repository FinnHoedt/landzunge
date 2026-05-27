import { initGuestbook }    from './guestbook.js'
import { initWeather }      from './weather.js'
import { initRoomCounter }  from './room-counter.js'

// Enter button → Room 02
document.getElementById('enter-btn')
  ?.addEventListener('click', () => {
    document.getElementById('room-02')
      ?.scrollIntoView({ behavior: 'smooth' })
  })

// Room 03: plaque-left uses overscroll-behavior:contain so inner scroll
// doesn't accidentally snap to Room 04. But that also traps upward scroll.
// When the column is already at the top and the user scrolls up, escape
// back to Room 02 manually.
const plaqueLeft    = document.querySelector('.plaque-left')
const snapContainer = document.querySelector('.snap-container')
const room02        = document.getElementById('room-02')

if (plaqueLeft && snapContainer && room02) {
  plaqueLeft.addEventListener('wheel', (e) => {
    if (plaqueLeft.scrollTop === 0 && e.deltaY < 0) {
      snapContainer.scrollTo({ top: room02.offsetTop, behavior: 'smooth' })
    }
  }, { passive: true })
}

initWeather()
initGuestbook()
initRoomCounter()

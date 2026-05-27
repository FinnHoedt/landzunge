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
// doesn't accidentally snap away mid-read. But that also traps scroll at
// the column boundaries. Escape to adjacent rooms when the user tries to
// scroll past the top or bottom of the column.
const plaqueLeft    = document.querySelector('.plaque-left')
const snapContainer = document.querySelector('.snap-container')
const room02        = document.getElementById('room-02')
const room04        = document.getElementById('room-04')

if (plaqueLeft && snapContainer) {
  plaqueLeft.addEventListener('wheel', (e) => {
    const atTop    = plaqueLeft.scrollTop === 0
    const atBottom = plaqueLeft.scrollTop + plaqueLeft.clientHeight >= plaqueLeft.scrollHeight - 1

    if (atTop && e.deltaY < 0 && room02) {
      snapContainer.scrollTo({ top: room02.offsetTop, behavior: 'smooth' })
    } else if (atBottom && e.deltaY > 0 && room04) {
      snapContainer.scrollTo({ top: room04.offsetTop, behavior: 'smooth' })
    }
  }, { passive: true })
}

initWeather()
initGuestbook()
initRoomCounter()

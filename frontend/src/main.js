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
  // Wheel (desktop/trackpad)
  plaqueLeft.addEventListener('wheel', (e) => {
    const atTop    = plaqueLeft.scrollTop <= 1
    const atBottom = plaqueLeft.scrollTop + plaqueLeft.clientHeight >= plaqueLeft.scrollHeight - 1

    if (atTop && e.deltaY < 0 && room02) {
      snapContainer.scrollTo({ top: room02.offsetTop, behavior: 'smooth' })
    } else if (atBottom && e.deltaY > 0 && room04) {
      snapContainer.scrollTo({ top: room04.offsetTop, behavior: 'smooth' })
    }
  }, { passive: true })

  // Touch escape only needed on non-touch-primary devices (desktop trackpads
  // with touch emulation). On mobile, plaque-left has overflow-y:hidden so
  // the snap container handles swipes directly — no escape logic needed.
  if (window.matchMedia('(hover: hover)').matches) {
    let touchStartY   = 0
    let touchAtTop    = false
    let touchAtBottom = false

    plaqueLeft.addEventListener('touchstart', (e) => {
      touchStartY   = e.touches[0].clientY
      touchAtTop    = plaqueLeft.scrollTop <= 1
      touchAtBottom = plaqueLeft.scrollTop + plaqueLeft.clientHeight >= plaqueLeft.scrollHeight - 1
    }, { passive: true })

    plaqueLeft.addEventListener('touchend', (e) => {
      const dy = touchStartY - e.changedTouches[0].clientY // >0 = swiped up

      if (touchAtTop && dy < -100 && room02) {
        snapContainer.scrollTo({ top: room02.offsetTop, behavior: 'smooth' })
      } else if (touchAtBottom && dy > 100 && room04) {
        snapContainer.scrollTo({ top: room04.offsetTop, behavior: 'smooth' })
      }
    }, { passive: true })
  }
}

initWeather()
initGuestbook()
initRoomCounter()

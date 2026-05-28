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
  // Requires ~400ms of continuous overscroll before escaping so that
  // trackpad momentum doesn't carry through the boundary unintentionally.
  // A reset timer clears the dwell count if scrolling stops mid-gesture.
  let overscrollStart = 0
  let overscrollReset = null
  const DWELL_MS = 400

  plaqueLeft.addEventListener('wheel', (e) => {
    const atTop    = plaqueLeft.scrollTop <= 1
    const atBottom = plaqueLeft.scrollTop + plaqueLeft.clientHeight >= plaqueLeft.scrollHeight - 1
    const tryingUp   = atTop && e.deltaY < 0
    const tryingDown = atBottom && e.deltaY > 0

    clearTimeout(overscrollReset)

    if (tryingUp || tryingDown) {
      if (!overscrollStart) overscrollStart = Date.now()
      // Reset dwell if the gesture pauses for 400ms (e.g. finger lifts)
      overscrollReset = setTimeout(() => { overscrollStart = 0 }, DWELL_MS)

      if (Date.now() - overscrollStart >= DWELL_MS) {
        overscrollStart = 0
        if (tryingUp && room02)   snapContainer.scrollTo({ top: room02.offsetTop, behavior: 'smooth' })
        if (tryingDown && room04) snapContainer.scrollTo({ top: room04.offsetTop, behavior: 'smooth' })
      }
    } else {
      overscrollStart = 0
    }
  }, { passive: true })

  // Touch (mobile) — record boundary state at gesture start, escape on swipe
  // past a 100px threshold. dy > 0 = swiped up = intent to scroll down.
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

initWeather()
initGuestbook()
initRoomCounter()

export function initRoomCounter() {
  const counter = document.getElementById('room-counter')
  if (!counter) return

  const container = document.querySelector('.snap-container')
  const rooms = Array.from(document.querySelectorAll('.room'))
  const total = rooms.length

  function updateCounter(index) {
    const num = String(index + 1).padStart(2, '0')
    const tot = String(total).padStart(2, '0')
    counter.textContent = `${num} / ${tot}`
    counter.setAttribute('aria-label', `Room ${index + 1} of ${total}`)
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.intersectionRatio >= 0.5) {
        const idx = rooms.indexOf(entry.target)
        if (idx !== -1) updateCounter(idx)
      }
    })
  }, {
    root: container,
    threshold: 0.5,
  })

  rooms.forEach(room => observer.observe(room))
  updateCounter(0)  // initialise to Room 01
}

const SOUND_KEY = 'sound_enabled'

let dialupAudio
let ambientAudio
let firstInteraction = false

export function initSound() {
  dialupAudio = new Audio('/sounds/dialup.mp3')
  ambientAudio = new Audio('/sounds/lake-ambient.mp3')
  ambientAudio.loop = true
  ambientAudio.volume = 0.3

  const enabled = localStorage.getItem(SOUND_KEY) !== 'false'
  updateToggleLabel(enabled)

  document.addEventListener('click', handleFirstInteraction, { once: true })

  document.getElementById('sound-toggle').addEventListener('click', handleToggleClick)
}

function handleFirstInteraction() {
  firstInteraction = true
  if (localStorage.getItem(SOUND_KEY) === 'false') return
  dialupAudio.play().catch(() => {})
  dialupAudio.addEventListener('ended', () => ambientAudio.play().catch(() => {}), { once: true })
}

function handleToggleClick() {
  const nowEnabled = localStorage.getItem(SOUND_KEY) !== 'false'
  const next = !nowEnabled
  localStorage.setItem(SOUND_KEY, String(next))
  updateToggleLabel(next)
  if (next && firstInteraction) {
    ambientAudio.play().catch(() => {})
  } else {
    ambientAudio.pause()
    dialupAudio.pause()
  }
}

function updateToggleLabel(enabled) {
  document.getElementById('sound-toggle').textContent = enabled ? '[SND]' : '[MUT]'
}

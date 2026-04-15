const SOUND_KEY = 'sound_enabled'

let cyberpunkAudio
let firstInteraction = false

export function initSound() {
  cyberpunkAudio = new Audio('/sounds/cyberpunk.mp3')
  cyberpunkAudio.loop = true
  cyberpunkAudio.volume = 0.3

  const enabled = localStorage.getItem(SOUND_KEY) !== 'false'
  updateToggleLabel(enabled)

  document.addEventListener('click', handleFirstInteraction, { once: true })

  document.getElementById('sound-toggle').addEventListener('click', handleToggleClick)
}

function handleFirstInteraction() {
  firstInteraction = true
  if (localStorage.getItem(SOUND_KEY) === 'false') return
  cyberpunkAudio.play().catch(() => {})
}

function handleToggleClick() {
  const nowEnabled = localStorage.getItem(SOUND_KEY) !== 'false'
  const next = !nowEnabled
  localStorage.setItem(SOUND_KEY, String(next))
  updateToggleLabel(next)
  if (next && firstInteraction) {
    cyberpunkAudio.play().catch(() => {})
  } else {
    cyberpunkAudio.pause()
    dialupAudio.pause()
  }
}

function updateToggleLabel(enabled) {
  document.getElementById('sound-toggle').textContent = enabled ? '[SND]' : '[MUT]'
}

const FONT_SIZES = ['0.65rem', '0.8rem', '1rem', '1.1rem']

const DEFAULT_EDGE_PAD = 16
const DEFAULT_GAP = 20
const DEFAULT_MIN_GAP = 10
const DEFAULT_SAMPLES = 64

/**
 * Deterministic 32-bit FNV-1a hash of an entry ID.
 */
export function hashId(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Seeded deterministic PRNG (Mulberry32) yielding floats in [0, 1).
 */
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Deterministic font size for a guestbook entry.
 */
export function entryFontSize(id) {
  return FONT_SIZES[hashId(id + ':size') % FONT_SIZES.length]
}

function hasCollision(x, y, w, h, placed, gap) {
  for (let i = 0; i < placed.length; i++) {
    const p = placed[i]
    if (
      x < p.x + p.w + gap &&
      x + w + gap > p.x &&
      y < p.y + p.h + gap &&
      y + h + gap > p.y
    ) {
      return true
    }
  }
  return false
}

function minClearance(x, y, w, h, placed) {
  if (placed.length === 0) return Infinity
  let minD = Infinity
  for (let i = 0; i < placed.length; i++) {
    const p = placed[i]
    const dx = Math.max(0, p.x - (x + w), x - (p.x + p.w))
    const dy = Math.max(0, p.y - (y + h), y - (p.y + p.h))
    const d = Math.hypot(dx, dy)
    if (d < minD) minD = d
  }
  return minD
}

function axisValues(min, max, step, jitter) {
  if (max <= min) return [Math.round(min)]
  const values = []
  const start = min + jitter * Math.min(step, max - min)
  for (let v = start; v < max; v += step) {
    values.push(Math.round(v))
  }
  const first = Math.round(min)
  const last = Math.round(max)
  if (values.length === 0 || values[0] !== first) values.unshift(first)
  if (values[values.length - 1] !== last) values.push(last)
  return values
}

function findSpotInBounds(item, placed, bounds, opts) {
  const { minX, maxX, minY, maxY } = bounds
  const { gap, minGap, samples } = opts
  const w = item.width
  const h = item.height
  const rng = mulberry32(hashId(item.id))

  // 1. Preferred hash position — preserves the organic scattered feel
  const prefX = Math.round(minX + rng() * Math.max(0, maxX - minX))
  const prefY = Math.round(minY + rng() * Math.max(0, maxY - minY))
  if (!hasCollision(prefX, prefY, w, h, placed, gap)) {
    return { x: prefX, y: prefY }
  }

  // 2. Mitchell's Best-Candidate sampling — organic spread away from neighbors
  let best = null
  let bestClearance = -1
  for (let i = 0; i < samples; i++) {
    const cx = Math.round(minX + rng() * Math.max(0, maxX - minX))
    const cy = Math.round(minY + rng() * Math.max(0, maxY - minY))
    if (!hasCollision(cx, cy, w, h, placed, gap)) {
      const clearance = minClearance(cx, cy, w, h, placed)
      if (clearance > bestClearance) {
        bestClearance = clearance
        best = { x: cx, y: cy }
      }
    }
  }
  if (best) return best

  // 3. Deterministic jittered grid sweep (first with preferred gap, then tighter minGap)
  const spanX = Math.max(1, maxX - minX)
  const spanY = Math.max(1, maxY - minY)
  const step = Math.max(12, Math.floor(Math.min(spanX, spanY) / 28))
  const xs = axisValues(minX, maxX, step, rng())
  const ys = axisValues(minY, maxY, step, rng())

  for (const currentGap of [gap, minGap]) {
    let gridBest = null
    let gridClearance = -1
    for (let yi = 0; yi < ys.length; yi++) {
      const cy = ys[yi]
      for (let xi = 0; xi < xs.length; xi++) {
        const cx = xs[xi]
        if (!hasCollision(cx, cy, w, h, placed, currentGap)) {
          const clearance = minClearance(cx, cy, w, h, placed)
          if (clearance > gridClearance) {
            gridClearance = clearance
            gridBest = { x: cx, y: cy }
          }
        }
      }
    }
    if (gridBest) return gridBest
  }

  return null
}

function findExtendedSpot(item, placed, minX, maxX, startY, gap) {
  const w = item.width
  const h = item.height
  const rng = mulberry32(hashId(item.id + ':ext'))
  const maxBottom = placed.reduce((m, p) => Math.max(m, p.y + p.h), startY)
  const maxScanY = Math.ceil(maxBottom + gap)
  const stepX = Math.max(12, Math.floor(Math.max(1, maxX - minX) / 16))
  const stepY = 16
  const xs = axisValues(minX, maxX, stepX, rng())

  // Always include the guaranteed-free shelf right below all placed items
  const ys = []
  for (let y = Math.round(startY); y < maxScanY; y += stepY) {
    ys.push(y)
  }
  ys.push(maxScanY)

  for (let yi = 0; yi < ys.length; yi++) {
    const cy = ys[yi]
    let rowBest = null
    let rowClearance = -1

    // Try a few deterministic random horizontal spots first for an organic stagger
    for (let i = 0; i < 12; i++) {
      const cx = Math.round(minX + rng() * Math.max(0, maxX - minX))
      if (!hasCollision(cx, cy, w, h, placed, gap)) {
        const clearance = minClearance(cx, cy, w, h, placed)
        if (clearance > rowClearance) {
          rowClearance = clearance
          rowBest = { x: cx, y: cy }
        }
      }
    }

    // Sweep x across the row if random samples missed a valid opening
    if (!rowBest) {
      for (let xi = 0; xi < xs.length; xi++) {
        const cx = xs[xi]
        if (!hasCollision(cx, cy, w, h, placed, gap)) {
          const clearance = minClearance(cx, cy, w, h, placed)
          if (clearance > rowClearance) {
            rowClearance = clearance
            rowBest = { x: cx, y: cy }
          }
        }
      }
    }

    if (rowBest) return rowBest
  }

  // Fallback (unreachable given maxScanY = maxBottom + gap, kept for total safety)
  return {
    x: Math.round(minX + rng() * Math.max(0, maxX - minX)),
    y: maxScanY,
  }
}

function placeItems(orderedItems, opts, allowExtend) {
  const { containerWidth, containerHeight, edgePad, gap, minGap, samples } = opts
  const placed = []
  const positions = new Map()
  let canvasHeight = containerHeight
  let overflowed = false

  for (let i = 0; i < orderedItems.length; i++) {
    const item = orderedItems[i]
    const minX = edgePad
    const maxX = Math.max(minX, containerWidth - edgePad - item.width)
    const minY = edgePad
    const maxY = canvasHeight - edgePad - item.height

    let pos = null
    if (maxY >= minY) {
      pos = findSpotInBounds(
        item,
        placed,
        { minX, maxX, minY, maxY },
        { gap, minGap, samples }
      )
    }

    if (!pos) {
      if (!allowExtend) return null
      const startY = Math.max(minY, maxY)
      pos = findExtendedSpot(item, placed, minX, maxX, startY, gap)
      const neededHeight = pos.y + item.height + edgePad
      if (neededHeight > containerHeight) {
        overflowed = true
        canvasHeight = Math.max(canvasHeight, neededHeight)
      }
    }

    placed.push({ x: pos.x, y: pos.y, w: item.width, h: item.height })
    positions.set(item.id, pos)
  }

  return { positions, canvasHeight, overflowed }
}

/**
 * Compute collision-free, deterministic, scattered pixel positions for guestbook entries.
 *
 * Strategy:
 * 1. Try oldest-first within the visible viewport — keeps existing entries stationary
 *    when new transmissions are posted.
 * 2. If tight, retry largest-first within the visible viewport to pack without scrolling.
 * 3. If the viewport is genuinely saturated (e.g. many entries on a small phone),
 *    place newest-first and extend the canvas vertically so every entry stays readable
 *    with zero overlap and zero clipping.
 */
export function computeCanvasLayout(items, options) {
  const containerWidth = options.containerWidth
  const containerHeight = options.containerHeight
  if (!items.length || containerWidth <= 0 || containerHeight <= 0) {
    return {
      positions: new Map(),
      canvasHeight: Math.max(0, containerHeight),
      overflowed: false,
    }
  }

  const opts = {
    containerWidth,
    containerHeight,
    edgePad: options.edgePad ?? DEFAULT_EDGE_PAD,
    gap: options.gap ?? DEFAULT_GAP,
    minGap: options.minGap ?? DEFAULT_MIN_GAP,
    samples: options.samples ?? DEFAULT_SAMPLES,
  }

  const byOldest = [...items].sort(
    (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0) || a.id.localeCompare(b.id)
  )
  const pass1 = placeItems(byOldest, opts, false)
  if (pass1) return pass1

  const byLargest = [...items].sort(
    (a, b) =>
      b.width * b.height - a.width * a.height ||
      (a.createdAt ?? 0) - (b.createdAt ?? 0) ||
      a.id.localeCompare(b.id)
  )
  const pass2 = placeItems(byLargest, opts, false)
  if (pass2) return pass2

  const byNewest = [...items].sort(
    (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0) || a.id.localeCompare(b.id)
  )
  return placeItems(byNewest, opts, true)
}

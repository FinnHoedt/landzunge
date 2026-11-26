import test from 'node:test'
import assert from 'node:assert/strict'
import { computeCanvasLayout, entryFontSize, hashId } from './canvas-layout.js'

function assertNoOverlaps(items, positions, minGap = 0) {
  const rects = items.map(item => {
    const pos = positions.get(item.id)
    assert.ok(pos, `Missing position for ${item.id}`)
    return { id: item.id, x: pos.x, y: pos.y, w: item.width, h: item.height }
  })

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i]
      const b = rects[j]
      const overlapping =
        a.x < b.x + b.w + minGap &&
        a.x + a.w + minGap > b.x &&
        a.y < b.y + b.h + minGap &&
        a.y + a.h + minGap > b.y
      assert.equal(
        overlapping,
        false,
        `Overlap between ${a.id} (${a.x},${a.y},${a.w}x${a.h}) and ${b.id} (${b.x},${b.y},${b.w}x${b.h})`
      )
    }
  }
}

function assertWithinBounds(items, positions, width, height, edgePad = 16) {
  for (const item of items) {
    const pos = positions.get(item.id)
    assert.ok(pos.x >= edgePad, `${item.id} x=${pos.x} < ${edgePad}`)
    assert.ok(pos.y >= edgePad, `${item.id} y=${pos.y} < ${edgePad}`)
    if (item.width + 2 * edgePad <= width) {
      assert.ok(
        pos.x + item.width <= width - edgePad + 1,
        `${item.id} right edge ${pos.x + item.width} > ${width - edgePad}`
      )
    }
    assert.ok(
      pos.y + item.height <= height - edgePad + 1,
      `${item.id} bottom edge ${pos.y + item.height} > ${height - edgePad}`
    )
  }
}

function makeSampleEntries(count) {
  const sizes = [
    { w: 180, h: 170 }, // portrait sunset image + text
    { w: 210, h: 105 }, // landscape pizza image + text
    { w: 220, h: 95 },  // multi-line message
    { w: 140, h: 48 },  // short comment
    { w: 220, h: 190 }, // long message + portrait image
  ]
  return Array.from({ length: count }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    createdAt: 1700000000000 + i * 60_000,
    width: sizes[i % sizes.length].w,
    height: sizes[i % sizes.length].h,
  }))
}

test('returns empty layout for empty input or zero dimensions', () => {
  const empty = computeCanvasLayout([], { containerWidth: 1200, containerHeight: 800 })
  assert.equal(empty.positions.size, 0)
  assert.equal(empty.overflowed, false)

  const zero = computeCanvasLayout(makeSampleEntries(3), { containerWidth: 0, containerHeight: 800 })
  assert.equal(zero.positions.size, 0)
})

test('separates entries even when two entries have large images on desktop', () => {
  const items = makeSampleEntries(20)
  const result = computeCanvasLayout(items, { containerWidth: 1440, containerHeight: 860 })

  assert.equal(result.overflowed, false)
  assertNoOverlaps(items, result.positions, 10)
  assertWithinBounds(items, result.positions, 1440, result.canvasHeight)
})

test('is deterministic for the same entries and viewport', () => {
  const items = makeSampleEntries(15)
  const a = computeCanvasLayout(items, { containerWidth: 1280, containerHeight: 760 })
  const b = computeCanvasLayout([...items].reverse(), { containerWidth: 1280, containerHeight: 760 })

  for (const item of items) {
    assert.deepEqual(a.positions.get(item.id), b.positions.get(item.id))
  }
})

test('preserves existing entry positions when a new entry is added on spacious canvas', () => {
  const initial = makeSampleEntries(6)
  const before = computeCanvasLayout(initial, { containerWidth: 1440, containerHeight: 860 })

  const withNew = [
    ...initial,
    {
      id: '99999999-1111-4222-8333-444444444444',
      createdAt: 1700000000000 + 99 * 60_000,
      width: 190,
      height: 110,
    },
  ]
  const after = computeCanvasLayout(withNew, { containerWidth: 1440, containerHeight: 860 })

  for (const item of initial) {
    assert.deepEqual(after.positions.get(item.id), before.positions.get(item.id))
  }
  assertNoOverlaps(withNew, after.positions, 10)
})

test('extends canvas vertically without overlaps when mobile viewport is saturated (20 entries)', () => {
  const items = makeSampleEntries(20)
  const result = computeCanvasLayout(items, { containerWidth: 375, containerHeight: 620 })

  assert.equal(result.overflowed, true)
  assert.ok(result.canvasHeight > 620)
  assertNoOverlaps(items, result.positions, 10)
  assertWithinBounds(items, result.positions, 375, result.canvasHeight)
})

test('fits moderate entry count on mobile without scrolling and with zero overlap', () => {
  const items = makeSampleEntries(4)
  const result = computeCanvasLayout(items, { containerWidth: 390, containerHeight: 760 })

  assert.equal(result.overflowed, false)
  assertNoOverlaps(items, result.positions, 10)
  assertWithinBounds(items, result.positions, 390, result.canvasHeight)
})

test('handles an entry taller than the viewport cleanly via vertical extension', () => {
  const items = [
    { id: 'tall-entry-1', createdAt: 1, width: 220, height: 420 },
    { id: 'normal-entry-2', createdAt: 2, width: 180, height: 90 },
  ]
  const result = computeCanvasLayout(items, { containerWidth: 375, containerHeight: 340 })

  assert.equal(result.overflowed, true)
  assertNoOverlaps(items, result.positions, 10)
  assertWithinBounds(items, result.positions, 375, result.canvasHeight)
})

test('stress test: zero overlaps across 50 random UUID batches and multiple viewports', () => {
  const viewports = [
    { w: 1920, h: 1040 },
    { w: 1280, h: 720 },
    { w: 768, h: 980 },
    { w: 390, h: 760 },
    { w: 320, h: 520 },
  ]

  for (const vp of viewports) {
    for (let trial = 0; trial < 10; trial++) {
      const items = Array.from({ length: 20 }, (_, i) => ({
        id: `trial-${trial}-entry-${i}-${hashId(`seed-${trial}-${i}`)}`,
        createdAt: 1700000000000 + i * 1000,
        width: 90 + ((i * 37 + trial * 13) % 130),
        height: 45 + ((i * 53 + trial * 29) % 160),
      }))
      const result = computeCanvasLayout(items, {
        containerWidth: vp.w,
        containerHeight: vp.h,
      })
      assertNoOverlaps(items, result.positions, 10)
      assertWithinBounds(items, result.positions, vp.w, result.canvasHeight)
    }
  }
})

test('entryFontSize returns one of the configured typography scale values deterministically', () => {
  const allowed = new Set(['0.65rem', '0.8rem', '1rem', '1.1rem'])
  for (let i = 0; i < 40; i++) {
    const id = `entry-${i}`
    const size = entryFontSize(id)
    assert.ok(allowed.has(size))
    assert.equal(entryFontSize(id), size)
  }
})

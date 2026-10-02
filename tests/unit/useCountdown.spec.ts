import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { useCountdown } from '@/composables/useCountdown'

describe('useCountdown', () => {
  let t = 0
  const now = () => t

  beforeEach(() => {
    vi.useFakeTimers()
    t = 0
  })
  afterEach(() => vi.useRealTimers())

  function setup(onExpire = vi.fn()) {
    const scope = effectScope()
    const c = scope.run(() => useCountdown({ now, tickMs: 50, onExpire }))!
    return { c, scope, onExpire }
  }

  function advance(ms: number) {
    t += ms
    vi.advanceTimersByTime(ms)
  }

  it('counts down and reports seconds, fraction and color level', () => {
    const { c } = setup()
    c.start(5000)
    expect(c.seconds.value).toBe(5)
    expect(c.fraction.value).toBe(1)
    expect(c.level.value).toBe('safe')

    advance(3100)
    expect(c.seconds.value).toBe(2)
    expect(c.level.value).toBe('warn')

    advance(1000)
    expect(c.level.value).toBe('danger')
    expect(c.fraction.value).toBeCloseTo(0.18, 2)
  })

  it('calls onExpire exactly once when time is up', () => {
    const { c, onExpire } = setup()
    c.start(5000)
    advance(5000)
    advance(500)
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(c.running.value).toBe(false)
    expect(c.remainingMs.value).toBe(0)
  })

  it('can start with less remaining time than the full duration (resume)', () => {
    const { c } = setup()
    c.start(5000, 1500)
    expect(c.fraction.value).toBeCloseTo(0.3)
    expect(c.level.value).toBe('warn')
  })

  it('expires immediately when nothing remains', () => {
    const { c, onExpire } = setup()
    c.start(5000, 0)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('stop() prevents expiry', () => {
    const { c, onExpire } = setup()
    c.start(5000)
    advance(1000)
    c.stop()
    advance(10000)
    expect(onExpire).not.toHaveBeenCalled()
  })

  it('is cleaned up with its scope', () => {
    const { c, scope, onExpire } = setup()
    c.start(5000)
    scope.stop()
    advance(10000)
    expect(onExpire).not.toHaveBeenCalled()
  })
})

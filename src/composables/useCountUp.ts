import { onScopeDispose, ref } from 'vue'

/** Puanı 0'dan hedefe animasyonla sayar; hareket azaltma tercihinde anında gösterir. */
export function useCountUp(durationMs = 1200) {
  const value = ref(0)
  let frame = 0

  function run(target: number) {
    cancelAnimationFrame(frame)
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || target <= 0 || typeof requestAnimationFrame !== 'function') {
      value.value = target
      return
    }
    const start = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs)
      value.value = Math.round(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  }

  onScopeDispose(() => cancelAnimationFrame(frame))
  return { value, run }
}

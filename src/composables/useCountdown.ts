import { computed, onScopeDispose, ref } from 'vue'

export interface CountdownOptions {
  /** Güncelleme aralığı (ms). Halka animasyonu CSS geçişiyle yumuşatılır. */
  tickMs?: number
  /** Zaman kaynağı; testlerde değiştirilebilir. */
  now?: () => number
  onExpire?: () => void
}

/**
 * Soru sayacı. Sunucunun verdiği `remaining_ms` ile başlatılır; sadece görsel geri sayım
 * ve süre dolduğunda `onExpire` çağrısı içindir (puanı her zaman sunucu hesaplar).
 */
export function useCountdown(options: CountdownOptions = {}) {
  const tickMs = options.tickMs ?? 50
  const now = options.now ?? (() => performance.now())

  const totalMs = ref(0)
  const remainingMs = ref(0)
  const running = ref(false)
  let deadline = 0
  let timer: ReturnType<typeof setInterval> | undefined

  function clear() {
    if (timer !== undefined) clearInterval(timer)
    timer = undefined
  }

  function tick() {
    const left = Math.max(0, deadline - now())
    remainingMs.value = left
    if (left <= 0 && running.value) {
      running.value = false
      clear()
      options.onExpire?.()
    }
  }

  /**
   * @param durationMs sayacın tam süresi (halkanın %100'ü)
   * @param remaining  kalan süre (yenilemede tam süreden az olabilir)
   */
  function start(durationMs: number, remaining = durationMs) {
    clear()
    totalMs.value = durationMs
    deadline = now() + Math.max(0, remaining)
    running.value = true
    tick()
    if (running.value) timer = setInterval(tick, tickMs)
  }

  function stop() {
    running.value = false
    clear()
  }

  onScopeDispose(stop)

  const fraction = computed(() => (totalMs.value ? remainingMs.value / totalMs.value : 0))
  const seconds = computed(() => Math.ceil(remainingMs.value / 1000))
  /** Doküman: 5→2 sn yeşil, 2→1 sarı, son 1 sn kırmızı. */
  const level = computed<'safe' | 'warn' | 'danger'>(() =>
    remainingMs.value > 2000 ? 'safe' : remainingMs.value > 1000 ? 'warn' : 'danger',
  )

  return { start, stop, remainingMs, totalMs, running, fraction, seconds, level }
}

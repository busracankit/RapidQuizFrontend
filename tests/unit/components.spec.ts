import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ChoiceButton from '@/components/ChoiceButton.vue'
import CountdownRing from '@/components/CountdownRing.vue'
import Podium from '@/components/Podium.vue'
import ProgressBar from '@/components/ProgressBar.vue'

describe('ChoiceButton', () => {
  it('shows the letter badge and emits select', async () => {
    const w = mount(ChoiceButton, { props: { letter: 'B', text: 'Ankara', state: 'idle' } })
    expect(w.text()).toContain('B')
    expect(w.text()).toContain('Ankara')
    expect(w.attributes('aria-label')).toBe('B şıkkı: Ankara')
    await w.trigger('click')
    expect(w.emitted('select')).toHaveLength(1)
  })

  it('marks correct/wrong with an icon, not only color', () => {
    const correct = mount(ChoiceButton, { props: { letter: 'A', text: 'x', state: 'correct' } })
    const wrong = mount(ChoiceButton, { props: { letter: 'A', text: 'x', state: 'wrong' } })
    const reveal = mount(ChoiceButton, { props: { letter: 'A', text: 'x', state: 'reveal' } })
    expect(correct.text()).toContain('✓')
    expect(reveal.text()).toContain('✓')
    expect(wrong.text()).toContain('✕')
  })

  it('does not emit when disabled', async () => {
    const w = mount(ChoiceButton, { props: { letter: 'A', text: 'x', state: 'idle', disabled: true } })
    await w.trigger('click')
    expect(w.emitted('select')).toBeUndefined()
  })
})

describe('CountdownRing', () => {
  it('renders seconds and an accessible timer label', () => {
    const w = mount(CountdownRing, { props: { fraction: 0.5, seconds: 3, level: 'safe' } })
    expect(w.text()).toBe('3')
    expect(w.attributes('role')).toBe('timer')
    expect(w.attributes('aria-label')).toBe('3 saniye kaldı')
  })

  it('uses the danger color in the last second', () => {
    const w = mount(CountdownRing, { props: { fraction: 0.1, seconds: 1, level: 'danger' } })
    expect(w.attributes('data-level')).toBe('danger')
    expect(w.html()).toContain('var(--color-danger)')
  })
})

describe('ProgressBar', () => {
  it('renders 20 segments colored by result', () => {
    const w = mount(ProgressBar, {
      props: {
        total: 20,
        current: 3,
        answers: [
          { index: 1, is_correct: true, timed_out: false, points: 140, response_ms: 1000 },
          { index: 2, is_correct: false, timed_out: true, points: 0, response_ms: 5000 },
        ],
      },
    })
    const segs = w.findAll('[data-segment]').map((s) => s.attributes('data-segment'))
    expect(segs).toHaveLength(20)
    expect(segs.slice(0, 4)).toEqual(['correct', 'wrong', 'current', 'todo'])
  })
})

describe('Podium', () => {
  const entry = (id: number, name: string, score: number) => ({
    id,
    rank: id,
    player_name: name,
    score,
    correct_count: 10,
    total_time_ms: 1000,
    created_at: '2026-10-01T12:00:00Z',
  })

  it('shows top three and highlights the player', () => {
    const w = mount(Podium, {
      props: { entries: [entry(1, 'Ali', 900), entry(2, 'Ayşe', 800), entry(3, 'Can', 700)], highlightId: 2 },
    })
    expect(w.text()).toContain('Ali')
    expect(w.text()).toContain('Ayşe')
    expect(w.text()).toContain('(Sen)')
    expect(w.find('[data-testid="podium-2"]').classes()).toContain('ring-accent')
  })
})

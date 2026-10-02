import type { AnswerResult, Question, SessionStart, SessionState } from '@/api'

export function makeQuestion(index = 1, overrides: Partial<Question> = {}): Question {
  return {
    index,
    id: 100 + index,
    text: `Soru ${index}?`,
    difficulty: 1,
    choices: [
      { id: 1, text: 'Bir' },
      { id: 2, text: 'İki' },
      { id: 3, text: 'Üç' },
      { id: 4, text: 'Dört' },
    ],
    served_at: '2026-10-01T12:00:03Z',
    starts_in_ms: 0,
    remaining_ms: 5000,
    ...overrides,
  }
}

export const category = { slug: 'yazilim', name: 'Yazılım', color: '#3B82F6' }

export function makeStart(overrides: Partial<SessionStart> = {}): SessionStart {
  return {
    session_id: 'sess-1',
    session_token: 'tok_abc',
    category,
    total_questions: 20,
    time_limit_ms: 5000,
    question: makeQuestion(1, { starts_in_ms: 3000 }),
    ...overrides,
  }
}

export function makeAnswer(overrides: Partial<AnswerResult> = {}): AnswerResult {
  return {
    is_correct: true,
    timed_out: false,
    correct_choice_id: 2,
    selected_choice_id: 2,
    points: 132,
    score: 132,
    correct_count: 1,
    answered_count: 1,
    finished: false,
    next_question: makeQuestion(2, { starts_in_ms: 800 }),
    ...overrides,
  }
}

export function makeState(overrides: Partial<SessionState> = {}): SessionState {
  return {
    session_id: 'sess-1',
    status: 'in_progress',
    category,
    total_questions: 20,
    time_limit_ms: 5000,
    score: 140,
    correct_count: 1,
    answered_count: 1,
    finished: false,
    question: makeQuestion(2, { remaining_ms: 3200 }),
    answers: [{ index: 1, is_correct: true, timed_out: false, points: 140, response_ms: 1000 }],
    ...overrides,
  }
}

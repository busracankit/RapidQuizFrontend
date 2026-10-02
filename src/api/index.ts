import { http, withToken } from './client'
import type {
  AnswerResult,
  Category,
  ClientType,
  Leaderboard,
  Result,
  ScoreResult,
  SessionStart,
  SessionState,
} from './types'

export * from './client'
export type * from './types'

export const api = {
  async categories(): Promise<Category[]> {
    return (await http.get<Category[]>('/categories/')).data
  },

  async startSession(category: string, clientType: ClientType = 'web'): Promise<SessionStart> {
    return (await http.post<SessionStart>('/sessions/', { category, client_type: clientType })).data
  },

  async current(sessionId: string, token: string): Promise<SessionState> {
    return (await http.get<SessionState>(`/sessions/${sessionId}/current/`, withToken(token))).data
  },

  async answer(
    sessionId: string,
    token: string,
    questionId: number,
    choiceId: number | null,
  ): Promise<AnswerResult> {
    const body = { question_id: questionId, choice_id: choiceId }
    return (await http.post<AnswerResult>(`/sessions/${sessionId}/answers/`, body, withToken(token)))
      .data
  },

  async result(sessionId: string, token: string): Promise<Result> {
    return (await http.get<Result>(`/sessions/${sessionId}/result/`, withToken(token))).data
  },

  async saveScore(sessionId: string, token: string, playerName: string): Promise<ScoreResult> {
    const body = { player_name: playerName }
    return (await http.post<ScoreResult>(`/sessions/${sessionId}/score/`, body, withToken(token))).data
  },

  async leaderboard(category: string): Promise<Leaderboard> {
    return (await http.get<Leaderboard>('/leaderboard/', { params: { category } })).data
  },
}

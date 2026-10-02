import type { components } from './schema'

type S = components['schemas']

export type Category = S['Category']
export type CategoryBrief = S['CategoryBrief']
export type Question = S['QuestionOut']
export type Choice = S['ChoiceOut']
export type AnswerSummary = S['AnswerSummary']
export type SessionStart = S['SessionStartOut']
export type SessionState = S['SessionStateOut']
export type AnswerResult = S['AnswerOut']
export type Result = S['ResultOut']
export type ScoreResult = S['ScoreOut']
export type Leaderboard = S['LeaderboardOut']
export type LeaderboardEntry = S['EntryOut']
export type ClientType = S['SessionCreateRequest']['client_type']

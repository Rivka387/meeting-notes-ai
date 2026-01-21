export type Language = 'he' | 'en'

export type SummaryPayload = {
  summary: string
  participants: string[]
  decisions: string[]
  actionItems: string[]
  language: Language
}

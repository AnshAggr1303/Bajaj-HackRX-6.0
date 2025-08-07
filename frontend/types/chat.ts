export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  insuranceData?: InsuranceResponse
}

export interface InsuranceResponse {
  decision: string
  amount?: number
  justification: string
  referenced_clauses?: string[]
  confidence_score?: number
  additional_info?: {
    sources?: string[]
    clauses?: { [key: string]: string }
    [key: string]: any
  }
}

export interface UploadResponse {
  success: boolean
  message: string
  filename?: string
  file_id?: string
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  error?: string
}

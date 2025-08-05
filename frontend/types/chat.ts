export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  type?: "text" | "file-upload"
  insuranceData?: InsuranceResponse
}

export interface InsuranceResponse {
  decision: string
  amount?: number
  justification: string
  referenced_clauses: string[]
  confidence_score: number
  additional_info: {
    documents_consulted: number
    sources: string[]
  }
}

export interface UploadResponse {
  message: string
  filename: string
  status: "success" | "error"
}
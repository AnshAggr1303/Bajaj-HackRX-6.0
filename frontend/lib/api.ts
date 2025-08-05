import { InsuranceResponse, UploadResponse } from "@/types/chat"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health')
  }

  async processQuery(query: string): Promise<InsuranceResponse> {
    return this.request('/process-query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
  }

  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/upload-document`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload Error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }
}

const apiService = new ApiService()

// Export individual functions for easier use
export const healthCheck = () => apiService.healthCheck()
export const processInsuranceQuery = (query: string) => apiService.processQuery(query)
export const uploadDocument = (file: File) => apiService.uploadDocument(file)

export default apiService
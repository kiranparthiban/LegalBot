/**
 * API service for LegalBot Django backend integration
 */

const API_BASE_URL = 'http://localhost:8000';

// Types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  title: string;
  status: 'drafting' | 'reviewing' | 'completed';
  created_at: string;
  updated_at: string;
  user?: string;
}

export interface Document {
  id: string;
  session: string;
  document_type: string;
  content: string;
  formatted_content: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetails {
  id?: string;
  document: string;
  details: Record<string, string>;
  verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AIGenerateRequest {
  prompt: string;
  conversation_history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AIGenerateResponse {
  result: string;
}

export interface AIRefineRequest {
  current_draft: string;
  user_request: string;
}

export interface AIExtractDetailsRequest {
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AIExtractDetailsResponse {
  details: Record<string, string>;
}

export interface HealthCheckResponse {
  status: string;
  ai_configured: boolean;
  modules_loaded: boolean;
  debug_mode: boolean;
}

// API Client Class
class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Handle file downloads
      if (response.headers.get('content-type')?.includes('application/')) {
        return response.blob() as unknown as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // AI Agent Endpoints
  async generateDocument(data: AIGenerateRequest): Promise<AIGenerateResponse> {
    return this.request<AIGenerateResponse>('/api/ai/generate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refineDocument(data: AIRefineRequest): Promise<AIGenerateResponse> {
    return this.request<AIGenerateResponse>('/api/ai/refine/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async extractDetails(data: AIExtractDetailsRequest): Promise<AIExtractDetailsResponse> {
    return this.request<AIExtractDetailsResponse>('/api/ai/extract-details/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>('/api/ai/health/');
  }

  // Session Management
  async getSessions(): Promise<{ results: Session[] }> {
    return this.request<{ results: Session[] }>('/api/sessions/');
  }

  async getSession(id: string): Promise<Session> {
    return this.request<Session>(`/api/sessions/${id}/`);
  }

  async createSession(data: Partial<Session>): Promise<Session> {
    return this.request<Session>('/api/sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSession(id: string, data: Partial<Session>): Promise<Session> {
    return this.request<Session>(`/api/sessions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSession(id: string): Promise<void> {
    return this.request<void>(`/api/sessions/${id}/`, {
      method: 'DELETE',
    });
  }

  // Message Management
  async getMessages(sessionId: string): Promise<{ results: Message[] }> {
    return this.request<{ results: Message[] }>(`/api/sessions/${sessionId}/messages/`);
  }

  async createMessage(sessionId: string, data: Partial<Message>): Promise<Message> {
    return this.request<Message>(`/api/sessions/${sessionId}/messages/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Document Management
  async getDocument(sessionId: string): Promise<Document> {
    return this.request<Document>(`/api/sessions/${sessionId}/document/`);
  }

  async createDocument(data: Partial<Document>): Promise<Document> {
    return this.request<Document>('/api/documents/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDocument(id: string, data: Partial<Document>): Promise<Document> {
    return this.request<Document>(`/api/documents/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async generateDocumentFormat(id: string): Promise<{ message: string; formatted_content: string }> {
    return this.request<{ message: string; formatted_content: string }>(`/api/documents/${id}/generate/`, {
      method: 'POST',
    });
  }

  async downloadDocument(id: string, format: 'docx' | 'pdf'): Promise<Blob> {
    return this.request<Blob>(`/api/documents/${id}/download/?format=${format}`, {
      method: 'GET',
    });
  }

  // Document Details
  async getDocumentDetails(documentId: string): Promise<DocumentDetails> {
    return this.request<DocumentDetails>(`/api/documents/${documentId}/details/`);
  }

  async createDocumentDetails(data: Partial<DocumentDetails>): Promise<DocumentDetails> {
    return this.request<DocumentDetails>('/api/document-details/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDocumentDetails(id: string, data: Partial<DocumentDetails>): Promise<DocumentDetails> {
    return this.request<DocumentDetails>(`/api/document-details/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Utility functions
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const formatConversationHistory = (messages: Message[]) => {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
};

export default apiClient;
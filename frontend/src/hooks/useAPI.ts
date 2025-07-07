/**
 * Custom React hooks for API integration
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  apiClient, 
  Session, 
  Message, 
  Document, 
  DocumentDetails,
  formatConversationHistory,
  downloadFile
} from '../services/api';

// Hook for managing sessions
export const useSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getSessions();
      setSessions(response.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (title: string) => {
    setError(null);
    try {
      const newSession = await apiClient.createSession({
        title,
        status: 'drafting',
      });
      setSessions(prev => [newSession, ...prev]);
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      throw err;
    }
  }, []);

  const updateSession = useCallback(async (id: string, data: Partial<Session>) => {
    setError(null);
    try {
      const updatedSession = await apiClient.updateSession(id, data);
      setSessions(prev => prev.map(session => 
        session.id === id ? updatedSession : session
      ));
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
      throw err;
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    setError(null);
    try {
      await apiClient.deleteSession(id);
      setSessions(prev => prev.filter(session => session.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
  };
};

// Hook for managing messages in a session
export const useMessages = (sessionId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getMessages(sessionId);
      setMessages(response.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId) throw new Error('No active session');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    addMessage(userMessage);

    try {
      // Generate AI response
      const response = await apiClient.generateDocument({
        prompt: content,
        conversation_history: formatConversationHistory(messages),
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.result,
        timestamp: new Date().toISOString(),
      };

      addMessage(aiMessage);

      // Check if this is a draft completion
      if (response.result.includes('DRAFT_COMPLETE:')) {
        return {
          isDraftComplete: true,
          documentContent: response.result.split('DRAFT_COMPLETE:')[1].trim(),
        };
      }

      return { isDraftComplete: false };
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the Django backend is running and try again.',
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMessage);
      throw err;
    }
  }, [sessionId, messages, addMessage]);

  useEffect(() => {
    if (sessionId) {
      setMessages([]); // Clear messages when switching sessions
      fetchMessages();
    }
  }, [sessionId, fetchMessages]);

  return {
    messages,
    loading,
    error,
    addMessage,
    sendMessage,
    fetchMessages,
  };
};

// Hook for managing documents
export const useDocument = (sessionId: string | null) => {
  const [document, setDocument] = useState<Document | null>(null);
  const [documentDetails, setDocumentDetails] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDocument = useCallback(async (content: string, documentType: string) => {
    if (!sessionId) throw new Error('No active session');

    setLoading(true);
    setError(null);
    try {
      const newDocument = await apiClient.createDocument({
        session: sessionId,
        document_type: documentType,
        content,
        formatted_content: '',
      });
      setDocument(newDocument);
      return newDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const updateDocument = useCallback(async (content: string) => {
    if (!document) throw new Error('No document to update');

    setError(null);
    try {
      const updatedDocument = await apiClient.updateDocument(document.id, {
        content,
      });
      setDocument(updatedDocument);
      return updatedDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
      throw err;
    }
  }, [document]);

  const generateFormattedDocument = useCallback(async () => {
    if (!document) throw new Error('No document to format');

    setError(null);
    try {
      const response = await apiClient.generateDocumentFormat(document.id);
      setDocument(prev => prev ? { ...prev, formatted_content: response.formatted_content } : null);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to format document');
      throw err;
    }
  }, [document]);

  const downloadDocument = useCallback(async (format: 'docx' | 'pdf', filename: string) => {
    if (!document) throw new Error('No document to download');

    setError(null);
    try {
      const blob = await apiClient.downloadDocument(document.id, format);
      downloadFile(blob, `${filename}.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
      throw err;
    }
  }, [document]);

  const extractDetails = useCallback(async (messages: Message[]) => {
    setError(null);
    try {
      const response = await apiClient.extractDetails({
        conversation_history: formatConversationHistory(messages),
      });
      
      const details: DocumentDetails = {
        document: document?.id || '',
        details: response.details,
        verified: false,
      };
      
      setDocumentDetails(details);
      return details;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract details');
      throw err;
    }
  }, [document]);

  const updateDocumentDetails = useCallback(async (details: Record<string, string>, verified: boolean) => {
    if (!documentDetails) throw new Error('No document details to update');

    setError(null);
    try {
      const updatedDetails = { ...documentDetails, details, verified };
      setDocumentDetails(updatedDetails);
      
      // If we have an ID, update on server
      if (documentDetails.id) {
        await apiClient.updateDocumentDetails(documentDetails.id, updatedDetails);
      }
      
      return updatedDetails;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document details');
      throw err;
    }
  }, [documentDetails]);

  const refineDocument = useCallback(async (userRequest: string) => {
    if (!document) throw new Error('No document to refine');

    setError(null);
    try {
      const response = await apiClient.refineDocument({
        current_draft: document.content,
        user_request: userRequest,
      });

      const updatedDocument = await apiClient.updateDocument(document.id, {
        content: response.result,
      });
      
      setDocument(updatedDocument);
      return updatedDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine document');
      throw err;
    }
  }, [document]);

  return {
    document,
    documentDetails,
    loading,
    error,
    createDocument,
    updateDocument,
    generateFormattedDocument,
    downloadDocument,
    extractDetails,
    updateDocumentDetails,
    refineDocument,
  };
};

// Hook for health check
export const useHealthCheck = () => {
  const [health, setHealth] = useState<{
    status: string;
    ai_configured: boolean;
    modules_loaded: boolean;
    debug_mode: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.healthCheck();
      setHealth(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    health,
    loading,
    error,
    checkHealth,
  };
};
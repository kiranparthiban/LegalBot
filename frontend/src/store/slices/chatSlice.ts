import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  status: 'drafting' | 'reviewing' | 'completed';
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
}

const initialState: ChatState = {
  sessions: [],
  activeSessionId: null,
  isLoading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<ChatSession[]>) => {
      state.sessions = action.payload;
    },
    addSession: (state, action: PayloadAction<ChatSession>) => {
      state.sessions.unshift(action.payload);
    },
    setActiveSession: (state, action: PayloadAction<string>) => {
      state.activeSessionId = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ sessionId: string; message: Message }>) => {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) {
        session.messages.push(action.payload.message);
      }
    },
    updateSessionStatus: (state, action: PayloadAction<{ sessionId: string; status: string }>) => {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) {
        session.status = action.payload.status as 'drafting' | 'reviewing' | 'completed';
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { 
  setSessions, 
  addSession, 
  setActiveSession, 
  addMessage, 
  updateSessionStatus, 
  setLoading 
} = chatSlice.actions;
export default chatSlice.reducer;
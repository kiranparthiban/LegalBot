import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import chatSlice from './slices/chatSlice';
import documentSlice from './slices/documentSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    chat: chatSlice,
    document: documentSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
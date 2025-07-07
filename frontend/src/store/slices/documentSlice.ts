import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DocumentDetails {
  [key: string]: any;
}

interface Document {
  id: string;
  session: string;
  document_type: string;
  content: string;
  formatted_content: string;
  details?: DocumentDetails;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

interface DocumentState {
  currentDocument: Document | null;
  isGenerating: boolean;
  previewContent: string;
}

const initialState: DocumentState = {
  currentDocument: null,
  isGenerating: false,
  previewContent: '',
};

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setCurrentDocument: (state, action: PayloadAction<Document>) => {
      state.currentDocument = action.payload;
      state.previewContent = action.payload.formatted_content || action.payload.content;
    },
    updateDocumentContent: (state, action: PayloadAction<string>) => {
      if (state.currentDocument) {
        state.currentDocument.content = action.payload;
        state.previewContent = action.payload;
      }
    },
    updateDocumentDetails: (state, action: PayloadAction<DocumentDetails>) => {
      if (state.currentDocument) {
        state.currentDocument.details = action.payload;
      }
    },
    setDocumentVerified: (state, action: PayloadAction<boolean>) => {
      if (state.currentDocument) {
        state.currentDocument.verified = action.payload;
      }
    },
    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
    clearDocument: (state) => {
      state.currentDocument = null;
      state.previewContent = '';
    },
  },
});

export const { 
  setCurrentDocument, 
  updateDocumentContent, 
  updateDocumentDetails, 
  setDocumentVerified, 
  setGenerating, 
  clearDocument 
} = documentSlice.actions;
export default documentSlice.reducer;
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { addMessage, setLoading, updateSessionStatus } from '../../store/slices/chatSlice';
import { setCurrentDocument, setGenerating } from '../../store/slices/documentSlice';
import DocumentPreview from '../DocumentPreview/DocumentPreview';
import { v4 as uuidv4 } from 'uuid';

interface ChatInterfaceProps {
  sessionId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const dispatch = useDispatch();
  const { sessions, isLoading } = useSelector((state: RootState) => state.chat);
  const { isGenerating } = useSelector((state: RootState) => state.document);
  
  const currentSession = sessions.find(s => s.id === sessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };

    dispatch(addMessage({ sessionId, message: userMessage }));
    setMessage('');
    dispatch(setLoading(true));

    try {
      // Call the Django API to get AI response
      const response = await fetch('http://localhost:8000/api/ai/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if needed
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          conversation_history: currentSession?.messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiMessage = {
        id: uuidv4(),
        role: 'assistant' as const,
        content: data.result,
        timestamp: new Date().toISOString(),
      };

      dispatch(addMessage({ sessionId, message: aiMessage }));

      // Check if the response contains a complete draft
      if (data.result.includes('DRAFT_COMPLETE:')) {
        const documentContent = data.result.split('DRAFT_COMPLETE:')[1].trim();
        
        // Create a document object
        const document = {
          id: uuidv4(),
          session: sessionId,
          document_type: 'Legal Document', // This should be extracted from the content
          content: documentContent,
          formatted_content: documentContent,
          verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        dispatch(setCurrentDocument(document));
        dispatch(updateSessionStatus({ sessionId, status: 'reviewing' }));
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: uuidv4(),
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      dispatch(addMessage({ sessionId, message: errorMessage }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (!currentSession) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Session not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Grid container sx={{ height: '100%' }}>
        {/* Chat Area */}
        <Grid item xs={12} md={currentSession.status === 'reviewing' ? 7 : 12}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Chat Header */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 0,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                💬 Conversation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentSession.title}
              </Typography>
            </Paper>

            {/* Messages */}
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 2,
                backgroundColor: 'grey.50',
              }}
            >
              {currentSession.messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <BotIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Start a conversation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tell me what type of legal document you need.
                  </Typography>
                </Box>
              ) : (
                currentSession.messages.map((msg) => (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex',
                      mb: 2,
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        backgroundColor: msg.role === 'user' ? 'primary.main' : 'white',
                        color: msg.role === 'user' ? 'white' : 'text.primary',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        {msg.role === 'user' ? (
                          <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                        ) : (
                          <BotIcon sx={{ mr: 1, fontSize: 20 }} />
                        )}
                        <Typography variant="body2" fontWeight="bold">
                          {msg.role === 'user' ? 'You' : 'LegalBot'}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1,
                          opacity: 0.7,
                        }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                ))
              )}
              
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Paper elevation={1} sx={{ p: 2, backgroundColor: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BotIcon sx={{ mr: 1, fontSize: 20 }} />
                      <Typography variant="body2" fontWeight="bold" sx={{ mr: 2 }}>
                        LegalBot
                      </Typography>
                      <CircularProgress size={16} />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        Thinking...
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 0,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  <SendIcon />
                </Button>
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Document Preview */}
        {currentSession.status === 'reviewing' && (
          <Grid item xs={12} md={5}>
            <DocumentPreview sessionId={sessionId} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ChatInterface;
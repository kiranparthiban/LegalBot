import React, { useState, useCallback, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Add as AddIcon,
  Gavel as GavelIcon,
  Description as DescriptionIcon,
  RocketLaunch as RocketIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  AccountBalance as AccountBalanceIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

// Import components
import ChatInput from './components/ChatInput';
import DocumentPreview from './components/DocumentPreview';
import ProgressIndicator from './components/ProgressIndicator';
import MarkdownMessage from './components/MarkdownMessage';
import { sampleDocument, sampleDetails, sampleMarkdownMessage } from './utils/sampleDocument';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3c72',
    },
    secondary: {
      main: '#667eea',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

const drawerWidth = 300;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Session {
  id: string;
  title: string;
  status: 'drafting' | 'reviewing' | 'completed';
  updated_at: string;
  messages: Message[];
  document?: {
    id: string;
    content: string;
    formatted_content?: string;
    document_type: string;
  };
  details?: Record<string, string>;
}

function App() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState<'welcome' | 'chat'>('welcome');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

    const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      title: 'Non-Disclosure Agreement',
      status: 'reviewing',
      updated_at: new Date().toISOString(),
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'I need an NDA for a business partnership',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          role: 'assistant',
          content: sampleMarkdownMessage,
          timestamp: new Date().toISOString(),
        },
      ],
      document: sampleDocument,
      details: sampleDetails,
    },
  ]);

  // Check backend status on component mount
  React.useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/ai/health/');
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        setBackendStatus('error');
      }
    };
    
    checkBackend();
  }, []);

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen(!mobileOpen);
  }, [mobileOpen]);

  const createNewDocument = useCallback(() => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: 'New Document',
      status: 'drafting',
      updated_at: new Date().toISOString(),
      messages: [],
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveView('chat');
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveView('chat');
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  // Enhanced message handler with document generation
  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading || !activeSessionId) return;

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setSessions(prev => prev.map(session => 
      session.id === activeSessionId 
        ? { ...session, messages: [...session.messages, userMessage] }
        : session
    ));

    setIsLoading(true);

    try {
      // Determine if this is a refinement request (in reviewing mode)
      const isRefinement = currentSession.status === 'reviewing';
      const endpoint = isRefinement ? '/api/ai/refine/' : '/api/ai/generate/';
      
      let requestBody;
      if (isRefinement && currentSession.document) {
        requestBody = {
          current_draft: currentSession.document.content,
          user_request: messageContent,
        };
      } else {
        requestBody = {
          prompt: messageContent,
          conversation_history: currentSession.messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        };
      }

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      let aiMessage: Message;
      let updatedSession = { ...currentSession };

      if (isRefinement) {
        // Handle document refinement
        aiMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I have updated the document based on your feedback. Please review the changes.',
          timestamp: new Date().toISOString(),
        };

        // Update the document content
        if (updatedSession.document) {
          updatedSession.document.content = data.result;
        }
      } else {
        // Handle regular conversation or document generation
        const responseContent = data.result || 'I received your message. How can I help you create a legal document?';
        
        if (responseContent.includes('DRAFT_COMPLETE:')) {
          // Document generation complete
          const documentContent = responseContent.split('DRAFT_COMPLETE:')[1].trim();
          
          aiMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'I have prepared the initial draft. Please review it and verify the details below.',
            timestamp: new Date().toISOString(),
          };

          // Create document object
          updatedSession.document = {
            id: Date.now().toString(),
            content: documentContent,
            document_type: 'Legal Document',
          };

          // Extract details from conversation
          try {
            const detailsResponse = await fetch('http://localhost:8000/api/ai/extract-details/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                conversation_history: [...currentSession.messages, userMessage].map(m => ({
                  role: m.role,
                  content: m.content,
                })),
              }),
            });

            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json();
              updatedSession.details = detailsData.details;
            }
          } catch (error) {
            console.error('Error extracting details:', error);
          }

          // Change status to reviewing
          updatedSession.status = 'reviewing';
          showSnackbar('Document draft completed! Review and verify details.', 'success');
        } else {
          aiMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date().toISOString(),
          };
        }
      }

      // Update session title if this is the first message
      if (updatedSession.title === 'New Document' && updatedSession.messages.length === 0) {
        updatedSession.title = messageContent.substring(0, 30) + (messageContent.length > 30 ? '...' : '');
      }

      // Add AI message to session
      updatedSession.messages = [...updatedSession.messages, aiMessage];

      // Update sessions state
      setSessions(prev => prev.map(session => 
        session.id === activeSessionId ? updatedSession : session
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to the server. Please make sure the Django backend is running on http://localhost:8000 and try again.',
        timestamp: new Date().toISOString(),
      };
      setSessions(prev => prev.map(session => 
        session.id === activeSessionId 
          ? { ...session, messages: [...session.messages, errorMessage] }
          : session
      ));
      showSnackbar('Failed to send message. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeSessionId, sessions, showSnackbar]);

  // Document operations
  const handleUpdateDetails = useCallback((details: Record<string, string>, verified: boolean) => {
    setSessions(prev => prev.map(session => 
      session.id === activeSessionId 
        ? { ...session, details, verified }
        : session
    ));
  }, [activeSessionId]);

  const handleDownload = useCallback(async (format: 'docx' | 'pdf', filename: string) => {
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession?.document) return;

    try {
      // For now, create a simple download
      const content = currentSession.document.content;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSnackbar(`${format.toUpperCase()} downloaded successfully!`, 'success');
    } catch (error) {
      showSnackbar(`Failed to download ${format.toUpperCase()}`, 'error');
    }
  }, [activeSessionId, sessions, showSnackbar]);

  const handleRefineDocument = useCallback((request: string) => {
    handleSendMessage(request);
  }, [handleSendMessage]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'reviewing':
        return <DescriptionIcon color="primary" fontSize="small" />;
      default:
        return <ScheduleIcon color="action" fontSize="small" />;
    }
  }, []);

  // Memoized static data
  const documentTypes = useMemo(() => [
    { icon: <HomeIcon />, title: 'Property Transfer Agreements', description: 'Transfer property ownership' },
    { icon: <BusinessIcon />, title: 'Lease Agreements', description: 'Residential and commercial leases' },
    { icon: <AccountBalanceIcon />, title: 'Power of Attorney Documents', description: 'Legal authorization documents' },
    { icon: <AssignmentIcon />, title: 'Wills and Testaments', description: 'Estate planning documents' },
    { icon: <DescriptionIcon />, title: 'Employment Contracts', description: 'Work agreements and contracts' },
    { icon: <CheckCircleIcon />, title: 'And many more...', description: 'Various legal documents' },
  ], []);

  const steps = useMemo(() => [
    'Click "New Document" in the sidebar',
    'Tell me what type of document you need',
    "I'll ask you questions to gather the necessary information",
    'Review and download your professional legal document',
  ], []);

  // Memoized components
  const BackendStatusAlert = React.memo(() => {
    if (backendStatus === 'checking') return null;
    
    if (backendStatus === 'error') {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Backend Connection Issue
          </Typography>
          <Typography variant="body2">
            Cannot connect to Django backend. Please ensure the server is running on http://localhost:8000
          </Typography>
        </Alert>
      );
    }

    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Backend Connected
        </Typography>
        <Typography variant="body2">
          Django backend is running and ready to process requests.
        </Typography>
      </Alert>
    );
  });

  const drawer = useMemo(() => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          p: 3,
          textAlign: 'center',
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <GavelIcon sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            LegalBot
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          AI Legal Document Assistant
        </Typography>
      </Paper>

      {/* Backend Status */}
      <Box sx={{ p: 2 }}>
        <BackendStatusAlert />
      </Box>

      {/* New Document Button */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={createNewDocument}
          disabled={backendStatus === 'error'}
          sx={{
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(90deg, #5a6fd8 0%, #6a4190 100%)',
            },
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          ➕ New Document
        </Button>
      </Box>

      <Divider />

      {/* Document History */}
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'hidden' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <DescriptionIcon sx={{ mr: 1 }} />
          📋 Document History
        </Typography>

        {sessions.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No documents yet. Start by creating a new document above.
          </Alert>
        ) : (
          <List sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
            {sessions.map((session) => (
              <ListItem key={session.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={session.id === activeSessionId}
                  onClick={() => selectSession(session.id)}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                    },
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="subtitle2" noWrap sx={{ flexGrow: 1, mr: 1 }}>
                        {session.status === 'reviewing' ? '✅' : '🔄'} {session.title}
                      </Typography>
                      {getStatusIcon(session.status)}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(session.updated_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Divider />

      {/* Quick Guide */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
          📖 Quick Guide
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
          1. <strong>Start</strong> by clicking 'New Document'<br />
          2. <strong>Describe</strong> the legal document you need<br />
          3. <strong>Answer</strong> the AI's questions to gather details<br />
          4. <strong>Review</strong> the generated document<br />
          5. <strong>Verify</strong> details and download
        </Typography>
        
        <Box sx={{ mt: 2, p: 1, backgroundColor: 'info.light', borderRadius: 1 }}>
          <Typography variant="caption" color="info.contrastText">
            💡 <strong>Tip:</strong> For testing, you can say 'generate random fill' to use sample data.
          </Typography>
        </Box>
      </Box>
    </Box>
  ), [sessions, activeSessionId, backendStatus, createNewDocument, selectSession, getStatusIcon]);

  const WelcomeScreen = React.memo(() => (
    <Container maxWidth="lg" sx={{ py: 4, height: '100%', overflow: 'auto' }}>
      <BackendStatusAlert />

      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          p: 4,
          textAlign: 'center',
          mb: 4,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <GavelIcon sx={{ mr: 2, fontSize: 48 }} />
          <Typography variant="h3" fontWeight="bold">
            Welcome to LegalBot
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Your AI-powered legal document assistant
        </Typography>
      </Paper>

      <Grid container spacing={4}>
        {/* Get Started Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RocketIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
                <Typography variant="h5" fontWeight="bold">
                  🚀 Get Started
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                LegalBot helps you create professional legal documents through an interactive conversation.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                How it works:
              </Typography>
              
              <List>
                {steps.map((step, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        mr: 2,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography variant="body2">{step}</Typography>
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RocketIcon />}
                  onClick={createNewDocument}
                  disabled={backendStatus === 'error'}
                  sx={{
                    background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #218838 0%, #1ba085 100%)',
                    },
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  🚀 Create Your First Document
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Types Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                What you can create:
              </Typography>
              
              <Grid container spacing={2}>
                {documentTypes.map((docType, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          elevation: 3,
                          transform: 'translateY(-2px)',
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                        },
                      }}
                      onClick={createNewDocument}
                    >
                      <Box sx={{ color: 'inherit', mb: 1 }}>
                        {React.cloneElement(docType.icon, { fontSize: 'large' })}
                      </Box>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {docType.title}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {docType.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ready to Begin Section */}
      <Paper
        elevation={1}
        sx={{
          mt: 4,
          p: 3,
          textAlign: 'center',
          backgroundColor: 'grey.50',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Ready to begin?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Click "➕ New Document" in the sidebar to start creating your legal document.
        </Typography>
        <Button
          variant="outlined"
          size="large"
          onClick={createNewDocument}
          disabled={backendStatus === 'error'}
          sx={{ mt: 1 }}
        >
          Get Started Now
        </Button>
      </Paper>
    </Container>
  ));

  const ChatScreen = React.memo(() => {
    const currentSession = sessions.find(s => s.id === activeSessionId);
    
    if (!currentSession) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Session not found</Alert>
        </Box>
      );
    }

    const isReviewing = currentSession.status === 'reviewing' && currentSession.document;

    return (
      <Box sx={{ height: '100%', display: 'flex' }}>
        {/* Chat Area - Left Side */}
        <Box 
          sx={{ 
            width: isReviewing ? '45%' : '100%',
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRight: isReviewing ? 1 : 0,
            borderColor: 'divider',
          }}
        >
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
                    <Typography variant="body2">
                      Thinking...
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>

          {/* Chat Input */}
          <Paper
            elevation={1}
            sx={{
              borderRadius: 0,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isLoading || backendStatus === 'error'}
              placeholder={
                isReviewing 
                  ? "Ask me to refine the document (e.g., 'Change the date to...')"
                  : "Type your message here..."
              }
            />
          </Paper>
        </Box>

        {/* Document Preview or Progress - Right Side */}
        {isReviewing && currentSession.document ? (
          <Box sx={{ width: '55%', height: '100%', overflow: 'hidden' }}>
            <DocumentPreview
              document={currentSession.document}
              details={currentSession.details || {}}
              onUpdateDetails={handleUpdateDetails}
              onDownload={handleDownload}
              onRefineDocument={handleRefineDocument}
              sessionId={currentSession.id}
            />
          </Box>
        ) : !isReviewing ? (
          <Box sx={{ width: '55%', p: 2, borderLeft: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              📋 Getting Started
            </Typography>
            <ProgressIndicator
              messageCount={currentSession.messages.length}
              currentPhase={currentSession.status}
            />
          </Box>
        ) : null}
      </Box>
    );
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* App Bar for mobile */}
        {isMobile && (
          <AppBar
            position="fixed"
            sx={{
              width: '100%',
              background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <GavelIcon sx={{ mr: 1 }} />
              <Typography variant="h6" noWrap component="div">
                LegalBot
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <IconButton color="inherit" onClick={createNewDocument}>
                <AddIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        {/* Sidebar */}
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
          {isMobile ? (
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: drawerWidth,
                },
              }}
            >
              {drawer}
            </Drawer>
          ) : (
            <Drawer
              variant="permanent"
              sx={{
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: drawerWidth,
                },
              }}
              open
            >
              {drawer}
            </Drawer>
          )}
        </Box>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            mt: { xs: 8, md: 0 },
            height: { xs: 'calc(100vh - 64px)', md: '100vh' },
            overflow: 'hidden',
          }}
        >
          {activeView === 'welcome' ? <WelcomeScreen /> : <ChatScreen />}
        </Box>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;

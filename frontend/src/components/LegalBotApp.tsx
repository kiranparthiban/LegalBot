/**
 * Updated LegalBot App with full Django backend integration
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Chip,
  TextField,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// Import our API hooks
import { useSessions, useMessages, useDocument, useHealthCheck } from '../hooks/useAPI';
import { Session, Message } from '../services/api';

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

function LegalBotApp() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState<'welcome' | 'chat'>('welcome');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ 
    open: boolean; 
    message: string; 
    severity: 'success' | 'error' | 'warning' | 'info' 
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // API Hooks
  const { sessions, loading: sessionsLoading, error: sessionsError, createSession, updateSession } = useSessions();
  const { messages, loading: messagesLoading, sendMessage } = useMessages(activeSessionId);
  const { 
    document, 
    documentDetails, 
    createDocument, 
    extractDetails, 
    updateDocumentDetails, 
    downloadDocument,
    refineDocument 
  } = useDocument(activeSessionId);
  const { health, loading: healthLoading, error: healthError } = useHealthCheck();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const createNewDocument = useCallback(async () => {
    try {
      const newSession = await createSession('New Document');
      setActiveSessionId(newSession.id);
      setActiveView('chat');
      if (isMobile) {
        setMobileOpen(false);
      }
      showSnackbar('New document session created!', 'success');
    } catch (error) {
      showSnackbar('Failed to create new document session', 'error');
    }
  }, [createSession, isMobile, showSnackbar]);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveView('chat');
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isLoading || !activeSessionId) return;

    const currentMessage = message.trim();
    setMessage(''); // Clear input immediately
    setIsLoading(true);

    try {
      const result = await sendMessage(currentMessage);
      
      // Update session title if this is the first message
      const currentSession = sessions.find(s => s.id === activeSessionId);
      if (currentSession && currentSession.title === 'New Document') {
        await updateSession(activeSessionId, {
          title: currentMessage.substring(0, 30) + (currentMessage.length > 30 ? '...' : ''),
        });
      }

      // Check if the response contains a complete draft
      if (result.isDraftComplete && result.documentContent) {
        // Create document in backend
        await createDocument(result.documentContent, 'Legal Document');
        
        // Update session status to reviewing
        await updateSession(activeSessionId, { status: 'reviewing' });
        
        // Extract document details
        await extractDetails(messages);
        
        showSnackbar('Document draft completed! Review and verify details.', 'success');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      showSnackbar('Failed to send message. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [
    message, 
    isLoading, 
    activeSessionId, 
    sendMessage, 
    sessions, 
    updateSession, 
    createDocument, 
    extractDetails, 
    messages, 
    showSnackbar
  ]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleMessageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'reviewing':
        return <DescriptionIcon color="primary" fontSize="small" />;
      default:
        return <ScheduleIcon color="action" fontSize="small" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'reviewing':
        return 'primary';
      default:
        return 'default';
    }
  };

  const documentTypes = [
    { icon: <HomeIcon />, title: 'Property Transfer Agreements', description: 'Transfer property ownership' },
    { icon: <BusinessIcon />, title: 'Lease Agreements', description: 'Residential and commercial leases' },
    { icon: <AccountBalanceIcon />, title: 'Power of Attorney Documents', description: 'Legal authorization documents' },
    { icon: <AssignmentIcon />, title: 'Wills and Testaments', description: 'Estate planning documents' },
    { icon: <DescriptionIcon />, title: 'Employment Contracts', description: 'Work agreements and contracts' },
    { icon: <CheckCircleIcon />, title: 'And many more...', description: 'Various legal documents' },
  ];

  const steps = [
    'Click "New Document" in the sidebar',
    'Tell me what type of document you need',
    "I'll ask you questions to gather the necessary information",
    'Review and download your professional legal document',
  ];

  // Health Check Alert
  const HealthAlert = () => {
    if (healthLoading) return null;
    
    if (healthError || !health?.ai_configured || !health?.modules_loaded) {
      return (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          icon={<WarningIcon />}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Backend Connection Issue
          </Typography>
          <Typography variant="body2">
            {healthError ? 
              'Cannot connect to Django backend. Please ensure the server is running on http://localhost:8000' :
              'AI modules not properly configured. Check OPENROUTER_API_KEY and dependencies.'
            }
          </Typography>
        </Alert>
      );
    }

    return null;
  };

  const drawer = (
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

      {/* Health Check */}
      <Box sx={{ p: 2 }}>
        <HealthAlert />
      </Box>

      {/* New Document Button */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={createNewDocument}
          disabled={sessionsLoading || !!healthError}
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
          New Document
        </Button>
      </Box>

      <Divider />

      {/* Document History */}
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'hidden' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <DescriptionIcon sx={{ mr: 1 }} />
          Document History
        </Typography>

        {sessionsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : sessionsError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to load sessions
          </Alert>
        ) : sessions.length === 0 ? (
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
                        {session.title}
                      </Typography>
                      {getStatusIcon(session.status)}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip
                        label={session.status}
                        size="small"
                        color={getStatusColor(session.status) as any}
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </Typography>
                    </Box>
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
  );

  const WelcomeScreen = () => (
    <Container maxWidth="lg" sx={{ py: 4, height: '100%', overflow: 'auto' }}>
      {/* Health Check Alert */}
      <HealthAlert />

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
                  disabled={!!healthError}
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
                  Create Your First Document
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
          Click "New Document" in the sidebar to start creating your legal document.
        </Typography>
        <Button
          variant="outlined"
          size="large"
          onClick={createNewDocument}
          disabled={!!healthError}
          sx={{ mt: 1 }}
        >
          Get Started Now
        </Button>
      </Paper>
    </Container>
  );

  const ChatScreen = () => {
    const currentSession = sessions.find(s => s.id === activeSessionId);
    
    if (!currentSession) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Session not found</Alert>
        </Box>
      );
    }

    const isReviewing = currentSession.status === 'reviewing' && document;

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Chat Area */}
          <Grid item xs={12} md={isReviewing ? 7 : 12}>
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
                {messages.length === 0 ? (
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
                  messages.map((msg) => (
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
                
                {(isLoading || messagesLoading) && (
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
                    onChange={handleMessageChange}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || messagesLoading || !!healthError}
                    variant="outlined"
                    size="small"
                  />
                  <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading || messagesLoading || !!healthError}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    <SendIcon />
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Grid>

          {/* Document Preview */}
          {isReviewing && (
            <Grid item xs={12} md={5}>
              <DocumentPreview />
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  const DocumentPreview = () => {
    const [fileFormat, setFileFormat] = useState('DOCX');
    const [fileName, setFileName] = useState('Legal_Document');
    const [verified, setVerified] = useState(documentDetails?.verified || false);
    const [details, setDetails] = useState(documentDetails?.details || {});

    const handleDetailChange = (key: string, value: string) => {
      setDetails(prev => ({ ...prev, [key]: value }));
    };

    const handleDownload = async () => {
      if (!document) return;
      
      try {
        await downloadDocument(fileFormat.toLowerCase() as 'docx' | 'pdf', fileName);
        showSnackbar(`${fileFormat} downloaded successfully!`, 'success');
      } catch (error) {
        showSnackbar(`Failed to download ${fileFormat}`, 'error');
      }
    };

    const handleVerificationChange = async (checked: boolean) => {
      setVerified(checked);
      try {
        await updateDocumentDetails(details, checked);
      } catch (error) {
        showSnackbar('Failed to update verification status', 'error');
      }
    };

    const categorizeDetails = () => {
      const categories = {
        parties: {} as Record<string, string>,
        dates: {} as Record<string, string>,
        property: {} as Record<string, string>,
        legal: {} as Record<string, string>,
        other: {} as Record<string, string>,
      };

      Object.entries(details).forEach(([key, value]) => {
        if (key === 'Document Type') {
          return;
        } else if (key.toLowerCase().includes('party') || key.toLowerCase().includes('name') || 
                   key.toLowerCase().includes('relationship') || key.toLowerCase().includes('address')) {
          categories.parties[key] = value;
        } else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('period') || 
                   key.toLowerCase().includes('duration')) {
          categories.dates[key] = value;
        } else if (key.toLowerCase().includes('property') || key.toLowerCase().includes('legal description')) {
          categories.property[key] = value;
        } else if (key.toLowerCase().includes('governing') || key.toLowerCase().includes('law') || 
                   key.toLowerCase().includes('consideration') || key.toLowerCase().includes('transfer type')) {
          categories.legal[key] = value;
        } else {
          categories.other[key] = value;
        }
      });

      return categories;
    };

    const categories = categorizeDetails();

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Sticky Document Preview */}
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 2,
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <VisibilityIcon sx={{ mr: 1 }} />
            Document Preview
          </Typography>
          
          <TextField
            multiline
            rows={8}
            fullWidth
            value={document?.content || ''}
            InputProps={{
              readOnly: true,
              style: {
                fontFamily: 'Times New Roman, serif',
                fontSize: '14px',
                lineHeight: 1.6,
              },
            }}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'grey.50',
              },
            }}
          />
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            📄 Updates automatically
          </Typography>
        </Paper>

        {/* Document Controls */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          <Typography variant="h6" gutterBottom>
            🔧 Document Controls
          </Typography>

          {/* Document Details */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="bold">
                🔍 Verify Document Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* Document Type - Non-editable */}
              <TextField
                fullWidth
                label="📋 Document Type"
                value={details['Document Type'] || 'Legal Document'}
                disabled
                margin="normal"
                helperText="Document type is automatically detected and cannot be changed"
              />

              {/* Categorized Details */}
              {Object.keys(categories.parties).length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                    👥 Parties Information:
                  </Typography>
                  {Object.entries(categories.parties).map(([key, value]) => (
                    <TextField
                      key={key}
                      fullWidth
                      label={key}
                      value={value}
                      onChange={(e) => handleDetailChange(key, e.target.value)}
                      margin="normal"
                      size="small"
                    />
                  ))}
                </>
              )}

              {Object.keys(categories.dates).length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                    📅 Dates & Duration:
                  </Typography>
                  {Object.entries(categories.dates).map(([key, value]) => (
                    <TextField
                      key={key}
                      fullWidth
                      label={key}
                      value={value}
                      onChange={(e) => handleDetailChange(key, e.target.value)}
                      margin="normal"
                      size="small"
                    />
                  ))}
                </>
              )}

              {Object.keys(categories.property).length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                    🏠 Property Details:
                  </Typography>
                  {Object.entries(categories.property).map(([key, value]) => (
                    <TextField
                      key={key}
                      fullWidth
                      label={key}
                      value={value}
                      onChange={(e) => handleDetailChange(key, e.target.value)}
                      margin="normal"
                      size="small"
                    />
                  ))}
                </>
              )}

              {Object.keys(categories.legal).length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                    ⚖️ Legal Terms:
                  </Typography>
                  {Object.entries(categories.legal).map(([key, value]) => (
                    <TextField
                      key={key}
                      fullWidth
                      label={key}
                      value={value}
                      onChange={(e) => handleDetailChange(key, e.target.value)}
                      margin="normal"
                      size="small"
                    />
                  ))}
                </>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Verification */}
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={verified}
                  onChange={(e) => handleVerificationChange(e.target.checked)}
                  color="primary"
                />
              }
              label="✅ I have verified all the details above are correct"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Download Options */}
          <Typography variant="h6" gutterBottom>
            📥 Download Options
          </Typography>

          {verified ? (
            <Box>
              <TextField
                fullWidth
                label="Document File Name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                margin="normal"
                size="small"
              />

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Choose file format</InputLabel>
                <Select
                  value={fileFormat}
                  label="Choose file format"
                  onChange={(e) => setFileFormat(e.target.value)}
                >
                  <MenuItem value="DOCX">DOCX</MenuItem>
                  <MenuItem value="PDF">PDF</MenuItem>
                </Select>
              </FormControl>

              <Button
                fullWidth
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{
                  mt: 2,
                  background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #218838 0%, #1ba085 100%)',
                  },
                }}
              >
                🔽 Download Document
              </Button>
            </Box>
          ) : (
            <Alert severity="info">
              Please verify the details above to enable document download.
            </Alert>
          )}
        </Box>
      </Box>
    );
  };

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

export default LegalBotApp;
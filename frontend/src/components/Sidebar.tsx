import React from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Gavel as GavelIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface SidebarProps {
  onNewDocument: () => void;
  onSessionSelect: (sessionId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewDocument, onSessionSelect }) => {
  const { sessions, activeSessionId } = useSelector((state: RootState) => state.chat);

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

  return (
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

      {/* New Document Button */}
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={onNewDocument}
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

        {sessions.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No documents yet. Start by creating a new document above.
          </Alert>
        ) : (
          <List sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
            {sessions.map((session) => (
              <ListItem key={session.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={session.id === activeSessionId}
                  onClick={() => onSessionSelect(session.id)}
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
};

export default Sidebar;
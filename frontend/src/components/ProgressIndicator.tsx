import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface ProgressIndicatorProps {
  messageCount: number;
  currentPhase: 'drafting' | 'reviewing';
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ messageCount, currentPhase }) => {
  const progress = Math.min(messageCount * 0.2, 1.0);
  const progressPercentage = Math.round(progress * 100);

  const getProgressSteps = () => {
    const steps = [
      { label: 'Type of legal document', threshold: 0.2 },
      { label: 'Parties involved', threshold: 0.4 },
      { label: 'Key terms and conditions', threshold: 0.6 },
      { label: 'Final details and confirmation', threshold: 0.8 },
      { label: 'Document generation', threshold: 1.0 },
    ];

    return steps.map((step, index) => {
      const isCompleted = progress >= step.threshold;
      const isCurrent = progress >= (steps[index - 1]?.threshold || 0) && progress < step.threshold;
      
      return {
        ...step,
        isCompleted,
        isCurrent,
      };
    });
  };

  const steps = getProgressSteps();

  if (currentPhase === 'reviewing') {
    return (
      <Paper elevation={1} sx={{ p: 3, backgroundColor: 'success.light', color: 'success.contrastText' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          Document Ready for Review
        </Typography>
        <Typography variant="body2">
          Your document has been generated and is ready for verification and download.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        📊 Progress
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
            Information gathering:
          </Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ ml: 1 }}>
            {progressPercentage}% complete
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 4,
            }
          }} 
        />
      </Box>

      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
        💡 What I Need
      </Typography>
      
      <List dense>
        {steps.map((step, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              {step.isCompleted ? (
                <CheckCircleIcon color="success" fontSize="small" />
              ) : step.isCurrent ? (
                <ScheduleIcon color="primary" fontSize="small" />
              ) : (
                <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText 
              primary={step.label}
              primaryTypographyProps={{
                variant: 'body2',
                color: step.isCompleted ? 'success.main' : step.isCurrent ? 'primary.main' : 'text.secondary',
                fontWeight: step.isCurrent ? 'bold' : 'normal',
              }}
            />
          </ListItem>
        ))}
      </List>

      {progressPercentage < 100 && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
          <Typography variant="caption" color="info.contrastText">
            💡 <strong>Tip:</strong> For testing, you can say 'generate random fill' to use sample data.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ProgressIndicator;
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  RocketLaunch as RocketIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  AccountBalance as AccountBalanceIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

interface WelcomeScreenProps {
  onCreateDocument: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreateDocument }) => {
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

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: '100%', overflow: 'auto' }}>
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
                    <ListItemIcon>
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
                        }}
                      >
                        {index + 1}
                      </Box>
                    </ListItemIcon>
                    <ListItemText primary={step} />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RocketIcon />}
                  onClick={onCreateDocument}
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
                        '&:hover': {
                          elevation: 3,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box sx={{ color: 'primary.main', mb: 1 }}>
                        {React.cloneElement(docType.icon, { fontSize: 'large' })}
                      </Box>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {docType.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
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
          onClick={onCreateDocument}
          sx={{ mt: 1 }}
        >
          Get Started Now
        </Button>
      </Paper>
    </Container>
  );
};

export default WelcomeScreen;
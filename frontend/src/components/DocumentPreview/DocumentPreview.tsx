import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { updateDocumentDetails, setDocumentVerified } from '../../store/slices/documentSlice';

interface DocumentPreviewProps {
  sessionId: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ sessionId }) => {
  const [fileFormat, setFileFormat] = useState('DOCX');
  const [fileName, setFileName] = useState('Legal_Document');
  const [isEditing, setIsEditing] = useState(false);
  
  const dispatch = useDispatch();
  const { currentDocument } = useSelector((state: RootState) => state.document);

  // Mock document details - in real app, this would come from the document
  const [documentDetails, setDocumentDetails] = useState({
    'Document Type': 'Property Transfer Agreement',
    'Party 1 Name': 'John Michael Smith',
    'Party 1 Relationship': 'Father',
    'Party 1 Address': '123 Maple Street, Toronto, Ontario, M5V 2H1',
    'Party 2 Name': 'Emily Jane Smith',
    'Party 2 Relationship': 'Son/Daughter',
    'Party 2 Address': '456 Oak Avenue, Toronto, Ontario, M6K 3P2',
    'Agreement Date': '15th day of October, 2023',
    'Transfer Date': 'October 15, 2033',
    'Duration/Period': '10 years',
    'Property Address': '789 Pine Road, Toronto, Ontario, M4B 1B2',
    'Legal Description': 'Lot 12, Plan 3456, City of Toronto',
    'Governing Law': 'Province of Ontario',
    'Transfer Type': 'Future Transfer Agreement',
    'Consideration': 'No monetary consideration',
  });

  const [verified, setVerified] = useState(false);

  const handleDetailChange = (key: string, value: string) => {
    const updatedDetails = { ...documentDetails, [key]: value };
    setDocumentDetails(updatedDetails);
    dispatch(updateDocumentDetails(updatedDetails));
  };

  const handleVerificationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isVerified = event.target.checked;
    setVerified(isVerified);
    dispatch(setDocumentVerified(isVerified));
  };

  const handleDownload = async () => {
    if (!currentDocument) return;

    try {
      const response = await fetch(`http://localhost:8000/api/documents/${currentDocument.id}/download/${fileFormat.toLowerCase()}/`, {
        method: 'GET',
        headers: {
          // Add auth headers if needed
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${fileName}.${fileFormat.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
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

    Object.entries(documentDetails).forEach(([key, value]) => {
      if (key === 'Document Type') {
        // Skip document type as it's shown separately
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

  if (!currentDocument) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          The document preview will appear here once the AI generates a document.
        </Alert>
      </Box>
    );
  }

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
          Document Preview (Always Visible)
        </Typography>
        
        <TextField
          multiline
          rows={8}
          fullWidth
          value={currentDocument.content}
          InputProps={{
            readOnly: !isEditing,
            style: {
              fontFamily: 'Times New Roman, serif',
              fontSize: '14px',
              lineHeight: 1.6,
            },
          }}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: isEditing ? 'background.paper' : 'grey.50',
            },
          }}
        />
        
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            📄 Scroll to see full document • Updates automatically
          </Typography>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        </Box>
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
              value={documentDetails['Document Type']}
              disabled
              margin="normal"
              helperText="Document type is automatically detected and cannot be changed"
            />

            {/* Parties Information */}
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

            {/* Dates & Duration */}
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

            {/* Property Details */}
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

            {/* Legal Terms */}
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

            {/* Other Details */}
            {Object.keys(categories.other).length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  📝 Other Details:
                </Typography>
                {Object.entries(categories.other).map(([key, value]) => (
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
                onChange={handleVerificationChange}
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

export default DocumentPreview;
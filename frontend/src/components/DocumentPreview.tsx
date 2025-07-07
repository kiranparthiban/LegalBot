import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider,
  Paper,
  Chip,
  Tab,
  Tabs,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Code as CodeIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';

interface DocumentDetails {
  [key: string]: string;
}

interface DocumentPreviewProps {
  document: {
    id: string;
    content: string;
    formatted_content?: string;
    document_type: string;
  };
  details: DocumentDetails;
  onUpdateDetails: (details: DocumentDetails, verified: boolean) => void;
  onDownload: (format: 'docx' | 'pdf', filename: string) => void;
  onRefineDocument: (request: string) => void;
  sessionId: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  details,
  onUpdateDetails,
  onDownload,
  onRefineDocument,
  sessionId,
}) => {
  const [editableDetails, setEditableDetails] = useState<DocumentDetails>(details);
  const [verified, setVerified] = useState(false);
  const [fileName, setFileName] = useState(`Legal_Document_${sessionId.slice(0, 8)}`);
  const [fileFormat, setFileFormat] = useState<'DOCX' | 'PDF'>('DOCX');
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(document.content);
  const [refinementRequest, setRefinementRequest] = useState('');
  const [previewTab, setPreviewTab] = useState(0); // 0 = Rendered, 1 = Raw

  // Update local state when props change
  useEffect(() => {
    setEditableDetails(details);
  }, [details]);

  useEffect(() => {
    setEditedContent(document.content);
  }, [document.content]);

  const handleDetailChange = useCallback((key: string, value: string) => {
    setEditableDetails(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleVerificationChange = useCallback((checked: boolean) => {
    setVerified(checked);
    onUpdateDetails(editableDetails, checked);
  }, [editableDetails, onUpdateDetails]);

  const handleDownload = useCallback(() => {
    onDownload(fileFormat.toLowerCase() as 'docx' | 'pdf', fileName);
  }, [fileFormat, fileName, onDownload]);

  const handleRefinement = useCallback(() => {
    if (refinementRequest.trim()) {
      onRefineDocument(refinementRequest.trim());
      setRefinementRequest('');
    }
  }, [refinementRequest, onRefineDocument]);

  const handleUpdateDocument = useCallback(() => {
    // Handle document update with edited content
    setEditMode(false);
    // You can add API call here to update the document
  }, [editedContent]);

  const categorizeDetails = useCallback(() => {
    const categories = {
      parties: {} as Record<string, string>,
      dates: {} as Record<string, string>,
      property: {} as Record<string, string>,
      legal: {} as Record<string, string>,
      other: {} as Record<string, string>,
    };

    Object.entries(editableDetails).forEach(([key, value]) => {
      if (key === 'Document Type') {
        return;
      } else if (
        key.toLowerCase().includes('party') ||
        key.toLowerCase().includes('name') ||
        key.toLowerCase().includes('relationship') ||
        key.toLowerCase().includes('address')
      ) {
        categories.parties[key] = value;
      } else if (
        key.toLowerCase().includes('date') ||
        key.toLowerCase().includes('period') ||
        key.toLowerCase().includes('duration')
      ) {
        categories.dates[key] = value;
      } else if (
        key.toLowerCase().includes('property') ||
        key.toLowerCase().includes('legal description') ||
        key.toLowerCase().includes('subject')
      ) {
        categories.property[key] = value;
      } else if (
        key.toLowerCase().includes('governing') ||
        key.toLowerCase().includes('law') ||
        key.toLowerCase().includes('consideration') ||
        key.toLowerCase().includes('transfer type')
      ) {
        categories.legal[key] = value;
      } else {
        categories.other[key] = value;
      }
    });

    return categories;
  }, [editableDetails]);

  const categories = categorizeDetails();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Document Preview Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <VisibilityIcon sx={{ mr: 1 }} />
            📄 Document Preview
          </Typography>
          <Chip
            label={verified ? 'Verified' : 'Needs Verification'}
            color={verified ? 'success' : 'warning'}
            icon={verified ? <CheckCircleIcon /> : undefined}
            size="small"
          />
        </Box>
      </Paper>

      {/* Document Preview Content - LARGER SIZE */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', height: '45%', display: 'flex', flexDirection: 'column' }}>
        {/* Preview Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={previewTab} onChange={(e, newValue) => setPreviewTab(newValue)} variant="fullWidth">
            <Tab icon={<PreviewIcon />} label="Rendered" />
            <Tab icon={<CodeIcon />} label="Raw/Edit" />
          </Tabs>
        </Box>

        {/* Preview Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {previewTab === 0 ? (
            // Rendered Markdown View
            <Paper
              elevation={0}
              sx={{
                p: 3,
                backgroundColor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                height: '100%',
                overflow: 'auto',
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for legal document formatting
                  h1: ({ children }) => (
                    <Typography variant="h4" component="h1" gutterBottom sx={{ 
                      fontFamily: 'Times New Roman, serif',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      mb: 3
                    }}>
                      {children}
                    </Typography>
                  ),
                  h2: ({ children }) => (
                    <Typography variant="h5" component="h2" gutterBottom sx={{ 
                      fontFamily: 'Times New Roman, serif',
                      fontWeight: 'bold',
                      mt: 3,
                      mb: 2
                    }}>
                      {children}
                    </Typography>
                  ),
                  h3: ({ children }) => (
                    <Typography variant="h6" component="h3" gutterBottom sx={{ 
                      fontFamily: 'Times New Roman, serif',
                      fontWeight: 'bold',
                      mt: 2,
                      mb: 1
                    }}>
                      {children}
                    </Typography>
                  ),
                  p: ({ children }) => (
                    <Typography variant="body1" paragraph sx={{ 
                      fontFamily: 'Times New Roman, serif',
                      lineHeight: 1.8,
                      textAlign: 'justify',
                      mb: 2
                    }}>
                      {children}
                    </Typography>
                  ),
                  strong: ({ children }) => (
                    <Typography component="strong" sx={{ 
                      fontFamily: 'Times New Roman, serif',
                      fontWeight: 'bold'
                    }}>
                      {children}
                    </Typography>
                  ),
                  em: ({ children }) => (
                    <Typography component="em" sx={{ 
                      fontFamily: 'Times New Roman, serif',
                      fontStyle: 'italic'
                    }}>
                      {children}
                    </Typography>
                  ),
                  ul: ({ children }) => (
                    <Box component="ul" sx={{ 
                      fontFamily: 'Times New Roman, serif',
                      pl: 3,
                      mb: 2
                    }}>
                      {children}
                    </Box>
                  ),
                  ol: ({ children }) => (
                    <Box component="ol" sx={{ 
                      fontFamily: 'Times New Roman, serif',
                      pl: 3,
                      mb: 2
                    }}>
                      {children}
                    </Box>
                  ),
                  li: ({ children }) => (
                    <Typography component="li" sx={{ 
                      fontFamily: 'Times New Roman, serif',
                      lineHeight: 1.6,
                      mb: 0.5
                    }}>
                      {children}
                    </Typography>
                  ),
                  blockquote: ({ children }) => (
                    <Box sx={{ 
                      borderLeft: 4,
                      borderColor: 'primary.main',
                      pl: 2,
                      ml: 2,
                      fontStyle: 'italic',
                      backgroundColor: 'grey.50',
                      p: 2,
                      borderRadius: 1
                    }}>
                      {children}
                    </Box>
                  ),
                }}
              >
                {document.formatted_content || document.content}
              </ReactMarkdown>
            </Paper>
          ) : (
            // Raw/Edit View
            <TextField
              multiline
              fullWidth
              value={editMode ? editedContent : (document.formatted_content || document.content)}
              onChange={(e) => setEditedContent(e.target.value)}
              InputProps={{
                readOnly: !editMode,
                style: {
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  fontSize: '14px',
                  lineHeight: 1.6,
                },
              }}
              variant="outlined"
              sx={{
                height: '100%',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: editMode ? 'background.paper' : 'grey.50',
                  height: '100%',
                },
                '& .MuiOutlinedInput-input': {
                  height: '100% !important',
                  overflow: 'auto !important',
                },
              }}
            />
          )}
        </Box>

        {/* Preview Controls */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            📄 {editMode ? 'Editing mode - Click Update to save' : 'Live preview • Updates automatically'}
          </Typography>

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(!editMode)}
              size="small"
            >
              {editMode ? 'View' : 'Edit'}
            </Button>

            {editMode && (
              <Button
                variant="contained"
                onClick={handleUpdateDocument}
                size="small"
              >
                Update
              </Button>
            )}

            {verified && (
              <>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={fileFormat}
                    label="Format"
                    onChange={(e) => setFileFormat(e.target.value as 'DOCX' | 'PDF')}
                  >
                    <MenuItem value="DOCX">DOCX</MenuItem>
                    <MenuItem value="PDF">PDF</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  size="small"
                  sx={{
                    background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #218838 0%, #1ba085 100%)',
                    },
                  }}
                >
                  Download
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Document Controls - ALL FEATURES RESTORED */}
      <Box sx={{ height: '55%', overflow: 'auto', p: 2 }}>
        <Typography variant="h6" gutterBottom>
          🔧 Document Controls
        </Typography>

        {/* Document Refinement */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              ✏️ Refine Document
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" paragraph>
              Ask the AI to make specific changes to your document.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="e.g., Change the date to December 1, 2024, or add a clause about..."
              value={refinementRequest}
              onChange={(e) => setRefinementRequest(e.target.value)}
              sx={{ mb: 2 }}
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleRefinement}
              disabled={!refinementRequest.trim()}
              fullWidth
              size="small"
            >
              Refine Document
            </Button>
          </AccordionDetails>
        </Accordion>

        {/* Document Details Verification */}
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
              value={editableDetails['Document Type'] || 'Legal Document'}
              disabled
              margin="normal"
              size="small"
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
                onChange={(e) => setFileFormat(e.target.value as 'DOCX' | 'PDF')}
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
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography, Box } from '@mui/material';

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, isUser = false }) => {
  if (isUser) {
    // User messages are plain text
    return (
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
        {content}
      </Typography>
    );
  }

  // AI messages are rendered as Markdown
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Custom styling for chat messages
        h1: ({ children }) => (
          <Typography variant="h6" component="h1" gutterBottom sx={{ 
            fontWeight: 'bold',
            mb: 1
          }}>
            {children}
          </Typography>
        ),
        h2: ({ children }) => (
          <Typography variant="subtitle1" component="h2" gutterBottom sx={{ 
            fontWeight: 'bold',
            mb: 1
          }}>
            {children}
          </Typography>
        ),
        h3: ({ children }) => (
          <Typography variant="subtitle2" component="h3" gutterBottom sx={{ 
            fontWeight: 'bold',
            mb: 0.5
          }}>
            {children}
          </Typography>
        ),
        p: ({ children }) => (
          <Typography variant="body1" paragraph sx={{ 
            lineHeight: 1.6,
            mb: 1,
            '&:last-child': { mb: 0 }
          }}>
            {children}
          </Typography>
        ),
        strong: ({ children }) => (
          <Typography component="strong" sx={{ 
            fontWeight: 'bold'
          }}>
            {children}
          </Typography>
        ),
        em: ({ children }) => (
          <Typography component="em" sx={{ 
            fontStyle: 'italic'
          }}>
            {children}
          </Typography>
        ),
        ul: ({ children }) => (
          <Box component="ul" sx={{ 
            pl: 2,
            mb: 1,
            '& li': {
              mb: 0.25
            }
          }}>
            {children}
          </Box>
        ),
        ol: ({ children }) => (
          <Box component="ol" sx={{ 
            pl: 2,
            mb: 1,
            '& li': {
              mb: 0.25
            }
          }}>
            {children}
          </Box>
        ),
        li: ({ children }) => (
          <Typography component="li" variant="body2" sx={{ 
            lineHeight: 1.5
          }}>
            {children}
          </Typography>
        ),
        blockquote: ({ children }) => (
          <Box sx={{ 
            borderLeft: 3,
            borderColor: 'primary.main',
            pl: 2,
            ml: 1,
            fontStyle: 'italic',
            backgroundColor: 'rgba(0,0,0,0.05)',
            py: 1,
            borderRadius: '0 4px 4px 0',
            mb: 1
          }}>
            {children}
          </Box>
        ),
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <Typography component="code" sx={{
                backgroundColor: 'rgba(0,0,0,0.1)',
                padding: '2px 4px',
                borderRadius: 1,
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                fontSize: '0.875em'
              }}>
                {children}
              </Typography>
            );
          }
          // Block code
          return (
            <Box sx={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              p: 2,
              borderRadius: 1,
              mb: 1,
              overflow: 'auto'
            }}>
              <Typography component="pre" sx={{
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                fontSize: '0.875rem',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {children}
              </Typography>
            </Box>
          );
        },
        pre: ({ children }) => (
          <Box sx={{
            backgroundColor: 'rgba(0,0,0,0.05)',
            p: 2,
            borderRadius: 1,
            mb: 1,
            overflow: 'auto'
          }}>
            {children}
          </Box>
        ),
        table: ({ children }) => (
          <Box sx={{ 
            overflow: 'auto',
            mb: 1
          }}>
            <Box component="table" sx={{
              borderCollapse: 'collapse',
              width: '100%',
              '& th, & td': {
                border: 1,
                borderColor: 'divider',
                p: 1,
                textAlign: 'left'
              },
              '& th': {
                backgroundColor: 'grey.100',
                fontWeight: 'bold'
              }
            }}>
              {children}
            </Box>
          </Box>
        ),
        hr: () => (
          <Box sx={{ 
            borderBottom: 1,
            borderColor: 'divider',
            my: 2
          }} />
        ),
        a: ({ children, href }) => (
          <Typography component="a" href={href} sx={{
            color: 'primary.main',
            textDecoration: 'underline',
            '&:hover': {
              textDecoration: 'none'
            }
          }}>
            {children}
          </Typography>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownMessage;
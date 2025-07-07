import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = React.memo(({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type your message here..." 
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle message change with stable reference
  const handleMessageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  }, []);

  // Handle send message
  const handleSendMessage = useCallback(() => {
    if (!message.trim() || disabled) return;
    
    onSendMessage(message.trim());
    setMessage('');
    
    // Maintain focus after sending
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, [message, disabled, onSendMessage]);

  // Handle key down
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Prevent focus loss on any external updates
  useEffect(() => {
    const handleFocusLoss = () => {
      if (document.activeElement !== inputRef.current && inputRef.current) {
        // Only refocus if no other input is focused
        const activeElement = document.activeElement;
        if (!activeElement || activeElement.tagName !== 'INPUT') {
          inputRef.current.focus();
        }
      }
    };

    // Add a small delay to prevent immediate refocus conflicts
    const timeoutId = setTimeout(handleFocusLoss, 100);
    return () => clearTimeout(timeoutId);
  }, [message]); // Only run when message changes

  return (
    <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
      <TextField
        ref={inputRef}
        fullWidth
        multiline
        maxRows={4}
        placeholder={placeholder}
        value={message}
        onChange={handleMessageChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        variant="outlined"
        size="small"
        autoFocus
        // Prevent any external interference
        onBlur={(e) => {
          // Prevent blur if clicking on send button
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (relatedTarget && relatedTarget.closest('[data-send-button]')) {
            e.preventDefault();
            return;
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'divider',
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
            },
          },
        }}
      />
      <Button
        variant="contained"
        onClick={handleSendMessage}
        disabled={!message.trim() || disabled}
        data-send-button="true"
        sx={{ 
          minWidth: 'auto', 
          px: 2,
          '&:focus': {
            // Prevent button from stealing focus
            outline: 'none',
          }
        }}
        // Prevent button from taking focus
        onMouseDown={(e) => e.preventDefault()}
      >
        <SendIcon />
      </Button>
    </Box>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
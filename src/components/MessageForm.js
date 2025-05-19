// src/components/MessageForm.js
import React, { useState } from 'react';

const MessageForm = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    try {
      setSending(true);
      setError('');
      
      const success = await onSendMessage(message);
      
      if (success) {
        setMessage('');
      } else {
        setError('Failed to send message. Please try again.');
      }
      
      setSending(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('An error occurred while sending the message');
      setSending(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ 
          color: 'var(--danger)', 
          marginBottom: '10px', 
          fontSize: '14px',
          padding: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
      
      <div style={{ 
        border: '1px solid #eee', 
        borderRadius: '8px', 
        padding: '12px',
        backgroundColor: '#f9f9f9',
        marginBottom: '10px'
      }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          style={{ 
            width: '100%', 
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            resize: 'vertical',
            minHeight: '80px',
            fontFamily: 'inherit',
            fontSize: '16px'
          }}
        />
      </div>
      
      <button 
        type="submit"
        disabled={sending || !message.trim()}
        className="btn btn-primary"
        style={{ 
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {sending ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
};

export default MessageForm;
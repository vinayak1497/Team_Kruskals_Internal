'use client';

import { useState, useRef, useEffect } from 'react';
import { complaints as complaintsApi } from '../lib/api';

export default function ComplaintChatbot({ onExtract, initialMessage = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'नमस्ते! 👋 I\'m VAANI Assistant. Tell me about your complaint in your own words - in English or Hindi. I\'ll help extract the details and fill your complaint form automatically.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showExtractedData, setShowExtractedData] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // First, try to extract complaint data
      const extractRes = await complaintsApi.chatbotExtract(inputValue);

      if (extractRes.success) {
        setExtractedData(extractRes.extracted);
        setShowExtractedData(true);

        // Add assistant message with extracted data
        const assistantMsg = {
          id: messages.length + 2,
          role: 'assistant',
          text: `Great! I've extracted the following details:\n\n📝 **Category**: ${extractRes.extracted.category}\n📍 **Address**: ${extractRes.extracted.address || 'Not mentioned'}\n📌 **Description**: ${extractRes.extracted.description.substring(0, 100)}...\n\nDoes this look correct? You can refine any details or proceed to file the complaint.`,
          timestamp: new Date(),
          extracted: true,
          data: extractRes.extracted
        };
        setMessages(prev => [...prev, assistantMsg]);
      }

      // Also generate a conversational response
      const chatRes = await complaintsApi.chatbotMessage(inputValue, messages);
      if (chatRes.success) {
        const responseMsg = {
          id: messages.length + 3,
          role: 'assistant',
          text: chatRes.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, responseMsg]);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMsg = {
        id: messages.length + 2,
        role: 'assistant',
        text: '⚠️ Sorry, I had trouble processing that. Could you provide more details about your issue?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExtracted = () => {
    if (extractedData && onExtract) {
      onExtract(extractedData);
      setIsOpen(false);
      setMessages([
        {
          id: 1,
          role: 'assistant',
          text: '✅ Great! Your complaint form has been filled. Please review and submit!',
          timestamp: new Date()
        }
      ]);
      setExtractedData(null);
      setShowExtractedData(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 999,
            transition: 'transform 0.2s, box-shadow 0.2s',
            fontWeight: 'bold'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          title="Chat with VAANI Assistant"
        >
          💬
        </button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 'min(100vw - 48px, 420px)',
            height: 'min(100vh - 48px, 600px)',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
              color: 'white',
              padding: 'var(--space-4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--color-border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '1.5rem' }}>💬</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>VAANI Assistant</div>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>AI-Powered Complaint Helper</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)'
            }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 'var(--space-2)'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                    color: msg.role === 'user' ? 'white' : 'var(--color-text)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.text}
                  {msg.extracted && msg.data && (
                    <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                      <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: 'var(--space-2)' }}>
                        <strong>Extracted Details:</strong>
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.9 }}>
                        <div>📂 <strong>Category:</strong> {msg.data.category}</div>
                        <div>📍 <strong>Address:</strong> {msg.data.address || 'Not provided'}</div>
                        <div>📝 <strong>Details:</strong> {msg.data.description.substring(0, 80)}...</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '12px' }}>Thinking...</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', animation: 'pulse 1s infinite' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', animation: 'pulse 1s infinite 0.2s' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', animation: 'pulse 1s infinite 0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Extracted Data Preview */}
          {showExtractedData && extractedData && (
            <div
              style={{
                background: 'var(--color-surface-hover)',
                padding: 'var(--space-3)',
                borderTop: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
                fontSize: 'var(--text-xs)'
              }}
            >
              <div style={{ marginBottom: 'var(--space-2)', fontWeight: 600, color: 'var(--color-primary)' }}>
                ✅ Extracted Data Ready
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <div>
                  <div style={{ opacity: 0.7 }}>Category</div>
                  <div style={{ fontWeight: 600 }}>{extractedData.category}</div>
                </div>
                <div>
                  <div style={{ opacity: 0.7 }}>Urgency</div>
                  <div style={{ fontWeight: 600, textTransform: 'uppercase', color: extractedData.extractedDetails?.urgency === 'critical' ? 'var(--priority-critical)' : 'var(--color-text)' }}>
                    {extractedData.extractedDetails?.urgency || 'medium'}
                  </div>
                </div>
              </div>
              <div style={{ opacity: 0.8, marginBottom: 'var(--space-2)' }}>
                📍 {extractedData.address || 'Address pending...'}
              </div>
              <button
                onClick={handleUseExtracted}
                style={{
                  width: '100%',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-dark)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
              >
                ✅ Use This Data
              </button>
            </div>
          )}

          {/* Input */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              padding: 'var(--space-3)',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-bg)'
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleSendMessage();
                }
              }}
              placeholder="Describe your issue..."
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'inherit',
                color: 'var(--color-text)',
                background: 'var(--color-surface-hover)'
              }}
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              style={{
                background: inputValue.trim() && !loading ? 'var(--color-primary)' : 'var(--color-border)',
                color: inputValue.trim() && !loading ? 'white' : 'var(--color-text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
                cursor: inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => {
                if (inputValue.trim() && !loading) {
                  e.currentTarget.style.background = 'var(--color-primary-dark)';
                }
              }}
              onMouseLeave={e => {
                if (inputValue.trim() && !loading) {
                  e.currentTarget.style.background = 'var(--color-primary)';
                }
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}

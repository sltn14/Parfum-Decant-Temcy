import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'

const SUGGESTIONS = [
  'Rekomendasikan parfum untuk pria suka wangi kayu',
  'Parfum cocok untuk acara formal?',
  'Saya suka wangi citrus, ada rekomendasi?',
  'Bedanya EDP dan EDT apa?',
  'Parfum terlaris di Decant Temcy?',
  'Parfum untuk cuaca panas Indonesia?'
]

export default function ChatbotPage() {
  const { isAuthenticated } = useAuthStore()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Halo! Saya Temcy AI — advisor parfum personal kamu.\n\nCeritakan selera wangi kamu, dan saya akan rekomendasikan parfum yang tepat!'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const message = text || input.trim()
    if (!message || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setLoading(true)

    try {
      const res = await api.post('/chatbot', { message, session_id: sessionId })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Maaf, saya sedang tidak tersedia. Silakan coba lagi nanti.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{
      paddingTop: 'var(--navbar-height)',
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary)'
    }}>

      {/* Header */}
      <div style={{
        background: 'rgba(6,6,10,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-default)',
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', gap: 16
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-red), #A2120E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Bot size={20} style={{ color: 'white' }} />
        </div>
        <div>
          <div style={{
            fontWeight: 900, fontSize: '0.85rem',
            letterSpacing: '0.08em', textTransform: 'uppercase'
          }}>TEMCY AI</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.7rem', color: '#22c55e', fontWeight: 700
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#22c55e',
              animation: 'pulse-glow 2s infinite'
            }} />
            ONLINE — AI PARFUM ADVISOR
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px 32px',
        display: 'flex', flexDirection: 'column', gap: 16,
        maxWidth: 800, width: '100%', margin: '0 auto', alignSelf: 'stretch'
      }}>
        <style>{`
          .chat-wrapper { max-width: 800px; width: 100%; margin: 0 auto; }
        `}</style>

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap: 12, alignItems: 'flex-start',
            animation: 'fadeInUp 0.3s ease'
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, var(--accent-red), #A2120E)'
                : 'var(--bg-elevated)',
              border: msg.role === 'assistant' ? '1px solid var(--border-default)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {msg.role === 'user'
                ? <User size={15} style={{ color: 'white' }} />
                : <Bot size={15} style={{ color: 'var(--accent-red)' }} />
              }
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '72%',
              padding: '14px 18px',
              background: msg.role === 'user'
                ? 'var(--accent-red)'
                : 'var(--bg-card)',
              border: msg.role === 'assistant' ? '1px solid var(--border-default)' : 'none',
              borderRadius: msg.role === 'user'
                ? 'var(--radius-md) var(--radius-xs) var(--radius-md) var(--radius-md)'
                : 'var(--radius-xs) var(--radius-md) var(--radius-md) var(--radius-md)',
              fontSize: '0.88rem', lineHeight: 1.75,
              color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
              fontWeight: 400,
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={15} style={{ color: 'var(--accent-red)' }} />
            </div>
            <div style={{
              padding: '14px 20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xs) var(--radius-md) var(--radius-md) var(--radius-md)',
              display: 'flex', gap: 5, alignItems: 'center'
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--accent-red)',
                  animation: `float ${0.6 + i * 0.15}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div style={{
          padding: '0 32px 16px',
          maxWidth: 800, width: '100%', margin: '0 auto'
        }}>
          <div style={{
            fontSize: '0.62rem', fontWeight: 800,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--text-muted)', marginBottom: 10
          }}>COBA TANYAKAN:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}
                style={{
                  padding: '7px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-muted)', fontSize: '0.78rem',
                  fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-red)'
                  e.currentTarget.style.color = 'var(--accent-red)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{
        borderTop: '1px solid var(--border-default)',
        padding: '16px 32px',
        background: 'rgba(6,6,10,0.9)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'flex', gap: 12, alignItems: 'flex-end'
        }}>
          <div style={{
            flex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex', alignItems: 'flex-end', gap: 8,
            transition: 'border-color 0.2s ease'
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(240,46,41,0.4)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya tentang parfum..."
              rows={1}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: '0.88rem',
                resize: 'none', fontFamily: 'var(--font-sans)',
                lineHeight: 1.6, maxHeight: 120, overflowY: 'auto',
                fontWeight: 400
              }}
            />
          </div>

          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            style={{
              width: 46, height: 46, borderRadius: 'var(--radius-sm)',
              background: !input.trim() || loading ? 'var(--border-hover)' : 'var(--accent-red)',
              border: 'none',
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: !input.trim() || loading ? 'none' : '0 4px 16px rgba(240,46,41,0.35)',
              transition: 'all 0.2s ease', flexShrink: 0
            }}
            onMouseEnter={e => {
              if (input.trim() && !loading) e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <Send size={16} style={{ color: 'white' }} />
          </button>
        </div>
        <p style={{
          textAlign: 'center', fontSize: '0.62rem',
          color: 'var(--text-muted)', marginTop: 10,
          fontWeight: 600, letterSpacing: '0.08em'
        }}>
          Enter untuk kirim · Shift+Enter baris baru
        </p>
      </div>
    </div>
  )
}
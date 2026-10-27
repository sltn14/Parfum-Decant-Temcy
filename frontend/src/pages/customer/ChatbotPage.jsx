import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, RotateCcw } from 'lucide-react'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  'Rekomendasikan parfum untuk pria suka wangi kayu',
  'Parfum cocok untuk acara formal?',
  'Saya suka wangi citrus, ada rekomendasi?',
  'Bedanya EDP dan EDT apa?',
  'Parfum terlaris di Decant Temcy?',
  'Parfum untuk cuaca panas Indonesia?'
]

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: 'Halo! Saya Mincy AI — konsultan parfum personal kamu.\n\nCeritakan selera wangi kamu, dan saya akan rekomendasikan parfum yang tepat!'
}

export default function ChatbotPage() {
  const { isAuthenticated } = useAuthStore()
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const sendMessage = async (text) => {
    const message = text || input.trim()
    if (!message || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setLoading(true)

    try {
      const res = await api.post('/chatbot', {
        message,
        session_id: sessionId
      })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.reply || 'Maaf, saya tidak bisa memproses permintaan kamu.'
      }])
    } catch (err) {
      const errMsg = err?.response?.data?.reply
        || 'Maaf, Mincy AI sedang tidak tersedia. Silakan coba lagi nanti.'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errMsg
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      await api.post('/chatbot/reset', { session_id: sessionId })
    } catch {}
    setMessages([INITIAL_MESSAGE])
    setShowResetConfirm(false)
    toast.success('Percakapan direset!')
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
      <style>{`
        @media (max-width: 768px) {
          .chat-header { padding: 10px 16px !important; }
          .chat-messages-area { padding: 0 16px !important; }
          .chat-suggestions { padding: 0 16px 12px !important; }
          .chat-input-area { padding: 10px 16px !important; }
          .chat-bubble { max-width: 90% !important; }
        }
      `}</style>

      {/* Header */}
      <div className="chat-header" style={{
        background: 'rgba(6,6,10,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-default)',
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', gap: 14
      }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-red), #A2120E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Bot size={19} style={{ color: 'white' }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 900, fontSize: '0.85rem',
            letterSpacing: '0.08em', textTransform: 'uppercase'
          }}>MINCY AI</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.68rem', color: '#22c55e', fontWeight: 700
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#22c55e',
              animation: 'pulse-glow-sm 2s infinite'
            }} />
            ONLINE — KONSULTAN PARFUM
          </div>
        </div>

        {/* Reset Button */}
        {messages.length > 1 && (
          <button
            onClick={() => setShowResetConfirm(true)}
            title="Reset percakapan"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-muted)', fontSize: '0.62rem',
              fontWeight: 800, letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.2s ease', flexShrink: 0
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-red)'
              e.currentTarget.style.color = 'var(--accent-red)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-default)'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}>
            <RotateCcw size={12} /> RESET
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '24px 0',
        display: 'flex', flexDirection: 'column'
      }}>
        <div className="chat-messages-area" style={{
          maxWidth: 800, width: '100%',
          margin: '0 auto', padding: '0 32px',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: 10, alignItems: 'flex-start',
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
                  ? <User size={14} style={{ color: 'white' }} />
                  : <Bot size={14} style={{ color: 'var(--accent-red)' }} />
                }
              </div>

              {/* Bubble */}
              <div className="chat-bubble" style={{
                maxWidth: '72%',
                padding: '12px 16px',
                background: msg.role === 'user'
                  ? 'var(--accent-red)'
                  : 'var(--bg-card)',
                border: msg.role === 'assistant' ? '1px solid var(--border-default)' : 'none',
                borderRadius: msg.role === 'user'
                  ? 'var(--radius-md) var(--radius-xs) var(--radius-md) var(--radius-md)'
                  : 'var(--radius-xs) var(--radius-md) var(--radius-md) var(--radius-md)',
                fontSize: '0.88rem', lineHeight: 1.75,
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                fontWeight: 400, whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              animation: 'fadeInUp 0.3s ease'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={14} style={{ color: 'var(--accent-red)' }} />
              </div>
              <div style={{
                padding: '14px 18px',
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
      </div>

      {/* Suggestions — hanya tampil di awal */}
      {messages.length === 1 && (
        <div className="chat-suggestions" style={{
          maxWidth: 800, width: '100%',
          margin: '0 auto', padding: '0 32px 16px'
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
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-muted)', fontSize: '0.78rem',
                  fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s ease', background: 'none',
                  fontFamily: 'var(--font-sans)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-red)'
                  e.currentTarget.style.color = 'var(--accent-red)'
                  e.currentTarget.style.background = 'rgba(240,46,41,0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                  e.currentTarget.style.background = 'none'
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area" style={{
        borderTop: '1px solid var(--border-default)',
        padding: '14px 32px',
        background: 'rgba(6,6,10,0.92)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'flex', gap: 10, alignItems: 'flex-end'
        }}>
          <div style={{
            flex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '11px 16px',
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

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: 44, height: 44, borderRadius: 'var(--radius-sm)',
              background: !input.trim() || loading ? 'var(--border-hover)' : 'var(--accent-red)',
              border: 'none', flexShrink: 0,
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: !input.trim() || loading ? 'none' : '0 4px 14px rgba(240,46,41,0.3)',
              transition: 'all 0.2s ease'
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
          color: 'var(--text-muted)', marginTop: 8,
          fontWeight: 600, letterSpacing: '0.06em',
          maxWidth: 800, margin: '8px auto 0'
        }}>
          Enter untuk kirim · Shift+Enter baris baru
        </p>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 32, maxWidth: 380, width: '100%',
            textAlign: 'center', animation: 'scaleIn 0.2s ease'
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(240,46,41,0.1)',
              border: '1px solid rgba(240,46,41,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <RotateCcw size={20} style={{ color: 'var(--accent-red)' }} />
            </div>
            <h3 style={{
              fontWeight: 900, fontSize: '0.95rem',
              textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 10
            }}>RESET PERCAKAPAN?</h3>
            <p style={{
              color: 'var(--text-muted)', fontSize: '0.82rem',
              lineHeight: 1.7, marginBottom: 24, fontWeight: 400
            }}>
              Seluruh riwayat percakapan akan dihapus dan Mincy AI akan memulai dari awal.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  flex: 1, padding: '11px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)', fontWeight: 800,
                  fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: 'pointer'
                }}>BATAL</button>
              <button
                onClick={handleReset}
                style={{
                  flex: 1, padding: '11px',
                  background: 'var(--accent-red)', color: 'white',
                  borderRadius: 'var(--radius-sm)', fontWeight: 800,
                  fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(240,46,41,0.3)'
                }}>RESET</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
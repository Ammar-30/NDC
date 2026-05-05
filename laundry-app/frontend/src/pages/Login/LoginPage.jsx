import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  background: 'rgba(255,255,255,0.70)',
  border: '1.5px solid rgba(200,215,235,0.80)',
  borderRadius: 12,
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  color: 'var(--text)',
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
  boxSizing: 'border-box',
}

function InputField({ label, type = 'text', value, onChange, placeholder, rightElement }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.01em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={type === 'password' ? 'current-password' : 'email'}
          style={{ ...inputStyle, paddingRight: rightElement ? 42 : 14 }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--accent)'
            e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.12)'
            e.target.style.background = 'rgba(255,255,255,0.90)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(200,215,235,0.80)'
            e.target.style.boxShadow = 'none'
            e.target.style.background = 'rgba(255,255,255,0.70)'
          }}
        />
        {rightElement && (
          <div style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          }}>
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const { login }                   = useContext(AuthContext)
  const navigate                    = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      toast.success('Welcome back!')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
    }}>
      {/* Login card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 360,
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderRadius: 24,
        padding: '36px 32px 32px',
        border: '1px solid rgba(255,255,255,0.80)',
        boxShadow: '0 24px 64px rgba(10,15,30,0.10), 0 4px 16px rgba(10,15,30,0.06), 0 1px 0 rgba(255,255,255,0.9) inset',
      }}
        className="scale-in"
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60,
            background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(22,163,74,0.36), 0 2px 8px rgba(22,163,74,0.24)',
          }}>
            <span style={{ color: 'white', fontSize: 18, fontWeight: 800, letterSpacing: '0.5px' }}>NDC</span>
          </div>
          <h1 style={{
            margin: '0 0 4px', fontSize: 24, fontWeight: 800,
            color: 'var(--text)', letterSpacing: '-0.6px',
          }}>
            Welcome back
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>
            National Dry Cleaners
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <InputField
            label="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="staff@ndc.com"
          />

          <InputField
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, color: 'var(--text3)',
                  display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text2)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.22)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13, color: '#b91c1c', fontWeight: 500,
            }}
              className="fade-in"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 0',
              background: loading
                ? 'rgba(22,163,74,0.65)'
                : 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(22,163,74,0.32)',
              letterSpacing: '0.01em',
              marginTop: 4,
            }}
            onMouseEnter={e => {
              if (!loading) e.currentTarget.style.boxShadow = '0 8px 28px rgba(22,163,74,0.42)'
            }}
            onMouseLeave={e => {
              if (!loading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,163,74,0.32)'
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

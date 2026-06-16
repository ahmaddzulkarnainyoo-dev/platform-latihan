'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Cek session, jika sudah login redirect ke admin
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.push('/admin')
      }
    }
    checkSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/admin')
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background circles */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '500px',
          height: '500px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '48px 40px 40px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.2), 0 10px 20px rgba(0,0,0,0.05)',
          border: '1px solid rgba(255,255,255,0.2)',
          animation: 'fadeInUp 0.6s ease-out',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo / Icon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              boxShadow: '0 12px 30px rgba(102, 126, 234, 0.35)',
            }}
          >
            📚
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#1e293b',
            textAlign: 'center',
            margin: '0 0 4px',
            letterSpacing: '-0.5px',
          }}
        >
          Platform Latihan
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#64748b',
            textAlign: 'center',
            margin: '0 0 28px',
          }}
        >
          Masuk ke dashboard admin
        </p>

        {/* Welcome message */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f0f4ff 0%, #faf0ff 100%)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '28px',
            border: '1px solid #e8edff',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#4a3f7a',
              margin: 0,
            }}
          >
            👋 Selamat datang kembali! Silakan masuk untuk mengelola platform.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#991b1b',
              fontSize: '13px',
            }}
          >
            <span style={{ fontSize: '18px' }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '6px',
              }}
            >
              Email
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'white',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                transition: 'all 0.3s',
                padding: '0 14px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea'
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.12)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: '18px', color: '#94a3b8', marginRight: '10px' }}>✉️</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                required
                style={{
                  width: '100%',
                  padding: '14px 0',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#1e293b',
                  background: 'transparent',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'white',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                transition: 'all 0.3s',
                padding: '0 14px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea'
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.12)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: '18px', color: '#94a3b8', marginRight: '10px' }}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '14px 0',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#1e293b',
                  background: 'transparent',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#94a3b8',
                  padding: '8px 0',
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <a
                href="#"
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#667eea')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              >
                Lupa password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading
                ? '#94a3b8'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)',
              transition: 'all 0.3s',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.45)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.35)'
              }
            }}
          >
            {loading ? 'Memproses...' : '🚀 Masuk'}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            fontSize: '12px',
            color: '#94a3b8',
            textAlign: 'center',
            marginTop: '24px',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '20px',
          }}
        >
          Platform Latihan Soal © 2026
        </p>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
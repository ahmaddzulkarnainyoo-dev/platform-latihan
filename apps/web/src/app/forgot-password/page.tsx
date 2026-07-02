'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: 'Jika email terdaftar, tautan reset password akan dikirim ke email Anda.',
      })
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
      {/* Decorative */}
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
          maxWidth: '460px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '48px 40px 40px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.2)',
          animation: 'fadeInUp 0.6s ease-out',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
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
            🔑
          </div>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', textAlign: 'center', margin: '0 0 4px' }}>
          Lupa Password
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', margin: '0 0 28px' }}>
          Masukkan email Anda untuk menerima tautan reset password
        </p>

        {message && (
          <div
            style={{
              background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: message.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fca5a5',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: message.type === 'success' ? '#166534' : '#991b1b',
              fontSize: '13px',
            }}
          >
            <span style={{ fontSize: '18px' }}>{message.type === 'success' ? '✅' : '⚠️'}</span>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
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
                placeholder="email@example.com"
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)',
              transition: 'all 0.3s',
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
            {loading ? 'Mengirim...' : '📧 Kirim Link Reset'}
          </button>
        </form>

        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <Link href="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>← Kembali ke Login</Link>
        </p>
      </div>

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
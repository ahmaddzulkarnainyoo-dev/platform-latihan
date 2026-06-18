'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        // Cek role dari profiles (opsional)
        // Untuk sementara, redirect ke dashboard dulu
        router.push('/dashboard')
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
      // Redirect berdasarkan role
      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
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
            📚
          </div>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', textAlign: 'center', margin: '0 0 4px' }}>
          Selamat Datang
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', margin: '0 0 28px' }}>
          Masuk untuk mulai belajar
        </p>

        {/* Role Toggle */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '28px',
            border: '1px solid #e2e8f0',
          }}
        >
          <button
            onClick={() => setRole('user')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: role === 'user' ? 'white' : 'transparent',
              color: role === 'user' ? '#1e293b' : '#64748b',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: role === 'user' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.3s',
            }}
          >
            🧑‍🎓 Peserta
          </button>
          <button
            onClick={() => setRole('admin')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: role === 'admin' ? 'white' : 'transparent',
              color: role === 'admin' ? '#1e293b' : '#64748b',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: role === 'admin' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.3s',
            }}
          >
            👤 Admin
          </button>
        </div>

        {/* Welcome Message sesuai role */}
        <div
          style={{
            background: role === 'admin' ? '#f0f4ff' : '#f0fdf4',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '28px',
            border: role === 'admin' ? '1px solid #dbeafe' : '1px solid #bbf7d0',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '14px', fontWeight: 500, color: role === 'admin' ? '#1e40af' : '#166534', margin: 0 }}>
            {role === 'admin'
              ? '🔐 Masuk sebagai admin untuk mengelola platform.'
              : '📝 Masuk sebagai peserta untuk mulai latihan soal.'}
          </p>
        </div>

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

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '18px' }}>
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
                placeholder={role === 'admin' ? 'admin@email.com' : 'email@example.com'}
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
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
            {loading ? 'Memproses...' : `🚀 Masuk sebagai ${role === 'admin' ? 'Admin' : 'Peserta'}`}
          </button>
        </form>

        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          Belum punya akun? <Link href="/register" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>Daftar</Link>
        </p>
        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '8px' }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Kembali ke Beranda</Link>
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
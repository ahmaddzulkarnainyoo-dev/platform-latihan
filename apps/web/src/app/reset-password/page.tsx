'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)

  useEffect(() => {
    // Cek apakah ada access_token di URL hash fragment
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      setHasToken(true)
    } else {
      // Jika tidak ada token, redirect ke login
      router.push('/login')
    }
    setCheckingToken(false)
  }, [router])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect ke login setelah 2 detik
    setTimeout(() => {
      router.push('/login?reset=success')
    }, 2000)
  }

  if (checkingToken) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        }}
      >
        <p style={{ color: 'white', fontSize: '18px' }}>Memeriksa tautan...</p>
      </div>
    )
  }

  if (!hasToken) {
    return null
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
            🔒
          </div>
        </div>

        {success ? (
          <>
            <div
              style={{
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
                Password Berhasil Diubah!
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0' }}>
                Kamu akan diarahkan ke halaman login...
              </p>
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', textAlign: 'center', margin: '0 0 4px' }}>
              Reset Password
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', margin: '0 0 28px' }}>
              Masukkan password baru Anda
            </p>

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

            <form onSubmit={handleReset}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Password Baru
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
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
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

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Konfirmasi Password Baru
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
                  <span style={{ fontSize: '18px', color: '#94a3b8', marginRight: '10px' }}>🔐</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password"
                    required
                    minLength={6}
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px',
                      color: '#94a3b8',
                      padding: '8px 0',
                    }}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
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
                {loading ? 'Menyimpan...' : '🔄 Reset Password'}
              </button>
            </form>
          </>
        )}

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
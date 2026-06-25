'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [exams, setExams] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      // Cek session
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/login')
        return
      }

      setUser(sessionData.session.user)

      // Load ujian aktif
      const { data: examsData } = await supabase
        .from('exams')
        .select('*, categories(name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (examsData) setExams(examsData)

      // Load riwayat user
      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select('*, exams(title)')
        .eq('user_id', sessionData.session.user.id)
        .order('started_at', { ascending: false })
        .limit(5)

      if (attemptsData) setAttempts(attemptsData)

      setLoading(false)
    }

    loadData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p style={{ color: '#64748b' }}>Memuat...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navbar Premium */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 32px',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📚</span>
          <span style={{ fontWeight: 700, fontSize: '18px', color: '#1e293b', letterSpacing: '-0.5px' }}>Platform Latihan</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/dashboard"
            style={{
              padding: '8px 16px',
              background: '#eff6ff',
              color: '#2563eb',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            📊 Dashboard
          </Link>
          <Link
            href="/profile"
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: '#475569',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            👤 Profil
          </Link>
          <Link
            href="/leaderboard"
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: '#475569',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            🏆 Leaderboard
          </Link>
          <span style={{ fontSize: '13px', color: '#64748b', padding: '0 8px' }}>
            👋 {user?.email?.split('@')[0] || 'User'}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 18px',
              background: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fecaca')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fee2e2')}
          >
            Keluar
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '32px 40px',
            color: 'white',
            marginBottom: '32px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
          }}
        >
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Selamat Datang, {user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p style={{ opacity: 0.9, margin: 0, fontSize: '16px' }}>
            Siap berlatih hari ini? Pilih ujian di bawah ini.
          </p>
        </div>

        {/* Ujian Tersedia */}
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '16px', letterSpacing: '-0.5px' }}>
          📝 Ujian Tersedia
        </h2>

        {exams.length === 0 ? (
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '48px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              marginBottom: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            }}
          >
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>📭</p>
            <p style={{ color: '#64748b', fontSize: '15px' }}>Belum ada ujian yang tersedia.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '40px',
            }}
          >
            {exams.map((exam) => (
              <Link
                key={exam.id}
                href={`/tryout/${exam.id}`}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  textDecoration: 'none',
                  transition: 'all 0.3s',
                  display: 'block',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)'
                  e.currentTarget.style.borderColor = '#667eea'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#667eea', background: '#eff6ff', padding: '2px 12px', borderRadius: '20px' }}>
                    {exam.categories?.name || 'Umum'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>⏱️ {exam.duration_minutes} menit</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', margin: '12px 0 8px' }}>
                  {exam.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {exam.description || 'Latihan soal untuk persiapan ujian.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>{exam.total_questions || 0} soal</span>
                  <span
                    style={{
                      padding: '6px 16px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      transition: 'all 0.3s',
                    }}
                  >
                    Mulai →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Riwayat */}
        {attempts.length > 0 && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '16px', letterSpacing: '-0.5px' }}>
              📊 Riwayat Latihan
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'
                    e.currentTarget.style.borderColor = '#667eea'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{attempt.exams?.title || 'Ujian'}</span>
                    <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '12px' }}>
                      {new Date(attempt.started_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        padding: '4px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        background: attempt.score >= 70 ? '#dcfce7' : '#fee2e2',
                        color: attempt.score >= 70 ? '#15803d' : '#dc2626',
                      }}
                    >
                      {attempt.score || 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

interface Stats {
  totalExams: number
  totalQuestions: number
  totalCategories: number
  totalUsers: number
  totalAttempts: number
  averageScore: number
  totalCorrect: number
  totalWrong: number
}

export default function AdminDashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalExams: 0,
    totalQuestions: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalAttempts: 0,
    averageScore: 0,
    totalCorrect: 0,
    totalWrong: 0,
  })
  const [recentAttempts, setRecentAttempts] = useState<any[]>([])
  const [userName, setUserName] = useState('Admin')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)

    try {
      // Ambil session untuk nama user
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session?.user?.email) {
        setUserName(sessionData.session.user.email.split('@')[0])
      }

      // 1. Total Ujian
      const { count: totalExams, error: e1 } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })

      // 2. Total Soal
      const { count: totalQuestions, error: e2 } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })

      // 3. Total Kategori
      const { count: totalCategories, error: e3 } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })

      // 4. Total User (dari auth.users)
      const { count: totalUsers, error: e4 } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // 5. Total Tryout (exam_attempts)
      const { count: totalAttempts, error: e5 } = await supabase
        .from('exam_attempts')
        .select('*', { count: 'exact', head: true })

      // 6. Rata-rata skor & total benar/salah
      const { data: attemptsData, error: e6 } = await supabase
        .from('exam_attempts')
        .select('score, correct_count, total_answered')
        .eq('status', 'completed')

      let averageScore = 0
      let totalCorrect = 0
      let totalWrong = 0

      if (attemptsData && attemptsData.length > 0) {
        const totalScore = attemptsData.reduce((sum, a) => sum + (a.score || 0), 0)
        averageScore = Math.round(totalScore / attemptsData.length)
        totalCorrect = attemptsData.reduce((sum, a) => sum + (a.correct_count || 0), 0)
        totalWrong = attemptsData.reduce((sum, a) => sum + ((a.total_answered || 0) - (a.correct_count || 0)), 0)
      }

      // 7. Recent attempts (5 terakhir)
      const { data: recent, error: e7 } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          exams ( title ),
          profiles ( full_name )
        `)
        .eq('status', 'completed')
        .order('finished_at', { ascending: false })
        .limit(5)

      if (recent) setRecentAttempts(recent)

      setStats({
        totalExams: totalExams || 0,
        totalQuestions: totalQuestions || 0,
        totalCategories: totalCategories || 0,
        totalUsers: totalUsers || 0,
        totalAttempts: totalAttempts || 0,
        averageScore,
        totalCorrect,
        totalWrong,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }

    setLoading(false)
  }

  const cardData = [
    { label: 'Total Ujian', value: stats.totalExams, icon: '📝', color: '#667eea', bg: '#eff6ff' },
    { label: 'Total Soal', value: stats.totalQuestions, icon: '❓', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Total Kategori', value: stats.totalCategories, icon: '📚', color: '#10b981', bg: '#ecfdf5' },
    { label: 'Total User', value: stats.totalUsers, icon: '👥', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Total Tryout', value: stats.totalAttempts, icon: '📊', color: '#ef4444', bg: '#fef2f2' },
    { label: 'Rata-rata Skor', value: `${stats.averageScore}%`, icon: '⭐', color: '#f472b6', bg: '#fdf2f8' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <AdminSidebar activePath="/admin" />

      <div style={{ flex: 1, padding: '32px' }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '28px',
            color: 'white',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
          }}
        >
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
            👋 Selamat Datang, {userName}!
          </h1>
          <p style={{ opacity: 0.9, margin: 0, fontSize: '15px' }}>
            Ini adalah dashboard administrasi Platform Latihan.
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <p style={{ color: '#64748b' }}>Memuat data...</p>
          </div>
        ) : (
          <>
            {/* Card Statistik */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
              }}
            >
              {cardData.map((card, i) => (
                <div
                  key={i}
                  style={{
                    background: 'white',
                    borderRadius: '14px',
                    padding: '20px 18px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: card.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                      }}
                    >
                      {card.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{card.label}</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>{card.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Statistik Tambahan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 12px' }}>
                  📈 Detail Jawaban
                </h3>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Benar</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>{stats.totalCorrect}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Salah</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{stats.totalWrong}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Akurasi</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#667eea' }}>
                      {stats.totalCorrect + stats.totalWrong > 0
                        ? Math.round((stats.totalCorrect / (stats.totalCorrect + stats.totalWrong)) * 100)
                        : 0}%
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 12px' }}>
                  🏆 Ujian Terpopuler
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  {stats.totalAttempts > 0
                    ? `Sudah ada ${stats.totalAttempts} kali tryout yang diselesaikan.`
                    : 'Belum ada tryout yang dikerjakan.'}
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            {recentAttempts.length > 0 && (
              <div
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 16px' }}>
                  🕐 Aktivitas Terbaru
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 500, color: '#1e293b' }}>
                          {attempt.profiles?.full_name || attempt.exams?.title || 'User'}
                        </span>
                        <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '8px' }}>
                          menyelesaikan "{attempt.exams?.title || 'Ujian'}"
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            padding: '2px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: attempt.score >= 70 ? '#dcfce7' : '#fee2e2',
                            color: attempt.score >= 70 ? '#15803d' : '#dc2626',
                          }}
                        >
                          {attempt.score || 0}%
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {new Date(attempt.finished_at || '').toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
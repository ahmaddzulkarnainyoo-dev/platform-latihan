'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    totalCorrect: 0,
    totalWrong: 0,
    bestScore: 0,
  })
  const [recentAttempts, setRecentAttempts] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Cek session
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      router.push('/login')
      return
    }

    const userId = sessionData.session.user.id
    setUser(sessionData.session.user)

    // Ambil profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileData) {
      setProfile(profileData)
      setFullName(profileData.full_name || '')
    }

    // Ambil statistik tryout user
    const { data: attemptsData } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')

    if (attemptsData && attemptsData.length > 0) {
      const total = attemptsData.length
      const avgScore = Math.round(attemptsData.reduce((sum, a) => sum + (a.score || 0), 0) / total)
      const correct = attemptsData.reduce((sum, a) => sum + (a.correct_count || 0), 0)
      const wrong = attemptsData.reduce((sum, a) => sum + ((a.total_answered || 0) - (a.correct_count || 0)), 0)
      const best = Math.max(...attemptsData.map(a => a.score || 0))

      setStats({
        totalAttempts: total,
        averageScore: avgScore,
        totalCorrect: correct,
        totalWrong: wrong,
        bestScore: best,
      })

      // 5 terakhir
      const sorted = attemptsData.sort((a, b) => 
        new Date(b.finished_at || '').getTime() - new Date(a.finished_at || '').getTime()
      )
      setRecentAttempts(sorted.slice(0, 5))
    }

    setLoading(false)
  }

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      setMessage('Nama tidak boleh kosong.')
      return
    }

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user?.id)

    if (error) {
      setMessage('❌ Gagal update: ' + error.message)
    } else {
      setMessage('✅ Profil berhasil diperbarui!')
      setProfile({ ...profile, full_name: fullName.trim() })
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p style={{ color: '#64748b' }}>Memuat profil...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/dashboard" style={{ fontSize: '24px', textDecoration: 'none' }}>📚</Link>
          <Link href="/dashboard" style={{ fontWeight: 700, fontSize: '18px', color: '#1e293b', textDecoration: 'none' }}>
            Platform Latihan
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            Dashboard
          </Link>
          <Link href="/leaderboard" style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            Leaderboard
          </Link>
          <Link href="/profile" style={{ fontSize: '14px', color: '#667eea', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, background: '#eff6ff' }}>
            Profil
          </Link>
          <button onClick={handleLogout} style={{ padding: '8px 18px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fecaca' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2' }}
          >
            Keluar
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '28px 32px', color: 'white', marginBottom: '28px', boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
            👤 Profil Saya
          </h1>
          <p style={{ opacity: 0.9, margin: 0, fontSize: '15px' }}>
            Kelola data diri dan lihat statistik belajarmu
          </p>
        </div>

        {/* Grid Profil */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Kiri: Profil */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: 'white', marginBottom: '16px' }}>
                {fullName ? fullName.charAt(0).toUpperCase() : '👤'}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                {fullName || 'Pengguna'}
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px' }}>
                {user?.email || 'email@example.com'}
              </p>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 12px' }}>
                ✏️ Edit Profil
              </h3>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                  Nama Lengkap
                </label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '14px', color: '#1e293b', transition: 'all 0.2s' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
              <button onClick={handleUpdateProfile} disabled={saving} style={{ width: '100%', padding: '10px', background: saving ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
                {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
              </button>
              {message && <p style={{ marginTop: '10px', fontSize: '14px', color: message.includes('✅') ? '#15803d' : '#dc2626' }}>{message}</p>}
            </div>
          </div>

          {/* Kanan: Statistik */}
          <div>
            {/* Statistik Card */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 16px' }}>
                📊 Statistik Belajar
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ textAlign: 'center', padding: '12px', background: '#f0f4ff', borderRadius: '10px' }}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#667eea' }}>{stats.totalAttempts}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Tryout</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: '#f0fdf4', borderRadius: '10px' }}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#22c55e' }}>{stats.averageScore}%</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Rata-rata</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: '#fef3c7', borderRadius: '10px' }}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#f59e0b' }}>{stats.bestScore}%</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Terbaik</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#dcfce7', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#15803d' }}>✅ {stats.totalCorrect}</span>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#fee2e2', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#dc2626' }}>❌ {stats.totalWrong}</span>
                </div>
              </div>
            </div>

            {/* Riwayat */}
            {recentAttempts.length > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 16px' }}>
                  📜 Riwayat Tryout
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentAttempts.map((attempt) => (
                    <div key={attempt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '14px' }}>{attempt.exams?.title || 'Ujian'}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(attempt.finished_at || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <span style={{ padding: '2px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: 700, background: attempt.score >= 70 ? '#dcfce7' : '#fee2e2', color: attempt.score >= 70 ? '#15803d' : '#dc2626' }}>
                        {attempt.score || 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
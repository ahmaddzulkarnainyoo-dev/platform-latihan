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
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    totalCorrect: 0,
    totalWrong: 0,
    highestScore: 0,
  })
  const [recentAttempts, setRecentAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      router.push('/login')
      return
    }

    setUser(sessionData.session.user)
    setEmail(sessionData.session.user.email || '')

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      setName(profileData.full_name || '')
      setAvatarPreview(profileData.avatar_url || '')
    }

    // Load stats
    const { data: attemptsData } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('user_id', sessionData.session.user.id)
      .eq('status', 'completed')

    if (attemptsData && attemptsData.length > 0) {
      const totalScore = attemptsData.reduce((sum, a) => sum + (a.score || 0), 0)
      const totalCorrect = attemptsData.reduce((sum, a) => sum + (a.correct_count || 0), 0)
      const totalAnswered = attemptsData.reduce((sum, a) => sum + (a.total_answered || 0), 0)
      const highestScore = Math.max(...attemptsData.map(a => a.score || 0))

      setStats({
        totalAttempts: attemptsData.length,
        averageScore: Math.round(totalScore / attemptsData.length),
        totalCorrect,
        totalWrong: totalAnswered - totalCorrect,
        highestScore,
      })
    }

    // Load recent attempts
    const { data: recent } = await supabase
      .from('exam_attempts')
      .select('*, exams(title)')
      .eq('user_id', sessionData.session.user.id)
      .eq('status', 'completed')
      .order('finished_at', { ascending: false })
      .limit(10)

    if (recent) setRecentAttempts(recent)

    setLoading(false)
  }

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setErrorMsg('Nama tidak boleh kosong')
      return
    }

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      let avatarUrl = profile?.avatar_url || ''

      if (avatarFile) {
        const path = `avatars/${user.id}-${Date.now()}-${avatarFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(path)

        avatarUrl = urlData.publicUrl
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: name.trim(),
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setSuccessMsg('Profil berhasil diperbarui! ✅')
      setAvatarPreview(avatarUrl)
      setAvatarFile(null)
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan: ' + err.message)
    }

    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
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
          <Link href="/dashboard" style={{ padding: '8px 16px', background: 'transparent', color: '#475569', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
            📊 Dashboard
          </Link>
          <Link href="/profile" style={{ padding: '8px 16px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            👤 Profil
          </Link>
          <Link href="/leaderboard" style={{ padding: '8px 16px', background: 'transparent', color: '#475569', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
            🏆 Leaderboard
          </Link>
          <span style={{ fontSize: '13px', color: '#64748b', padding: '0 8px' }}>👋 {name || user?.email?.split('@')[0] || 'User'}</span>
          <button onClick={handleLogout} style={{ padding: '8px 18px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fecaca')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fee2e2')}>
            Keluar
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Gradient Header */}
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
            Halo, {name || user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p style={{ opacity: 0.9, margin: 0, fontSize: '16px' }}>
            Kelola profil dan lihat statistik belajarmu di sini
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', color: '#166534', fontWeight: 500, boxShadow: '0 4px 12px rgba(34,197,94,0.15)' }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', color: '#991b1b', fontWeight: 500, boxShadow: '0 4px 12px rgba(239,68,68,0.15)' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Two Columns Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Left Column - Profile Info */}
          <div>
            {/* Avatar & Name */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px 24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', textAlign: 'center', marginBottom: '24px' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: avatarPreview ? `url(${avatarPreview}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    color: 'white',
                    fontWeight: 700,
                    margin: '0 auto',
                    border: '4px solid #e2e8f0',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  {!avatarPreview && (name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U')}
                </div>
                <label
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    border: '2px solid white',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  📷
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                {name || 'Pengguna'}
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0' }}>{email}</p>
            </div>

            {/* Edit Profile Form */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>✏️ Edit Profil</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama kamu"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px',
                    color: '#1e293b',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea'
                    e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    fontSize: '14px',
                    color: '#94a3b8',
                    background: '#f8fafc',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.45)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)'
                  }
                }}
              >
                {saving ? 'Menyimpan...' : '💾 Simpan Profil'}
              </button>
            </div>
          </div>

          {/* Right Column - Stats & History */}
          <div>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', transition: 'all 0.3s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#667eea' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Total Tryout</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#667eea' }}>{stats.totalAttempts}</div>
              </div>
              <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', transition: 'all 0.3s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#667eea' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Rata-rata Skor</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>{stats.averageScore}%</div>
              </div>
              <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', transition: 'all 0.3s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#667eea' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Skor Tertinggi</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#22c55e' }}>{stats.highestScore}%</div>
              </div>
            </div>

            {/* Detail Answer Stats */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '0 0 12px' }}>📈 Detail Jawaban</h3>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Benar</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>{stats.totalCorrect}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Salah</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>{stats.totalWrong}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Akurasi</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>
                    {stats.totalCorrect + stats.totalWrong > 0
                      ? Math.round((stats.totalCorrect / (stats.totalCorrect + stats.totalWrong)) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Riwayat Tryout */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>📋 Riwayat Tryout</h3>
              {recentAttempts.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                  Belum ada tryout yang dikerjakan.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>
                          {attempt.exams?.title || 'Ujian'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          {new Date(attempt.finished_at || attempt.started_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
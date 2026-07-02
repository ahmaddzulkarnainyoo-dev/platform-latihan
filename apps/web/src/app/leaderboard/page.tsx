'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LeaderboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<any[]>([])
  const [selectedExam, setSelectedExam] = useState('')
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkSession()
    loadExams()
  }, [])

  useEffect(() => {
    loadLeaderboard()
  }, [selectedExam])

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      router.push('/login')
      return
    }
    setUser(data.session.user)
  }

  const loadExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('id, title')
      .eq('is_published', true)
      .order('title')
    if (data) setExams(data)
  }

  const loadLeaderboard = async () => {
    setLoading(true)

    let query = supabase
      .from('exam_attempts')
      .select(`
        user_id,
        score,
        exam_id,
        exams ( title ),
        profiles ( full_name )
      `)
      .eq('status', 'completed')
      .order('score', { ascending: false })

    if (selectedExam) {
      query = query.eq('exam_id', selectedExam)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading leaderboard:', error)
      setLeaderboard([])
      setLoading(false)
      return
    }

    // Group by user_id to get best score per user
    const userMap = new Map()
    data?.forEach((item: any) => {
      const key = item.user_id
      if (!userMap.has(key) || item.score > userMap.get(key).score) {
        userMap.set(key, {
          user_id: item.user_id,
          full_name: item.profiles?.full_name || 'Pengguna',
          score: item.score,
          exam_title: item.exams?.title || 'Ujian',
          exam_id: item.exam_id,
        })
      }
    })

    const result = Array.from(userMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)

    setLeaderboard(result)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
          <Link href="/profile" style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            Profil
          </Link>
          <Link href="/leaderboard" style={{ fontSize: '14px', color: '#667eea', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, background: '#eff6ff' }}>
            Leaderboard
          </Link>
          <button onClick={handleLogout} style={{ padding: '8px 18px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fecaca' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2' }}
          >
            Keluar
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '28px 32px', color: 'white', marginBottom: '28px', boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
            🏆 Leaderboard
          </h1>
          <p style={{ opacity: 0.9, margin: 0, fontSize: '15px' }}>
            Peringkat peserta dengan skor tertinggi
          </p>
        </div>

        {/* Filter */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>Filter Ujian:</label>
          <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} style={{ padding: '8px 16px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '14px', flex: 1, minWidth: '200px', color: '#1e293b', transition: 'all 0.2s' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <option value="">Semua Ujian</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>{exam.title}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b' }}>Memuat leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>📭</p>
            <p style={{ color: '#64748b', fontSize: '15px' }}>Belum ada data leaderboard.</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Peringkat</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nama</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ujian</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skor</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, index) => {
                  const rank = index + 1
                  const isCurrentUser = user?.id === item.user_id

                  let medal = ''
                  let bgColor = 'transparent'
                  if (rank === 1) { medal = '🥇'; bgColor = '#fef3c7' }
                  else if (rank === 2) { medal = '🥈'; bgColor = '#f1f5f9' }
                  else if (rank === 3) { medal = '🥉'; bgColor = '#fefce8' }

                  return (
                    <tr key={item.user_id} style={{ borderBottom: '1px solid #f1f5f9', background: isCurrentUser ? '#eff6ff' : bgColor, transition: 'background 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = isCurrentUser ? '#dbeafe' : '#f8fafc' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isCurrentUser ? '#eff6ff' : bgColor }}
                    >
                      <td style={{ padding: '14px 20px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                        {medal || `#${rank}`}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: isCurrentUser ? 600 : 400, color: '#1e293b' }}>
                        {item.full_name}
                        {isCurrentUser && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#667eea', fontWeight: 600 }}>(Anda)</span>}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#64748b' }}>
                        {item.exam_title}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '18px', fontWeight: 700, color: rank === 1 ? '#f59e0b' : '#1e293b' }}>
                        {item.score}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LeaderboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [exams, setExams] = useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [leaderboardData, setLeaderboardData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 20

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/login')
        return
      }
      setUser(sessionData.session.user)

      // Load exams for filter
      const { data: examsData } = await supabase
        .from('exams')
        .select('id, title')
        .order('title')

      if (examsData) setExams(examsData)

      // Load initial leaderboard
      await loadLeaderboard('', 0, true)
    }

    init()
  }, [])

  const loadLeaderboard = async (examId: string, pageNum: number, reset = false) => {
    setLoading(true)

    try {
      let query = supabase
        .from('exam_attempts')
        .select(`
          user_id,
          score,
          correct_count,
          total_answered,
          finished_at,
          profiles!inner(full_name, avatar_url),
          exams!inner(title)
        `)
        .eq('status', 'completed')
        .not('score', 'is', null)
        .order('score', { ascending: false })
        .order('finished_at', { ascending: true })
        .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1)

      if (examId) {
        query = query.eq('exam_id', examId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading leaderboard:', error)
        return
      }

      if (data) {
        // Deduplicate by user_id - take highest score per user
        const userMap = new Map<string, any>()
        for (const item of data) {
          const uid = item.user_id
          if (!userMap.has(uid) || (userMap.get(uid).score < item.score)) {
            userMap.set(uid, item)
          }
        }

        const deduped = Array.from(userMap.values())

        if (reset) {
          setLeaderboardData(deduped)
        } else {
          setLeaderboardData(prev => [...prev, ...deduped])
        }

        setHasMore(data.length === pageSize)
      }
    } catch (err) {
      console.error('Error:', err)
    }

    setLoading(false)
  }

  const handleFilter = () => {
    setPage(0)
    setHasMore(true)
    loadLeaderboard(selectedExamId, 0, true)
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadLeaderboard(selectedExamId, nextPage)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { background: '#fef3c7', color: '#92400e' }
    if (rank === 2) return { background: '#f1f5f9', color: '#475569' }
    if (rank === 3) return { background: '#fef2f2', color: '#991b1b' }
    return { background: 'transparent', color: '#64748b' }
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
          <Link href="/profile" style={{ padding: '8px 16px', background: 'transparent', color: '#475569', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
            👤 Profil
          </Link>
          <Link href="/leaderboard" style={{ padding: '8px 16px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            🏆 Leaderboard
          </Link>
          <span style={{ fontSize: '13px', color: '#64748b', padding: '0 8px' }}>👋 {user?.email?.split('@')[0] || 'User'}</span>
          <button onClick={handleLogout} style={{ padding: '8px 18px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fecaca')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fee2e2')}>
            Keluar
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
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
            🏆 Leaderboard
          </h1>
          <p style={{ opacity: 0.9, margin: 0, fontSize: '16px' }}>
            Peringkat peserta berdasarkan skor tryout
          </p>
        </div>

        {/* Filter */}
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px 24px',
            border: '1px solid #e2e8f0',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <label style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Filter Ujian:</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '2px solid #e2e8f0',
              fontSize: '14px',
              color: '#1e293b',
              background: 'white',
              flex: 1,
              minWidth: '200px',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea'
              e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0'
              e.target.style.boxShadow = 'none'
            }}
          >
            <option value="">Semua Ujian (Global)</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>{exam.title}</option>
            ))}
          </select>
          <button
            onClick={handleFilter}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.45)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            Terapkan
          </button>
        </div>

        {/* Loading */}
        {loading && leaderboardData.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <p style={{ color: '#64748b' }}>Memuat peringkat...</p>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>🏆</p>
            <p style={{ color: '#64748b', fontSize: '15px' }}>Belum ada data leaderboard untuk filter ini.</p>
          </div>
        ) : (
          <>
            {/* Podium Top 3 */}
            {leaderboardData.length >= 3 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px', alignItems: 'flex-end' }}>
                {/* Rank 2 */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  flex: 1,
                  maxWidth: '200px',
                  transition: 'all 0.3s',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥈</div>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: 'white', border: '3px solid #e2e8f0' }}>
                    {leaderboardData[1]?.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>{leaderboardData[1]?.profiles?.full_name || 'User'}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#667eea', marginTop: '4px' }}>{leaderboardData[1]?.score || 0}%</div>
                </div>

                {/* Rank 1 */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px 24px',
                  textAlign: 'center',
                  border: '2px solid #fbbf24',
                  boxShadow: '0 8px 24px rgba(251,191,36,0.15)',
                  flex: 1,
                  maxWidth: '220px',
                  transform: 'translateY(-12px)',
                  transition: 'all 0.3s',
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🥇</div>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 700, color: 'white', border: '3px solid #fbbf24', boxShadow: '0 4px 12px rgba(251,191,36,0.3)' }}>
                    {leaderboardData[0]?.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>{leaderboardData[0]?.profiles?.full_name || 'User'}</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>{leaderboardData[0]?.score || 0}%</div>
                </div>

                {/* Rank 3 */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  flex: 1,
                  maxWidth: '200px',
                  transition: 'all 0.3s',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥉</div>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #d97706, #f59e0b)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: 'white', border: '3px solid #fde68a' }}>
                    {leaderboardData[2]?.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>{leaderboardData[2]?.profiles?.full_name || 'User'}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#667eea', marginTop: '4px' }}>{leaderboardData[2]?.score || 0}%</div>
                </div>
              </div>
            )}

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Peringkat</th>
                      <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Nama</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Skor</th>
                      <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Benar</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.slice(3).map((item, idx) => {
                      const rank = idx + 4
                      const rankStyle = getRankStyle(rank)
                      return (
                        <tr
                          key={`${item.user_id}-${rank}`}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'all 0.2s',
                            background: rank % 2 === 0 ? '#fafbfc' : 'white',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f4ff' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = rank % 2 === 0 ? '#fafbfc' : 'white' }}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              fontSize: '13px',
                              fontWeight: 700,
                              ...rankStyle,
                            }}>
                              {getMedal(rank)}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: item.profiles?.avatar_url ? `url(${item.profiles.avatar_url}) center/cover` : 'linear-gradient(135deg, #667eea, #764ba2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: 'white',
                                flexShrink: 0,
                                overflow: 'hidden',
                              }}>
                                {!item.profiles?.avatar_url && (item.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U')}
                              </div>
                              <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '14px' }}>
                                {item.profiles?.full_name || 'Pengguna'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 14px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: 700,
                              background: item.score >= 70 ? '#dcfce7' : '#fee2e2',
                              color: item.score >= 70 ? '#15803d' : '#dc2626',
                            }}>
                              {item.score || 0}%
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                            {item.correct_count || 0}/{item.total_answered || 0}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', color: '#94a3b8' }}>
                            {item.finished_at ? new Date(item.finished_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Load More */}
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button
                  onClick={loadMore}
                  disabled={loading}
                  style={{
                    padding: '12px 36px',
                    background: loading ? '#94a3b8' : 'white',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      e.currentTarget.style.color = 'white'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = 'white'
                      e.currentTarget.style.color = '#667eea'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  {loading ? 'Memuat...' : 'Muat Lebih Banyak ↓'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
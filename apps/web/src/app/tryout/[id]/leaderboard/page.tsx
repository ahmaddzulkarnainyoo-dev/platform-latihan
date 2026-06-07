'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'

interface LeaderboardEntry {
  user_id: string
  user_email: string
  user_name: string
  score: number
  correct_count: number
  finished_at: string
}

export default function LeaderboardPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.id as string
  const supabase = createClient()

  const [exam, setExam] = useState<any>(null)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [examId])

  const loadLeaderboard = async () => {
    setLoading(true)

    // Ambil info ujian
    const { data: examData } = await supabase
      .from('exams')
      .select('title')
      .eq('id', examId)
      .single()
    setExam(examData)

    // Ambil 10 besar attempt dengan skor tertinggi, lalu join dengan profiles
    const { data: attempts, error } = await supabase
      .from('exam_attempts')
      .select(`
        user_id,
        score,
        correct_count,
        finished_at,
        profiles:user_id (email, full_name)
      `)
      .eq('exam_id', examId)
      .eq('status', 'finished')
      .order('score', { ascending: false })
      .order('finished_at', { ascending: true })
      .limit(10)

    if (error) {
      console.error(error)
      setEntries([])
    } else if (attempts) {
      const formatted = attempts.map((a: any) => ({
        user_id: a.user_id,
        user_email: a.profiles?.email || 'Email tidak tersedia',
        user_name: a.profiles?.full_name || 'Anonim',
        score: a.score,
        correct_count: a.correct_count,
        finished_at: a.finished_at,
      }))
      setEntries(formatted)
    }

    setLoading(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p>Memuat leaderboard...</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href={`/tryout/${examId}`} style={{ color: '#2563eb', textDecoration: 'none' }}>← Kembali ke Tryout</a>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: 0 }}>🏆 Leaderboard</h1>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{exam?.title}</h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>10 besar peserta dengan skor tertinggi</p>
        </div>

        {entries.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>📭</p>
            <p style={{ color: '#64748b' }}>Belum ada peserta yang menyelesaikan ujian ini.</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '60px' }}>No</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Peserta</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '100px' }}>Skor</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '120px' }}>Benar</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '150px' }}>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr key={entry.user_id} style={{ borderBottom: idx === entries.length - 1 ? 'none' : '1px solid #f0f2f5' }}>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, fontSize: '18px', color: idx < 3 ? '#f59e0b' : '#64748b' }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 500 }}>{entry.user_name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{entry.user_email}</div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, fontSize: '18px', color: '#2563eb' }}>
                      {entry.score}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: '#475569' }}>
                      {entry.correct_count}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                      {formatDate(entry.finished_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <a href={`/tryout/${examId}`} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            Kembali ke Tryout
          </a>
        </div>
      </div>
    </div>
  )
}
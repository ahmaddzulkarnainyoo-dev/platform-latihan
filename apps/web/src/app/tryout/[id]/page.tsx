'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import AttentionTryout from '@/components/AttentionTryout'

type AnswersType = Record<string, string[]> // question_id -> array of option_ids

export default function TryoutPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const supabase = createClient()

  const [exam, setExam] = useState<any>(null)
  const [attentionTest, setAttentionTest] = useState<any>(null)
  const [mode, setMode] = useState<'normal' | 'attention' | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<AnswersType>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)

  useEffect(() => {
    loadExam()
  }, [examId])

  const loadExam = async () => {
    const { data: examData } = await supabase
      .from('exams')
      .select('*, categories(name), attention_tests(*)')
      .eq('id', examId)
      .single()

    if (!examData) { router.push('/'); return }
    setExam(examData)

    // Check if this is an attention test exam
    if (examData.attention_test_id) {
      const attentionTestData = examData.attention_tests
      if (attentionTestData) {
        setAttentionTest(attentionTestData)
        setMode('attention')
        setLoading(false)
        return
      }
    }

    // Normal tryout mode
    setTimeLeft(examData.duration_minutes * 60)
    setMode('normal')

    const { data: qData } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('exam_id', examId)
      .order('order_number')

    if (qData) setQuestions(qData)
    setLoading(false)
  }

  const handleAnswerChange = (questionId: string, optionId: string, questionType: string) => {
    setAnswers(prev => {
      const current = prev[questionId] || []
      if (questionType === 'single') {
        return { ...prev, [questionId]: [optionId] }
      } else {
        const exists = current.includes(optionId)
        if (exists) {
          const filtered = current.filter(id => id !== optionId)
          if (filtered.length === 0) {
            const { [questionId]: _, ...rest } = prev
            return rest
          }
          return { ...prev, [questionId]: filtered }
        } else {
          return { ...prev, [questionId]: [...current, optionId] }
        }
      }
    })
  }

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()

    let correct = 0
    for (const q of questions) {
      const selectedIds = answers[q.id] || []
      const correctOptions = q.question_options.filter((opt: any) => opt.is_correct).map((opt: any) => opt.id)
      const isCorrect = selectedIds.length === correctOptions.length && correctOptions.every((id: string) => selectedIds.includes(id))
      if (isCorrect) correct++
    }

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
    const passed = score >= (exam?.passing_score || 70)

    const { data: attempt } = await supabase
      .from('exam_attempts')
      .insert({
        user_id: user?.id || null,
        exam_id: examId,
        score,
        correct_count: correct,
        total_answered: Object.keys(answers).length,
        status: 'finished',
        finished_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (attempt) {
      for (const q of questions) {
        const selectedIds = answers[q.id] || []
        if (selectedIds.length === 0) continue
        for (const optId of selectedIds) {
          const correctOpt = q.question_options.find((o: any) => o.id === optId)?.is_correct
          await supabase.from('attempt_answers').insert({
            attempt_id: attempt.id,
            question_id: q.id,
            selected_option_id: optId,
            is_correct: !!correctOpt,
          })
        }
      }
      setAttemptId(attempt.id)
    }

    setResult({ score, correct, total: questions.length, passed })
    setFinished(true)
    setSubmitting(false)
  }, [answers, questions, exam, examId, submitting])

  useEffect(() => {
    if (!started || finished) return
    if (timeLeft <= 0) { handleSubmit(true); return }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [started, finished, timeLeft, handleSubmit])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const timeWarning = timeLeft < 300
  const timeUrgent = timeLeft < 60

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <p style={{ color: '#64748b' }}>Memuat soal...</p>
    </div>
  )

  // Render attention test mode
  if (mode === 'attention' && attentionTest) {
    return <AttentionTryout exam={exam} attentionTest={attentionTest} />
  }

  if (!started) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '48px', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{exam?.categories?.name}</p>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '24px', letterSpacing: '-0.5px' }}>{exam?.title}</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Soal', value: questions.length },
            { label: 'Durasi', value: `${exam?.duration_minutes} mnt` },
            { label: 'Nilai Lulus', value: `${exam?.passing_score}%` },
          ].map(item => (
            <div key={item.label} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px 12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>{item.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px', marginBottom: '28px', fontSize: '13px', color: '#92400e', textAlign: 'left' }}>
          ⚠️ Timer akan berjalan setelah kamu klik mulai. Pastikan koneksi internet stabil.
        </div>

        <button
          onClick={() => setStarted(true)}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.45)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)'
          }}
        >
          Mulai Ujian →
        </button>
        <a href={`/tryout/${examId}/leaderboard`} style={{ display: 'block', marginTop: '12px', color: '#8b5cf6', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>🏆 Leaderboard</a>
        <a href="/dashboard" style={{ display: 'block', marginTop: '8px', color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>← Kembali ke Dashboard</a>
      </div>
    </div>
  )

  if (finished && result) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '48px', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>{result.passed ? '🎉' : '😔'}</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', letterSpacing: '-0.5px' }}>{result.passed ? 'Selamat, Kamu Lulus!' : 'Belum Lulus'}</h2>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px' }}>{result.passed ? 'Hasil ujian kamu memuaskan!' : 'Jangan menyerah, coba lagi!'}</p>
        <div style={{ fontSize: '64px', fontWeight: 800, color: result.passed ? '#16a34a' : '#dc2626', marginBottom: '8px' }}>{result.score}</div>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>{result.correct} benar dari {result.total} soal</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px', border: '1px solid #bbf7d0' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>{result.correct}</div><div style={{ fontSize: '12px', color: '#15803d' }}>Jawaban Benar</div></div>
          <div style={{ background: '#fff0f0', borderRadius: '12px', padding: '16px', border: '1px solid #fecaca' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{result.total - result.correct}</div><div style={{ fontSize: '12px', color: '#dc2626' }}>Jawaban Salah</div></div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a href="/dashboard" style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#374151', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, textAlign: 'center', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>🏠 Dashboard</a>
          <a href={`/tryout/${examId}`} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, textAlign: 'center', boxShadow: '0 4px 12px rgba(102,126,234,0.3)', transition: 'all 0.3s' }}>🔄 Coba Lagi</a>
          {attemptId && <a href={`/tryout/${examId}/review?attempt_id=${attemptId}`} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, textAlign: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.3)', transition: 'all 0.3s' }}>📖 Pembahasan</a>}
          <a href={`/tryout/${examId}/leaderboard`} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, textAlign: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.3)', transition: 'all 0.3s' }}>🏆 Leaderboard</a>
        </div>
      </div>
    </div>
  )

  const currentQ = questions[currentIdx]
  const answeredCount = Object.keys(answers).length

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Premium Top Bar with Timer */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{exam?.categories?.name}</p>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{exam?.title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '13px', color: '#64748b', background: '#f1f5f9', padding: '6px 14px', borderRadius: '8px', fontWeight: 500 }}>
            <span style={{ color: answeredCount === questions.length ? '#16a34a' : '#64748b' }}>{answeredCount}</span>/{questions.length} terjawab
          </div>
          <div style={{
            padding: '8px 20px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '22px',
            background: timeUrgent ? '#fee2e2' : timeWarning ? '#fffbeb' : '#f0fdf4',
            color: timeUrgent ? '#dc2626' : timeWarning ? '#d97706' : '#16a34a',
            border: `2px solid ${timeUrgent ? '#fca5a5' : timeWarning ? '#fde68a' : '#86efac'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            style={{
              padding: '12px 24px',
              background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.45)'
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
              }
            }}
          >
            {submitting ? 'Memproses...' : 'Selesai & Kirim'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '24px', gap: '24px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>Soal {currentIdx + 1} dari {questions.length}</span>
              {answers[currentQ?.id] && answers[currentQ?.id].length > 0 && <span style={{ fontSize: '12px', color: '#16a34a', background: '#f0fdf4', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>✓ Terjawab</span>}
            </div>
            <p style={{ fontSize: '17px', color: '#1e293b', lineHeight: 1.7, marginBottom: currentQ?.question_image_url ? '16px' : '0', fontWeight: 500 }}>
              {currentQ?.question_text}
            </p>
            {currentQ?.question_image_url && <img src={currentQ.question_image_url} alt="soal" style={{ maxWidth: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} />}
            {currentQ?.question_type === 'multiple' && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', fontWeight: 500 }}>
                ✓ Bisa memilih lebih dari satu
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentQ?.question_options?.map((opt: any, idx: number) => {
              const selected = answers[currentQ.id]?.includes(opt.id) || false
              const labels = ['A', 'B', 'C', 'D', 'E', 'F']
              const isMultiple = currentQ.question_type === 'multiple'
              return (
                <div
                  key={opt.id}
                  onClick={() => handleAnswerChange(currentQ.id, opt.id, currentQ.question_type)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px',
                    background: selected ? '#eff6ff' : 'white',
                    border: selected ? '2px solid #667eea' : '1.5px solid #e2e8f0',
                    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: selected ? '0 4px 12px rgba(102,126,234,0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = '#667eea'
                      e.currentTarget.style.background = '#fafaff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = '#e2e8f0'
                      e.currentTarget.style.background = 'white'
                    }
                  }}
                >
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                    background: selected ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f1f5f9',
                    color: selected ? 'white' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '14px',
                    boxShadow: selected ? '0 4px 10px rgba(102,126,234,0.3)' : 'none',
                    transition: 'all 0.15s',
                  }}>
                    {isMultiple ? (selected ? '✓' : labels[idx]) : labels[idx]}
                  </div>
                  <div style={{ flex: 1 }}>
                    {opt.option_text && <p style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>{opt.option_text}</p>}
                    {opt.option_image_url && <img src={opt.option_image_url} alt="opt" style={{ maxHeight: '100px', borderRadius: '8px', marginTop: opt.option_text ? '8px' : '0' }} />}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button
              onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              style={{
                padding: '12px 28px',
                background: currentIdx === 0 ? '#f1f5f9' : 'white',
                color: currentIdx === 0 ? '#94a3b8' : '#374151',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: currentIdx === 0 ? 'default' : 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (currentIdx !== 0) {
                  e.currentTarget.style.borderColor = '#667eea'
                  e.currentTarget.style.color = '#667eea'
                }
              }}
              onMouseLeave={(e) => {
                if (currentIdx !== 0) {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.color = '#374151'
                }
              }}
            >
              ← Sebelumnya
            </button>
            <button
              onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
              disabled={currentIdx === questions.length - 1}
              style={{
                padding: '12px 28px',
                background: currentIdx === questions.length - 1 ? '#f1f5f9' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: currentIdx === questions.length - 1 ? '#94a3b8' : 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: currentIdx === questions.length - 1 ? 'default' : 'pointer',
                fontWeight: 500,
                boxShadow: currentIdx === questions.length - 1 ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                if (currentIdx !== questions.length - 1) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.45)'
                }
              }}
              onMouseLeave={(e) => {
                if (currentIdx !== questions.length - 1) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                }
              }}
            >
              Berikutnya →
            </button>
          </div>
        </div>

        <div style={{ width: '220px', flexShrink: 0 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', position: 'sticky', top: '80px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: '16px' }}>Navigasi Soal</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: idx === currentIdx ? 'linear-gradient(135deg, #667eea, #764ba2)' : (answers[q.id] && answers[q.id].length > 0) ? '#22c55e' : '#f1f5f9',
                    color: (idx === currentIdx || (answers[q.id] && answers[q.id].length > 0)) ? 'white' : '#64748b',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (idx !== currentIdx && (!answers[q.id] || answers[q.id].length === 0)) {
                      e.currentTarget.style.background = '#e2e8f0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (idx !== currentIdx && (!answers[q.id] || answers[q.id].length === 0)) {
                      e.currentTarget.style.background = '#f1f5f9'
                    }
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: '#22c55e', borderRadius: '4px' }}></div> Terjawab</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '4px' }}></div> Soal aktif</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: '#f1f5f9', borderRadius: '4px', border: '1px solid #e2e8f0' }}></div> Belum dijawab</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
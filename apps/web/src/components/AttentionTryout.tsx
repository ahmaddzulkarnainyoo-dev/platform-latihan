'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AttentionTest {
  id: string
  title: string
  description: string | null
  instructions: string | null
  item_type: string
  items: string[]
  display_count: number
  missing_count: number
  time_limit: number
  passing_score: number
}

interface Props {
  exam: any
  attentionTest: AttentionTest
}

interface AnswerRecord {
  questionDisplay: string
  missingItems: string[]
  selectedOption: string
  isCorrect: boolean
}

export default function AttentionTryout({ exam, attentionTest }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [isStarted, setIsStarted] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(attentionTest.time_limit)
  const [currentDisplay, setCurrentDisplay] = useState<string[]>([])
  const [questionDisplay, setQuestionDisplay] = useState<string[]>([])
  const [missingItems, setMissingItems] = useState<string[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const generateQuestion = useCallback(() => {
    const shuffled = [...attentionTest.items].sort(() => 0.5 - Math.random())
    const displayItems = shuffled.slice(0, attentionTest.display_count)

    // Pick random indices to remove
    const missingIndices: number[] = []
    while (missingIndices.length < attentionTest.missing_count) {
      const idx = Math.floor(Math.random() * displayItems.length)
      if (!missingIndices.includes(idx)) missingIndices.push(idx)
    }

    const missing = missingIndices.map(i => displayItems[i])
    const question = displayItems.filter((_, i) => !missingIndices.includes(i))

    setCurrentDisplay(displayItems)
    setQuestionDisplay(question)
    setMissingItems(missing)
    setFeedback(null)
  }, [attentionTest])

  const handleAnswer = useCallback((selectedOption: string) => {
    const isCorrect = missingItems.includes(selectedOption)
    setFeedback(isCorrect ? 'correct' : 'incorrect')

    const record: AnswerRecord = {
      questionDisplay: `Referensi: ${currentDisplay.join(', ')} | Soal: ${questionDisplay.join(', ')}`,
      missingItems,
      selectedOption,
      isCorrect,
    }

    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
    } else {
      setIncorrectCount(prev => prev + 1)
    }
    setTotalQuestions(prev => prev + 1)
    setAnswers(prev => [...prev, record])

    // Brief delay to show feedback, then next question
    setTimeout(() => {
      generateQuestion()
    }, 500)
  }, [missingItems, currentDisplay, questionDisplay, generateQuestion])

  const finishTest = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')

    const total = totalQuestions
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const passed = score >= (attentionTest.passing_score || 70)

    const { data: { user } } = await supabase.auth.getUser()

    // Save attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('exam_attempts')
      .insert({
        user_id: user?.id || null,
        exam_id: exam.id,
        score,
        correct_count: correctCount,
        total_answered: total,
        status: 'completed',
        started_at: new Date(Date.now() - attentionTest.time_limit * 1000).toISOString(),
        finished_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (attemptError || !attempt) {
      setError('Gagal menyimpan hasil: ' + (attemptError?.message || 'Unknown error'))
      setSubmitting(false)
      return
    }

    // Save each answer
    for (const ans of answers) {
      await supabase.from('attempt_answers').insert({
        attempt_id: attempt.id,
        question_id: null,
        selected_option_id: ans.selectedOption,
        is_correct: ans.isCorrect,
        question_text: ans.questionDisplay,
        selected_option_text: ans.selectedOption,
      })
    }

    setIsFinished(true)
    setSubmitting(false)

    // Redirect to hasil page
    router.push(`/tryout/${exam.id}/hasil?attempt=${attempt.id}`)
  }, [answers, correctCount, totalQuestions, exam.id, attentionTest.passing_score, submitting, supabase, router])

  // Start timer when user clicks start
  useEffect(() => {
    if (!isStarted || isFinished) return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          finishTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isStarted, isFinished, finishTest])

  // Generate first question when started
  useEffect(() => {
    if (isStarted && !isFinished && currentDisplay.length === 0) {
      generateQuestion()
    }
  }, [isStarted, isFinished, currentDisplay, generateQuestion])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const timeWarning = timeLeft < Math.floor(attentionTest.time_limit * 0.3)
  const timeUrgent = timeLeft < 10

  // --- INSTRUCTION SCREEN ---
  if (!isStarted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '48px', maxWidth: '520px', width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>🧠</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', textAlign: 'center', letterSpacing: '-0.5px' }}>{attentionTest.title}</h1>
          {attentionTest.description && (
            <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '20px', fontSize: '14px' }}>{attentionTest.description}</p>
          )}

          {/* Instructions (can contain HTML) */}
          {attentionTest.instructions && (
            <div
              style={{
                background: '#f0f4ff',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '14px',
                color: '#1e293b',
                lineHeight: 1.6,
                border: '1px solid #e0e7ff',
              }}
              dangerouslySetInnerHTML={{ __html: attentionTest.instructions }}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>{attentionTest.display_count}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Item Ditampilkan</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>{attentionTest.missing_count}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Item Hilang</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>{formatTime(attentionTest.time_limit)}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Durasi</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>{attentionTest.passing_score}%</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Nilai Lulus</div>
            </div>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px', marginBottom: '24px', fontSize: '13px', color: '#92400e' }}>
            ⚠️ Timer akan berjalan setelah kamu klik mulai. Jawab secepat dan setepat mungkin.
          </div>

          <button
            onClick={() => setIsStarted(true)}
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
            Mulai Tes →
          </button>
        </div>
      </div>
    )
  }

  // --- FINISHED SCREEN ---
  if (isFinished) {
    const total = totalQuestions
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const passed = score >= (attentionTest.passing_score || 70)

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '48px', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>{passed ? '🎉' : '😔'}</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', letterSpacing: '-0.5px' }}>{passed ? 'Tes Selesai!' : 'Waktu Habis'}</h2>
          <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>{passed ? 'Hasil tes kecermatan kamu memuaskan!' : 'Coba lagi lain kali!'}</p>
          <div style={{ fontSize: '64px', fontWeight: 800, color: passed ? '#16a34a' : '#dc2626', marginBottom: '8px' }}>{score}</div>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>{correctCount} benar dari {total} soal</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>{correctCount}</div>
              <div style={{ fontSize: '12px', color: '#15803d' }}>Benar</div>
            </div>
            <div style={{ background: '#fff0f0', borderRadius: '12px', padding: '16px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{incorrectCount}</div>
              <div style={{ fontSize: '12px', color: '#dc2626' }}>Salah</div>
            </div>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Mengalihkan ke halaman hasil...</p>
        </div>
      </div>
    )
  }

  // --- ACTIVE TEST SCREEN ---
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar with Timer */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{exam?.categories?.name}</p>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{attentionTest.title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '13px', color: '#64748b', background: '#f1f5f9', padding: '6px 14px', borderRadius: '8px', fontWeight: 500 }}>
            ✅ {correctCount} | ❌ {incorrectCount}
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
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '24px' }}>
        {/* Error message */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Feedback toast */}
        {feedback && (
          <div style={{
            textAlign: 'center',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontWeight: 700,
            fontSize: '18px',
            background: feedback === 'correct' ? '#f0fdf4' : '#fee2e2',
            color: feedback === 'correct' ? '#16a34a' : '#dc2626',
            border: `2px solid ${feedback === 'correct' ? '#86efac' : '#fca5a5'}`,
            transition: 'all 0.3s',
          }}>
            {feedback === 'correct' ? '✅ Benar!' : '❌ Salah!'}
          </div>
        )}

        {/* Reference Table */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px' }}>
            📋 Tabel Referensi — Hafalkan!
          </h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
          }}>
            {currentDisplay.map((item, idx) => (
              <div
                key={`ref-${idx}`}
                style={{
                  padding: '16px 24px',
                  background: '#f1f5f9',
                  borderRadius: '12px',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#1e293b',
                  border: '2px solid #e2e8f0',
                  fontFamily: attentionTest.item_type === 'huruf' ? 'monospace' : 'inherit',
                  minWidth: '60px',
                  textAlign: 'center',
                }}
              >
                {attentionTest.item_type === 'gambar' ? (
                  <img src={item} alt="item" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  item
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Question */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px' }}>
            ❓ Item mana yang hilang?
          </h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {currentDisplay.map((item, idx) => {
              const isMissing = missingItems.includes(item)
              return (
                <div
                  key={`q-${idx}`}
                  style={{
                    padding: '16px 24px',
                    background: isMissing ? '#fef2f2' : '#f0fdf4',
                    borderRadius: '12px',
                    fontSize: '28px',
                    fontWeight: 700,
                    color: isMissing ? '#dc2626' : '#16a34a',
                    border: `2px dashed ${isMissing ? '#fca5a5' : '#86efac'}`,
                    fontFamily: attentionTest.item_type === 'huruf' ? 'monospace' : 'inherit',
                    minWidth: '60px',
                    textAlign: 'center',
                    opacity: isMissing ? 0.5 : 1,
                  }}
                >
                  {isMissing ? '?' : (attentionTest.item_type === 'gambar' ? (
                    <img src={item} alt="item" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : item)}
                </div>
              )
            })}
          </div>
        </div>

        {/* Answer Buttons */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginTop: 0, marginBottom: '16px' }}>
            🎯 Pilih jawaban:
          </h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
          }}>
            {attentionTest.items.map((item, idx) => (
              <button
                key={`btn-${idx}`}
                onClick={() => handleAnswer(item)}
                disabled={feedback !== null}
                style={{
                  padding: attentionTest.item_type === 'gambar' ? '8px' : '14px 24px',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: attentionTest.item_type === 'gambar' ? '14px' : '20px',
                  fontWeight: 700,
                  color: '#1e293b',
                  cursor: feedback !== null ? 'not-allowed' : 'pointer',
                  opacity: feedback !== null ? 0.6 : 1,
                  fontFamily: attentionTest.item_type === 'huruf' ? 'monospace' : 'inherit',
                  transition: 'all 0.2s',
                  minWidth: '60px',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  if (feedback === null) {
                    e.currentTarget.style.borderColor = '#667eea'
                    e.currentTarget.style.background = '#fafaff'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.2)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (feedback === null) {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {attentionTest.item_type === 'gambar' ? (
                  <img src={item} alt="option" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                ) : (
                  item
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
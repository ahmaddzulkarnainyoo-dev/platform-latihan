'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

type AnswersType = Record<string, string[]> // question_id -> array of option_ids

export default function TryoutPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const supabase = createClient()

  const [exam, setExam] = useState<any>(null)
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
      .select('*, categories(name)')
      .eq('id', examId)
      .single()

    if (!examData) { router.push('/'); return }
    setExam(examData)
    setTimeLeft(examData.duration_minutes * 60)

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
      // Perbaikan: tambahkan tipe string pada parameter id
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
      <p>Memuat soal...</p>
    </div>
  )

  if (!started) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '48px', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{exam?.categories?.name}</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '24px' }}>{exam?.title}</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Soal', value: questions.length },
            { label: 'Durasi', value: `${exam?.duration_minutes} mnt` },
            { label: 'Nilai Lulus', value: `${exam?.passing_score}%` },
          ].map(item => (
            <div key={item.label} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px 12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{item.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px', marginBottom: '28px', fontSize: '13px', color: '#92400e', textAlign: 'left' }}>
          ⚠️ Timer akan berjalan setelah kamu klik mulai. Pastikan koneksi internet stabil.
        </div>

        <button onClick={() => setStarted(true)} style={{ width: '100%', padding: '16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>Mulai Ujian →</button>
        <a href={`/tryout/${examId}/leaderboard`} style={{ display: 'block', marginTop: '12px', color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>🏆 Leaderboard</a>
        <a href="/" style={{ display: 'block', marginTop: '8px', color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>← Kembali</a>
      </div>
    </div>
  )

  if (finished && result) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '48px', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>{result.passed ? '🎉' : '😔'}</div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>{result.passed ? 'Selamat, Kamu Lulus!' : 'Belum Lulus'}</h2>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px' }}>{result.passed ? 'Hasil ujian kamu memuaskan!' : 'Jangan menyerah, coba lagi!'}</p>
        <div style={{ fontSize: '64px', fontWeight: 800, color: result.passed ? '#16a34a' : '#dc2626', marginBottom: '8px' }}>{result.score}</div>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>{result.correct} benar dari {result.total} soal</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>{result.correct}</div><div style={{ fontSize: '12px', color: '#15803d' }}>Jawaban Benar</div></div>
          <div style={{ background: '#fff0f0', borderRadius: '12px', padding: '16px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{result.total - result.correct}</div><div style={{ fontSize: '12px', color: '#dc2626' }}>Jawaban Salah</div></div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a href="/" style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#374151', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>🏠 Beranda</a>
          <a href={`/tryout/${examId}`} style={{ flex: 1, padding: '14px', background: '#2563eb', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>🔄 Coba Lagi</a>
          {attemptId && <a href={`/tryout/${examId}/review?attempt_id=${attemptId}`} style={{ flex: 1, padding: '14px', background: '#f59e0b', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>📖 Lihat Pembahasan</a>}
          <a href={`/tryout/${examId}/leaderboard`} style={{ flex: 1, padding: '14px', background: '#8b5cf6', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>🏆 Leaderboard</a>
        </div>
      </div>
    </div>
  )

  const currentQ = questions[currentIdx]
  const answeredCount = Object.keys(answers).length

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div><p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{exam?.categories?.name}</p><h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{exam?.title}</h2></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>{answeredCount}/{questions.length} terjawab</div>
          <div style={{ padding: '8px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '20px', background: timeUrgent ? '#fee2e2' : timeWarning ? '#fffbeb' : '#f0fdf4', color: timeUrgent ? '#dc2626' : timeWarning ? '#d97706' : '#16a34a' }}>⏱️ {formatTime(timeLeft)}</div>
          <button onClick={() => handleSubmit(false)} disabled={submitting} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>{submitting ? 'Memproses...' : 'Selesai & Kirim'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '24px', gap: '24px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>Soal {currentIdx + 1} dari {questions.length}</span>
              {answers[currentQ?.id] && answers[currentQ?.id].length > 0 && <span style={{ fontSize: '12px', color: '#16a34a', background: '#f0fdf4', padding: '4px 10px', borderRadius: '20px' }}>✓ Terjawab</span>}
            </div>
            <p style={{ fontSize: '16px', color: '#1e293b', lineHeight: 1.7, marginBottom: currentQ?.question_image_url ? '16px' : '0' }}>{currentQ?.question_text}</p>
            {currentQ?.question_image_url && <img src={currentQ.question_image_url} alt="soal" style={{ maxWidth: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} />}
            {currentQ?.question_type === 'multiple' && <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '20px', display: 'inline-block' }}>✓ Bisa memilih lebih dari satu</div>}
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
                    border: selected ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.1s',
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: selected ? '#2563eb' : '#f1f5f9',
                    color: selected ? 'white' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '14px',
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
            <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} style={{ padding: '12px 24px', background: currentIdx === 0 ? '#f1f5f9' : 'white', color: currentIdx === 0 ? '#94a3b8' : '#374151', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', cursor: currentIdx === 0 ? 'default' : 'pointer', fontWeight: 500 }}>← Sebelumnya</button>
            <button onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))} disabled={currentIdx === questions.length - 1} style={{ padding: '12px 24px', background: currentIdx === questions.length - 1 ? '#f1f5f9' : '#2563eb', color: currentIdx === questions.length - 1 ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', fontSize: '14px', cursor: currentIdx === questions.length - 1 ? 'default' : 'pointer', fontWeight: 500 }}>Berikutnya →</button>
          </div>
        </div>

        <div style={{ width: '220px', flexShrink: 0 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', position: 'sticky', top: '80px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: '16px' }}>Navigasi Soal</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {questions.map((q, idx) => (
                <button key={q.id} onClick={() => setCurrentIdx(idx)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: idx === currentIdx ? '#2563eb' : (answers[q.id] && answers[q.id].length > 0) ? '#22c55e' : '#f1f5f9', color: (idx === currentIdx || (answers[q.id] && answers[q.id].length > 0)) ? 'white' : '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{idx + 1}</button>
              ))}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: '#22c55e', borderRadius: '4px' }}></div> Terjawab</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: '#2563eb', borderRadius: '4px' }}></div> Soal aktif</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: '#f1f5f9', borderRadius: '4px', border: '1px solid #e2e8f0' }}></div> Belum dijawab</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
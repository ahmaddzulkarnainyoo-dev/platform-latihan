'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

interface ReviewQuestion {
  id: string
  question_text: string
  question_image_url: string | null
  question_type: string
  explanation: string | null
  selected_option_ids: string[]
  selected_options: { id: string; text: string; image_url: string | null }[]
  correct_options: { id: string; text: string; image_url: string | null }[]
  is_correct: boolean
}

export default function ReviewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const examId = params.id as string
  const attemptId = searchParams.get('attempt_id')
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<ReviewQuestion[]>([])
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)

  useEffect(() => {
    if (!attemptId) { router.push('/'); return }
    loadReview()
  }, [attemptId])

  const loadReview = async () => {
    setLoading(true)
    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select('*, exams(*)')
      .eq('id', attemptId)
      .single()
    if (!attempt) { router.push('/'); return }
    setScore(attempt.score)
    setPassed(attempt.score >= attempt.exams.passing_score)
    setExam(attempt.exams)

    // Ambil semua jawaban untuk attempt ini
    const { data: answers } = await supabase
      .from('attempt_answers')
      .select('*, question:questions(*, question_options(*))')
      .eq('attempt_id', attemptId)

    if (!answers) { setLoading(false); return }

    // Group by question
    const grouped: Record<string, any> = {}
    for (const ans of answers) {
      const q = ans.question
      if (!grouped[q.id]) {
        grouped[q.id] = {
          id: q.id,
          question_text: q.question_text,
          question_image_url: q.question_image_url,
          question_type: q.question_type,
          explanation: q.explanation,
          selected_option_ids: [],
          selected_options: [],
          correct_options: q.question_options.filter((opt: any) => opt.is_correct).map((opt: any) => ({ id: opt.id, text: opt.option_text, image_url: opt.option_image_url })),
        }
      }
      grouped[q.id].selected_option_ids.push(ans.selected_option_id)
      const opt = q.question_options.find((o: any) => o.id === ans.selected_option_id)
      if (opt) grouped[q.id].selected_options.push({ id: opt.id, text: opt.option_text, image_url: opt.option_image_url })
    }

    // Hitung is_correct untuk setiap soal
    const formatted: ReviewQuestion[] = Object.values(grouped).map((g: any) => {
      const correctIds = g.correct_options.map((o: any) => o.id).sort()
      const selectedIds = g.selected_option_ids.sort()
      const isCorrect = correctIds.length === selectedIds.length && correctIds.every((id: string, idx: number) => id === selectedIds[idx])
      return { ...g, is_correct: isCorrect }
    })

    setQuestions(formatted)
    setLoading(false)
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat pembahasan...</div>

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>📋 Review Jawaban</h1>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>{exam?.title}</p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 16px', background: passed ? '#f0fdf4' : '#fff0f0', borderRadius: '20px', color: passed ? '#15803d' : '#dc2626', fontWeight: 600 }}>{passed ? '✅ Lulus' : '❌ Tidak Lulus'}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>Skor: {score}%</div>
            <div style={{ color: '#475569' }}>{questions.filter(q => q.is_correct).length} benar dari {questions.length} soal</div>
          </div>
        </div>

        {questions.map((q, idx) => (
          <div key={q.id} style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: q.is_correct ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>Soal {idx + 1}</span>
              <span style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '20px', background: q.is_correct ? '#dcfce7' : '#fee2e2', color: q.is_correct ? '#15803d' : '#dc2626' }}>{q.is_correct ? 'Benar' : 'Salah'}</span>
              {q.question_type === 'multiple' && <span style={{ fontSize: '11px', background: '#e0e7ff', padding: '2px 8px', borderRadius: '20px' }}>Banyak jawaban</span>}
            </div>
            <p style={{ fontSize: '15px', color: '#1e293b', lineHeight: 1.6, marginBottom: q.question_image_url ? '12px' : '16px' }}>{q.question_text}</p>
            {q.question_image_url && <img src={q.question_image_url} alt="soal" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', marginBottom: '16px' }} />}

            <div style={{ marginBottom: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Jawaban kamu:</p>
              {q.selected_options.length === 0 ? <span style={{ color: '#dc2626' }}>Tidak dijawab</span> : q.selected_options.map(opt => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  {opt.image_url && <img src={opt.image_url} style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />}
                  <span>{opt.text || '(gambar)'}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '12px', padding: '12px', background: '#f0fdf4', borderRadius: '10px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Jawaban benar:</p>
              {q.correct_options.map(opt => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  {opt.image_url && <img src={opt.image_url} style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />}
                  <span>{opt.text || '(gambar)'}</span>
                </div>
              ))}
            </div>

            {q.explanation && (
              <div style={{ padding: '12px', background: '#fffbeb', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
                <p style={{ fontSize: '13px', color: '#92400e', marginBottom: '4px', fontWeight: 600 }}>💡 Pembahasan:</p>
                <p style={{ fontSize: '14px', color: '#78350f', margin: 0 }}>{q.explanation}</p>
              </div>
            )}
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <a href={`/tryout/${examId}`} style={{ display: 'inline-block', padding: '12px 24px', background: '#2563eb', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, marginRight: '12px' }}>🔄 Coba Lagi</a>
          <a href="/" style={{ display: 'inline-block', padding: '12px 24px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', textDecoration: 'none', color: '#374151', fontWeight: 600 }}>🏠 Beranda</a>
        </div>
      </div>
    </div>
  )
}
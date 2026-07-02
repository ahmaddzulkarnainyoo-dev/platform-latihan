'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function HasilTryoutContent() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const examId = params.id as string
  const attemptId = searchParams.get('attempt')

  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState<any>(null)
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!attemptId) {
      setError('ID attempt tidak ditemukan.')
      setLoading(false)
      return
    }
    loadData()
  }, [attemptId])

  const loadData = async () => {
    setLoading(true)

    // 1. Ambil data attempt
    const { data: attemptData, error: attemptError } = await supabase
      .from('exam_attempts')
      .select('*, exams(*)')
      .eq('id', attemptId)
      .single()

    if (attemptError || !attemptData) {
      setError('Data attempt tidak ditemukan.')
      setLoading(false)
      return
    }

    setAttempt(attemptData)
    setExam(attemptData.exams)

    // Check if this exam has an attention_test_id
    if (attemptData.exams?.attention_test_id) {
      // For attention tests, we load answers with question_text fields
      const { data: answersData, error: aError } = await supabase
        .from('attempt_answers')
        .select('*')
        .eq('attempt_id', attemptId)

      if (aError) {
        setError('Gagal memuat jawaban.')
        setLoading(false)
        return
      }

      setAnswers(answersData || [])
      // No standard questions for attention tests
      setQuestions([])
      setLoading(false)
      return
    }

    // 2. Ambil semua soal untuk ujian biasa
    const { data: questionsData, error: qError } = await supabase
      .from('questions')
      .select(`
        *,
        question_options (*)
      `)
      .eq('exam_id', examId)
      .order('order_number', { ascending: true })

    if (qError) {
      setError('Gagal memuat soal.')
      setLoading(false)
      return
    }

    // 3. Ambil jawaban user untuk attempt ini
    const { data: answersData, error: aError } = await supabase
      .from('attempt_answers')
      .select('*, question_options(*)')
      .eq('attempt_id', attemptId)

    if (aError) {
      setError('Gagal memuat jawaban.')
      setLoading(false)
      return
    }

    setQuestions(questionsData || [])
    setAnswers(answersData || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p style={{ color: '#64748b' }}>Memuat hasil...</p>
      </div>
    )
  }

  if (error || !attempt) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column' }}>
        <p style={{ fontSize: '40px', margin: '0 0 16px' }}>😕</p>
        <p style={{ color: '#dc2626', fontSize: '16px' }}>{error || 'Data tidak ditemukan'}</p>
        <Link href="/dashboard" style={{ marginTop: '16px', padding: '10px 24px', background: '#2563eb', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
          Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  // Hitung statistik
  const totalQuestions = exam?.attention_test_id ? answers.length : questions.length
  const correctCount = answers.filter(a => a.is_correct).length
  const wrongCount = answers.filter(a => !a.is_correct).length
  const unanswered = totalQuestions - answers.length
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  // Waktu pengerjaan
  const started = new Date(attempt.started_at)
  const finished = new Date(attempt.finished_at || new Date())
  const durationMinutes = Math.floor((finished.getTime() - started.getTime()) / 60000)
  const durationSeconds = Math.floor(((finished.getTime() - started.getTime()) % 60000) / 1000)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '32px 40px',
            color: 'white',
            marginBottom: '32px',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 4px' }}>
                📊 Hasil Tryout
              </h1>
              <p style={{ opacity: 0.9, margin: 0, fontSize: '15px' }}>
                {exam?.title || 'Ujian'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                {score}%
              </div>
              <div style={{ opacity: 0.8, fontSize: '14px' }}>
                {correctCount} benar • {wrongCount} salah • {unanswered} tidak dijawab
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', marginTop: '20px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
            <div>
              <span style={{ opacity: 0.8, fontSize: '13px' }}>Waktu Pengerjaan</span>
              <div style={{ fontWeight: 600, fontSize: '18px' }}>
                {durationMinutes}m {durationSeconds}s
              </div>
            </div>
            <div>
              <span style={{ opacity: 0.8, fontSize: '13px' }}>Selesai</span>
              <div style={{ fontWeight: 600, fontSize: '18px' }}>
                {new Date(attempt.finished_at || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div>
              <span style={{ opacity: 0.8, fontSize: '13px' }}>Status</span>
              <div style={{ fontWeight: 600, fontSize: '18px' }}>
                {score >= (exam?.passing_score || 70) ? '✅ Lulus' : '❌ Tidak Lulus'}
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Soal */}
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
          📝 Review Jawaban
        </h2>

        {/* Untuk attention test, tampilkan jawaban dari question_text */}
        {exam?.attention_test_id && answers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {answers.map((ans, index) => {
              const isCorrect = ans.is_correct
              return (
                <div
                  key={index}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    border: '2px solid',
                    borderColor: isCorrect ? '#22c55e' : '#ef4444',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>
                      Soal {index + 1}
                    </span>
                    <span
                      style={{
                        padding: '2px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: isCorrect ? '#dcfce7' : '#fee2e2',
                        color: isCorrect ? '#15803d' : '#dc2626',
                      }}
                    >
                      {isCorrect ? '✅ Benar' : '❌ Salah'}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e293b', marginBottom: '12px', lineHeight: 1.6 }}>
                    {ans.question_text}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '14px' }}>
                    <div style={{ padding: '8px 14px', background: '#f1f5f9', borderRadius: '8px' }}>
                      <span style={{ color: '#64748b' }}>Jawabanmu: </span>
                      <strong style={{ color: isCorrect ? '#16a34a' : '#dc2626' }}>{ans.selected_option_text}</strong>
                    </div>
                    <div style={{ padding: '8px 14px', background: '#f0fdf4', borderRadius: '8px' }}>
                      <span style={{ color: '#64748b' }}>Jawaban benar: </span>
                      <strong style={{ color: '#16a34a' }}>{ans.selected_option_text}</strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : questions.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b' }}>Tidak ada soal untuk ujian ini.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {questions.map((q, index) => {
              const userAnswer = answers.find(a => a.question_id === q.id)
              const selectedOption = userAnswer?.question_options
              const correctOption = q.question_options.find((opt: any) => opt.is_correct)

              const isCorrect = userAnswer?.is_correct || false
              const isAnswered = !!userAnswer

              return (
                <div
                  key={q.id}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '2px solid',
                    borderColor: isAnswered ? (isCorrect ? '#22c55e' : '#ef4444') : '#e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '16px' }}>
                        Soal {index + 1}
                      </span>
                      <span
                        style={{
                          padding: '2px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: isAnswered ? (isCorrect ? '#dcfce7' : '#fee2e2') : '#f1f5f9',
                          color: isAnswered ? (isCorrect ? '#15803d' : '#dc2626') : '#64748b',
                        }}
                      >
                        {isAnswered ? (isCorrect ? '✅ Benar' : '❌ Salah') : '⏳ Tidak Dijawab'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {q.points || 1} poin
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {q.question_type === 'single' ? 'Pilihan Ganda' : 'Multi Pilihan'}
                    </span>
                  </div>

                  {/* Teks Soal */}
                  <div style={{ fontSize: '15px', color: '#1e293b', marginBottom: '12px' }}>
                    {q.question_text}
                  </div>

                  {q.question_image_url && (
                    <img
                      src={q.question_image_url}
                      alt="gambar soal"
                      style={{ maxHeight: '150px', borderRadius: '8px', marginBottom: '12px' }}
                    />
                  )}

                  {/* Pilihan Jawaban */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.question_options.map((opt: any) => {
                      const isSelected = selectedOption?.id === opt.id
                      const isCorrectOpt = opt.is_correct

                      let bgColor = 'white'
                      let borderColor = '#e2e8f0'
                      let textColor = '#1e293b'

                      if (isSelected && isCorrectOpt) {
                        bgColor = '#dcfce7'
                        borderColor = '#22c55e'
                        textColor = '#15803d'
                      } else if (isSelected && !isCorrectOpt) {
                        bgColor = '#fee2e2'
                        borderColor = '#ef4444'
                        textColor = '#dc2626'
                      } else if (!isSelected && isCorrectOpt) {
                        bgColor = '#f0fdf4'
                        borderColor = '#86efac'
                        textColor = '#15803d'
                      }

                      return (
                        <div
                          key={opt.id}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            background: bgColor,
                            border: `2px solid ${borderColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s',
                          }}
                        >
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '13px',
                              background: isSelected ? (isCorrectOpt ? '#22c55e' : '#ef4444') : '#f1f5f9',
                              color: isSelected ? 'white' : '#64748b',
                              flexShrink: 0,
                            }}
                          >
                            {String.fromCharCode(65 + q.question_options.indexOf(opt))}
                          </span>
                          <span style={{ color: textColor, fontSize: '14px' }}>
                            {opt.option_text}
                            {isSelected && <span style={{ marginLeft: '8px', fontSize: '13px' }}>(pilihanmu)</span>}
                            {!isSelected && isCorrectOpt && <span style={{ marginLeft: '8px', fontSize: '13px', color: '#15803d' }}>✓ Jawaban benar</span>}
                          </span>
                          {opt.option_image_url && (
                            <img src={opt.option_image_url} alt="pilihan" style={{ maxHeight: '50px', borderRadius: '6px', marginLeft: 'auto' }} />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Pembahasan */}
                  {q.explanation && (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '14px 18px',
                        background: '#f0f4ff',
                        borderRadius: '10px',
                        border: '1px solid #e8edff',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#4a3f7a', fontSize: '13px' }}>💡 Pembahasan: </span>
                      <span style={{ color: '#1e293b', fontSize: '14px' }}>{q.explanation}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Tombol Aksi */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '32px', justifyContent: 'center' }}>
          <Link
            href="/dashboard"
            style={{
              padding: '14px 40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 600,
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.45)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.35)'
            }}
          >
            🏠 Kembali ke Dashboard
          </Link>
          <Link
            href={`/tryout/${examId}`}
            style={{
              padding: '14px 32px',
              background: 'white',
              color: '#1e293b',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 600,
              border: '2px solid #e2e8f0',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea'
              e.currentTarget.style.color = '#667eea'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0'
              e.currentTarget.style.color = '#1e293b'
            }}
          >
            🔄 Ulangi Tryout
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function HasilTryoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat...</div>}>
      <HasilTryoutContent />
    </Suspense>
  )
}
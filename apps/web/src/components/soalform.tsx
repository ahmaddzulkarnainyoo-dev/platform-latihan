'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Option {
  id: string
  text: string
  imageUrl: string
  imageFile: File | null
  isCorrect: boolean
}

interface SoalFormProps {
  mode: 'tambah' | 'edit'
  initialData?: {
    id: string
    exam_id: string
    question_text: string
    question_image_url: string | null
    question_type: 'single' | 'multiple'
    explanation: string | null
    options: Option[]
  }
  examId?: string // untuk mode tambah (dari query param)
}

export default function SoalForm({ mode, initialData, examId: initialExamId }: SoalFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [exams, setExams] = useState<any[]>([])
  const [examId, setExamId] = useState(initialData?.exam_id || initialExamId || '')
  const [questionText, setQuestionText] = useState(initialData?.question_text || '')
  const [questionType, setQuestionType] = useState<'single' | 'multiple'>(
    initialData?.question_type || 'single'
  )
  const [explanation, setExplanation] = useState(initialData?.explanation || '')
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null)
  const [questionImagePreview, setQuestionImagePreview] = useState(
    initialData?.question_image_url || ''
  )
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [options, setOptions] = useState<Option[]>(
    initialData?.options || [
      { id: '1', text: '', imageUrl: '', imageFile: null, isCorrect: false },
      { id: '2', text: '', imageUrl: '', imageFile: null, isCorrect: false },
      { id: '3', text: '', imageUrl: '', imageFile: null, isCorrect: false },
      { id: '4', text: '', imageUrl: '', imageFile: null, isCorrect: false },
    ]
  )

  const questionImageRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadExams()
  }, [])

  // Untuk mode edit: sync option imageUrl dari initialData
  useEffect(() => {
    if (initialData?.options) {
      setOptions(initialData.options)
    }
  }, [initialData])

  const loadExams = async () => {
    const { data } = await supabase.from('exams').select('id, title').order('title')
    if (data) setExams(data)
  }

  const handleQuestionImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQuestionImageFile(file)
    setQuestionImagePreview(URL.createObjectURL(file))
  }

  const handleOptionImage = (optId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === optId
          ? { ...opt, imageFile: file, imageUrl: URL.createObjectURL(file) }
          : opt
      )
    )
  }

  const handleOptionText = (optId: string, value: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === optId ? { ...opt, text: value } : opt))
    )
  }

  const handleCorrectToggle = (optId: string) => {
    if (questionType === 'single') {
      setOptions((prev) =>
        prev.map((opt) => ({
          ...opt,
          isCorrect: opt.id === optId,
        }))
      )
    } else {
      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === optId ? { ...opt, isCorrect: !opt.isCorrect } : opt
        )
      )
    }
  }

  const removeOptionImage = (optId: string) => {
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === optId ? { ...opt, imageFile: null, imageUrl: '' } : opt
      )
    )
  }

  const removeQuestionImage = () => {
    setQuestionImageFile(null)
    setQuestionImagePreview('')
  }

  const uploadImage = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('question-media')
      .upload(path, file, { upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('question-media').getPublicUrl(path)
    return urlData.publicUrl
  }

  const handleSubmit = async () => {
    if (!examId) {
      setErrorMsg('Pilih ujian terlebih dahulu!')
      return
    }
    if (!questionText.trim()) {
      setErrorMsg('Teks soal tidak boleh kosong!')
      return
    }
    if (!options.some((o) => o.isCorrect)) {
      setErrorMsg('Pilih minimal satu jawaban yang benar!')
      return
    }
    if (options.every((o) => !o.text.trim() && !o.imageFile && !o.imageUrl)) {
      setErrorMsg('Minimal isi satu pilihan jawaban!')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      let questionImageUrl = initialData?.question_image_url || ''
      if (questionImageFile) {
        const path = `questions/${Date.now()}-${questionImageFile.name}`
        questionImageUrl = await uploadImage(questionImageFile, path)
      }

      // UPDATE atau INSERT
      let questionId = initialData?.id || ''

      if (mode === 'edit' && initialData?.id) {
        // Update soal
        const { error: qError } = await supabase
          .from('questions')
          .update({
            exam_id: examId,
            question_text: questionText,
            question_image_url: questionImageUrl || null,
            question_type: questionType,
            explanation: explanation || null,
          })
          .eq('id', initialData.id)

        if (qError) throw qError
        questionId = initialData.id

        // Hapus option lama
        const { error: delError } = await supabase
          .from('question_options')
          .delete()
          .eq('question_id', initialData.id)
        if (delError) throw delError
      } else {
        // Insert soal baru
        const { data: question, error: qError } = await supabase
          .from('questions')
          .insert({
            exam_id: examId,
            question_text: questionText,
            question_image_url: questionImageUrl || null,
            question_type: questionType,
            explanation: explanation || null,
            order_number: 0,
            points: 1,
          })
          .select()
          .single()

        if (qError) throw qError
        questionId = question.id
      }

      // Insert options baru
      for (const opt of options) {
        if (!opt.text.trim() && !opt.imageFile && !opt.imageUrl) continue

        let optImageUrl = opt.imageUrl
        if (opt.imageFile) {
          const path = `options/${Date.now()}-${opt.imageFile.name}`
          optImageUrl = await uploadImage(opt.imageFile, path)
        }

        const { error: oError } = await supabase.from('question_options').insert({
          question_id: questionId,
          option_text: opt.text || null,
          option_image_url: optImageUrl || null,
          is_correct: opt.isCorrect,
        })

        if (oError) throw oError
      }

      setSuccessMsg(
        mode === 'edit' ? '✅ Soal berhasil diperbarui!' : '✅ Soal berhasil disimpan!'
      )

      // Reset form jika tambah
      if (mode === 'tambah') {
        setQuestionText('')
        setQuestionType('single')
        setExplanation('')
        setQuestionImageFile(null)
        setQuestionImagePreview('')
        setOptions([
          { id: '1', text: '', imageUrl: '', imageFile: null, isCorrect: false },
          { id: '2', text: '', imageUrl: '', imageFile: null, isCorrect: false },
          { id: '3', text: '', imageUrl: '', imageFile: null, isCorrect: false },
          { id: '4', text: '', imageUrl: '', imageFile: null, isCorrect: false },
        ])
      }

      // Redirect ke daftar soal setelah 2 detik
      setTimeout(() => {
        router.push('/admin/soal')
      }, 2000)
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          marginBottom: '28px',
          color: 'white',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          {mode === 'edit' ? '✏️ Edit Soal' : '➕ Tambah Soal Baru'}
        </h1>
        <p style={{ opacity: 0.9, margin: '6px 0 0', fontSize: '14px' }}>
          {mode === 'edit'
            ? 'Perbaiki soal yang sudah ada'
            : 'Buat soal baru untuk ujian pilihan'}
        </p>
      </div>

      {successMsg && (
        <div
          style={{
            background: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            color: '#166534',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)',
          }}
        >
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div
          style={{
            background: '#fef2f2',
            border: '2px solid #fca5a5',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            color: '#991b1b',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Pilih Ujian */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
        }}
      >
        <label
          style={{
            fontWeight: 600,
            display: 'block',
            marginBottom: '8px',
            color: '#1e293b',
            fontSize: '14px',
          }}
        >
          📚 Pilih Ujian
        </label>
        <select
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '2px solid #e2e8f0',
            fontSize: '14px',
            background: '#fafafa',
            transition: 'all 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#667eea')}
          onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
        >
          <option value="">-- Pilih ujian --</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </select>
        {exams.length === 0 && (
          <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px' }}>
            Belum ada ujian. Buat ujian dulu di menu Ujian.
          </p>
        )}
      </div>

      {/* Form Soal */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📝 Teks Soal
        </h2>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={4}
          placeholder="Tulis soal di sini..."
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '2px solid #e2e8f0',
            fontSize: '15px',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            color: '#1e293b',
            transition: 'all 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#667eea')}
          onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
        />

        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
            Tipe Soal
          </label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as 'single' | 'multiple')}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '2px solid #e2e8f0',
              fontSize: '14px',
              background: '#fafafa',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#667eea')}
            onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
          >
            <option value="single">Pilihan Ganda (satu jawaban benar)</option>
            <option value="multiple">Pilihan Ganda (banyak jawaban benar)</option>
          </select>
        </div>

        {/* Gambar soal */}
        <div style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b', margin: '0 0 10px' }}>
            📎 Gambar soal (opsional)
          </p>
          {questionImagePreview ? (
            <div
              style={{
                position: 'relative',
                display: 'inline-block',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              <img
                src={questionImagePreview}
                alt="preview"
                style={{ maxWidth: '100%', maxHeight: '200px', display: 'block' }}
              />
              <button
                onClick={removeQuestionImage}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <div
              onClick={() => questionImageRef.current?.click()}
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                cursor: 'pointer',
                color: '#94a3b8',
                transition: 'all 0.3s',
                background: '#fafafa',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea'
                e.currentTarget.style.background = '#f0f0ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1'
                e.currentTarget.style.background = '#fafafa'
              }}
            >
              🖼️ Klik untuk upload gambar soal
            </div>
          )}
          <input
            ref={questionImageRef}
            type="file"
            accept="image/*"
            onChange={handleQuestionImage}
            style={{ display: 'none' }}
          />
        </div>

        {/* Pembahasan */}
        <div style={{ marginTop: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 600,
              fontSize: '14px',
              color: '#1e293b',
            }}
          >
            💡 Pembahasan (opsional)
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={3}
            placeholder="Tulis pembahasan untuk soal ini..."
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#667eea')}
            onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
          />
        </div>
      </div>

      {/* Pilihan Jawaban */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🔤 Pilihan Jawaban
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
          {questionType === 'single'
            ? 'Klik lingkaran untuk menandai jawaban benar (hanya satu)'
            : 'Klik lingkaran untuk menandai jawaban benar (bisa lebih dari satu)'}
        </p>

        {options.map((opt, idx) => (
          <div
            key={opt.id}
            style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
              marginBottom: '14px',
              padding: '16px',
              borderRadius: '12px',
              border: opt.isCorrect ? '2px solid #22c55e' : '1.5px solid #e2e8f0',
              background: opt.isCorrect ? '#f0fdf4' : '#fafafa',
              transition: 'all 0.2s',
              boxShadow: opt.isCorrect ? '0 4px 12px rgba(34, 197, 94, 0.15)' : 'none',
            }}
          >
            <button
              onClick={() => handleCorrectToggle(opt.id)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                flexShrink: 0,
                border: opt.isCorrect ? '2px solid #22c55e' : '2px solid #cbd5e1',
                background: opt.isCorrect ? '#22c55e' : 'white',
                color: opt.isCorrect ? 'white' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {opt.isCorrect ? '✓' : optionLabels[idx]}
            </button>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={opt.text}
                onChange={(e) => handleOptionText(opt.id, e.target.value)}
                placeholder={`Pilihan ${optionLabels[idx]}...`}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  color: '#1e293b',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#667eea')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
              {opt.imageUrl ? (
                <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                  <img
                    src={opt.imageUrl}
                    alt="pilihan"
                    style={{ maxHeight: '100px', borderRadius: '8px' }}
                  />
                  <button
                    onClick={() => removeOptionImage(opt.id)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#667eea')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleOptionImage(opt.id, e)}
                    style={{ display: 'none' }}
                  />
                  🖼️ Tambah gambar (opsional)
                </label>
              )}
            </div>
          </div>
        ))}

        {options.length < 6 && (
          <button
            onClick={() =>
              setOptions((prev) => [
                ...prev,
                { id: String(Date.now()), text: '', imageUrl: '', imageFile: null, isCorrect: false },
              ])
            }
            style={{
              padding: '12px 20px',
              background: 'white',
              border: '1.5px dashed #cbd5e1',
              borderRadius: '10px',
              width: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: '#64748b',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea'
              e.currentTarget.style.color = '#667eea'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1'
              e.currentTarget.style.color = '#64748b'
            }}
          >
            + Tambah pilihan
          </button>
        )}
      </div>

      {/* Tombol Aksi */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: '14px 40px',
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)',
            transition: 'all 0.3s',
            flex: '1 1 auto',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.45)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.35)'
            }
          }}
        >
          {loading ? 'Menyimpan...' : mode === 'edit' ? '💾 Perbarui Soal' : '💾 Simpan Soal'}
        </button>
        <button
          onClick={() => router.push('/admin/soal')}
          style={{
            padding: '14px 32px',
            background: 'white',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#667eea'
            e.currentTarget.style.color = '#667eea'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0'
            e.currentTarget.style.color = '#374151'
          }}
        >
          Batal
        </button>
      </div>
    </div>
  )
}
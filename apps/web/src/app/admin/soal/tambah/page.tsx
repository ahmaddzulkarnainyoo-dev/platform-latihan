'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

interface Option {
  id: string
  text: string
  imageUrl: string
  imageFile: File | null
  isCorrect: boolean
}

// Komponen internal yang menggunakan useSearchParams
function TambahSoalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [exams, setExams] = useState<any[]>([])
  const [examId, setExamId] = useState(searchParams.get('exam') || '')
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState<'single' | 'multiple'>('single')
  const [explanation, setExplanation] = useState('')
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null)
  const [questionImagePreview, setQuestionImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [options, setOptions] = useState<Option[]>([
    { id: '1', text: '', imageUrl: '', imageFile: null, isCorrect: false },
    { id: '2', text: '', imageUrl: '', imageFile: null, isCorrect: false },
    { id: '3', text: '', imageUrl: '', imageFile: null, isCorrect: false },
    { id: '4', text: '', imageUrl: '', imageFile: null, isCorrect: false },
  ])

  const questionImageRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadExams()
  }, [])

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
    setOptions(prev => prev.map(opt =>
      opt.id === optId
        ? { ...opt, imageFile: file, imageUrl: URL.createObjectURL(file) }
        : opt
    ))
  }

  const handleOptionText = (optId: string, value: string) => {
    setOptions(prev => prev.map(opt =>
      opt.id === optId ? { ...opt, text: value } : opt
    ))
  }

  const handleCorrectToggle = (optId: string) => {
    setOptions(prev => prev.map(opt => {
      if (opt.id !== optId) return opt
      if (questionType === 'single') {
        return { ...opt, isCorrect: true }
      } else {
        return { ...opt, isCorrect: !opt.isCorrect }
      }
    }))
    if (questionType === 'single') {
      setOptions(prev => prev.map(opt => ({
        ...opt,
        isCorrect: opt.id === optId
      })))
    }
  }

  const removeOptionImage = (optId: string) => {
    setOptions(prev => prev.map(opt =>
      opt.id === optId ? { ...opt, imageFile: null, imageUrl: '' } : opt
    ))
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
    if (!options.some(o => o.isCorrect)) {
      setErrorMsg('Pilih minimal satu jawaban yang benar!')
      return
    }
    if (options.every(o => !o.text.trim() && !o.imageFile)) {
      setErrorMsg('Minimal isi satu pilihan jawaban!')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      let questionImageUrl = ''
      if (questionImageFile) {
        const path = `questions/${Date.now()}-${questionImageFile.name}`
        questionImageUrl = await uploadImage(questionImageFile, path)
      }

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

      for (const opt of options) {
        if (!opt.text.trim() && !opt.imageFile) continue

        let optImageUrl = ''
        if (opt.imageFile) {
          const path = `options/${Date.now()}-${opt.imageFile.name}`
          optImageUrl = await uploadImage(opt.imageFile, path)
        }

        const { error: oError } = await supabase
          .from('question_options')
          .insert({
            question_id: question.id,
            option_text: opt.text || null,
            option_image_url: optImageUrl || null,
            is_correct: opt.isCorrect,
          })

        if (oError) throw oError
      }

      setSuccessMsg('Soal berhasil disimpan!')
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
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <div style={{ width: '240px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '24px 0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Platform Latihan</h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Admin Panel</p>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {[
            { label: 'Dashboard', icon: '🏠', href: '/admin' },
            { label: 'Kategori', icon: '📚', href: '/admin/kategori' },
            { label: 'Ujian', icon: '📝', href: '/admin/ujian' },
            { label: 'Soal', icon: '❓', href: '/admin/soal' },
            { label: 'Pengguna', icon: '👥', href: '/admin/pengguna' },
          ].map((item) => (
            <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: '#374151', textDecoration: 'none', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px', maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <a href="/admin/soal" style={{ padding: '8px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textDecoration: 'none', color: '#374151', fontSize: '14px' }}>← Kembali</a>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Tambah Soal Baru</h1>
        </div>

        {successMsg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', marginBottom: '20px', color: '#15803d' }}>✅ {successMsg}</div>}
        {errorMsg && <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px', marginBottom: '20px', color: '#dc2626' }}>⚠️ {errorMsg}</div>}

        {/* Pilih Ujian */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <label style={{ fontWeight: 500, display: 'block', marginBottom: '8px', color: '#1e293b' }}>📚 Pilih Ujian</label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
            <option value="">-- Pilih ujian --</option>
            {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
          </select>
          {exams.length === 0 && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px' }}>Belum ada ujian. Buat ujian dulu di menu Ujian.</p>}
        </div>

        {/* Form soal */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>📝 Teks Soal</h2>
          <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={4} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '15px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1e293b' }} />

          {/* Tipe Soal */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Tipe Soal</label>
            <select value={questionType} onChange={(e) => setQuestionType(e.target.value as 'single' | 'multiple')} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option value="single">Pilihan Ganda (satu jawaban benar)</option>
              <option value="multiple">Pilihan Ganda (banyak jawaban benar)</option>
            </select>
          </div>

          {/* Gambar soal */}
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px' }}>📎 Gambar soal (opsional)</p>
            {questionImagePreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={questionImagePreview} alt="preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px' }} />
                <button onClick={() => { setQuestionImageFile(null); setQuestionImagePreview('') }} style={{ position: 'absolute', top: '8px', right: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}>×</button>
              </div>
            ) : (
              <div onClick={() => questionImageRef.current?.click()} style={{ border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', color: '#94a3b8' }}>🖼️ Klik untuk upload gambar soal</div>
            )}
            <input ref={questionImageRef} type="file" accept="image/*" onChange={handleQuestionImage} style={{ display: 'none' }} />
          </div>

          {/* Pembahasan */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>💡 Pembahasan (opsional)</label>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={3} placeholder="Tulis pembahasan untuk soal ini..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
        </div>

        {/* Pilihan Jawaban */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>🔤 Pilihan Jawaban</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            {questionType === 'single' ? 'Klik lingkaran untuk menandai jawaban benar (hanya satu)' : 'Klik lingkaran untuk menandai jawaban benar (bisa lebih dari satu)'}
          </p>
          {options.map((opt, idx) => (
            <div key={opt.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px', padding: '16px', borderRadius: '12px', border: opt.isCorrect ? '2px solid #22c55e' : '1.5px solid #e2e8f0', background: opt.isCorrect ? '#f0fdf4' : '#fafafa' }}>
              <button onClick={() => handleCorrectToggle(opt.id)} style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, border: opt.isCorrect ? '2px solid #22c55e' : '2px solid #cbd5e1', background: opt.isCorrect ? '#22c55e' : 'white', color: opt.isCorrect ? 'white' : '#94a3b8', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {opt.isCorrect ? '✓' : optionLabels[idx]}
              </button>
              <div style={{ flex: 1 }}>
                <input type="text" value={opt.text} onChange={(e) => handleOptionText(opt.id, e.target.value)} placeholder={`Pilihan ${optionLabels[idx]}...`} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#1e293b' }} />
                {opt.imageUrl ? (
                  <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                    <img src={opt.imageUrl} alt="opt" style={{ maxHeight: '120px', borderRadius: '8px' }} />
                    <button onClick={() => removeOptionImage(opt.id)} style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>×</button>
                  </div>
                ) : (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
                    <input type="file" accept="image/*" onChange={(e) => handleOptionImage(opt.id, e)} style={{ display: 'none' }} />
                    🖼️ Tambah gambar (opsional)
                  </label>
                )}
              </div>
            </div>
          ))}
          {options.length < 6 && (
            <button onClick={() => setOptions(prev => [...prev, { id: String(Date.now()), text: '', imageUrl: '', imageFile: null, isCorrect: false }])} style={{ padding: '10px 20px', background: 'white', border: '1.5px dashed #cbd5e1', borderRadius: '10px', width: '100%', cursor: 'pointer' }}>+ Tambah pilihan</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '14px 32px', background: loading ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Menyimpan...' : '💾 Simpan Soal'}
          </button>
          <button onClick={() => router.push('/admin/soal')} style={{ padding: '14px 24px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer' }}>Batal</button>
        </div>
      </div>
    </div>
  )
}

// Halaman utama yang membungkus dengan Suspense
export default function TambahSoalPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat halaman...</div>}>
      <TambahSoalContent />
    </Suspense>
  )
}
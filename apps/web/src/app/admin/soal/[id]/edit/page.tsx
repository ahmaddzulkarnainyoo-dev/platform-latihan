'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

interface Option {
  id: string
  text: string
  imageUrl: string
  imageFile: File | null
  isCorrect: boolean
  existingId?: string
}

export default function EditSoal() {
  const router = useRouter()
  const params = useParams()
  const soalId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState<'single' | 'multiple'>('single')
  const [explanation, setExplanation] = useState('')
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null)
  const [questionImagePreview, setQuestionImagePreview] = useState('')
  const [existingQuestionImageUrl, setExistingQuestionImageUrl] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const questionImageRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadQuestionData()
  }, [])

  const loadQuestionData = async () => {
    setLoading(true)
    const { data: question } = await supabase
      .from('questions')
      .select('*')
      .eq('id', soalId)
      .single()
    if (!question) { setErrorMsg('Soal tidak ditemukan'); setLoading(false); return }
    setQuestionText(question.question_text || '')
    setQuestionType(question.question_type || 'single')
    setExplanation(question.explanation || '')
    if (question.question_image_url) {
      setExistingQuestionImageUrl(question.question_image_url)
      setQuestionImagePreview(question.question_image_url)
    }
    const { data: opts } = await supabase
      .from('question_options')
      .select('*')
      .eq('question_id', soalId)
      .order('created_at')
    if (opts && opts.length > 0) {
      const mapped = opts.map((opt, idx) => ({
        id: String(idx + 1),
        text: opt.option_text || '',
        imageUrl: opt.option_image_url || '',
        imageFile: null,
        isCorrect: opt.is_correct,
        existingId: opt.id,
      }))
      setOptions(mapped)
    } else {
      setOptions([
        { id: '1', text: '', imageUrl: '', imageFile: null, isCorrect: false },
        { id: '2', text: '', imageUrl: '', imageFile: null, isCorrect: false },
        { id: '3', text: '', imageUrl: '', imageFile: null, isCorrect: false },
        { id: '4', text: '', imageUrl: '', imageFile: null, isCorrect: false },
      ])
    }
    setLoading(false)
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
      opt.id === optId ? { ...opt, imageFile: file, imageUrl: URL.createObjectURL(file) } : opt
    ))
  }

  const handleOptionText = (optId: string, value: string) => {
    setOptions(prev => prev.map(opt => opt.id === optId ? { ...opt, text: value } : opt))
  }

  const handleCorrectToggle = (optId: string) => {
    if (questionType === 'single') {
      // Single: set this true, others false
      setOptions(prev => prev.map(opt => ({ ...opt, isCorrect: opt.id === optId })))
    } else {
      // Multiple: toggle
      setOptions(prev => prev.map(opt => opt.id === optId ? { ...opt, isCorrect: !opt.isCorrect } : opt))
    }
  }

  const removeOptionImage = (optId: string) => {
    setOptions(prev => prev.map(opt => opt.id === optId ? { ...opt, imageFile: null, imageUrl: '' } : opt))
  }

  const uploadImage = async (file: File, path: string) => {
    const { error } = await supabase.storage.from('question-media').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('question-media').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    if (!questionText.trim()) { setErrorMsg('Teks soal tidak boleh kosong!'); return }
    if (!options.some(o => o.isCorrect)) { setErrorMsg('Pilih minimal satu jawaban benar!'); return }
    if (options.every(o => !o.text.trim() && !o.imageFile && !o.imageUrl)) { setErrorMsg('Minimal isi satu pilihan!'); return }

    setSaving(true)
    setErrorMsg('')
    try {
      let finalImageUrl = existingQuestionImageUrl
      if (questionImageFile) {
        const path = `questions/${Date.now()}-${questionImageFile.name}`
        finalImageUrl = await uploadImage(questionImageFile, path)
      } else if (!questionImagePreview && existingQuestionImageUrl) {
        finalImageUrl = ''
      }
      await supabase.from('questions').update({
        question_text: questionText,
        question_image_url: finalImageUrl || null,
        question_type: questionType,
        explanation: explanation || null,
      }).eq('id', soalId)

      // Handle options
      for (const opt of options) {
        const isEmpty = !opt.text.trim() && !opt.imageFile && !opt.imageUrl
        if (isEmpty) continue
        let optImageUrl = opt.imageUrl
        if (opt.imageFile) {
          const path = `options/${Date.now()}-${opt.imageFile.name}`
          optImageUrl = await uploadImage(opt.imageFile, path)
        } else if (!opt.imageUrl && opt.existingId) {
          optImageUrl = ''
        }
        if (opt.existingId) {
          await supabase.from('question_options').update({
            option_text: opt.text || null,
            option_image_url: optImageUrl || null,
            is_correct: opt.isCorrect,
          }).eq('id', opt.existingId)
        } else {
          await supabase.from('question_options').insert({
            question_id: soalId,
            option_text: opt.text || null,
            option_image_url: optImageUrl || null,
            is_correct: opt.isCorrect,
          })
        }
      }
      const existingIds = options.filter(o => o.existingId).map(o => o.existingId)
      if (existingIds.length > 0) {
        await supabase.from('question_options').delete().eq('question_id', soalId).not('id', 'in', `(${existingIds.join(',')})`)
      }
      setSuccessMsg('Soal berhasil diperbarui!')
      setTimeout(() => router.push('/admin/soal'), 1500)
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']

  if (loading) return <div style={{ display: 'flex', minHeight: '100vh' }}><div style={{ flex: 1, padding: '32px' }}>Memuat...</div></div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar (salin dari halaman tambah) */}
      <div style={{ width: '240px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '24px 0' }}>...</div>
      <div style={{ flex: 1, padding: '32px', maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <a href="/admin/soal" style={{ padding: '8px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textDecoration: 'none' }}>← Kembali</a>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Edit Soal</h1>
        </div>
        {successMsg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', marginBottom: '20px', color: '#15803d' }}>✅ {successMsg}</div>}
        {errorMsg && <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px', marginBottom: '20px', color: '#dc2626' }}>⚠️ {errorMsg}</div>}

        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>📝 Teks Soal</h2>
          <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={4} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '15px', resize: 'vertical' }} />

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Tipe Soal</label>
            <select value={questionType} onChange={(e) => setQuestionType(e.target.value as 'single' | 'multiple')} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option value="single">Pilihan Ganda (satu jawaban benar)</option>
              <option value="multiple">Pilihan Ganda (banyak jawaban benar)</option>
            </select>
          </div>

          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '13px', color: '#64748b' }}>📎 Gambar soal (opsional)</p>
            {questionImagePreview ? (
              <div><img src={questionImagePreview} style={{ maxWidth: '100%', maxHeight: '200px' }} /><button onClick={() => { setQuestionImageFile(null); setQuestionImagePreview(''); setExistingQuestionImageUrl('') }}>Hapus</button></div>
            ) : (
              <div onClick={() => questionImageRef.current?.click()} style={{ border: '2px dashed #cbd5e1', padding: '24px', textAlign: 'center', cursor: 'pointer' }}>🖼️ Upload</div>
            )}
            <input ref={questionImageRef} type="file" accept="image/*" onChange={handleQuestionImage} style={{ display: 'none' }} />
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>💡 Pembahasan (opsional)</label>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={3} placeholder="Tulis pembahasan..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700 }}>🔤 Pilihan Jawaban</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>{questionType === 'single' ? 'Pilih satu jawaban benar' : 'Bisa pilih lebih dari satu (klik lingkaran)'}</p>
          {options.map((opt, idx) => (
            <div key={opt.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px', padding: '16px', borderRadius: '12px', border: opt.isCorrect ? '2px solid #22c55e' : '1.5px solid #e2e8f0', background: opt.isCorrect ? '#f0fdf4' : '#fafafa' }}>
              <button onClick={() => handleCorrectToggle(opt.id)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: opt.isCorrect ? '#22c55e' : 'white', border: opt.isCorrect ? '2px solid #22c55e' : '2px solid #cbd5e1', color: opt.isCorrect ? 'white' : '#94a3b8', cursor: 'pointer' }}>{opt.isCorrect ? '✓' : optionLabels[idx]}</button>
              <div style={{ flex: 1 }}>
                <input type="text" value={opt.text} onChange={(e) => handleOptionText(opt.id, e.target.value)} placeholder={`Pilihan ${optionLabels[idx]}...`} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                {opt.imageUrl ? (
                  <div><img src={opt.imageUrl} style={{ maxHeight: '100px' }} /><button onClick={() => removeOptionImage(opt.id)}>Hapus</button></div>
                ) : (
                  <label style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}><input type="file" accept="image/*" onChange={(e) => handleOptionImage(opt.id, e)} style={{ display: 'none' }} /> 🖼️ Tambah gambar</label>
                )}
              </div>
            </div>
          ))}
          {options.length < 6 && <button onClick={() => setOptions(prev => [...prev, { id: String(Date.now()), text: '', imageUrl: '', imageFile: null, isCorrect: false }])} style={{ width: '100%', padding: '10px', border: '1.5px dashed #cbd5e1', background: 'white', borderRadius: '10px', cursor: 'pointer' }}>+ Tambah pilihan</button>}
        </div>

        <button onClick={handleSubmit} disabled={saving} style={{ padding: '14px 32px', background: saving ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}</button>
      </div>
    </div>
  )
}
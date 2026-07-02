'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export default function EditUjian() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const ujianId = params.id as string

  const [categories, setCategories] = useState<any[]>([])
  const [attentionTests, setAttentionTests] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [passingScore, setPassingScore] = useState(70)
  const [isPublished, setIsPublished] = useState(false)
  const [attentionTestId, setAttentionTestId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    loadCategories()
    loadAttentionTests()
    loadExam()
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name')
    if (data) setCategories(data)
  }

  const loadAttentionTests = async () => {
    const { data } = await supabase
      .from('attention_tests')
      .select('id, title, item_type')
      .eq('is_published', true)
      .order('title')
    if (data) setAttentionTests(data)
  }

  const loadExam = async () => {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', ujianId)
      .single()

    if (error || !data) {
      setErrorMsg('Ujian tidak ditemukan')
      setLoading(false)
      return
    }

    setTitle(data.title)
    setCategoryId(data.category_id || '')
    setDurationMinutes(data.duration_minutes)
    setPassingScore(data.passing_score)
    setIsPublished(data.is_published)
    setAttentionTestId(data.attention_test_id || '')
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMsg('Judul ujian harus diisi')
      return
    }
    if (!categoryId) {
      setErrorMsg('Pilih kategori')
      return
    }
    if (durationMinutes < 1) {
      setErrorMsg('Durasi minimal 1 menit')
      return
    }
    if (passingScore < 0 || passingScore > 100) {
      setErrorMsg('Nilai kelulusan harus antara 0-100')
      return
    }

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    const { error } = await supabase
      .from('exams')
      .update({
        title,
        category_id: categoryId,
        duration_minutes: durationMinutes,
        passing_score: passingScore,
        is_published: isPublished,
        attention_test_id: attentionTestId || null,
      })
      .eq('id', ujianId)

    if (error) {
      setErrorMsg('Gagal menyimpan: ' + error.message)
    } else {
      setSuccessMsg('Ujian berhasil diperbarui!')
      setTimeout(() => router.push('/admin/ujian'), 1500)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        <AdminSidebar activePath="/admin/ujian" />
        <div style={{ flex: 1, padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#64748b' }}>Memuat data ujian...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <AdminSidebar activePath="/admin/ujian" />

      <div style={{ flex: 1, padding: '32px', maxWidth: '700px' }}>
        {/* Gradient Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '28px',
            color: 'white',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <a
            href="/admin/ujian"
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
          >
            ← Kembali
          </a>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
              ✏️ Edit Ujian
            </h1>
            <p style={{ opacity: 0.9, margin: 0, fontSize: '14px' }}>
              Perbarui informasi ujian yang sudah ada
            </p>
          </div>
        </div>

        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', color: '#166534', fontWeight: 500, boxShadow: '0 4px 12px rgba(34,197,94,0.15)' }}>
            ✅ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', color: '#991b1b', fontWeight: 500, boxShadow: '0 4px 12px rgba(239,68,68,0.15)' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Judul Ujian</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul ujian"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                color: '#1e293b',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                color: '#1e293b',
                background: 'white',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
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
              <option value="">-- Pilih kategori --</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Durasi (menit)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                color: '#1e293b',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Nilai Kelulusan (%)</label>
            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                color: '#1e293b',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
              🧠 Tes Kecermatan (Opsional)
            </label>
            <select
              value={attentionTestId}
              onChange={(e) => setAttentionTestId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                color: '#1e293b',
                background: 'white',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
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
              <option value="">-- Pilih tes kecermatan (opsional) --</option>
              {attentionTests.map(test => (
                <option key={test.id} value={test.id}>
                  {test.title} ({test.item_type})
                </option>
              ))}
            </select>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              Jika dipilih, ujian akan menggunakan tes kecermatan. Soal biasa tidak akan ditampilkan.
            </p>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Dipublikasikan (aktif)</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: '12px 32px',
                background: saving ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.45)'
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)'
                }
              }}
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <a
              href="/admin/ujian"
              style={{
                padding: '12px 28px',
                background: 'white',
                color: '#374151',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 500,
                textDecoration: 'none',
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
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
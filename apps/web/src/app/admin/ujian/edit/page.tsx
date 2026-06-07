'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

export default function EditUjian() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const ujianId = params.id as string

  const [categories, setCategories] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [passingScore, setPassingScore] = useState(70)
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    loadCategories()
    loadExam()
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name')
    if (data) setCategories(data)
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
        <div style={{ width: '240px', background: 'white', borderRight: '1px solid #e2e8f0' }}></div>
        <div style={{ flex: 1, padding: '32px' }}>Memuat data ujian...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar (sama seperti halaman lain) */}
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

      <div style={{ flex: 1, padding: '32px', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <a href="/admin/ujian" style={{ padding: '8px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', textDecoration: 'none', color: '#374151', fontSize: '14px' }}>← Kembali</a>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Edit Ujian</h1>
        </div>

        {successMsg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', marginBottom: '20px', color: '#15803d' }}>✅ {successMsg}</div>}
        {errorMsg && <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px', marginBottom: '20px', color: '#dc2626' }}>⚠️ {errorMsg}</div>}

        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Judul Ujian</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Kategori</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option value="">-- Pilih kategori --</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Durasi (menit)</label>
            <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Nilai Kelulusan (%)</label>
            <input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              <span>Dipublikasikan (aktif)</span>
            </label>
          </div>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: '12px 24px', background: saving ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
        </div>
      </div>
    </div>
  )
}
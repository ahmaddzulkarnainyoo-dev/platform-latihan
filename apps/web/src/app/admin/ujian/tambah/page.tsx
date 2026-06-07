'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TambahUjian() {
  const supabase = createClient()
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [passingScore, setPassingScore] = useState(70)
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name')
    if (data) setCategories(data)
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

    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.from('exams').insert({
      title,
      category_id: categoryId,
      duration_minutes: durationMinutes,
      passing_score: passingScore,
      is_published: isPublished,
    })

    if (error) {
      setErrorMsg('Gagal menyimpan: ' + error.message)
    } else {
      setSuccessMsg('Ujian berhasil dibuat!')
      setTimeout(() => router.push('/admin/ujian'), 1500)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar (sama) */}
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
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Buat Ujian Baru</h1>
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
            {categories.length === 0 && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px' }}>Belum ada kategori, buat dulu di menu Kategori.</p>}
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
              <span>Langsung dipublikasikan (aktif)</span>
            </label>
          </div>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '12px 24px', background: loading ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Menyimpan...' : 'Simpan Ujian'}</button>
        </div>
      </div>
    </div>
  )
}
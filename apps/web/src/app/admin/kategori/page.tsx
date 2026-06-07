'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function KategoriPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
    setLoading(false)
  }

  const openModal = (cat?: any) => {
    if (cat) {
      setEditingId(cat.id)
      setName(cat.name)
      setDescription(cat.description || '')
    } else {
      setEditingId(null)
      setName('')
      setDescription('')
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (editingId) {
      await supabase.from('categories').update({ name, description }).eq('id', editingId)
    } else {
      await supabase.from('categories').insert({ name, description })
    }
    await loadCategories()
    setShowModal(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin hapus kategori? Data ujian yang menggunakan kategori ini akan kehilangan referensi.')) {
      await supabase.from('categories').delete().eq('id', id)
      loadCategories()
    }
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
            <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: item.href === '/admin/kategori' ? '#2563eb' : '#374151', textDecoration: 'none', fontSize: '14px', marginBottom: '4px', fontWeight: 500, background: item.href === '/admin/kategori' ? '#eff6ff' : 'transparent' }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <div style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>📚 Kategori Ujian</h1>
          <button onClick={() => openModal()} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>+ Tambah Kategori</button>
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Memuat...</p>
        ) : categories.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>📭</p>
            <p style={{ color: '#64748b' }}>Belum ada kategori. Buat kategori pertama!</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Nama Kategori</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Deskripsi</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b' }}>{cat.name}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{cat.description || '-'}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button onClick={() => openModal(cat)} style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', marginRight: '8px', cursor: 'pointer' }}>✏️ Edit</button>
                      <button onClick={() => handleDelete(cat.id)} style={{ padding: '6px 12px', background: '#fee2e2', border: 'none', borderRadius: '6px', fontSize: '12px', color: '#dc2626', cursor: 'pointer' }}>🗑️ Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal sederhana */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Nama Kategori</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px' }} />
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Deskripsi (opsional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '24px' }} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
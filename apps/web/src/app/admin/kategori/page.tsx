'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminSidebar from '@/components/AdminSidebar'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function DaftarKategori() {
  const supabase = createClient()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')

  const loadCategories = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    if (data) setCategories(data)
    setLoading(false)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (!editingId) {
      setNewSlug(slugify(newName))
    }
  }, [newName, editingId])

  const handleAdd = async () => {
    if (!newName.trim()) {
      alert('Nama kategori tidak boleh kosong.')
      return
    }
    if (!newSlug.trim()) {
      alert('Slug tidak boleh kosong.')
      return
    }
    const exists = categories.some((c) => c.slug === newSlug)
    if (exists) {
      alert('Slug sudah digunakan. Gunakan slug lain.')
      return
    }

    setIsSubmitting(true)
    const { error } = await supabase.from('categories').insert({
      name: newName.trim(),
      slug: newSlug.trim(),
      is_active: true,
    })
    if (error) {
      alert('Gagal menambah kategori: ' + error.message)
    } else {
      setNewName('')
      setNewSlug('')
      loadCategories()
    }
    setIsSubmitting(false)
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !current })
      .eq('id', id)
    if (error) {
      alert('Gagal mengubah status: ' + error.message)
    } else {
      loadCategories()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus kategori ini? Ujian yang terkait akan kehilangan kategori (tidak terhapus).')) return

    const { data: exams, error: checkError } = await supabase
      .from('exams')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (checkError) {
      alert('Gagal memeriksa ujian: ' + checkError.message)
      return
    }

    if (exams && exams.length > 0) {
      alert('Kategori ini masih digunakan oleh ujian. Hapus ujian terlebih dahulu atau ubah kategorinya.')
      return
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      alert('Gagal hapus: ' + error.message)
    } else {
      loadCategories()
    }
  }

  const startEdit = (cat: any) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditSlug(cat.slug)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditSlug('')
  }

  const handleUpdate = async () => {
    if (!editName.trim()) {
      alert('Nama kategori tidak boleh kosong.')
      return
    }
    if (!editSlug.trim()) {
      alert('Slug tidak boleh kosong.')
      return
    }
    const exists = categories.some((c) => c.slug === editSlug && c.id !== editingId)
    if (exists) {
      alert('Slug sudah digunakan. Gunakan slug lain.')
      return
    }

    setIsSubmitting(true)
    const { error } = await supabase
      .from('categories')
      .update({ name: editName.trim(), slug: editSlug.trim() })
      .eq('id', editingId)

    if (error) {
      alert('Gagal update: ' + error.message)
    } else {
      loadCategories()
      cancelEdit()
    }
    setIsSubmitting(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <AdminSidebar activePath="/admin/kategori" />

      <div style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>📚 Daftar Kategori</h1>
        </div>

        {/* Form Tambah (inline) */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Nama Kategori</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contoh: CPNS 2025" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#1e293b' }} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Slug (URL)</label>
            <input type="text" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="contoh: cpns-2025" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#1e293b' }} />
          </div>
          <button onClick={handleAdd} disabled={isSubmitting} style={{ padding: '8px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', height: '40px', whiteSpace: 'nowrap' }}>
            + Tambah
          </button>
        </div>

        {/* Daftar Kategori */}
        {loading ? (
          <p style={{ color: '#64748b' }}>Memuat...</p>
        ) : categories.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>📭</p>
            <p style={{ color: '#64748b', fontSize: '15px' }}>Belum ada kategori. Tambahkan kategori pertama!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categories.map((cat) => {
              const isEditing = editingId === cat.id
              return (
                <div key={cat.id} style={{ background: 'white', borderRadius: '12px', padding: '16px 24px', border: isEditing ? '2px solid #2563eb' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  {isEditing ? (
                    <>
                      <div style={{ flex: 1, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 150px' }}>
                          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#1e293b' }} />
                        </div>
                        <div style={{ flex: '1 1 150px' }}>
                          <input type="text" value={editSlug} onChange={(e) => setEditSlug(e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#1e293b' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleUpdate} disabled={isSubmitting} style={{ padding: '6px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>💾 Simpan</button>
                        <button onClick={cancelEdit} style={{ padding: '6px 16px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Batal</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '16px', color: '#1e293b' }}>{cat.name}</span>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>/{cat.slug}</span>
                          <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: cat.is_active ? '#dcfce7' : '#f1f5f9', color: cat.is_active ? '#15803d' : '#64748b' }}>
                            {cat.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button onClick={() => handleToggleActive(cat.id, cat.is_active)} style={{ padding: '6px 14px', background: cat.is_active ? '#fee2e2' : '#dcfce7', color: cat.is_active ? '#dc2626' : '#15803d', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                          {cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button onClick={() => startEdit(cat)} style={{ padding: '6px 14px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDelete(cat.id)} style={{ padding: '6px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                          🗑️ Hapus
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
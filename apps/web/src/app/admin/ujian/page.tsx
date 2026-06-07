'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DaftarUjian() {
  const supabase = createClient()
  const router = useRouter()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*, categories(name)')
      .order('created_at', { ascending: false })
    if (data) setExams(data)
    setLoading(false)
  }

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('exams').update({ is_published: !current }).eq('id', id)
    loadExams()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus ujian ini? Semua soal dan jawaban peserta juga akan terhapus.')) return
    setDeletingId(id)
    const { error } = await supabase.from('exams').delete().eq('id', id)
    if (error) {
      alert('Gagal hapus: ' + error.message)
    } else {
      loadExams()
    }
    setDeletingId(null)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
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
            <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: item.href === '/admin/ujian' ? '#2563eb' : '#374151', textDecoration: 'none', fontSize: '14px', marginBottom: '4px', fontWeight: 500, background: item.href === '/admin/ujian' ? '#eff6ff' : 'transparent' }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <div style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>📝 Daftar Ujian</h1>
          <a href="/admin/ujian/tambah" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            + Buat Ujian Baru
          </a>
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Memuat...</p>
        ) : exams.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>📝</p>
            <p style={{ color: '#64748b', fontSize: '15px' }}>Belum ada ujian. Buat ujian pertama!</p>
            <a href="/admin/ujian/tambah" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 24px', background: '#2563eb', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>
              + Buat Sekarang
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {exams.map((exam) => (
              <div key={exam.id} style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{exam.title}</h3>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: exam.is_published ? '#dcfce7' : '#f1f5f9', color: exam.is_published ? '#15803d' : '#64748b' }}>
                      {exam.is_published ? 'Aktif' : 'Draft'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                    <span>📚 {exam.categories?.name || '-'}</span>
                    <span>⏱️ {exam.duration_minutes} menit</span>
                    <span>🎯 Lulus: {exam.passing_score}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <a href={`/admin/soal?exam=${exam.id}`} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#374151', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
                    ❓ Kelola Soal
                  </a>
                  <button
                    onClick={() => togglePublish(exam.id, exam.is_published)}
                    style={{ padding: '8px 14px', background: exam.is_published ? '#fee2e2' : '#dcfce7', color: exam.is_published ? '#dc2626' : '#15803d', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                  >
                    {exam.is_published ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <a href={`/admin/ujian/${exam.id}/edit`} style={{ padding: '8px 14px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
                    ✏️ Edit
                  </a>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    disabled={deletingId === exam.id}
                    style={{ padding: '8px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                  >
                    {deletingId === exam.id ? '...' : '🗑️ Hapus'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
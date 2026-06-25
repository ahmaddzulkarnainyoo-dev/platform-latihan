'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

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
      <AdminSidebar activePath="/admin/ujian" />

      <div style={{ flex: 1, padding: '32px' }}>
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
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              📝 Daftar Ujian
            </h1>
            <p style={{ opacity: 0.9, margin: 0, fontSize: '15px' }}>
              Kelola ujian tryout yang tersedia untuk peserta
            </p>
          </div>
          <a
            href="/admin/ujian/tambah"
            style={{
              padding: '12px 28px',
              background: 'white',
              color: '#667eea',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              transition: 'all 0.3s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'
            }}
          >
            + Buat Ujian Baru
          </a>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <p style={{ color: '#64748b' }}>Memuat...</p>
          </div>
        ) : exams.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>📝</p>
            <p style={{ color: '#64748b', fontSize: '15px' }}>Belum ada ujian. Buat ujian pertama!</p>
            <a
              href="/admin/ujian/tambah"
              style={{
                display: 'inline-block',
                marginTop: '16px',
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.45)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)'
              }}
            >
              + Buat Sekarang
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {exams.map((exam) => (
              <div
                key={exam.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.06)'
                  e.currentTarget.style.borderColor = '#667eea'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{exam.title}</h3>
                    <span
                      style={{
                        padding: '2px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: exam.is_published ? '#dcfce7' : '#f1f5f9',
                        color: exam.is_published ? '#15803d' : '#64748b',
                      }}
                    >
                      {exam.is_published ? 'Aktif' : 'Draft'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#64748b' }}>
                    <span>📚 {exam.categories?.name || '-'}</span>
                    <span>⏱️ {exam.duration_minutes} menit</span>
                    <span>🎯 Lulus: {exam.passing_score}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                  <a
                    href={`/admin/soal?exam=${exam.id}`}
                    style={{
                      padding: '8px 16px',
                      background: '#f1f5f9',
                      color: '#374151',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
                  >
                    ❓ Kelola Soal
                  </a>
                  <button
                    onClick={() => togglePublish(exam.id, exam.is_published)}
                    style={{
                      padding: '8px 16px',
                      background: exam.is_published ? '#fee2e2' : '#dcfce7',
                      color: exam.is_published ? '#dc2626' : '#15803d',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {exam.is_published ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <a
                    href={`/admin/ujian/${exam.id}/edit`}
                    style={{
                      padding: '8px 16px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff' }}
                  >
                    ✏️ Edit
                  </a>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    disabled={deletingId === exam.id}
                    style={{
                      padding: '8px 16px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: deletingId === exam.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
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
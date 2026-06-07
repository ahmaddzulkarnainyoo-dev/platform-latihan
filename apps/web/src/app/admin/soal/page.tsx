'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

// Komponen internal yang berisi logika utama
function DaftarSoalContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const examIdParam = searchParams.get('exam')

  const [exams, setExams] = useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>(examIdParam || '')
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  useEffect(() => {
    loadExams()
  }, [])

  useEffect(() => {
    if (selectedExamId) {
      loadQuestions()
    } else {
      setQuestions([])
      setTotalCount(0)
      setLoading(false)
    }
  }, [selectedExamId, page])

  const loadExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('id, title')
      .order('title')
    if (data) setExams(data)
  }

  const loadQuestions = async () => {
    if (!selectedExamId) return
    setLoading(true)

    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', selectedExamId)

    setTotalCount(count || 0)

    const { data } = await supabase
      .from('questions')
      .select(`
        *,
        question_options (id)
      `)
      .eq('exam_id', selectedExamId)
      .order('order_number', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (data) {
      setQuestions(data)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus soal ini? Semua pilihan jawaban juga akan terhapus.')) return
    setDeletingId(id)
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (!error) {
      loadQuestions()
    } else {
      alert('Gagal hapus: ' + error.message)
    }
    setDeletingId(null)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar (salin dari kode lama) */}
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
            <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: item.href === '/admin/soal' ? '#2563eb' : '#374151', textDecoration: 'none', fontSize: '14px', marginBottom: '4px', fontWeight: 500, background: item.href === '/admin/soal' ? '#eff6ff' : 'transparent' }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>❓ Daftar Soal</h1>
          {selectedExamId && (
            <a href={`/admin/soal/tambah?exam=${selectedExamId}`} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              + Tambah Soal
            </a>
          )}
        </div>

        {/* Filter Ujian */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontWeight: 500, marginRight: '12px', fontSize: '14px' }}>Pilih Ujian:</label>
          <select
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value)
              setPage(1)
              router.push(`/admin/soal?exam=${e.target.value}`)
            }}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minWidth: '250px' }}
          >
            <option value="">-- Pilih ujian --</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>{exam.title}</option>
            ))}
          </select>
        </div>

        {!selectedExamId && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>📌</p>
            <p style={{ color: '#64748b' }}>Pilih ujian terlebih dahulu untuk melihat daftar soal.</p>
          </div>
        )}

        {selectedExamId && loading && <p style={{ color: '#64748b' }}>Memuat...</p>}

        {selectedExamId && !loading && questions.length === 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>📭</p>
            <p style={{ color: '#64748b' }}>Belum ada soal untuk ujian ini.</p>
            <a href={`/admin/soal/tambah?exam=${selectedExamId}`} style={{ display: 'inline-block', marginTop: '16px', padding: '10px 24px', background: '#2563eb', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
              + Tambah Soal Pertama
            </a>
          </div>
        )}

        {selectedExamId && !loading && questions.length > 0 && (
          <>
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>No</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Soal</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Gambar</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Jumlah Pilihan</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, idx) => (
                    <tr key={q.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b' }}>{(page - 1) * pageSize + idx + 1}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b' }}>
                        <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {q.question_text || '(teks kosong)'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {q.question_image_url ? (
                          <img src={q.question_image_url} alt="soal" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>
                        {q.question_options?.length || 0}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <a
                            href={`/admin/soal/${q.id}/edit`}
                            style={{ padding: '6px 12px', background: '#f1f5f9', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', color: '#1e293b' }}
                          >
                            ✏️ Edit
                          </a>
                          <button
                            onClick={() => handleDelete(q.id)}
                            disabled={deletingId === q.id}
                            style={{ padding: '6px 12px', background: '#fee2e2', border: 'none', borderRadius: '6px', fontSize: '12px', color: '#dc2626', cursor: 'pointer' }}
                          >
                            {deletingId === q.id ? '...' : '🗑️ Hapus'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Sebelumnya
                </button>
                <span style={{ padding: '6px 12px', color: '#1e293b' }}>Halaman {page} dari {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Halaman utama dengan Suspense boundary
export default function DaftarSoalPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat...</div>}>
      <DaftarSoalContent />
    </Suspense>
  )
}
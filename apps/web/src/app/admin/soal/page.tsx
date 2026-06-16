'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

function DaftarSoalContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const examFilterParam = searchParams.get('exam') || ''

  const [soal, setSoal] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<{ id: string; title: string }[]>([])
  const [filterExamId, setFilterExamId] = useState(examFilterParam)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Load daftar ujian untuk filter
  useEffect(() => {
    const loadExams = async () => {
      const { data } = await supabase
        .from('exams')
        .select('id, title')
        .order('title')
      if (data) setExams(data)
    }
    loadExams()
  }, [])

  // Load soal dengan filter
  const loadSoal = async () => {
    setLoading(true)
    let query = supabase
      .from('questions')
      .select(`
        id,
        question_text,
        question_image_url,
        question_type,
        points,
        order_number,
        explanation,
        exam_id,
        exams ( title ),
        option_count: question_options ( count )
      `)
      .order('created_at', { ascending: false })

    if (filterExamId) {
      query = query.eq('exam_id', filterExamId)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error loading soal:', error)
      setSoal([])
    } else if (data) {
      // Transform data: option_count as number
      const transformed = data.map((item: any) => ({
        ...item,
        option_count: item.option_count?.[0]?.count || 0,
      }))
      setSoal(transformed)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSoal()
  }, [filterExamId])

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus soal ini? Semua pilihan jawaban juga akan terhapus.')) return
    setDeletingId(id)
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) {
      alert('Gagal hapus: ' + error.message)
    } else {
      loadSoal()
    }
    setDeletingId(null)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <AdminSidebar activePath="/admin/soal" />

      <div style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>❓ Daftar Soal</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={filterExamId}
              onChange={(e) => setFilterExamId(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}
            >
              <option value="">Semua Ujian</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
            <a href="/admin/soal/tambah" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              + Tambah Soal
            </a>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Memuat...</p>
        ) : soal.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>📭</p>
            <p style={{ color: '#64748b', fontSize: '15px' }}>
              {filterExamId ? 'Tidak ada soal untuk ujian ini.' : 'Belum ada soal. Tambahkan soal pertama!'}
            </p>
            <a href="/admin/soal/tambah" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 24px', background: '#2563eb', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>
              + Tambah Soal
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {soal.map((q) => (
              <div key={q.id} style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: q.question_type === 'single' ? '#dbeafe' : '#fef3c7', color: q.question_type === 'single' ? '#1d4ed8' : '#b45309' }}>
                      {q.question_type === 'single' ? 'Satu jawaban' : 'Banyak jawaban'}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>📚 {q.exams?.title || '(tanpa ujian)'}</span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>⭐ {q.points} poin</span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>🔢 {q.option_count} pilihan</span>
                  </div>
                  <div style={{ fontSize: '15px', color: '#1e293b', lineHeight: 1.5 }}>
                    {q.question_text}
                    {q.question_image_url && (
                      <img src={q.question_image_url} alt="gambar soal" style={{ maxHeight: '80px', marginTop: '8px', borderRadius: '6px', display: 'block' }} />
                    )}
                  </div>
                  {q.explanation && (
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>💡 {q.explanation}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <a href={`/admin/soal/${q.id}/edit`} style={{ padding: '8px 14px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
                    ✏️ Edit
                  </a>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deletingId === q.id}
                    style={{ padding: '8px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                  >
                    {deletingId === q.id ? '...' : '🗑️ Hapus'}
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

// Bungkus dengan Suspense karena pakai useSearchParams
export default function DaftarSoalPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat halaman...</div>}>
      <DaftarSoalContent />
    </Suspense>
  )
}
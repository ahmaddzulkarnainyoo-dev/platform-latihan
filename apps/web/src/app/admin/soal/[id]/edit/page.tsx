'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import SoalForm from '@/components/soalform'

function EditSoalContent() {
  const supabase = createClient()
  const params = useParams()
  const soalId = params.id as string

  const [loading, setLoading] = useState(true)
  const [soalData, setSoalData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSoal()
  }, [])

  const loadSoal = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select(`
        id,
        exam_id,
        question_text,
        question_image_url,
        question_type,
        explanation,
        question_options (
          id,
          option_text,
          option_image_url,
          is_correct
        )
      `)
      .eq('id', soalId)
      .single()

    if (error) {
      setError('Soal tidak ditemukan: ' + error.message)
      setLoading(false)
      return
    }

    if (data) {
      setSoalData({
        id: data.id,
        exam_id: data.exam_id,
        question_text: data.question_text,
        question_image_url: data.question_image_url,
        question_type: data.question_type,
        explanation: data.explanation,
        options: data.question_options.map((opt: any) => ({
          id: opt.id,
          text: opt.option_text || '',
          imageUrl: opt.option_image_url || '',
          imageFile: null,
          isCorrect: opt.is_correct,
        })),
      })
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        <AdminSidebar activePath="/admin/soal" />
        <div style={{ flex: 1, padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#64748b' }}>Memuat soal...</p>
        </div>
      </div>
    )
  }

  if (error || !soalData) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        <AdminSidebar activePath="/admin/soal" />
        <div style={{ flex: 1, padding: '32px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>😕</p>
            <p style={{ color: '#dc2626', fontSize: '16px' }}>{error || 'Soal tidak ditemukan'}</p>
            <a href="/admin/soal" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 24px', background: '#2563eb', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
              Kembali ke Daftar Soal
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <AdminSidebar activePath="/admin/soal" />
      <div style={{ flex: 1, padding: '32px' }}>
        <SoalForm mode="edit" initialData={soalData} />
      </div>
    </div>
  )
}

export default function EditSoalPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat halaman...</div>}>
      <EditSoalContent />
    </Suspense>
  )
}
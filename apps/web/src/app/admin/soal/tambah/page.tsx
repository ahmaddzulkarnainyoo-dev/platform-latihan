'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import SoalForm from '@/components/soalform'   // <- pastikan path ini benar

function TambahSoalContent() {
  const searchParams = useSearchParams()
  const examId = searchParams.get('exam') || ''

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <AdminSidebar activePath="/admin/soal" />
      <div style={{ flex: 1, padding: '32px' }}>
        <SoalForm mode="tambah" examId={examId} />
      </div>
    </div>
  )
}

export default function TambahSoalPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat halaman...</div>}>
      <TambahSoalContent />
    </Suspense>
  )
}
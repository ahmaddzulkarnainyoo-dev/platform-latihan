'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RedirectTambahKategori() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/kategori')
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Mengalihkan...</p>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminSidebar from '@/components/AdminSidebar'
import Link from 'next/link'

export default function AttentionTestsPage() {
  const supabase = createClient()
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTests()
  }, [])

  const loadTests = async () => {
    const { data } = await supabase
      .from('attention_tests')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setTests(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus tes ini?')) return
    const { error } = await supabase.from('attention_tests').delete().eq('id', id)
    if (error) {
      alert('Gagal hapus: ' + error.message)
    } else {
      loadTests()
    }
  }

  const togglePublish = async (id: string, current: boolean) => {
    await supabase
      .from('attention_tests')
      .update({ is_published: !current })
      .eq('id', id)
    loadTests()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <AdminSidebar activePath="/admin/attention-tests" />

      <div style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            🧠 Tes Kecermatan
          </h1>
          <Link
            href="/admin/attention-tests/tambah"
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(102,126,234,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102,126,234,0.3)'
            }}
          >
            + Buat Tes Baru
          </Link>
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Memuat...</p>
        ) : tests.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '40px', margin: '0 0 16px' }}>🧠</p>
            <p style={{ color: '#64748b', fontSize: '15px' }}>Belum ada tes kecermatan. Buat tes pertama!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tests.map((test) => (
              <div
                key={test.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                      {test.title}
                    </h3>
                    <span
                      style={{
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: test.is_published ? '#dcfce7' : '#f1f5f9',
                        color: test.is_published ? '#15803d' : '#64748b',
                      }}
                    >
                      {test.is_published ? 'Aktif' : 'Draft'}
                    </span>
                    <span
                      style={{
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: '#e0e7ff',
                        color: '#4338ca',
                      }}
                    >
                      {test.item_type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                    <span>{test.display_count} item tampil</span>
                    <span>{test.missing_count} hilang</span>
                    <span>⏱️ {test.time_limit}s</span>
                    <span>🎯 passing {test.passing_score}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => togglePublish(test.id, test.is_published)}
                    style={{
                      padding: '6px 14px',
                      background: test.is_published ? '#fee2e2' : '#dcfce7',
                      color: test.is_published ? '#dc2626' : '#15803d',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {test.is_published ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <Link
                    href={`/admin/attention-tests/${test.id}/edit`}
                    style={{
                      padding: '6px 14px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(test.id)}
                    style={{
                      padding: '6px 14px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    🗑️ Hapus
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
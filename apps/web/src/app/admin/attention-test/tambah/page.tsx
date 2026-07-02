'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export default function TambahAttentionTest() {
  const supabase = createClient()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [itemType, setItemType] = useState('huruf')
  const [itemsInput, setItemsInput] = useState('A,B,C,D,E')
  const [displayCount, setDisplayCount] = useState(5)
  const [missingCount, setMissingCount] = useState(1)
  const [timeLimit, setTimeLimit] = useState(60)
  const [passingScore, setPassingScore] = useState(70)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Parsing items
    const items = itemsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    if (items.length === 0) {
      setError('Items tidak boleh kosong.')
      return
    }
    if (displayCount > items.length) {
      setError('Jumlah tampil tidak boleh lebih dari total items.')
      return
    }
    if (missingCount > displayCount) {
      setError('Jumlah hilang tidak boleh lebih dari jumlah tampil.')
      return
    }

    setLoading(true)

    const { error: insertError } = await supabase.from('attention_tests').insert({
      title,
      description: description || null,
      instructions: instructions || null,
      item_type: itemType,
      items,
      display_count: displayCount,
      missing_count: missingCount,
      time_limit: timeLimit,
      passing_score: passingScore,
      is_published: true,
    })

    if (insertError) {
      setError('Gagal menyimpan: ' + insertError.message)
      setLoading(false)
      return
    }

    router.push('/admin/attention-tests')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <AdminSidebar activePath="/admin/attention-tests" />

      <div style={{ flex: 1, padding: '32px', maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <a
            href="/admin/attention-tests"
            style={{
              padding: '8px 12px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#374151',
              fontSize: '14px',
            }}
          >
            ← Kembali
          </a>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            + Tes Kecermatan Baru
          </h1>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '20px',
              color: '#dc2626',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
              Judul Tes *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Contoh: Tes Kecermatan Huruf"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                color: '#1e293b',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
              Deskripsi (opsional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Deskripsi singkat tentang tes ini"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                color: '#1e293b',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
              Instruksi / Panduan (bisa HTML untuk video/link/gambar)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="Contoh: Hafalkan huruf di atas, lalu cari huruf yang hilang.&#10;&lt;img src='...' /&gt;&#10;&lt;iframe src='...'&gt;&lt;/iframe&gt;"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical',
                color: '#1e293b',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
              Tipe Item *
            </label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                color: '#1e293b',
                background: 'white',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <option value="huruf">Huruf</option>
              <option value="angka">Angka</option>
              <option value="kata">Kata</option>
              <option value="gambar">Gambar</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
              Items (pisahkan dengan koma) *
            </label>
            <input
              type="text"
              value={itemsInput}
              onChange={(e) => setItemsInput(e.target.value)}
              required
              placeholder="A,B,C,D,E"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                color: '#1e293b',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
            />
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              {itemType === 'gambar' ? 'Masukkan URL gambar (pisahkan koma)' : 'Pisahkan dengan koma (,)'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
                Jumlah Tampil *
              </label>
              <input
                type="number"
                value={displayCount}
                onChange={(e) => setDisplayCount(Number(e.target.value))}
                required
                min={2}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  color: '#1e293b',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
                Jumlah Hilang *
              </label>
              <input
                type="number"
                value={missingCount}
                onChange={(e) => setMissingCount(Number(e.target.value))}
                required
                min={1}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  color: '#1e293b',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
                Durasi (detik) *
              </label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                required
                min={10}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  color: '#1e293b',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
                Nilai Kelulusan (%) *
              </label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                required
                min={0}
                max={100}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  color: '#1e293b',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.12)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 32px',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(102,126,234,0.35)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(102,126,234,0.45)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102,126,234,0.35)'
                }
              }}
            >
              {loading ? 'Menyimpan...' : '💾 Simpan Tes'}
            </button>
            <a
              href="/admin/attention-tests"
              style={{
                padding: '14px 24px',
                background: 'white',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                textDecoration: 'none',
                color: '#374151',
                fontSize: '15px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea'
                e.currentTarget.style.color = '#667eea'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.color = '#374151'
              }}
            >
              Batal
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
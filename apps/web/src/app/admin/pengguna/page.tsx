'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  avatar_url: string
  is_active: boolean
  created_at: string
  last_sign_in_at: string | null
  confirmed_at: string | null
}

export default function AdminPenggunaPage() {
  const supabase = createClient()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('user')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      if (data.users) {
        setUsers(data.users)
      } else {
        setError('Gagal memuat data pengguna')
      }
    } catch (err) {
      setError('Gagal memuat data pengguna')
      console.error(err)
    }
    setLoading(false)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setEditName(user.full_name)
    setEditRole(user.role)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    setSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          full_name: editName,
          role: editRole,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setSuccessMessage('Data pengguna berhasil diperbarui')
        setEditingUser(null)
        loadUsers()
      } else {
        setError(data.error || 'Gagal memperbarui data')
      }
    } catch (err) {
      setError('Gagal memperbarui data')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.')) return

    setDeletingId(id)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        setSuccessMessage('Pengguna berhasil dihapus')
        loadUsers()
      } else {
        setError(data.error || 'Gagal menghapus pengguna')
      }
    } catch (err) {
      setError('Gagal menghapus pengguna')
    }
    setDeletingId(null)
  }

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase()
    return (
      user.full_name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <AdminSidebar activePath="/admin/pengguna" />

      <div style={{ flex: 1, padding: '32px' }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '28px',
            color: 'white',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
          }}
        >
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
            👥 Manajemen Pengguna
          </h1>
          <p style={{ opacity: 0.9, margin: 0, fontSize: '15px' }}>
            Kelola semua pengguna platform (total: {users.length})
          </p>
        </div>

        {/* Search & Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'white',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              padding: '0 14px',
              flex: 1,
              maxWidth: '400px',
            }}
          >
            <span style={{ fontSize: '18px', color: '#94a3b8', marginRight: '10px' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau email..."
              style={{
                width: '100%',
                padding: '12px 0',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: '#1e293b',
                background: 'transparent',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <button
            onClick={() => loadUsers()}
            style={{
              padding: '12px 24px',
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#1e293b',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea'
              e.currentTarget.style.color = '#667eea'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0'
              e.currentTarget.style.color = '#1e293b'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#991b1b',
              fontSize: '13px',
            }}
          >
            <span>⚠️</span> {error}
          </div>
        )}
        {successMessage && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#166534',
              fontSize: '13px',
            }}
          >
            <span>✅</span> {successMessage}
          </div>
        )}

        {/* Table */}
        <div
          style={{
            background: 'white',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          }}
        >
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              Memuat data...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              {searchQuery ? 'Tidak ada pengguna yang cocok dengan pencarian.' : 'Belum ada pengguna.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={thStyle}>No</th>
                  <th style={thStyle}>Nama</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Tanggal Bergabung</th>
                  <th style={thStyle}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdStyle}>{index + 1}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {user.full_name.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span style={{ fontWeight: 500, color: '#1e293b' }}>
                          {user.full_name || '-'}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: '#64748b' }}>{user.email}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: user.role === 'admin' ? '#f0f4ff' : '#f0fdf4',
                          color: user.role === 'admin' ? '#1e40af' : '#166534',
                        }}
                      >
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: user.is_active ? '#f0fdf4' : '#fef2f2',
                          color: user.is_active ? '#15803d' : '#dc2626',
                        }}
                      >
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#64748b', fontSize: '13px' }}>
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(user)}
                          style={{
                            padding: '6px 14px',
                            border: '1px solid #667eea',
                            background: 'white',
                            borderRadius: '8px',
                            color: '#667eea',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#667eea'
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white'
                            e.currentTarget.style.color = '#667eea'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          style={{
                            padding: '6px 14px',
                            border: '1px solid #ef4444',
                            background: 'white',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: deletingId === user.id ? 'not-allowed' : 'pointer',
                            opacity: deletingId === user.id ? 0.6 : 1,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (deletingId !== user.id) {
                              e.currentTarget.style.background = '#ef4444'
                              e.currentTarget.style.color = 'white'
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white'
                            e.currentTarget.style.color = '#ef4444'
                          }}
                        >
                          {deletingId === user.id ? '...' : '🗑️ Hapus'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingUser(null)
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
              animation: 'fadeInUp 0.3s ease-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                ✏️ Edit Pengguna
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                Nama Lengkap
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#1e293b',
                  outline: 'none',
                  background: 'white',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#667eea')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                Role
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#1e293b',
                  outline: 'none',
                  background: 'white',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#667eea')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setEditingUser(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  background: 'white',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#94a3b8')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'white',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {saving ? 'Menyimpan...' : '💾 Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '14px 18px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '14px 18px',
  fontSize: '14px',
  color: '#1e293b',
}
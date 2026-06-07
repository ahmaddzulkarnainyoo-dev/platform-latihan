'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  const navItems = [
    { label: 'Dashboard', icon: '🏠', href: '/admin' },
    { label: 'Kategori', icon: '📚', href: '/admin/kategori' },
    { label: 'Ujian', icon: '📝', href: '/admin/ujian' },
    { label: 'Soal', icon: '❓', href: '/admin/soal' },
    { label: 'Pengguna', icon: '👥', href: '/admin/pengguna' },
  ]

  const stats = [
    { label: 'Total Kategori', value: '3', icon: '📚', bg: '#dbeafe', color: '#1d4ed8' },
    { label: 'Total Ujian', value: '0', icon: '📝', bg: '#dcfce7', color: '#15803d' },
    { label: 'Total Soal', value: '0', icon: '❓', bg: '#fef9c3', color: '#a16207' },
  ]

  const quickActions = [
    { label: '+ Tambah Soal', href: '/admin/soal/tambah', bg: '#2563eb' },
    { label: '+ Buat Ujian', href: '/admin/ujian/tambah', bg: '#16a34a' },
    { label: '+ Tambah Kategori', href: '/admin/kategori/tambah', bg: '#9333ea' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>

      {/* Sidebar */}
      <div style={{
        width: '240px',
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Platform Latihan
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Admin Panel</p>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                color: '#374151',
                textDecoration: 'none',
                fontSize: '14px',
                marginBottom: '4px',
                fontWeight: 500,
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', wordBreak: 'break-all' }}>
            {user.email}
          </p>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px',
              background: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
          Selamat datang! 👋
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px', marginTop: 0 }}>
          Kelola soal, ujian, dan pengguna dari sini.
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: stat.bg,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                marginBottom: '12px',
              }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '16px', marginTop: 0 }}>
            Aksi cepat
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {quickActions.map((action) => (
              <a
                key={action.href}
                href={action.href}
                style={{
                  padding: '10px 20px',
                  background: action.bg,
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
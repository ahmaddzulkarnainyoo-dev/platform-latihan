'use client'

interface AdminSidebarProps {
  activePath?: string
}

export default function AdminSidebar({ activePath = '' }: AdminSidebarProps) {
  const menuItems = [
    { label: 'Dashboard', icon: '🏠', href: '/admin' },
    { label: 'Kategori', icon: '📚', href: '/admin/kategori' },
    { label: 'Ujian', icon: '📝', href: '/admin/ujian' },
    { label: 'Soal', icon: '❓', href: '/admin/soal' },
    { label: 'Pengguna', icon: '👥', href: '/admin/pengguna' },
  ]

  return (
    <div
      style={{
        width: '260px',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderRight: '1px solid #e2e8f0',
        padding: '28px 0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        boxShadow: '2px 0 12px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ padding: '0 24px 28px', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
          🎯 Platform Latihan
        </h2>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0', fontWeight: 500 }}>Admin Panel</p>
      </div>
      <nav style={{ padding: '20px 16px', flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = activePath === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                color: isActive ? '#1e293b' : '#475569',
                textDecoration: 'none',
                fontSize: '14px',
                marginBottom: '4px',
                fontWeight: 600,
                background: isActive ? '#e2e8f0' : 'transparent',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f1f5f9'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>
      <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#94a3b8' }}>
        v1.0.0 • Demo
      </div>
    </div>
  )
}
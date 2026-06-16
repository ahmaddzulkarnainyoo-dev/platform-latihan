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
        width: '240px',
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Platform Latihan
        </h2>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Admin Panel</p>
      </div>
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = activePath === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                color: isActive ? '#2563eb' : '#374151',
                textDecoration: 'none',
                fontSize: '14px',
                marginBottom: '4px',
                fontWeight: 500,
                background: isActive ? '#eff6ff' : 'transparent',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
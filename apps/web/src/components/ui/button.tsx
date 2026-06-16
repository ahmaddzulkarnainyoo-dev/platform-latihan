interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export default function Button({ children, variant = 'primary', onClick, disabled = false }: ButtonProps) {
  const colors = {
    primary: { bg: '#2563eb', hover: '#1d4ed8', text: 'white' },
    secondary: { bg: '#e2e8f0', hover: '#cbd5e1', text: '#1e293b' },
    danger: { bg: '#ef4444', hover: '#dc2626', text: 'white' },
    success: { bg: '#22c55e', hover: '#16a34a', text: 'white' },
  }
  const color = colors[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 20px',
        background: disabled ? '#94a3b8' : color.bg,
        color: color.text,
        border: 'none',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = color.hover
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = color.bg
        }
      }}
    >
      {children}
    </button>
  )
}
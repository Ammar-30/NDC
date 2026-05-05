export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '52px 28px',
      gap: 10,
    }}>
      {Icon && (
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'rgba(107,114,128,0.08)',
          border: '1px solid rgba(107,114,128,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 4,
        }}>
          <Icon size={24} style={{ color: 'var(--text4)' }} />
        </div>
      )}
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)', margin: 0 }}>{title}</p>
      {subtitle && (
        <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0, textAlign: 'center', maxWidth: 280 }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

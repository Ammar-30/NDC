export default function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '52px 24px',
      gap: 14,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        border: '3px solid rgba(22,163,74,0.15)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.75s linear infinite',
      }} />
      <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>Loading…</span>
    </div>
  )
}

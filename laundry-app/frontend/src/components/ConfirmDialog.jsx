export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  danger = false,
}) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,15,30,0.45)',
      backdropFilter: 'blur(6px)',
      zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.80)',
        borderRadius: 20,
        padding: 28,
        maxWidth: 380, width: '100%',
        boxShadow: '0 24px 64px rgba(10,15,30,0.15), 0 1px 0 rgba(255,255,255,0.9) inset',
      }}
        className="scale-in"
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 22px', color: 'var(--text2)', fontSize: 14, lineHeight: 1.55 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.68)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.72)',
              color: 'var(--text2)',
              cursor: 'pointer',
              fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
              transition: 'box-shadow 0.18s ease',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              border: 'none',
              background: danger
                ? 'linear-gradient(135deg, #EF4444, #f87171)'
                : 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
              boxShadow: danger
                ? '0 4px 14px rgba(239,68,68,0.30)'
                : '0 4px 14px rgba(22,163,74,0.30)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

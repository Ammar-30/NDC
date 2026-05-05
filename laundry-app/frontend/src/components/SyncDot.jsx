const SYNC_CONFIG = {
  synced:  {
    color: '#065f46',
    bg: 'linear-gradient(135deg, rgba(236,253,245,0.94) 0%, rgba(209,250,229,0.94) 100%)',
    border: 'rgba(5,150,105,0.34)',
    label: 'Synced',
    shadow: '0 2px 10px rgba(5,150,105,0.18), inset 0 1px 0 rgba(255,255,255,0.82)',
    dot: '#059669',
  },
  syncing: { color: '#d97706', bg: 'rgba(217,119,6,0.10)',    border: 'rgba(217,119,6,0.20)',    label: 'Syncing…' },
  offline: { color: '#6B7280', bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.18)', label: 'Offline' },
  error:   { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',    border: 'rgba(239,68,68,0.20)',    label: 'Sync error' },
}

export default function SyncDot({ status = 'offline' }) {
  const cfg = SYNC_CONFIG[status] || SYNC_CONFIG.offline
  const isPulsing = status === 'syncing'
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 20,
      backdropFilter: 'blur(8px)',
      boxShadow: cfg.shadow || 'none',
    }}>
      <span
        className={isPulsing ? 'pulse-sync' : ''}
        style={{
          width: 7, height: 7, borderRadius: '50%',
          background: cfg.dot || cfg.color,
          flexShrink: 0,
          display: 'block',
          boxShadow: status === 'synced' ? '0 0 0 2px rgba(16,185,129,0.14)' : 'none',
        }}
      />
      <span style={{
        fontSize: 11,
        fontWeight: status === 'synced' ? 700 : 600,
        letterSpacing: status === 'synced' ? '0.02em' : '0',
        color: cfg.color,
      }}>
        {cfg.label}
      </span>
    </div>
  )
}

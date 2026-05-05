const STATUS_CONFIG = {
  received: {
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.20)',
    color: '#1d4ed8',
    dot: '#3B82F6',
    label: 'Received',
  },
  washing: {
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.22)',
    color: '#b45309',
    dot: '#F59E0B',
    label: 'Washing',
  },
  ready: {
    bg: 'rgba(15,118,110,0.10)',
    border: 'rgba(15,118,110,0.22)',
    color: '#0f766e',
    dot: '#0f766e',
    label: 'Ready',
  },
  delivered: {
    bg: 'rgba(107,114,128,0.10)',
    border: 'rgba(107,114,128,0.18)',
    color: '#4B5563',
    dot: '#9CA3AF',
    label: 'Delivered',
  },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.received
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      padding: '3px 9px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.dot, flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  )
}

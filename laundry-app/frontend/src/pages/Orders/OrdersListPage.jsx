import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingBag, Search } from 'lucide-react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { getOrders } from '../../utils/api'
import { formatPhoneDisplay } from '../../utils/phone'
import toast from 'react-hot-toast'

const glass = {
  background: 'rgba(255,255,255,0.68)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.72)',
  boxShadow: '0 4px 24px rgba(10,15,30,0.07), 0 1px 0 rgba(255,255,255,0.80) inset',
}

const FILTER_TABS = [
  { key: 'all',       label: 'All',       value: undefined  },
  { key: 'received',  label: 'Received',  value: 'received' },
  { key: 'washing',   label: 'Washing',   value: 'washing'  },
  { key: 'ready',     label: 'Ready',     value: 'ready'    },
  { key: 'delivered', label: 'Delivered', value: 'delivered'},
]

function timeAgo(input) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(input).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function OrderRow({ order, isLast, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 18px', cursor: 'pointer',
        borderBottom: isLast ? 'none' : '1px solid rgba(10,15,30,0.06)',
        background: hovered ? 'rgba(22,163,74,0.04)' : 'transparent',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
        color: 'var(--accent)', minWidth: 128,
        letterSpacing: '0.03em', flexShrink: 0,
      }}>
        {order.token}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
          {order.customer_name}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text3)', lineHeight: 1.3 }}>
          {formatPhoneDisplay(order.customer_phone)}
        </p>
      </div>
      <div style={{ flexShrink: 0 }}>
        <StatusBadge status={order.status} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 60, textAlign: 'right', flexShrink: 0 }}>
        {timeAgo(order.created_at || order.drop_off_at)}
      </span>
      <span style={{
        fontSize: 13, fontWeight: 700,
        color: 'var(--text)', minWidth: 80,
        textAlign: 'right', flexShrink: 0,
      }}>
        Rs.&nbsp;{Number(order.total_pkr).toLocaleString()}
      </span>
    </div>
  )
}

export default function OrdersListPage() {
  const navigate = useNavigate()
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchOrders = useCallback(async ({ statusKey, search, showLoading } = {}) => {
    if (showLoading) setLoading(true)
    try {
      const tab = FILTER_TABS.find(t => t.key === (statusKey || activeFilter))
      const params = {}
      if (tab?.value) params.status = tab.value
      if (search !== undefined ? search : searchQuery) params.search = search !== undefined ? search : searchQuery
      const data = await getOrders(params)
      setOrders(data.orders || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load orders')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [activeFilter, searchQuery])

  useEffect(() => {
    fetchOrders({ showLoading: true, statusKey: 'all', search: '' })
  }, [fetchOrders])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders({ showLoading: true, statusKey: activeFilter, search: searchQuery })
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, activeFilter, fetchOrders])

  const action = (
    <button
      onClick={() => navigate('/staff/orders/new')}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 16px',
        background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
        color: 'white', border: 'none', borderRadius: 10,
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: '0 4px 14px rgba(22,163,74,0.30)',
        transition: 'box-shadow 0.18s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,163,74,0.40)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.30)'}
    >
      <Plus size={15} />
      New Order
    </button>
  )

  return (
    <AuthenticatedLayout title="Orders" subtitle="All dry cleaning orders" action={action}>

      {/* Filter tabs */}
      <div style={{
        ...glass,
        borderRadius: '14px 14px 0 0',
        display: 'flex', gap: 0,
        padding: '0 6px',
        overflow: 'auto',
        borderBottom: '1px solid rgba(10,15,30,0.06)',
        marginBottom: 0,
      }}>
        {FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                padding: '13px 14px',
                background: 'none', border: 'none',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                color: isActive ? 'var(--accent)' : 'var(--text3)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s ease',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', margin: '0 0 14px' }}>
        <Search size={14} style={{
          position: 'absolute', left: 14, top: '50%',
          transform: 'translateY(-50%)', color: 'var(--text3)',
        }} />
        <input
          type="text"
          placeholder="Search by token or customer…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 14px 11px 38px',
            background: 'rgba(255,255,255,0.68)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.72)',
            borderRadius: '0 0 14px 14px',
            borderTop: 'none',
            fontSize: 13, outline: 'none',
            fontFamily: 'inherit',
            color: 'var(--text)',
            boxSizing: 'border-box',
            transition: 'box-shadow 0.18s ease',
          }}
          onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.10)'}
          onBlur={e => e.target.style.boxShadow = 'none'}
        />
      </div>

      {/* Orders list */}
      <div style={{ ...glass, borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders found"
            subtitle="No results match the selected filter"
          />
        ) : (
          orders.map((order, i) => (
            <OrderRow
              key={order.id}
              order={order}
              isLast={i === orders.length - 1}
              onClick={() => navigate(`/staff/orders/${order.id}`)}
            />
          ))
        )}
      </div>
    </AuthenticatedLayout>
  )
}

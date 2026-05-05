import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingBag, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
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
  borderRadius: 18,
  boxShadow: '0 4px 24px rgba(10,15,30,0.07), 0 1px 0 rgba(255,255,255,0.80) inset',
}

function KpiCard({ label, value, icon: Icon, accentColor, badge, loading }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        ...glass,
        flex: 1, minWidth: 0,
        padding: '20px 20px 18px 22px',
        position: 'relative', overflow: 'hidden',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 16px 48px rgba(10,15,30,0.12), 0 1px 0 rgba(255,255,255,0.9) inset'
          : '0 4px 24px rgba(10,15,30,0.07), 0 1px 0 rgba(255,255,255,0.80) inset',
        transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 16, bottom: 16, width: 3,
        background: accentColor, borderRadius: '0 2px 2px 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: 'var(--text3)',
        }}>
          {label}
        </span>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `${accentColor}14`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${accentColor}1e`,
          flexShrink: 0,
        }}>
          <Icon size={16} style={{ color: accentColor }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        {loading ? (
          <div className="skeleton" style={{ width: 64, height: 30 }} />
        ) : (
          <span style={{
            fontSize: 30, fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.8px', lineHeight: 1,
          }}>
            {value}
          </span>
        )}
        {!loading && badge && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            background: `${accentColor}14`,
            color: accentColor,
            padding: '2px 9px', borderRadius: 20,
            border: `1px solid ${accentColor}1e`,
          }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

function OrderRow({ order, isLast, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 18px',
        cursor: 'pointer',
        borderBottom: isLast ? 'none' : '1px solid rgba(10,15,30,0.06)',
        background: hovered ? 'rgba(22,163,74,0.04)' : 'transparent',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        fontFamily: 'monospace',
        fontSize: 12, fontWeight: 700,
        color: 'var(--accent)',
        minWidth: 128,
        letterSpacing: '0.03em',
        flexShrink: 0,
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

export default function StaffDashboard() {
  const navigate = useNavigate()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadOrders(isFirstLoad = false) {
      if (isFirstLoad) setLoading(true)
      try {
        const data = await getOrders({ date: 'today' })
        if (!isMounted) return
        const sorted = [...(data.orders || [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setOrders(sorted)
      } catch (err) {
        if (isMounted) toast.error(err.message || 'Failed to load orders')
      } finally {
        if (isMounted && isFirstLoad) setLoading(false)
      }
    }

    loadOrders(true)
    const interval = setInterval(() => loadOrders(false), 30000)
    return () => { isMounted = false; clearInterval(interval) }
  }, [])

  const stats = useMemo(() => {
    const totalOrders    = orders.length
    const totalPieces    = orders.reduce((s, o) => s + Number(o.total_pieces || 0), 0)
    const totalRevenue   = orders.reduce((s, o) => s + Number(o.total_pkr || 0), 0)
    const readyToCollect = orders.filter(o => o.status === 'ready').length
    return { totalOrders, totalPieces, totalRevenue, readyToCollect }
  }, [orders])

  const action = (
    <button
      onClick={() => navigate('/staff/orders/new')}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 16px',
        background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
        color: 'white', border: 'none', borderRadius: 10,
        fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
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
    <AuthenticatedLayout title="Dashboard" subtitle="Today's overview" action={action}>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
        <KpiCard
          label="Today's Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          accentColor="#3B82F6"
          badge="Today"
          loading={loading}
        />
        <KpiCard
          label="Today's Booking (Pieces)"
          value={stats.totalPieces}
          icon={Clock}
          accentColor="var(--accent)"
          badge="Pieces"
          loading={loading}
        />
        <KpiCard
          label="Ready for Pickup"
          value={stats.readyToCollect}
          icon={CheckCircle2}
          accentColor="#0f766e"
          badge={stats.readyToCollect > 0 ? 'Awaiting' : 'All clear'}
          loading={loading}
        />
        <KpiCard
          label="Revenue Today"
          value={`Rs. ${(stats.totalRevenue / 1000).toFixed(1)}k`}
          icon={TrendingUp}
          accentColor="#F59E0B"
          badge="PKR"
          loading={loading}
        />
      </div>

      {/* Recent Orders */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Recent Orders
          </h2>
          <button
            onClick={() => navigate('/staff/orders')}
            style={{
              background: 'none', border: 'none',
              color: 'var(--accent)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', padding: 0,
            }}
          >
            View all →
          </button>
        </div>

        <div style={{ ...glass, borderRadius: 16, overflow: 'hidden' }}>
          {loading ? (
            <LoadingSpinner />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No orders today yet"
              subtitle="Create the first order to get started"
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
      </div>
    </AuthenticatedLayout>
  )
}

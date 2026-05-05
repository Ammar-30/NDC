import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, ShoppingBag, MapPin, Calendar } from 'lucide-react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import { getReportsBranches } from '../../utils/api'
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
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'absolute', left: 0, top: 16, bottom: 16, width: 3,
        background: accentColor, borderRadius: '0 2px 2px 0',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          {label}
        </span>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `${accentColor}14`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${accentColor}1e`, flexShrink: 0,
        }}>
          <Icon size={16} style={{ color: accentColor }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        {loading ? (
          <div className="skeleton" style={{ width: 64, height: 30 }} />
        ) : (
          <span style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.8px', lineHeight: 1 }}>
            {value}
          </span>
        )}
        {!loading && badge && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            background: `${accentColor}14`, color: accentColor,
            padding: '2px 9px', borderRadius: 20, border: `1px solid ${accentColor}1e`,
          }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

function BranchCard({ branch }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        ...glass,
        borderRadius: 16, overflow: 'hidden',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 36px rgba(10,15,30,0.11), 0 1px 0 rgba(255,255,255,0.9) inset'
          : '0 4px 24px rgba(10,15,30,0.07), 0 1px 0 rgba(255,255,255,0.80) inset',
        transition: 'transform 0.26s ease, box-shadow 0.26s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(10,15,30,0.06)',
        background: 'rgba(22,163,74,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(22,163,74,0.15) 0%, rgba(34,197,94,0.10) 100%)',
            border: '1px solid rgba(22,163,74,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <MapPin size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              {branch.name}
            </h3>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text3)' }}>{branch.city}</p>
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Orders
            </p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>
              {parseInt(branch.order_count)}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Revenue
            </p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.3px' }}>
              Rs.&nbsp;{(parseFloat(branch.total_revenue) / 1000).toFixed(1)}k
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.80)',
        borderRadius: 12, padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(10,15,30,0.10)',
        fontSize: 12,
      }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--text)' }}>{label}</p>
        <p style={{ margin: 0, color: 'var(--accent)', fontWeight: 700 }}>
          Rs.&nbsp;{Number(payload[0].value).toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

export default function OwnerDashboard() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [branches, setBranches]         = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    setLoading(true)
    getReportsBranches({ date: selectedDate })
      .then(data => setBranches(data.branches || []))
      .catch(err => toast.error('Failed to load branch data: ' + err.message))
      .finally(() => setLoading(false))
  }, [selectedDate])

  const totalRevenue = branches.reduce((s, b) => s + Number(b.total_revenue || 0), 0)
  const totalOrders  = branches.reduce((s, b) => s + Number(b.order_count  || 0), 0)
  const chartData    = branches.map(b => ({
    name: b.name,
    revenue: Number(b.total_revenue || 0),
  }))

  const action = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(255,255,255,0.68)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.72)',
      borderRadius: 10, padding: '6px 10px',
    }}>
      <Calendar size={14} style={{ color: 'var(--text3)' }} />
      <input
        type="date"
        value={selectedDate}
        onChange={e => setSelectedDate(e.target.value)}
        style={{
          padding: '2px 4px', border: 'none',
          fontSize: 12, outline: 'none',
          fontFamily: 'inherit', color: 'var(--text)',
          background: 'transparent', cursor: 'pointer',
        }}
      />
    </div>
  )

  return (
    <AuthenticatedLayout title="Owner Dashboard" subtitle="Revenue overview across all branches" action={action}>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
        <KpiCard
          label="Total Revenue"
          value={`Rs. ${(totalRevenue / 1000).toFixed(1)}k`}
          icon={TrendingUp}
          accentColor="var(--accent)"
          badge="Selected date"
          loading={loading}
        />
        <KpiCard
          label="Total Orders"
          value={totalOrders}
          icon={ShoppingBag}
          accentColor="#3B82F6"
          badge="All branches"
          loading={loading}
        />
        <KpiCard
          label="Active Branches"
          value={branches.length}
          icon={MapPin}
          accentColor="#0f766e"
          badge="Online"
          loading={loading}
        />
      </div>

      {/* Revenue chart */}
      <div style={{ ...glass, padding: '18px 18px 14px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Revenue by Branch
          </h2>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>
            {new Date(selectedDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        {loading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              border: '3px solid rgba(22,163,74,0.15)',
              borderTopColor: 'var(--accent)',
              animation: 'spin 0.75s linear infinite',
            }} />
          </div>
        ) : (
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,15,30,0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--text3)', fontFamily: 'Inter, sans-serif' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'Inter, sans-serif' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22,163,74,0.06)' }} />
                <Bar
                  dataKey="revenue"
                  fill="url(#greenGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={52}
                />
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Branch cards */}
      <div>
        <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
          Branch Summary
        </h2>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            Loading branches…
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 14,
          }}>
            {branches.map(branch => <BranchCard key={branch.id} branch={branch} />)}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}

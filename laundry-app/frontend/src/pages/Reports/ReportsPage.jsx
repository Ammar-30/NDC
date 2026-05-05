import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import { getReportsBranches, getReportsOrders } from '../../utils/api'
import toast from 'react-hot-toast'

const glass = {
  background: 'rgba(255,255,255,0.68)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.72)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(10,15,30,0.07), 0 1px 0 rgba(255,255,255,0.80) inset',
}

const selectStyle = {
  width: '100%',
  padding: '9px 12px',
  background: 'rgba(255,255,255,0.70)',
  border: '1.5px solid rgba(200,215,235,0.80)',
  borderRadius: 10,
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
  color: 'var(--text)',
  cursor: 'pointer',
  transition: 'border-color 0.18s',
}

function toDateInput(date) { return date.toISOString().split('T')[0] }
function formatDateLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.80)', borderRadius: 12,
        padding: '10px 14px', boxShadow: '0 8px 24px rgba(10,15,30,0.10)', fontSize: 12,
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

export default function ReportsPage() {
  const [branches, setBranches]     = useState([])
  const [branchId, setBranchId]     = useState('')
  const [from, setFrom]             = useState(() => { const d = new Date(); d.setDate(d.getDate() - 6); return toDateInput(d) })
  const [to, setTo]                 = useState(() => toDateInput(new Date()))
  const [loadingBranches, setLoadingBranches] = useState(true)
  const [loadingReport, setLoadingReport]     = useState(true)
  const [report, setReport]         = useState({ summary: null, daily: [], top_items: [] })

  useEffect(() => {
    let cancelled = false
    async function loadBranches() {
      setLoadingBranches(true)
      try {
        const data = await getReportsBranches()
        if (cancelled) return
        const list = data.branches || []
        setBranches(list)
        if (list.length > 0) setBranchId(list[0].id)
      } catch (err) {
        if (!cancelled) toast.error(err.message || 'Failed to load branches')
      } finally {
        if (!cancelled) setLoadingBranches(false)
      }
    }
    loadBranches()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!branchId) { setLoadingReport(false); return }

    async function loadReport() {
      setLoadingReport(true)
      try {
        const data = await getReportsOrders({ branchId, from, to })
        if (cancelled) return
        setReport({ summary: data.summary || null, daily: data.daily || data.data || [], top_items: data.top_items || [] })
      } catch (err) {
        if (!cancelled) toast.error(err.message || 'Failed to load report')
      } finally {
        if (!cancelled) setLoadingReport(false)
      }
    }
    loadReport()
    return () => { cancelled = true }
  }, [branchId, from, to])

  const summary = useMemo(() => ({
    totalOrders:  Number(report.summary?.total_orders   || 0),
    totalRevenue: Number(report.summary?.total_revenue  || 0),
    avgOrderValue: Number(report.summary?.avg_order_value || 0),
  }), [report.summary])

  const chartData = report.daily.map(d => ({ date: formatDateLabel(d.date), revenue: Number(d.total_revenue || 0) }))

  function exportCsv() {
    const lines = []
    const branchName = branches.find(b => b.id === branchId)?.name || ''
    lines.push(`Branch,${branchName}`)
    lines.push(`From,${from}`)
    lines.push(`To,${to}`)
    lines.push(`Total Orders,${summary.totalOrders}`)
    lines.push(`Total Revenue,${summary.totalRevenue}`)
    lines.push(`Avg Order Value,${summary.avgOrderValue.toFixed(2)}`)
    lines.push('', 'Daily Revenue', 'Date,Revenue PKR')
    report.daily.forEach(row => lines.push(`${row.date},${Number(row.total_revenue || 0)}`))
    lines.push('', 'Top Items', 'Item,Quantity Sold,Pieces Sold,Total Revenue PKR')
    report.top_items.forEach(item => lines.push(
      `${item.item_name},${Number(item.quantity_sold || 0)},${Number(item.pieces_sold || 0)},${Number(item.total_revenue || 0)}`
    ))

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `reports_${branchName || 'branch'}_${from}_to_${to}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const action = (
    <button
      onClick={exportCsv}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 16px',
        background: 'linear-gradient(135deg, #16a34a, #22c55e)',
        color: 'white', border: 'none', borderRadius: 10,
        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 4px 14px rgba(22,163,74,0.28)',
      }}
    >
      <Download size={15} />
      Export CSV
    </button>
  )

  return (
    <AuthenticatedLayout title="Reports" subtitle="Branch performance analytics" action={action}>

      {/* Filters */}
      <div style={{
        ...glass, padding: 16, marginBottom: 18,
        display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12,
      }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Branch</label>
          <select
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
            style={selectStyle}
            disabled={loadingBranches}
          >
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.name} ({branch.city})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>From</label>
          <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} style={selectStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(200,215,235,0.80)' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>To</label>
          <input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} style={selectStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(200,215,235,0.80)' }}
          />
        </div>
      </div>

      {loadingBranches || loadingReport ? <LoadingSpinner /> : !branchId ? (
        <EmptyState icon={Download} title="No branches" subtitle="No branch data available" />
      ) : (
        <>
          {/* Summary KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
            {[
              { label: 'Total Orders',    value: summary.totalOrders,    color: '#3B82F6' },
              { label: 'Total Revenue',   value: `Rs. ${summary.totalRevenue.toLocaleString()}`, color: 'var(--accent)' },
              { label: 'Avg Order Value', value: `Rs. ${summary.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: '#0f766e' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                ...glass, padding: '16px 18px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, background: color, borderRadius: '0 2px 2px 0' }} />
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div style={{ ...glass, padding: '18px 18px 14px', marginBottom: 18 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Daily Revenue</h3>
            {chartData.length === 0 ? (
              <EmptyState title="No data" subtitle="No revenue in selected range" />
            ) : (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,15,30,0.06)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text3)', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text3)', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22,163,74,0.06)' }} />
                    <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top items */}
          <div style={{ ...glass, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(10,15,30,0.06)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Top Items</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '9px 18px', background: 'rgba(22,163,74,0.03)', borderBottom: '1px solid rgba(10,15,30,0.06)' }}>
              {['Item', 'Qty Sold', 'Pieces Sold', 'Revenue'].map(col => (
                <span key={col} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)' }}>{col}</span>
              ))}
            </div>
            {report.top_items.length === 0 ? (
              <EmptyState title="No items" subtitle="No item sales in selected range" />
            ) : (
              report.top_items.map((item, idx) => (
                <div key={`${item.item_name}-${idx}`} style={{
                  display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
                  padding: '12px 18px',
                  borderBottom: idx === report.top_items.length - 1 ? 'none' : '1px solid rgba(10,15,30,0.06)',
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(22,163,74,0.02)',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{item.item_name}</span>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{Number(item.quantity_sold || 0)}</span>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{Number(item.pieces_sold || 0)}</span>
                  <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>
                    Rs.&nbsp;{Number(item.total_revenue || 0).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </AuthenticatedLayout>
  )
}

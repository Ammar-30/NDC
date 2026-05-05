import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { getCustomer, getCustomers } from '../../utils/api'
import { formatPhoneDisplay } from '../../utils/phone'
import toast from 'react-hot-toast'

const glass = {
  background: 'rgba(255,255,255,0.68)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.72)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(10,15,30,0.07), 0 1px 0 rgba(255,255,255,0.80) inset',
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function summarizeItems(items = []) {
  const clean = items.filter(Boolean)
  if (clean.length === 0) return 'No items'
  return clean.map(i => {
    const pieces = Number(i.pieces || 1)
    return `${i.quantity}x ${i.item_name} (${pieces} pc${pieces === 1 ? '' : 's'})`
  }).join(', ')
}

function CustomerCard({ customer, orderCount, isSelected, onClick }) {
  return (
    <div
      style={{
        ...glass,
        padding: 18,
        marginBottom: 16,
        cursor: 'pointer',
        border: isSelected ? '1px solid rgba(22,163,74,0.35)' : '1px solid rgba(255,255,255,0.72)',
      }}
      className="fade-in"
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(22,163,74,0.12), rgba(34,197,94,0.08))',
          border: '2px solid rgba(22,163,74,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, fontWeight: 700, color: 'var(--accent)',
          flexShrink: 0,
        }}>
          {getInitials(customer.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: '0 0 3px', fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            {customer.name}
          </h3>
          <p style={{ margin: '0 0 2px', fontSize: 13, color: 'var(--text2)' }}>
            {formatPhoneDisplay(customer.phone)}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text3)' }}>
            {customer.address || 'No address on file'}
          </p>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(22,163,74,0.10), rgba(34,197,94,0.06))',
          border: '1px solid rgba(22,163,74,0.16)',
          borderRadius: 12, padding: '10px 14px', textAlign: 'center', flexShrink: 0,
        }}>
          <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.4px' }}>
            {orderCount}
          </p>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Orders
          </p>
        </div>
      </div>
    </div>
  )
}

function OrderHistoryRow({ order, isLast, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '130px 100px 1fr 90px 100px',
        alignItems: 'center',
        gap: 10,
        padding: '12px 18px',
        cursor: 'pointer',
        borderBottom: isLast ? 'none' : '1px solid rgba(10,15,30,0.06)',
        background: hovered ? 'rgba(22,163,74,0.04)' : 'transparent',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.03em' }}>
        {order.token}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text3)' }}>
        {new Date(order.created_at || order.drop_off_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {summarizeItems(order.items)}
      </span>
      <StatusBadge status={order.status} />
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>
        Rs.&nbsp;{Number(order.total_pkr).toLocaleString()}
      </span>
    </div>
  )
}

export default function CustomersPage() {
  const navigate = useNavigate()

  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [orders, setOrders] = useState([])

  async function loadCustomerDetails(customerId, customerList = customers) {
    const picked = customerList.find(c => c.id === customerId)
    if (!picked) return

    setSelectedCustomer(picked)
    setLoadingDetails(true)
    try {
      const data = await getCustomer(customerId)
      setSelectedCustomer(data.customer || picked)
      setOrders(data.orders || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load customer details')
    } finally {
      setLoadingDetails(false)
    }
  }

  async function loadCustomers(search = '') {
    setLoadingList(true)
    try {
      const data = await getCustomers(search ? { search } : {})
      const list = data.customers || []
      setCustomers(list)

      if (list.length === 0) {
        setSelectedCustomer(null)
        setOrders([])
      } else {
        const keepSelected = selectedCustomer && list.some(c => c.id === selectedCustomer.id)
        const nextId = keepSelected ? selectedCustomer.id : list[0].id
        await loadCustomerDetails(nextId, list)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load customers')
    } finally {
      setLoadingList(false)
    }
  }

  function handleSearch() {
    const trimmed = queryInput.trim()
    setQuery(trimmed)
    loadCustomers(trimmed)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers('')
    }, 0)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthenticatedLayout title="Customers" subtitle="Browse, search & manage customers">
      <div style={{ ...glass, padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
          Find Customer
        </h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Search by name, phone, address, or notes"
              style={{
                width: '100%',
                fontSize: 14,
                padding: '11px 14px 11px 34px',
                background: 'rgba(255,255,255,0.70)',
                border: '1.5px solid rgba(200,215,235,0.80)',
                borderRadius: 10,
                fontFamily: 'inherit',
                outline: 'none',
                color: 'var(--text)',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loadingList}
            style={{
              padding: '11px 22px',
              background: loadingList ? 'rgba(22,163,74,0.55)' : 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 600,
              cursor: loadingList ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', flexShrink: 0,
              boxShadow: loadingList ? 'none' : '0 4px 14px rgba(22,163,74,0.28)',
            }}
          >
            {loadingList ? 'Searching…' : 'Search'}
          </button>
          <button
            onClick={() => {
              setQueryInput('')
              setQuery('')
              loadCustomers('')
            }}
            disabled={loadingList}
            style={{
              padding: '11px 16px',
              background: 'rgba(255,255,255,0.68)',
              color: 'var(--text2)',
              border: '1px solid rgba(255,255,255,0.72)',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: loadingList ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {loadingList ? (
        <LoadingSpinner />
      ) : customers.length === 0 ? (
        <div style={{ ...glass, overflow: 'hidden' }}>
          <EmptyState
            icon={Users}
            title="No customers found"
            subtitle={query ? `No matches for "${query}"` : 'No customers yet in this branch'}
          />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            {customers.map(customer => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                orderCount={Number(customer.order_count || 0)}
                isSelected={selectedCustomer?.id === customer.id}
                onClick={() => loadCustomerDetails(customer.id)}
              />
            ))}
          </div>

          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              {selectedCustomer?.name ? `${selectedCustomer.name} - Order History` : 'Order History'}
            </h3>
            <div style={{ ...glass, overflow: 'hidden' }}>
              {loadingDetails ? (
                <LoadingSpinner />
              ) : orders.length === 0 ? (
                <EmptyState icon={Users} title="No orders yet" subtitle="This customer hasn't placed any orders" />
              ) : (
                orders.map((order, i) => (
                  <OrderHistoryRow
                    key={order.id}
                    order={order}
                    isLast={i === orders.length - 1}
                    onClick={() => navigate(`/staff/orders/${order.id}`)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </AuthenticatedLayout>
  )
}

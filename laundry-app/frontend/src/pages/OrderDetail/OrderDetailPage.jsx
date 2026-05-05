import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check, Printer, MessageCircle, ArrowLeft, Tags } from 'lucide-react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import { apiRequest, getOrders, updateOrderStatus, getOrderWhatsApp } from '../../utils/api'
import { formatPhoneDisplay } from '../../utils/phone'
import { printOrderStickers } from '../../utils/stickerPrint'
import { printOrderInvoicePdf } from '../../utils/invoicePrint'
import toast from 'react-hot-toast'

const glass = {
  background: 'rgba(255,255,255,0.68)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.72)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(10,15,30,0.07), 0 1px 0 rgba(255,255,255,0.80) inset',
}

const STATUS_FLOW   = ['received', 'washing', 'ready', 'delivered']
const STATUS_LABELS = { received: 'Received', washing: 'Washing', ready: 'Ready', delivered: 'Delivered' }
const NEXT_STATUS   = { received: 'washing', washing: 'ready', ready: 'delivered' }

function pieceLabel(value) {
  const pieces = Number(value) > 0 ? Number(value) : 1
  return `${pieces} pc${pieces === 1 ? '' : 's'}`
}

function StatusStepper({ currentStatus }) {
  const currentIdx = STATUS_FLOW.indexOf(currentStatus)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '22px 18px 18px' }}>
      {STATUS_FLOW.map((status, i) => {
        const isDone    = i < currentIdx
        const isCurrent = i === currentIdx
        return (
          <div key={status} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, minWidth: 56 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: isDone
                  ? 'linear-gradient(135deg, #0f766e, #14b8a6)'
                  : isCurrent
                    ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                    : 'rgba(255,255,255,0.70)',
                border: isDone || isCurrent ? 'none' : '2px solid rgba(10,15,30,0.12)',
                color: isDone || isCurrent ? 'white' : 'var(--text3)',
                boxShadow: isCurrent
                  ? '0 0 0 5px rgba(22,163,74,0.15), 0 4px 12px rgba(22,163,74,0.28)'
                  : isDone
                    ? '0 2px 8px rgba(15,118,110,0.25)'
                    : 'none',
                transition: 'all 0.25s ease',
              }}>
                {isDone ? <Check size={14} /> : i + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: isCurrent ? 700 : 500,
                color: isDone ? '#0f766e' : isCurrent ? 'var(--accent)' : 'var(--text3)',
                textAlign: 'center', whiteSpace: 'nowrap',
              }}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 22,
                background: isDone
                  ? 'linear-gradient(90deg, #0f766e, #14b8a6)'
                  : 'rgba(10,15,30,0.08)',
                transition: 'background 0.3s ease',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrderDetailPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [order, setOrder]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [updating, setUpdating]         = useState(false)
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false)

  const fetchOrder = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      await getOrders()
      const data = await apiRequest('GET', `/orders/${id}`)
      setOrder(data.order)
    } catch (err) {
      toast.error(err.message || 'Failed to load order')
      navigate('/staff/orders')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { fetchOrder(true) }, [fetchOrder])

  async function handleStatusUpdate() {
    const nextStatus = NEXT_STATUS[order.status]
    if (!nextStatus) return
    setUpdating(true)
    try {
      await updateOrderStatus(id, nextStatus)
      await fetchOrder(false)
      toast.success('Status updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  async function handleWhatsApp() {
    setLoadingWhatsApp(true)
    try {
      const data = await getOrderWhatsApp(id)
      if (data.url) window.open(data.url, '_blank')
    } catch (err) {
      toast.error(err.message || 'Failed to open WhatsApp')
    } finally {
      setLoadingWhatsApp(false)
    }
  }

  function handlePrintStickers() {
    try {
      const { count } = printOrderStickers({
        order,
        customerName: order?.customer_name,
        customerPhone: order?.customer_phone,
      })

      if (!count) {
        toast.error('No printable pieces found in this order')
        return
      }
      toast.success(`Printing ${count} sticker${count === 1 ? '' : 's'}`)
    } catch (err) {
      toast.error(err.message || 'Failed to print stickers')
    }
  }

  function handlePrintInvoice() {
    try {
      printOrderInvoicePdf({
        order,
        customerName: order?.customer_name,
        customerPhone: order?.customer_phone,
      })
    } catch (err) {
      toast.error(err.message || 'Failed to print invoice')
    }
  }

  const action = (
    <button
      onClick={() => navigate('/staff/orders')}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px',
        background: 'rgba(255,255,255,0.68)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.72)',
        borderRadius: 10, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text2)',
        transition: 'box-shadow 0.18s ease',
      }}
    >
      <ArrowLeft size={14} />
      Back
    </button>
  )

  if (loading) {
    return (
      <AuthenticatedLayout title="Order" subtitle="Loading…" action={action}>
        <LoadingSpinner />
      </AuthenticatedLayout>
    )
  }
  if (!order) return null

  const cleanItems = (order.items || []).filter(Boolean)
  const nextStatus = NEXT_STATUS[order.status]
  const urgentService = Boolean(order.urgent_service)
  const urgentExtra = Number(order.urgent_extra_pkr || 0)
  const subtotal = cleanItems.reduce(
    (sum, item) => sum + (Number(item.quantity) * Number(item.unit_price_pkr)),
    0
  )

  return (
    <AuthenticatedLayout
      title={`Order ${order.token}`}
      subtitle={order.customer_name}
      action={action}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Status card */}
        <div style={{ ...glass, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px 0',
            borderBottom: '1px solid rgba(10,15,30,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Order Status</h3>
              <StatusBadge status={order.status} />
            </div>
          </div>
          <StatusStepper currentStatus={order.status} />
          {nextStatus && (
            <div style={{ padding: '0 18px 18px' }}>
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                style={{
                  width: '100%', padding: '12px 0',
                  background: updating
                    ? 'rgba(22,163,74,0.50)'
                    : 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                  color: 'white', border: 'none', borderRadius: 12,
                  fontSize: 13, fontWeight: 700,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: updating ? 'none' : '0 4px 14px rgba(22,163,74,0.28)',
                  transition: 'all 0.18s ease',
                }}
              >
                {updating ? 'Updating…' : `Mark as ${STATUS_LABELS[nextStatus]} →`}
              </button>
            </div>
          )}
        </div>

        {/* Order details card */}
        <div style={{ ...glass, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(10,15,30,0.06)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Order Details</h3>
          </div>

          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(10,15,30,0.06)', background: 'rgba(22,163,74,0.03)' }}>
            <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Token</p>
            <p style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace' }}>{order.token}</p>
            <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Customer</p>
            <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{order.customer_name}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)' }}>{formatPhoneDisplay(order.customer_phone)}</p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid rgba(10,15,30,0.06)',
          }}>
            <div style={{ padding: '12px 18px', borderRight: '1px solid rgba(10,15,30,0.06)' }}>
              <p style={{ margin: '0 0 3px', fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Drop-off</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {new Date(order.drop_off_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div style={{ padding: '12px 18px' }}>
              <p style={{ margin: '0 0 3px', fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Due Date</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {new Date(order.due_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {cleanItems.map((item, i) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 18px',
              borderBottom: i < cleanItems.length - 1 ? '1px solid rgba(10,15,30,0.06)' : 'none',
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.item_name}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>
                  Qty {item.quantity} · {pieceLabel(item.pieces)} @ Rs.{Number(item.unit_price_pkr)}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                Rs.&nbsp;{(Number(item.quantity) * Number(item.unit_price_pkr)).toLocaleString()}
              </span>
            </div>
          ))}
          {urgentService && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 18px',
              borderTop: '1px solid rgba(10,15,30,0.06)',
              background: 'rgba(245,158,11,0.05)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Urgent Service Extra</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                Rs.&nbsp;{urgentExtra.toLocaleString()}
              </span>
            </div>
          )}
          {urgentService && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 18px',
              borderTop: '1px dashed rgba(10,15,30,0.10)',
              fontSize: 12, color: 'var(--text2)',
            }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 700 }}>Rs.&nbsp;{subtotal.toLocaleString()}</span>
            </div>
          )}

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(22,163,74,0.06) 0%, rgba(34,197,94,0.03) 100%)',
            borderTop: '2px solid rgba(22,163,74,0.12)',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.4px' }}>
              Rs.&nbsp;{Number(order.total_pkr).toLocaleString()}
            </span>
          </div>

          {order.notes && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(10,15,30,0.06)', background: 'rgba(245,158,11,0.05)' }}>
              <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notes</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text2)' }}>{order.notes}</p>
            </div>
          )}
        </div>

        {/* Print receipt */}
        <div className="print-receipt" style={{
          ...glass, marginBottom: 16, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px dashed rgba(10,15,30,0.10)' }}>
            <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{order.customer_name}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)' }}>{formatPhoneDisplay(order.customer_phone)}</p>
          </div>
          {cleanItems.map((item, i) => (
            <div key={`${item.id}-r`} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 18px',
              borderBottom: i < cleanItems.length - 1 ? '1px solid rgba(10,15,30,0.06)' : '1px dashed rgba(10,15,30,0.10)',
              fontSize: 13,
            }}>
              <span style={{ color: 'var(--text)' }}>{item.quantity}× {item.item_name} ({pieceLabel(item.pieces)})</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                Rs.&nbsp;{(Number(item.unit_price_pkr) * Number(item.quantity)).toLocaleString()}
              </span>
            </div>
          ))}
          {urgentService && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 18px',
              borderBottom: '1px dashed rgba(10,15,30,0.10)',
              fontSize: 13,
              background: 'rgba(245,158,11,0.05)',
            }}>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>Urgent Service Extra</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                Rs.&nbsp;{urgentExtra.toLocaleString()}
              </span>
            </div>
          )}
          {urgentService && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px dashed rgba(10,15,30,0.10)', fontSize: 12 }}>
              <span style={{ color: 'var(--text2)' }}>Subtotal</span>
              <span style={{ fontWeight: 600, color: 'var(--text2)' }}>Rs.&nbsp;{subtotal.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 18px', background: 'rgba(22,163,74,0.04)' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>Rs.&nbsp;{Number(order.total_pkr).toLocaleString()}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} className="no-print">
          <button
            onClick={handlePrintInvoice}
            style={{
              flex: '1 1 170px', padding: '12px 0',
              background: 'rgba(255,255,255,0.68)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.72)',
              borderRadius: 12, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'box-shadow 0.18s ease',
              boxShadow: '0 2px 8px rgba(10,15,30,0.06)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(10,15,30,0.10)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(10,15,30,0.06)'}
          >
            <Printer size={15} />
            Print Invoice
          </button>
          <button
            onClick={handlePrintStickers}
            style={{
              flex: '1 1 170px', padding: '12px 0',
              background: 'rgba(255,255,255,0.68)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.72)',
              borderRadius: 12, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'box-shadow 0.18s ease',
              boxShadow: '0 2px 8px rgba(10,15,30,0.06)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(10,15,30,0.10)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(10,15,30,0.06)'}
          >
            <Tags size={15} />
            Print Stickers
          </button>
          <button
            onClick={handleWhatsApp}
            disabled={loadingWhatsApp}
            style={{
              flex: '1 1 170px', padding: '12px 0',
              background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
              borderRadius: 12, fontSize: 13, fontWeight: 600,
              cursor: loadingWhatsApp ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', color: 'white', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 4px 14px rgba(15,118,110,0.28)',
              transition: 'box-shadow 0.18s ease',
            }}
          >
            <MessageCircle size={15} />
            {loadingWhatsApp ? 'Loading…' : 'Share on WhatsApp'}
          </button>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

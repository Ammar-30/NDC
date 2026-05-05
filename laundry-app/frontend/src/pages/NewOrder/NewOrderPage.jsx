import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Minus, Plus, MessageCircle, Printer, ArrowLeft, Tags } from 'lucide-react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import PhoneInput from '../../components/PhoneInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import { createOrder, getOrderWhatsApp, searchCustomer, createCustomer, getPriceList } from '../../utils/api'
import { normalizePhone, formatPhoneDisplay } from '../../utils/phone'
import { printOrderStickers } from '../../utils/stickerPrint'
import { printOrderInvoicePdf } from '../../utils/invoicePrint'
import toast from 'react-hot-toast'

const glass = {
  background: 'rgba(255,255,255,0.68)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.72)',
  borderRadius: 18,
  boxShadow: '0 4px 24px rgba(10,15,30,0.07), 0 1px 0 rgba(255,255,255,0.80) inset',
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.70)',
  border: '1.5px solid rgba(200,215,235,0.80)',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  color: 'var(--text)',
  boxSizing: 'border-box',
  transition: 'border-color 0.18s, box-shadow 0.18s',
}

const STEPS = [
  { num: 1, label: 'Customer' },
  { num: 2, label: 'Items'    },
  { num: 3, label: 'Review'   },
  { num: 4, label: 'Receipt'  },
]

function pieceLabel(value) {
  const pieces = Number(value) > 0 ? Number(value) : 1
  return `${pieces} pc${pieces === 1 ? '' : 's'}`
}

function StepIndicator({ currentStep }) {
  return (
    <div style={{
      ...glass,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 0, marginBottom: 20, padding: '18px 22px',
    }}>
      {STEPS.map((step, i) => (
        <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              transition: 'all 0.25s ease',
              background: step.num < currentStep
                ? 'linear-gradient(135deg, #0f766e, #14b8a6)'
                : step.num === currentStep
                  ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                  : 'rgba(255,255,255,0.60)',
              border: step.num <= currentStep ? 'none' : '2px solid rgba(10,15,30,0.12)',
              color: step.num <= currentStep ? 'white' : 'var(--text3)',
              boxShadow: step.num === currentStep
                ? '0 0 0 4px rgba(22,163,74,0.15), 0 3px 10px rgba(22,163,74,0.25)'
                : 'none',
            }}>
              {step.num < currentStep ? <Check size={13} /> : step.num}
            </div>
            <span style={{
              fontSize: 11, fontWeight: step.num === currentStep ? 600 : 500,
              color: step.num === currentStep
                ? 'var(--accent)'
                : step.num < currentStep ? '#0f766e' : 'var(--text3)',
              whiteSpace: 'nowrap',
            }}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              width: 56, height: 2, margin: '0 8px', marginBottom: 22,
              background: step.num < currentStep
                ? 'linear-gradient(90deg, #0f766e, #14b8a6)'
                : 'rgba(10,15,30,0.08)',
              transition: 'background 0.25s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

function Step1({ initialPhone, onFound }) {
  const [phone, setPhone]             = useState(initialPhone || '')
  const [searching, setSearching]     = useState(false)
  const [creating, setCreating]       = useState(false)
  const [result, setResult]           = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName]         = useState('')
  const [newAddress, setNewAddress]   = useState('')

  useEffect(() => { if (initialPhone) setPhone(initialPhone) }, [initialPhone])

  async function handleSearch() {
    let normalized
    try { normalized = normalizePhone(phone) }
    catch (err) { toast.error(err.message || 'Invalid phone number'); return }

    setSearching(true)
    try {
      const data = await searchCustomer(normalized)
      setResult({ found: true, customer: data.customer, orders: data.orders || [] })
      setShowCreateForm(false)
    } catch (err) {
      if (err.status === 404) {
        setResult({ found: false, phone: normalized })
        setShowCreateForm(true)
      } else {
        toast.error(err.message || 'Search failed')
      }
    } finally {
      setSearching(false)
    }
  }

  async function handleCreateAndContinue() {
    if (!newName.trim()) { toast.error('Customer name is required'); return }
    let normalized
    try { normalized = normalizePhone(phone) }
    catch (err) { toast.error(err.message || 'Invalid phone number'); return }

    setCreating(true)
    try {
      const data = await createCustomer({
        name: newName.trim(),
        phone: normalized,
        address: newAddress.trim() || undefined,
      })
      onFound(data.customer)
    } catch (err) {
      toast.error(err.message || 'Failed to create customer')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
        Find Customer
      </h3>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
            style={{ fontSize: 15, padding: '11px 14px' }}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          style={{
            padding: '11px 20px',
            background: searching ? 'rgba(22,163,74,0.55)' : 'linear-gradient(135deg, #16a34a, #22c55e)',
            color: 'white', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            cursor: searching ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', flexShrink: 0,
            boxShadow: searching ? 'none' : '0 4px 14px rgba(22,163,74,0.28)',
            transition: 'all 0.18s ease',
          }}
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {result?.found && result.customer && (
        <div style={{
          background: 'rgba(15,118,110,0.08)',
          border: '1px solid rgba(15,118,110,0.22)',
          borderRadius: 12, padding: 16, marginBottom: 16,
        }} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 3px 10px rgba(15,118,110,0.28)',
            }}>
              <Check size={18} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                {result.customer.name}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)' }}>
                {formatPhoneDisplay(result.customer.phone)} · {result.orders.length} order{result.orders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => onFound(result.customer)}
            style={{
              marginTop: 12, width: '100%', padding: '10px 0',
              background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 3px 12px rgba(15,118,110,0.28)',
            }}
          >
            Continue with this customer →
          </button>
        </div>
      )}

      {showCreateForm && (
        <div style={{
          background: 'rgba(255,255,255,0.60)',
          border: '1px solid rgba(255,255,255,0.72)',
          borderRadius: 12, padding: 16, marginBottom: 16,
        }} className="fade-in">
          <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            New customer
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Full Name *</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ahmed Ali"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.10)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(200,215,235,0.80)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Phone</label>
              <input
                type="text"
                value={formatPhoneDisplay(result?.phone || phone)}
                readOnly
                style={{ ...inputStyle, background: 'rgba(240,245,255,0.70)', color: 'var(--text2)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Address (optional)</label>
              <input
                type="text"
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
                placeholder="House 12, Gulberg III"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.10)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(200,215,235,0.80)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <button
              onClick={handleCreateAndContinue}
              disabled={creating}
              style={{
                padding: '10px 0',
                background: creating ? 'rgba(22,163,74,0.55)' : 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 600,
                cursor: creating ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: creating ? 'none' : '0 4px 14px rgba(22,163,74,0.28)',
              }}
            >
              {creating ? 'Creating…' : 'Create customer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Step2({ priceList, loadingPriceList, loadError, quantities, setQuantities, onContinue, onBack, onRetry }) {
  const [searchTerm, setSearchTerm] = useState('')

  const total    = Object.entries(quantities).reduce((sum, [id, qty]) => {
    const item = priceList.find(p => p.id === id)
    return sum + (item ? Number(item.price_pkr) * qty : 0)
  }, 0)
  const itemCount = Object.values(quantities).reduce((s, q) => s + q, 0)
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredPriceList = normalizedSearch
    ? priceList.filter(item => item.item_name.toLowerCase().includes(normalizedSearch))
    : priceList

  function updateQty(itemId, delta) {
    setQuantities(prev => {
      const next = { ...prev }
      const newQty = (next[itemId] || 0) + delta
      if (newQty <= 0) delete next[itemId]
      else next[itemId] = newQty
      return next
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
          Select Items
        </h3>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', color: 'var(--text3)',
          cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
        }}>
          <ArrowLeft size={13} /> Back
        </button>
      </div>

      {loadingPriceList ? <LoadingSpinner /> : loadError ? (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <p style={{ margin: '0 0 10px', color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>
            Failed to load price list: {loadError}
          </p>
          <button onClick={onRetry} style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Retry
          </button>
        </div>
      ) : priceList.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.72)', borderRadius: 10, padding: 14 }}>
          <p style={{ margin: 0, color: 'var(--text2)', fontSize: 13 }}>
            No active price list items. Ask owner to activate items in Price List.
          </p>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search cloth type…"
            style={{ ...inputStyle, marginBottom: 14 }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.10)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(200,215,235,0.80)'; e.target.style.boxShadow = 'none' }}
          />

          {filteredPriceList.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 14px', padding: '10px 14px', background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.72)', borderRadius: 10 }}>
              No cloth type found for "{searchTerm}".
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
            {filteredPriceList.map(item => {
              const qty        = quantities[item.id] || 0
              const isSelected = qty > 0
              const piecesText = pieceLabel(item.pieces)
              return (
                <div key={item.id} style={{
                  background: isSelected ? 'rgba(22,163,74,0.10)' : 'rgba(255,255,255,0.60)',
                  border: `1.5px solid ${isSelected ? 'rgba(22,163,74,0.35)' : 'rgba(255,255,255,0.72)'}`,
                  borderRadius: 12, padding: '12px 10px',
                  transition: 'all 0.18s ease',
                  textAlign: 'center',
                  boxShadow: isSelected ? '0 2px 8px rgba(22,163,74,0.12)' : 'none',
                }}>
                  <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 600, color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                    {item.item_name}
                  </p>
                  <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {piecesText}
                  </p>
                  <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                    Rs.&nbsp;{Number(item.price_pkr)}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      style={{
                        width: 24, height: 24, borderRadius: '50%',
                        border: '1.5px solid var(--accent)',
                        background: 'white', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', padding: 0, transition: 'background 0.15s',
                      }}
                    >
                      <Minus size={11} />
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)', minWidth: 18, textAlign: 'center' }}>
                      {qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      style={{
                        width: 24, height: 24, borderRadius: '50%',
                        border: 'none',
                        background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                        color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', padding: 0,
                        boxShadow: '0 2px 6px rgba(22,163,74,0.30)',
                      }}
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #0c1628 0%, #1a2340 100%)',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
              {itemCount} item{itemCount !== 1 ? 's' : ''}&nbsp;·&nbsp;
              <span style={{ color: 'white', fontWeight: 800 }}>Rs.&nbsp;{total.toLocaleString()}</span>
            </span>
            <button
              onClick={() => {
                if (itemCount === 0) { toast.error('Please select at least one item'); return }
                onContinue()
              }}
              style={{
                padding: '9px 20px',
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: 'white', border: 'none', borderRadius: 9,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
              }}
            >
              Continue →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Step3({ customer, priceList, quantities, onPlaceOrder, onBack }) {
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  })
  const [notes, setNotes]     = useState('')
  const [urgentService, setUrgentService] = useState(false)
  const [urgentExtra, setUrgentExtra] = useState('')
  const [placing, setPlacing] = useState(false)

  const lineItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item  = priceList.find(p => p.id === id)
      const price = Number(item?.price_pkr || 0)
      const pieces = Number(item?.pieces || 1)
      return { id, item_name: item?.item_name || 'Unknown', quantity: qty, pieces, unit_price_pkr: price, lineTotal: price * qty }
    })
  const total = lineItems.reduce((s, i) => s + i.lineTotal, 0)
  const parsedUrgentExtra = Number(urgentExtra)
  const validUrgentExtra = Number.isFinite(parsedUrgentExtra) && parsedUrgentExtra > 0
  const urgentExtraAmount = urgentService && validUrgentExtra ? parsedUrgentExtra : 0
  const grandTotal = total + urgentExtraAmount

  async function handleClick() {
    if (urgentService && !validUrgentExtra) {
      toast.error('Extra charges are required for urgent service')
      return
    }
    setPlacing(true)
    await onPlaceOrder({
      dueDate,
      notes,
      urgentService,
      urgentExtra: urgentExtraAmount,
    })
    setPlacing(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
          Review Order
        </h3>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
          <ArrowLeft size={13} /> Back
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.72)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(10,15,30,0.06)', background: 'rgba(22,163,74,0.04)' }}>
          <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Customer</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{customer.name}</p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)' }}>{formatPhoneDisplay(customer.phone)}</p>
        </div>

        {lineItems.map((item, i) => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 18px',
            borderBottom: i < lineItems.length - 1 ? '1px solid rgba(10,15,30,0.06)' : 'none',
          }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.item_name}</span>
              <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>
                Qty {item.quantity} · {pieceLabel(item.pieces)} @ Rs.{item.unit_price_pkr}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Rs.&nbsp;{item.lineTotal.toLocaleString()}</span>
          </div>
        ))}

        <div style={{
          display: 'flex', justifyContent: 'space-between', padding: '13px 18px',
          background: 'linear-gradient(135deg, rgba(22,163,74,0.06), rgba(34,197,94,0.03))',
          borderTop: '2px solid rgba(22,163,74,0.12)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Total</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.4px' }}>
            Rs.&nbsp;{grandTotal.toLocaleString()}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 7 }}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{ ...inputStyle }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.10)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(200,215,235,0.80)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <div style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.72)', borderRadius: 10, padding: '12px 12px 10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: urgentService ? 10 : 0, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={urgentService}
              onChange={e => {
                const checked = e.target.checked
                setUrgentService(checked)
                if (!checked) setUrgentExtra('')
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Urgent Service</span>
          </label>
          {urgentService && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 7 }}>
                Extra Charges (required)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={urgentExtra}
                onChange={e => setUrgentExtra(e.target.value)}
                placeholder="e.g. 300"
                style={{ ...inputStyle }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.10)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(200,215,235,0.80)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          )}
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 7 }}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any special instructions…"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.10)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(200,215,235,0.80)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
      </div>

      <button
        onClick={handleClick}
        disabled={placing}
        style={{
          width: '100%', padding: '14px 0',
          background: placing ? 'rgba(15,118,110,0.55)' : 'linear-gradient(135deg, #0f766e, #14b8a6)',
          color: 'white', border: 'none', borderRadius: 12,
          fontSize: 14, fontWeight: 700,
          cursor: placing ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          boxShadow: placing ? 'none' : '0 5px 18px rgba(15,118,110,0.30)',
          letterSpacing: '-0.2px',
        }}
      >
        {placing ? 'Creating order…' : 'Create Order'}
      </button>
    </div>
  )
}

function Step4({ customer, order, onNewOrder }) {
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false)
  const cleanItems = (order.items || []).filter(Boolean)
  const urgentService = Boolean(order.urgent_service)
  const urgentExtra = Number(order.urgent_extra_pkr || 0)
  const subtotal = cleanItems.reduce(
    (sum, item) => sum + (Number(item.unit_price_pkr) * Number(item.quantity)),
    0
  )

  async function handleWhatsApp() {
    setLoadingWhatsApp(true)
    try {
      const data = await getOrderWhatsApp(order.id)
      if (data.url) window.open(data.url, '_blank')
    } catch (err) {
      toast.error(err.message || 'Failed to open WhatsApp message')
    } finally {
      setLoadingWhatsApp(false)
    }
  }

  function handlePrintStickers() {
    try {
      const { count } = printOrderStickers({
        order,
        customerName: customer?.name,
        customerPhone: customer?.phone,
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
        customerName: customer?.name,
        customerPhone: customer?.phone,
      })
    } catch (err) {
      toast.error(err.message || 'Failed to print invoice')
    }
  }

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(15,118,110,0.12), rgba(20,184,166,0.08))',
          border: '2px solid rgba(15,118,110,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
          boxShadow: '0 0 0 8px rgba(15,118,110,0.06)',
        }}>
          <Check size={32} style={{ color: '#0f766e' }} />
        </div>
        <p style={{
          margin: '0 0 6px',
          fontFamily: 'monospace', fontSize: 44, fontWeight: 800,
          color: 'var(--accent)', letterSpacing: '0.04em', lineHeight: 1,
        }}>
          {order.token}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text3)' }}>
          Order token — give this to the customer
        </p>
      </div>

      <div className="print-receipt" style={{
        background: 'rgba(255,255,255,0.70)',
        border: '1px solid rgba(255,255,255,0.72)',
        borderRadius: 14, overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px dashed rgba(10,15,30,0.10)' }}>
          <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{customer.name}</p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)' }}>{formatPhoneDisplay(customer.phone)}</p>
        </div>
        {cleanItems.map((item, i) => (
          <div key={item.id || i} style={{
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }} className="no-print">
        <button
          onClick={handlePrintInvoice}
          style={{
            flex: '1 1 150px', padding: '12px 0',
            background: 'rgba(255,255,255,0.68)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.72)',
            borderRadius: 12, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: '0 2px 8px rgba(10,15,30,0.06)',
          }}
        >
          <Printer size={15} />
          Print Invoice
        </button>
        <button
          onClick={handlePrintStickers}
          style={{
            flex: '1 1 150px', padding: '12px 0',
            background: 'rgba(255,255,255,0.68)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.72)',
            borderRadius: 12, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: '0 2px 8px rgba(10,15,30,0.06)',
          }}
        >
          <Tags size={15} />
          Print Stickers
        </button>
        <button
          onClick={handleWhatsApp}
          disabled={loadingWhatsApp}
          style={{
            flex: '1 1 150px', padding: '12px 0',
            background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
            border: 'none', borderRadius: 12,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: '0 4px 14px rgba(15,118,110,0.28)',
          }}
        >
          <MessageCircle size={15} />
          {loadingWhatsApp ? 'Loading…' : 'WhatsApp'}
        </button>
      </div>

      <button
        onClick={onNewOrder}
        className="no-print"
        style={{
          width: '100%', padding: '12px 0',
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          color: 'white', border: 'none', borderRadius: 12,
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 14px rgba(22,163,74,0.28)',
        }}
      >
        New Order
      </button>
    </div>
  )
}

export default function NewOrderPage() {
  const navigate                              = useNavigate()
  const [searchParams, setSearchParams]       = useSearchParams()
  const [step, setStep]                       = useState(1)
  const [customer, setCustomer]               = useState(null)
  const [quantities, setQuantities]           = useState({})
  const [priceList, setPriceList]             = useState([])
  const [priceListLoaded, setPriceListLoaded] = useState(false)
  const [loadingPriceList, setLoadingPriceList] = useState(false)
  const [priceListError, setPriceListError]   = useState('')
  const [order, setOrder]                     = useState(null)

  const initialPhone = searchParams.get('phone') || ''

  async function loadPriceList() {
    if (loadingPriceList) return
    setLoadingPriceList(true)
    setPriceListError('')
    try {
      const data = await getPriceList()
      setPriceList(data.items || [])
      setPriceListLoaded(true)
    } catch (err) {
      setPriceListError(err.message || 'Failed to load price list')
      toast.error(err.message || 'Failed to load price list')
    } finally {
      setLoadingPriceList(false)
    }
  }

  useEffect(() => {
    if (step === 2 && !priceListLoaded) loadPriceList()
  }, [step, priceListLoaded])

  function handleCustomerFound(c) {
    setCustomer(c)
    setStep(2)
    if (searchParams.get('phone')) setSearchParams({}, { replace: true })
  }

  async function handlePlaceOrder({ dueDate, notes, urgentService, urgentExtra }) {
    try {
      const data = await createOrder({
        customer_id: customer.id,
        due_date: dueDate,
        notes,
        urgent_service: urgentService,
        urgent_extra_pkr: urgentExtra,
        items: Object.entries(quantities)
          .filter(([, qty]) => qty > 0)
          .map(([price_list_id, quantity]) => {
            const priceItem = priceList.find(item => item.id === price_list_id)
            return { price_list_id, quantity, pieces: Number(priceItem?.pieces || 1) }
          }),
      })
      setOrder(data.order)
      setStep(4)
      toast.success('Order created')
    } catch (err) {
      toast.error(err.message || 'Failed to create order')
    }
  }

  function handleNewOrder() {
    setStep(1); setCustomer(null); setQuantities({}); setOrder(null)
  }

  const action = step < 4 ? (
    <button
      onClick={() => navigate('/staff/orders')}
      style={{
        padding: '8px 14px',
        background: 'rgba(255,255,255,0.68)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.72)',
        borderRadius: 10, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text2)',
      }}
    >
      Cancel
    </button>
  ) : null

  return (
    <AuthenticatedLayout title="New Order" subtitle={`Step ${step} of 4`} action={action}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <StepIndicator currentStep={step} />

        <div style={{ ...glass, padding: 22 }}>
          {step === 1 && <Step1 initialPhone={initialPhone} onFound={handleCustomerFound} />}
          {step === 2 && (
            <Step2
              priceList={priceList}
              loadingPriceList={loadingPriceList}
              loadError={priceListError}
              quantities={quantities}
              setQuantities={setQuantities}
              onContinue={() => setStep(3)}
              onBack={() => setStep(1)}
              onRetry={loadPriceList}
            />
          )}
          {step === 3 && customer && (
            <Step3
              customer={customer}
              priceList={priceList}
              quantities={quantities}
              onPlaceOrder={handlePlaceOrder}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && order && customer && (
            <Step4 customer={customer} order={order} onNewOrder={handleNewOrder} />
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

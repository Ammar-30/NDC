import { useState, useEffect } from 'react'
import { Package } from 'lucide-react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { getInventory, updateInventory, getLowStock } from '../../utils/api'
import toast from 'react-hot-toast'

function InventoryRow({ item, isLast, onQuantityUpdate }) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(item.quantity))
  const isLow = Number(item.quantity) <= Number(item.low_stock_threshold)

  useEffect(() => {
    if (!editing) setEditValue(String(item.quantity))
  }, [item.quantity, editing])

  async function saveQuantity() {
    const qty = parseInt(editValue, 10)
    if (Number.isNaN(qty) || qty < 0) {
      toast.error('Please enter a valid quantity')
      setEditValue(String(item.quantity))
      setEditing(false)
      return
    }
    setEditing(false)
    if (qty === Number(item.quantity)) return
    await onQuantityUpdate(item.id, qty)
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 120px 140px',
      gap: 12,
      padding: '11px 16px',
      alignItems: 'center',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      background: isLow ? 'var(--red-soft)' : 'white',
      transition: 'background 0.15s',
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: isLow ? 'var(--red)' : 'var(--text)' }}>
        {item.item_name}
      </span>

      <div>
        {editing ? (
          <input
            type="number"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveQuantity}
            onKeyDown={e => {
              if (e.key === 'Enter') saveQuantity()
              if (e.key === 'Escape') {
                setEditValue(String(item.quantity))
                setEditing(false)
              }
            }}
            autoFocus
            min="0"
            style={{
              width: 70,
              padding: '4px 6px',
              border: '1.5px solid var(--accent)',
              borderRadius: 5,
              fontSize: 13,
              fontWeight: 700,
              outline: 'none',
              fontFamily: 'inherit',
              boxShadow: '0 0 0 2px var(--accent-soft)',
            }}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            title="Click to edit"
            style={{
              background: 'none',
              border: 'none',
              padding: '3px 6px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: isLow ? 'var(--red)' : 'var(--text)',
              fontFamily: 'inherit',
              borderRadius: 5,
            }}
          >
            {item.quantity}
          </button>
        )}
      </div>

      <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>
        low at {item.low_stock_threshold}
      </span>
    </div>
  )
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('supplies')
  const [items, setItems] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [inventoryRes, lowStockRes] = await Promise.all([getInventory(), getLowStock()])
        if (cancelled) return
        setItems(inventoryRes.items || [])
        setLowStockItems(lowStockRes.items || [])
      } catch (err) {
        if (!cancelled) toast.error(err.message || 'Failed to load inventory')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = items.filter(i => i.category === activeTab)

  const lowCountByCategory = lowStockItems.reduce((acc, item) => {
    const key = item.category
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  async function handleQuantityUpdate(id, newQty) {
    const previous = items
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item))

    try {
      const data = await updateInventory(id, { quantity: newQty })
      setItems(prev => prev.map(item => item.id === id ? data.item : item))
      setLowStockItems(prev => {
        const withoutCurrent = prev.filter(item => item.id !== id)
        if (Number(data.item.quantity) <= Number(data.item.low_stock_threshold)) {
          return [...withoutCurrent, data.item]
        }
        return withoutCurrent
      })
    } catch (err) {
      setItems(previous)
      toast.error(err.message || 'Failed to update quantity')
    }
  }

  return (
    <AuthenticatedLayout title="Inventory" subtitle="Stock management">
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: 14,
        background: 'white',
        borderRadius: '10px 10px 0 0',
        padding: '0 4px',
      }}>
        {['supplies', 'equipment'].map(tab => {
          const isActive = activeTab === tab
          const lowCount = lowCountByCategory[tab] || 0
          const label = lowCount > 0
            ? `${tab.charAt(0).toUpperCase() + tab.slice(1)} (${lowCount} low)`
            : tab.charAt(0).toUpperCase() + tab.slice(1)

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                color: isActive ? 'var(--accent)' : 'var(--text2)',
                fontWeight: isActive ? 600 : 500,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.15s',
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(10,15,30,0.06)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 140px',
          gap: 12,
          padding: '9px 16px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}>
          {['Item Name', 'Quantity', 'Threshold'].map(h => (
            <span key={h} style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text3)',
            }}>
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title={`No ${activeTab} items`}
            subtitle="No inventory items in this category"
          />
        ) : (
          filtered.map((item, i) => (
            <InventoryRow
              key={item.id}
              item={item}
              isLast={i === filtered.length - 1}
              onQuantityUpdate={handleQuantityUpdate}
            />
          ))
        )}
      </div>
    </AuthenticatedLayout>
  )
}

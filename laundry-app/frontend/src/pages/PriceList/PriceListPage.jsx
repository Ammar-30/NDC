import { useEffect, useMemo, useState } from 'react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  createPriceListItem, deletePriceListItem,
  getPriceListAll, togglePriceListItem, updatePriceListItem,
} from '../../utils/api'
import { ListChecks, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const glass = {
  background: 'rgba(255,255,255,0.68)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.72)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(10,15,30,0.07), 0 1px 0 rgba(255,255,255,0.80) inset',
}

const inputStyle = {
  padding: '9px 12px',
  background: 'rgba(255,255,255,0.70)',
  border: '1.5px solid rgba(200,215,235,0.80)',
  borderRadius: 10,
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
  color: 'var(--text)',
  transition: 'border-color 0.18s, box-shadow 0.18s',
}

function focusInput(e) {
  e.target.style.borderColor = 'var(--accent)'
  e.target.style.boxShadow   = '0 0 0 3px rgba(22,163,74,0.10)'
}
function blurInput(e) {
  e.target.style.borderColor = 'rgba(200,215,235,0.80)'
  e.target.style.boxShadow   = 'none'
}

function PriceRow({ item, isEditing, editName, editPrice, onStartEdit, onEditName, onEditPrice, onCancel, onSave, onToggle, onDelete }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 140px 110px 250px',
        gap: 10,
        alignItems: 'center',
        padding: '11px 16px',
        borderBottom: '1px solid rgba(10,15,30,0.06)',
        background: hovered && !isEditing
          ? 'rgba(22,163,74,0.03)'
          : item.is_active ? 'transparent' : 'rgba(107,114,128,0.04)',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isEditing ? (
        <input
          value={editName}
          onChange={e => onEditName(e.target.value)}
          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
          onFocus={focusInput}
          onBlur={blurInput}
        />
      ) : (
        <span style={{ fontSize: 13, fontWeight: 600, color: item.is_active ? 'var(--text)' : 'var(--text3)' }}>
          {item.item_name}
        </span>
      )}

      {isEditing ? (
        <input
          type="number"
          min="1"
          value={editPrice}
          onChange={e => onEditPrice(e.target.value)}
          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
          onFocus={focusInput}
          onBlur={blurInput}
        />
      ) : (
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
          Rs.&nbsp;{Number(item.price_pkr).toLocaleString()}
        </span>
      )}

      <div>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
          padding: '3px 9px', borderRadius: 20,
          background: item.is_active ? 'rgba(15,118,110,0.10)' : 'rgba(107,114,128,0.10)',
          color: item.is_active ? '#0f766e' : 'var(--text3)',
          border: `1px solid ${item.is_active ? 'rgba(15,118,110,0.18)' : 'rgba(107,114,128,0.14)'}`,
        }}>
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {isEditing ? (
          <>
            <button
              onClick={onSave}
              style={{
                padding: '7px 12px',
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: 'white', border: 'none', borderRadius: 8,
                fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
              }}
            >
              Save
            </button>
            <button
              onClick={onCancel}
              style={{
                padding: '7px 12px',
                background: 'rgba(255,255,255,0.68)',
                backdropFilter: 'blur(8px)',
                color: 'var(--text2)',
                border: '1px solid rgba(255,255,255,0.72)',
                borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={onStartEdit}
            style={{
              padding: '7px 12px',
              background: 'rgba(255,255,255,0.68)',
              backdropFilter: 'blur(8px)',
              color: 'var(--text2)',
              border: '1px solid rgba(255,255,255,0.72)',
              borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Edit
          </button>
        )}
        <button
          onClick={onToggle}
          style={{
            padding: '7px 12px',
            background: item.is_active ? 'rgba(245,158,11,0.10)' : 'rgba(15,118,110,0.10)',
            color: item.is_active ? 'var(--amber)' : '#0f766e',
            border: `1px solid ${item.is_active ? 'rgba(245,158,11,0.20)' : 'rgba(15,118,110,0.20)'}`,
            borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {item.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '7px 12px',
            background: 'rgba(239,68,68,0.08)',
            color: 'var(--red)',
            border: '1px solid rgba(239,68,68,0.18)',
            borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default function PriceListPage() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState('')
  const [newName, setNewName]     = useState('')
  const [newPrice, setNewPrice]   = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName]   = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function loadItems() {
    setLoading(true)
    try {
      const data = await getPriceListAll()
      setItems(data.items || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load price list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadItems() }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return items
    return items.filter(item => item.item_name.toLowerCase().includes(needle))
  }, [items, query])

  async function handleAdd() {
    const name  = newName.trim()
    const price = Number(newPrice)
    if (!name) return toast.error('Item name is required')
    if (!Number.isFinite(price) || price <= 0) return toast.error('Price must be greater than 0')

    try {
      const result = await createPriceListItem({ item_name: name, price_pkr: price })
      setItems(prev => [...prev, result.item].sort((a, b) => a.item_name.localeCompare(b.item_name)))
      setNewName(''); setNewPrice('')
      toast.success('Item added')
    } catch (err) {
      toast.error(err.message || 'Failed to add item')
    }
  }

  function startEdit(item) {
    setEditingId(item.id)
    setEditName(item.item_name)
    setEditPrice(String(Number(item.price_pkr)))
  }

  async function saveEdit(id) {
    const name  = editName.trim()
    const price = Number(editPrice)
    if (!name) return toast.error('Item name is required')
    if (!Number.isFinite(price) || price <= 0) return toast.error('Price must be greater than 0')

    try {
      const result = await updatePriceListItem(id, { item_name: name, price_pkr: price })
      setItems(prev => prev.map(item => item.id === id ? result.item : item).sort((a, b) => a.item_name.localeCompare(b.item_name)))
      setEditingId(null)
      toast.success('Item updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update item')
    }
  }

  async function handleToggle(id) {
    try {
      const result = await togglePriceListItem(id)
      setItems(prev => prev.map(item => item.id === id ? result.item : item))
      toast.success(result.item.is_active ? 'Item activated' : 'Item deactivated')
    } catch (err) {
      toast.error(err.message || 'Failed to update status')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deletePriceListItem(deleteTarget.id)
      setItems(prev => prev.filter(item => item.id !== deleteTarget.id))
      toast.success('Item deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete item')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <AuthenticatedLayout title="Price List" subtitle="Manage cloth items and prices">

      {/* Add new item */}
      <div style={{ ...glass, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Cloth type name"
            style={{ ...inputStyle, flex: '1 1 220px', boxSizing: 'border-box' }}
            onFocus={focusInput}
            onBlur={blurInput}
          />
          <input
            type="number"
            min="1"
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
            placeholder="Price PKR"
            style={{ ...inputStyle, flex: '0 0 140px', boxSizing: 'border-box' }}
            onFocus={focusInput}
            onBlur={blurInput}
          />
          <button
            onClick={handleAdd}
            style={{
              flex: '0 0 auto', padding: '9px 16px',
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: 'white', border: 'none', borderRadius: 10,
              fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(22,163,74,0.28)',
              transition: 'box-shadow 0.18s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,163,74,0.38)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.28)'}
          >
            Add Cloth Type
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ ...glass, overflow: 'hidden' }}>
        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(10,15,30,0.06)', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search cloth type…"
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', paddingLeft: 34 }}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 720 }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1.5fr 140px 110px 250px',
              gap: 10, padding: '9px 16px',
              borderBottom: '1px solid rgba(10,15,30,0.06)',
              background: 'rgba(22,163,74,0.03)',
            }}>
              {['Item', 'Price', 'Status', 'Actions'].map((col, i) => (
                <span key={col} style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
                  textTransform: 'uppercase', color: 'var(--text3)',
                  textAlign: i === 3 ? 'right' : 'left',
                }}>
                  {col}
                </span>
              ))}
            </div>

            {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="No price list items found"
                subtitle="Try a different search or add a new cloth type"
              />
            ) : (
              filtered.map(item => (
                <PriceRow
                  key={item.id}
                  item={item}
                  isEditing={editingId === item.id}
                  editName={editName}
                  editPrice={editPrice}
                  onStartEdit={() => startEdit(item)}
                  onEditName={setEditName}
                  onEditPrice={setEditPrice}
                  onCancel={() => setEditingId(null)}
                  onSave={() => saveEdit(item.id)}
                  onToggle={() => handleToggle(item.id)}
                  onDelete={() => setDeleteTarget(item)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Price Item"
        message={`Delete "${deleteTarget?.item_name || ''}" from the price list?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        danger
      />
    </AuthenticatedLayout>
  )
}

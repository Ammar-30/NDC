import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, Building2, ShieldCheck,
  ActivitySquare, Plus, Pencil, ToggleLeft, ToggleRight,
  Trash2, KeyRound, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import {
  getAdminStats,
  getAdminOwners, createAdminOwner, updateAdminOwner,
  getAdminBranches, createAdminBranch, updateAdminBranch,
  getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser,
  getAdminAdmins, createAdminAdmin, updateAdminAdmin,
  getActivityLogs,
} from '../../utils/api'

// ── helpers ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: 'Overview',      Icon: LayoutDashboard },
  { id: 'owners',    label: 'Owners',         Icon: ShieldCheck },
  { id: 'branches',  label: 'Branches',       Icon: Building2 },
  { id: 'users',     label: 'Users',          Icon: Users },
  { id: 'admins',    label: 'Admins',         Icon: ShieldCheck },
  { id: 'logs',      label: 'Activity Log',   Icon: ActivitySquare },
]

const S = {
  card: {
    background: 'white',
    borderRadius: 14,
    border: '1px solid rgba(0,0,0,0.07)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    padding: 20,
    marginBottom: 14,
  },
  label: { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 },
  input: {
    width: '100%', padding: '9px 12px',
    border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
    background: 'white', color: '#111',
  },
  select: {
    width: '100%', padding: '9px 12px',
    border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
    background: 'white', color: '#111',
  },
  btnPrimary: {
    padding: '9px 18px', borderRadius: 8,
    background: 'linear-gradient(135deg,#16a34a,#22c55e)',
    color: 'white', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  btnDanger: {
    padding: '6px 12px', borderRadius: 7,
    background: 'rgba(239,68,68,0.10)', color: '#EF4444',
    border: '1px solid rgba(239,68,68,0.20)', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 4,
  },
  btnSecondary: {
    padding: '6px 12px', borderRadius: 7,
    background: 'rgba(22,163,74,0.10)', color: '#16a34a',
    border: '1px solid rgba(22,163,74,0.20)', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 4,
  },
  btnGhost: {
    padding: '6px 12px', borderRadius: 7,
    background: 'rgba(0,0,0,0.05)', color: '#374151',
    border: '1px solid transparent', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 4,
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    padding: '8px 12px', textAlign: 'left',
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: '#6b7280',
    borderBottom: '1px solid #f3f4f6',
  },
  td: { padding: '10px 12px', borderBottom: '1px solid #f9fafb', color: '#1f2937' },
}

function Badge({ active }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
      background: active ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.10)',
      color: active ? '#16a34a' : '#EF4444',
    }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function RoleBadge({ role }) {
  const colors = {
    staff: { bg: 'rgba(59,130,246,0.12)', color: '#2563eb' },
    owner: { bg: 'rgba(245,158,11,0.15)', color: '#d97706' },
    'super-admin': { bg: 'rgba(139,92,246,0.15)', color: '#7c3aed' },
  }
  const c = colors[role] || colors.staff
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
      background: c.bg, color: c.color, textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {role}
    </span>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 16, width: '100%', maxWidth: 460,
        boxShadow: '0 24px 80px rgba(0,0,0,0.20)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px', borderBottom: '1px solid #f3f4f6',
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '18px 20px 20px', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return <div style={{ marginBottom: 14 }}><label style={S.label}>{label}</label>{children}</div>
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getAdminStats().then(setStats).catch(e => toast.error(e.message))
  }, [])

  const cards = stats ? [
    { label: 'Total Owners',   value: stats.totalOwners,   color: '#7c3aed' },
    { label: 'Total Branches', value: stats.totalBranches, color: '#2563eb' },
    { label: 'Total Users',    value: stats.totalUsers,    color: '#16a34a' },
    { label: 'Orders Today',   value: stats.ordersToday,   color: '#d97706' },
    { label: 'Revenue Today',  value: `Rs. ${Number(stats.revenueToday).toLocaleString()}`, color: '#db2777' },
  ] : []

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, marginBottom: 20 }}>
        {cards.map(c => (
          <div key={c.label} style={{
            ...S.card, marginBottom: 0,
            borderTop: `3px solid ${c.color}`,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {c.label}
            </p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: c.color }}>
              {stats ? c.value : '—'}
            </p>
          </div>
        ))}
      </div>
      {!stats && <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading stats…</p>}
    </div>
  )
}

// ── OWNERS TAB ────────────────────────────────────────────────────────────────

function OwnersTab() {
  const [owners, setOwners] = useState([])
  const [modal, setModal] = useState(null) // null | { mode:'create'|'edit', data? }
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    getAdminOwners().then(r => setOwners(r.owners)).catch(e => toast.error(e.message))
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm({}); setModal({ mode: 'create' }) }
  function openEdit(o)  { setForm({ name: o.name, email: o.email }); setModal({ mode: 'edit', data: o }) }

  async function save() {
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await createAdminOwner(form)
        toast.success('Owner created')
      } else {
        await updateAdminOwner(modal.data.id, form)
        toast.success('Owner updated')
      }
      setModal(null)
      load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function toggleActive(o) {
    try {
      await updateAdminOwner(o.id, { is_active: !o.is_active })
      toast.success(o.is_active ? 'Owner deactivated' : 'Owner activated')
      load()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button style={S.btnPrimary} onClick={openCreate}><Plus size={14} />New Owner</button>
      </div>
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              {['Name','Email','Branches','Status','Created','Actions'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {owners.map(o => (
              <tr key={o.id}>
                <td style={S.td}><strong>{o.name}</strong></td>
                <td style={S.td}>{o.email}</td>
                <td style={S.td}>{o.branch_count}</td>
                <td style={S.td}><Badge active={o.is_active} /></td>
                <td style={S.td}>{new Date(o.created_at).toLocaleDateString()}</td>
                <td style={S.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={S.btnGhost} onClick={() => openEdit(o)}><Pencil size={12} />Edit</button>
                    <button style={o.is_active ? S.btnDanger : S.btnSecondary} onClick={() => toggleActive(o)}>
                      {o.is_active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                      {o.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!owners.length && (
              <tr><td style={{ ...S.td, color: '#9ca3af' }} colSpan={6}>No owners yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.mode === 'create' ? 'New Owner' : 'Edit Owner'} onClose={() => setModal(null)}>
          <Field label="Full Name">
            <input style={S.input} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Email">
            <input style={S.input} type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label={modal.mode === 'create' ? 'Password' : 'New Password (leave blank to keep)'}>
            <input style={S.input} type="password" value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button style={S.btnGhost} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── BRANCHES TAB ──────────────────────────────────────────────────────────────

function BranchesTab() {
  const [branches, setBranches] = useState([])
  const [owners, setOwners] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    Promise.all([getAdminBranches(), getAdminOwners()])
      .then(([br, ow]) => { setBranches(br.branches); setOwners(ow.owners) })
      .catch(e => toast.error(e.message))
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm({}); setModal({ mode: 'create' }) }
  function openEdit(b)  { setForm({ name: b.name, city: b.city, address: b.address || '' }); setModal({ mode: 'edit', data: b }) }

  async function save() {
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await createAdminBranch(form)
        toast.success('Branch created')
      } else {
        await updateAdminBranch(modal.data.id, form)
        toast.success('Branch updated')
      }
      setModal(null)
      load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function toggleActive(b) {
    try {
      await updateAdminBranch(b.id, { is_active: !b.is_active })
      toast.success(b.is_active ? 'Branch deactivated' : 'Branch activated')
      load()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button style={S.btnPrimary} onClick={openCreate}><Plus size={14} />New Branch</button>
      </div>
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              {['Branch','City','Owner','Staff','Status','Created','Actions'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map(b => (
              <tr key={b.id}>
                <td style={S.td}><strong>{b.name}</strong></td>
                <td style={S.td}>{b.city}</td>
                <td style={S.td}>{b.owner_name}</td>
                <td style={S.td}>{b.staff_count}</td>
                <td style={S.td}><Badge active={b.is_active} /></td>
                <td style={S.td}>{new Date(b.created_at).toLocaleDateString()}</td>
                <td style={S.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={S.btnGhost} onClick={() => openEdit(b)}><Pencil size={12} />Edit</button>
                    <button style={b.is_active ? S.btnDanger : S.btnSecondary} onClick={() => toggleActive(b)}>
                      {b.is_active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                      {b.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!branches.length && (
              <tr><td style={{ ...S.td, color: '#9ca3af' }} colSpan={7}>No branches yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.mode === 'create' ? 'New Branch' : 'Edit Branch'} onClose={() => setModal(null)}>
          <Field label="Branch Name">
            <input style={S.input} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="City">
            <input style={S.input} value={form.city || ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
          </Field>
          <Field label="Address (optional)">
            <input style={S.input} value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </Field>
          {modal.mode === 'create' && (
            <Field label="Owner">
              <select style={S.select} value={form.owner_id || ''} onChange={e => setForm(f => ({ ...f, owner_id: e.target.value }))}>
                <option value="">— Select Owner —</option>
                {owners.filter(o => o.is_active).map(o => (
                  <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
                ))}
              </select>
            </Field>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button style={S.btnGhost} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── USERS TAB ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    Promise.all([getAdminUsers(), getAdminBranches()])
      .then(([u, b]) => { setUsers(u.users); setBranches(b.branches) })
      .catch(e => toast.error(e.message))
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm({ role: 'staff' }); setModal({ mode: 'create' }) }
  function openEdit(u)  { setForm({ name: u.name, email: u.email, role: u.role, branch_id: u.branch_id }); setModal({ mode: 'edit', data: u }) }
  function openPwd(u)   { setForm({ password: '' }); setModal({ mode: 'password', data: u }) }

  async function save() {
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await createAdminUser(form)
        toast.success('User created')
      } else if (modal.mode === 'edit') {
        await updateAdminUser(modal.data.id, form)
        toast.success('User updated')
      } else if (modal.mode === 'password') {
        await updateAdminUser(modal.data.id, { password: form.password })
        toast.success('Password updated')
      }
      setModal(null)
      load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function toggleActive(u) {
    try {
      await updateAdminUser(u.id, { is_active: !u.is_active })
      toast.success(u.is_active ? 'User deactivated' : 'User activated')
      load()
    } catch (e) { toast.error(e.message) }
  }

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.branch_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
        <input
          style={{ ...S.input, maxWidth: 280 }}
          placeholder="Search name, email, branch…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button style={S.btnPrimary} onClick={openCreate}><Plus size={14} />New User</button>
      </div>
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              {['Name','Email','Role','Branch','Owner','Status','Actions'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={S.td}><strong>{u.name}</strong></td>
                <td style={S.td}>{u.email}</td>
                <td style={S.td}><RoleBadge role={u.role} /></td>
                <td style={S.td}>{u.branch_name}</td>
                <td style={S.td}>{u.owner_name}</td>
                <td style={S.td}><Badge active={u.is_active} /></td>
                <td style={S.td}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <button style={S.btnGhost} onClick={() => openEdit(u)}><Pencil size={12} />Edit</button>
                    <button style={S.btnGhost} onClick={() => openPwd(u)}><KeyRound size={12} />Password</button>
                    <button style={u.is_active ? S.btnDanger : S.btnSecondary} onClick={() => toggleActive(u)}>
                      {u.is_active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td style={{ ...S.td, color: '#9ca3af' }} colSpan={7}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && modal.mode !== 'password' && (
        <Modal title={modal.mode === 'create' ? 'New User' : 'Edit User'} onClose={() => setModal(null)}>
          <Field label="Full Name">
            <input style={S.input} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Email">
            <input style={S.input} type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Role">
            <select style={S.select} value={form.role || 'staff'} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="staff">Staff</option>
              <option value="owner">Owner</option>
            </select>
          </Field>
          <Field label="Branch">
            <select style={S.select} value={form.branch_id || ''} onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))}>
              <option value="">— Select Branch —</option>
              {branches.filter(b => b.is_active).map(b => (
                <option key={b.id} value={b.id}>{b.name} — {b.city} ({b.owner_name})</option>
              ))}
            </select>
          </Field>
          {modal.mode === 'create' && (
            <Field label="Password">
              <input style={S.input} type="password" value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </Field>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button style={S.btnGhost} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}

      {modal && modal.mode === 'password' && (
        <Modal title={`Reset password — ${modal.data.name}`} onClose={() => setModal(null)}>
          <Field label="New Password">
            <input style={S.input} type="password" value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button style={S.btnGhost} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} onClick={save} disabled={saving}>
              {saving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── ADMINS TAB ────────────────────────────────────────────────────────────────

function AdminsTab() {
  const [admins, setAdmins] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    getAdminAdmins().then(r => setAdmins(r.admins)).catch(e => toast.error(e.message))
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setForm({}); setModal({ mode: 'create' }) }
  function openEdit(a)  { setForm({ name: a.name }); setModal({ mode: 'edit', data: a }) }

  async function save() {
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await createAdminAdmin(form)
        toast.success('Admin created')
      } else {
        await updateAdminAdmin(modal.data.id, form)
        toast.success('Admin updated')
      }
      setModal(null)
      load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function toggleActive(a) {
    try {
      await updateAdminAdmin(a.id, { is_active: !a.is_active })
      toast.success(a.is_active ? 'Admin deactivated' : 'Admin activated')
      load()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <div style={{
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#92400e',
      }}>
        Super-admin accounts have full unrestricted access to the entire system.
        Create these accounts with care.
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button style={S.btnPrimary} onClick={openCreate}><Plus size={14} />New Admin</button>
      </div>
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              {['Name','Email','Status','Created','Actions'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id}>
                <td style={S.td}><strong>{a.name}</strong></td>
                <td style={S.td}>{a.email}</td>
                <td style={S.td}><Badge active={a.is_active} /></td>
                <td style={S.td}>{new Date(a.created_at).toLocaleDateString()}</td>
                <td style={S.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={S.btnGhost} onClick={() => openEdit(a)}><Pencil size={12} />Edit</button>
                    <button style={a.is_active ? S.btnDanger : S.btnSecondary} onClick={() => toggleActive(a)}>
                      {a.is_active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                      {a.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!admins.length && (
              <tr><td style={{ ...S.td, color: '#9ca3af' }} colSpan={5}>No admins yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal.mode === 'create' ? 'New Admin' : 'Edit Admin'} onClose={() => setModal(null)}>
          <Field label="Full Name">
            <input style={S.input} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          {modal.mode === 'create' && (
            <Field label="Email">
              <input style={S.input} type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </Field>
          )}
          <Field label={modal.mode === 'create' ? 'Password' : 'New Password (leave blank to keep)'}>
            <input style={S.input} type="password" value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button style={S.btnGhost} onClick={() => setModal(null)}>Cancel</button>
            <button style={S.btnPrimary} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── ACTIVITY LOG TAB ──────────────────────────────────────────────────────────

const ACTION_COLORS = {
  LOGIN:            { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a' },
  CREATE_OWNER:     { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed' },
  UPDATE_OWNER:     { bg: 'rgba(139,92,246,0.10)', color: '#7c3aed' },
  CREATE_BRANCH:    { bg: 'rgba(59,130,246,0.12)', color: '#2563eb' },
  UPDATE_BRANCH:    { bg: 'rgba(59,130,246,0.10)', color: '#2563eb' },
  CREATE_USER:      { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
  UPDATE_USER:      { bg: 'rgba(245,158,11,0.10)', color: '#d97706' },
  DEACTIVATE_USER:  { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626' },
  CREATE_ADMIN:     { bg: 'rgba(219,39,119,0.12)', color: '#be185d' },
  UPDATE_ADMIN:     { bg: 'rgba(219,39,119,0.10)', color: '#be185d' },
}

function LogsTab() {
  const [logs, setLogs]   = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage]   = useState(1)
  const [filters, setFilters] = useState({ action: '', entity_type: '' })
  const LIMIT = 30

  const load = useCallback(() => {
    getActivityLogs({ page, limit: LIMIT, ...filters })
      .then(r => { setLogs(r.logs); setTotal(r.total) })
      .catch(e => toast.error(e.message))
  }, [page, filters])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / LIMIT)

  function fmt(ts) {
    const d = new Date(ts)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function ActionBadge({ action }) {
    const c = ACTION_COLORS[action] || { bg: 'rgba(0,0,0,0.06)', color: '#374151' }
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
        background: c.bg, color: c.color, letterSpacing: '0.05em',
      }}>
        {action}
      </span>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          style={{ ...S.input, maxWidth: 200 }}
          placeholder="Filter by action…"
          value={filters.action}
          onChange={e => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1) }}
        />
        <select
          style={{ ...S.select, maxWidth: 180 }}
          value={filters.entity_type}
          onChange={e => { setFilters(f => ({ ...f, entity_type: e.target.value })); setPage(1) }}
        >
          <option value="">All entities</option>
          {['owner','branch','user','admin'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>{total} events</span>
      </div>

      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              {['When','Actor','Role','Action','Entity','Details','IP'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td style={{ ...S.td, whiteSpace: 'nowrap', fontSize: 12 }}>{fmt(l.created_at)}</td>
                <td style={S.td}>{l.actor_name || '—'}</td>
                <td style={S.td}>{l.actor_role ? <RoleBadge role={l.actor_role} /> : '—'}</td>
                <td style={S.td}><ActionBadge action={l.action} /></td>
                <td style={S.td}>{l.entity_type || '—'}</td>
                <td style={{ ...S.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: '#6b7280' }}>
                  {l.details ? JSON.stringify(l.details) : '—'}
                </td>
                <td style={{ ...S.td, fontSize: 11, color: '#9ca3af' }}>{l.ip_address || '—'}</td>
              </tr>
            ))}
            {!logs.length && (
              <tr><td style={{ ...S.td, color: '#9ca3af' }} colSpan={7}>No activity logs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <button style={S.btnGhost} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Page {page} of {totalPages}</span>
          <button style={S.btnGhost} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState('overview')

  const CONTENT = {
    overview: <OverviewTab />,
    owners:   <OwnersTab />,
    branches: <BranchesTab />,
    users:    <UsersTab />,
    admins:   <AdminsTab />,
    logs:     <LogsTab />,
  }

  return (
    <AuthenticatedLayout title="Super Admin" subtitle="System control panel">
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        background: 'white', borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.07)',
        padding: 6, marginBottom: 18,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 500,
                fontFamily: 'inherit',
                background: active
                  ? 'linear-gradient(135deg,rgba(22,163,74,0.18),rgba(34,197,94,0.12))'
                  : 'transparent',
                color: active ? '#16a34a' : '#6b7280',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          )
        })}
      </div>

      {CONTENT[tab]}
    </AuthenticatedLayout>
  )
}

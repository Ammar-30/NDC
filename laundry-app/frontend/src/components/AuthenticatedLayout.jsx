import { useContext } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Plus, Users,
  BarChart2, ListChecks, LogOut, ShieldCheck,
} from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { SyncContext } from '../context/SyncContext'
import SyncDot from './SyncDot'
import { useMediaQuery } from '../hooks/useMediaQuery'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const STAFF_NAV = [
  { to: '/',                  label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { to: '/staff/orders',      label: 'Orders',    Icon: ShoppingBag },
  { to: '/staff/orders/new',  label: 'New Order', Icon: Plus },
  { to: '/staff/customers',   label: 'Customers', Icon: Users },
]

const OWNER_NAV = [
  { to: '/',                  label: 'Dashboard', Icon: BarChart2,   exact: true },
  { to: '/owner/price-list',  label: 'Price List', Icon: ListChecks },
  { to: '/owner/reports',     label: 'Reports',   Icon: BarChart2 },
]

const SUPER_ADMIN_NAV = [
  { to: '/admin', label: 'Admin Panel', Icon: ShieldCheck, exact: true },
]

function NavItem({ to, label, Icon, exact }) {
  return (
    <NavLink
      to={to}
      end={exact}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 10,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: isActive ? 600 : 500,
        transition: 'all 0.18s ease',
        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.48)',
        background: isActive
          ? 'linear-gradient(135deg, rgba(22,163,74,0.28) 0%, rgba(34,197,94,0.18) 100%)'
          : 'transparent',
        border: isActive ? '1px solid rgba(22,163,74,0.28)' : '1px solid transparent',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.55 }} />
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function AuthenticatedLayout({ title, subtitle, action, children }) {
  const { user, logout } = useContext(AuthContext)
  const { syncStatus } = useContext(SyncContext)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const navItems = user?.role === 'super-admin' ? SUPER_ADMIN_NAV
    : user?.role === 'owner' ? OWNER_NAV
    : STAFF_NAV
  const mobileNav = navItems.slice(0, 5)

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── SIDEBAR — desktop only ─────────────────────── */}
        {!isMobile && (
          <aside style={{
            width: 228,
            flexShrink: 0,
            background: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'fixed',
            top: 0, left: 0,
            zIndex: 100,
            borderRight: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '4px 0 40px rgba(0,0,0,0.22)',
          }}>
            {/* Logo */}
            <div style={{
              padding: '20px 18px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(22,163,74,0.40)',
                }}>
                  <span style={{ color: 'white', fontSize: 11, fontWeight: 800, letterSpacing: '0.5px' }}>NDC</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 15, fontWeight: 700,
                    color: 'white', letterSpacing: '-0.3px', lineHeight: 1.2,
                  }}>National Dry Cleaners</p>
                  <p style={{
                    margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.38)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {user?.branchName || 'Laundry Network'}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
              <p style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
                color: 'rgba(255,255,255,0.22)',
                textTransform: 'uppercase',
                padding: '0 6px', margin: '0 0 8px',
              }}>
                Menu
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {navItems.map(item => <NavItem key={item.to} {...item} />)}
              </div>
            </nav>

            {/* User section */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 10, padding: '8px 10px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'white',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(22,163,74,0.32)',
                }}>
                  {getInitials(user?.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 13, fontWeight: 600, color: 'white',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {user?.name || 'User'}
                  </p>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: user?.role === 'super-admin' ? '#7c3aed' : user?.role === 'owner' ? '#F59E0B' : '#22c55e',
                    background: user?.role === 'super-admin' ? 'rgba(139,92,246,0.15)' : user?.role === 'owner' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                    padding: '1px 6px', borderRadius: 4,
                  }}>
                    {user?.role}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  width: '100%', padding: '8px 10px',
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: 'rgba(255,255,255,0.38)',
                  cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  borderRadius: 8, fontFamily: 'inherit',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#EF4444'
                  e.currentTarget.style.background = 'rgba(239,68,68,0.10)'
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.18)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.38)'
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </aside>
        )}

        {/* ── MAIN CONTENT ──────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          marginLeft: isMobile ? 0 : 228,
        }}>
          {/* TOP BAR */}
          <header style={{
            height: 60,
            flexShrink: 0,
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderBottom: '1px solid rgba(255,255,255,0.64)',
            boxShadow: '0 1px 0 rgba(10,15,30,0.05), 0 4px 16px rgba(10,15,30,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 22px',
            zIndex: 50,
            position: 'relative',
          }}>
            <div>
              <h1 style={{
                margin: 0, fontSize: 16, fontWeight: 700,
                color: 'var(--text)', letterSpacing: '-0.4px', lineHeight: 1.2,
              }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text3)', lineHeight: 1.3 }}>
                  {subtitle}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {action && <div className="no-print">{action}</div>}
            </div>
          </header>

          {/* SCROLLABLE CONTENT */}
          <main
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 20,
              paddingBottom: isMobile ? 80 : 24,
              background: '#f3f4f6',
            }}
            className="slide-up"
          >
            {children}
          </main>
        </div>

        {/* ── MOBILE BOTTOM NAV ─────────────────────────── */}
        {isMobile && (
          <nav style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            height: 66,
            background: 'rgba(255,255,255,0.84)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            borderTop: '1px solid rgba(255,255,255,0.70)',
            boxShadow: '0 -4px 24px rgba(10,15,30,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 100,
          }}>
            {mobileNav.map(({ to, label, Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                style={({ isActive }) => ({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  textDecoration: 'none',
                  color: isActive ? 'var(--accent)' : 'var(--text3)',
                  flex: 1,
                  transition: 'color 0.18s ease',
                })}
              >
                {({ isActive }) => (
                  <>
                    <div style={{
                      width: 38, height: 38, borderRadius: 11,
                      background: isActive ? 'rgba(22,163,74,0.12)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.18s ease',
                    }}>
                      <Icon size={20} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, lineHeight: 1 }}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
            <button
              onClick={logout}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                background: 'none', border: 'none',
                color: 'var(--text3)',
                cursor: 'pointer', flex: 1,
                fontFamily: 'inherit',
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={20} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1 }}>Logout</span>
            </button>
          </nav>
        )}
      </div>

      <div
        className="no-print"
        style={{
          position: 'fixed',
          right: isMobile ? 12 : 18,
          bottom: isMobile ? 78 : 18,
          zIndex: 140,
        }}
      >
        <SyncDot status={syncStatus} />
      </div>
    </>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, AuthContext } from './context/AuthContext'
import { SyncProvider } from './context/SyncContext'
import { useContext } from 'react'
import LoginPage       from './pages/Login/LoginPage'
import StaffDashboard  from './pages/Dashboard/StaffDashboard'
import OwnerDashboard  from './pages/OwnerDashboard/OwnerDashboard'
import OrdersListPage  from './pages/Orders/OrdersListPage'
import NewOrderPage    from './pages/NewOrder/NewOrderPage'
import OrderDetailPage from './pages/OrderDetail/OrderDetailPage'
import CustomersPage   from './pages/Customers/CustomersPage'
import ReportsPage     from './pages/Reports/ReportsPage'
import PriceListPage   from './pages/PriceList/PriceListPage'
import AdminPage       from './pages/Admin/AdminPage'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext)
  if (loading) {
    return (
      <div style={{
        display: 'flex', height: '100vh',
        alignItems: 'center', justifyContent: 'center',
        background: '#f3f4f6',
      }}>
        <div style={{ textAlign: 'center' }} className="scale-in">
          <div style={{
            width: 60, height: 60,
            background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(22,163,74,0.36)',
          }}>
            <span style={{ color: 'white', fontSize: 17, fontWeight: 800, letterSpacing: '0.5px' }}>NDC</span>
          </div>
          <div style={{
            width: 32, height: 32, margin: '0 auto',
            borderRadius: '50%',
            border: '3px solid rgba(22,163,74,0.15)',
            borderTopColor: '#16a34a',
            animation: 'spin 0.75s linear infinite',
          }} />
        </div>
      </div>
    )
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function DashboardRoute() {
  const { user } = useContext(AuthContext)
  if (user?.role === 'super-admin') return <Navigate to="/admin" replace />
  return user?.role === 'owner' ? <OwnerDashboard /> : <StaffDashboard />
}

function SuperAdminRoute({ children }) {
  const { user, loading } = useContext(AuthContext)
  if (loading) return null
  return user?.role === 'super-admin' ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontSize: 13,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.80)',
                boxShadow: '0 8px 32px rgba(10,15,30,0.10)',
                color: '#0A0F1E',
              },
              success: {
                iconTheme: { primary: '#16a34a', secondary: 'white' },
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: 'white' },
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<PrivateRoute><DashboardRoute /></PrivateRoute>} />
            <Route path="/staff/orders"      element={<PrivateRoute><OrdersListPage /></PrivateRoute>} />
            <Route path="/staff/orders/new"  element={<PrivateRoute><NewOrderPage /></PrivateRoute>} />
            <Route path="/staff/orders/:id"  element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
            <Route path="/staff/customers"   element={<PrivateRoute><CustomersPage /></PrivateRoute>} />
            <Route path="/owner/reports"     element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
            <Route path="/owner/price-list"  element={<PrivateRoute><PriceListPage /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><SuperAdminRoute><AdminPage /></SuperAdminRoute></PrivateRoute>} />

            <Route path="/orders"     element={<Navigate to="/staff/orders"     replace />} />
            <Route path="/orders/new" element={<Navigate to="/staff/orders/new" replace />} />
            <Route path="/orders/:id" element={<Navigate to="/staff/orders"     replace />} />
            <Route path="/customers"  element={<Navigate to="/staff/customers"  replace />} />
            <Route path="/reports"    element={<Navigate to="/owner/reports"    replace />} />
            <Route path="/price-list" element={<Navigate to="/owner/price-list" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SyncProvider>
    </AuthProvider>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { PrivateRoute } from './routes/PrivateRoute';
import { PageLoader } from './components/ui/Spinner';
import type { UserRole } from './types';

// Auth pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// App pages
import { Dashboard } from './pages/dashboard/Dashboard';
import { MenuPage } from './pages/menu/MenuPage';
import { CartPage } from './pages/orders/CartPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { OrderDetail } from './pages/orders/OrderDetail';
import { PosPage } from './pages/orders/PosPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { ReservationsPage } from './pages/reservations/ReservationsPage';
import { TablesPage } from './pages/tables/TablesPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { ProcurementPage } from './pages/procurement/ProcurementPage';
import { FinancePage } from './pages/finance/FinancePage';
import { ReviewsPage } from './pages/reviews/ReviewsPage';
import { LoyaltyPage } from './pages/loyalty/LoyaltyPage';
import { ProfilePage } from './pages/profile/ProfilePage';

const STAFF: UserRole[] = ['ADMIN', 'MANAGER', 'EMPLOYEE'];
const MANAGEMENT: UserRole[] = ['ADMIN', 'MANAGER'];
const CLIENT_ONLY: UserRole[] = ['CLIENT'];

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'CLIENT') return <Navigate to="/menu" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected routes inside Layout */}
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<PrivateRoute roles={MANAGEMENT}><Dashboard /></PrivateRoute>} />
        <Route path="/menu" element={<PrivateRoute><MenuPage /></PrivateRoute>} />
        <Route path="/cart" element={<PrivateRoute roles={CLIENT_ONLY}><CartPage /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
        <Route path="/orders/:orderId" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
        <Route path="/pos" element={<PrivateRoute roles={STAFF}><PosPage /></PrivateRoute>} />
        <Route path="/payments" element={<PrivateRoute roles={STAFF}><PaymentsPage /></PrivateRoute>} />
        <Route path="/reservations" element={<PrivateRoute><ReservationsPage /></PrivateRoute>} />
        <Route path="/tables" element={<PrivateRoute roles={STAFF}><TablesPage /></PrivateRoute>} />
        <Route path="/inventory" element={<PrivateRoute roles={STAFF}><InventoryPage /></PrivateRoute>} />
        <Route path="/procurement" element={<PrivateRoute roles={MANAGEMENT}><ProcurementPage /></PrivateRoute>} />
        <Route path="/finance" element={<PrivateRoute roles={MANAGEMENT}><FinancePage /></PrivateRoute>} />
        <Route path="/reviews" element={<PrivateRoute roles={CLIENT_ONLY}><ReviewsPage /></PrivateRoute>} />
        <Route path="/loyalty" element={<PrivateRoute roles={CLIENT_ONLY}><LoyaltyPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute roles={CLIENT_ONLY}><ProfilePage /></PrivateRoute>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

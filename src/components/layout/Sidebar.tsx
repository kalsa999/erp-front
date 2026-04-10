import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, CreditCard,
  CalendarDays, LayoutGrid, PackageSearch, Truck, TrendingUp,
  Star, Gift, User, Menu, ChefHat, LogOut,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/cart', label: 'My Cart', icon: ShoppingCart, roles: ['CLIENT'] },
  { to: '/orders', label: 'Orders', icon: Menu },
  { to: '/pos', label: 'POS / Kitchen', icon: ChefHat, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { to: '/payments', label: 'Payments', icon: CreditCard, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { to: '/reservations', label: 'Reservations', icon: CalendarDays },
  { to: '/tables', label: 'Tables', icon: LayoutGrid, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { to: '/inventory', label: 'Inventory', icon: PackageSearch, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { to: '/procurement', label: 'Procurement', icon: Truck, roles: ['ADMIN', 'MANAGER'] },
  { to: '/finance', label: 'Finance', icon: TrendingUp, roles: ['ADMIN', 'MANAGER'] },
  { to: '/reviews', label: 'Reviews', icon: Star, roles: ['CLIENT'] },
  { to: '/loyalty', label: 'Loyalty', icon: Gift, roles: ['CLIENT'] },
  { to: '/profile', label: 'My Profile', icon: User, roles: ['CLIENT'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  const visible = navItems.filter((item) => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  });

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#0f172a] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide">RestaurantERP</p>
          <p className="text-xs text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold uppercase">
            {user?.fullName?.[0] ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.fullName}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

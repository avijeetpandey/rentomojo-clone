import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LogOut, Package, ShoppingCart, LayoutDashboard, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/catalog', label: 'Catalog', icon: Package },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Navbar() {
  const { user, token, clear } = useAuthStore();
  const { cart, refresh, reset } = useCartStore();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) refresh(token).catch(() => undefined);
    else reset();
  }, [token, refresh, reset]);

  const handleLogout = () => {
    clear();
    reset();
    toast.success('Signed out', 'See you soon!');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/90 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-fg text-xs">
            RM
          </span>
          <span>Rentomojo</span>
        </Link>

        {user ? (
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const isCart = item.to === '/cart';
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-canvas-subtle text-fg'
                        : 'text-fg-muted hover:text-fg hover:bg-canvas-subtle',
                    )
                  }
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                  {isCart && cart.summary.itemCount > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg">
                      {cart.summary.itemCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden sm:inline text-xs text-fg-muted">
                {user.fullName} · {user.city}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

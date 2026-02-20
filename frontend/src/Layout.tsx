

import { useAuth } from './hooks/use-auth';
import { useTheme } from './hooks/use-theme';
import { Moon, Sun, LogOut, Package, LayoutDashboard, Tag, ShoppingBag, User as UserIcon, ClipboardList } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';

export function Layout() { // Removed PropsWithChildren as it uses Outlet now
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!isAuthenticated) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Outlet /></div>;
  }

  const isAdmin = user?.roles.some(role => role.id === 3); 
  const isMerchant = user?.roles.some(role => role.id === 2); 

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border p-4 flex flex-col">
        <div className="mb-8 font-bold text-xl px-2">E-Commerce</div>
        
        <nav className="flex-1 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" href="/" />
          
          <NavItem icon={<ShoppingBag size={20} />} label="Shop" href="/shop" />

          {(isAdmin || isMerchant) && (
            <NavItem icon={<Package size={20} />} label="Products" href="/admin/products" />
          )}

          {isAdmin && (
             <NavItem icon={<Tag size={20} />} label="Categories" href="/categories" />
          )}
           
          {(isAdmin || isMerchant) && (
             <NavItem icon={<ClipboardList size={20} />} label="Inventory" href="/inventory" />
          )}

          {isAdmin && (
             <NavItem icon={<UserIcon size={20} />} label="Users" href="/users" />
          )}

        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
           <h1 className="text-xl font-semibold">Dashboard</h1> 
           
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                 <NavLink to="/profile" className="hover:text-foreground transition-colors flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">
                        {user?.email[0].toUpperCase()}
                    </div>
                    <span>{user?.email}</span>
                 </NavLink>
                 <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs border border-primary/20">
                    {user?.roles.map(r => r.name).join(', ')}
                 </span>
              </div>

              <div className="h-6 w-px bg-border mx-2"></div>

              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <button 
                onClick={logout}
                className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
           </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
           <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <NavLink 
      to={href} 
      className={({ isActive }) => clsx(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

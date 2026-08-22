'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ClipboardList, BarChart2, CircleDollarSign, Briefcase, LogOut, Sun, Moon, Menu, X as XIcon } from 'lucide-react';

const NAV = [
  { label: 'Loans',                icon: <ClipboardList size={18} />, path: '/loans',               perm: null           },
  { label: 'Decision Performance', icon: <BarChart2 size={18} />, path: '/reports/performance', perm: 'VIEW_REPORTS' },
  { label: 'Recovery Report',      icon: <CircleDollarSign size={18} />, path: '/reports/recovery',    perm: 'VIEW_REPORTS' },
];

export default function Sidebar() {
  const { admin, logout, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router   = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => { logout(); router.push('/login'); };
  const handleNav = (path) => { router.push(path); setIsOpen(false); };

  return (
    <>
      <div className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: 16 }}>
          <Briefcase size={20} className="text-primary" /> Lending Ops
        </div>
        <button className="mobile-menu-toggle" onClick={() => setIsOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ position: 'relative' }}>
          <button className="mobile-menu-toggle" onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: 16, right: 12 }}>
            <XIcon size={24} />
          </button>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={24} className="text-primary" />
          Lending Ops
        </h1>
        <p>Admin Panel</p>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => {
          if (item.perm && !hasPermission(item.perm)) return null;
          const active = pathname.startsWith(item.path);
          return (
            <button key={item.path} className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="admin-badge">
          <div className="admin-badge-name">{admin?.name}</div>
          <div className="admin-badge-email">{admin?.email}</div>
          <div className="admin-badge-role">{admin?.role}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-full btn-sm" onClick={handleLogout} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <LogOut size={16} />
            Sign Out
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

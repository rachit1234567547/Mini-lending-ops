'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const NAV = [
  { label: 'Loans',                icon: '📋', path: '/loans',               perm: null           },
  { label: 'Decision Performance', icon: '📊', path: '/reports/performance', perm: 'VIEW_REPORTS' },
  { label: 'Recovery Report',      icon: '💰', path: '/reports/recovery',    perm: 'VIEW_REPORTS' },
];

export default function Sidebar() {
  const { admin, logout, hasPermission } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>💼 Lending Ops</h1>
        <p>Admin Panel</p>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => {
          if (item.perm && !hasPermission(item.perm)) return null;
          const active = pathname.startsWith(item.path);
          return (
            <button key={item.path} className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => router.push(item.path)}>
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
        <button className="btn btn-ghost btn-full btn-sm" onClick={handleLogout}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}

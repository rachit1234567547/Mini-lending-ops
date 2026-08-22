'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import api from '@/services/api';
import { BarChart2, Info } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);

export default function PerformanceReportPage() {
  const { admin } = useAuth();
  const router    = useRouter();
  const [report,      setReport]      = useState([]);
  const [explanation, setExplanation] = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => { if (!admin) router.push('/login'); }, [admin, router]);
  useEffect(() => {
    if (!admin) return;
    api.get('/admin/reports/decision-performance')
      .then(({data}) => { setReport(data.report); setExplanation(data.explanation); })
      .catch((err)   => setError(err.response?.data?.error||'Failed to load report.'))
      .finally(()    => setLoading(false));
  }, [admin]);

  if (!admin) return null;
  if (loading) return <div className="app-shell"><Sidebar /><div className="main-content"><div className="page"><div className="empty-state"><span className="spinner" style={{width:32,height:32}}/></div></div></div></div>;

  const totalApproved  = report.reduce((s,r)=>s+r.approved,0);
  const totalRejected  = report.reduce((s,r)=>s+r.rejected,0);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div className="page">
          <div className="page-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChart2 size={24} /> Decision Performance</h2>
            <p>Unique loan decisions made by each admin</p>
          </div>

          <div className="kpi-box" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Info size={18} /> {explanation}</div>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="stat-grid">
            <div className="stat-card"><div className="stat-label">Total Approved</div><div className="stat-value" style={{color:'var(--green)'}}>{totalApproved}</div><div className="stat-sub">unique loans</div></div>
            <div className="stat-card"><div className="stat-label">Total Rejected</div><div className="stat-value" style={{color:'var(--red)'}}>{totalRejected}</div><div className="stat-sub">unique loans</div></div>
            <div className="stat-card"><div className="stat-label">Total Decisions</div><div className="stat-value" style={{color:'var(--accent)'}}>{totalApproved+totalRejected}</div><div className="stat-sub">across all admins</div></div>
            <div className="stat-card"><div className="stat-label">Active Admins</div><div className="stat-value" style={{color:'var(--purple)'}}>{report.length}</div><div className="stat-sub">with decisions</div></div>
          </div>

          {report.length===0 ? <div className="empty-state"><div className="empty-icon"><BarChart2 size={48} className="text-muted" /></div>No decisions recorded yet.</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Admin</th><th>Approved</th><th>Rejected</th><th>Total</th><th>Approval Rate</th></tr></thead>
                <tbody>
                  {report.map(row => {
                    const rate = row.totalDecisions>0 ? Math.round((row.approved/row.totalDecisions)*100) : 0;
                    return (
                      <tr key={row.adminEmail}>
                        <td style={{fontWeight:600}}>{row.adminEmail}</td>
                        <td><span style={{color:'var(--green)',fontWeight:700,fontSize:16}}>{row.approved}</span></td>
                        <td><span style={{color:'var(--red)',fontWeight:700,fontSize:16}}>{row.rejected}</span></td>
                        <td style={{fontWeight:700}}>{row.totalDecisions}</td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{flex:1,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                              <div style={{width:`${rate}%`,height:'100%',background:'var(--green)',borderRadius:3}}/>
                            </div>
                            <span style={{fontSize:12,color:'var(--text-secondary)',width:32}}>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

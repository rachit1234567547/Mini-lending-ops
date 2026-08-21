'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import api from '@/services/api';

const fmt = (n) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);

export default function RecoveryReportPage() {
  const { admin } = useAuth();
  const router    = useRouter();
  const [report,      setReport]      = useState([]);
  const [explanation, setExplanation] = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => { if (!admin) router.push('/login'); }, [admin, router]);
  useEffect(() => {
    if (!admin) return;
    api.get('/admin/reports/recovery')
      .then(({data}) => { setReport(data.report); setExplanation(data.explanation); })
      .catch((err)   => setError(err.response?.data?.error||'Failed.'))
      .finally(()    => setLoading(false));
  }, [admin]);

  if (!admin) return null;
  if (loading) return <div className="app-shell"><Sidebar /><div className="main-content"><div className="page"><div className="empty-state"><span className="spinner" style={{width:32,height:32}}/></div></div></div></div>;

  const totalLoans     = report.reduce((s,r)=>s+r.totalLoans,0);
  const totalDisbursed = report.reduce((s,r)=>s+r.totalDisbursedAmount,0);
  const totalRepaid    = report.reduce((s,r)=>s+r.totalRepaidAmount,0);
  const overallRate    = totalDisbursed>0 ? Math.round((totalRepaid/totalDisbursed)*100) : 0;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div className="page">
          <div className="page-header">
            <h2>💰 Recovery Report</h2>
            <p>Loans in the disbursed / recovery lifecycle, grouped by approving admin</p>
          </div>

          <div className="kpi-box">ℹ️ {explanation}</div>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="stat-grid">
            <div className="stat-card"><div className="stat-label">Recovery Loans</div><div className="stat-value" style={{color:'var(--cyan)'}}>{totalLoans}</div><div className="stat-sub">disbursed + overdue + repaid</div></div>
            <div className="stat-card"><div className="stat-label">Total Disbursed</div><div className="stat-value" style={{color:'var(--accent)',fontSize:20}}>{fmt(totalDisbursed)}</div><div className="stat-sub">principal lent</div></div>
            <div className="stat-card"><div className="stat-label">Total Recovered</div><div className="stat-value" style={{color:'var(--green)',fontSize:20}}>{fmt(totalRepaid)}</div><div className="stat-sub">repayments received</div></div>
            <div className="stat-card"><div className="stat-label">Recovery Rate</div><div className="stat-value" style={{color:overallRate>=70?'var(--green)':overallRate>=40?'var(--yellow)':'var(--red)'}}>{overallRate}%</div><div className="stat-sub">overall portfolio</div></div>
          </div>

          {report.length===0 ? <div className="empty-state"><div className="empty-icon">💰</div>No recovery loans yet.</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Admin</th><th>Disbursed</th><th>Overdue</th><th>Repaid</th><th>Total</th><th>Portfolio</th><th>Recovered</th><th>Rate</th></tr></thead>
                <tbody>
                  {report.map(row=>(
                    <tr key={row.adminEmail}>
                      <td><div style={{fontWeight:600}}>{row.adminEmail}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{row.decisionBy}</div></td>
                      <td><span style={{color:'var(--cyan)',fontWeight:700}}>{row.disbursed}</span></td>
                      <td><span style={{color:'var(--orange)',fontWeight:700}}>{row.overdue}</span></td>
                      <td><span style={{color:'var(--green)',fontWeight:700}}>{row.repaid}</span></td>
                      <td style={{fontWeight:700}}>{row.totalLoans}</td>
                      <td>{fmt(row.totalDisbursedAmount)}</td>
                      <td style={{color:'var(--green)'}}>{fmt(row.totalRepaidAmount)}</td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:60,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                            <div style={{width:`${row.recoveryRate}%`,height:'100%',borderRadius:3,background:row.recoveryRate>=70?'var(--green)':row.recoveryRate>=40?'var(--yellow)':'var(--red)'}}/>
                          </div>
                          <span style={{fontSize:12,fontWeight:700}}>{row.recoveryRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

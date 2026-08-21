'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import api from '@/services/api';

const ALL_STATUSES = ['all','pending','approved','rejected','on_hold','disbursed','overdue','repaid'];
const LABELS = { all:'All', pending:'Pending', approved:'Approved', rejected:'Rejected', on_hold:'On Hold', disbursed:'Disbursed', overdue:'Overdue', repaid:'Repaid' };
const fmt = (n) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

export default function LoansPage() {
  const { admin } = useAuth();
  const router    = useRouter();
  const [loans,   setLoans]   = useState([]);
  const [status,  setStatus]  = useState('all');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => { if (!admin) router.push('/login'); }, [admin, router]);

  const fetchLoans = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = status !== 'all' ? `?status=${status}` : '';
      const { data } = await api.get(`/admin/loans${params}`);
      setLoans(data.loans);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch loans.');
    } finally { setLoading(false); }
  }, [status]);

  useEffect(() => { if (admin) fetchLoans(); }, [admin, fetchLoans]);

  if (!admin) return null;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div className="page">
          <div className="page-header">
            <h2>Loan Applications</h2>
            <p>View and manage all loan applications</p>
          </div>

          <div className="filter-tabs">
            {ALL_STATUSES.map((s) => (
              <button key={s} className={`filter-tab ${status===s?'active':''}`} onClick={() => setStatus(s)}>
                {LABELS[s]}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="empty-state"><span className="spinner" style={{width:32,height:32}} /></div>
          ) : loans.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div>No loans for <strong>{LABELS[status]}</strong></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Borrower</th><th>Amount</th><th>Status</th><th>Decision By</th><th>Decision Date</th><th>Comment</th></tr></thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan._id} className="loan-row" onClick={() => router.push(`/loans/${loan._id}`)}>
                      <td>
                        <div style={{fontWeight:600}}>{loan.borrowerId?.name||'—'}</div>
                        <div style={{fontSize:12,color:'var(--text-muted)'}}>{loan.borrowerId?.email}</div>
                      </td>
                      <td style={{fontWeight:700}}>{fmt(loan.amount)}</td>
                      <td><span className={`badge badge-${loan.status}`}>{LABELS[loan.status]||loan.status}</span></td>
                      <td>
                        <div>{loan.decisionBy||'—'}</div>
                        {loan.decisionByEmail && <div style={{fontSize:12,color:'var(--text-muted)'}}>{loan.decisionByEmail}</div>}
                      </td>
                      <td>{fmtDate(loan.decisionAt)}</td>
                      <td style={{color:'var(--text-secondary)',maxWidth:200}}>
                        {loan.decisionComment ? loan.decisionComment.slice(0,40)+(loan.decisionComment.length>40?'…':'') : '—'}
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

'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import api from '@/services/api';

const fmt = (n) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const fmtD  = (d) => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

/* ── Action Modal ──────────────────────────────────────────────────────────── */
function ActionModal({ title, onConfirm, onClose, requireComment=false, confirmLabel='Confirm', danger=false }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const handleSubmit = async () => {
    if (requireComment && !comment.trim()) { setError('Comment is required.'); return; }
    setError(''); setLoading(true);
    try { await onConfirm(comment); onClose(); }
    catch (err) { setError(err.response?.data?.error||'Action failed.'); setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">{title}</span><button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button></div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label className="form-label">Comment {requireComment?'':'(optional)'}</label>
          <textarea className="form-control" placeholder="Add a comment…" value={comment} onChange={(e)=>setComment(e.target.value)} autoFocus />
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className={`btn ${danger?'btn-danger':'btn-success'}`} onClick={handleSubmit} disabled={loading}>
            {loading?<><span className="spinner"/> Processing…</>:confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Repayment Modal ───────────────────────────────────────────────────────── */
function RepaymentModal({ loanId, onClose, onDone }) {
  const [form, setForm] = useState({ amount:'', method:'cash', status:'SUCCESS' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const handleSubmit = async () => {
    if (!form.amount||Number(form.amount)<=0){setError('Enter a valid amount.');return;}
    setError(''); setLoading(true);
    try { await api.post(`/admin/loans/${loanId}/repayments`,{...form,amount:Number(form.amount)}); onDone(); onClose(); }
    catch (err) { setError(err.response?.data?.error||'Failed.'); setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Record Repayment</span><button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button></div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group"><label className="form-label">Amount (₹)</label><input type="number" className="form-control" placeholder="5000" value={form.amount} onChange={(e)=>setForm({...form,amount:e.target.value})} autoFocus /></div>
        <div className="form-group"><label className="form-label">Method</label>
          <select className="form-control" value={form.method} onChange={(e)=>setForm({...form,method:e.target.value})}>
            {['cash','bank_transfer','upi','cheque','other'].map(m=><option key={m} value={m}>{m.replace('_',' ').toUpperCase()}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Status</label>
          <select className="form-control" value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
            <option value="SUCCESS">SUCCESS</option><option value="FAILED">FAILED</option>
          </select>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading?<><span className="spinner"/> Saving…</>:'Record Repayment'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── PTP Modal ─────────────────────────────────────────────────────────────── */
function PTPModal({ loanId, onClose, onDone }) {
  const [form, setForm] = useState({ promisedDate:'', amount:'', note:'' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const handleSubmit = async () => {
    if (!form.promisedDate){setError('Promised date required.');return;}
    if (!form.amount||Number(form.amount)<=0){setError('Enter a valid amount.');return;}
    setError(''); setLoading(true);
    try { await api.post(`/admin/loans/${loanId}/ptp`,{...form,amount:Number(form.amount)}); onDone(); onClose(); }
    catch (err) { setError(err.response?.data?.error||'Failed.'); setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">Create Promise-to-Pay</span><button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button></div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group"><label className="form-label">Promised Date</label><input type="date" className="form-control" value={form.promisedDate} onChange={(e)=>setForm({...form,promisedDate:e.target.value})} autoFocus /></div>
        <div className="form-group"><label className="form-label">Amount (₹)</label><input type="number" className="form-control" placeholder="5000" value={form.amount} onChange={(e)=>setForm({...form,amount:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">Note (optional)</label><input type="text" className="form-control" placeholder="Add a note…" value={form.note} onChange={(e)=>setForm({...form,note:e.target.value})} /></div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading?<><span className="spinner"/> Saving…</>:'Create PTP'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── IFSC Form ─────────────────────────────────────────────────────────────── */
function IFSCForm({ borrower, onUpdated }) {
  const [form,    setForm]   = useState({ ifsc:'', accountLast4:'' });
  const [result,  setResult] = useState(null);
  const [loading, setLoading]= useState(false);
  const [error,   setError]  = useState('');
  const handleVerify = async () => {
    setError(''); setResult(null);
    if (!form.ifsc||!form.accountLast4){setError('IFSC and account last 4 digits are required.');return;}
    setLoading(true);
    try { const {data}=await api.post(`/admin/borrowers/${borrower._id}/bank`,form); setResult(data.bank); onUpdated(); }
    catch (err) { setError(err.response?.data?.error||'Verification failed.'); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <div className="section-heading">Bank / IFSC Verification</div>
      {borrower.bank?.bankName && (
        <div className="ifsc-result" style={{marginBottom:16}}>
          <div className="bank-name">{borrower.bank.bankName}</div>
          <div className="bank-detail">Branch: {borrower.bank.branch} · City: {borrower.bank.city}</div>
          <div className="bank-detail">IFSC: {borrower.bank.ifsc} · Acc ····{borrower.bank.accountLast4}</div>
        </div>
      )}
      {error  && <div className="alert alert-error">{error}</div>}
      {result && <div className="ifsc-result" style={{marginBottom:16}}><div className="bank-name">✅ {result.bankName}</div><div className="bank-detail">Branch: {result.branch} · City: {result.city}</div><div className="bank-detail">IFSC: {result.ifsc} · Acc ····{result.accountLast4}</div></div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div className="form-group" style={{marginBottom:0}}><label className="form-label">IFSC Code</label><input id="ifsc-input" className="form-control" placeholder="HDFC0000001" value={form.ifsc} onChange={(e)=>setForm({...form,ifsc:e.target.value.toUpperCase()})} /></div>
        <div className="form-group" style={{marginBottom:0}}><label className="form-label">Account Last 4</label><input id="account-last4" className="form-control" placeholder="1234" maxLength={4} value={form.accountLast4} onChange={(e)=>setForm({...form,accountLast4:e.target.value.replace(/\D/g,'')})} /></div>
      </div>
      <button id="ifsc-verify-btn" className="btn btn-primary" style={{marginTop:12}} onClick={handleVerify} disabled={loading}>
        {loading?<><span className="spinner"/> Verifying…</>:'🔍 Verify IFSC'}
      </button>
    </div>
  );
}

/* ── Main Loan Detail Page ─────────────────────────────────────────────────── */
export default function LoanDetailPage() {
  const { id }           = useParams();
  const router           = useRouter();
  const { admin, hasPermission } = useAuth();
  const [data,       setData]      = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState('');
  const [modal,      setModal]     = useState(null);
  const [actionBusy, setActionBusy]= useState({});
  const [successMsg, setSuccessMsg]= useState('');

  useEffect(() => { if (!admin) router.push('/login'); }, [admin, router]);

  const fetchLoan = useCallback(async () => {
    try { const res = await api.get(`/admin/loans/${id}`); setData(res.data); }
    catch (err) { setError(err.response?.data?.error||'Failed to load loan.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (admin) fetchLoan(); }, [admin, fetchLoan]);

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(()=>setSuccessMsg(''),4000); };

  const doAction = async (action, comment) => {
    setActionBusy(p=>({...p,[action]:true}));
    try {
      const res = await api.post(`/admin/loans/${id}/${action}`,{comment});
      await fetchLoan();
      flash(res.data.emailSent===false&&action!=='disburse'
        ? `✅ ${action} done. (Email not configured — check .env)`
        : `✅ Action completed.`);
    } finally { setActionBusy(p=>({...p,[action]:false})); }
  };

  if (!admin) return null;
  if (loading) return <div className="app-shell"><Sidebar /><div className="main-content"><div className="page"><div className="empty-state"><span className="spinner" style={{width:32,height:32}}/></div></div></div></div>;
  if (error)   return <div className="app-shell"><Sidebar /><div className="main-content"><div className="page"><div className="alert alert-error">{error}</div></div></div></div>;
  if (!data)   return null;

  const { loan, repayments, ptps, activityLogs } = data;
  const borrower      = loan.borrowerId;
  const canDecide     = hasPermission('DECIDE_LOANS');
  const canRepay      = hasPermission('RECORD_REPAYMENT');
  const canPTP        = hasPermission('MANAGE_PTP');
  const isDecidable   = ['pending','on_hold'].includes(loan.status);
  const isDisbursable = loan.status === 'approved';
  const isActive      = ['disbursed','overdue'].includes(loan.status);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div className="page">
          <button className="back-btn" onClick={()=>router.push('/loans')}>← Back to Loans</button>

          {successMsg && <div className="alert alert-success">{successMsg}</div>}

          {/* Header */}
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24}}>
            <div>
              <h2 style={{fontSize:22,fontWeight:800}}>{borrower?.name}</h2>
              <div style={{color:'var(--text-secondary)',fontSize:13,marginTop:4}}>{borrower?.email} · {borrower?.phone}</div>
            </div>
            <span className={`badge badge-${loan.status}`} style={{fontSize:13,padding:'6px 14px'}}>{loan.status.replace('_',' ').toUpperCase()}</span>
          </div>

          {/* Loan Info */}
          <div className="card" style={{marginBottom:20}}>
            <div className="section-heading">Loan Information</div>
            <div className="detail-grid">
              <div className="detail-item"><label>Loan Amount</label><span style={{fontSize:20,fontWeight:800}}>{fmt(loan.amount)}</span></div>
              <div className="detail-item"><label>Repaid Amount</label><span style={{fontSize:16,fontWeight:700,color:'var(--green)'}}>{fmt(loan.repaidAmount||0)}</span></div>
              <div className="detail-item"><label>KYC Status</label><span className={`badge badge-${borrower?.kycStatus}`}>{borrower?.kycStatus}</span></div>
              <div className="detail-item"><label>Disbursed At</label><span>{fmtDT(loan.disbursedAt)}</span></div>
            </div>

            {loan.decisionBy && <>
              <hr className="divider"/>
              <div className="section-heading">Decision Information</div>
              <div className="detail-grid">
                <div className="detail-item"><label>Decision By</label><span>{loan.decisionBy}</span></div>
                <div className="detail-item"><label>Email</label><span>{loan.decisionByEmail}</span></div>
                <div className="detail-item"><label>Date</label><span>{fmtDT(loan.decisionAt)}</span></div>
                <div className="detail-item"><label>Comment</label><span>{loan.decisionComment||'—'}</span></div>
              </div>
            </>}

            {/* Actions */}
            {(canDecide||canRepay||canPTP) && <>
              <hr className="divider"/>
              <div className="section-heading">Actions</div>
              <div className="action-group">
                {canDecide && isDecidable && <>
                  <button id="btn-approve" className="btn btn-success" disabled={actionBusy.approve} onClick={()=>setModal('approve')}>
                    {actionBusy.approve?<><span className="spinner"/> Approving…</>:'✅ Approve'}
                  </button>
                  <button id="btn-reject" className="btn btn-danger" disabled={actionBusy.reject} onClick={()=>setModal('reject')}>
                    {actionBusy.reject?<><span className="spinner"/> Rejecting…</>:'❌ Reject'}
                  </button>
                  {loan.status==='pending'&&<button id="btn-hold" className="btn btn-warning" disabled={actionBusy.hold} onClick={()=>setModal('hold')}>
                    {actionBusy.hold?<><span className="spinner"/> Holding…</>:'⏸ Hold'}
                  </button>}
                </>}
                {canDecide && isDisbursable && (
                  <button id="btn-disburse" className="btn btn-primary" disabled={actionBusy.disburse}
                    onClick={async()=>{setActionBusy(p=>({...p,disburse:true}));try{await doAction('disburse');}catch(e){alert(e.response?.data?.error||'Failed');}finally{setActionBusy(p=>({...p,disburse:false}));}}}>
                    {actionBusy.disburse?<><span className="spinner"/> Disbursing…</>:'💸 Disburse'}
                  </button>
                )}
                {canRepay && isActive && <button id="btn-repayment" className="btn btn-ghost" onClick={()=>setModal('repayment')}>💳 Record Repayment</button>}
                {canPTP   && isActive && <button id="btn-ptp"       className="btn btn-ghost" onClick={()=>setModal('ptp')}>📅 Create PTP</button>}
              </div>
            </>}
          </div>

          {/* IFSC */}
          <div className="card" style={{marginBottom:20}}>
            <IFSCForm borrower={borrower} onUpdated={fetchLoan} />
          </div>

          {/* Repayments */}
          <div className="card" style={{marginBottom:20}}>
            <div className="section-heading">Repayments ({repayments.length})</div>
            {repayments.length===0 ? <div style={{color:'var(--text-muted)',fontSize:13}}>No repayments recorded.</div> : (
              <div className="table-wrap" style={{border:'none',borderRadius:0}}>
                <table><thead><tr><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>{repayments.map(r=><tr key={r._id}><td style={{fontWeight:700}}>{fmt(r.amount)}</td><td style={{textTransform:'uppercase',fontSize:12}}>{r.method?.replace('_',' ')}</td><td><span className={`badge badge-${r.status}`}>{r.status}</span></td><td>{fmtDT(r.paidAt)}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>

          {/* PTPs */}
          <div className="card" style={{marginBottom:20}}>
            <div className="section-heading">Promise-to-Pay ({ptps.length})</div>
            {ptps.length===0 ? <div style={{color:'var(--text-muted)',fontSize:13}}>No PTPs created.</div> : (
              <div className="table-wrap" style={{border:'none',borderRadius:0}}>
                <table><thead><tr><th>Amount</th><th>Promised Date</th><th>Status</th><th>Note</th></tr></thead>
                  <tbody>{ptps.map(p=><tr key={p._id}><td style={{fontWeight:700}}>{fmt(p.amount)}</td><td>{fmtD(p.promisedDate)}</td><td><span className={`badge badge-${p.status}`}>{p.status}</span></td><td style={{color:'var(--text-secondary)'}}>{p.note||'—'}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="card">
            <div className="section-heading">Activity Log ({activityLogs.length})</div>
            {activityLogs.length===0 ? <div style={{color:'var(--text-muted)',fontSize:13}}>No activity yet.</div> : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {activityLogs.map(log=>(
                  <div key={log._id} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:'var(--accent)',marginTop:6,flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:600}}>{log.action.replace(/_/g,' ').toUpperCase()}</div>
                      <div style={{fontSize:12,color:'var(--text-muted)'}}>{log.adminEmail} · {fmtDT(log.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal==='approve'   && <ActionModal title="Approve Loan"        confirmLabel="Approve" onClose={()=>setModal(null)} onConfirm={(c)=>doAction('approve',c)} />}
      {modal==='reject'    && <ActionModal title="Reject Loan"         confirmLabel="Reject"  danger requireComment onClose={()=>setModal(null)} onConfirm={(c)=>doAction('reject',c)} />}
      {modal==='hold'      && <ActionModal title="Put Loan on Hold"    confirmLabel="Hold"    requireComment onClose={()=>setModal(null)} onConfirm={(c)=>doAction('hold',c)} />}
      {modal==='repayment' && <RepaymentModal loanId={id} onClose={()=>setModal(null)} onDone={()=>{fetchLoan();flash('Repayment recorded.');}} />}
      {modal==='ptp'       && <PTPModal       loanId={id} onClose={()=>setModal(null)} onDone={()=>{fetchLoan();flash('PTP created.');}} />}
    </div>
  );
}

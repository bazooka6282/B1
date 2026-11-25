'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { inr } from '../../lib/fleet';
import type { browserClient } from '../../lib/browser';
import { n, sessionDays, today, type Row } from './modules';

export function TpApprovals({ client, session, approvals, close, refresh }: {
  client: ReturnType<typeof browserClient>;
  session: Row;
  approvals: Row[];
  close: () => void;
  refresh: () => Promise<void>;
}) {
  const start = String(session.start_date);
  const end = String(session.end_date);
  const latest = end < today() ? end : today();
  const suggested = n(session, 'amount') / sessionDays(start, end);
  const [date, setDate] = useState(latest);
  const [amount, setAmount] = useState(suggested > 0 ? suggested.toFixed(2) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const alreadyApproved = approvals.some(row => row.date === date);
  const sessionId = Number(session.id);

  async function save(event?: FormEvent<HTMLFormElement>, removeDate?: string) {
    event?.preventDefault();
    if (busy) return;
    if (removeDate && !confirm('Undo this approval and remove the amount from reports?')) return;
    setBusy(true);
    setError('');
    try {
      const source = client.from('tp_daily_approvals');
      const result = removeDate
        ? await source.delete().eq('session', sessionId).eq('date', removeDate).select('date')
        : await source.insert({ session: sessionId, date, amount: Number(amount) }).select('date');
      if (result.error?.code === '23505') {
        await refresh();
        throw new Error('Revenue for this date is already approved.');
      }
      if (result.error) throw result.error;
      if (!result.data?.length) throw new Error('No approval was changed.');
      await refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="modal-backdrop" onKeyDown={event => { if (event.key === 'Escape' && !busy) close(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="tp-approval-heading">
      <div className="panel-title">
        <h2 id="tp-approval-heading">Daily revenue approval <small>{session.reference}</small></h2>
        <button autoFocus type="button" disabled={busy} className="icon-button" onClick={close} aria-label="Close approvals"><X /></button>
      </div>
      <p>Approve a day only after receiving the money. Leave unpaid days unapproved.</p>
      {start <= latest && session.status !== 'Cancelled' && <form onSubmit={save}>
        <div className="form-grid">
          <label className="field">Revenue date<input type="date" value={date} min={start} max={latest} required onChange={event => setDate(event.target.value)} /></label>
          <label className="field">Amount received (₹)<input type="number" value={amount} min="0.01" max="999999999999.99" step="0.01" required onChange={event => setAmount(event.target.value)} /></label>
        </div>
        <div className="modal-actions"><button className="button primary" disabled={busy || alreadyApproved}>{alreadyApproved ? 'Date already approved' : 'Approve revenue'}</button></div>
      </form>}
      {error && <div className="message error" role="alert">{error}</div>}
      <h3>Approved days</h3>
      {approvals.length ? <div className="table-scroll"><table>
        <thead><tr><th>Date</th><th>Received</th><th>Action</th></tr></thead>
        <tbody>{approvals.map(row => <tr key={String(row.date)}>
          <td>{String(row.date).split('-').reverse().join('/')}</td><td>{inr(n(row, 'amount'))}</td>
          <td><button type="button" className="text-link" disabled={busy} onClick={() => void save(undefined, String(row.date))}>Undo approval</button></td>
        </tr>)}</tbody>
      </table></div> : <p>No days approved yet.</p>}
    </section>
  </div>;
}

'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { inr } from '../../lib/fleet';
import type { browserClient } from '../../lib/browser';
import { n, sessionDays, shiftTpDate, today, tpWeekStart, type Row } from './modules';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const formatDate = (date: string) => date.split('-').reverse().join('/');

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
  const [week, setWeek] = useState(() => tpWeekStart(latest < start ? start : latest));
  const [date, setDate] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [amount, setAmount] = useState(suggested > 0 ? suggested.toFixed(2) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const sessionId = Number(session.id);
  const lastDay = shiftTpDate(week, 6);
  const rowsByDate = new Map(approvals.map(row => [row.date, row]));

  function changeWeek(offset: number) {
    setWeek(shiftTpDate(week, offset));
    setDate('');
    setError('');
  }

  async function save(event?: FormEvent<HTMLFormElement>, removeDate?: string) {
    event?.preventDefault();
    if (busy) return;
    if (removeDate && !confirm('Clear this day’s decision? Any approved amount for it will be removed from reports.')) return;
    setBusy(true);
    setError('');
    try {
      const source = client.from('tp_daily_approvals');
      const result = removeDate
        ? await source.delete().eq('session', sessionId).eq('date', removeDate).select('date')
        : await source.insert({ session: sessionId, date, amount: skipReason ? 0 : Number(amount), skip_reason: skipReason || null }).select('date');
      if (result.error?.code === '23505') {
        await refresh();
        throw new Error('This day already has a saved decision.');
      }
      if (result.error) throw result.error;
      if (!result.data?.length) throw new Error('No approval was changed.');
      await refresh();
      setDate('');
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
      <p>Approve days when you receive money. Skip leave, breakdowns, or unpaid days to record ₹0.</p>
      <div className="panel-title tp-week-navigation">
        <button type="button" className="button secondary" disabled={busy || week <= tpWeekStart(start)} onClick={() => changeWeek(-7)}>Previous week</button>
        <strong>{formatDate(week)} – {formatDate(lastDay)}</strong>
        <button type="button" className="button secondary" disabled={busy || lastDay >= end} onClick={() => changeWeek(7)}>Next week</button>
      </div>
      <div className="table-scroll"><table>
        <thead><tr><th>Day</th><th>Date</th><th>Status</th><th>Received</th><th>Action</th></tr></thead>
        <tbody>{weekdays.map((day, index) => {
          const dayDate = shiftTpDate(week, index);
          const entry = rowsByDate.get(dayDate);
          const outside = dayDate < start || dayDate > end;
          const canReview = !outside && dayDate <= latest && session.status !== 'Cancelled';
          const status = entry ? String(entry.skip_reason || 'Approved')
            : outside ? 'Outside session' : dayDate > latest ? 'Upcoming' : 'Pending';
          return <tr key={dayDate}>
            <th scope="row">{day}</th><td>{formatDate(dayDate)}</td><td>{status}</td>
            <td>{entry ? inr(n(entry, 'amount')) : '—'}</td>
            <td>{entry
              ? <button type="button" className="text-link" disabled={busy} onClick={() => void save(undefined, dayDate)}>Clear</button>
              : canReview && <button type="button" className="text-link" disabled={busy} onClick={() => {
                setDate(dayDate);
                setAmount(suggested > 0 ? suggested.toFixed(2) : '');
                setSkipReason('');
                setError('');
              }}>Review</button>}
            </td>
          </tr>;
        })}</tbody>
      </table></div>
      {date && !rowsByDate.has(date) && <form onSubmit={save}>
        <h3>{formatDate(date)}</h3>
        <div className="form-grid">
          <label className="field">Decision<select value={skipReason} disabled={busy} onChange={event => setSkipReason(event.target.value)}>
            <option value="">Approve payment</option><option>Leave</option><option>Vehicle breakdown</option><option>No payment</option>
          </select></label>
          {!skipReason && <label className="field">Amount received (₹)<input type="number" value={amount} min="0.01" max="999999999999.99" step="0.01" required disabled={busy} onChange={event => setAmount(event.target.value)} /></label>}
        </div>
        <div className="modal-actions"><button className="button primary" disabled={busy}>{skipReason ? 'Skip day' : 'Approve revenue'}</button></div>
      </form>}
      {error && <div className="message error" role="alert">{error}</div>}
    </section>
  </div>;
}

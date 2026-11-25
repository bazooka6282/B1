'use client';

import { useState, type FormEvent } from 'react';
import { inr } from '../../lib/fleet';
import type { browserClient } from '../../lib/browser';
import { n, sessionDays, shiftTpDate, today, tpWeekStart, type Row } from './modules';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const formatDate = (date: string) => date.split('-').reverse().join('/');

export function TpApprovals({ client, session, approvals, refresh }: {
  client: ReturnType<typeof browserClient>;
  session: Row;
  approvals?: Row[];
  refresh: () => Promise<void>;
}) {
  const start = String(session.start_date);
  const end = String(session.end_date);
  const currentDate = today();
  const latest = end < currentDate ? end : currentDate;
  const suggested = n(session, 'amount') / sessionDays(start, end);
  const [week, setWeek] = useState(() => tpWeekStart(latest < start ? start : latest));
  const [date, setDate] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [amount, setAmount] = useState(suggested > 0 ? suggested.toFixed(2) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const sessionId = Number(session.id);
  const lastDay = shiftTpDate(week, 6);
  const rowsByDate = new Map(approvals?.map(row => [row.date, row]));
  const futureDecision = date > currentDate;

  function changeWeek(offset: number) {
    setWeek(shiftTpDate(week, offset));
    setDate('');
    setError('');
  }

  async function save(event?: FormEvent<HTMLFormElement>, removeDate?: string) {
    event?.preventDefault();
    if (busy || !approvals) return;
    if (removeDate && !confirm('Clear this day’s decision? Any approved amount for it will be removed from reports.')) return;
    setBusy(true);
    setError('');
    try {
      const source = client.from('tp_daily_approvals');
      const recordDate = removeDate ?? date;
      const existing = rowsByDate.get(recordDate);
      const decision = { amount: skipReason ? 0 : Number(amount), skip_reason: skipReason || null };
      let result;
      if (existing) {
        const change = removeDate ? source.delete() : source.update(decision);
        const match = change.eq('session', sessionId).eq('date', recordDate).eq('amount', n(existing, 'amount'));
        result = await (existing.skip_reason
          ? match.eq('skip_reason', existing.skip_reason)
          : match.is('skip_reason', null)).select('date');
      } else {
        result = await source.insert({ session: sessionId, date: recordDate, ...decision }).select('date');
      }
      if (result.error?.code === '23505') {
        await refresh();
        throw new Error('This day already has a saved decision.');
      }
      if (result.error) throw result.error;
      if (!result.data?.length) {
        await refresh();
        throw new Error('This day changed since you opened it. Reopen it and try again.');
      }
      await refresh();
      setDate('');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel tp-approval-panel" aria-labelledby="tp-approval-heading">
      <div className="panel-title">
        <h2 id="tp-approval-heading">Weekly review <small>{[session.reference, session.tp_vehicle_number].filter(Boolean).join(' · ')}</small></h2>
      </div>
      <p>Use Edit to approve a missed payment, correct a saved amount, or mark a day as declined if the vehicle did not or will not run.</p>
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
          const canEdit = approvals && !outside && session.status !== 'Cancelled';
          const status = entry ? (entry.skip_reason === 'Declined' ? 'Declined · vehicle not running' : String(entry.skip_reason || 'Approved'))
            : outside ? 'Outside session' : session.status === 'Cancelled' ? 'Cancelled'
            : dayDate > latest ? 'Upcoming' : approvals ? 'Pending' : 'Unavailable';
          return <tr key={dayDate}>
            <th scope="row">{day}</th><td>{formatDate(dayDate)}</td><td>{status}</td>
            <td>{entry ? inr(n(entry, 'amount')) : '—'}</td>
            <td><div className="row-actions">
              {canEdit && <button type="button" className="text-link" disabled={busy} onClick={() => {
                setDate(dayDate);
                setAmount(entry && n(entry, 'amount') > 0 ? n(entry, 'amount').toFixed(2) : suggested > 0 ? suggested.toFixed(2) : '');
                setSkipReason(dayDate > currentDate ? 'Declined' : String(entry?.skip_reason ?? ''));
                setError('');
              }}>Edit</button>}
              {entry && <button type="button" className="text-link" disabled={busy} onClick={() => void save(undefined, dayDate)}>Clear</button>}
            </div></td>
          </tr>;
        })}</tbody>
      </table></div>
      {date && <form onSubmit={save}>
        <h3>{formatDate(date)}</h3>
        <div className="form-grid">
          <label className="field">Decision<select value={skipReason} disabled={busy} onChange={event => setSkipReason(event.target.value)}>
            {!futureDecision && <><option value="">Approve payment</option><option>Leave</option><option>Vehicle breakdown</option><option>No payment</option></>}
            <option value="Declined">Declined — vehicle not running</option>
          </select></label>
          {!skipReason && <label className="field">Amount received (₹)<input type="number" value={amount} min="0.01" max="999999999999.99" step="0.01" required disabled={busy} onChange={event => setAmount(event.target.value)} /></label>}
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" disabled={busy} onClick={() => setDate('')}>Cancel</button>
          <button className="button primary" disabled={busy}>{skipReason === 'Declined' ? 'Mark declined' : skipReason ? 'Skip day' : 'Approve revenue'}</button>
        </div>
      </form>}
      {error && <div className="message error" role="alert">{error}</div>}
    </section>;
}

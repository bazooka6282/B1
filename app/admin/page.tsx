import { redirect } from 'next/navigation';
import { serverClient } from '../../lib/server';
import { Dashboard } from './dashboard';

export default async function Admin() {
  const client = await serverClient();
  if (!client) redirect('/login');
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login');
  const { data: allowed } = await client.rpc('is_fleet_admin');
  if (!allowed) return <main className="wrap profile"><h2>Access restricted</h2><p>This account does not have fleet administrator access.</p><a className="back-link" href="/">Return to website</a></main>;
  return <Dashboard initialPhoto={user.user_metadata.dashboard_avatar} email={user.email ?? ''} initialRatePresets={user.user_metadata.tp_daily_revenue_rates}/>;
}

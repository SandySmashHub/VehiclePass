import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { Empty, Spinner } from './components/ui.jsx';
import MapView from './components/MapView.jsx';
import SessionForm from './components/SessionForm.jsx';
import SessionTable from './components/SessionTable.jsx';
import VehiclesPage from './components/VehiclesPage.jsx';
import ZonesPage from './components/ZonesPage.jsx';
import { fmtDur } from './utils.js';

const TABS = ['Dashboard', 'Active', 'Completed', 'Vehicles', 'Zones', 'History'];
const NO_DATA = { zones: [], sessions: [], stats: null, vehicles: [] };

export default function App() {
  const [tab, setTab] = useState('Dashboard');
  const [data, setData] = useState(NO_DATA);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [notice, setNotice] = useState(null);
  const [myPos, setMyPos] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: 'all', zone: 'all', overstay: false });

  const notify = (type, text) => setNotice({ type, text });
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const load = useCallback(async () => {
    try {
      const [zones, sessions, stats, vehicles] = await Promise.all([
        api.get('/zones'), api.get('/sessions'), api.get('/stats'), api.get('/vehicles'),
      ]);
      setData({ zones, sessions, stats, vehicles });
      setLoadErr('');
    } catch (e) {
      setLoadErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // keep live durations fresh
    return () => clearInterval(t);
  }, [load]);

  const exitSession = async (s) => {
    try {
      const r = await api.put(`/sessions/${s._id}/exit`);
      notify(r.overstay ? 'error' : 'success', `${r.vehicleNumber} exited after ${fmtDur(r.durationMinutes)}${r.overstay ? ` – overstayed by ${fmtDur(r.overstayMinutes)}` : ''}.`);
      load();
    } catch (e) { notify('error', e.message); }
  };
  const deleteSession = async (s) => {
    if (!window.confirm(`Delete record for ${s.vehicleNumber}?`)) return;
    try { await api.del(`/sessions/${s._id}`); notify('success', 'Record deleted.'); load(); } catch (e) { notify('error', e.message); }
  };
  const loadDemo = async () => {
    try { await api.post('/seed', myPos ? { latitude: myPos.lat, longitude: myPos.lng } : {}); notify('success', 'Demo data loaded.'); load(); } catch (e) { notify('error', e.message); }
  };

  const { zones, sessions, stats, vehicles } = data;
  const active = sessions.filter((s) => s.status === 'active');
  const completed = sessions.filter((s) => s.status === 'completed');
  const alerts = active.filter((s) => s.overstay);
  const occupancy = stats ? stats.occupancy : {};
  const history = sessions.filter((s) =>
    (!filters.q || s.vehicleNumber.includes(filters.q.trim().toUpperCase())) &&
    (filters.status === 'all' || s.status === filters.status) &&
    (filters.zone === 'all' || (s.zone && s.zone._id === filters.zone)) &&
    (!filters.overstay || s.overstay));

  const body = () => {
    if (loading) return <Spinner text="Loading VehiclePass data…" />;
    if (loadErr && !stats)
      return <Empty icon="⚠️" title="Cannot load data" text={loadErr}><button className="btn primary" onClick={() => { setLoading(true); load(); }}>Retry</button></Empty>;
    switch (tab) {
      case 'Dashboard':
        return (
          <>
            <div className="stats">
              {[['Parking zones', stats.zones], ['Active sessions', stats.active], ['Completed', stats.completed], ['Overstay alerts', stats.overstayActive, stats.overstayActive > 0], ['Total overstays', stats.overstayTotal]].map(([l, v, red]) => (
                <div key={l} className={`stat ${red ? 'red' : ''}`}><span>{l}</span><strong>{v}</strong></div>
              ))}
            </div>
            {!zones.length && (
              <div className="card"><Empty title="No parking zones yet" text="Add a zone, or load demo records placed around your current location.">
                <div className="actions center-row"><button className="btn primary" onClick={loadDemo}>Load demo data</button><button className="btn" onClick={() => setTab('Zones')}>Add a zone</button></div>
              </Empty></div>
            )}
            <div className="grid2">
              <MapView zones={zones} occupancy={occupancy} onLocate={setMyPos} />
              <SessionForm zones={zones} onDone={load} notify={notify} />
            </div>
            <div className="card">
              <div className="card-head"><h3>🚨 Overstay Alerts ({alerts.length})</h3></div>
              <SessionTable sessions={alerts} onExit={exitSession} emptyTitle="No overstays" emptyText="All parked vehicles are within their permitted time." />
            </div>
          </>
        );
      case 'Active':
        return <div className="card"><div className="card-head"><h3>Active Sessions ({active.length})</h3></div><SessionTable sessions={active} onExit={exitSession} emptyTitle="No active sessions" emptyText="Record a vehicle entry from the Dashboard." /></div>;
      case 'Completed':
        return <div className="card"><div className="card-head"><h3>Completed Sessions ({completed.length})</h3></div><SessionTable sessions={completed} onDelete={deleteSession} emptyTitle="No completed sessions" emptyText="Sessions appear here after a vehicle exits." /></div>;
      case 'Vehicles':
        return <VehiclesPage vehicles={vehicles} />;
      case 'Zones':
        return <ZonesPage zones={zones} occupancy={occupancy} myPos={myPos} setMyPos={setMyPos} onDone={load} notify={notify} />;
      default:
        return (
          <div className="card">
            <div className="card-head"><h3>Parking History ({history.length})</h3></div>
            <div className="filters">
              <input placeholder="Search vehicle…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="all">All status</option><option value="active">Active</option><option value="completed">Completed</option></select>
              <select value={filters.zone} onChange={(e) => setFilters({ ...filters, zone: e.target.value })}><option value="all">All zones</option>{zones.map((z) => <option key={z._id} value={z._id}>{z.code} – {z.name}</option>)}</select>
              <label className="check"><input type="checkbox" checked={filters.overstay} onChange={(e) => setFilters({ ...filters, overstay: e.target.checked })} /> Overstays only</label>
            </div>
            <SessionTable sessions={history} onExit={exitSession} onDelete={deleteSession} emptyTitle="No matching records" emptyText="Try changing the filters or record a new entry." />
          </div>
        );
    }
  };

  return (
    <>
      <header className="top">
        <div className="brand"><span className="logo">P</span><div><h1>VehiclePass</h1><small>Parking Misuse &amp; Overstay Detection</small></div></div>
        <nav>{TABS.map((t) => <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}{t === 'Active' && active.length ? ` (${active.length})` : ''}</button>)}</nav>
      </header>
      <main>
        {notice && <div className={`alert ${notice.type} toast`}><span>{notice.text}</span><button className="x" onClick={() => setNotice(null)}>✕</button></div>}
        {loadErr && stats && <div className="alert error"><span>{loadErr} (showing last loaded data)</span></div>}
        {body()}
      </main>
    </>
  );
}

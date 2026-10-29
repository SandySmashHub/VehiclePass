import { useState } from 'react';
import { Empty } from './ui.jsx';
import { fmtDate, fmtDur } from '../utils.js';

export default function VehiclesPage({ vehicles }) {
  const [q, setQ] = useState('');
  const list = vehicles.filter((v) => v.vehicleNumber.includes(q.trim().toUpperCase()));
  return (
    <div className="card">
      <div className="card-head">
        <h3>Vehicle Records</h3>
        <input className="search" placeholder="Search vehicle number…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!vehicles.length ? <Empty icon="🚗" title="No vehicles yet" text="Vehicles appear here after you record an entry." />
        : !list.length ? <Empty icon="🔍" title="No match" text="No vehicle matches your search." />
        : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Vehicle</th><th>Visits</th><th>Overstays</th><th>Total parked</th><th>Last zone</th><th>Last entry</th><th>Now</th></tr></thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v.vehicleNumber} className={v.overstays ? 'row-red' : ''}>
                    <td><strong>{v.vehicleNumber}</strong></td>
                    <td>{v.visits}</td>
                    <td>{v.overstays ? <span className="badge red">{v.overstays}</span> : 0}</td>
                    <td>{fmtDur(v.totalMinutes)}</td>
                    <td>{v.lastZone || '—'}</td>
                    <td>{fmtDate(v.lastSeen)}</td>
                    <td>{v.parked ? <span className="badge green">Parked</span> : <span className="badge gray">Left</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

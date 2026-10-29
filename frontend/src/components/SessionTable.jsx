import { Badge, Empty } from './ui.jsx';
import { fmtDate, fmtDur } from '../utils.js';

export default function SessionTable({ sessions, onExit, onDelete, emptyTitle = 'No records', emptyText = 'Nothing to show here yet.' }) {
  if (!sessions.length) return <Empty title={emptyTitle} text={emptyText} />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Vehicle</th><th>Zone</th><th>Entry</th><th>Exit</th><th>Permitted</th><th>Duration</th><th>Status</th><th /></tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s._id} className={s.overstay ? 'row-red' : ''}>
              <td><strong>{s.vehicleNumber}</strong></td>
              <td>{s.zone ? `${s.zone.code} – ${s.zone.name}` : '—'}</td>
              <td>{fmtDate(s.entryTime)}</td>
              <td>{fmtDate(s.exitTime)}</td>
              <td>{fmtDur(s.permittedMinutes)}</td>
              <td>{fmtDur(s.durationMinutes)}{s.overstay && <small className="err"> (+{fmtDur(s.overstayMinutes)})</small>}</td>
              <td><Badge s={s} /></td>
              <td className="actions">
                {s.status === 'active' && onExit && <button className="btn small primary" onClick={() => onExit(s)}>Record exit</button>}
                {onDelete && <button className="btn small danger" onClick={() => onDelete(s)}>Delete</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

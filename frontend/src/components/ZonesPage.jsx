import { useState } from 'react';
import { api } from '../api.js';
import { Empty, Field } from './ui.jsx';
import MapView from './MapView.jsx';

const blank = { name: '', code: '', latitude: '', longitude: '', radius: 60, capacity: 20, permittedMinutes: 120 };

export default function ZonesPage({ zones, occupancy, myPos, setMyPos, onDone, notify }) {
  const [f, setF] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setPoint = (lat, lng) => setF((p) => ({ ...p, latitude: Number(lat).toFixed(6), longitude: Number(lng).toFixed(6) }));

  const validate = () => {
    const e = {}, n = (k) => Number(f[k]);
    if (!f.name.trim()) e.name = 'Name is required';
    if (!f.code.trim()) e.code = 'Code is required'; else if (f.code.length > 12) e.code = 'Max 12 characters';
    if (f.latitude === '' || n('latitude') < -90 || n('latitude') > 90) e.latitude = 'Latitude -90 to 90';
    if (f.longitude === '' || n('longitude') < -180 || n('longitude') > 180) e.longitude = 'Longitude -180 to 180';
    if (!(n('radius') >= 10 && n('radius') <= 2000)) e.radius = '10–2000 m';
    if (!(n('capacity') >= 1 && n('capacity') <= 1000)) e.capacity = '1–1000';
    if (!(n('permittedMinutes') >= 1 && n('permittedMinutes') <= 1440)) e.permittedMinutes = '1–1440 min';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const body = { ...f, name: f.name.trim(), code: f.code.trim(), latitude: Number(f.latitude), longitude: Number(f.longitude), radius: Number(f.radius), capacity: Number(f.capacity), permittedMinutes: Number(f.permittedMinutes) };
    try {
      if (editId) await api.put(`/zones/${editId}`, body); else await api.post('/zones', body);
      notify('success', editId ? 'Zone updated.' : 'Zone added.');
      setF(blank); setEditId(null); onDone();
    } catch (x) { notify('error', x.message); } finally { setBusy(false); }
  };

  const edit = (z) => {
    setEditId(z._id);
    setF({ name: z.name, code: z.code, latitude: z.latitude, longitude: z.longitude, radius: z.radius, capacity: z.capacity, permittedMinutes: z.permittedMinutes });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const remove = async (z) => {
    if (!window.confirm(`Delete zone "${z.name}"?`)) return;
    try { await api.del(`/zones/${z._id}`); notify('success', 'Zone deleted.'); onDone(); } catch (x) { notify('error', x.message); }
  };

  const picked = f.latitude !== '' && f.longitude !== '' ? { lat: Number(f.latitude), lng: Number(f.longitude) } : null;

  return (
    <div className="grid2">
      <form className="card form" onSubmit={submit} noValidate>
        <div className="card-head"><h3>{editId ? 'Edit Zone' : 'Add Parking Zone'}</h3></div>
        <Field label="Zone name" error={err.name}><input value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Zone code" error={err.code}><input value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="A1" /></Field>
        <div className="row2">
          <Field label="Latitude" error={err.latitude}><input type="number" step="any" value={f.latitude} onChange={(e) => set('latitude', e.target.value)} /></Field>
          <Field label="Longitude" error={err.longitude}><input type="number" step="any" value={f.longitude} onChange={(e) => set('longitude', e.target.value)} /></Field>
        </div>
        <p className="hint">Click on the map to pick coordinates{myPos ? ', or use your GPS position.' : '.'}</p>
        {myPos && <button type="button" className="btn small" onClick={() => setPoint(myPos.lat, myPos.lng)}>📍 Use my current location</button>}
        <div className="row3">
          <Field label="Radius (m)" error={err.radius}><input type="number" value={f.radius} onChange={(e) => set('radius', e.target.value)} /></Field>
          <Field label="Capacity" error={err.capacity}><input type="number" value={f.capacity} onChange={(e) => set('capacity', e.target.value)} /></Field>
          <Field label="Limit (min)" error={err.permittedMinutes}><input type="number" value={f.permittedMinutes} onChange={(e) => set('permittedMinutes', e.target.value)} /></Field>
        </div>
        <div className="actions">
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : editId ? 'Update zone' : 'Add zone'}</button>
          {editId && <button type="button" className="btn" onClick={() => { setEditId(null); setF(blank); setErr({}); }}>Cancel</button>}
        </div>
      </form>

      <MapView zones={zones} occupancy={occupancy} picked={picked} onPick={(ll) => setPoint(ll.lat, ll.lng)} onLocate={setMyPos} height={380} />

      <div className="card span2">
        <div className="card-head"><h3>Parking Zones ({zones.length})</h3></div>
        {!zones.length ? <Empty title="No parking zones" text="Add your first zone using the form above." /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Code</th><th>Name</th><th>Coordinates</th><th>Radius</th><th>Occupied</th><th>Limit</th><th /></tr></thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z._id}>
                    <td><strong>{z.code}</strong></td><td>{z.name}</td>
                    <td>{z.latitude.toFixed(5)}, {z.longitude.toFixed(5)}</td><td>{z.radius} m</td>
                    <td>{occupancy[z._id] || 0} / {z.capacity}</td><td>{z.permittedMinutes} min</td>
                    <td className="actions"><button className="btn small" onClick={() => edit(z)}>Edit</button><button className="btn small danger" onClick={() => remove(z)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

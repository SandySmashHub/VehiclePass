import { useState } from 'react';
import { api } from '../api.js';
import { toLocalInput } from '../utils.js';
import { Field } from './ui.jsx';

export default function SessionForm({ zones, onDone, notify }) {
  const blank = { vehicleNumber: '', zone: '', permittedMinutes: '', entryTime: toLocalInput(), exitTime: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const pickZone = (id) => {
    const z = zones.find((x) => x._id === id);
    setF((p) => ({ ...p, zone: id, permittedMinutes: z ? z.permittedMinutes : '' }));
  };

  const validate = () => {
    const e = {};
    if (!/^[A-Z0-9-]{4,12}$/.test(f.vehicleNumber.replace(/\s+/g, '').toUpperCase())) e.vehicleNumber = 'Use 4–12 letters/digits, e.g. MH01AB1234';
    if (!f.zone) e.zone = 'Select a parking zone';
    const p = Number(f.permittedMinutes);
    if (!p || p < 1 || p > 1440) e.permittedMinutes = 'Enter 1–1440 minutes';
    if (!f.entryTime) e.entryTime = 'Entry time is required';
    else if (new Date(f.entryTime) > new Date()) e.entryTime = 'Entry time cannot be in the future';
    if (f.exitTime && new Date(f.exitTime) < new Date(f.entryTime)) e.exitTime = 'Exit must be after entry';
    if (f.exitTime && new Date(f.exitTime) > new Date()) e.exitTime = 'Exit time cannot be in the future';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const s = await api.post('/sessions', {
        vehicleNumber: f.vehicleNumber,
        zone: f.zone,
        permittedMinutes: Number(f.permittedMinutes),
        entryTime: new Date(f.entryTime).toISOString(),
        exitTime: f.exitTime ? new Date(f.exitTime).toISOString() : undefined,
      });
      notify('success', `${s.vehicleNumber} ${s.status === 'active' ? 'entry' : 'visit'} recorded.`);
      setF({ ...blank, entryTime: toLocalInput() });
      onDone();
    } catch (x) {
      notify('error', x.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card form" onSubmit={submit} noValidate>
      <div className="card-head"><h3>Record Vehicle Entry</h3></div>
      <Field label="Vehicle number" error={err.vehicleNumber}>
        <input value={f.vehicleNumber} onChange={(e) => set('vehicleNumber', e.target.value.toUpperCase())} placeholder="MH01AB1234" maxLength={14} />
      </Field>
      <Field label="Parking zone" error={err.zone}>
        <select value={f.zone} onChange={(e) => pickZone(e.target.value)}>
          <option value="">Select zone…</option>
          {zones.map((z) => <option key={z._id} value={z._id}>{z.code} – {z.name}</option>)}
        </select>
      </Field>
      <Field label="Permitted duration (minutes)" error={err.permittedMinutes}>
        <input type="number" min="1" max="1440" value={f.permittedMinutes} onChange={(e) => set('permittedMinutes', e.target.value)} />
      </Field>
      <div className="row2">
        <Field label="Entry time" error={err.entryTime}>
          <input type="datetime-local" value={f.entryTime} onChange={(e) => set('entryTime', e.target.value)} />
        </Field>
        <Field label="Exit time (optional)" error={err.exitTime}>
          <input type="datetime-local" value={f.exitTime} onChange={(e) => set('exitTime', e.target.value)} />
        </Field>
      </div>
      <p className="hint">Leave exit time empty for a vehicle that is parked now. Use “Record exit” in Active Sessions later.</p>
      <button className="btn primary" disabled={busy || !zones.length}>{busy ? 'Saving…' : 'Save entry'}</button>
      {!zones.length && <small className="err">Add a parking zone first.</small>}
    </form>
  );
}

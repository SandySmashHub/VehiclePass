import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const NONE = {};

export default function MapView({ zones = [], occupancy = NONE, picked = null, onPick, onLocate, height = 420 }) {
  const box = useRef(null), map = useRef(null), zoneLayer = useRef(null), meLayer = useRef(null), pickLayer = useRef(null);
  const hasPos = useRef(false), fitted = useRef(false), pickCb = useRef(onPick);
  const [msg, setMsg] = useState({ type: 'info', text: 'Asking for your location…' });
  const [busy, setBusy] = useState(false);
  pickCb.current = onPick;

  // create the map once
  useEffect(() => {
    const m = L.map(box.current).setView([20.59, 78.96], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m);
    zoneLayer.current = L.layerGroup().addTo(m);
    meLayer.current = L.layerGroup().addTo(m);
    pickLayer.current = L.layerGroup().addTo(m);
    m.on('click', (e) => pickCb.current && pickCb.current(e.latlng));
    map.current = m;
    setTimeout(() => m.invalidateSize(), 150);
    return () => { m.remove(); map.current = null; };
  }, []);

  // draw parking zones
  useEffect(() => {
    const g = zoneLayer.current;
    g.clearLayers();
    zones.forEach((z) => {
      const popup = () => {
        const d = document.createElement('div');
        const t = document.createElement('strong');
        t.textContent = `${z.name} (${z.code})`;
        const p = document.createElement('div');
        p.textContent = `Occupied ${occupancy[z._id] || 0}/${z.capacity} · Limit ${z.permittedMinutes} min`;
        d.append(t, p);
        return d;
      };
      L.circle([z.latitude, z.longitude], { radius: z.radius, color: '#15803d', weight: 2, fillColor: '#22c55e', fillOpacity: 0.2 }).addTo(g).bindPopup(popup());
      L.circleMarker([z.latitude, z.longitude], { radius: 6, color: '#14532d', fillColor: '#16a34a', fillOpacity: 1 }).addTo(g).bindPopup(popup()).bindTooltip(z.code);
    });
    if (zones.length && !fitted.current && !hasPos.current) {
      map.current.fitBounds(L.featureGroup(g.getLayers()).getBounds().pad(0.3));
      fitted.current = true;
    }
  }, [zones, occupancy]);

  // marker for a location picked by clicking the map (zone form)
  useEffect(() => {
    const g = pickLayer.current;
    g.clearLayers();
    if (picked && Number.isFinite(picked.lat) && Number.isFinite(picked.lng))
      L.circleMarker([picked.lat, picked.lng], { radius: 9, color: '#b45309', fillColor: '#f59e0b', fillOpacity: 0.9 }).addTo(g).bindTooltip('Selected location');
  }, [picked]);

  const locate = () => {
    if (!navigator.geolocation) {
      setMsg({ type: 'error', text: 'Geolocation is not supported by this browser.' });
      return;
    }
    setBusy(true);
    setMsg({ type: 'info', text: 'Getting your current location…' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!map.current) return;
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        hasPos.current = true;
        meLayer.current.clearLayers();
        L.circle([lat, lng], { radius: accuracy, color: '#2563eb', weight: 1, fillOpacity: 0.1 }).addTo(meLayer.current);
        L.circleMarker([lat, lng], { radius: 8, color: '#fff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 }).addTo(meLayer.current).bindPopup('You are here');
        map.current.setView([lat, lng], 17);
        onLocate && onLocate({ lat, lng, accuracy });
        setMsg({ type: 'success', text: `Location found (accuracy ±${Math.round(accuracy)} m).` });
        setBusy(false);
      },
      (err) => {
        const text = {
          1: 'Location permission denied. Allow location access in the browser address bar, then press Refresh.',
          2: 'Your position is unavailable. Check GPS / Wi-Fi and try again.',
          3: 'The location request timed out. Please try again.',
        }[err.code] || 'Could not get your location.';
        setMsg({ type: 'error', text });
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  useEffect(() => { locate(); }, []); // eslint-disable-line

  return (
    <div className="card">
      <div className="card-head">
        <h3>Live Map</h3>
        <button className="btn small" onClick={locate} disabled={busy}>{busy ? 'Locating…' : '⟳ Refresh location'}</button>
      </div>
      {msg && (
        <div className={`alert ${msg.type}`}>
          <span>{msg.text}</span>
          <button className="x" onClick={() => setMsg(null)} aria-label="Dismiss">✕</button>
        </div>
      )}
      <div ref={box} className="map" style={{ height }} />
      <div className="legend"><span className="dot blue" /> You <span className="dot green" /> Parking zone {onPick && <><span className="dot amber" /> Selected point (click map)</>}</div>
    </div>
  );
}

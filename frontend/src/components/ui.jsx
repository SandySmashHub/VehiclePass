export const Spinner = ({ text = 'Loading…' }) => (
  <div className="center"><div className="spinner" /><p>{text}</p></div>
);

export const Empty = ({ icon = '🅿️', title, text, children }) => (
  <div className="empty"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p>{children}</div>
);

export const Field = ({ label, error, children }) => (
  <label className="field"><span>{label}</span>{children}{error && <small className="err">{error}</small>}</label>
);

export const Badge = ({ s }) => {
  if (s.status === 'active') return s.overstay ? <span className="badge red">Overstay</span> : <span className="badge green">Parked</span>;
  return s.overstay ? <span className="badge red">Completed · Overstayed</span> : <span className="badge gray">Completed</span>;
};

const router = require('express').Router();
const mongoose = require('mongoose');
const Zone = require('../models/Zone');
const Session = require('../models/Session');
const seed = require('../utils/seedData');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const bad = (res, message) => res.status(400).json({ message });
const clean = (v) => String(v || '').replace(/\s+/g, '').toUpperCase();
const mins = (a, b) => Math.max(0, Math.round((b - a) / 60000));
const POP = ['zone', 'name code'];

// Adds calculated fields: duration, overstay flag, overstay minutes.
const view = (doc) => {
  const o = doc.toObject();
  const end = o.exitTime || new Date();
  o.durationMinutes = mins(o.entryTime, end);
  o.overstayMinutes = Math.max(0, o.durationMinutes - o.permittedMinutes);
  o.overstay = o.overstayMinutes > 0;
  return o;
};

router.get('/sessions', wrap(async (req, res) => {
  const filter = {};
  if (['active', 'completed'].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.zone && mongoose.isValidObjectId(req.query.zone)) filter.zone = req.query.zone;
  const list = await Session.find(filter).populate(...POP).sort({ entryTime: -1 });
  res.json(list.map(view));
}));

// Record vehicle entry (optionally with exit time to log a finished visit)
router.post('/sessions', wrap(async (req, res) => {
  const b = req.body;
  const vehicleNumber = clean(b.vehicleNumber);
  const zone = mongoose.isValidObjectId(b.zone) ? await Zone.findById(b.zone) : null;
  if (!zone) return bad(res, 'Please select a valid parking zone');
  const entry = b.entryTime ? new Date(b.entryTime) : new Date();
  const exit = b.exitTime ? new Date(b.exitTime) : null;
  if (isNaN(entry)) return bad(res, 'Invalid entry time');
  if (entry > Date.now() + 60000) return bad(res, 'Entry time cannot be in the future');
  if (exit) {
    if (isNaN(exit)) return bad(res, 'Invalid exit time');
    if (exit < entry) return bad(res, 'Exit time must be after entry time');
    if (exit > Date.now() + 60000) return bad(res, 'Exit time cannot be in the future');
  } else {
    if (await Session.findOne({ vehicleNumber, status: 'active' }))
      return bad(res, `${vehicleNumber} is already parked. Record its exit first.`);
    if ((await Session.countDocuments({ zone: zone._id, status: 'active' })) >= zone.capacity)
      return bad(res, `${zone.name} is full (capacity ${zone.capacity})`);
  }
  const doc = await Session.create({
    vehicleNumber, zone: zone._id, entryTime: entry, exitTime: exit || undefined,
    permittedMinutes: Number(b.permittedMinutes) || zone.permittedMinutes,
    status: exit ? 'completed' : 'active',
  });
  await doc.populate(...POP);
  res.status(201).json(view(doc));
}));

// Record vehicle exit
router.put('/sessions/:id/exit', wrap(async (req, res) => {
  const doc = await Session.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Session not found' });
  if (doc.status === 'completed') return bad(res, 'This vehicle has already exited');
  const exit = req.body.exitTime ? new Date(req.body.exitTime) : new Date();
  if (isNaN(exit) || exit < doc.entryTime) return bad(res, 'Exit time must be after entry time');
  doc.exitTime = exit;
  doc.status = 'completed';
  await doc.save();
  await doc.populate(...POP);
  res.json(view(doc));
}));

router.delete('/sessions/:id', wrap(async (req, res) => {
  const doc = await Session.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Session not found' });
  res.json({ message: 'Record deleted' });
}));

router.get('/stats', wrap(async (req, res) => {
  const [zones, all] = await Promise.all([Zone.countDocuments(), Session.find().populate(...POP)]);
  const v = all.map(view);
  const active = v.filter((s) => s.status === 'active');
  const occupancy = {};
  active.forEach((s) => { if (s.zone) occupancy[s.zone._id] = (occupancy[s.zone._id] || 0) + 1; });
  res.json({
    zones, totalSessions: v.length, active: active.length, completed: v.length - active.length,
    overstayActive: active.filter((s) => s.overstay).length,
    overstayTotal: v.filter((s) => s.overstay).length, occupancy,
  });
}));

router.get('/vehicles', wrap(async (req, res) => {
  const all = (await Session.find().populate(...POP).sort({ entryTime: 1 })).map(view);
  const map = {};
  all.forEach((s) => {
    const r = (map[s.vehicleNumber] ||= { vehicleNumber: s.vehicleNumber, visits: 0, overstays: 0, totalMinutes: 0, lastSeen: null, lastZone: '', parked: false });
    r.visits++;
    r.totalMinutes += s.durationMinutes;
    if (s.overstay) r.overstays++;
    r.lastSeen = s.entryTime;
    r.lastZone = s.zone ? s.zone.name : '';
    r.parked = s.status === 'active';
  });
  res.json(Object.values(map).sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)));
}));

// Load demo data (only when database is empty)
router.post('/seed', wrap(async (req, res) => {
  if ((await Zone.countDocuments()) > 0) return res.status(409).json({ message: 'Database already contains zones. Demo data not loaded.' });
  const lat = Number(req.body.latitude), lng = Number(req.body.longitude);
  await seed(Number.isFinite(lat) && req.body.latitude !== null ? lat : undefined, Number.isFinite(lng) && req.body.longitude !== null ? lng : undefined);
  res.status(201).json({ message: 'Demo data loaded' });
}));

module.exports = router;

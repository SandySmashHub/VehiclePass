const router = require('express').Router();
const Zone = require('../models/Zone');
const Session = require('../models/Session');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const pick = (b) => {
  const o = {};
  ['name', 'code', 'latitude', 'longitude', 'radius', 'capacity', 'permittedMinutes'].forEach((k) => {
    if (b[k] !== undefined && b[k] !== '') o[k] = b[k];
  });
  return o;
};

router.get('/', wrap(async (req, res) => res.json(await Zone.find().sort('code'))));

router.post('/', wrap(async (req, res) => res.status(201).json(await Zone.create(pick(req.body)))));

router.put('/:id', wrap(async (req, res) => {
  const zone = await Zone.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
  if (!zone) return res.status(404).json({ message: 'Zone not found' });
  res.json(zone);
}));

router.delete('/:id', wrap(async (req, res) => {
  const used = await Session.countDocuments({ zone: req.params.id });
  if (used > 0)
    return res.status(400).json({ message: `Cannot delete: this zone has ${used} parking record(s). Records must stay in history.` });
  const zone = await Zone.findByIdAndDelete(req.params.id);
  if (!zone) return res.status(404).json({ message: 'Zone not found' });
  res.json({ message: 'Zone deleted' });
}));

module.exports = router;

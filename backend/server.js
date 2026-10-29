require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

app.get('/api/health', (req, res) =>
  res.json({ ok: true, db: mongoose.connection.readyState === 1 })
);
app.use('/api/zones', require('./routes/zones'));
app.use('/api', require('./routes/sessions'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
  if (err.name === 'ValidationError')
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join('. ') });
  if (err.name === 'CastError') return res.status(400).json({ message: `Invalid value for "${err.path}"` });
  if (err.code === 11000) return res.status(400).json({ message: 'A zone with that code already exists' });
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing. Copy backend/.env.example to backend/.env and fill it in.');
  process.exit(1);
}
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('MongoDB connection failed:', e.message);
    process.exit(1);
  });

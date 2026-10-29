// Usage: npm run seed            (adds demo data if DB is empty)
//        npm run seed -- --reset (wipes zones + records, then adds demo data)
require('dotenv').config();
const mongoose = require('mongoose');
const Zone = require('./models/Zone');
const Session = require('./models/Session');
const seed = require('./utils/seedData');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    if (process.argv.includes('--reset')) {
      await Session.deleteMany({});
      await Zone.deleteMany({});
      console.log('Existing data cleared');
    }
    if ((await Zone.countDocuments()) > 0) console.log('Database already has data. Use "npm run seed -- --reset" to start over.');
    else { await seed(); console.log('Demo data inserted'); }
  } catch (e) {
    console.error('Seeding failed:', e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();

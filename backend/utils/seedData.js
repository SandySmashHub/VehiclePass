const Zone = require('../models/Zone');
const Session = require('../models/Session');

const ago = (m) => new Date(Date.now() - m * 60000);

module.exports = async function seed(lat = Number(process.env.DEMO_LAT) || 20.5937, lng = Number(process.env.DEMO_LNG) || 78.9629) {
  const zones = await Zone.insertMany([
    { name: 'Main Gate Parking', code: 'A1', latitude: lat + 0.0006, longitude: lng + 0.0006, radius: 55, capacity: 15, permittedMinutes: 120 },
    { name: 'Library Lot', code: 'B1', latitude: lat - 0.0006, longitude: lng + 0.001, radius: 50, capacity: 10, permittedMinutes: 60 },
    { name: 'Staff Parking', code: 'C1', latitude: lat + 0.0002, longitude: lng - 0.0012, radius: 65, capacity: 20, permittedMinutes: 480 },
  ]);
  const [A, B, C] = zones.map((z) => z._id);
  // [vehicle, zone, minutes ago entered, minutes ago exited (null = still parked), permitted minutes]
  const rows = [
    ['MH01AB1234', A, 30, null, 120], ['MH02CD5678', A, 150, null, 120], ['MH03EF9012', B, 20, null, 60],
    ['MH04GH3456', B, 95, null, 60], ['KA05JK7890', C, 200, null, 480],
    ['MH01AB1234', A, 1500, 1440, 120], ['DL06MN2345', B, 3000, 2900, 60], ['MH12PQ6789', C, 2900, 2500, 480],
    ['TN07RS1122', A, 4400, 4200, 120], ['MH02CD5678', B, 5800, 5770, 60], ['GJ08TU3344', C, 1500, 1000, 480],
  ];
  await Session.insertMany(rows.map(([v, z, inM, outM, p]) => ({
    vehicleNumber: v, zone: z, entryTime: ago(inM), exitTime: outM === null ? undefined : ago(outM),
    permittedMinutes: p, status: outM === null ? 'active' : 'completed',
  })));
};

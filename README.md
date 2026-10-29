# VehiclePass – Parking Misuse & Overstay Detection System

A MERN-style college project: record vehicle entry/exit in parking zones, track GPS location on a map, and automatically flag vehicles that stay longer than the permitted time.
No login or signup – the dashboard opens directly.

**Stack:** React (Vite) · Node.js + Express · MongoDB Atlas (Mongoose) · Leaflet + OpenStreetMap · Browser Geolocation API

## Project structure
```
VehiclePass/
├── backend/            Express API + Mongoose models
│   ├── models/         Zone.js, Session.js
│   ├── routes/         zones.js, sessions.js (sessions, stats, vehicles, seed)
│   ├── utils/seedData.js, seed.js, server.js
│   └── .env.example
├── frontend/           React app
│   ├── src/components/ MapView, SessionForm, SessionTable, ZonesPage, VehiclesPage, ui
│   ├── src/App.jsx, api.js, utils.js, styles.css
│   └── .env.example
├── package.json        root scripts (run both servers together)
└── .env.example
```

## 1. Download the ZIP and open in VS Code (Windows)
1. Download `VehiclePass.zip` from the chat.
2. Right-click the ZIP → **Extract All…** → choose e.g. `C:\Projects`.
3. Install **Node.js LTS** (https://nodejs.org) and **VS Code** if you don't have them. Check: open a terminal and run `node -v` and `npm -v`.
4. Open VS Code → **File → Open Folder…** → select the `VehiclePass` folder.
5. Open a terminal inside VS Code: **Terminal → New Terminal**.

## 2. Set up MongoDB Atlas (free)
1. Sign up at https://www.mongodb.com/cloud/atlas and create a free **M0** cluster.
2. **Database Access → Add New Database User**: choose a username + password (avoid `@ : /` in the password). Give “Read and write to any database”.
3. **Network Access → Add IP Address** → “Allow access from anywhere” (`0.0.0.0/0`) for the demo (or add your own IP).
4. **Database → Connect → Drivers** → copy the connection string, which looks like  
   `mongodb+srv://<db_user>:<db_password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
5. Insert the database name `vehiclepass` before the `?` and replace the placeholders with your user/password.

## 3. Configure environment files
In the VS Code terminal (PowerShell, from the `VehiclePass` folder):
```powershell
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```
Edit `backend\.env` and paste your connection string into `MONGODB_URI`. Leave the other values as they are.  
`frontend\.env` holds `VITE_API_URL=http://localhost:5000/api` (change it if your API runs elsewhere).  
`.env` files are git-ignored – never commit real credentials.

## 4. Install and run
```powershell
npm run setup      # installs root, backend and frontend packages
npm run seed       # optional: inserts demo zones + parking records
npm run dev        # starts API (port 5000) and React app (port 5173)
```
Open **http://localhost:5173**.  
(If PowerShell blocks `npm` scripts, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use Command Prompt.)

Run separately if preferred: `cd backend && npm run dev` and, in another terminal, `cd frontend && npm run dev`.

Demo data alternatives: on an empty database the Dashboard shows a **Load demo data** button that places the demo zones around your current GPS location. To start over: `npm run seed -- --reset` inside `backend`.

## 5. Features & how to demo
| Feature | Where |
|---|---|
| Live GPS location (blue dot), Refresh button, dismissible permission/error messages | Dashboard map |
| Parking zones drawn from saved coordinates (click one for occupancy) | Dashboard / Zones |
| Record entry (vehicle no., zone, entry time, optional exit time, permitted minutes) | Dashboard form |
| Record exit, automatic duration & overstay calculation | Active Sessions |
| Statistics, overstay alerts | Dashboard |
| Completed sessions, parking history with filters | Completed / History |
| Vehicle records (visits, overstays, total time) | Vehicles |
| Zone management (add / edit / delete, click map or use GPS for coordinates) | Zones |

**Demo script:** open Dashboard → allow location → show the red *Overstay Alerts* (demo data) → add a new entry with an entry time 3 hours ago in a zone with a 2-hour limit → it appears as overstay → record exit → show History and Vehicles → refresh the page to show data persists.

## How overstay is calculated
`duration = (exitTime or now) − entryTime`; if `duration > permittedMinutes` the session is flagged, and `overstayMinutes = duration − permittedMinutes`. Calculated in `backend/routes/sessions.js` (`view()`), so the UI always shows the server's values (refreshed every 30 s).

## API summary
`GET/POST /api/zones`, `PUT/DELETE /api/zones/:id` · `GET/POST /api/sessions`, `PUT /api/sessions/:id/exit`, `DELETE /api/sessions/:id` · `GET /api/stats`, `GET /api/vehicles`, `POST /api/seed`, `GET /api/health`

## Troubleshooting
- **“Cannot reach the server”** – backend not running or `VITE_API_URL` wrong (restart the frontend after editing `.env`).
- **MongoDB connection failed** – check the password, the `vehiclepass` db name, and Network Access in Atlas.
- **Location blocked** – click the lock icon in the address bar → allow Location → press *Refresh location*. Geolocation works on `localhost` without HTTPS.

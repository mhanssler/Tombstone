# Baby Sleep Tracker

A free, offline-first Progressive Web App (PWA) for tracking your baby's sleep, feedings, and diaper changes. Similar to Huckleberry, but runs on your own devices without app store fees.

## Features

- 🌙 **Sleep Tracking** - Start/stop timers for naps and night sleep
- ⏰ **Wake Window Calculator** - Shows time since last sleep with age-appropriate recommendations
- 🍼 **Feeding Logs** - Track bottle, breast, and solid feedings
- 👶 **Diaper Tracking** - Quick-log wet and dirty diapers
- 📊 **Statistics** - View sleep patterns over the past 7 days
- 📱 **Works Offline** - All data stored locally, syncs when online
- 🔄 **Multi-device Sync** - Optional Supabase sync between you and your partner
- 📲 **Install to Home Screen** - Works like a native app on iPhone and Android

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open http://localhost:5173 on your phone and **Add to Home Screen** for the best experience.

## Deployment (Free)

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Deploy - it's free for personal projects

### Option 2: Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and import your repository
3. Deploy - also free

## Multi-Device Sync (Optional)

To sync data between your devices (e.g., you and your partner):

### 1. Create a Supabase Project (Free)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and run this to create the tables:

```sql
-- Children table
CREATE TABLE children (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date TEXT,
  photo_uri TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  sync_status TEXT DEFAULT 'synced',
  _deleted BOOLEAN DEFAULT FALSE
);

-- Sleep sessions table
CREATE TABLE sleep_sessions (
  id UUID PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id),
  start_time BIGINT NOT NULL,
  end_time BIGINT,
  type TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  sync_status TEXT DEFAULT 'synced',
  _deleted BOOLEAN DEFAULT FALSE
);

-- Feeding sessions table
CREATE TABLE feeding_sessions (
  id UUID PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id),
  start_time BIGINT NOT NULL,
  end_time BIGINT,
  type TEXT NOT NULL,
  amount INTEGER,
  notes TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  sync_status TEXT DEFAULT 'synced',
  _deleted BOOLEAN DEFAULT FALSE
);

-- Diaper changes table
CREATE TABLE diaper_changes (
  id UUID PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id),
  time BIGINT NOT NULL,
  type TEXT NOT NULL,
  notes TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  sync_status TEXT DEFAULT 'synced',
  _deleted BOOLEAN DEFAULT FALSE
);

-- Growth measurements table
CREATE TABLE growth_measurements (
  id UUID PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id),
  date TEXT NOT NULL,
  weight_kg REAL,
  height_cm REAL,
  head_circumference_cm REAL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  sync_status TEXT DEFAULT 'synced',
  _deleted BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diaper_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_measurements ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all authenticated users for family sharing)
CREATE POLICY "Allow all for authenticated" ON children FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON sleep_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON feeding_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON diaper_changes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON growth_measurements FOR ALL USING (auth.role() = 'authenticated');
```

### 2. Configure Env Vars (Frontend vs Bridge)

Use this mapping exactly. Most sync issues come from mixing these up.

| Credential | Env var(s) | Where it belongs | Safe in frontend/client? |
| --- | --- | --- | --- |
| Supabase Project URL | `VITE_SUPABASE_URL` (frontend), `SUPABASE_URL` (bridge) | Vercel env + bridge env | Yes |
| Supabase anon key | `VITE_SUPABASE_ANON_KEY` | Vercel env (browser app) | Yes (designed to be public) |
| Supabase service_role key | `SUPABASE_SERVICE_ROLE_KEY` | Server-side only (`scripts/.env.owlet-bridge`) | No |

#### Frontend (Vercel / browser app)

1. Copy `.env.example` to `.env` for local app development.
2. Set:
   - `VITE_SUPABASE_URL=https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your-anon-key`
3. In Vercel Project Settings -> Environment Variables, set the same two `VITE_` values.
4. Redeploy after changes.

#### Owlet bridge writer (local script)

Set these in `scripts/.env.owlet-bridge`:

- `SUPABASE_URL=https://your-project.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`

Rules:

1. Never put `service_role` in any `VITE_` variable.
2. Never put `anon` in `SUPABASE_SERVICE_ROLE_KEY`.
3. If `service_role` was ever exposed in frontend/Vercel client vars, rotate it immediately.

Quick error decoding:

- `401 Invalid API key`: wrong key for that project URL, typo, or rotated key.
- `42501 ... violates row-level security`: bridge is likely using anon/authenticated credentials instead of service role.

## Installing on Your Phone

### iPhone (Safari)

1. Open the app URL in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)

1. Open the app URL in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home Screen" or "Install App"
4. Tap "Add"

## Tech Stack

- **React 18** + TypeScript
- **Vite** with PWA plugin
- **Dexie.js** for IndexedDB (offline-first storage)
- **Supabase** for optional cloud sync
- **Tailwind CSS** for styling
- **Recharts** for statistics
- **Lucide React** for icons

## Project Structure

```
src/
├── components/     # Reusable UI components
├── database/       # Dexie.js database schema and queries
├── hooks/          # Custom React hooks
├── lib/            # Supabase client and sync logic
├── screens/        # Main app screens
├── types/          # TypeScript type definitions
└── utils/          # Helper functions
```

## License

MIT - Feel free to use and modify for your family!

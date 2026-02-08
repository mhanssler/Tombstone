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

### 2. Configure the App

1. Copy `.env.example` to `.env`
2. Get your Supabase URL and anon key from **Project Settings > API**
3. Add them to `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Rebuild and redeploy

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

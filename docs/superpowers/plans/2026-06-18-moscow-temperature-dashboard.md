# Moscow Temperature Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a monorepo with an Express API that fetches Moscow's temperature from Open-Meteo and a React dashboard that polls it every 10 seconds, highlighting when it's 5+ degrees warmer or cooler than the same day last year.

**Architecture:** Monorepo root runs both servers via `concurrently`. Express (port 3001) fetches from Open-Meteo and computes the comparison. React+Vite (port 5173) proxies `/api` to Express, polling every 10 seconds.

**Tech Stack:** Node 18+, Express 4, Jest, Supertest, React 18, Vite 5, Vitest, @testing-library/react

---

## File Map

| File | Purpose |
|------|---------|
| `package.json` | Root: runs both servers via concurrently |
| `server/package.json` | Server deps: express, jest, supertest |
| `server/index.js` | Express app, mounts router, listens on 3001 |
| `server/routes/temperature.js` | GET /api/temperature — fetches Open-Meteo, returns JSON |
| `server/routes/temperature.test.js` | Jest + Supertest tests for the route |
| `client/package.json` | Client deps: react, vite, vitest, testing-library |
| `client/vite.config.js` | Vite config: React plugin, /api proxy, vitest settings |
| `client/src/test-setup.js` | Vitest setup: imports jest-dom matchers |
| `client/index.html` | Vite HTML entry |
| `client/src/main.jsx` | React entry, mounts App |
| `client/src/App.jsx` | App root, renders dashboard |
| `client/src/components/TemperatureDashboard.jsx` | Dashboard: polls API, displays cards and badge |
| `client/src/components/TemperatureDashboard.css` | Dashboard styles |
| `client/src/components/TemperatureDashboard.test.jsx` | Vitest + testing-library tests |

---

### Task 1: Root monorepo scaffold

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "chain",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "test": "npm run test --prefix server && npm run test --prefix client"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: Install root deps**

Run: `npm install` (from project root)
Expected: `node_modules/concurrently` created

- [ ] **Step 3: Commit**

```bash
git init
git add package.json package-lock.json
git commit -m "chore: init monorepo root with concurrently"
```

---

### Task 2: Express server setup

**Files:**
- Create: `server/package.json`
- Create: `server/index.js`

- [ ] **Step 1: Create server/package.json**

```json
{
  "name": "chain-server",
  "private": true,
  "scripts": {
    "dev": "node --watch index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.4"
  }
}
```

- [ ] **Step 2: Install server deps**

Run: `npm install` (from `server/`)
Expected: `server/node_modules/express` created

- [ ] **Step 3: Create server/index.js**

```js
const express = require('express');
const temperatureRouter = require('./routes/temperature');

const app = express();
const PORT = 3001;

app.use('/api/temperature', temperatureRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
```

- [ ] **Step 4: Verify server starts**

Run: `node server/index.js` (from project root)
Expected: `Server running on http://localhost:3001`
Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add server/package.json server/package-lock.json server/index.js
git commit -m "feat: add express server scaffold"
```

---

### Task 3: Temperature route (TDD)

**Files:**
- Create: `server/routes/temperature.js`
- Create: `server/routes/temperature.test.js`

- [ ] **Step 1: Create the routes directory and write the failing tests**

Create `server/routes/temperature.test.js`:

```js
const request = require('supertest');
const express = require('express');

const temperatureRouter = require('./temperature');

const app = express();
app.use('/api/temperature', temperatureRouter);

describe('GET /api/temperature', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns current, lastYearAvg, higher: false, lower: false when diff < 5', async () => {
    global.fetch
      .mockResolvedValueOnce({
        json: async () => ({ current: { temperature_2m: 20 } }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ hourly: { temperature_2m: Array(24).fill(17) } }),
      });

    const res = await request(app).get('/api/temperature');

    expect(res.status).toBe(200);
    expect(res.body.current).toBe(20);
    expect(res.body.lastYearAvg).toBe(17);
    expect(res.body.higher).toBe(false);
    expect(res.body.lower).toBe(false);
  });

  it('returns higher: true when current is exactly 5 degrees warmer', async () => {
    global.fetch
      .mockResolvedValueOnce({
        json: async () => ({ current: { temperature_2m: 22 } }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ hourly: { temperature_2m: Array(24).fill(17) } }),
      });

    const res = await request(app).get('/api/temperature');

    expect(res.status).toBe(200);
    expect(res.body.higher).toBe(true);
    expect(res.body.lower).toBe(false);
  });

  it('returns higher: true when current is more than 5 degrees warmer', async () => {
    global.fetch
      .mockResolvedValueOnce({
        json: async () => ({ current: { temperature_2m: 30 } }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ hourly: { temperature_2m: Array(24).fill(18) } }),
      });

    const res = await request(app).get('/api/temperature');

    expect(res.status).toBe(200);
    expect(res.body.higher).toBe(true);
    expect(res.body.lower).toBe(false);
  });

  it('returns lower: true when current is exactly 5 degrees cooler', async () => {
    global.fetch
      .mockResolvedValueOnce({
        json: async () => ({ current: { temperature_2m: 12 } }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ hourly: { temperature_2m: Array(24).fill(17) } }),
      });

    const res = await request(app).get('/api/temperature');

    expect(res.status).toBe(200);
    expect(res.body.lower).toBe(true);
    expect(res.body.higher).toBe(false);
  });

  it('returns lower: true when current is more than 5 degrees cooler', async () => {
    global.fetch
      .mockResolvedValueOnce({
        json: async () => ({ current: { temperature_2m: 5 } }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ hourly: { temperature_2m: Array(24).fill(18) } }),
      });

    const res = await request(app).get('/api/temperature');

    expect(res.status).toBe(200);
    expect(res.body.lower).toBe(true);
    expect(res.body.higher).toBe(false);
  });

  it('returns 500 when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const res = await request(app).get('/api/temperature');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch temperature data' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` (from `server/`)
Expected: FAIL — `Cannot find module './temperature'`

- [ ] **Step 3: Create server/routes/temperature.js**

```js
const express = require('express');
const router = express.Router();

function getLastYearDate() {
  const now = new Date();
  const lastYear = new Date(now);
  lastYear.setFullYear(now.getFullYear() - 1);
  return lastYear.toISOString().split('T')[0];
}

async function fetchCurrentTemp() {
  const res = await fetch(
    'https://api.open-meteo.com/v1/forecast?latitude=55.7558&longitude=37.6173&current=temperature_2m'
  );
  const data = await res.json();
  return data.current.temperature_2m;
}

async function fetchLastYearAvg(date) {
  const res = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=55.7558&longitude=37.6173&start_date=${date}&end_date=${date}&hourly=temperature_2m`
  );
  const data = await res.json();
  const temps = data.hourly.temperature_2m;
  return Math.round((temps.reduce((sum, t) => sum + t, 0) / temps.length) * 10) / 10;
}

router.get('/', async (req, res) => {
  try {
    const lastYearDate = getLastYearDate();
    const [current, lastYearAvg] = await Promise.all([
      fetchCurrentTemp(),
      fetchLastYearAvg(lastYearDate),
    ]);
    const diff = current - lastYearAvg;
    res.json({
      current,
      lastYearAvg,
      higher: diff >= 5,
      lower: diff <= -5,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch temperature data' });
  }
});

module.exports = router;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test` (from `server/`)
Expected: PASS — 6 tests passed

- [ ] **Step 5: Commit**

```bash
git add server/routes/temperature.js server/routes/temperature.test.js
git commit -m "feat: add GET /api/temperature with Open-Meteo integration"
```

---

### Task 4: React + Vite client setup

**Files:**
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/src/test-setup.js`
- Create: `client/index.html`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`

- [ ] **Step 1: Create client/package.json**

```json
{
  "name": "chain-client",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^16.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.0",
    "vite": "^5.3.4",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Install client deps**

Run: `npm install` (from `client/`)
Expected: `client/node_modules` created

- [ ] **Step 3: Create client/vite.config.js**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  },
});
```

- [ ] **Step 4: Create client/src/test-setup.js**

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Create client/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Moscow Temperature</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create client/src/main.jsx**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 7: Create client/src/App.jsx**

```jsx
import TemperatureDashboard from './components/TemperatureDashboard.jsx';

export default function App() {
  return <TemperatureDashboard />;
}
```

- [ ] **Step 8: Verify client starts**

Run: `npm run dev` (from `client/`)
Expected: Vite dev server at http://localhost:5173 (page will be empty — component not yet created)
Stop with Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add client/
git commit -m "feat: scaffold React+Vite client with /api proxy"
```

---

### Task 5: Dashboard component (TDD)

**Files:**
- Create: `client/src/components/TemperatureDashboard.jsx`
- Create: `client/src/components/TemperatureDashboard.css`
- Create: `client/src/components/TemperatureDashboard.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `client/src/components/TemperatureDashboard.test.jsx`:

```jsx
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import TemperatureDashboard from './TemperatureDashboard';

describe('TemperatureDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {}));
    render(<TemperatureDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays current and lastYearAvg temperatures after fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ current: 22.4, lastYearAvg: 17.1, higher: false, lower: false }),
    });

    render(<TemperatureDashboard />);

    await waitFor(() => {
      expect(screen.getByText('22.4°C')).toBeInTheDocument();
      expect(screen.getByText('17.1°C')).toBeInTheDocument();
    });
  });

  it('shows "Warmer than usual" badge when higher is true', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ current: 25, lastYearAvg: 18, higher: true, lower: false }),
    });

    render(<TemperatureDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Warmer than usual')).toBeInTheDocument();
    });
  });

  it('shows "Cooler than usual" badge when lower is true', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ current: 10, lastYearAvg: 18, higher: false, lower: true }),
    });

    render(<TemperatureDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Cooler than usual')).toBeInTheDocument();
    });
  });

  it('does not show badges when neither higher nor lower', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ current: 20, lastYearAvg: 18, higher: false, lower: false }),
    });

    render(<TemperatureDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Warmer than usual')).not.toBeInTheDocument();
      expect(screen.queryByText('Cooler than usual')).not.toBeInTheDocument();
    });
  });

  it('polls again after 10 seconds', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ current: 20, lastYearAvg: 18, higher: false, lower: false }),
    });

    render(<TemperatureDashboard />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });

  it('shows error message when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<TemperatureDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load temperature data')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` (from `client/`)
Expected: FAIL — `Cannot find module './TemperatureDashboard'`

- [ ] **Step 3: Create client/src/components/TemperatureDashboard.jsx**

```jsx
import { useState, useEffect } from 'react';
import './TemperatureDashboard.css';

export default function TemperatureDashboard() {
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemp = async () => {
      try {
        const res = await fetch('/api/temperature');
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
        setError(null);
      } catch {
        setError('Failed to load temperature data');
      }
    };

    fetchTemp();
    const interval = setInterval(fetchTemp, 10000);
    return () => clearInterval(interval);
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Moscow Temperature</h1>
      {data.higher && (
        <div className="badge-higher">Warmer than usual</div>
      )}
      {data.lower && (
        <div className="badge-lower">Cooler than usual</div>
      )}
      <div className="cards">
        <div className="card">
          <div className="label">Current</div>
          <div className="temp">{data.current}°C</div>
        </div>
        <div className="card">
          <div className="label">Last Year Average</div>
          <div className="temp">{data.lastYearAvg}°C</div>
        </div>
      </div>
      {lastUpdated && (
        <div className="timestamp">Last updated: {lastUpdated.toLocaleTimeString()}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create client/src/components/TemperatureDashboard.css**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, sans-serif;
  background: #0f172a;
  color: #f1f5f9;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard {
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

.badge-higher {
  background: #ef4444;
  color: white;
  padding: 0.4rem 1.2rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  display: inline-block;
}

.badge-lower {
  background: #3b82f6;
  color: white;
  padding: 0.4rem 1.2rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  display: inline-block;
}

.cards {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.card {
  background: #1e293b;
  border-radius: 1rem;
  padding: 2rem 3rem;
  min-width: 180px;
}

.label {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.temp {
  font-size: 3rem;
  font-weight: 700;
  color: #38bdf8;
}

.timestamp {
  font-size: 0.78rem;
  color: #475569;
}

.loading {
  font-size: 1.2rem;
  color: #94a3b8;
}

.error {
  font-size: 1.2rem;
  color: #ef4444;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test` (from `client/`)
Expected: PASS — 7 tests passed

- [ ] **Step 6: Commit**

```bash
git add client/src/components/
git commit -m "feat: add TemperatureDashboard with 10s polling, warmer and cooler badges"
```

---

### Task 6: Smoke test full stack

- [ ] **Step 1: Run both servers from root**

Run: `npm run dev` (from project root)
Expected: Two servers start — Vite on 5173, Express on 3001

- [ ] **Step 2: Verify API**

Run: `curl http://localhost:3001/api/temperature`
Expected: JSON with `current`, `lastYearAvg`, `higher`, `lower` fields

- [ ] **Step 3: Verify dashboard in browser**

Open: `http://localhost:5173`
Expected: Dashboard shows Moscow temp cards, updates every 10s, red badge if `higher: true`, blue badge if `lower: true`

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: full stack smoke test passing"
```

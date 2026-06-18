# Moscow Temperature Dashboard — Design Spec
Date: 2026-06-18

## Overview

A full-stack monorepo (Express + React) that polls Open-Meteo every 10 seconds to display Moscow's current temperature, compares it to the same calendar day last year, and highlights when it is 5+ degrees warmer or 5+ degrees cooler.

## Architecture

Monorepo with `concurrently` running both servers from the root:

```
chain/
├── package.json              ← root: runs server + client via concurrently
├── server/
│   ├── package.json
│   ├── index.js              ← Express entry, port 3001
│   └── routes/
│       └── temperature.js    ← GET /api/temperature
└── client/
    ├── package.json
    ├── vite.config.js        ← proxies /api → localhost:3001
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── components/
            └── TemperatureDashboard.jsx
```

## Backend

**Endpoint:** `GET /api/temperature`  
**Request body:** none  
**Stack:** Express, node-fetch (or native fetch in Node 18+)

### Logic

1. Fetch current Moscow temperature:
   `https://api.open-meteo.com/v1/forecast?latitude=55.7558&longitude=37.6173&current=temperature_2m`

2. Fetch same calendar day last year hourly data from Open-Meteo archive:
   `https://archive-api.open-meteo.com/v1/archive?latitude=55.7558&longitude=37.6173&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&hourly=temperature_2m`
   where the date is today's month/day but year minus one.

3. Compute last year's daily mean: average all hourly temperature values for that day.

4. Return:
```json
{
  "current": 22.4,
  "lastYearAvg": 17.1,
  "higher": true,
  "lower": false
}
```
`higher` is `true` when `current - lastYearAvg >= 5`.  
`lower` is `true` when `lastYearAvg - current >= 5`.

### Error handling

- If either Open-Meteo call fails, respond `500` with `{ "error": "Failed to fetch temperature data" }`.

## Frontend

**Stack:** React + Vite, plain CSS (no UI library)

### Dashboard components

- **Current temperature card** — large display of current temp in °C
- **Last year average card** — shows last year's same-day mean temp
- **"Warmer than usual" badge** — red highlight shown only when `higher: true`
- **"Cooler than usual" badge** — blue highlight shown only when `lower: true`
- **Last updated timestamp** — time of last successful fetch
- **Auto-poll** — `useEffect` with `setInterval` every 10 seconds, clears on unmount

### Vite proxy

`/api/*` proxied to `http://localhost:3001` — no CORS config needed in dev.

## Constraints

- `higher: true` when current is 5+ degrees **warmer** than last year's average.
- `lower: true` when current is 5+ degrees **colder** than last year's average.
- Both cannot be true simultaneously.
- No authentication, no persistence, no database.
- No external React UI library — plain CSS only.

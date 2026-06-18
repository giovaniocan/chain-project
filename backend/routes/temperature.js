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

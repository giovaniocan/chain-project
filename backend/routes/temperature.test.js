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

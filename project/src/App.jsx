import { useEffect, useState } from "react";

const API_URL = "http://localhost:3001/api/temperature";

export default function App() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchWeather() {
    try {
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch weather");
      }

      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setError("Could not load Moscow weather.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWeather();

    const intervalId = setInterval(() => {
      fetchWeather();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const difference = weather
    ? Number(Math.abs(weather.current - weather.lastYearAvg).toFixed(1))
    : 0;
  const hasAlert = weather ? weather.higher || weather.lower : false;
  const direction = weather?.higher ? "higher" : "lower";

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Moscow Weather Dashboard</h1>

        {loading && <p>Loading...</p>}

        {error && <p style={styles.error}>{error}</p>}

        {weather && (
          <>
            <div style={styles.temperature}>
              {weather.current}°C
            </div>

            <p style={styles.text}>
              Last year average for this day:{" "}
              <strong>{weather.lastYearAvg}°C</strong>
            </p>

            <p style={styles.text}>
              Difference: <strong>{difference}°C</strong>
            </p>

            {hasAlert && (
              <div style={styles.alert}>
                Alert: current temperature is more than 5°C {direction} than
                last year's average.
              </div>
            )}

            {!hasAlert && (
              <div style={styles.ok}>
                Temperature is within 5°C of last year's average.
              </div>
            )}

            <p style={styles.updated}>
              Updated every 10 seconds
            </p>
          </>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "#ffffff",
    borderRadius: "8px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  title: {
    marginBottom: "24px",
    fontSize: "24px",
  },
  temperature: {
    fontSize: "56px",
    fontWeight: "700",
    marginBottom: "16px",
  },
  text: {
    fontSize: "16px",
    color: "#374151",
  },
  alert: {
    marginTop: "20px",
    padding: "14px",
    borderRadius: "6px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: "700",
  },
  ok: {
    marginTop: "20px",
    padding: "14px",
    borderRadius: "6px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: "700",
  },
  error: {
    color: "#b91c1c",
  },
  updated: {
    marginTop: "20px",
    fontSize: "13px",
    color: "#6b7280",
  },
};

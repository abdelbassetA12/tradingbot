


require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const http = require("http");

// Modules
const { replaySignals } = require("./signalReplay");
const { generateSignal } = require("./strategy");
const { replayBacktest } = require("./backtest");

const convertRoute = require("./testnet/convert");
const testnetRoutes = require("./testnet/routes");
const { run } = require("./testnet/runner");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Config
const PORT = process.env.PORT || 5000;
const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

// Axios instance (أفضل)
const api = axios.create({
  baseURL: "https://api.binance.com",
  timeout: 10000,
});

// ================= HELPERS =================

// retry logic
async function fetchWithRetry(url, retries = 3) {
  try {
    return await api.get(url);
  } catch (err) {
    if (retries === 0) throw err;
    console.log("🔁 Retry...", url);
    return fetchWithRetry(url, retries - 1);
  }
}

// جلب البيانات
async function getData(symbol, interval = "15m", limit = 200) {
  try {
    const res = await fetchWithRetry(
      `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );

    return res.data.map(c => ({
      time: c[0],
      open: +c[1],
      high: +c[2],
      low: +c[3],
      close: +c[4],
      volume: +c[5]
    }));
  } catch (err) {
    console.error(`❌ Error fetching ${symbol}:`, err.message);
    return [];
  }
}

// ================= ROUTES =================

app.use("/api", convertRoute);
app.use("/api/testnet", testnetRoutes);

// Health check (مهم ل Render)
app.get("/", (req, res) => {
  res.send("🚀 API is running");
});

// ================= SIGNALS =================

app.get("/signals", async (req, res) => {
  try {
    const results = await Promise.all(
      SYMBOLS.map(async (symbol) => {
        const data = await getData(symbol);
        const analysis = generateSignal(data);

        return {
          symbol,
          ...analysis
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("❌ Signals error:", err.message);
    res.status(500).json({ error: "Failed to fetch signals" });
  }
});

// ================= BACKTEST =================

app.get("/replay", async (req, res) => {
  try {
    const symbol = req.query.symbol || "BTCUSDT";
    const interval = req.query.interval || "15m";

    const data = await getData(symbol, interval, 1000);
    const result = replayBacktest(data);

    res.json(result);
  } catch (err) {
    console.error("❌ Replay error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= SIGNAL REPLAY =================

app.get("/signals-replay", async (req, res) => {
  try {
    const symbol = req.query.symbol || "BTCUSDT";
    const interval = req.query.interval || "15m";

    const data = await getData(symbol, interval, 1000);
    const signals = replaySignals(data);

    res.json({
      total: signals.length,
      signals
    });

  } catch (err) {
    console.error("❌ Signals replay error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= START BOT =================

// مهم: ما تخليش البوت يضرب Render idle
setTimeout(() => {
  run(SYMBOLS);
}, 5000);

// ================= START SERVER =================

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

const APP_URL = process.env.APP_URL;

if (APP_URL) {
  setInterval(async () => {
    try {
      await axios.get(APP_URL);
      console.log("🔄 Self ping sent");
    } catch (err) {
      console.log("❌ Self ping failed:", err.message);
    }
  }, 10 * 60 * 1000); // كل 10 دقائق
}










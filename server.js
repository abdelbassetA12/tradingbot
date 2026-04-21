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

// 👇 WebSocket module (اللي انشأت)
const { startWS, getCandles } = require("./market/ws");

const app = express();
const server = http.createServer(app);

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= CONFIG =================
const PORT = process.env.PORT || 5000;
const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

// ================= ROUTES =================
app.use("/api", convertRoute);
app.use("/api/testnet", testnetRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("🚀 API is running");
});

// ================= SIGNALS (Hybrid: WS + fallback) =================
app.get("/signals", async (req, res) => {
  try {
    const results = await Promise.all(
      SYMBOLS.map(async (symbol) => {

        // 👇 نحاولو WebSocket أولاً
        let data = getCandles(symbol.toLowerCase());

        // fallback إلى REST إلا مازال ما كاينش data
        if (!data.length) {
          const response = await axios.get(
            `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=15m&limit=200`
          );

          data = response.data.map(c => ({
            time: c[0],
            open: +c[1],
            high: +c[2],
            low: +c[3],
            close: +c[4],
            volume: +c[5]
          }));
        }

        const analysis = generateSignal(data);

        return { symbol, ...analysis };
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

    const data = await axios.get(
      `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1000`
    );

    const formatted = data.data.map(c => ({
      time: c[0],
      open: +c[1],
      high: +c[2],
      low: +c[3],
      close: +c[4],
      volume: +c[5]
    }));

    const result = replayBacktest(formatted);

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

    const data = await axios.get(
      `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1000`
    );

    const formatted = data.data.map(c => ({
      time: c[0],
      open: +c[1],
      high: +c[2],
      low: +c[3],
      close: +c[4],
      volume: +c[5]
    }));

    const signals = replaySignals(formatted);

    res.json({
      total: signals.length,
      signals
    });

  } catch (err) {
    console.error("❌ Signals replay error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================= START SERVER =================
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // ================= SELF PING =================
  const APP_URL = process.env.APP_URL;

  if (APP_URL) {
    setInterval(async () => {
      try {
        await axios.get(APP_URL);
        console.log("🔄 Self ping sent");
      } catch (err) {
        console.log("❌ Self ping failed:", err.message);
      }
    }, 10 * 60 * 1000);
  }

  // ================= BOT START =================
  setTimeout(() => {
    run(SYMBOLS);
  }, 5000);

  // ================= START WEBSOCKET =================
  startWS("btcusdt", "15m");
  startWS("ethusdt", "15m");
  startWS("solusdt", "15m");
});
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const http = require("http");



const mongoose = require('mongoose');

const { generateSignal } = require("./strategy");



   

const convertRoute = require("./testnet/convert");
const testnetRoutes = require("./testnet/routes");
const { run } = require("./testnet/runner");





const app = express();
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 5000;

// 🔥 socket
const server = http.createServer(app);

// العملات
const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

// 📊 جلب البيانات
async function getData(symbol, interval = "15m", limit = 200) {
  const res = await axios.get(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );

  return res.data.map(c => ({
    time: c[0],   // ✅ تاريخ ووقت الكاندل الحقيقي من Binance
    open: +c[1],
    high: +c[2],
    low: +c[3],
    close: +c[4],
    volume: +c[5]
  }));
}



app.use("/api", convertRoute);
app.use("/api/testnet", testnetRoutes);




// تشغيل البوت
run(SYMBOLS);



// ================= SIGNALS =================
app.get("/signals", async (req, res) => {
  let results = [];

  for (let symbol of SYMBOLS) {
    const data = await getData(symbol);
    const analysis = generateSignal(data);

    results.push({
      symbol,
      ...analysis
    });
  }

  res.json(results);
});



app.get("/replay", async (req, res) => {
  try {
    const symbol = req.query.symbol || "BTCUSDT";
    const interval = req.query.interval || "15m";

    const data = await getData(symbol, interval, 1000); // بيانات تاريخية أوسع
    const result = replayBacktest(data);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




mongoose.connect('mongodb+srv://abdelbassetelhajiri02:abdelbassetA11@cluster0.rdkbbev.mongodb.net/biolink?retryWrites=true&w=majority&appName=Cluster0');


app.use('/api/auth', require('./routes/auth'));





// تشغيل السيرفر
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});













/*
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require('mongoose');
const { generateSignal } = require("./strategy");
const { runBacktest } = require("./backtest");



const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

mongoose.connect('mongodb+srv://abdelbassetelhajiri02:abdelbassetA11@cluster0.rdkbbev.mongodb.net/biolink?retryWrites=true&w=majority&appName=Cluster0');

const SYMBOLS = ["BTCUSDT","ETHUSDT","SOLUSDT"];

async function getData(symbol) {
  const res = await axios.get(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=15m&limit=200`
  );

  return res.data.map(c => ({
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    volume: parseFloat(c[5])
  }));
}


app.get("/backtest", async (req, res) => {
  const symbol = req.query.symbol || "BTCUSDT";
  const interval = req.query.interval || "15m";
  const limit = req.query.limit || 500;

  const response = await axios.get(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );

  const data = response.data.map(c => ({
    open: +c[1],
    high: +c[2],
    low: +c[3],
    close: +c[4],
    volume: +c[5]
  }));

  const result = runBacktest(data);

  res.json(result);
});



app.get("/signals", async (req, res) => {
  let results = [];

  for (let symbol of SYMBOLS) {
    const data = await getData(symbol);
    const analysis = generateSignal(data);

    results.push({
      symbol,
      ...analysis
    });
  }

  res.json(results);
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});    
*/



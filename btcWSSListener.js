const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;
const WSS_URL = 'wss://btc.nownodes.io/wss/7ead0e54-21ba-4090-a799-9fd6e47c69e2';

let retryAttempts = 0;
const maxRetries = 3;
let ws = null;
let pingInterval = null;
let webhookURL = null;

const subscribedAddresses = new Set();
const SUB_FILE = path.join(__dirname, 'subscribed.json');
const TX_LOG_FILE = path.join(__dirname, 'transactions.log');

// === Persistence: Save & Load ===
function saveAddresses() {
  fs.writeFileSync(SUB_FILE, JSON.stringify([...subscribedAddresses], null, 2));
  console.log('💾 Subscribed addresses saved');
}

function loadAddresses() {
  if (fs.existsSync(SUB_FILE)) {
    const data = fs.readFileSync(SUB_FILE);
    const addresses = JSON.parse(data);
    addresses.forEach(addr => subscribedAddresses.add(addr));
    console.log('📂 Loaded subscribed addresses:', [...subscribedAddresses]);
  }
}

// === WebSocket Connection ===
function connect() {
  ws = new WebSocket(WSS_URL);

  ws.on('open', () => {
    console.log('✅ Connected to WSS');
    retryAttempts = 0;

    if (subscribedAddresses.size > 0) {
      ws.send(JSON.stringify({
        id: `resub-${Date.now()}`,
        method: 'subscribeAddresses',
        params: { addresses: [...subscribedAddresses] }
      }));
      console.log('🔁 Resubscribed to:', [...subscribedAddresses]);
    }

    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ id: Date.now().toString(), method: 'ping', params: {} }));
        console.log('📤 Ping sent');
      }
    }, 29000);
  });

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg?.data?.tx) {
        const { tx, address } = msg.data;
        if (subscribedAddresses.has(address)) {
          const log = `[${new Date().toISOString()}] TX to ${address} - ${tx.txid} - ${tx.value} sats\n`;
          fs.appendFileSync(TX_LOG_FILE, log);
          console.log('📬 TX logged:', log.trim());

          if (webhookURL) {
            try {
              await axios.post(webhookURL, {
                address,
                txid: tx.txid,
                value: tx.value,
                timestamp: new Date().toISOString()
              });
              console.log('📡 Webhook triggered');
            } catch (err) {
              console.error('❌ Webhook failed:', err.message);
            }
          }
        }
      }
    } catch (err) {
      console.error('⚠️ Parse error:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('❌ WSS disconnected');
    reconnect();
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
    ws.close();
  });
}

function reconnect() {
  clearInterval(pingInterval);
  if (retryAttempts < maxRetries) {
    retryAttempts++;
    console.log(`🔁 Reconnecting... (${retryAttempts}/${maxRetries})`);
    setTimeout(connect, 2000);
  } else {
    console.log('🚫 Max reconnect attempts reached');
  }
}

// === Express API ===
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('🚀 BTC Listener API is online');
});

app.get('/status', (req, res) => {
  res.json({
    wssConnected: ws?.readyState === WebSocket.OPEN,
    subscribedCount: subscribedAddresses.size,
    webhookSet: !!webhookURL,
    serverTime: new Date().toISOString()
  });
});

app.get('/list', (req, res) => {
  res.json({ watching: [...subscribedAddresses] });
});

app.post('/subscribe', (req, res) => {
  const { addresses } = req.body;
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return res.status(400).json({ error: 'addresses must be a non-empty array' });
  }

  const newSubs = [];

  addresses.forEach(addr => {
    if (!subscribedAddresses.has(addr)) {
      subscribedAddresses.add(addr);
      newSubs.push(addr);
    }
  });

  saveAddresses();

  if (ws && ws.readyState === WebSocket.OPEN && newSubs.length > 0) {
    ws.send(JSON.stringify({
      id: `sub-${Date.now()}`,
      method: 'subscribeAddresses',
      params: { addresses: newSubs }
    }));
    console.log('✅ Subscribed to:', newSubs);
  }

  res.json({ success: true, added: newSubs, watching: [...subscribedAddresses] });
});

app.post('/unsubscribe', (req, res) => {
  const { addresses } = req.body;
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return res.status(400).json({ error: 'addresses must be a non-empty array' });
  }

  const removed = [];

  addresses.forEach(addr => {
    if (subscribedAddresses.has(addr)) {
      subscribedAddresses.delete(addr);
      removed.push(addr);
    }
  });

  saveAddresses();
  res.json({ success: true, removed, watching: [...subscribedAddresses] });
});

app.get('/logs', (req, res) => {
  if (!fs.existsSync(TX_LOG_FILE)) {
    return res.json({ logs: [] });
  }
  const logs = fs.readFileSync(TX_LOG_FILE, 'utf8')
    .split('\n')
    .filter(Boolean)
    .slice(-50); // last 50 entries
  res.json({ logs });
});

app.post('/webhook', (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Valid webhook URL required' });
  }
  webhookURL = url;
  res.json({ success: true, webhook: webhookURL });
});

// === Start it all ===
loadAddresses();
connect();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 API server running at http://localhost:${PORT}`);
});


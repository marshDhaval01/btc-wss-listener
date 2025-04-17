
const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const redis = require('./redisClient'); // Make sure path is correct

const app = express();
const PORT = 3333;
const WSS_URL = 'wss://btc.nownodes.io/wss/7ead0e54-21ba-4090-a799-9fd6e47c69e2';

let retryAttempts = 0;
const maxRetries = 3;
let ws = null;
let pingInterval = null;
let webhookURL = null;
let subscribedAddresses = new Set();

// === Redis Helpers ===
async function loadSubscribedAddresses() {
  const addresses = await redis.smembers('subscribedAddresses');
  subscribedAddresses = new Set(addresses);
  console.log('📂 Loaded subscribed addresses from Redis:', [...subscribedAddresses]);
}

async function addSubscribedAddresses(addresses) {
  await redis.sadd('subscribedAddresses', ...addresses);
  addresses.forEach(addr => subscribedAddresses.add(addr));
}

async function removeSubscribedAddresses(addresses) {
  await redis.srem('subscribedAddresses', ...addresses);
  addresses.forEach(addr => subscribedAddresses.delete(addr));
}

async function logTransaction(address, tx) {
  const log = `[${new Date().toISOString()}] TX to ${address} - ${tx.txid} - ${tx.value} sats`;
  await redis.lpush('transactionLogs', log);
  await redis.ltrim('transactionLogs', 0, 99); // keep last 100
  console.log('📬 TX logged:', log);
}

async function loadWebhookURL() {
  webhookURL = await redis.get('webhookURL');
  if (webhookURL) console.log('🔗 Loaded webhook URL from Redis');
}

async function saveWebhookURL(url) {
  await redis.set('webhookURL', url);
  webhookURL = url;
}

// === WebSocket Connection ===
function connect() {
  console.log(`📡 Connecting to WebSocket: ${WSS_URL}`);

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
    }, 30000);
  });

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg?.data?.tx) {
        const { tx, address } = msg.data;
        if (subscribedAddresses.has(address)) {
          await logTransaction(address, tx);

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

app.post('/subscribe', async (req, res) => {
  const { addresses } = req.body;
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return res.status(400).json({ error: 'addresses must be a non-empty array' });
  }

  const newSubs = addresses.filter(addr => !subscribedAddresses.has(addr));
  if (newSubs.length > 0) {
    await addSubscribedAddresses(newSubs);

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        id: `sub-${Date.now()}`,
        method: 'subscribeAddresses',
        params: { addresses: newSubs }
      }));
      console.log('✅ Subscribed to:', newSubs);
    }
  }

  res.json({ success: true, added: newSubs, watching: [...subscribedAddresses] });
});

app.post('/unsubscribe', async (req, res) => {
  const { addresses } = req.body;
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return res.status(400).json({ error: 'addresses must be a non-empty array' });
  }

  const toRemove = addresses.filter(addr => subscribedAddresses.has(addr));
  if (toRemove.length > 0) {
    await removeSubscribedAddresses(toRemove);
    console.log('❎ Unsubscribed:', toRemove);
  }

  res.json({ success: true, removed: toRemove, watching: [...subscribedAddresses] });
});

app.get('/logs', async (req, res) => {
  const logs = await redis.lrange('transactionLogs', 0, 49);
  res.json({ logs });
});

app.post('/webhook', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Valid webhook URL required' });
  }
  await saveWebhookURL(url);
  res.json({ success: true, webhook: webhookURL });
});

// === Startup ===
(async () => {
  await loadSubscribedAddresses();
  await loadWebhookURL();
  connect();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 API server running at http://localhost:${PORT}`);
  });
})();

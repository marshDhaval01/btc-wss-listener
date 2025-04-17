const BTCNode = require('./nodes/BTCNode');
const DogeCoinNode = require('./nodes/DogeCoinNode');
const ADANode = require('./nodes/ADANode');
const WebhookService = require('./services/WebhookService');


const btcNode = new BTCNode();
const dogeCoinNode = new DogeCoinNode();
// const adaNode = new ADANode();
const webhookService = new WebhookService(); // Add this line

// Initialize nodes or any other startup logic
console.log("WebSocket nodes initialized.");
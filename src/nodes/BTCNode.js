const WebSocketManager = require('../../src/services/WebSocketManager');
const config = require('../../config');

class BTCNode {
    constructor() {
        this.wsManager = new WebSocketManager();
        this.connect();
    }

    connect() {
        this.wsManager.connect(config.BTC_WS_URL);
    }

    // Additional methods for handling BTC-specific logic can be added here
}

module.exports = BTCNode;
const WebSocketManager = require('../../src/services/WebSocketManager');
const config = require('../../config');

class DogeCoinNode {
    constructor() {
        this.wsManager = new WebSocketManager();
        this.connect();
    }

    connect() {
        this.wsManager.connect(config.DOGE_WS_URL);
    }

    // Additional methods for handling Dogecoin-specific logic can be added here
}

module.exports = DogeCoinNode;
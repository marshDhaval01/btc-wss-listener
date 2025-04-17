const WebSocketManager = require('../../src/services/WebSocketManager');
const config = require('../../config');

class ADANode {
    constructor() {
        this.wsManager = new WebSocketManager();
        this.connect();
    }

    connect() {
        this.wsManager.connect(config.ADA_WS_URL);
    }

    // Additional methods for handling ADA-specific logic can be added here
}

module.exports = ADANode;
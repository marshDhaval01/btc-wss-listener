const WebSocketManager = require('../src/services/WebSocketManager');

describe('WebSocketManager', () => {
  it('should create an instance', () => {
    const wsManager = new WebSocketManager();
    expect(wsManager).toBeDefined();
  });
});

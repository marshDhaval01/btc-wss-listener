const BTCNode = require('../src/nodes/BTCNode');

describe('BTCNode', () => {
    it('should connect to the BTC WebSocket', () => {
        const btcNode = new BTCNode();
        // Add assertions to test connection
        expect(btcNode).toBeDefined();
    });
});
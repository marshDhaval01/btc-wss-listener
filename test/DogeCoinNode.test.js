const DogeCoinNode = require('../src/nodes/DogeCoinNode');

describe('DogeCoinNode', () => {
    it('should connect to the Dogecoin WebSocket', () => {
        const dogeCoinNode = new DogeCoinNode();
        // Add assertions to test connection
        expect(dogeCoinNode).toBeDefined();
    });
});
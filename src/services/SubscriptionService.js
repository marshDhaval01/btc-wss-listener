class SubscriptionService {
    constructor() {
        this.subscriptions = {};
    }

    subscribe(token) {
        // Logic to subscribe to a token
        this.subscriptions[token] = true;
        console.log(`Subscribed to token: ${token}`);
    }

    unsubscribe(token) {
        // Logic to unsubscribe from a token
        delete this.subscriptions[token];
        console.log(`Unsubscribed from token: ${token}`);
    }

    // Additional methods for managing subscriptions can be added here
}

module.exports = SubscriptionService;
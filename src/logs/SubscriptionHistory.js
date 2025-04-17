class SubscriptionHistory {
    constructor() {
        this.history = [];
    }

    addHistory(entry) {
        this.history.push(entry);
        console.log('Subscription history updated:', entry);
    }

    getHistory() {
        return this.history;
    }
}

module.exports = SubscriptionHistory;
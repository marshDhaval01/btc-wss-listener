class TransactionLog {
    constructor() {
        this.logs = [];
    }

    addLog(transaction) {
        this.logs.push(transaction);
        console.log('Transaction logged:', transaction);
    }

    getLogs() {
        return this.logs;
    }
}

module.exports = TransactionLog;
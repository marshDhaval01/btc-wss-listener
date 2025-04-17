const express = require('express');

class WebhookService {
    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.post('/webhook', this.handleWebhook.bind(this));
        this.app.listen(3000, () => {
            console.log('Webhook service listening on port 3000');
        });
    }

    handleWebhook(req, res) {
        console.log('Webhook received:', req.body);
        // Process the webhook data
        res.status(200).send('Webhook received');
    }
}

module.exports = WebhookService;
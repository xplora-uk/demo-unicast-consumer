"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newMessageConsumer = void 0;
const rabbitmq_1 = require("./rabbitmq");
function newMessageConsumer(settings) {
    if (settings.kind === 'rabbitmq') {
        return (0, rabbitmq_1.newRabbitMqMessageConsumer)(settings.conf);
    }
    throw new Error('Unknown message consumer kind');
}
exports.newMessageConsumer = newMessageConsumer;

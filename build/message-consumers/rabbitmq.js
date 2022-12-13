"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newRabbitMqMessageConsumer = void 0;
const amqp_connection_manager_1 = __importDefault(require("amqp-connection-manager"));
function newRabbitMqMessageConsumer(settings) {
    class RabbitMqMessageConsumer {
        constructor(_connection) {
            this._connection = _connection;
        }
        startConsuming(input) {
            return __awaiter(this, void 0, void 0, function* () {
                const func = 'RabbitMqMessageConsumer.startConsuming';
                let success = false, error = '';
                const channelWrapper = connection.createChannel();
                try {
                    yield channelWrapper.assertQueue(input.queue, { durable: false });
                    yield channelWrapper.consume(input.queue, (message) => __awaiter(this, void 0, void 0, function* () {
                        const funcLambda = 'RabbitMqMessageConsumer.startConsuming.lambda-consume';
                        try {
                            const payload = message.content.toString('utf-8');
                            const output = yield input.consume({ payload });
                            console.info(funcLambda, { queue: input.queue, message, output });
                            yield channelWrapper.ack(message);
                        }
                        catch (err) {
                            console.error(funcLambda, err);
                        }
                    }));
                    success = true;
                }
                catch (err) {
                    error = err instanceof Error ? err.message : 'Unknown error';
                    console.error(func, err);
                }
                finally {
                    channelWrapper.close().catch(() => { });
                }
                return { success, error };
            });
        }
    }
    const connection = amqp_connection_manager_1.default.connect(Object.assign(Object.assign({}, settings), { connectionOptions: {
            timeout: 5000,
        } }));
    return Promise.resolve(new RabbitMqMessageConsumer(connection));
}
exports.newRabbitMqMessageConsumer = newRabbitMqMessageConsumer;

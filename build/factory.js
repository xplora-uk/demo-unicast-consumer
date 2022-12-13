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
exports.factory = void 0;
const express_1 = __importDefault(require("express"));
const message_consumers_1 = require("./message-consumers");
function factory(penv = process.env) {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        const msgConsumer = yield (0, message_consumers_1.newMessageConsumer)({
            kind: penv.MC_KIND || 'rabbitmq',
            conf: {
                hostname: penv.MC_HOSTNAME || 'localhost',
                port: Number.parseInt(penv.MC_PORT || '0'),
                username: penv.MC_USERNAME || '',
                password: penv.MC_PASSWORD || '',
                heartbeat: 30,
            },
        });
        const queue = String(penv.MC_QUEUE || '');
        const output = yield msgConsumer.startConsuming({
            queue,
            consume: (input) => __awaiter(this, void 0, void 0, function* () {
                console.log(input.payload);
                return { success: true, error: '' };
            }),
        });
        console.info('message-consumer ready', output);
        app.get('/health', (_req, res) => __awaiter(this, void 0, void 0, function* () {
            res.json({ status: 'OK', ts: new Date() });
        }));
        return { app, msgConsumer };
    });
}
exports.factory = factory;

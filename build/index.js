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
Object.defineProperty(exports, "__esModule", { value: true });
const factory_1 = require("./factory");
main();
function main(penv = process.env) {
    return __awaiter(this, void 0, void 0, function* () {
        const port = Number.parseInt(penv.MC_HTTP_PORT || '9000');
        const { app } = yield (0, factory_1.factory)(penv);
        app.listen(port, () => {
            console.info('message-consumer is listening at', port);
        });
    });
}

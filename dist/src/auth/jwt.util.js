"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sign = sign;
const crypto_1 = require("crypto");
function sign(payload, secret) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = (0, crypto_1.createHmac)('sha256', secret).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}
//# sourceMappingURL=jwt.util.js.map
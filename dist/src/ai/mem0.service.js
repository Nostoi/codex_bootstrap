"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mem0Service = void 0;
const common_1 = require("@nestjs/common");
let Mem0Service = class Mem0Service {
    async storeInteraction(text) {
        await fetch(`${process.env.MEM0_URL}/store`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.MEM0_API_KEY}`,
            },
            body: JSON.stringify({ text }),
        });
    }
    async search(query) {
        const res = await fetch(`${process.env.MEM0_URL}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.MEM0_API_KEY}`,
            },
            body: JSON.stringify({ query }),
        });
        const data = await res.json();
        return data.results || [];
    }
};
exports.Mem0Service = Mem0Service;
exports.Mem0Service = Mem0Service = __decorate([
    (0, common_1.Injectable)()
], Mem0Service);
//# sourceMappingURL=mem0.service.js.map
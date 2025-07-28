"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const mem0_service_1 = require("./mem0.service");
let AiService = class AiService {
    constructor(mem0) {
        this.mem0 = mem0;
    }
    async generateTasks(prompt) {
        const context = await this.mem0.search(prompt);
        const res = await this.request(`${context.join("\n")}\n${prompt}`);
        await this.mem0.storeInteraction(prompt);
        const content = res || "";
        return content
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
    }
    async getSuggestions(context) {
        const history = await this.mem0.search(context);
        const prompt = `Based on the following interaction history:\n${history.join("\n")}\nSuggest next tasks for: ${context}`;
        const res = await this.request(prompt);
        await this.mem0.storeInteraction(context);
        return res
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
    }
    async summarize(text) {
        await this.mem0.storeInteraction(text);
        return this.request(`Summarize the following text:\n${text}`);
    }
    async request(prompt) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
            }),
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? "";
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mem0_service_1.Mem0Service])
], AiService);
//# sourceMappingURL=ai.service.js.map
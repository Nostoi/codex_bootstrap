"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mem0_service_1 = require("./mem0.service");
describe("Mem0Service", () => {
    let service;
    let mockFetch;
    beforeEach(() => {
        mockFetch = jest
            .fn()
            .mockResolvedValue({ json: () => Promise.resolve({ results: ["a"] }) });
        global.fetch = mockFetch;
        service = new mem0_service_1.Mem0Service();
    });
    it("stores interaction", async () => {
        mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve({}) });
        await service.storeInteraction("hello");
        expect(mockFetch).toHaveBeenCalled();
    });
    it("searches memory", async () => {
        const res = await service.search("query");
        expect(res).toEqual(["a"]);
    });
});
//# sourceMappingURL=mem0.service.spec.js.map
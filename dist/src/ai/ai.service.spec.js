"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ai_service_1 = require("./ai.service");
describe('AiService', () => {
    let service;
    let mockFetch;
    let mem0;
    beforeEach(() => {
        mockFetch = jest.fn().mockResolvedValue({
            json: () => Promise.resolve({ choices: [{ message: { content: 'resp' } }] }),
        });
        global.fetch = mockFetch;
        mem0 = {
            storeInteraction: jest.fn().mockResolvedValue(undefined),
            search: jest.fn().mockResolvedValue([]),
        };
        service = new ai_service_1.AiService(mem0);
    });
    it('generates tasks', async () => {
        mockFetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ choices: [{ message: { content: 'a\nb' } }] }),
        });
        const result = await service.generateTasks('todo');
        expect(result).toEqual(['a', 'b']);
        expect(mem0.search).toHaveBeenCalledWith('todo');
        expect(mem0.storeInteraction).toHaveBeenCalledWith('todo');
    });
    it('summarizes text', async () => {
        mockFetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ choices: [{ message: { content: 'sum' } }] }),
        });
        const result = await service.summarize('text');
        expect(result).toBe('sum');
        expect(mem0.storeInteraction).toHaveBeenCalledWith('text');
    });
    it('suggests next tasks', async () => {
        mockFetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ choices: [{ message: { content: 's1\ns2' } }] }),
        });
        const result = await service.getSuggestions('context');
        expect(result).toEqual(['s1', 's2']);
        expect(mem0.search).toHaveBeenCalledWith('context');
        expect(mem0.storeInteraction).toHaveBeenCalledWith('context');
    });
});
//# sourceMappingURL=ai.service.spec.js.map
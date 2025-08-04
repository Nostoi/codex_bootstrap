import { Mem0Service } from './mem0.service';

describe('Mem0Service', () => {
  let service: Mem0Service;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve({ results: ['a'] }) });
    global.fetch = mockFetch as any;
    service = new Mem0Service();
  });

  it('stores interaction', async () => {
    mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve({}) });
    await service.storeInteraction('hello');
    expect(mockFetch).toHaveBeenCalled();
  });

  it('searches memory', async () => {
    const res = await service.search('query');
    expect(res).toEqual(['a']);
  });
});

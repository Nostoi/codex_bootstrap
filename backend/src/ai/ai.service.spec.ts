import { AiService } from './ai.service'
import { Mem0Service } from './mem0.service'

describe('AiService', () => {
  let service: AiService
  let mockFetch: jest.Mock
  let mem0: Mem0Service

  beforeEach(() => {
    mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ choices: [{ message: { content: 'resp' } }] }),
    })
    global.fetch = mockFetch as any
    mem0 = {
      storeInteraction: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue([]),
    } as any
    service = new AiService(mem0)
  })

  it('generates tasks', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ choices: [{ message: { content: 'a\nb' } }] }),
    })
    const result = await service.generateTasks('todo')
    expect(result).toEqual(['a', 'b'])
    expect(mem0.search).toHaveBeenCalledWith('todo')
    expect(mem0.storeInteraction).toHaveBeenCalledWith('todo')
  })

  it('summarizes text', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ choices: [{ message: { content: 'sum' } }] }),
    })
    const result = await service.summarize('text')
    expect(result).toBe('sum')
    expect(mem0.storeInteraction).toHaveBeenCalledWith('text')
  })
})

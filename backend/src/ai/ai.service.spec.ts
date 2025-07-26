import { AiService } from './ai.service'

describe('AiService', () => {
  let service: AiService
  let mockFetch: jest.Mock

  beforeEach(() => {
    mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ choices: [{ message: { content: 'resp' } }] }),
    })
    global.fetch = mockFetch as any
    service = new AiService()
  })

  it('generates tasks', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ choices: [{ message: { content: 'a\nb' } }] }),
    })
    const result = await service.generateTasks('todo')
    expect(result).toEqual(['a', 'b'])
  })

  it('summarizes text', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ choices: [{ message: { content: 'sum' } }] }),
    })
    const result = await service.summarize('text')
    expect(result).toBe('sum')
  })
})

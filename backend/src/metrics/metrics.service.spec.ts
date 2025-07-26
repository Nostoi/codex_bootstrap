import { MetricsService } from './metrics.service'

describe('MetricsService', () => {
  it('records and counts actions', () => {
    const service = new MetricsService()
    service.record('u1', 'login')
    service.record('u2', 'login')
    expect(service.countByAction('login')).toBe(2)
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { TasksService } from './tasks.service'

describe('TasksService', () => {
  let service: TasksService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService],
    }).compile()

    service = module.get<TasksService>(TasksService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('toggles task completion', () => {
    const task = service.toggle(1)
    expect(task?.completed).toBe(true)
  })
})

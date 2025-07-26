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

  it('returns tasks with due dates', () => {
    const tasks = service.findAll()
    expect(tasks[0].dueDate).toMatch(/\d{4}-\d{2}-\d{2}/)
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

describe('UsersController', () => {
  let controller: UsersController
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile()

    controller = module.get<UsersController>(UsersController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('delegates create', () => {
    controller.create({} as any)
    expect(service.create).toHaveBeenCalled()
  })

  it('delegates findAll', () => {
    controller.findAll()
    expect(service.findAll).toHaveBeenCalled()
  })

  it('delegates findOne', () => {
    controller.findOne('1')
    expect(service.findOne).toHaveBeenCalledWith('1')
  })

  it('delegates update', () => {
    controller.update('1', {} as any)
    expect(service.update).toHaveBeenCalledWith('1', {})
  })

  it('delegates remove', () => {
    controller.remove('1')
    expect(service.remove).toHaveBeenCalledWith('1')
  })
})

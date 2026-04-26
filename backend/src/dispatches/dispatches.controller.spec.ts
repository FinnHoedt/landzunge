import { Test, TestingModule } from '@nestjs/testing'
import { DispatchesController } from './dispatches.controller'
import { DispatchesService } from './dispatches.service'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import { AdminGuard } from '../auth/admin.guard'

const mockService = {
  getPublished: jest.fn(),
  getBySlug: jest.fn(),
  getAllAdmin: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

describe('DispatchesController', () => {
  let controller: DispatchesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DispatchesController],
      providers: [{ provide: DispatchesService, useValue: mockService }],
    })
      .overrideGuard(SupabaseAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard).useValue({ canActivate: () => true })
      .compile()

    controller = module.get(DispatchesController)
  })

  it('GET /api/dispatches calls getPublished', async () => {
    mockService.getPublished.mockResolvedValue([])
    await controller.getPublished()
    expect(mockService.getPublished).toHaveBeenCalled()
  })

  it('GET /api/dispatches/:slug calls getBySlug', async () => {
    mockService.getBySlug.mockResolvedValue({ slug: 'test' })
    await controller.getBySlug('test')
    expect(mockService.getBySlug).toHaveBeenCalledWith('test')
  })

  it('POST /api/dispatches calls create', async () => {
    mockService.create.mockResolvedValue({ id: '1' })
    await controller.create({ title: 'T', body: '<p>B</p>' })
    expect(mockService.create).toHaveBeenCalledWith({ title: 'T', body: '<p>B</p>' })
  })
})

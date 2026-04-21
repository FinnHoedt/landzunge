import { Test, TestingModule } from '@nestjs/testing'
import { GuestbookController } from './guestbook.controller'
import { GuestbookService } from './guestbook.service'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import { AdminGuard } from '../auth/admin.guard'

const mockService = {
  getEntries: jest.fn(),
  createEntry: jest.fn(),
  approveImage: jest.fn(),
  deleteEntry: jest.fn(),
}

describe('GuestbookController', () => {
  let controller: GuestbookController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestbookController],
      providers: [{ provide: GuestbookService, useValue: mockService }],
    })
      .overrideGuard(SupabaseAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard).useValue({ canActivate: () => true })
      .compile()

    controller = module.get(GuestbookController)
  })

  it('GET /api/guestbook calls getEntries with page=1 by default', async () => {
    mockService.getEntries.mockResolvedValue([])
    await controller.getEntries(1)
    expect(mockService.getEntries).toHaveBeenCalledWith(1, 20)
  })

  it('PATCH /api/guestbook/:id/approve-image calls approveImage', async () => {
    mockService.approveImage.mockResolvedValue(undefined)
    await controller.approveImage('some-id')
    expect(mockService.approveImage).toHaveBeenCalledWith('some-id')
  })

  it('DELETE /api/guestbook/:id calls deleteEntry', async () => {
    mockService.deleteEntry.mockResolvedValue(undefined)
    await controller.deleteEntry('some-id')
    expect(mockService.deleteEntry).toHaveBeenCalledWith('some-id')
  })
})

import { BadRequestException } from '@nestjs/common'
import { UsersController } from './users.controller'

const mockService = {
  list: jest.fn(),
  add: jest.fn(),
  updateRole: jest.fn(),
  remove: jest.fn(),
}

const makeReq = (userId = 'caller-id') => ({ user: { id: userId } })

describe('UsersController', () => {
  const controller = new UsersController(mockService as any)

  beforeEach(() => jest.clearAllMocks())

  it('list delegates to service', async () => {
    mockService.list.mockResolvedValue([])
    expect(await controller.list()).toEqual([])
  })

  it('add delegates to service', async () => {
    mockService.add.mockResolvedValue({ id: 'uid-1', email: 'a@b.com', role: 'admin' })
    const result = await controller.add({ email: 'a@b.com', role: 'admin' } as any)
    expect(mockService.add).toHaveBeenCalledWith('a@b.com', 'admin')
    expect(result).toMatchObject({ email: 'a@b.com' })
  })

  it('remove throws BadRequestException when removing self', async () => {
    await expect(controller.remove('caller-id', makeReq('caller-id') as any))
      .rejects.toThrow(BadRequestException)
  })

  it('remove delegates to service for other users', async () => {
    mockService.remove.mockResolvedValue(undefined)
    await controller.remove('other-id', makeReq('caller-id') as any)
    expect(mockService.remove).toHaveBeenCalledWith('other-id')
  })
})

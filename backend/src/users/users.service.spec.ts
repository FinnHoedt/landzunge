import { BadRequestException, NotFoundException } from '@nestjs/common'
import { UsersService } from './users.service'

describe('UsersService', () => {
  describe('list', () => {
    it('returns mapped users with emails', async () => {
      const mockSupabase = {
        client: {
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{ user_id: 'uid-1', roles: { name: 'admin' } }],
              error: null,
            }),
          }),
          auth: {
            admin: {
              listUsers: jest.fn().mockResolvedValue({
                data: { users: [{ id: 'uid-1', email: 'user@test.com' }] },
                error: null,
              }),
            },
          },
        },
      }
      const service = new UsersService(mockSupabase as any)
      const result = await service.list()
      expect(result).toEqual([{ id: 'uid-1', role: 'admin', email: 'user@test.com' }])
    })
  })

  describe('add', () => {
    it('throws NotFoundException when email not in auth users', async () => {
      const mockSupabase = {
        client: {
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'role-1' }, error: null }),
              }),
            }),
          }),
          auth: {
            admin: {
              listUsers: jest.fn().mockResolvedValue({ data: { users: [] }, error: null }),
            },
          },
        },
      }
      const service = new UsersService(mockSupabase as any)
      await expect(service.add('missing@test.com', 'admin')).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('calls delete on user_roles with the given userId', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: null })
      const mockSupabase = {
        client: {
          from: jest.fn().mockReturnValue({
            delete: jest.fn().mockReturnValue({ eq: eqMock }),
          }),
        },
      }
      const service = new UsersService(mockSupabase as any)
      await service.remove('uid-1')
      expect(eqMock).toHaveBeenCalledWith('user_id', 'uid-1')
    })
  })

  describe('updateRole', () => {
    it('throws BadRequestException when role not found', async () => {
      const mockSupabase = {
        client: {
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
              }),
            }),
          }),
        },
      }
      const service = new UsersService(mockSupabase as any)
      await expect(service.updateRole('uid-1', 'nonexistent')).rejects.toThrow(BadRequestException)
    })
  })
})

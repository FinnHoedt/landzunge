import { BadRequestException, ConflictException } from '@nestjs/common'
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
    it('creates a new auth user and returns a generated password when the email has no account', async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null })
      const createUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'new-uid', email: 'new@test.com' } },
        error: null,
      })
      const mockSupabase = {
        client: {
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'role-1' }, error: null }),
              }),
            }),
            insert: insertMock,
          }),
          auth: {
            admin: {
              listUsers: jest.fn().mockResolvedValue({ data: { users: [] }, error: null }),
              createUser,
            },
          },
        },
      }
      const service = new UsersService(mockSupabase as any)
      const result = await service.add('new@test.com', 'admin')

      expect(createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@test.com', email_confirm: true }),
      )
      expect(insertMock).toHaveBeenCalledWith({ user_id: 'new-uid', role_id: 'role-1' })
      expect(result).toMatchObject({ id: 'new-uid', email: 'new@test.com', role: 'admin' })
      expect(result.password).toEqual(expect.any(String))
    })

    it('throws ConflictException when user already has a role', async () => {
      const mockSupabase = {
        client: {
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'role-1' }, error: null }),
                maybeSingle: jest.fn().mockResolvedValue({ data: { user_id: 'uid-1' }, error: null }),
              }),
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
      await expect(service.add('user@test.com', 'admin')).rejects.toThrow(ConflictException)
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

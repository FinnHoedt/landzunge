import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { createClient } from '@supabase/supabase-js'
import { AuthService } from './auth.service'

jest.mock('@supabase/supabase-js')
const mockCreateClient = createClient as jest.Mock

function mockSupabaseAuth(session: any = null, error: any = null) {
  mockCreateClient.mockReturnValue({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: {
          session,
          user: session ? { id: 'user-1', email: 'admin@test.com' } : null,
        },
        error,
      }),
    },
  })
}

const makeMockSupabase = (
  roleData: { roles: { name: string } } | null = { roles: { name: 'admin' } },
  roleError: any = null,
) => ({
  client: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: roleData, error: roleError }),
        }),
      }),
    }),
  },
})

describe('AuthService', () => {
  describe('login', () => {
    it('returns token and role on valid credentials', async () => {
      const session = { access_token: 'tok', expires_at: 9999 }
      mockSupabaseAuth(session)
      const service = new AuthService(makeMockSupabase() as any)
      const result = await service.login('admin@test.com', 'pass')
      expect(result.access_token).toBe('tok')
      expect(result.user.email).toBe('admin@test.com')
      expect(result.user.role).toBe('admin')
    })

    it('throws UnauthorizedException on invalid Supabase credentials', async () => {
      mockSupabaseAuth(null, new Error('Invalid'))
      const service = new AuthService(makeMockSupabase() as any)
      await expect(service.login('bad@test.com', 'wrong')).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when user has no user_roles row', async () => {
      const session = { access_token: 'tok', expires_at: 9999 }
      mockSupabaseAuth(session)
      const service = new AuthService(makeMockSupabase(null) as any)
      await expect(service.login('notadmin@test.com', 'pass')).rejects.toThrow(UnauthorizedException)
    })

    it('throws InternalServerErrorException when the role lookup errors', async () => {
      const session = { access_token: 'tok', expires_at: 9999 }
      mockSupabaseAuth(session)
      const service = new AuthService(makeMockSupabase(null, { message: 'db down' }) as any)
      await expect(service.login('admin@test.com', 'pass')).rejects.toThrow(InternalServerErrorException)
    })
  })
})

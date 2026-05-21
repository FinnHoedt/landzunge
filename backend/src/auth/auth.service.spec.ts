import { UnauthorizedException } from '@nestjs/common'
import { createClient } from '@supabase/supabase-js'
import { AuthService } from './auth.service'

jest.mock('@supabase/supabase-js')
const mockCreateClient = createClient as jest.Mock

function mockSupabaseAuth(session: any = null, error: any = null) {
  mockCreateClient.mockReturnValue({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { session, user: session ? { email: 'admin@test.com' } : null },
        error,
      }),
    },
  })
}

describe('AuthService', () => {
  describe('login', () => {
    it('returns token on valid credentials', async () => {
      const session = { access_token: 'tok', expires_at: 9999 }
      mockSupabaseAuth(session)
      const service = new AuthService(null as any)
      const result = await service.login('admin@test.com', 'pass')
      expect(result.access_token).toBe('tok')
      expect(result.user.email).toBe('admin@test.com')
    })

    it('throws UnauthorizedException on invalid credentials', async () => {
      mockSupabaseAuth(null, new Error('Invalid'))
      const service = new AuthService(null as any)
      await expect(service.login('bad@test.com', 'wrong')).rejects.toThrow(UnauthorizedException)
    })
  })
})
